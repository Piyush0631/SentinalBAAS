import Project from "../../../models/Project.js";
import RequestLog from "../../../models/RequestLog.js";
import AppError from "../../../utils/apperror.js";
import catchAsync from "../../../utils/catchasync.js";

const apiKeyMiddleware = catchAsync(async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return next(new AppError("API key is missing", 401, "AUTH_006"));
  }

  if (!apiKey.startsWith("sk_proj_")) {
    return next(new AppError("Malformed API key", 400, "AUTH_009"));
  }
  const project = await Project.findOne({ apiKey });
  if (!project) {
    return next(new AppError("Invalid API key", 401, "AUTH_008"));
  }

  // Cross-check projectId in URL (if present) matches project from API key
  if (req.params.projectId && req.params.projectId !== project._id.toString()) {
    return next(new AppError("Project ID mismatch", 403, "AUTH_010"));
  }
  req.project = project;

  res.on("finish", async () => {
    try {
      await RequestLog.create({
        projectId: project._id,
        userId: req.user ? req.user.id : undefined,
        method: req.method,
        path: req.originalUrl,
        headers: req.headers,
        body: req.body,
        responseStatus: res.statusCode,
        ip: req.ip || req.headers["x-forwarded-for"],
        hadApiKey: true,
      });
    } catch (err) {
      console.error("RequestLog error:", err);
    }
  });

  next();
});

export default apiKeyMiddleware;
