module.exports = {
  logRegistration,
  logLogin,
  generateRandomUser,
  setAuthHeader
};

function logRegistration(requestParams, response, context, ee, next) {
  if (response.statusCode === 200 || response.statusCode === 201) {
    console.log(`✓ Registration successful for user: ${requestParams.json.username}`);
  } else {
    console.log(`✗ Registration failed: ${response.statusCode}`);
  }
  return next();
}

function logLogin(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    console.log(`✓ Login successful`);
  } else {
    console.log(`✗ Login failed: ${response.statusCode}`);
  }
  return next();
}

function generateRandomUser(context, events, done) {
  const randomString = Math.random().toString(36).substring(7);
  const timestamp = Date.now();
  
  context.vars.randomUsername = `testuser_${randomString}_${timestamp}`;
  context.vars.randomPassword = `Pass@${Math.floor(Math.random() * 10000)}${randomString}`;
  context.vars.randomEmail = `test_${randomString}_${timestamp}@example.com`;
  context.vars.randomName = `Test User ${randomString.toUpperCase()}`;
  
  return done();
}

function setAuthHeader(context, events, done) {
  if (context.vars.authToken) {
    context.vars.authorizationHeader = `Bearer ${context.vars.authToken}`;
  }
  return done();
}
