FROM node:18-slim

# Install build tools for native modules like argon2
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy service-specific files from the root context
COPY services/identity/package*.json ./
RUN npm install --production

COPY services/identity/src/ ./src/
COPY proto/ ../../proto/

EXPOSE 3001

CMD ["node", "src/index.js"]
