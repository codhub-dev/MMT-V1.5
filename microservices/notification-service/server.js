const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const Alert = require('./models/Alert');

const app = express();
const PORT = process.env.PORT || 3005;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

let channel = null;
let connection = null;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'notification-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'notification.log' })
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
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mmt_notifications_db';

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Notification Service Database Connected', {
      database: 'mmt_notifications_db',
      host: mongoose.connection.host
    });
  } catch (error) {
    logger.error('Database connection failed', {
      error: error.message
    });
    process.exit(1);
  }
};

// RabbitMQ connection
const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Define exchanges and queues
    const EXCHANGE = 'mmt_events';
    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    const queue = 'notifications_queue';
    await channel.assertQueue(queue, { durable: true });

    // Bind queue to various event types
    const eventTypes = [
      'truck.created',
      'truck.updated',
      'expense.created',
      'expense.threshold.exceeded',
      'income.recorded',
      'maintenance.due',
      'driver.assigned'
    ];

    for (const eventType of eventTypes) {
      await channel.bindQueue(queue, EXCHANGE, eventType);
    }

    logger.info('RabbitMQ connected and queues configured', {
      exchange: EXCHANGE,
      queue: queue,
      eventTypes: eventTypes
    });

    // Start consuming messages
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handleEvent(event, msg.fields.routingKey);
          channel.ack(msg);
        } catch (error) {
          logger.error('Error processing message', {
            error: error.message,
            message: msg.content.toString()
          });
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });

    console.log('🐰 RabbitMQ consumer started');
    console.log('📬 Listening for events:', eventTypes.join(', '));

  } catch (error) {
    logger.error('RabbitMQ connection failed', {
      error: error.message
    });
    // Don't exit - service can still work without message broker
  }
};

// Handle incoming events
const handleEvent = async (event, eventType) => {
  logger.info('Event received', {
    eventType,
    event
  });

  let alertData = {
    userId: event.userId,
    truckId: event.truckId,
    type: 'general',
    title: 'Notification',
    message: 'Event received',
    severity: 'info',
    metadata: event
  };

  // Map event types to alerts
  switch (eventType) {
    case 'truck.created':
      alertData = {
        ...alertData,
        type: 'truck_created',
        title: 'New Truck Added',
        message: `Truck ${event.truckNumber} has been added to your fleet`,
        severity: 'info'
      };
      break;

    case 'expense.threshold.exceeded':
      alertData = {
        ...alertData,
        type: 'expense_threshold',
        title: 'Expense Threshold Exceeded',
        message: `Truck ${event.truckNumber} exceeded expense threshold: $${event.amount}`,
        severity: 'warning'
      };
      break;

    case 'income.recorded':
      alertData = {
        ...alertData,
        type: 'income_recorded',
        title: 'Income Recorded',
        message: `Income of $${event.amount} recorded for truck ${event.truckNumber}`,
        severity: 'info'
      };
      break;

    case 'maintenance.due':
      alertData = {
        ...alertData,
        type: 'maintenance_due',
        title: 'Maintenance Due',
        message: `Truck ${event.truckNumber} is due for maintenance`,
        severity: 'warning'
      };
      break;

    default:
      alertData.message = `Event ${eventType} received`;
  }

  // Save alert to database
  const alert = new Alert(alertData);
  await alert.save();

  logger.info('Alert created from event', {
    alertId: alert._id,
    eventType,
    userId: event.userId
  });

  // In production, send email/SMS/push notification here
  await sendNotification(alert);
};

// Mock notification sender
const sendNotification = async (alert) => {
  // In production, integrate with email service (SendGrid, SES, etc.)
  logger.info('Notification sent', {
    alertId: alert._id,
    type: alert.type,
    userId: alert.userId,
    title: alert.title
  });

  console.log(`📧 Email notification: ${alert.title} → User ${alert.userId}`);
};

// Publish event (helper function for other services to use)
const publishEvent = async (eventType, eventData) => {
  if (!channel) {
    logger.warn('RabbitMQ not connected, cannot publish event');
    return;
  }

  try {
    const EXCHANGE = 'mmt_events';
    const message = JSON.stringify(eventData);

    channel.publish(EXCHANGE, eventType, Buffer.from(message), {
      persistent: true
    });

    logger.info('Event published', {
      eventType,
      eventData
    });
  } catch (error) {
    logger.error('Error publishing event', {
      error: error.message,
      eventType
    });
  }
};

// ==================== REST API ROUTES ====================

// Health check
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'notification-service',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    rabbitmq: channel ? 'connected' : 'disconnected'
  };
  res.status(healthcheck.database === 'connected' ? 200 : 503).json(healthcheck);
});

// Get all alerts for a user
app.get('/api/alerts', async (req, res) => {
  try {
    const { userId, read, type } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (read !== undefined) filter.read = read === 'true';
    if (type) filter.type = type;

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(50);

    logger.info('Alerts fetched', {
      count: alerts.length,
      userId
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    logger.error('Error fetching alerts', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create manual alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { userId, truckId, type, title, message, severity } = req.body;

    const alert = new Alert({
      userId,
      truckId,
      type: type || 'general',
      title,
      message,
      severity: severity || 'info'
    });

    await alert.save();

    logger.info('Manual alert created', {
      alertId: alert._id,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    logger.error('Error creating alert', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark alert as read
app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info('Alert marked as read', { alertId: alert._id });

    res.json({
      success: true,
      message: 'Alert marked as read',
      alert
    });
  } catch (error) {
    logger.error('Error updating alert', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    logger.info('Alert deleted', { alertId: alert._id });

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Publish event endpoint (for testing)
app.post('/api/events/publish', async (req, res) => {
  try {
    const { eventType, eventData } = req.body;

    if (!eventType || !eventData) {
      return res.status(400).json({ error: 'eventType and eventData required' });
    }

    await publishEvent(eventType, eventData);

    res.json({
      success: true,
      message: 'Event published successfully'
    });
  } catch (error) {
    logger.error('Error publishing event', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

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

// Start server
const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();

  app.listen(PORT, () => {
    logger.info(`Notification Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      database: 'mmt_notifications_db',
      rabbitmq: channel ? 'connected' : 'disconnected'
    });
    console.log(`🔔 Notification Service running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💾 Database: mmt_notifications_db`);
  });
};

startServer();

module.exports = app;
