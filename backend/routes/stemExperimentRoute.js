import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  getExperimentsBySubject,
  getExperimentById,
  createExperiment,
  updateExperiment,
  deleteExperiment,
} from "../controllers/stemExperimentController.js";

const router = express.Router();

// ─── Student routes (matches frontend: /api/stem/:subject/experiments) ───
router.get("/:subject/experiments", isAuth, getExperimentsBySubject);
router.get("/:subject/experiments/:id", isAuth, getExperimentById);

// ─── Teacher CRUD routes ───
router.post("/experiments", isAuth, createExperiment);
router.put("/experiments/:id", isAuth, updateExperiment);
router.delete("/experiments/:id", isAuth, deleteExperiment);

export default router;
