import User from "../../models/User.js";
import jwt from "jsonwebtoken";

// Creates and saves a test user in the DB
export async function createTestUser(overrides = {}) {
  const user = new User({
    username: "testuser" + Date.now(),
    email: "test" + Date.now() + "@example.com",
    password: "TestPass123!",
    ...overrides,
  });
  await user.save();
  return user;
}

// Generates a JWT token for a user
export function generateJWT(user) {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username },
    process.env.JWT_SECRET || "testsecret",
    { expiresIn: "1h" },
  );
}
