const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { validate } = require("../../middleware/validation");
const authSchema = require("./auth.validation");

router.post("/signup", validate(authSchema.signup), authController.signup);

module.exports = router;
