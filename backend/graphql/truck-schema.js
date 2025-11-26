const { gql } = require('graphql-tag');

const typeDefs = gql`
  type Truck {
    id: ID!
    addedBy: String!
    registrationNo: String!
    createdAt: String
    isFinanced: Boolean
    financeAmount: Float
    make: String
    model: String
    year: Int
    imgURL: [String]
    chassisNo: String
    engineNo: String
    desc: String
  }

  type TruckResponse {
    message: String!
    truck: Truck
  }

  type TrucksResponse {
    message: String!
    trucks: [Truck]
  }

  type DeleteResponse {
    message: String!
    success: Boolean!
  }

  input TruckInput {
    addedBy: String!
    registrationNo: String!
    isFinanced: Boolean
    financeAmount: Float
    make: String
    model: String
    year: Int
    imgURL: [String]
    chassisNo: String
    engineNo: String
    desc: String
  }

  input TruckUpdateInput {
    registrationNo: String
    isFinanced: Boolean
    financeAmount: Float
    make: String
    model: String
    year: Int
    imgURL: [String]
    chassisNo: String
    engineNo: String
    desc: String
  }

  type Query {
    """
    Get a truck by its ID
    """
    getTruckById(id: ID!): TruckResponse!

    """
    Get all trucks in the system
    """
    getAllTrucks: TrucksResponse!

    """
    Get all trucks added by a specific user
    """
    getAllTrucksByUser(addedBy: String!): TrucksResponse!
  }

  type Mutation {
    """
    Add a new truck to the system
    """
    addTruck(input: TruckInput!): TruckResponse!

    """
    Update an existing truck by ID
    """
    updateTruckById(id: ID!, input: TruckUpdateInput!): TruckResponse!

    """
    Delete a truck and all its associated expenses
    """
    deleteTruckById(id: ID!): DeleteResponse!
  }
`;

module.exports = typeDefs;
