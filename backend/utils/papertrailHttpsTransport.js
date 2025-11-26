const Transport = require("winston-transport");
const axios = require("axios");

class PapertrailHTTPSTransport extends Transport {
  constructor(opts) {
    super(opts);

    this.endpoint = opts.endpoint;
    this.token = opts.token;
  }

  async log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    try {
      // Extract all properties from the info object, excluding Winston internals
      const { message, level, timestamp, ...metadata } = info;

      // Remove Winston-specific properties
      delete metadata[Symbol.for('message')];
      delete metadata[Symbol.for('splat')];
      delete metadata[Symbol.for('level')];

      // Prepare the log entry with all context
      const logEntry = {
        message,
        level,
        timestamp: timestamp || new Date().toISOString(),
        ...metadata  // Spread all additional context (username, ip, truckId, etc.)
      };

      await axios.post(
        this.endpoint,
        logEntry,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`
          }
        }
      );
    } catch (err) {
      // Silently ignore Papertrail HTTPS errors to prevent console clutter
      // The logger will handle critical errors through its own error handling
    }

    callback();
  }
}

module.exports = PapertrailHTTPSTransport;
