import axios from "axios";
import { ai } from "../configs/ai.js";
import Lecture from "../models/lectureModel.js";
import dotenv from "dotenv";
import { indexLectureSummary } from "./indexLectureSummary.js";
dotenv.config();

const summariseUrl = process.env.SUMMARISE_URL || "";


async function getOrGenerateTranscription(lecture) {
  if (lecture.summary && lecture.summary.length > 0) {
    return lecture.summary;
  }

  const audioUrl = lecture.audioUrl;
  if (!audioUrl) {
    throw new Error("Audio not available for this lecture");
  }

  const startResp = await axios.get(
    `${summariseUrl}/transcribe`,
    { params: { url: audioUrl } },
  );

  const jobId = startResp.data.job_id;
  const MAX_ATTEMPTS = 100; // ~5 minutes max (100 attempts * 3s interval)
  const POLL_INTERVAL = 3000;

  let attempt = 0;
  let transcriptionResult = null;


  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const statusResp = await axios.get(
      `${summariseUrl}/status`,
      { params: { job_id: jobId } },
    );

    const { status, result, error } = statusResp.data;

    if (status === "finished") {
      transcriptionResult = result;
      break;
    }
    if (status === "failed") {
      throw new Error(error || "Transcription job failed");
    }
    await sleep(POLL_INTERVAL);
  }

  if (!transcriptionResult) {
    throw new Error("Transcription timed out");
  }

  const prompt = `Summarize the following lecture transcription into a concise summary highlighting, the key points and important concepts in simple easy to understand terms:\n\n${transcriptionResult}\n\nSummary:`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents:prompt,
    })

  transcriptionResult = response.text;

  lecture.summary = transcriptionResult;
  await lecture.save();
  // await indexLectureSummary(lecture._id);


  return transcriptionResult;
}


export async function generateSummary(req, res) {
  try {
    const { lectureId } = req.body;
    const lecture = await Lecture.findById(lectureId);

    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    const summary = await getOrGenerateTranscription(lecture);

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Error in generateSummary:", error.message);
    if (error.message === "Audio not available for this lecture") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message, 
      stack: error.stack, 
    });
  }
}


export async function askDoubt(req, res) {
  try {
    const { lectureId, question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    let context="";
    try {
      context = await getOrGenerateTranscription(lecture);
    }
     catch (err) {
      return res
        .status(400)
        .json({
          message: "Could not retrieve lecture context: " + err.message,
        });
    }

    // 2. Send to LLM (OpenAI)
    const prompt = `You are an expert tutor. Use the following lecture context to answer the question.\n\nLecture Context: ${context}\n\nQuestion: ${question}\n\nAnswer:`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents:prompt,
        })

    const answer = response.text;
    
    return res.status(200).json({ answer });
  } 
  catch (error) {
    console.error("Error in askDoubt:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

// Utility
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
