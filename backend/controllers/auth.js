const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user-model");
const ErrorHandler = require("../middleware/errorHandlers");
const { catchAsyncError } = require("../middleware/catchAsyncError");
const logger = require("../utils/logger");
const { getFullContext } = require("../utils/requestContext");

const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const rpName = process.env.RP_NAME || "Manage My Truck";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.ORIGIN || "http://localhost:3000";

module.exports.signUpWithGoogle = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  logger.info("Google Sign-In attempt", getFullContext(req, { hasToken: !!token }));

  try {
    let payload;
    if (token && token.split('.').length === 3) {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      logger.info("Google ID token verified successfully");
    } else {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);

      if (!response.ok) {
        logger.error("Failed to fetch Google user info", { status: response.status, statusText: response.statusText });
        throw new Error(`Failed to fetch user info: ${response.statusText}`);
      }

      payload = await response.json();
      payload.sub = payload.id;
      logger.info("Google access token verified successfully");
    }

    const userId = payload.sub;
    const email = payload.email;
    const picture = payload.picture;
    const name = payload.name || "User";

    let user = await User.findOne({ googleId: userId });

    const isSubscribed = user ? user.isSubscribed : false;
    const isAdmin = user ? user.isAdmin : false;

    if (!user) {
      user = new User({
        googleId: userId,
        email,
        name,
        isSubscribed,
        isAdmin,
        createdAt: new Date(),
      });
      await user.save();
      logger.info("New user created", { userId, email, name });
    } else {
      logger.info("Existing user logged in", { userId, email });
    }

    const jwtToken = jwt.sign(
      {
        userId,
        name,
        email,
        picture,
        isSubscribed,
        isAdmin
      },
      process.env.SECRETKEY,
      { expiresIn: "7d" }
    );

    logger.info("JWT token generated for user", { userId, email });

    res.status(200).json({
      user: { userId, email, picture, name, isSubscribed, isAdmin },
      token: jwtToken,
    });
  } catch (error) {
    logger.error("Google authentication failed", { error: error.message, stack: error.stack });

    if (error.message.includes('Wrong number of segments')) {
      res.status(400).json({
        error: "Invalid token format. Expected ID token or valid access token."
      });
    } else if (error.message.includes('Failed to fetch user info')) {
      res.status(401).json({
        error: "Invalid or expired access token."
      });
    } else {
      res.status(401).json({
        error: "Token verification failed.",
        details: error.message
      });
    }
  }
};

module.exports.whoami = catchAsyncError(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    logger.warn("Whoami request without token");
    return next(new ErrorHandler("Token not found", 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY);
    logger.info("User identity verified", { userId: decoded.userId, email: decoded.email });

    res.status(200).json({
      message: "User verified",
      user: decoded,
    });
  } catch (error) {
    logger.error("Token verification failed in whoami", { error: error.message });
    res.status(401).json({
      message: "Token expired or invalid",
    });
  }
});

module.exports.logIn = catchAsyncError(async (req, res, next) => {
  const { username, password } = req.body;
  logger.info("Login attempt", getFullContext(req, { username }));

  if (!username || !password) {
    logger.warn("Login failed: Missing credentials", getFullContext(req, { username }));
    return next(new ErrorHandler("username or password not passed", 400));
  }

  const user = await User.findOne({
    email: username,
  });

  if (!user) {
    logger.warn("Login failed: User not found", getFullContext(req, { username }));
    return next(new ErrorHandler("Invalid credentials or user not found", 401));
  }

  if (!user.password) {
    logger.warn("Login failed: No password set for user", getFullContext(req, { username }));
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    logger.warn("Login failed: Invalid password", getFullContext(req, { username }));
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const token = jwt.sign(
    {
      username: username,
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    process.env.SECRETKEY,
    {
      expiresIn: "14h",
    }
  );

  logger.info("User logged in successfully", getFullContext(req, { username, userId: user._id }));

  res.json({
    code: 200,
    message: "Login successful",
    token: token,
  });
});

module.exports.signUp = async (req, res, next) => {
  const { username, password, name } = req.body;
  logger.info("Sign up attempt", getFullContext(req, { username, name }));

  if (!username || !password || !name) {
    logger.warn("Sign up failed: Missing required fields", getFullContext(req, { username, name }));
    return next(
      new ErrorHandler("username or password not passed or not validated", 400)
    );
  }

  const user = await User.findOne({
    email: username,
  });

  if (user) {
    logger.warn("Sign up failed: Email already exists", getFullContext(req, { username }));
    return res
      .status(409)
      .json({ message: "Email already exists", code: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a unique googleId for email/password users using email hash
  const googleId = 'email_' + crypto.createHash('sha256').update(username).digest('hex').substring(0, 20);

  const newUser = new User({
    googleId: googleId,
    email: username,
    password: hashedPassword,
    name: name,
    createdAt: new Date(),
  });

  const result = await newUser.save();

  if (result !== null) {
    logger.info("User created successfully", getFullContext(req, { username, userId: result._id }));
    res.json({
      code: 200,
      message: "User created",
      data: result,
    });
  } else {
    logger.error("Failed to create user", getFullContext(req, { username }));
    return next(new ErrorHandler("Failed to create user", 500));
  }
};

module.exports.logOut = catchAsyncError(async (req, res, next) => {
  try {
    logger.info("User logged out", getFullContext(req, { username: req.username }));
  } catch (error) {
    logger.error("Logout error", getFullContext(req, { error: error.message }));
  }
});

module.exports.changePassword = catchAsyncError(async (req, res, next) => {
  const { username, password } = req.body;
  logger.info("Password change attempt", getFullContext(req, { username }));

  if (!username || !password) {
    logger.warn("Password change failed: Missing credentials", getFullContext(req, { username }));
    return next(new ErrorHandler("username or password not found", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.findOneAndUpdate(
    {
      username: username,
    },
    {
      password: hashedPassword,
    }
  );

  if (!user) {
    logger.error("Password change failed: User not found", getFullContext(req, { username }));
    return next(new ErrorHandler("user password not updated", 400));
  }

  logger.info("Password changed successfully", getFullContext(req, { username }));

  res.json({
    code: 200,
    status: "success",
    user: user,
  });
});

// Passkey Registration - Generate Options
module.exports.passkeyRegisterOptions = catchAsyncError(async (req, res, next) => {
  const { email, name } = req.body;
  logger.info("Passkey registration options request", getFullContext(req, { email, name }));

  if (!email || !name) {
    logger.warn("Passkey registration failed: Missing required fields", getFullContext(req, { email, name }));
    return next(new ErrorHandler("Email and name are required", 400));
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Generate a unique googleId for passkey users
      const googleId = 'passkey_' + crypto.createHash('sha256').update(email).digest('hex').substring(0, 20);

      // Create new user for passkey registration
      user = new User({
        googleId,
        email,
        name,
        isSubscribed: false,
        isAdmin: false,
        createdAt: new Date(),
      });
      await user.save();
      logger.info("New user created for passkey registration", { email, name });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: user._id.toString(),
      userName: email,
      userDisplayName: name,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store challenge for verification
    user.currentChallenge = options.challenge;
    await user.save();

    logger.info("Passkey registration options generated", { email, userId: user._id });
    res.status(200).json(options);
  } catch (error) {
    logger.error("Failed to generate passkey registration options", {
      error: error.message,
      stack: error.stack,
      email
    });
    return next(new ErrorHandler("Failed to generate registration options", 500));
  }
});

// Passkey Registration - Verify Response
module.exports.passkeyRegisterVerify = catchAsyncError(async (req, res, next) => {
  const { email, credential } = req.body;
  logger.info("Passkey registration verification attempt", getFullContext(req, { email }));

  if (!email || !credential) {
    logger.warn("Passkey verification failed: Missing required fields", getFullContext(req, { email }));
    return next(new ErrorHandler("Email and credential are required", 400));
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.currentChallenge) {
      logger.warn("Passkey verification failed: User not found or no challenge", getFullContext(req, { email }));
      return next(new ErrorHandler("Registration session not found", 400));
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      logger.warn("Passkey verification failed: Verification unsuccessful", getFullContext(req, { email }));
      return next(new ErrorHandler("Passkey verification failed", 400));
    }

    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    // Store passkey
    user.passkeys.push({
      credentialID: Buffer.from(credentialID),
      credentialPublicKey: Buffer.from(credentialPublicKey),
      counter,
      transports: credential.response.transports || [],
      createdAt: new Date(),
    });

    user.currentChallenge = undefined;
    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        isSubscribed: user.isSubscribed,
        isAdmin: user.isAdmin
      },
      process.env.SECRETKEY,
      { expiresIn: "7d" }
    );

    logger.info("Passkey registered successfully", { email, userId: user._id });

    res.status(200).json({
      verified: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        isSubscribed: user.isSubscribed,
        isAdmin: user.isAdmin
      },
      token: jwtToken,
    });
  } catch (error) {
    logger.error("Passkey registration verification failed", {
      error: error.message,
      stack: error.stack,
      email
    });
    return next(new ErrorHandler("Failed to verify passkey registration", 500));
  }
});

// Passkey Authentication - Generate Options
module.exports.passkeyAuthOptions = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  logger.info("Passkey authentication options request", getFullContext(req, { email }));

  if (!email) {
    logger.warn("Passkey auth failed: Missing email", getFullContext(req, { email }));
    return next(new ErrorHandler("Email is required", 400));
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.passkeys || user.passkeys.length === 0) {
      logger.warn("Passkey auth failed: No passkeys registered", getFullContext(req, { email }));
      return next(new ErrorHandler("No passkeys registered for this email", 404));
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map(passkey => ({
        id: passkey.credentialID,
        type: 'public-key',
        transports: passkey.transports,
      })),
      userVerification: "preferred",
    });

    // Store challenge for verification
    user.currentChallenge = options.challenge;
    await user.save();

    logger.info("Passkey authentication options generated", { email, userId: user._id });
    res.status(200).json(options);
  } catch (error) {
    logger.error("Failed to generate passkey authentication options", {
      error: error.message,
      stack: error.stack,
      email
    });
    return next(new ErrorHandler("Failed to generate authentication options", 500));
  }
});

// Passkey Authentication - Verify Response
module.exports.passkeyAuthVerify = catchAsyncError(async (req, res, next) => {
  const { email, credential } = req.body;
  logger.info("Passkey authentication verification attempt", getFullContext(req, { email }));

  if (!email || !credential) {
    logger.warn("Passkey auth verification failed: Missing required fields", getFullContext(req, { email }));
    return next(new ErrorHandler("Email and credential are required", 400));
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !user.currentChallenge) {
      logger.warn("Passkey auth verification failed: User not found or no challenge", getFullContext(req, { email }));
      return next(new ErrorHandler("Authentication session not found", 400));
    }

    // Find the passkey being used
    const passkey = user.passkeys.find(p =>
      p.credentialID.toString('base64') === Buffer.from(credential.rawId, 'base64').toString('base64')
    );

    if (!passkey) {
      logger.warn("Passkey auth verification failed: Passkey not found", getFullContext(req, { email }));
      return next(new ErrorHandler("Passkey not found", 404));
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: passkey.credentialID,
        credentialPublicKey: passkey.credentialPublicKey,
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      logger.warn("Passkey auth verification failed: Verification unsuccessful", getFullContext(req, { email }));
      return next(new ErrorHandler("Passkey authentication failed", 400));
    }

    // Update counter
    passkey.counter = verification.authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        isSubscribed: user.isSubscribed,
        isAdmin: user.isAdmin
      },
      process.env.SECRETKEY,
      { expiresIn: "7d" }
    );

    logger.info("Passkey authentication successful", { email, userId: user._id });

    res.status(200).json({
      verified: true,
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        isSubscribed: user.isSubscribed,
        isAdmin: user.isAdmin
      },
      token: jwtToken,
    });
  } catch (error) {
    logger.error("Passkey authentication verification failed", {
      error: error.message,
      stack: error.stack,
      email
    });
    return next(new ErrorHandler("Failed to verify passkey authentication", 500));
  }
});
