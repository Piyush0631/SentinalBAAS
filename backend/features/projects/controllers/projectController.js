import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import { generateApiKey } from "../../../utils/generateApiKey.js";
import { isSuspiciousInput } from "../../../utils/sanitization.js";
import Project from "../../../models/Project.js";

// ── after imports ──────────────────────────────────────────────
const ALLOWED_TYPES = ["String", "Number", "Boolean"];
const RESERVED_FIELDS = [
  "_id",
  "id",
  "project",
  "createdAt",
  "updatedAt",
  "__v",
];

function validateRecordSchema(schema) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return "recordSchema must be a plain object";
  }
  for (const key in schema) {
    if (RESERVED_FIELDS.includes(key)) {
      return `Field name '${key}' is reserved and cannot be used`;
    }
    const field = schema[key];
    if (!field.type) {
      return `Field '${key}' is missing a type`;
    }
    if (!ALLOWED_TYPES.includes(field.type)) {
      return `Invalid type for field '${key}': ${field.type} — allowed: String, Number, Boolean`;
    }
  }
  return null; // null = valid
}

// ── controllers ────────────────────────────────────────────────
const createProject = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return next(new AppError("Project name is required", 400, "PROJ_001"));
  }

  for (const [key, value] of Object.entries({ name, description })) {
    if (value && isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "PROJ_900"),
      );
    }
  }

  const recordSchema = req.body.recordSchema || null;

  if (recordSchema) {
    for (const [field, def] of Object.entries(recordSchema)) {
      if (isSuspiciousInput(field)) {
        return next(
          new AppError(
            `Suspicious input detected in recordSchema field name: ${field}`,
            400,
            "PROJ_901",
          ),
        );
      }
      if (def && def.type && isSuspiciousInput(def.type)) {
        return next(
          new AppError(
            `Suspicious input detected in recordSchema type for field: ${field}`,
            400,
            "PROJ_902",
          ),
        );
      }
    }

    const schemaError = validateRecordSchema(recordSchema);
    if (schemaError) {
      return next(new AppError(schemaError, 400, "PROJ_003"));
    }
  }

  const apiKey = generateApiKey();
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
    data: { projects },
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id).select("-apiKey");
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJ_002"));
  }
  if (project.owner.toString() !== req.user.id) {
    return next(
      new AppError("Not authorized to access this project", 403, "PROJ_004"),
    );
  }
  res.status(200).json({
    success: true,
    data: { project },
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

  for (const [key, value] of Object.entries({
    name: updates.name,
    description: updates.description,
  })) {
    if (value && isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "PROJ_900"),
      );
    }
  }

  if (updates.recordSchema) {
    for (const [field, def] of Object.entries(updates.recordSchema)) {
      if (isSuspiciousInput(field)) {
        return next(
          new AppError(
            `Suspicious input detected in recordSchema field name: ${field}`,
            400,
            "PROJ_901",
          ),
        );
      }
      if (def && def.type && isSuspiciousInput(def.type)) {
        return next(
          new AppError(
            `Suspicious input detected in recordSchema type for field: ${field}`,
            400,
            "PROJ_902",
          ),
        );
      }
    }

    const schemaError = validateRecordSchema(updates.recordSchema);
    if (schemaError) {
      return next(new AppError(schemaError, 400, "PROJ_003"));
    }
  }

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
