# Quick Logging Reference Guide

## Import Statement
```javascript
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');
```

## Common Logging Patterns

### 1. Start of Operation
```javascript
logger.info("Starting operation name", getFullContext(req, {
  resourceId: id,
  otherField: value
}));
```

### 2. Successful Operation
```javascript
logger.info("Operation completed successfully", getFullContext(req, {
  resultId: result._id,
  relevantData: data
}));
```

### 3. Validation Warning
```javascript
logger.warn("Validation failed: reason", getFullContext(req, {
  field: value,
  reason: "why it failed"
}));
```

### 4. Resource Not Found
```javascript
logger.warn("Resource not found", getFullContext(req, {
  resourceId: id,
  resourceType: "Truck/User/etc"
}));
```

### 5. Error Handling
```javascript
logger.error("Operation failed", getFullContext(req, {
  error: error.message,
  stack: error.stack
}));
```

## Controller Template

```javascript
const logger = require('../utils/logger');
const { getFullContext } = require('../utils/requestContext');
const Model = require('../models/model');

const controllerFunction = async (req, res) => {
  try {
    const { param1, param2 } = req.body;

    // Log start
    logger.info("Starting operation", getFullContext(req, { param1, param2 }));

    // Validation
    if (!param1) {
      logger.warn("Validation failed: Missing param1", getFullContext(req));
      return res.status(400).json({ message: "param1 is required" });
    }

    // Business logic
    const result = await Model.create({ param1, param2 });

    // Log success
    logger.info("Operation completed successfully", getFullContext(req, {
      resultId: result._id,
      param1
    }));

    res.status(201).json(result);

  } catch (error) {
    // Log error
    logger.error("Operation failed", getFullContext(req, {
      error: error.message,
      stack: error.stack
    }));

    res.status(500).json({ message: "Operation failed" });
  }
};
```

## What Gets Logged Automatically

### User Context
- `username` - From req.username or req.user
- `userId` - From req.user._id
- `email` - From req.user.email
- `isAdmin` - From req.user.isAdmin
- `addedBy` - From req.body.addedBy

### System Context
- `ip` - Client IP address
- `userAgent` - Browser/client info
- `method` - HTTP method (GET, POST, etc.)
- `path` - Request path
- `url` - Full URL
- `protocol` - http/https
- `host` - Host header
- `timestamp` - ISO timestamp

### Resource Context (from params, query, body)
- `resourceId` - From req.params.id
- `truckId` - From params/query/body
- `userId` - From params/query/body
- `dateRange` - From req.query.selectedDates
- `category`, `cost`, `amount`, etc.

## Additional Context

Add any operation-specific data:
```javascript
getFullContext(req, {
  // Your custom fields
  transactionId: txId,
  calculatedValue: value,
  status: status
})
```

## Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| `error` | Exceptions, failures | Database errors, API failures |
| `warn` | Issues that don't stop execution | Validation failures, not found |
| `info` | Normal operations | Successful CRUD, auth events |

## Searching Logs in Papertrail

| What to Find | Query |
|--------------|-------|
| Specific user | `username:john_doe` |
| All errors | `level:error` |
| Specific resource | `truckId:abc123` |
| Endpoint activity | `path:/api/v1/app/trucks` |
| Failed logins | `"Login failed"` |
| Slow requests | `duration:>1000ms` |
| By IP address | `ip:192.168.1.100` |

## Tips

✅ **DO:**
- Always use `getFullContext(req, {...})`
- Include relevant resource IDs
- Log both success and failure
- Include error stack traces
- Use appropriate log levels

❌ **DON'T:**
- Log sensitive data (passwords, tokens) - they're auto-sanitized
- Over-log (avoid logging in tight loops)
- Use console.log (use logger instead)
- Forget to import getFullContext

## Performance

- Logging is asynchronous (non-blocking)
- Minimal overhead (<1ms per log)
- Context extraction is optimized
- Sanitization is fast

## Environment Variables

```bash
# Enable Papertrail
ENABLE_PAPERTRAIL=true
PAPERTRAIL_HTTPS_ENDPOINT=logs.papertrailapp.com:12345
PAPERTRAIL_TOKEN=your_token_here
```

---

**Need more help?** See `LOGGING_GUIDE.md` for detailed documentation.
