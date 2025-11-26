FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy proto files
COPY ../../docs/proto/analytics.proto /app/proto/analytics.proto
COPY ../../docs/proto/fleet.proto /app/proto/fleet.proto

# Copy application code
COPY . .

# Expose ports
EXPOSE 3004
EXPOSE 50052

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "server.js"]
