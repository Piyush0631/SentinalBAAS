import Project from "../../../models/Project.js";
import AppError from "../../../utils/apperror.js";
import catchAsync from "../../../utils/catchasync.js";

const projectOwner = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) {
    return next(new AppError("Project not found", 404, "PROJECT_404"));
  }
  if (!req.user || String(project.owner) !== String(req.user.id)) {
    return next(
      new AppError("Forbidden: Not project owner", 403, "PROJECT_403"),
    );
  }
  req.project = project;
  next();
});

export default projectOwner;
