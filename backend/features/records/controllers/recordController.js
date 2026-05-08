import catchAsync from "../../../utils/catchasync.js";
import AppError from "../../../utils/apperror.js";
import Record from "../../../models/Record.js";
import {
  filterRecordsQuery,
  buildQueryOptions,
  getRecordsService,
} from "../services/filterRecordsQuery.js";
import * as recordValidator from "../validators/recordValidator.js";

export const createRecord = catchAsync(async (req, res) => {
  const project = req.project;
  const recordSchema = recordValidator.buildRecordCreateSchema(
    project.recordSchema,
  );
  const validated = recordSchema.parse(req.body);
  const record = await Record.create({
    project: project._id,
    data: validated,
  });
  res.status(201).json({
    success: true,
    data: { record },
  });
});

export const getRecords = catchAsync(async (req, res) => {
  const project = req.project;
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
  const record = await Record.findOne({
    _id: req.params.recordId,
    project: project._id,
  });
  if (!record) {
    return next(new AppError("Record not found", 404, "RECORD_003"));
  }
  const recordSchema = recordValidator.buildRecordUpdateSchema(
    project.recordSchema,
  );
  const validated = recordSchema.parse(req.body);
  record.data = { ...record.data, ...validated };
  await record.save();
  res.status(200).json({
    success: true,
    data: { record },
  });
});

export const deleteRecord = catchAsync(async (req, res, next) => {
  const project = req.project;
  const record = await Record.findOneAndDelete({
    _id: req.params.recordId,
    project: project._id,
  });
  if (!record) {
    return next(new AppError("Record not found", 404, "RECORD_003"));
  }
  res.status(204).send();
});
