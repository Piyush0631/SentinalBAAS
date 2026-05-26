import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import Project from "../../models/Project.js";
import User from "../../models/User.js";
import { createTestUser, generateJWT } from "../helpers/auth.js";

jest.setTimeout(20000);

describe("Project Endpoints", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
  });

  describe("POST /api/v1/projects", () => {
    it("should create a project", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);

      const res = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${token}`])
        .send({
          name: "Project Alpha",
          description: "First project",
          recordSchema: {
            title: { type: "String", required: true },
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.apiKey).toMatch(/^sk_proj_[a-f0-9]{12}$/);
      expect(res.body.data.project.name).toBe("Project Alpha");
      expect(res.body.data.project.description).toBe("First project");
    });

    it("should fail when name is missing", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);

      const res = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${token}`])
        .send({ description: "No name" });

      expect(res.statusCode).toBe(400);
    });

    it("should fail when unauthenticated", async () => {
      const res = await request(app).post("/api/v1/projects").send({
        name: "Project Alpha",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/projects", () => {
    it("should return all projects for the authenticated user", async () => {
      const owner = await createTestUser({
        username: "owner1",
        email: "owner1@example.com",
      });
      const otherUser = await createTestUser({
        username: "owner2",
        email: "owner2@example.com",
      });
      const ownerToken = generateJWT(owner);
      const otherToken = generateJWT(otherUser);

      await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${ownerToken}`])
        .send({ name: "Owner Project", description: "Owned by first user" });

      await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${otherToken}`])
        .send({ name: "Other Project", description: "Owned by second user" });

      const res = await request(app)
        .get("/api/v1/projects")
        .set("Cookie", [`token=${ownerToken}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.projects).toHaveLength(1);
      expect(res.body.data.projects[0].name).toBe("Owner Project");
      expect(res.body.data.projects[0].apiKey).toBeUndefined();
    });
  });

  describe("GET /api/v1/projects/:projectId", () => {
    it("should return a project by id", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);

      const createRes = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${token}`])
        .send({
          name: "Project Beta",
          description: "Project to fetch",
        });

      const projectId = createRes.body.data.project.id;
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set("Cookie", [`token=${token}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.project.id).toBe(projectId);
      expect(res.body.data.project.name).toBe("Project Beta");
      expect(res.body.data.project.apiKey).toBeUndefined();
    });

    it("should return 404 when project is not found", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);
      const fakeProjectId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/projects/${fakeProjectId}`)
        .set("Cookie", [`token=${token}`]);

      expect(res.statusCode).toBe(404);
    });

    it("should return 403 when wrong owner requests the project", async () => {
      const owner = await createTestUser({
        username: "realowner",
        email: "realowner@example.com",
      });
      const otherUser = await createTestUser({
        username: "intruder",
        email: "intruder@example.com",
      });
      const ownerToken = generateJWT(owner);
      const otherToken = generateJWT(otherUser);

      const createRes = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${ownerToken}`])
        .send({ name: "Protected Project" });

      const projectId = createRes.body.data.project.id;
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set("Cookie", [`token=${otherToken}`]);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("PATCH /api/v1/projects/:projectId", () => {
    it("should update a project", async () => {
      const user = await createTestUser();
      const token = generateJWT(user);

      const createRes = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${token}`])
        .send({ name: "Old Project Name", description: "Old description" });

      const projectId = createRes.body.data.project.id;
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Cookie", [`token=${token}`])
        .send({
          name: "Updated Project Name",
          description: "Updated description",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.project.name).toBe("Updated Project Name");
      expect(res.body.data.project.description).toBe("Updated description");
    });

    it("should return 403 when wrong owner updates the project", async () => {
      const owner = await createTestUser({
        username: "updateowner",
        email: "updateowner@example.com",
      });
      const otherUser = await createTestUser({
        username: "updateintruder",
        email: "updateintruder@example.com",
      });
      const ownerToken = generateJWT(owner);
      const otherToken = generateJWT(otherUser);

      const createRes = await request(app)
        .post("/api/v1/projects")
        .set("Cookie", [`token=${ownerToken}`])
        .send({ name: "Updatable Project" });

      const projectId = createRes.body.data.project.id;
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}`)
        .set("Cookie", [`token=${otherToken}`])
        .send({ name: "Hacked Name" });

      expect(res.statusCode).toBe(403);
    });
  });
});
