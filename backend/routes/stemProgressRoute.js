import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  saveProgress,
  getProgress,
} from "../controllers/stemProgressController.js";

const router = express.Router();

router.post("/", isAuth, saveProgress);
router.get("/", isAuth, getProgress);
router.get("/:user_id", isAuth, getProgress); // backwards compatibility with STEM frontend

export default router;
