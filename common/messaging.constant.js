const EXCHANGES = {
  USER_EVENTS: {
    name: "user_events",
    type: "topic",
    options: { durable: true },
  },
};

const ROUTING_KEYS = {
  USER_CREATED: "user.created",
  USER_DELETED: "user.deleted",
};

const NOTIFICATION_WORKERS = [
  {
    name: "Welcome Email",
    exchange: EXCHANGES.USER_EVENTS.name,
    queue: "welcome_email_queue",
    routingKey: ROUTING_KEYS.USER_CREATED,
    processor: "sendWelcomeEmail",
  },
  {
    name: "Admin Alert",
    exchange: EXCHANGES.USER_EVENTS.name,
    queue: "admin_alert_queue",
    routingKey: ROUTING_KEYS.USER_CREATED,
    processor: "logAdminAlert",
  },
];

module.exports = {
  EXCHANGES,
  ROUTING_KEYS,
  NOTIFICATION_WORKERS,
};
