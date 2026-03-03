import express from "express";
import { initStemData } from "../controllers/stemInitController.js";

const router = express.Router();

router.post("/init-data", initStemData);

export default router;
