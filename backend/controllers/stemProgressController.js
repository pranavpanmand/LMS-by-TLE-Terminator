import StemProgress from "../models/StemProgress.js";

// ─── POST: Save progress ───
export const saveProgress = async (req, res) => {
  try {
    const { subject, topic_id, completed, score } = req.body;
    const progress = await StemProgress.create({
      user: req.userId,
      subject,
      topic_id,
      completed,
      score,
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: `Error saving progress: ${error}` });
  }
};

// ─── GET: Get progress for current user ───
export const getProgress = async (req, res) => {
  try {
    const progress = await StemProgress.find({ user: req.userId })
      .populate("topic_id", "title subject")
      .sort({ createdAt: -1 });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: `Error fetching progress: ${error}` });
  }
};
