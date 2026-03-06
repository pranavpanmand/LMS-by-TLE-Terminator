import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  { x: Number, y: Number },
  { _id: false }
);

const nodeSchema = new mongoose.Schema(
  {
    id:       { type: String, required: true },
    type:     { type: String, required: true },
    position: { type: positionSchema, required: true },
    data:     { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const edgeSchema = new mongoose.Schema(
  {
    id:           { type: String, required: true },
    source:       { type: String, required: true },
    target:       { type: String, required: true },
    type:         { type: String, default: "smoothstep" },
    label:        { type: String, default: "" },
    animated:     { type: Boolean, default: false },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
    markerEnd:    { type: mongoose.Schema.Types.Mixed, default: null },
    style:        { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const graphSchema = new mongoose.Schema(
  {
    nodes: { type: [nodeSchema], default: [] },
    edges: { type: [edgeSchema], default: [] },
  },
  { _id: false }
);

const versionSchema = new mongoose.Schema(
  {
    graph:     { type: graphSchema, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FlowchartSchema = new mongoose.Schema(
  {
    // matches req.userId set by isAuth.js
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name:     { type: String, required: true, trim: true },
    current:  { type: graphSchema, default: () => ({ nodes: [], edges: [] }) },
    versions: { type: [versionSchema], default: [] }, // last 10 versions for undo
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
  },
  { timestamps: true }
);

// One user can't have two flowcharts with the same name
FlowchartSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model("Flowchart", FlowchartSchema);