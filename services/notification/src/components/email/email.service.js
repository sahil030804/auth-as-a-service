const { Resend } = require("resend");
const logger = require("../../config/logger");
const { messaging } =
  require("../../config")[process.env.NODE_ENV || "development"];

class EmailService {
  constructor() {
    this.resend = new Resend(messaging.resendApiKey);
    this.fromEmail = messaging.emailFrom;
  }

  async send({ to, subject, html }) {
    try {
      if (!this.resend) {
        // Fallback: log email content when API key is missing
        logger.info({
          to,
          subject,
          html: html.substring(0, 200) + "...",
          message: "📧 EMAIL_LOG_ONLY - Resend not configured",
        });
        return { id: "log-only", to, subject };
      }

      const data = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      logger.info({ emailId: data.id, to }, "📧 Email sent successfully");
      return data;
    } catch (error) {
      logger.error({ error: error.message, to }, "❌ Failed to send email");
      throw error;
    }
  }

  async sendWelcomeEmail(payload) {
    const { email, name } = payload;

    return this.send({
      to: email,
      subject: `Welcome to the Marketplace, ${name}!`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h1>Welcome aboard!</h1>
          <p>Hi ${name}, we're glad to have you. Your account is now active.</p>
          <hr />
          <small>If you didn't create this account, please ignore this email.</small>
        </div>
      `,
    });
  }

  async logAdminAlert(payload) {
    const { email, id } = payload;
    logger.info({
      message: "🚨 ADMIN ALERT: New user created",
      userId: id,
      userEmail: email,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new EmailService();
