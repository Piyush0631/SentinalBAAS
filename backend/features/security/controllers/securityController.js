import catchAsync from "../../../utils/catchasync.js";
import SecurityReport from "../../../models/SecurityReport.js";
import { analyzeProject } from "../services/aiSecurityService.js";

export const getSecurityReport = catchAsync(async (req, res) => {
  const project = req.project;

  const existingReport = await SecurityReport.findOne({
    projectId: project._id,
  }).sort({ createdAt: -1 });
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (existingReport && existingReport.createdAt > thirtyMinutesAgo) {
    return res.status(200).json({
      success: true,
      data: { report: existingReport },
    });
  }
  const report = await analyzeProject(project);
  res.status(200).json({
    success: true,
    data: { report },
  });
});
