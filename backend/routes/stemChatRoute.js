import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  chatWithTutor,
  getChatHistory,
} from "../controllers/stemChatController.js";

const router = express.Router();

router.post("/", isAuth, chatWithTutor);
router.get("/history/:session_id", isAuth, getChatHistory);

export default router;
