# Comprehensive Logging Implementation Guide

## Overview
This application now has a comprehensive centralized logging system using Papertrail with Winston. All controllers have been enhanced with detailed contextual logging to help with debugging, monitoring, and auditing.

## What Was Implemented

### 1. Request Context Utility (`/backend/utils/requestContext.js`)
A utility module that extracts comprehensive contextual information from HTTP requests:

- **User Context**: Username, user ID, email, admin status, addedBy field
- **System Context**: IP address, user agent, HTTP method, path, URL, protocol, host
- **Resource Context**: Resource IDs (truckId, userId, etc.), query parameters, body parameters
- **Sensitive Data Handling**: Automatically sanitizes passwords, tokens, and other sensitive fields

### 2. Request Logger Middleware (`/backend/middleware/requestLogger.js`)
Automatically logs all incoming HTTP requests with:
- Request method, path, and timing
- Response status codes
- Request duration
- User information (when authenticated)
- Error tracking for 4xx and 5xx responses

### 3. Enhanced Controller Logging
All controllers now have comprehensive logging at key points:

#### Controllers Updated:
- ✅ **auth.js** - Login, signup, Google auth, password changes
- ✅ **users.js** - User profile operations
- ✅ **truck.js** - Truck CRUD operations
- ✅ **fuelExpenses.js** - Fuel expense tracking
- ✅ **defExpenses.js** - DEF expense tracking
- ✅ **otherExpenses.js** - Other expense tracking
- ✅ **income.js** - Income tracking
- ✅ **calculateLoan.js** - Loan calculations
- ✅ **driverProfiles.js** - Driver profile management
- ✅ **alerts.js** - Alert management
- ✅ **admin.js** - Admin operations
- ✅ **totalExpenses.js** - Total expense aggregation
- ✅ **metadata.js** - Metadata operations

### 4. Logging Levels Used

#### INFO Level
- Successful operations (create, update, delete, fetch)
- User authentication success
- Request start and completion
- Application lifecycle events

```javascript
logger.info("Truck added successfully", getFullContext(req, {
  truckId: savedTruck._id,
  registrationNo: savedTruck.registrationNo
}));
```

#### WARN Level
- Failed validations (missing fields, invalid IDs)
- Resource not found
- Authentication/authorization failures
- Business rule violations

```javascript
logger.warn("Invalid truck ID provided", getFullContext(req, { truckId: id }));
```

#### ERROR Level
- Exception/error handling
- Database operation failures
- External API failures
- Unexpected errors

```javascript
logger.error("Failed to add truck", getFullContext(req, {
  error: error.message,
  stack: error.stack
}));
```

## Logging Context Examples

### Example 1: Adding a Fuel Expense
```javascript
logger.info("Adding fuel expense", getFullContext(req, {
  truckId,
  addedBy,
  cost,
  litres
}));
```

**Logged Information:**
```json
{
  "level": "info",
  "message": "Adding fuel expense",
  "timestamp": "2025-11-21T10:30:45.123Z",
  "username": "john_doe",
  "addedBy": "userId123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "method": "POST",
  "path": "/api/v1/app/fuelExpenses",
  "url": "/api/v1/app/fuelExpenses",
  "protocol": "https",
  "host": "myapp.com",
  "truckId": "truck456",
  "cost": 150.50,
  "litres": 50
}
```

### Example 2: User Authentication
```javascript
logger.info("User authenticated successfully", getFullContext(req, {
  username: decodedToken.username
}));
```

**Logged Information:**
```json
{
  "level": "info",
  "message": "User authenticated successfully",
  "timestamp": "2025-11-21T10:31:12.456Z",
  "username": "john_doe",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "method": "GET",
  "path": "/api/v1/app/users/profile",
  "url": "/api/v1/app/users/profile",
  "protocol": "https",
  "host": "myapp.com"
}
```

### Example 3: Error Logging
```javascript
logger.error("Failed to add income", getFullContext(req, {
  error: error.message,
  stack: error.stack
}));
```

**Logged Information:**
```json
{
  "level": "error",
  "message": "Failed to add income",
  "timestamp": "2025-11-21T10:32:30.789Z",
  "username": "john_doe",
  "addedBy": "userId123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "method": "POST",
  "path": "/api/v1/app/income",
  "truckId": "truck789",
  "amount": 5000,
  "error": "Database connection timeout",
  "stack": "Error: Database connection timeout\n  at ..."
}
```

## Benefits of Enhanced Logging

### 1. **Complete Request Tracing**
Every log entry includes:
- Who made the request (username, userId)
- From where (IP address, user agent)
- What they tried to do (method, path, resource IDs)
- When it happened (timestamp)
- What was the outcome (success/failure, duration)

### 2. **Easy Debugging**
- Trace user actions across multiple requests
- Identify performance bottlenecks (request duration)
- Find patterns in errors
- Correlate frontend issues with backend logs

### 3. **Security Auditing**
- Track authentication attempts (success and failures)
- Monitor unauthorized access attempts
- Identify suspicious activity patterns
- Audit admin operations

### 4. **Business Intelligence**
- User activity patterns
- Most used features
- Error frequency by endpoint
- Performance metrics

## Viewing Logs

### Papertrail Dashboard
1. Go to your Papertrail account
2. All logs are centralized in one place
3. Search examples:
   - `username:john_doe` - All actions by specific user
   - `error` - All errors
   - `truckId:truck123` - All operations for specific truck
   - `path:/api/v1/app/fuelExpenses` - All fuel expense operations
   - `statusCode:500` - All server errors

### Log Queries Examples

**Find all failed login attempts:**
```
level:warn "Login failed"
```

**Find all operations by a specific user:**
```
username:john_doe
```

**Find all errors related to a specific truck:**
```
level:error truckId:truck123
```

**Find slow requests (>1000ms):**
```
duration:>1000ms
```

**Find all DELETE operations:**
```
method:DELETE
```

## Configuration

### Enable/Disable Papertrail
Set environment variable in `.env`:
```bash
ENABLE_PAPERTRAIL=true
PAPERTRAIL_HTTPS_ENDPOINT=your_endpoint_here
PAPERTRAIL_TOKEN=your_token_here
```

### Log Levels
Winston log levels (in order of priority):
- `error` - 0
- `warn` - 1
- `info` - 2
- `http` - 3
- `verbose` - 4
- `debug` - 5
- `silly` - 6

Current configuration uses `info` level (logs info, warn, and error).

## Best Practices

### 1. **Always Include Context**
```javascript
// ❌ Bad
logger.info("Truck added");

// ✅ Good
logger.info("Truck added successfully", getFullContext(req, {
  truckId: savedTruck._id,
  registrationNo
}));
```

### 2. **Use Appropriate Log Levels**
```javascript
// ✅ Correct usage
logger.info("User logged in");           // Successful operation
logger.warn("Invalid truck ID");          // Validation failure
logger.error("Database error", { error }); // Exception
```

### 3. **Include Error Details**
```javascript
// ✅ Good error logging
logger.error("Failed operation", getFullContext(req, {
  error: error.message,
  stack: error.stack
}));
```

### 4. **Track Performance**
Request duration is automatically logged for all requests by the request logger middleware.

## Troubleshooting

### Logs Not Appearing in Papertrail
1. Check `ENABLE_PAPERTRAIL=true` in `.env`
2. Verify `PAPERTRAIL_HTTPS_ENDPOINT` and `PAPERTRAIL_TOKEN` are correct
3. Check console - Papertrail errors are silently caught but initial connection is logged

### Missing Context in Logs
1. Ensure middleware order in `app.js` is correct
2. Request logger should be early in middleware chain
3. Authentication middleware should run before protected routes

### Sensitive Data in Logs
The `getSanitizedBody()` function automatically removes:
- password
- token
- secret
- apiKey
- creditCard

Add more fields if needed in `/backend/utils/requestContext.js`.

## Future Enhancements

Consider implementing:
1. **Log Aggregation Dashboards** - Build custom dashboards in Papertrail
2. **Alerting** - Set up alerts for critical errors
3. **Log Retention Policies** - Configure how long to keep logs
4. **Performance Monitoring** - Add APM integration
5. **Correlation IDs** - Add request correlation IDs for distributed tracing
6. **Structured Logging** - Further enhance log structure for better parsing

## Summary

Your application now has enterprise-grade logging that captures:
- ✅ User information (who)
- ✅ System information (from where, how)
- ✅ Resource information (what)
- ✅ Timing information (when, how long)
- ✅ Error details (why it failed)
- ✅ Business context (expense amounts, truck IDs, etc.)

This comprehensive logging will significantly improve your ability to debug issues, monitor application health, and understand user behavior.
