require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const pinoHttp = require('pino-http');
const argon2 = require('argon2');
const joi = require('joi');
const { pool, connectDB } = require('./lib/postgres');
const { connectRabbitMQ, emitUserCreated } = require('./lib/rabbitmq');
const { generateToken } = require('./lib/token-client');
const logger = require('./config/logger');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(pinoHttp({ logger }));

const signupSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(6).required(),
});

app.post('/signup', async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = value;

  try {
    // 1. Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 2. Hash password
    const passwordHash = await argon2.hash(password);

    // 3. Create user in identity_db
    const insertResult = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    const newUser = insertResult.rows[0];

    // 4. Generate tokens via Token Service (gRPC call)
    let tokens;
    try {
      tokens = await generateToken(newUser.id, newUser.email);
    } catch (grpcError) {
      logger.error({ grpcError }, 'Failed to call Token Service via gRPC');
      // Decide if we should rollback user creation or proceed.
      // For this example, we'll inform the user that signup was partially successful or failed.
      return res.status(500).json({ error: 'Failed to generate user tokens' });
    }

    // 5. Emit event for async actions (Welcome Email, etc.)
    emitUserCreated(newUser);

    // 6. Return response
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        created_at: newUser.created_at,
      },
      tokens,
    });
  } catch (err) {
    logger.error({ err }, 'Signup error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'identity' });
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  app.listen(PORT, () => {
    logger.info(`Identity Service (REST) running on port ${PORT}`);
  });
};

start();
