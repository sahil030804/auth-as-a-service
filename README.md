# Auth-as-a-Service

Production-ready authentication platform built with microservices architecture, supporting JWT, OAuth, RBAC, and scalable multi-tenant design.

## 🚀 Features

- **Microservices Architecture**: Separate databases for user management and token storage
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Password Security**: Argon2 hashing for secure password storage
- **Database Management**: PostgreSQL with connection pooling
- **Security Best Practices**: Helmet.js for security headers, CORS support
- **Structured Logging**: Pino logger for production-ready logging
- **Health Monitoring**: Built-in health check endpoint

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (for session management - optional but recommended)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd auth-as-a-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   PORT=3120

   # Database URLs
   USER_DB_URL=postgresql://username:password@localhost:5432/user_db
   TOKEN_DB_URL=postgresql://username:password@localhost:5432/token_db
   ROOT_DB_URL=postgresql://username:password@localhost:5432/postgres
   ```

## 🗄️ Database Setup

1. **Run database migrations**
   ```bash
   npm run migrate
   ```

This will:
- Create `user_db` and `token_db` databases
- Set up the `users` table in `user_db`
- Set up the `refresh_tokens` table in `token_db`

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3120 (or your configured PORT).

## 📊 Database Schema

### Users Database (`user_db`)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Token Database (`token_db`)
```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Service health status

## 🛡️ Security Features

- **Helmet.js**: Security headers protection
- **CORS**: Cross-origin resource sharing configuration
- **Argon2**: Secure password hashing
- **JWT**: JSON Web Token authentication
- **Environment Variables**: Secure configuration management

## 📁 Project Structure

```
src/
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── config/
│   └── logger.js       # Logging configuration
├── lib/
│   └── postgres.js     # Database connection pools
└── migration/
    └── run-init.js     # Database migration script
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start with nodemon for development
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Configured in `.eslintrc.js` and `.prettierrc.json`

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `USER_DB_URL` | PostgreSQL connection for user database | Yes |
| `TOKEN_DB_URL` | PostgreSQL connection for token database | Yes |
| `ROOT_DB_URL` | PostgreSQL admin connection for migrations | Yes |

## 🚨 Important Notes

1. **Database Security**: Ensure your PostgreSQL credentials are secure and not committed to version control
2. **Migration Script**: The migration script requires admin privileges to create databases
3. **Connection Pooling**: The app uses connection pooling for optimal database performance
4. **Error Handling**: Database connection errors will cause the application to exit gracefully

## 📄 License

MIT License
