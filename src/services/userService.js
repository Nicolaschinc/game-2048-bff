const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");

const jwtSecret = process.env.JWT_SECRET || "change-me-in-production";
const jwtExpiresIn = "7d";
const maxDailyRegistrations =
  Number(process.env.MAX_DAILY_REGISTRATIONS || 1000);

function generateRandomNickname() {
  const prefixes = ["Player", "User", "Gamer", "Noob", "Pro"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  const nickname = `${prefix}${suffix}`;
  return nickname.slice(0, 10);
}

function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const { passwordHash, ...rest } = user;
  return rest;
}

async function registerUser({ email, password }) {
  const todayCount = await userRepository.countTodayRegistrations();
  if (todayCount >= maxDailyRegistrations) {
    const error = new Error("Daily registration limit exceeded");
    error.statusCode = 429;
    throw error;
  }

  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const error = new Error("User already exists");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const nickname = generateRandomNickname();

  const user = await userRepository.createUser({
    email,
    passwordHash,
    nickname,
  });

  const token = createToken({ userId: user.id });

  return {
    user: sanitizeUser(user),
    token,
  };
}

async function authenticateUser({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  const token = createToken({ userId: user.id });

  return {
    user: sanitizeUser(user),
    token,
  };
}

module.exports = {
  registerUser,
  authenticateUser,
};
