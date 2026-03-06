import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  listMine,
  createFlow,
  getOne,
  updateOne,
  undoOne,
  deleteOne,
  generate,
} from "../controllers/flowchart.controller.js";

const router = express.Router();

// All routes are protected by isAuth middleware (sets req.userId)
router.get("/",               isAuth, listMine);   // GET    /api/flowcharts
router.post("/",              isAuth, createFlow);  // POST   /api/flowcharts
router.post("/generate",      isAuth, generate);    // POST   /api/flowcharts/generate
router.get("/:id",            isAuth, getOne);      // GET    /api/flowcharts/:id
router.put("/:id",            isAuth, updateOne);   // PUT    /api/flowcharts/:id
router.post("/:id/undo",      isAuth, undoOne);     // POST   /api/flowcharts/:id/undo
router.delete("/:id",         isAuth, deleteOne);   // DELETE /api/flowcharts/:id

export default router;