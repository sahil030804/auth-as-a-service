const express = require("express");
const authRoutes = require("./components/auth/auth.routes");
const router = express.Router();

router.use("/auth", authRoutes);

module.exports = router;
