<p align="center">
  <img src="../frontend/public/favicon.png" alt="Manage My Truck Logo" width="100"/>
</p>

<h1 align="center">Manage My Truck - Backend</h1>

<p align="center">
  RESTful & GraphQL API for fleet management
  <br/>
  <i>Robust Node.js backend with Express and MongoDB</i>
</p>

---

## 📖 Overview

The Manage My Truck backend is a comprehensive Node.js API server built with Express.js and MongoDB. It provides both RESTful and GraphQL interfaces for managing fleet operations, expenses, income tracking, user authentication, and analytics. The backend features enterprise-grade logging, performance monitoring, and extensive API documentation.

---

## ✨ Features

### 🔐 Authentication & Authorization

#### **Multi-Method Authentication**
- **Google OAuth 2.0** - Secure social login integration
- **JWT Tokens** - Stateless authentication with JSON Web Tokens
- **BCrypt Encryption** - Secure password hashing
- **WebAuthn Support** - Biometric authentication capability

#### **Role-Based Access Control (RBAC)**
- Admin portal with elevated privileges
- Fleet manager role
- User-level permissions
- Middleware-based authentication checks (`isAuthenticated`, `isAdmin`)

### 🚛 Fleet Management APIs

#### **Truck Operations**
- Complete CRUD operations for trucks
- Truck registration and deregistration
- Status tracking and monitoring
- Vehicle metadata management
- GraphQL interface for complex queries

#### **Driver Profile Management**
- Driver information CRUD operations
- Profile tracking and history
- Assignment management
- Performance metrics

### 💰 Financial Management APIs

#### **Expense Tracking**
- **Fuel Expenses** - Comprehensive fuel cost tracking
- **DEF Expenses** - Diesel Exhaust Fluid cost management
- **Other Expenses** - Miscellaneous operational costs
- **Total Expenses** - Aggregated expense calculations
- Date-based filtering and reporting

#### **Income Management**
- Income stream tracking
- Revenue monitoring
- Profit calculations
- Driver salary computation

#### **Loan Calculator**
- Financial loan calculations
- Interest computation
- Payment schedules

### 📊 Analytics & Reporting

#### **Metadata & Insights**
- System-wide analytics
- Trend analysis
- Performance metrics
- Custom dashboard data

#### **Alert System**
- Real-time notification management
- Alert creation and tracking
- Priority-based alerts
- Email integration

### 📚 API Documentation

#### **Swagger/OpenAPI 3.0**
- Interactive API explorer at `/api-docs`
- Complete endpoint documentation
- Request/response schemas
- Authentication examples
- Try-it-out functionality

#### **GraphQL**
- GraphQL playground
- Schema introspection
- Complex query support
- Efficient data fetching

### 📝 Logging & Monitoring

#### **Winston-Based Logging**
- Structured log format
- Multiple log levels (error, warn, info, debug)
- Request/response logging
- Performance metrics
- Error tracking

#### **Cloud Logging**
- Papertrail integration
- Centralized log aggregation
- Real-time log streaming
- Search and filter capabilities

#### **Request Logging Middleware**
- Automatic request tracking
- Response time measurement
- Error capture
- Request context preservation

### 🧪 Performance Testing

#### **Artillery Test Suites**
- **Smoke Tests** - Basic functionality validation
- **Load Tests** - Sustained load testing
- **Spike Tests** - Sudden traffic surge testing
- **Soak Tests** - Long-duration stability testing
- Cloud recording integration
- Performance metrics reporting

### 🛠️ Developer Tools

- **Health Check Endpoint** - Application monitoring
- **Test Data Seeding** - Quick database population
- **CORS Configuration** - Secure cross-origin support
- **Error Handling** - Centralized error management
- **Multer Integration** - File upload support
- **Excel Export** - Data export capabilities

---

## 🛠️ Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express.js | 4.16.1 |
| **Database** | MongoDB | 7.3+ |
| **ODM** | Mongoose | 7.3.0 |
| **Authentication** | JWT, BCrypt, Google OAuth | Latest |
| **API Docs** | Swagger UI, swagger-jsdoc | 6.2.8, 5.0.1 |
| **GraphQL** | Apollo Server, graphql | 5.1.0, 16.12.0 |
| **Logging** | Winston, Morgan | 3.18.3, 1.9.1 |
| **Cloud Logging** | Winston-Papertrail | 1.0.5 |
| **Testing** | Artillery | Latest |
| **File Processing** | Multer, ExcelJS, XLSX | Latest |
| **Date Handling** | Moment.js | 2.30.1 |
| **HTTP Client** | Axios | 1.13.2 |
| **Security** | @simplewebauthn/server | 13.2.2 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** 7.3+ (local installation or MongoDB Atlas)
- **npm** or **yarn**
- Google OAuth credentials (for social login)

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/manage-my-truck
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRE=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/app/auth/google/callback

# CORS Configuration
CORS_URLS=http://localhost:3000,https://yourdomain.com

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Papertrail Logging (Optional)
PAPERTRAIL_HOST=logs.papertrailapp.com
PAPERTRAIL_PORT=12345
PAPERTRAIL_PROGRAM=mmt-backend

# Artillery Cloud (Optional - for performance testing)
ARTILLERY_CLOUD_API_KEY=your_artillery_api_key
```

### Development

```bash
# Start development server with nodemon
npm start

# The server will run at http://localhost:8000
```

### Production

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Start server
node ./bin/www
```

---

## 📁 Project Structure

```
backend/
├── bin/
│   └── www                     # Server startup script
│
├── controllers/                # Business logic
│   ├── admin.js               # Admin operations
│   ├── alerts.js              # Alert management
│   ├── auth.js                # Authentication logic
│   ├── calculateLoan.js       # Loan calculations
│   ├── defExpenses.js         # DEF expense operations
│   ├── driverProfiles.js      # Driver profile management
│   ├── fuelExpenses.js        # Fuel expense operations
│   ├── income.js              # Income tracking
│   ├── metadata.js            # System metadata
│   ├── otherExpenses.js       # Other expenses
│   ├── totalExpenses.js       # Expense aggregation
│   ├── truck.js               # Truck operations
│   └── users.js               # User management
│
├── database/
│   └── connection.js          # MongoDB connection
│
├── docs/                      # API Documentation
│   ├── openapi.yaml           # OpenAPI 3.0 specification
│   ├── swagger.js             # Swagger configuration
│   └── SWAGGER_USAGE_GUIDE.md # Swagger guide
│
├── graphql/                   # GraphQL API
│   ├── index.js               # GraphQL server setup
│   ├── truck-schema.js        # Truck GraphQL schema
│   ├── truck-resolvers.js     # Truck resolvers
│   └── README.md              # GraphQL documentation
│
├── middleware/                # Express middleware
│   ├── catchAsyncError.js     # Async error handler
│   ├── errorHandlers.js       # Error handling middleware
│   ├── isAdmin.js             # Admin authorization
│   ├── isAuthenticated.js     # Authentication check
│   └── requestLogger.js       # Request logging
│
├── models/                    # Mongoose schemas
│   ├── alert-model.js         # Alert schema
│   ├── calculateLoan-model.js # Loan calculation schema
│   ├── defExpense-model.js    # DEF expense schema
│   ├── driverProfiles-model.js # Driver profile schema
│   ├── fuelExpense-model.js   # Fuel expense schema
│   ├── income-model.js        # Income schema
│   ├── otherExpense-model.js  # Other expense schema
│   ├── truck-model.js         # Truck schema
│   └── user-model.js          # User schema
│
├── routes/                    # API routes
│   ├── admin.js               # Admin routes
│   ├── alerts.js              # Alert routes
│   ├── auth.js                # Authentication routes
│   ├── calculateLoan.js       # Loan calculator routes
│   ├── defExpenses.js         # DEF expense routes
│   ├── driverProfiles.js      # Driver profile routes
│   ├── fuelExpenses.js        # Fuel expense routes
│   ├── health.js              # Health check route
│   ├── income.js              # Income routes
│   ├── index.js               # Root routes
│   ├── metadata.js            # Metadata routes
│   ├── otherExpenses.js       # Other expense routes
│   ├── totalExpenses.js       # Total expense routes
│   ├── trucks.js              # Truck routes
│   └── users.js               # User routes
│
├── utils/                     # Utility functions
│   ├── alterApi.js            # API alteration utilities
│   ├── driverProfilesTestUtils.js # Test utilities
│   ├── error.js               # Error utilities
│   ├── getISODate.js          # Date formatting
│   ├── getRegex.js            # Regex utilities
│   ├── logger.js              # Winston logger configuration
│   ├── multer.js              # File upload configuration
│   ├── papertrailHttpsTransport.js # Papertrail transport
│   └── requestContext.js      # Request context management
│
├── app.js                     # Express app configuration
├── package.json               # Dependencies and scripts
├── swagger.json               # Generated Swagger spec
│
├── LOGGING_GUIDE.md           # Comprehensive logging guide
├── LOGGING_QUICK_REFERENCE.md # Quick logging reference
├── LOGGING_IMPLEMENTATION_SUMMARY.md # Logging implementation
├── PAPERTRAIL_GUIDE.md        # Papertrail setup guide
├── ARTILLERY_README.md        # Performance testing guide
│
├── artillery-load-test.yml    # Load test configuration
├── artillery-smoke-test.yml   # Smoke test configuration
├── artillery-spike-test.yml   # Spike test configuration
├── artillery-soak-test.yml    # Soak test configuration
├── artillery-processor.js     # Custom Artillery functions
├── seed-test-users.js         # Test data seeding script
├── test-endpoints.js          # Endpoint testing script
├── test-logging.js            # Logging test script
└── test.yml                   # Basic test configuration
```

---

## 🔌 API Endpoints

### Authentication & Authorization

```
POST   /api/v1/app/auth/register          # User registration
POST   /api/v1/app/auth/login             # User login
POST   /api/v1/app/auth/google            # Google OAuth login
GET    /api/v1/app/auth/logout            # User logout
POST   /api/v1/app/auth/refresh           # Refresh JWT token
```

### User Management

```
GET    /api/v1/app/users/profile          # Get user profile
PUT    /api/v1/app/users/profile          # Update user profile
DELETE /api/v1/app/users/profile          # Delete user account
```

### Admin Operations

```
GET    /api/v1/app/admin/users            # Get all users
GET    /api/v1/app/admin/stats            # System statistics
PUT    /api/v1/app/admin/users/:id        # Update user role
DELETE /api/v1/app/admin/users/:id        # Delete user
```

### Truck Management

```
GET    /api/v1/app/truck                  # Get all trucks
GET    /api/v1/app/truck/:id              # Get truck by ID
POST   /api/v1/app/truck                  # Create new truck
PUT    /api/v1/app/truck/:id              # Update truck
DELETE /api/v1/app/truck/:id              # Delete truck
```

### Financial Operations

#### Fuel Expenses
```
GET    /api/v1/app/fuelExpenses           # Get fuel expenses
POST   /api/v1/app/fuelExpenses           # Create fuel expense
PUT    /api/v1/app/fuelExpenses/:id       # Update fuel expense
DELETE /api/v1/app/fuelExpenses/:id       # Delete fuel expense
```

#### DEF Expenses
```
GET    /api/v1/app/defExpenses            # Get DEF expenses
POST   /api/v1/app/defExpenses            # Create DEF expense
PUT    /api/v1/app/defExpenses/:id        # Update DEF expense
DELETE /api/v1/app/defExpenses/:id        # Delete DEF expense
```

#### Other Expenses
```
GET    /api/v1/app/otherExpenses          # Get other expenses
POST   /api/v1/app/otherExpenses          # Create other expense
PUT    /api/v1/app/otherExpenses/:id      # Update other expense
DELETE /api/v1/app/otherExpenses/:id      # Delete other expense
```

#### Income
```
GET    /api/v1/app/income                 # Get income records
POST   /api/v1/app/income                 # Create income record
PUT    /api/v1/app/income/:id             # Update income record
DELETE /api/v1/app/income/:id             # Delete income record
```

#### Total Expenses
```
GET    /api/v1/app/totalExpenses          # Get aggregated expenses
GET    /api/v1/app/totalExpenses/summary  # Get expense summary
```

#### Loan Calculator
```
POST   /api/v1/app/calculateLoan          # Calculate loan details
```

### Driver Profiles

```
GET    /api/v1/app/driverProfiles         # Get all driver profiles
GET    /api/v1/app/driverProfiles/:id     # Get driver profile
POST   /api/v1/app/driverProfiles         # Create driver profile
PUT    /api/v1/app/driverProfiles/:id     # Update driver profile
DELETE /api/v1/app/driverProfiles/:id     # Delete driver profile
```

### Alerts

```
GET    /api/v1/app/alerts                 # Get all alerts
GET    /api/v1/app/alerts/:id             # Get alert by ID
POST   /api/v1/app/alerts                 # Create alert
PUT    /api/v1/app/alerts/:id             # Update alert
DELETE /api/v1/app/alerts/:id             # Delete alert
```

### Metadata

```
GET    /api/v1/app/metadata               # Get system metadata
GET    /api/v1/app/metadata/stats         # Get statistics
```

### Health & Monitoring

```
GET    /api/v1/app/health                 # Health check endpoint
```

### API Documentation

```
GET    /api-docs                          # Swagger UI
GET    /api-docs.json                     # OpenAPI JSON spec
```

### GraphQL

```
POST   /graphql                           # GraphQL endpoint
GET    /graphql                           # GraphQL playground
```

---

## 📚 API Documentation

### Swagger UI

Access interactive API documentation at:
```
http://localhost:8000/api-docs
```

Features:
- Try-it-out functionality
- Request/response examples
- Schema definitions
- Authentication testing

### OpenAPI Specification

Download the OpenAPI 3.0 spec:
```
http://localhost:8000/api-docs.json
```

### GraphQL Playground

Access GraphQL interface at:
```
http://localhost:8000/graphql
```

For detailed GraphQL documentation, see `graphql/README.md`.

---

## 🧪 Testing

### Performance Testing with Artillery

```bash
# Seed test users first
npm run seed:test-users

# Run smoke test
npm run artillery:smoke

# Run load test
npm run artillery:load

# Run spike test
npm run artillery:spike

# Run soak test
npm run artillery:soak

# Record results to Artillery Cloud
npm run artillery:load:record
```

### Endpoint Testing

```bash
# Test all endpoints
node test-endpoints.js
```

### Logging Test

```bash
# Test logging functionality
node test-logging.js
```

---

## 📝 Logging

The backend implements comprehensive logging with Winston and Papertrail.

### Log Levels

- **error** - Error events
- **warn** - Warning messages
- **info** - Informational messages
- **debug** - Debug messages

### Usage

```javascript
const logger = require('./utils/logger');

logger.info('User logged in', { userId: user.id });
logger.error('Database error', { error: err.message });
logger.warn('Deprecated API used', { endpoint: req.path });
```

### Documentation

- **Complete Guide**: `LOGGING_GUIDE.md`
- **Quick Reference**: `LOGGING_QUICK_REFERENCE.md`
- **Implementation**: `LOGGING_IMPLEMENTATION_SUMMARY.md`
- **Papertrail Setup**: `PAPERTRAIL_GUIDE.md`

---

## 🔧 Available Scripts

```bash
# Start development server with nodemon
npm start

# Generate Swagger documentation
npm run generate:swagger

# Seed test users
npm run seed:test-users

# Performance tests
npm run artillery:test          # Basic test
npm run artillery:load          # Load test
npm run artillery:spike         # Spike test
npm run artillery:soak          # Soak test
npm run artillery:smoke         # Smoke test

# Performance tests with cloud recording
npm run artillery:test:record
npm run artillery:load:record
npm run artillery:spike:record
npm run artillery:soak:record
npm run artillery:smoke:record

# Generate Artillery report
npm run artillery:report
```

---

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domains
5. Set up cloud logging (Papertrail)
6. Configure AWS S3 for file uploads

### Deployment Platforms

#### Render
```bash
# Connect repository to Render
# Set environment variables
# Deploy automatically on push
```

#### AWS EC2
```bash
# SSH into EC2 instance
# Clone repository
# Install dependencies
# Set up PM2 or systemd service
# Configure nginx reverse proxy
```

#### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
git push heroku main
heroku config:set NODE_ENV=production
```

---

## 🔒 Security Best Practices

- Always use HTTPS in production
- Keep JWT secrets secure and rotate regularly
- Implement rate limiting for API endpoints
- Use helmet.js for security headers
- Validate and sanitize all user inputs
- Keep dependencies updated
- Use environment variables for sensitive data
- Implement proper CORS configuration
- Use bcrypt with appropriate salt rounds
- Implement request logging for audit trails

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: MongoDB connection failed
- **Solution**: Check `MONGODB_URI` in `.env` and ensure MongoDB is running

**Issue**: Google OAuth not working
- **Solution**: Verify Google OAuth credentials and callback URL

**Issue**: JWT token invalid
- **Solution**: Check `JWT_SECRET` matches between requests

**Issue**: CORS errors
- **Solution**: Add frontend URL to `CORS_URLS` in `.env`

**Issue**: File upload failing
- **Solution**: Verify AWS S3 credentials and bucket permissions

**Issue**: Swagger docs not loading
- **Solution**: Run `npm run generate:swagger` to regenerate docs

---

## 📊 Monitoring

### Health Check

Monitor application health:
```bash
curl http://localhost:8000/api/v1/app/health
```

### Logging

View logs in real-time:
- Local: Check console output
- Production: Access Papertrail dashboard

### Performance Metrics

Use Artillery Cloud for:
- Response time tracking
- Error rate monitoring
- Throughput analysis
- Load testing results

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contributors

Made with ❤️ by Team AWengerS

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Swagger Documentation](https://swagger.io/docs/)
- [GraphQL Documentation](https://graphql.org/)

---

<p align="center">
  <a href="../README.md">← Back to Main README</a>
</p>
