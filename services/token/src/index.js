require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const jwt = require('jsonwebtoken');
const { pool, connectDB } = require('./lib/postgres');
const logger = require('./config/logger');

const PROTO_PATH = path.resolve(__dirname, '../../../proto/token.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tokenProto = grpc.loadPackageDefinition(packageDefinition).token;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refreshsecret';

const generateToken = async (call, callback) => {
  const { user_id, email } = call.request;
  logger.info({ user_id, email }, 'Generating token for user');

  try {
    const accessToken = jwt.sign({ user_id, email }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ user_id }, REFRESH_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_value, expires_at) VALUES ($1, $2, $3)',
      [user_id, refreshToken, expiresAt]
    );

    callback(null, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Error generating token');
    callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to generate token',
    });
  }
};

const verifyToken = (call, callback) => {
  const { token } = call.request;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    callback(null, {
      valid: true,
      user_id: decoded.user_id,
      email: decoded.email,
    });
  } catch (error) {
    callback(null, { valid: false });
  }
};

const main = async () => {
  await connectDB();

  const server = new grpc.Server();
  server.addService(tokenProto.TokenService.service, {
    GenerateToken: generateToken,
    VerifyToken: verifyToken,
  });

  const PORT = process.env.GRPC_PORT || '50051';
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      logger.error(err, 'Failed to bind gRPC server');
      return;
    }
    logger.info(`Token gRPC Service running on port ${port}`);
  });
};

main();
