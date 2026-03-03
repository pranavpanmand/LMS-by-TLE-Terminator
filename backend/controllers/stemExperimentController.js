import StemExperiment from "../models/StemExperiment.js";

// ─── GET: Experiments by subject ───
export const getExperimentsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const experiments = await StemExperiment.find({ subject });
    res.json(experiments);
  } catch (error) {
    res.status(500).json({ message: `Error fetching experiments: ${error}` });
  }
};

// ─── GET: Single experiment by ID ───
export const getExperimentById = async (req, res) => {
  try {
    const experiment = await StemExperiment.findById(req.params.id);
    if (!experiment) {
      return res.status(404).json({ message: "Experiment not found" });
    }
    res.json(experiment);
  } catch (error) {
    res.status(500).json({ message: `Error fetching experiment: ${error}` });
  }
};

// ─── POST: Create experiment (teacher only) ───
export const createExperiment = async (req, res) => {
  try {
    const experiment = await StemExperiment.create({
      ...req.body,
      createdBy: req.userId,
    });
    res.status(201).json(experiment);
  } catch (error) {
    res.status(500).json({ message: `Error creating experiment: ${error}` });
  }
};

// ─── PUT: Update experiment (teacher only) ───
export const updateExperiment = async (req, res) => {
  try {
    const experiment = await StemExperiment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!experiment) return res.status(404).json({ message: "Experiment not found" });
    res.json(experiment);
  } catch (error) {
    res.status(500).json({ message: `Error updating experiment: ${error}` });
  }
};

// ─── DELETE: Delete experiment (teacher only) ───
export const deleteExperiment = async (req, res) => {
  try {
    const experiment = await StemExperiment.findByIdAndDelete(req.params.id);
    if (!experiment) return res.status(404).json({ message: "Experiment not found" });
    res.json({ message: "Experiment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting experiment: ${error}` });
  }
};
