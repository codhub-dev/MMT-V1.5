# GraphQL Implementation for Truck Services

This directory contains the GraphQL implementation for truck management operations.

## Overview

The truck services have been migrated from REST API to GraphQL, providing a more flexible and efficient way to query and mutate truck data.

## Files

- **truck-schema.js** - GraphQL type definitions and schema
- **truck-resolvers.js** - Resolver functions that handle GraphQL queries and mutations
- **index.js** - Apollo Server setup and configuration

## GraphQL Endpoint

**URL**: `http://localhost:8000/graphql`

The GraphQL endpoint is available at `/graphql` and provides an interactive GraphQL Playground for testing queries and mutations.

## Available Operations

### Queries

#### 1. Get Truck by ID
```graphql
query {
  getTruckById(id: "507f1f77bcf86cd799439012") {
    message
    truck {
      id
      registrationNo
      make
      model
      year
      isFinanced
      financeAmount
      imgURL
      chassisNo
      engineNo
      desc
      createdAt
      addedBy
    }
  }
}
```

#### 2. Get All Trucks
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
      addedBy
    }
  }
}
```

#### 3. Get Trucks by User
```graphql
query {
  getAllTrucksByUser(addedBy: "507f1f77bcf86cd799439011") {
    message
    trucks {
      id
      registrationNo
      make
      model
      year
    }
  }
}
```

### Mutations

#### 1. Add Truck
```graphql
mutation {
  addTruck(input: {
    addedBy: "507f1f77bcf86cd799439011"
    registrationNo: "TRK-1234-AB"
    make: "Volvo"
    model: "VNL 760"
    year: 2023
    isFinanced: true
    financeAmount: 50000.00
    imgURL: ["https://example.com/truck.jpg"]
    chassisNo: "4V4NC9EJ1EN123456"
    engineNo: "D13TC500123"
    desc: "Heavy-duty long-haul truck"
  }) {
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

#### 2. Update Truck
```graphql
mutation {
  updateTruckById(
    id: "507f1f77bcf86cd799439012"
    input: {
      registrationNo: "TRK-5678-XY"
      make: "Freightliner"
      model: "Cascadia"
      year: 2024
      isFinanced: false
    }
  ) {
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

#### 3. Delete Truck
```graphql
mutation {
  deleteTruckById(id: "507f1f77bcf86cd799439012") {
    message
    success
  }
}
```

## Input Types

### TruckInput (for adding trucks)
```graphql
{
  addedBy: String!         # Required: User ID who owns the truck
  registrationNo: String!  # Required: Truck registration number
  isFinanced: Boolean      # Optional: Whether truck is financed
  financeAmount: Float     # Optional: Finance amount if applicable
  make: String             # Optional: Truck manufacturer
  model: String            # Optional: Truck model
  year: Int                # Optional: Manufacturing year
  imgURL: [String]         # Optional: Array of image URLs
  chassisNo: String        # Optional: Chassis number
  engineNo: String         # Optional: Engine number
  desc: String             # Optional: Description
}
```

### TruckUpdateInput (for updating trucks)
```graphql
{
  registrationNo: String   # Optional: Truck registration number
  isFinanced: Boolean      # Optional: Whether truck is financed
  financeAmount: Float     # Optional: Finance amount
  make: String             # Optional: Truck manufacturer
  model: String            # Optional: Truck model
  year: Int                # Optional: Manufacturing year
  imgURL: [String]         # Optional: Array of image URLs
  chassisNo: String        # Optional: Chassis number
  engineNo: String         # Optional: Engine number
  desc: String             # Optional: Description
}
```

## Response Types

### TruckResponse
```graphql
{
  message: String!
  truck: Truck
}
```

### TrucksResponse
```graphql
{
  message: String!
  trucks: [Truck]
}
```

### DeleteResponse
```graphql
{
  message: String!
  success: Boolean!
}
```

## Testing

### Using GraphQL Playground

1. Start the server: `npm start`
2. Open your browser and navigate to `http://localhost:8000/graphql`
3. Use the interactive playground to test queries and mutations
4. Check the "Docs" tab on the right for auto-generated documentation

### Using cURL

```bash
# Query Example
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ getAllTrucks { message trucks { id registrationNo make model } } }"
  }'

# Mutation Example
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($input: TruckInput!) { addTruck(input: $input) { message truck { id registrationNo } } }",
    "variables": {
      "input": {
        "addedBy": "user123",
        "registrationNo": "TRK-9999",
        "make": "Volvo",
        "model": "FH16",
        "year": 2023
      }
    }
  }'
```

## Error Handling

GraphQL errors are returned in the following format:

```json
{
  "errors": [
    {
      "message": "Invalid truck ID",
      "locations": [{"line": 2, "column": 3}],
      "path": ["getTruckById"]
    }
  ]
}
```

## Features

- **Type Safety**: GraphQL provides strong typing for all operations
- **Flexible Queries**: Request only the fields you need
- **Single Endpoint**: All operations go through `/graphql`
- **Introspection**: Auto-generated documentation
- **Batch Operations**: Support for multiple queries in a single request
- **Real-time Validation**: Input validation at schema level

## Integration with REST API

The REST API endpoints for trucks are still available for backward compatibility:

- POST `/api/v1/app/truck/addTruck`
- GET `/api/v1/app/truck/getAllTrucks`
- GET `/api/v1/app/truck/getTruckById/:id`
- GET `/api/v1/app/truck/getAllTrucksByUser/:addedBy`
- PUT `/api/v1/app/truck/updateTruckById/:id`
- DELETE `/api/v1/app/truck/deleteTruckById/:id`

## Dependencies

- `@apollo/server` - Apollo Server for GraphQL
- `graphql` - GraphQL.js library
- `graphql-tag` - Template literal tag for GraphQL queries

## Notes

- The GraphQL endpoint automatically deletes associated expenses (fuel, DEF, other) when a truck is deleted
- All date fields are returned in ISO 8601 format
- The `id` field in responses corresponds to MongoDB's `_id`
