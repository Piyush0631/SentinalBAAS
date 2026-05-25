import request from "supertest";
import app from "../../app.js";
import { createTestUser, generateJWT } from "../helpers/auth.js";
import User from "../../models/User.js";

jest.setTimeout(20000);

describe("Auth Endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a user (success)", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "TestPass123!",
      });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("data.user");
    });

    it("should fail with missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .send({ email: "test@example.com" });
      expect(res.statusCode).toBe(400);
    });

    it("should fail with duplicate email", async () => {
      await createTestUser({ email: "test@example.com" });
      const res = await request(app).post("/api/v1/auth/register").send({
        username: "anotheruser",
        email: "test@example.com",
        password: "TestPass123!",
      });
      expect(res.statusCode).toBe(400);
    });

    it("should fail with duplicate username", async () => {
      await createTestUser({ username: "testuser" });
      const res = await request(app).post("/api/v1/auth/register").send({
        username: "testuser",
        email: "unique@example.com",
        password: "TestPass123!",
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully", async () => {
      await createTestUser({
        email: "login@example.com",
        username: "loginuser",
      });
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "login@example.com",
        password: "TestPass123!",
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data.user");
    });

    it("should fail with wrong password", async () => {
      await createTestUser({ email: "wrongpass@example.com" });
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "wrongpass@example.com",
        password: "WrongPass!",
      });
      expect(res.statusCode).toBe(401);
    });

    it("should fail if user not found", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "notfound@example.com",
        password: "TestPass123!",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return user if authenticated", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Cookie", [`token=${token}`]);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data.user");
    });

    it("should fail with no token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("should logout successfully", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);
      const res = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", [`token=${token}`]);
      expect(res.statusCode).toBe(200);
    });
  });
});
