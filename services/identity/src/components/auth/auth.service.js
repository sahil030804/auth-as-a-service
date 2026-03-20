const { runInTransaction } = require("../../lib/db-utils");
const argon2 = require("argon2");
const { generateToken } = require("../../lib/token-client");

class AuthService {
  //   async signup(email, password) {
  //     // 1. Get a client from the pool to handle the transaction
  //     const client = await pool.connect();
  //     await client.query("BEGIN");

  //     // 2. Check if user exists
  //     const userResult = await client.query(
  //       "SELECT id FROM users WHERE email = $1",
  //       [email],
  //     );
  //     if (userResult.rows.length > 0) {
  //       throw new Error("User already exists");
  //     }

  //     // 3. Hash password
  //     const passwordHash = await argon2.hash(password);

  //     // 4. Create user in identity_db
  //     const result = await client.query(
  //       "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
  //       [email, passwordHash],
  //     );
  //     const newUser = result.rows[0];

  //     // 5. Generate tokens via Token Service (gRPC call)
  //     let tokens;
  //     try {
  //       tokens = await generateToken(newUser.id, newUser.email);
  //     } catch (grpcError) {
  //       logger.error({ grpcError }, "Failed to call Token Service via gRPC");
  //       await client.query("ROLLBACK");
  //       throw grpcError;
  //     }

  //     await client.query("COMMIT");
  //     client.release();
  //     return { user: newUser, tokens };
  //   }

  async signup(email, password) {
    // We use a helper (see below) to run this inside a transaction automatically
    return await runInTransaction(async (client) => {
      // 1. Check user (Throws if exists, caught by handler)
      const userResult = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );
      if (userResult.rows.length > 0) throw new Error("USER_ALREADY_EXISTS");

      // 2. Hash password
      const passwordHash = await argon2.hash(password);

      // 2. Insert user
      const res = await client.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
        [email, passwordHash],
      );
      const newUser = res.rows[0];

      // 3. gRPC call (If this fails, it naturally throws)
      const tokens = await generateToken(newUser.id, newUser.email);

      return { user: newUser, tokens };
    });
  }
}

module.exports = new AuthService();
