import { generateProjectDocs } from "../services/apiDocService.js";
import catchAsync from "../../../utils/catchasync.js";

export const getProjectDocs = catchAsync(async (req, res) => {
  const docs = await generateProjectDocs(req.params.projectId);
  if (req.query.operationId) {
    const matched = docs.endpoints.find(
      (endpoint) => endpoint.operationId === req.query.operationId,
    );
    docs.endpoints = matched ? [matched] : [];
  }
  res.status(200).json({
    success: true,
    data: docs,
  });
});
