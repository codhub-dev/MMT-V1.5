const express = require("express");
const router = express.Router();
const {
  signUp,
  logIn,
  logOut,
  whoami,
  signUpWithGoogle,
  passkeyRegisterOptions,
  passkeyRegisterVerify,
  passkeyAuthOptions,
  passkeyAuthVerify
} = require("../controllers/auth");

router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/logout", logOut);
router.post("/whoami", whoami);
router.post("/signUpWithGoogle", signUpWithGoogle);

// Passkey routes
router.post("/passkey/register/options", passkeyRegisterOptions);
router.post("/passkey/register/verify", passkeyRegisterVerify);
router.post("/passkey/auth/options", passkeyAuthOptions);
router.post("/passkey/auth/verify", passkeyAuthVerify);

module.exports = router;
