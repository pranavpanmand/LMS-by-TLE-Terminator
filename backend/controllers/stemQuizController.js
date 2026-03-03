import StemTopic from "../models/StemTopic.js";
import StemProblem from "../models/StemProblem.js";

// ─── GET: Fetch topics by subject (optionally filter by difficulty) ───
export const getTopics = async (req, res) => {
  try {
    const { subject } = req.params;
    const filter = { subject };
    if (req.params.difficulty) {
      filter.difficulty = req.params.difficulty;
    }
    const topics = await StemTopic.find(filter);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: `Error fetching topics: ${error}` });
  }
};

// ─── GET: Fetch problems by subject and topic ───
export const getProblems = async (req, res) => {
  try {
    const { subject, topic_id } = req.params;
    const problems = await StemProblem.find({ subject, topic_id });
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: `Error fetching problems: ${error}` });
  }
};

// ─── POST/GET: Check answer for a problem ───
export const checkAnswer = async (req, res) => {
  try {
    const problem_id = req.query.problem_id || req.body.problem_id;
    const user_answer = req.query.user_answer || req.body.user_answer;

    if (!problem_id || !user_answer) {
      return res.status(400).json({ message: "problem_id and user_answer are required" });
    }

    const problem = await StemProblem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const correct =
      String(user_answer).trim().toLowerCase() ===
      String(problem.answer).trim().toLowerCase();

    return res.json({
      correct,
      answer: problem.answer,
      explanation: problem.explanation,
    });
  } catch (error) {
    res.status(500).json({ message: `Error checking answer: ${error}` });
  }
};

// ─── POST: Create a new topic (teacher only) ───
export const createTopic = async (req, res) => {
  try {
    const { subject, title, difficulty, category, description } = req.body;
    const topic = await StemTopic.create({
      subject,
      title,
      difficulty,
      category,
      description,
      createdBy: req.userId,
    });
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: `Error creating topic: ${error}` });
  }
};

// ─── PUT: Update a topic (teacher only) ───
export const updateTopic = async (req, res) => {
  try {
    const topic = await StemTopic.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: `Error updating topic: ${error}` });
  }
};

// ─── DELETE: Delete a topic and its problems (teacher only) ───
export const deleteTopic = async (req, res) => {
  try {
    const topic = await StemTopic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    // Also delete all problems under this topic
    await StemProblem.deleteMany({ topic_id: req.params.id });
    res.json({ message: "Topic and its problems deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting topic: ${error}` });
  }
};

// ─── POST: Add a problem to a topic (teacher only) ───
export const createProblem = async (req, res) => {
  try {
    const { subject, topic_id, question, answer, difficulty, explanation } = req.body;

    // Verify the topic exists
    const topic = await StemTopic.findById(topic_id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const problem = await StemProblem.create({
      subject: subject || topic.subject,
      topic_id,
      question,
      answer,
      difficulty: difficulty || topic.difficulty,
      explanation,
      createdBy: req.userId,
    });
    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: `Error creating problem: ${error}` });
  }
};

// ─── POST: Bulk add problems to a topic (teacher only) ───
export const createBulkProblems = async (req, res) => {
  try {
    const { topic_id, problems } = req.body;

    const topic = await StemTopic.findById(topic_id);
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    const problemsWithMeta = problems.map((p) => ({
      subject: p.subject || topic.subject,
      topic_id,
      question: p.question,
      answer: p.answer,
      difficulty: p.difficulty || topic.difficulty,
      explanation: p.explanation,
      createdBy: req.userId,
    }));

    const created = await StemProblem.insertMany(problemsWithMeta);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: `Error creating problems: ${error}` });
  }
};

// ─── PUT: Update a problem (teacher only) ───
export const updateProblem = async (req, res) => {
  try {
    const problem = await StemProblem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: `Error updating problem: ${error}` });
  }
};

// ─── DELETE: Delete a problem (teacher only) ───
export const deleteProblem = async (req, res) => {
  try {
    const problem = await StemProblem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ message: "Problem not found" });
    res.json({ message: "Problem deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: `Error deleting problem: ${error}` });
  }
};
