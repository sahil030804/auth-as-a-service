FROM node:18-slim

WORKDIR /app

# Copy service-specific files from the root context
COPY services/token/package*.json ./
RUN npm install --production

COPY services/token/src/ ./src/
COPY proto/ ../../proto/

EXPOSE 50051

CMD ["node", "src/index.js"]
