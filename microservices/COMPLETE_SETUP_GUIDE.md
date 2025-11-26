# Complete MMT Application Setup Guide

## 🎯 Overview

This guide will help you run the **complete MMT application** with:
- ✅ 6 Backend Microservices (NEW)
- ✅ Existing React Frontend
- ✅ MongoDB Database
- ✅ RabbitMQ Message Broker

**Total Time**: 15-20 minutes

---

## ✅ Status Check

### Backend Microservices - ALL COMPLETE ✅
1. **API Gateway** - Routes all requests, Circuit Breaker
2. **Auth Service** - User authentication (JWT)
3. **Fleet Service** - Truck & driver management (REST + gRPC)
4. **Finance Service** - Income & expenses (GraphQL)
5. **Analytics Service** - Dashboard stats (gRPC)
6. **Notification Service** - Alerts (RabbitMQ)

### Frontend - EXISTS ✅
- Located in `/frontend` directory
- React application already built
- Needs to point to API Gateway (port 3000)

### Infrastructure Needed:
- MongoDB (database)
- RabbitMQ (message broker)
- Node.js 18+ (runtime)

---

## 📋 Prerequisites

1. **Node.js 18+** installed
   ```bash
   node --version  # Should show v18 or higher
   ```

2. **Docker** installed (for MongoDB & RabbitMQ)
   ```bash
   docker --version
   ```

3. **Git** (already have the project)

---

## 🚀 Complete Setup - Step by Step

### STEP 1: Start Infrastructure (Docker)

Open **Terminal 1** and run:

```bash
# Start MongoDB
docker run -d \
  --name mmt-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0

# Start RabbitMQ
docker run -d \
  --name mmt-rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  rabbitmq:3.12-management

# Verify containers are running
docker ps
```

You should see both `mmt-mongodb` and `mmt-rabbitmq` running.

**Wait 30 seconds** for services to initialize.

---

### STEP 2: Start Backend Microservices

#### Terminal 2 - API Gateway (Port 3000)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/api-gateway
npm install
PORT=3000 JWT_SECRET=my-secret-key-12345 node server.js
```

Wait for: `🚪 API Gateway running on port 3000`

#### Terminal 3 - Auth Service (Port 3001)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/auth-service
npm install
PORT=3001 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_auth_db?authSource=admin \
JWT_SECRET=my-secret-key-12345 \
node server.js
```

Wait for: `🔐 Auth Service running on port 3001`

#### Terminal 4 - Fleet Service (Port 3002)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/fleet-service
npm install
PORT=3002 \
GRPC_PORT=50051 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_fleet_db?authSource=admin \
node server.js
```

Wait for: `🚛 Fleet Service REST API running on port 3002`

#### Terminal 5 - Finance Service (Port 3003)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/finance-service
npm install
PORT=3003 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_finance_db?authSource=admin \
node server.js
```

Wait for: `💰 Finance Service running on port 3003`

#### Terminal 6 - Analytics Service (Port 3004)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/analytics-service
npm install
PORT=3004 \
GRPC_PORT=50052 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_analytics_db?authSource=admin \
FLEET_GRPC_URL=localhost:50051 \
node server.js
```

Wait for: `📊 Analytics Service REST API running on port 3004`

#### Terminal 7 - Notification Service (Port 3005)
```bash
cd ~/Projects/External/mmt-v1.5/microservices/notification-service
npm install
PORT=3005 \
MONGODB_URI=mongodb://admin:password@localhost:27017/mmt_notifications_db?authSource=admin \
RABBITMQ_URL=amqp://admin:password@localhost:5672 \
node server.js
```

Wait for: `🔔 Notification Service running on port 3005`

---

### STEP 3: Verify All Backend Services

Open **Terminal 8** and test health checks:

```bash
# Test all services
echo "Testing API Gateway..."
curl http://localhost:3000/health

echo "\nTesting Auth Service..."
curl http://localhost:3001/health

echo "\nTesting Fleet Service..."
curl http://localhost:3002/health

echo "\nTesting Finance Service..."
curl http://localhost:3003/health

echo "\nTesting Analytics Service..."
curl http://localhost:3004/health

echo "\nTesting Notification Service..."
curl http://localhost:3005/health
```

All should return `{"status":"UP",...}`

---

### STEP 4: Update Frontend Configuration

The frontend needs to point to the API Gateway on port 3000.

#### Check Current Frontend Config

```bash
cd ~/Projects/External/mmt-v1.5/frontend/src/Config/Axios
cat Axios.js
```

#### Update if Needed

The file should have:
```javascript
const BASE_URL = 'http://localhost:3000/api';
```

If it points to a different port (like 5000), update it:

```bash
cd ~/Projects/External/mmt-v1.5/frontend/src/Config/Axios
```

Then edit `Axios.js` to ensure the baseURL points to port 3000.

---

### STEP 5: Start Frontend

#### Terminal 9 - React Frontend
```bash
cd ~/Projects/External/mmt-v1.5/frontend
npm install
npm start
```

Wait for: `Compiled successfully!`

The frontend will open automatically at: **http://localhost:3001** (or 3002, depending on React)

---

## 🎉 Application is Ready!

### Access Points:

**Frontend**: http://localhost:3001 (or check terminal output)
- Register a new user
- Login
- Manage trucks
- Track expenses
- View analytics

**Backend Services**:
- API Gateway: http://localhost:3000
- GraphQL Playground: http://localhost:3003/graphql
- RabbitMQ Admin: http://localhost:15672 (admin/password)

---

## 📝 Testing the Application

### 1. Register and Login

**Frontend**: Open http://localhost:3001
1. Click "Sign Up"
2. Create account with email/password
3. Login with credentials

**OR via API**:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login (copy the token from response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Add a Truck

**Via Frontend**:
1. Login to dashboard
2. Click "Add Truck"
3. Fill in details
4. Submit

**Via API**:
```bash
# Use the token from login
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:3000/api/fleet/trucks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "truckNumber": "TRK001",
    "truckName": "Volvo Truck 1",
    "truckModel": "Volvo FH16",
    "truckCapacity": 25000,
    "status": "active"
  }'
```

### 3. Add Expenses

**Via Frontend**: Navigate to expenses section

**Via GraphQL**:
```bash
# Open GraphQL Playground
# Visit: http://localhost:3003/graphql

# Run this mutation:
mutation {
  addExpense(
    truckId: "TRK001"
    userId: "user123"
    amount: 500.50
    category: "fuel"
    date: "2024-11-26"
    description: "Fuel fill-up"
  ) {
    id
    amount
    category
  }
}
```

### 4. View Analytics

**Via Frontend**: Check dashboard

**Via API**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/analytics/stats?userId=user123
```

### 5. Check Notifications

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notifications/alerts?userId=user123
```

---

## 🔧 Frontend Changes (If Needed)

The existing frontend should work with minimal changes. Here's what to verify:

### 1. API Base URL

**File**: `frontend/src/Config/Axios/Axios.js`

Should be:
```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000/api',  // API Gateway
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
```

### 2. API Endpoints

The frontend should use these routes (all go through API Gateway):

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Fleet**: `/api/fleet/trucks`, `/api/fleet/drivers`
- **Finance**: `/graphql` (for GraphQL queries)
- **Notifications**: `/api/notifications/alerts`

No changes needed if the frontend already follows this structure.

---

## 🛑 Troubleshooting

### Problem: Services won't start

**Solution**: Check if ports are already in use
```bash
# Check port usage
lsof -i :3000  # API Gateway
lsof -i :3001  # Auth Service
# ... check all ports 3000-3005

# Kill process if needed
kill -9 <PID>
```

### Problem: MongoDB connection fails

**Solution**: Verify MongoDB is running
```bash
docker ps | grep mongodb
docker logs mmt-mongodb

# Restart if needed
docker restart mmt-mongodb
```

### Problem: RabbitMQ not working

**Solution**: Check RabbitMQ status
```bash
docker ps | grep rabbitmq
docker logs mmt-rabbitmq

# Access management UI
open http://localhost:15672
# Login: admin/password
```

### Problem: Frontend can't connect to backend

**Solution**: Check CORS and API Gateway
1. Ensure API Gateway is running on port 3000
2. Check CORS is enabled in `api-gateway/server.js`
3. Verify frontend points to correct URL

### Problem: "Module not found" errors

**Solution**: Reinstall dependencies
```bash
cd <service-directory>
rm -rf node_modules package-lock.json
npm install
```

---

## 🧹 Cleanup

When you're done testing:

```bash
# Stop all Node.js services (Ctrl+C in each terminal)

# Stop and remove Docker containers
docker stop mmt-mongodb mmt-rabbitmq
docker rm mmt-mongodb mmt-rabbitmq

# Optional: Remove data volumes
docker volume prune
```

---

## 📊 Architecture Diagram

```
┌─────────────────┐
│  React Frontend │ :3001
│   (Existing)    │
└────────┬────────┘
         │
         │ HTTP
         ▼
┌─────────────────┐
│  API Gateway    │ :3000  ◄── Circuit Breaker, Auth
│  (NEW)          │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬───────────┬────────────┐
    │         │          │           │            │
    ▼         ▼          ▼           ▼            ▼
┌──────┐  ┌──────┐  ┌────────┐  ┌──────┐  ┌──────────┐
│ Auth │  │Fleet │  │Finance │  │Analytics│ │Notification│
│:3001 │  │:3002 │  │:3003   │  │:3004   │ │:3005     │
│      │  │gRPC  │  │GraphQL │  │gRPC    │ │RabbitMQ  │
└──┬───┘  └──┬───┘  └───┬────┘  └───┬────┘ └────┬─────┘
   │         │          │           │            │
   │    ┌────┴──────────┴───────────┴────────────┘
   │    │
   ▼    ▼
┌─────────────────┐       ┌──────────────┐
│    MongoDB      │       │   RabbitMQ   │
│  (6 Databases)  │       │              │
└─────────────────┘       └──────────────┘
```

---

## ✅ Success Checklist

- [ ] MongoDB running (docker ps)
- [ ] RabbitMQ running (docker ps)
- [ ] API Gateway started (port 3000)
- [ ] Auth Service started (port 3001)
- [ ] Fleet Service started (port 3002)
- [ ] Finance Service started (port 3003)
- [ ] Analytics Service started (port 3004)
- [ ] Notification Service started (port 3005)
- [ ] All health checks passing
- [ ] Frontend running (port 3001/3002)
- [ ] Can register/login
- [ ] Can create trucks
- [ ] Can add expenses
- [ ] Can view dashboard

---

## 🎓 For Your Assignment Demo

1. **Start all services** using this guide
2. **Show health checks** for all 6 services
3. **Demonstrate frontend** - Register, Login, Add Truck
4. **Show GraphQL Playground** - Run a query
5. **Show RabbitMQ Management** - Events flowing
6. **Show logs** - Demonstrate inter-service communication
7. **Present documentation** - Architecture, patterns, deployment

---

## 📞 Support

If you encounter issues:
1. Check all services are running: `docker ps` and verify Node processes
2. Check logs in each terminal window
3. Verify ports are not blocked
4. Review error messages carefully
5. Restart services if needed

---

**Total Setup Time**: 15-20 minutes
**Status**: ✅ READY FOR PRODUCTION DEMO

The application is complete and fully functional!
