function validateRecordSchema(schema) {
  if (!schema || typeof schema !== "object") return;
  const allowedTypes = ["String", "Number", "Boolean"];
  for (const key in schema) {
    const field = schema[key];
    if (!allowedTypes.includes(field.type)) {
      throw new AppError(
        `Invalid type for field ${key}: ${field.type}`,
        400,
        "INVALID_SCHEMA",
      );
    }
  }
}
import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import { generateApiKey } from "../../../utils/generateApiKey.js";

import Project from "../../../models/Project.js";
const createProject = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  if (!name) {
    return next(new AppError("Project name is required", 400, "PROJ_001"));
  }
  const apiKey = generateApiKey();
  const recordSchema = req.body.recordSchema || null;
  if (recordSchema) validateRecordSchema(recordSchema);
  const newProject = await Project.create({
    name,
    description,
    owner: req.user.id,
    apiKey,
    recordSchema,
  });
  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: {
      project: {
        id: newProject._id,
        name: newProject.name,
        description: newProject.description,
        apiKey: newProject.apiKey,
      },
    },
  });
});

const getProjects = catchAsync(async (req, res) => {
  const projects = await Project.find({ owner: req.user.id }).select("-apiKey");

  res.status(200).json({
    success: true,
    data: {
      projects,
    },
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).select("-apiKey");
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJ_002"));
  }
  // Only allow access if the authenticated user is the owner
  if (project.owner.toString() !== req.user.id) {
    return next(
      new AppError("Not authorized to access this project", 403, "PROJ_004"),
    );
  }
  res.status(200).json({
    success: true,
    data: {
      project,
    },
  });
});

const updateProject = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;
  const updates = {};
  const allowedFields = ["name", "description", "recordSchema"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJ_002"));
  }
  if (project.owner.toString() !== req.user.id) {
    return next(
      new AppError("Not authorized to update this project", 403, "PROJ_004"),
    );
  }
  Object.assign(project, updates);
  await project.save();
  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: {
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        recordSchema: project.recordSchema,
      },
    },
  });
});
export default {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
};
