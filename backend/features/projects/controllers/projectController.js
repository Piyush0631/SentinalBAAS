import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import { generateApiKey } from "../../../utils/generateApiKey.js";
import { isSuspiciousInput } from "../../../utils/sanitization.js";
import Project from "../../../models/Project.js";
import * as projectValidator from "../validators/projectValidator.js";

const createProject = catchAsync(async (req, res, next) => {
  const validated = projectValidator.createProjectSchema.parse(req.body);
   const { name, description, recordSchema } = validated;


  for (const [key, value] of Object.entries({ name, description })) {
    if (value && isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "PROJ_900"),
      );
    }
  }

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
  const project = await Project.findById(req.params.projectId).select(
    "-apiKey",
  );
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
  const validated = projectValidator.updateProjectSchema.parse(req.body);
  const { name, description, recordSchema } = validated;

  for (const [key, value] of Object.entries({ name, description })) {
    if (value && isSuspiciousInput(value)) {
      return next(
        new AppError(`Suspicious input detected in ${key}`, 400, "PROJ_900"),
      );
    }
  }
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
  }

  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJ_002"));
  }
  if (project.owner.toString() !== req.user.id) {
    return next(
      new AppError("Not authorized to update this project", 403, "PROJ_004"),
    );
  }
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  if (recordSchema !== undefined) project.recordSchema = recordSchema;
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
