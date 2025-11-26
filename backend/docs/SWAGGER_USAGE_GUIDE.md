# Swagger API Documentation - Usage Guide

## 📚 Overview

This guide provides comprehensive instructions on how to use the MMT (Manage My Truck) Backend API Swagger documentation effectively.

**Swagger UI URL**: `http://localhost:8000/api-docs`

---

## 🚀 Getting Started

### 1. Starting the Backend Server

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:8000`

### 2. Accessing Swagger Documentation

Open your browser and navigate to:
```
http://localhost:8000/api-docs
```

---

## 🔐 Authentication

Most API endpoints require JWT authentication. Here's how to authenticate:

### Step 1: Get a Token

1. **Expand** the **Auth** section
2. Click on **POST /auth/signUpWithGoogle** (or use login endpoint)
3. Click **"Try it out"**
4. Enter your request body:
```json
{
  "token": "your-google-oauth-token-here"
}
```
5. Click **"Execute"**
6. **Copy the JWT token** from the response

### Step 2: Authorize Swagger

1. Click the **"Authorize"** button at the top right
2. In the popup, enter: `Bearer YOUR_JWT_TOKEN`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

✅ You're now authenticated! All subsequent requests will include your token.

---

## 📋 API Categories

The API is organized into the following categories:

### 1. **Auth** - Authentication & Authorization
- Sign up with Google OAuth
- Login/Logout
- Token validation (whoami)

### 2. **Admin** (Requires Admin Role)
- Get all users
- Get user by username
- Delete user

### 3. **Truck Management - GraphQL**
- Single endpoint with multiple operations
- Query: Get trucks (all, by ID, by user)
- Mutation: Add, update, delete trucks

### 5. **Truck Management - REST** (Legacy)
- Traditional REST endpoints for truck CRUD

### 5. **Income**
- Add income records
- Get income by truck/user
- Update/delete income
- Export to Excel

### 6. **Alerts**
- Create and manage alerts/notifications
- Mark alerts as read
- Get alert summaries
- Soft delete and restore

### 7. **Driver Profiles**
- Add and manage driver profiles
- Get driver statistics
- Soft delete and restore

### 8. **Expenses**
- **Fuel Expenses**: Track fuel costs with mileage
- **DEF Expenses**: Diesel Exhaust Fluid tracking
- **Other Expenses**: Miscellaneous costs
- **Total Expenses**: Aggregated expense data

### 10. **Loan Calculations**
- Track loan payments
- Download payment history

### 11. **Metadata**
- Get analytics by truck/user
- Profile metadata

---

## 💡 How to Use Swagger UI

### Testing an Endpoint

1. **Find the endpoint** you want to test
2. **Click to expand** the endpoint details
3. Click **"Try it out"** button
4. **Fill in the parameters**:
   - Path parameters: Replace `{id}` with actual values
   - Query parameters: Fill in the form fields
   - Request body: Edit the JSON example
5. Click **"Execute"**
6. View the response below

### Example: Adding a Truck (REST)

1. Expand **Truck Management - REST**
2. Find **POST /truck/addTruck**
3. Click **"Try it out"**
4. Edit the request body:
```json
{
  "registrationNo": "TRK-2024-001",
  "addedBy": "507f1f77bcf86cd799439011",
  "make": "Volvo",
  "model": "VNL 760",
  "year": 2024,
  "isFinanced": true,
  "financeAmount": 50000.00
}
```
5. Click **"Execute"**
6. Check the response (should be 201 Created)

---

## 🔍 GraphQL API Usage

The GraphQL API provides a more flexible alternative to REST.

### Accessing GraphQL Playground

Navigate to: `http://localhost:8000/graphql`

### Example Queries

#### 1. Get All Trucks
```graphql
query {
  getAllTrucks {
    message
    trucks {
      id
      registrationNo
      make
      model
      year
      isFinanced
    }
  }
}
```

#### 2. Get Truck by ID
```graphql
query GetTruck($id: ID!) {
  getTruckById(id: $id) {
    message
    truck {
      id
      registrationNo
      make
      model
      year
    }
  }
}
```

**Variables:**
```json
{
  "id": "507f1f77bcf86cd799439012"
}
```

#### 3. Add New Truck (Mutation)
```graphql
mutation AddTruck($input: TruckInput!) {
  addTruck(input: $input) {
    message
    truck {
      id
      registrationNo
      make
      model
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "addedBy": "507f1f77bcf86cd799439011",
    "registrationNo": "TRK-2024-002",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2024
  }
}
```

---

## 📊 Common Use Cases

### Use Case 1: Track Income for a Truck

```bash
# 1. Add income
POST /income/addIncome
{
  "truckId": "507f1f77bcf86cd799439012",
  "addedBy": "507f1f77bcf86cd799439011",
  "date": "2025-11-21",
  "amount": 2500.00,
  "note": "Delivery payment - Route 66"
}

# 2. Get all income for the truck
GET /income/getAllIncomesByTruckId?truckId=507f1f77bcf86cd799439012

# 3. Download as Excel
GET /income/downloadIncomesExcel?truckId=507f1f77bcf86cd799439012
```

### Use Case 2: Manage Alerts

```bash
# 1. Create an alert
POST /alerts/addAlert
{
  "addedBy": "507f1f77bcf86cd799439011",
  "title": "Vehicle Inspection Due",
  "description": "Annual inspection required",
  "alertDate": "2025-12-15T10:00:00Z",
  "type": "inspection",
  "priority": "high",
  "truckId": "507f1f77bcf86cd799439012"
}

# 2. Get user's alerts
GET /alerts/getAllAlertsByUser/{userId}

# 3. Mark as read
PUT /alerts/markAlertAsRead/{alertId}

# 4. Get summary
GET /alerts/getAlertsSummary/{userId}
```

### Use Case 3: Add Driver Profile

```bash
POST /driverProfiles/addDriverProfile
{
  "addedBy": "507f1f77bcf86cd799439011",
  "name": "John Smith",
  "contact": "+1-555-0123",
  "age": 35,
  "experience": "10 years",
  "license": "DL123456789",
  "gender": "Male"
}
```

### Use Case 4: Track Fuel Expenses

```bash
POST /fuelExpenses/addFuelExpense
{
  "truckId": "507f1f77bcf86cd799439012",
  "addedBy": "507f1f77bcf86cd799439011",
  "date": "2025-11-21",
  "currentKM": 125678.5,
  "litres": 150.5,
  "cost": 225.75,
  "note": "Fill-up at Highway Rest Stop"
}
```

---

## 🎯 Testing with cURL

You can also test the API using cURL from the command line:

### Example: Add Income
```bash
curl -X POST "http://localhost:8000/api/v1/app/income/addIncome" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckId": "507f1f77bcf86cd799439012",
    "addedBy": "507f1f77bcf86cd799439011",
    "date": "2025-11-21",
    "amount": 2500.00
  }'
```

### Example: GraphQL Query
```bash
curl -X POST "http://localhost:8000/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ getAllTrucks { message trucks { id registrationNo make model } } }"
  }'
```

---

## 📥 Exporting Data to Excel

Several endpoints support Excel export:

- `/income/downloadIncomesExcel`
- `/fuelExpenses/downloadFuelExpensesExcel`
- `/defExpenses/downloadDefExpensesExcel`
- `/otherExpenses/downloadOtherExpensesExcel`
- `/calculateLoan/downloadLoanCalculationExcel`

### Example Usage:
```bash
# Export income data for a specific truck
GET /income/downloadIncomesExcel?truckId=507f1f77bcf86cd799439012

# Export all income data (Admin only)
GET /income/downloadAllIncomesExcel
```

---

## ⚠️ Important Notes

### Parameter Types

- **Path Parameters**: Embedded in the URL (e.g., `/trucks/getTruckById/{id}`)
- **Query Parameters**: Added after `?` (e.g., `?truckId=123&userId=456`)
- **Body Parameters**: Sent as JSON in the request body

### Required Fields

Look for the **red asterisk (*)** next to parameter names - these are required.

### Response Codes

- **200**: Success (GET, PUT, DELETE)
- **201**: Created (POST)
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

### Date Formats

- **Date**: `YYYY-MM-DD` (e.g., `2025-11-21`)
- **DateTime**: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2025-11-21T10:30:00Z`)

---

## 🔄 REST vs GraphQL

### When to Use REST
- Simple CRUD operations
- Direct endpoint access
- Legacy system compatibility
- Excel exports

### When to Use GraphQL
- Complex queries with nested data
- Request only the fields you need
- Batch operations
- More flexible data fetching

---

## 🛠️ Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Make sure you've authorized with a valid JWT token (see Authentication section)

### Issue: "Validation Error"
**Solution**: Check that all required fields are provided and have correct data types

### Issue: "Not Found"
**Solution**: Verify the ID exists and you have permission to access it

### Issue: Can't see response data
**Solution**: Scroll down in the Swagger UI - the response appears below the "Execute" button

---

## 📖 Schema Reference

### Common Field Types

- **_id**: MongoDB ObjectId (24 character hex string)
- **addedBy**: User ID (references User collection)
- **truckId**: Truck ID (references Truck collection)
- **date**: Date in YYYY-MM-DD format
- **createdAt**: Timestamp (auto-generated)
- **isActive**: Boolean flag for soft deletes

### Enum Values

**Alert Types**: `maintenance`, `delivery`, `license`, `insurance`, `inspection`, `fuel`, `payment`, `other`

**Alert Priority**: `low`, `medium`, `high`, `urgent`

**Gender**: `Male`, `Female`, `Other`

---

## 🎓 Best Practices

1. **Always authenticate** before making requests to protected endpoints
2. **Use meaningful notes** when adding expenses or income
3. **Check response status codes** to verify success
4. **Use appropriate date formats** as specified in the schema
5. **Test with small datasets** first before bulk operations
6. **Download Excel reports** for offline analysis
7. **Use GraphQL** for complex, nested queries
8. **Use REST** for simple operations and Excel exports

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your JWT token is valid
3. Ensure the backend server is running
4. Check that you're using the correct URL format
5. Review the schema definitions in Swagger

---

## 🎉 Quick Start Checklist

- [ ] Start the backend server (`npm start`)
- [ ] Open Swagger UI (`http://localhost:8000/api-docs`)
- [ ] Authenticate with Google OAuth
- [ ] Copy JWT token from response
- [ ] Click "Authorize" and paste token
- [ ] Try a simple GET request (e.g., `/admin/getAlluser`)
- [ ] Explore different endpoint categories
- [ ] Test creating, updating, and deleting resources
- [ ] Try GraphQL queries in the GraphQL Playground
- [ ] Download an Excel report

