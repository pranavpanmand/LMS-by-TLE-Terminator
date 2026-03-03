import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  getTopics,
  getProblems,
  checkAnswer,
  createTopic,
  updateTopic,
  deleteTopic,
  createProblem,
  createBulkProblems,
  updateProblem,
  deleteProblem,
} from "../controllers/stemQuizController.js";

const router = express.Router();

// ─── Student routes (auth required) ───
router.get("/:subject/topics", isAuth, getTopics);
router.get("/:subject/topics/:difficulty", isAuth, getTopics);
router.get("/:subject/problems/:topic_id", isAuth, getProblems);
router.get("/:subject/check-answer", isAuth, checkAnswer);
router.post("/:subject/check-answer", isAuth, checkAnswer);

// ─── Teacher CRUD routes (auth required) ───
router.post("/topic", isAuth, createTopic);
router.put("/topic/:id", isAuth, updateTopic);
router.delete("/topic/:id", isAuth, deleteTopic);

router.post("/problem", isAuth, createProblem);
router.post("/problem/bulk", isAuth, createBulkProblems);
router.put("/problem/:id", isAuth, updateProblem);
router.delete("/problem/:id", isAuth, deleteProblem);

export default router;
