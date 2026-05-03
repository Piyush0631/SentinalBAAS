import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);
recordSchema.index({ project: 1 });
export default mongoose.model("Record", recordSchema);
