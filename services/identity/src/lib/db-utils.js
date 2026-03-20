const { pool } = require("./postgres");

module.exports = {
  async runInTransaction(callback) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client); // Runs your service logic
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error; // Let the Global Error Handler catch this
    } finally {
      client.release();
    }
  },
};
