import mongoose from "mongoose";

const StemExperimentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      enum: ["chemistry", "physics", "computer", "math"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    materials: {
      type: [String],
      default: [],
    },
    steps: {
      type: [String],
      default: [],
    },
    safety_notes: {
      type: [String],
      default: [],
    },
    learning_objectives: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("StemExperiment", StemExperimentSchema);
