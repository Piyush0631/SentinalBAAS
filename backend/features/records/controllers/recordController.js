import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import Record from "../../../models/Record.js";
import { validateRecordData } from "../services/recordService.js";
export const createRecord = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  // Validate strictly for creation
  validateRecordData(project.recordSchema, req.body, { partial: false });
  const record = await Record.create({
    project: project._id,
    data: req.body,
  });
  res.status(201).json({
    success: true,
    data: { record },
  });
});

export const getRecords = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  const records = await Record.find({ project: project._id });
  res.status(200).json({
    success: true,
    data: { records },
  });
});

export const getRecordById = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  const record = await Record.findOne({
    _id: req.params.id,
    project: project._id,
  });
  if (!record) {
    return next(new AppError("Record not found", 404, "RECORD_003"));
  }
  res.status(200).json({
    success: true,
    data: { record },
  });
});

export const updateRecord = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  const record = await Record.findOne({
    _id: req.params.id,
    project: project._id,
  });
  if (!record) {
    return next(new AppError("Record not found", 404, "RECORD_003"));
  }
  // Validate partially for update
  validateRecordData(project.recordSchema, req.body, { partial: true });
  record.data = { ...record.data, ...req.body };
  await record.save();
  res.status(200).json({
    success: true,
    data: { record },
  });
});

export const deleteRecord = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  const record = await Record.findOneAndDelete({
    _id: req.params.id,
    project: project._id,
  });
  if (!record) {
    return next(new AppError("Record not found", 404, "RECORD_003"));
  }
  res.status(204).json({
    success: true,
    data: null,
  });
});
