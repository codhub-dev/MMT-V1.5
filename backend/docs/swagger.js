// backend/docs/swagger.js
const path = require('path');
const YAML = require('yamljs');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ManageMyTruck (MMT) Backend API',
      version: '1.0.0',
      description: `
        🚛 **ManageMyTruck (MMT)** is a cloud-based fleet and expense management platform 
        designed to help transport businesses track trucks, manage expenses, loans, and 
        maintenance — all in one place.

        This documentation provides detailed API information for backend services 
        powering the MMT platform, including authentication, truck management, expenses, 
        metadata, and more.
      `,
      contact: {
        name: 'Team AWengerS — APIBP-20242YB-Team-09',
        email: 'support@managemytruck.me',
        url: 'https://managemytruck.me',
      },
      license: {
        name: 'MIT License',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Local Development Server',
      },
      {
        url: 'https://warranty.managemytruck.me',
        description: 'Production Server (MMT Cloud)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format **Bearer <token>**',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Something went wrong',
            },
            status: {
              type: 'boolean',
              example: false,
            },
            code: {
              type: 'integer',
              example: 500,
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            status: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              example: { id: '12345', details: 'Sample data' },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: 'Health', description: 'System health and uptime monitoring' },
      { name: 'Auth', description: 'Authentication and user access APIs' },
      { name: 'User Profile', description: 'User profile and preferences' },
      { name: 'Truck Management', description: 'Truck CRUD operations and tracking' },
      { name: 'Expenses', description: 'Fuel, DEF, and other expense management' },
      { name: 'Loan', description: 'Loan management and calculations' },
      { name: 'Metadata', description: 'Analytics and truck/user metadata' },
      { name: 'Admin', description: 'Administrative and system management APIs' },
    ],
  },

  apis: [path.join(__dirname, '../routes/**/*.js')],
};

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

module.exports = swaggerDocument || swaggerJsdoc(options);
