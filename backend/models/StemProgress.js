import mongoose from "mongoose";

const StemProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: ["math", "science", "computer"],
      required: true,
    },
    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StemTopic",
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StemProgress", StemProgressSchema);
