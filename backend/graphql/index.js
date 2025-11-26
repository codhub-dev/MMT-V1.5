const { ApolloServer } = require('@apollo/server');
const typeDefs = require('./truck-schema');
const truckResolvers = require('./truck-resolvers');

// Create and configure Apollo Server instance
const createApolloServer = async (httpServer) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers: truckResolvers,
    introspection: true, // Enable GraphQL Playground in development
    formatError: (error) => {
      // Custom error formatting
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
      };
    },
  });

  await server.start();
  return server;
};

module.exports = { createApolloServer };
