const mongoose = require("mongoose");
const logger = require("../utils/logger");

module.exports.connectDB = async () => {
    try {
        logger.info("Attempting to connect to MongoDB...", { url: process.env.MONGODB_URL?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') });
        
        mongoose.set('strictQuery', true)
        const dbinstance = await mongoose.connect(process.env.MONGODB_URL);
        
        logger.info("Database Connected Successfully", {
            host: dbinstance.connection.host,
            name: dbinstance.connection.name,
            port: dbinstance.connection.port
        });
        
        return dbinstance;
    } catch (error) {
        logger.error("Database Connection Failed", {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}