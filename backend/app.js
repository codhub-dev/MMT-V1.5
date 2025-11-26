// packages
const express = require("express");
const path = require("path");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");

require("dotenv").config();

// Import centralized logger
const appLogger = require("./utils/logger");

// middleware handlers
const { error } = require("./utils/error");
const isAuthenticated = require("./middleware/isAuthenticated");
const isAdmin = require("./middleware/isAdmin");
const requestLogger = require("./middleware/requestLogger");

// routers
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const trucksRoutes = require("./routes/trucks");
const incomeRoutes = require('./routes/income');
const fuelExpensesRoutes = require("./routes/fuelExpenses");
const defExpensesRoutes = require("./routes/defExpenses");
const otherExpensesRoutes = require("./routes/otherExpenses");
const totalExpensesRoutes = require("./routes/totalExpenses");
const calculateLoanRoutes = require("./routes/calculateLoan");
const driverProfilesRoutes = require("./routes/driverProfiles");
const alertsRoutes = require("./routes/alerts");
const metadata = require("./routes/metadata");
const healthRouter = require("./routes/health");

// express apps
const app = express();

const allowedOrigins = process.env.CORS_URLS ? process.env.CORS_URLS : [];

appLogger.info("Application starting...", {
  nodeEnv: process.env.NODE_ENV,
  allowedOrigins: allowedOrigins.length
});

// Parse JSON and URL-encoded bodies FIRST (before CORS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// middlewares
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Artillery, mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        appLogger.warn("CORS blocked request", { origin });
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Use comprehensive request logging middleware
app.use(requestLogger);

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "public")));

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

appLogger.info("Middleware configured successfully");

// routes
app.use("/api/v1/app/health", healthRouter);
app.use("/api/v1/app/auth", authRouter);
app.use("/api/v1/app/users", isAuthenticated, usersRouter);
app.use("/api/v1/app/admin", isAdmin, adminRouter);
app.use("/", indexRouter);
app.use("/api/v1/app/truck", isAuthenticated, trucksRoutes);
app.use('/api/income', incomeRoutes);
app.use("/api/v1/app/fuelExpenses", isAuthenticated, fuelExpensesRoutes);
app.use("/api/v1/app/defExpenses", isAuthenticated, defExpensesRoutes);
app.use("/api/v1/app/otherExpenses", isAuthenticated, otherExpensesRoutes);
app.use("/api/v1/app/income", isAuthenticated, incomeRoutes);
app.use("/api/v1/app/totalExpenses", isAuthenticated, totalExpensesRoutes);
app.use("/api/v1/app/calculateLoan", isAuthenticated, calculateLoanRoutes);
app.use("/api/v1/app/driverProfiles", isAuthenticated, driverProfilesRoutes);
app.use("/api/v1/app/alerts", isAuthenticated, alertsRoutes);
app.use("/api/v1/app/metadata", isAuthenticated, metadata);

appLogger.info("Routes configured successfully");

// error handler
app.use((err, req, res, next) => {
  appLogger.error("Application error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });

  error(err, req, res, next);
});

appLogger.info("Application initialized successfully");

module.exports = app;
