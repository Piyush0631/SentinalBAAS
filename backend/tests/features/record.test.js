import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import Project from "../../models/Project.js";
import Record from "../../models/Record.js";
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
      name: "Records Project",
      description: "Project for record tests",
      recordSchema: {
        title: { type: "String", required: true },
        count: { type: "Number", required: true },
        active: { type: "Boolean", required: false },
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

describe("Record Endpoints", () => {
  beforeEach(async () => {
    await Record.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
  });

  describe("POST /api/v1/projects/:projectId/records", () => {
    it("should create a record with a valid API key", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({
          title: "Record One",
          count: 10,
          active: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.record.data.title).toBe("Record One");
      expect(res.body.data.record.data.count).toBe(10);
      expect(res.body.data.record.data.active).toBe(true);
    });

    it("should fail when API key is missing", async () => {
      const { projectId } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .send({ title: "Record One", count: 10 });

      expect(res.statusCode).toBe(401);
    });

    it("should fail when API key is invalid", async () => {
      const { projectId } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", "sk_proj_invalidkey123")
        .send({ title: "Record One", count: 10 });

      expect(res.statusCode).toBe(401);
    });

    it("should fail schema validation when required field is missing", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ count: 10 });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/v1/projects/:projectId/records", () => {
    it("should return all records with filters and pagination", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Record A", count: 5, active: true });
      await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Record B", count: 10, active: false });
      await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Record C", count: 15, active: true });

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .query({
          "count[gte]": 10,
          page: 2,
          limit: 1,
          sortBy: "count",
          order: "asc",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.page).toBe(2);
      expect(res.body.data.limit).toBe(1);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.records[0].data.count).toBe(15);
    });
  });

  describe("GET /api/v1/projects/:projectId/records/:recordId", () => {
    it("should return a record by id", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const createRes = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Fetch Me", count: 7, active: true });

      const recordId = createRes.body.data.record._id;
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/records/${recordId}`)
        .set("x-api-key", apiKey);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.record._id).toBe(recordId);
      expect(res.body.data.record.data.title).toBe("Fetch Me");
    });

    it("should return 404 when record is not found", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();
      const fakeRecordId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/records/${fakeRecordId}`)
        .set("x-api-key", apiKey);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/v1/projects/:projectId/records/:recordId", () => {
    it("should update a record", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const createRes = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Old Title", count: 1, active: false });

      const recordId = createRes.body.data.record._id;
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/records/${recordId}`)
        .set("x-api-key", apiKey)
        .send({ title: "New Title", count: 2, active: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.record.data.title).toBe("New Title");
      expect(res.body.data.record.data.count).toBe(2);
      expect(res.body.data.record.data.active).toBe(true);
    });
  });

  describe("DELETE /api/v1/projects/:projectId/records/:recordId", () => {
    it("should delete a record and return 204 with no body", async () => {
      const { projectId, apiKey } = await createProjectWithApiKey();

      const createRes = await request(app)
        .post(`/api/v1/projects/${projectId}/records`)
        .set("x-api-key", apiKey)
        .send({ title: "Delete Me", count: 3, active: false });

      const recordId = createRes.body.data.record._id;
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}/records/${recordId}`)
        .set("x-api-key", apiKey);

      expect(res.statusCode).toBe(204);
      expect(res.text).toBe("");

      const deleted = await Record.findById(recordId);
      expect(deleted).toBeNull();
    });
  });
});
