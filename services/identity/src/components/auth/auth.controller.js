const { emitEventToQueue } = require("../../lib/rabbitmq");
const authService = require("./auth.service");
const { features } =
  require("../../config")[process.env.NODE_ENV || "development"];
const { EXCHANGES, ROUTING_KEYS } = require("common");

class AuthController {
  async signup(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.signup(email, password);

      if (features.sendWelcomeEmail) {
        emitEventToQueue(
          "USER_CREATED",
          EXCHANGES.USER_EVENTS.name,
          ROUTING_KEYS.USER_CREATED,
          {
            id: result.user.id,
            email: result.user.email,
            timestamp: new Date().toISOString(),
          },
        );
      }

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
