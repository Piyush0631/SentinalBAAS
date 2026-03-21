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
  const newProject = await Project.create({
    name,
    description,
    owner: req.user.id,
    apiKey,
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

export default {
  createProject,
  getProjects,
  getProjectById,
};
