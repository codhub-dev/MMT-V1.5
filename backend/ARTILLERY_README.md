# Artillery Load Testing for ManageMyTruck Backend

This directory contains Artillery load testing configurations for the backend API, specifically focusing on authentication endpoints.

## Prerequisites

```bash
npm install -g artillery@latest
```

## Test Files

### 1. `test.yml` - Comprehensive Test Suite
- Tests passkey registration endpoint (`/api/v1/app/auth/register`)
- Tests login functionality (`/api/v1/app/auth/login`)
- Tests full user journey
- Includes health check monitoring
- Uses CSV data file for test data

### 2. `artillery-load-test.yml` - Load Testing
- Progressive load testing with ramp up/down
- Multiple scenarios with different weights
- Tests registration, login, and profile access

### 3. `artillery-spike-test.yml` - Spike Testing
- Tests system behavior under sudden traffic spikes
- Simulates 100 requests/second spike

### 4. `artillery-processor.js` - Custom Functions
- Logging functions for registration and login
- Random user generation
- Auth header setup

### 5. `test-data.csv` - Test Data
- Sample usernames and passwords for testing

## Running Tests

### Local Testing (without recording)

```bash
# Run basic test suite
artillery run test.yml

# Run load test
artillery run artillery-load-test.yml

# Run spike test
artillery run artillery-spike-test.yml

# Run with detailed output
artillery run test.yml --output report.json
artillery report report.json
```

### Cloud Recording (with Artillery Cloud)

```bash
# Run and record to Artillery Cloud
artillery run test.yml --record --key a9_je5rl38330pw43a4lisr7hwl4g9ztxqi

# Run load test with recording
artillery run artillery-load-test.yml --record --key a9_je5rl38330pw43a4lisr7hwl4g9ztxqi

# Run spike test with recording
artillery run artillery-spike-test.yml --record --key a9_je5rl38330pw43a4lisr7hwl4g9ztxqi
```

### Using npm scripts

```bash
# Basic test with recording
npm run artillery:test:record

# Load test with recording
npm run artillery:load:record

# Spike test with recording
npm run artillery:spike:record
```

## Test Scenarios

### 1. Passkey Registration Load Test (60% weight)
- POST to `/api/v1/app/auth/register`
- Uses username and password
- Captures authentication token
- 2 second think time between requests

### 2. Passkey Login Load Test (30% weight)
- POST to `/api/v1/app/auth/login`
- Tests existing user login
- 1 second think time

### 3. Full User Journey (10% weight)
- Registration → Profile Access → Logout
- Tests complete authentication flow

### 4. Health Check (5% weight)
- Monitors system health during load
- GET `/api/v1/app/health`

## Load Testing Phases

### test.yml
1. **Warm up** (60s): 5 requests/second
2. **Ramp up** (120s): 10 requests/second
3. **Sustained load** (180s): 20 requests/second

### artillery-load-test.yml
1. **Smoke test** (30s): 1 request/second
2. **Ramp up** (60s): 5→15 requests/second
3. **Sustained** (120s): 15 requests/second
4. **Ramp down** (60s): 15→5 requests/second

### artillery-spike-test.yml
1. **Normal** (30s): 5 requests/second
2. **SPIKE** (60s): 100 requests/second
3. **Recovery** (30s): 5 requests/second

## Configuration

Update the `target` in YAML files to match your backend URL:

```yaml
config:
  target: "http://localhost:8000"  # Change this for different environments
```

For production testing:
```yaml
config:
  target: "https://managemytruck.in"
```

## API Endpoints Being Tested

All endpoints use the `/api/v1/app/` prefix:

- `POST /api/v1/app/auth/register` - User registration
- `POST /api/v1/app/auth/login` - User login
- `POST /api/v1/app/auth/logout` - User logout
- `GET /api/v1/app/users/profile` - Get user profile (requires auth)
- `GET /api/v1/app/health` - Health check

## Expected Status Codes

- **200/201**: Successful registration/login
- **400**: Bad request (invalid data)
- **401**: Unauthorized (invalid credentials)
- **409**: Conflict (user already exists)
- **429**: Too many requests (rate limiting)
- **500/503**: Server errors (under high load)

## Metrics to Monitor

- **Response time (p95, p99)**: Should be < 500ms under normal load
- **Success rate**: Should be > 95%
- **Error rate**: Should be < 5%
- **Throughput**: Requests per second handled
- **Request distribution**: Time spent in each scenario

## Tips

1. **Start small**: Run smoke tests first
2. **Gradual increase**: Use ramp-up phases
3. **Monitor backend**: Watch CPU, memory, database connections
4. **Database cleanup**: Clear test users after testing
5. **Rate limiting**: Consider implementing if not present

## Troubleshooting

### High error rates
- Check backend logs
- Verify database connection limits
- Monitor server resources

### Timeouts
- Increase timeout in config:
  ```yaml
  config:
    timeout: 30
  ```

### Connection refused
- Ensure backend is running on port 8000
- Check target URL
- Verify firewall settings

### 404 Errors
- Verify API routes match: `/api/v1/app/auth/*`
- Check that backend server is running
- Ensure routes are properly configured in app.js

## Integration with CI/CD

Add to your CI/CD pipeline:

```bash
# In GitHub Actions, CircleCI, etc.
artillery run artillery-load-test.yml --record --key $ARTILLERY_API_KEY
```

## Environment Variables

Create `.env.artillery` for sensitive data:

```bash
ARTILLERY_API_KEY=a9_je5rl38330pw43a4lisr7hwl4g9ztxqi
TARGET_URL=http://localhost:8000
```

## View Results

After running with `--record`, view results at:
https://app.artillery.io/

## Support

For issues or questions:
- Artillery Docs: https://www.artillery.io/docs
- GitHub: https://github.com/artilleryio/artillery
