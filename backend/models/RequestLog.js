import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  headers: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  body: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  responseStatus: {
    type: Number,
    required: false,
  },
  ip: {
    type: String,
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

requestLogSchema.index({ projectId: 1, timestamp: -1 });

export default mongoose.model("RequestLog", requestLogSchema);
