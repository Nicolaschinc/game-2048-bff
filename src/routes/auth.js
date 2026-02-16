const express = require("express");
const userService = require("../services/userService");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new Error("Invalid email format");
      error.statusCode = 400;
      throw error;
    }

    if (typeof password !== "string" || password.length < 6) {
      const error = new Error(
        "Password must be at least 6 characters and contain both letters and numbers"
      );
      error.statusCode = 400;
      throw error;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      const error = new Error(
        "Password must be at least 6 characters and contain both letters and numbers"
      );
      error.statusCode = 400;
      throw error;
    }

    const result = await userService.registerUser({ email, password });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    const result = await userService.authenticateUser({ email, password });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
