FROM node:18-alpine

WORKDIR /app

# Install dependencies for Redis
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 50052 50053

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:50053/health || exit 1

CMD ["node", "src/index.js"]
