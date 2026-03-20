# Microservices Auth Platform (Monorepo)

This repository demonstrates a production-ready authentication platform built with a microservices architecture.

## 🏗️ Architecture

- **Identity Service**: Handles user registration and identity management (REST API + gRPC Client).
- **Token Service**: Handles JWT and refresh token generation/validation (gRPC Server).
- **Notification Service**: Handles asynchronous events like sending welcome emails (Message Broker Consumer).
- **PostgreSQL**: Two separate databases (`identity_db` and `token_db`) for data isolation.
- **RabbitMQ**: Message broker for asynchronous service-to-service communication.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Running with Docker

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Run Migrations**
   (While the containers are running)
   ```bash
   docker-compose exec identity-service node src/migration/run-init.js
   docker-compose exec token-service node src/migration/run-init.js
   ```

### API Endpoints

- `POST /signup` - User registration (Identity Service: `http://localhost:3001/signup`)
  - Request body: `{ "email": "user@example.com", "password": "securepassword" }`

## 🛡️ Key Features

- **Database-per-Service**: Identity and Token services have their own isolated PostgreSQL databases.
- **Low-Latency Communication**: Synchronous communication between services uses gRPC.
- **Event-Driven Architecture**: Asynchronous actions (notifications) are handled via RabbitMQ.
- **Strict Decoupling**: Services do not share database connections or logic.
