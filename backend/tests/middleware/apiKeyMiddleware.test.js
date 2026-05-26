import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import Project from "../../models/Project.js";
import Record from "../../models/Record.js";
import RequestLog from "../../models/RequestLog.js";
import User from "../../models/User.js";
import { createTestUser, generateJWT } from "../helpers/auth.js";

jest.setTimeout(20000);

async function createProjectWithApiKey(userOverrides = {}, projectBody = {}) {
  const user = await createTestUser(userOverrides);
  const token = generateJWT(user);

  const res = await request(app)
    .post("/api/v1/projects")
    .set("Cookie", [`token=${token}`])
    .send({
      name: "Middleware Project",
      description: "Project for middleware tests",
      recordSchema: {
        title: { type: "String", required: true },
        count: { type: "Number", required: true },
      },
      ...projectBody,
    });

  return {
    user,
    token,
    projectId: res.body.data.project.id,
    apiKey: res.body.data.apiKey,
  };
}

async function waitForRequestLog(projectId, path) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const log = await RequestLog.findOne({ projectId, path }).sort({
      timestamp: -1,
    });
    if (log) return log;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

describe("API Key Middleware", () => {
  beforeEach(async () => {
    await Record.deleteMany({});
    await RequestLog.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
  });

  describe("POST /api/v1/projects/:projectId/records", () => {
    it("should return 401 when the API key is missing", async () => {
      const { projectId } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .send({ title: "No Key", count: 1 });

      expect(res.statusCode).toBe(401);
    });

    it("should return 400 when the API key is malformed", async () => {
      const { projectId } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", "bad-key-format")
        .send({ title: "Bad Key", count: 1 });

      expect(res.statusCode).toBe(400);
    });

    it("should resolve the correct project for a valid API key", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Valid Key", count: 5 });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.record.project).toBe(projectId);
    });

    it("should return 403 when the projectId in the URL does not match the API key project", async () => {
      const firstProject = await createProjectWithApiKey({
        username: "owner-a",
        email: "owner-a@example.com",
      });
      const secondProject = await createProjectWithApiKey({
        username: "owner-b",
        email: "owner-b@example.com",
      });

      const res = await request(app)
        .post(`/api/v1/projects/${secondProject.projectId}/records`)
        .set("x-api-key", firstProject.apiKey)
        .send({ title: "Mismatch", count: 1 });

      expect(res.statusCode).toBe(403);
    });

    it("should never store the raw API key in RequestLog headers", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();
      const path = `/api/v1/projects/${projectId}/records`;

      const res = await request(app)
        .post(path)
        .set("x-api-key", apiKey)
        .send({ title: "Log Test", count: 9 });

      expect(res.statusCode).toBe(201);

      const log = await waitForRequestLog(projectId, path);
      expect(log).not.toBeNull();
      expect(log.headers["x-api-key"]).toBe("[REDACTED]");
      expect(log.headers["x-api-key"]).not.toBe(apiKey);
    });
  });
});
