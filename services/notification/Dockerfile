FROM node:18-slim

WORKDIR /app

# Copy service-specific files from the root context
COPY services/notification/package*.json ./
RUN npm install --production

COPY services/notification/src/ ./src/

CMD ["node", "src/index.js"]
