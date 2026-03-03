import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Send, Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@radix-ui/themes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api/stem`;

export default function AITutor() {
  const navigate = useNavigate();

  // Session ID
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem("ai_session_id");
    if (stored) return stored;
    const newSession = `session_${crypto.randomUUID()}`;
    localStorage.setItem("ai_session_id", newSession);
    return newSession;
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => scrollToBottom(), [messages]);

  useEffect(() => {
    fetchHistory();
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/chat/history/${sessionId}`);
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const sendMessage = async (messageText = null) => {
    const text = messageText ?? input;
    if (!text.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: text,
      });

      const aiMessage = {
        id: `msg_${Date.now()}_ai`,
        session_id: sessionId,
        role: "assistant",
        content: response.data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    const newSession = `session_${crypto.randomUUID()}`;
    localStorage.setItem("ai_session_id", newSession);
    setSessionId(newSession);
    setMessages([]);
    setInput("");
  };

  const quickQuestions = [
    "How does photosynthesis work?",
    "Explain multiplication in simple terms",
    "What is gravity?",
    "How do acids and bases work?",
  ];

  return (
    <div
      className="min-h-screen pb-20 bg-indigo-200"
      data-testid="ai-tutor-page">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-100 to-cyan-100 border-b-2 border-red-600">
        <div className="container mx-auto px-6 md:px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              className="hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl px-4 py-2 font-bold"
              variant="ghost">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-8 w-8 text-red-500" strokeWidth={2.5} />
              </div>
              <div>
                <h1
                  className="text-4xl md:text-5xl font-bold tracking-tight"
                  data-testid="page-heading">
                  AI Tutor
                </h1>
                <p className="text-lg font-medium text-slate-600 mt-1">
                  Ask me anything about math or science!
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={newChat}
            className="flex items-center gap-2 bg-primary text-primary hover:bg-green-600/90 rounded-xl px-4 py-2 font-bold shadow-md">
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        {messages.length === 0 ? (
          <div className="bg-indigo-200 rounded-3xl border-2 border-slate-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-sky-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Hi! I'm your AI Tutor!</h2>
            <p className="text-slate-600 font-medium mb-6">
              Ask me about math, chemistry, physics, or anything you're curious
              about!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="bg-yellow-200 border-2 border-slate-200 hover:border-primary hover:bg-indigo-50 rounded-2xl p-4 text-left text-sm font-medium text-slate-700 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`bg-white border-2 border-slate-100 rounded-3xl p-4 max-w-[85%] md:max-w-[70%] ${
                    msg.role === "user"
                      ? "bg-primary text-black border-primary"
                      : "bg-white text-slate-800"
                  }`}>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-primary">
                        AI Tutor
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap font-medium">
                    {msg.content}
                  </p>
                  <div className="text-xs text-slate-400 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border-2 border-slate-100 rounded-3xl p-4 max-w-[85%] md:max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-sm text-slate-600 font-medium">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="sticky bottom-0 bg-white pt-2 pb-[env(safe-area-inset-bottom)]">
          <div className="rounded-3xl border-2 border-slate-200 shadow-lg p-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Type your question here..."
              className="flex-1 bg-slate-50 rounded-2xl border-2 border-slate-200 px-4 py-3 font-medium focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all outline-none"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12 rounded-full font-bold shadow-[0_4px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] transition-all flex items-center justify-center">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
