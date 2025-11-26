const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const winston = require('winston');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const Truck = require('./models/Truck');
const Driver = require('./models/Driver');

const app = express();
const PORT = process.env.PORT || 3002;
const GRPC_PORT = process.env.GRPC_PORT || 50051;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'fleet-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'fleet.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Database connection
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_fleet_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Fleet Service Database Connected', {
      database: 'mmt_fleet_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// ==================== REST API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'fleet-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// Get all trucks
app.get('/api/trucks', async (req, res) => {
  try {
    const { userId, status } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const trucks = await Truck.find(filter).populate('assignedDriverId');

    logger.info('Trucks fetched', {
      count: trucks.length,
      userId,
      status
    });

    res.json({
      success: true,
      count: trucks.length,
      trucks
    });
  } catch (error) {
    logger.error('Error fetching trucks', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create truck
app.post('/api/trucks', async (req, res) => {
  try {
    const { userId, truckNumber, truckName, truckModel, truckCapacity, status } = req.body;

    // Check if truck number already exists
    const existingTruck = await Truck.findOne({ truckNumber });
    if (existingTruck) {
      return res.status(409).json({ error: 'Truck number already exists' });
    }

    const truck = new Truck({
      userId,
      truckNumber,
      truckName,
      truckModel,
      truckCapacity,
      status: status || 'active'
    });

    await truck.save();

    logger.info('Truck created', {
      truckId: truck._id,
      truckNumber: truck.truckNumber
    });

    res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      truck
    });
  } catch (error) {
    logger.error('Error creating truck', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get truck by ID
app.get('/api/trucks/:id', async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id).populate('assignedDriverId');

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    res.json({
      success: true,
      truck
    });
  } catch (error) {
    logger.error('Error fetching truck', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update truck
app.put('/api/trucks/:id', async (req, res) => {
  try {
    const truck = await Truck.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    logger.info('Truck updated', { truckId: truck._id });

    res.json({
      success: true,
      message: 'Truck updated successfully',
      truck
    });
  } catch (error) {
    logger.error('Error updating truck', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete truck
app.delete('/api/trucks/:id', async (req, res) => {
  try {
    const truck = await Truck.findByIdAndDelete(req.params.id);

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    logger.info('Truck deleted', { truckId: truck._id });

    res.json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting truck', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all drivers
app.get('/api/drivers', async (req, res) => {
  try {
    const { userId, available } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (available !== undefined) filter.available = available === 'true';

    const drivers = await Driver.find(filter).populate('assignedTruckId');

    logger.info('Drivers fetched', {
      count: drivers.length,
      userId
    });

    res.json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    logger.error('Error fetching drivers', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create driver
app.post('/api/drivers', async (req, res) => {
  try {
    const { userId, name, licenseNumber, phone, email } = req.body;

    const existingDriver = await Driver.findOne({ licenseNumber });
    if (existingDriver) {
      return res.status(409).json({ error: 'License number already exists' });
    }

    const driver = new Driver({
      userId,
      name,
      licenseNumber,
      phone,
      email
    });

    await driver.save();

    logger.info('Driver created', {
      driverId: driver._id,
      licenseNumber: driver.licenseNumber
    });

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      driver
    });
  } catch (error) {
    logger.error('Error creating driver', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== gRPC SERVER ====================

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../docs/proto/fleet.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const fleetProto = grpc.loadPackageDefinition(packageDefinition).fleet;

// gRPC service implementation
const grpcServiceImpl = {
  GetTrucks: async (call, callback) => {
    try {
      const { userId, status, limit, skip } = call.request;
      const filter = {};

      if (userId) filter.userId = userId;
      if (status) filter.status = status;

      const trucks = await Truck.find(filter)
        .limit(limit || 100)
        .skip(skip || 0)
        .populate('assignedDriverId');

      const total = await Truck.countDocuments(filter);

      const truckList = trucks.map(truck => ({
        id: truck._id.toString(),
        userId: truck.userId,
        truckNumber: truck.truckNumber,
        truckName: truck.truckName,
        truckModel: truck.truckModel,
        truckCapacity: truck.truckCapacity,
        status: truck.status,
        createdAt: truck.createdAt.toISOString(),
        updatedAt: truck.updatedAt.toISOString()
      }));

      logger.info('gRPC: GetTrucks called', { count: trucks.length });

      callback(null, { trucks: truckList, total });
    } catch (error) {
      logger.error('gRPC: GetTrucks error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetTruckById: async (call, callback) => {
    try {
      const truck = await Truck.findById(call.request.id).populate('assignedDriverId');

      if (!truck) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'Truck not found'
        });
      }

      const truckData = {
        id: truck._id.toString(),
        userId: truck.userId,
        truckNumber: truck.truckNumber,
        truckName: truck.truckName,
        truckModel: truck.truckModel,
        truckCapacity: truck.truckCapacity,
        status: truck.status,
        createdAt: truck.createdAt.toISOString(),
        updatedAt: truck.updatedAt.toISOString()
      };

      logger.info('gRPC: GetTruckById called', { truckId: truck._id });

      callback(null, truckData);
    } catch (error) {
      logger.error('gRPC: GetTruckById error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetDrivers: async (call, callback) => {
    try {
      const { userId, available, limit, skip } = call.request;
      const filter = {};

      if (userId) filter.userId = userId;
      if (available !== undefined) filter.available = available;

      const drivers = await Driver.find(filter)
        .limit(limit || 100)
        .skip(skip || 0);

      const total = await Driver.countDocuments(filter);

      const driverList = drivers.map(driver => ({
        id: driver._id.toString(),
        userId: driver.userId,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phone: driver.phone,
        email: driver.email,
        available: driver.available,
        assignedTruckId: driver.assignedTruckId?.toString() || '',
        createdAt: driver.createdAt.toISOString()
      }));

      logger.info('gRPC: GetDrivers called', { count: drivers.length });

      callback(null, { drivers: driverList, total });
    } catch (error) {
      logger.error('gRPC: GetDrivers error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  GetDriverById: async (call, callback) => {
    try {
      const driver = await Driver.findById(call.request.id);

      if (!driver) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'Driver not found'
        });
      }

      const driverData = {
        id: driver._id.toString(),
        userId: driver.userId,
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phone: driver.phone,
        email: driver.email,
        available: driver.available,
        assignedTruckId: driver.assignedTruckId?.toString() || '',
        createdAt: driver.createdAt.toISOString()
      };

      logger.info('gRPC: GetDriverById called', { driverId: driver._id });

      callback(null, driverData);
    } catch (error) {
      logger.error('gRPC: GetDriverById error', { error: error.message });
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  },

  StreamTruckStatus: (call) => {
    logger.info('gRPC: StreamTruckStatus - streaming started');

    // Simulate streaming truck status updates
    const interval = setInterval(() => {
      const status = {
        truckId: call.request.id,
        status: 'active',
        location: 'Highway 101, Mile ' + Math.floor(Math.random() * 100),
        fuelLevel: Math.random() * 100,
        timestamp: new Date().toISOString()
      };

      call.write(status);
    }, 3000);

    call.on('cancelled', () => {
      clearInterval(interval);
      logger.info('gRPC: StreamTruckStatus - client cancelled');
    });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start servers
const startServers = async () => {
  await connectDB();

  // Start REST API server
  app.listen(PORT, () => {
    logger.info(`Fleet Service REST API running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_fleet_db'
    });
    console.log(`🚛 Fleet Service REST API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });

  // Start gRPC server
  const grpcServer = new grpc.Server();
  grpcServer.addService(fleetProto.FleetService.service, grpcServiceImpl);

  grpcServer.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        logger.error('gRPC server failed to start', { error: error.message });
        return;
      }

      logger.info(`Fleet Service gRPC server running on port ${port}`);
      console.log(`🔌 Fleet Service gRPC server running on port ${port}`);
    }
  );
};

startServers();

module.exports = app;
