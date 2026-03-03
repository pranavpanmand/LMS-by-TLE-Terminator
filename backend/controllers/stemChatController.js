import StemChatMessage from "../models/StemChatMessage.js";
import { askBedrock } from "../utils/bedrock.js";

// ─── POST: Chat with AI tutor ───
export const chatWithTutor = async (req, res) => {
  try {
    const { session_id, message } = req.body;

    if (!session_id || !message) {
      return res
        .status(400)
        .json({ message: "session_id and message are required" });
    }

    // Fetch history
    const history = await StemChatMessage.find(
      { session_id },
      { _id: 0, role: 1, content: 1 }
    )
      .sort({ createdAt: 1 })
      .limit(20);

    // Format history
    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Append new user message
    formattedHistory.push({ role: "user", content: message });

    // Ask Bedrock
    const aiResponse = await askBedrock(formattedHistory);

    // Save user message
    await StemChatMessage.create({
      session_id,
      user: req.userId,
      role: "user",
      content: message,
    });

    // Save AI reply
    await StemChatMessage.create({
      session_id,
      user: req.userId,
      role: "assistant",
      content: aiResponse,
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error("ChatWithTutor Error:", error);
    res.status(500).json({
      message: "AI Tutor is currently unavailable. Please try again later.",
    });
  }
};

// ─── GET: Fetch chat history ───
export const getChatHistory = async (req, res) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const messages = await StemChatMessage.find({ session_id }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    console.error("GetChatHistory Error:", error);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};
