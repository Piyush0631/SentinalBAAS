import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import Record from "../../../models/Record.js";
import { validateRecordData } from "../services/recordService.js";
import {
  filterRecordsQuery,
  buildQueryOptions,
  getRecordsService,
} from "../services/filterRecordsQuery.js";
export const createRecord = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  if (req.params.projectId && project._id.toString() !== req.params.projectId) {
    return next(
      new AppError(
        "Project ID and API key do not match",
        403,
        "PROJECT_MISMATCH",
      ),
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
  if (req.params.projectId && project._id.toString() !== req.params.projectId) {
    return next(
      new AppError(
        "Project ID and API key do not match",
        403,
        "PROJECT_MISMATCH",
      ),
    );
  }
  const allowedFields = Object.keys(project.recordSchema || {});
  const filter = filterRecordsQuery(
    req.query,
    project.recordSchema,
    project._id,
  );
  const options = buildQueryOptions(req.query, allowedFields);
  const { records, total } = await getRecordsService(filter, options);
  res.status(200).json({
    success: true,
    data: {
      records,
      total,
      page: options.page,
      limit: options.limit,
    },
  });
});

export const getRecordById = catchAsync(async (req, res, next) => {
  const project = req.project;
  if (!project) {
    return next(
      new AppError("Project not found in request context", 400, "RECORD_001"),
    );
  }
  if (req.params.projectId && project._id.toString() !== req.params.projectId) {
    return next(
      new AppError(
        "Project ID and API key do not match",
        403,
        "PROJECT_MISMATCH",
      ),
    );
  }
  const record = await Record.findOne({
    _id: req.params.recordId,
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
  if (req.params.projectId && project._id.toString() !== req.params.projectId) {
    return next(
      new AppError(
        "Project ID and API key do not match",
        403,
        "PROJECT_MISMATCH",
      ),
    );
  }
  const record = await Record.findOne({
    _id: req.params.recordId,
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
  if (req.params.projectId && project._id.toString() !== req.params.projectId) {
    return next(
      new AppError(
        "Project ID and API key do not match",
        403,
        "PROJECT_MISMATCH",
      ),
    );
  }
  const record = await Record.findOneAndDelete({
    _id: req.params.recordId,
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
