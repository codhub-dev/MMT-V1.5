# Papertrail Logging - What You'll See

## ✅ Your Papertrail Configuration is Active

Your application is now sending **all contextual information** to Papertrail.

---

## 🔍 What Gets Logged to Papertrail

### Every Log Entry Contains:

#### 1. **Standard Fields**
- `timestamp` - When the event occurred
- `level` - Log level (info, warn, error)
- `message` - Human-readable description
- `service` - "mmt-backend"
- `environment` - "development" or "production"

#### 2. **User Context** (when available)
- `username` - The authenticated user's username
- `userId` - The user's database ID
- `email` - User's email address
- `isAdmin` - Whether user has admin privileges
- `addedBy` - User who created the resource

#### 3. **System Context**
- `ip` - Client IP address
- `userAgent` - Browser/client information
- `method` - HTTP method (GET, POST, PUT, DELETE)
- `path` - API endpoint path
- `url` - Full request URL
- `protocol` - http or https
- `host` - Server hostname

#### 4. **Business Context**
- `truckId` - Truck identifier
- `cost` - Expense amount
- `litres` - Fuel/DEF quantity
- `amount` - Income amount
- `category` - Expense category
- `registrationNo` - Truck registration
- `driverId` - Driver identifier
- `alertId` - Alert identifier
- Plus any other resource-specific data

---

## 📊 Example Papertrail Log Entries

### Example 1: Adding Fuel Expense
```json
{
  "timestamp": "2025-11-21T20:42:46.123Z",
  "level": "info",
  "message": "Adding fuel expense",
  "service": "mmt-backend",
  "environment": "production",
  "username": "john_doe",
  "userId": "673f8a1b2c4d5e6f7g8h9i0j",
  "email": "john@example.com",
  "isAdmin": false,
  "addedBy": "673f8a1b2c4d5e6f7g8h9i0j",
  "ip": "203.0.113.45",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "method": "POST",
  "path": "/api/v1/app/fuelExpenses",
  "url": "/api/v1/app/fuelExpenses",
  "protocol": "https",
  "host": "api.managemytruck.com",
  "truckId": "673f8a1b2c4d5e6f7g8h9i0k",
  "cost": 150.50,
  "litres": 50
}
```

### Example 2: Failed Login Attempt
```json
{
  "timestamp": "2025-11-21T20:45:12.789Z",
  "level": "warn",
  "message": "Login failed: Invalid password",
  "service": "mmt-backend",
  "environment": "production",
  "ip": "198.51.100.42",
  "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)...",
  "method": "POST",
  "path": "/api/v1/app/auth",
  "url": "/api/v1/app/auth/login",
  "protocol": "https",
  "host": "api.managemytruck.com",
  "username": "attempted_user"
}
```

### Example 3: Error with Stack Trace
```json
{
  "timestamp": "2025-11-21T20:50:30.456Z",
  "level": "error",
  "message": "Failed to add income",
  "service": "mmt-backend",
  "environment": "production",
  "username": "jane_smith",
  "userId": "673f8a1b2c4d5e6f7g8h9i0m",
  "ip": "203.0.113.89",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "method": "POST",
  "path": "/api/v1/app/income",
  "truckId": "673f8a1b2c4d5e6f7g8h9i0n",
  "amount": 5000,
  "error": "Database connection timeout",
  "stack": "Error: Database connection timeout\n    at Income.save (/app/models/income-model.js:45:15)\n    ..."
}
```

---

## 🔎 How to Search in Papertrail

### Search by User Activity
```
username:john_doe
```
Shows all actions performed by john_doe

### Search by Resource
```
truckId:673f8a1b2c4d5e6f7g8h9i0k
```
Shows all operations for a specific truck

### Search by Error Level
```
level:error
```
Shows all errors

```
level:warn
```
Shows all warnings

### Search by Endpoint
```
path:/api/v1/app/fuelExpenses
```
Shows all fuel expense operations

### Search by HTTP Method
```
method:DELETE
```
Shows all deletion operations

### Search by IP Address
```
ip:203.0.113.45
```
Shows all requests from a specific IP

### Search by Time Period
```
username:john_doe AND cost:>100
```
Shows all operations by john_doe with cost over 100

### Complex Queries
```
level:error AND path:/api/v1/app/fuelExpenses
```
Shows all fuel expense errors

```
username:john_doe AND method:DELETE
```
Shows all deletions by john_doe

```
isAdmin:true
```
Shows all admin operations

---

## 📈 Common Use Cases

### 1. Debug User Issue
**User reports:** "I can't add fuel expenses"

**Search:**
```
username:affected_user AND path:/api/v1/app/fuelExpenses
```

You'll see:
- All their attempts
- Success/failure status
- Error messages
- What data they submitted

### 2. Track Security Events
**Search for failed logins:**
```
level:warn AND message:"Login failed"
```

You'll see:
- Who tried to login
- From which IP
- When it happened
- How many attempts

### 3. Performance Monitoring
**Search for slow operations:**
```
duration:>1000
```

Shows requests taking more than 1 second

### 4. Audit Trail
**Track all admin operations:**
```
isAdmin:true AND method:DELETE
```

Shows all deletions by admins with:
- Who performed the action
- What was deleted
- When it happened

### 5. Track Specific Truck
**All operations for a truck:**
```
truckId:673f8a1b2c4d5e6f7g8h9i0k
```

Shows complete history:
- Expenses added
- Income recorded
- Updates made
- By which users

---

## 🎯 Real-Time Monitoring

### Set Up Alerts in Papertrail

1. **Error Alerts**
   - Query: `level:error`
   - Alert when error count > 5 in 5 minutes
   - Get email/SMS notification

2. **Failed Login Attempts**
   - Query: `level:warn AND message:"Login failed"`
   - Alert when > 3 attempts from same IP
   - Security notification

3. **High-Value Transactions**
   - Query: `cost:>10000 OR amount:>10000`
   - Alert for large expenses/income
   - Business monitoring

4. **System Health**
   - Query: `level:error AND message:"Database"`
   - Alert on database errors
   - Infrastructure monitoring

---

## ✅ Verification Steps

### 1. Check Logs Are Arriving
Go to your Papertrail dashboard and search:
```
service:mmt-backend
```

You should see logs flowing in real-time.

### 2. Verify Contextual Data
Search for a recent operation:
```
message:"Adding fuel expense"
```

Click on a log entry and verify you see:
- ✅ username
- ✅ userId
- ✅ ip
- ✅ truckId
- ✅ cost
- ✅ All other context fields

### 3. Test Different Scenarios

Run these operations in your app:
1. **Login** - Check for user context
2. **Add expense** - Check for resource context
3. **Delete truck** - Check for operation logging
4. **Admin action** - Check for admin flag

---

## 🐛 Troubleshooting

### Not seeing logs in Papertrail?

1. **Check environment variables:**
   ```bash
   echo $ENABLE_PAPERTRAIL  # Should be "true"
   echo $PAPERTRAIL_HTTPS_ENDPOINT  # Should be your endpoint
   echo $PAPERTRAIL_TOKEN  # Should be your token
   ```

2. **Check console output:**
   Look for: "Papertrail HTTPS transport added successfully"

3. **Test manually:**
   ```bash
   cd backend
   node test-logging.js
   ```
   Then check Papertrail dashboard

### Missing some context fields?

- Ensure the controller is using `getFullContext(req, {...})`
- Check that middleware order is correct in `app.js`
- Verify authentication middleware runs before protected routes

### Logs in console but not Papertrail?

- Check network connectivity to Papertrail endpoint
- Verify HTTPS endpoint URL is correct
- Verify authentication token is valid

---

## 📊 Dashboard Ideas

Create custom dashboards in Papertrail:

1. **User Activity Dashboard**
   - Top active users
   - Operations per user
   - Error rate by user

2. **API Performance Dashboard**
   - Request count by endpoint
   - Average response time
   - Error rate by endpoint

3. **Business Metrics Dashboard**
   - Total expenses logged
   - Total income logged
   - Most active trucks

4. **Security Dashboard**
   - Failed login attempts
   - Admin operations
   - Unusual activity patterns

---

## 🎉 You're All Set!

Your application now sends comprehensive, searchable logs to Papertrail including:
- ✅ Complete user context
- ✅ System information
- ✅ Business data
- ✅ Error details
- ✅ Performance metrics

**Next Steps:**
1. Monitor your Papertrail dashboard
2. Set up alerts for critical events
3. Create custom searches for common scenarios
4. Build dashboards for your team

Happy logging! 🚀
