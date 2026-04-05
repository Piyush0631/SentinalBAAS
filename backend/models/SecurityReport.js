import mongoose from "mongoose";

const securityReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    deterministicFindings: {
      type: Array,
      default: [],
    },
    aiFindings: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ["full", "partial", "deterministic-only"],
      required: true,
    },
    analyzerVersion: {
      type: String,
      default: "v1.0",
    },
    inputSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("SecurityReport", securityReportSchema);
