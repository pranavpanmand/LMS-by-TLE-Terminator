import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, BookOpen, Calculator, Atom, Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@radix-ui/themes";
import Loader from "../components/Loader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api/stem`;

const SUBJECT_CONFIG = {
  math: {
    title: "Math Explorer",
    subtitle: "Practice, solve, and dominate math challenges.",
    icon: Calculator,
    badge: "Math Module",
    gradient: "from-indigo-600 to-blue-700",
  },
  science: {
    title: "Science Quiz",
    subtitle: "Test your scientific reasoning skills.",
    icon: Atom,
    badge: "Science Module",
    gradient: "from-green-600 to-emerald-700",
  },
  computer: {
    title: "Computer Quiz",
    subtitle: "Master logic, coding & CS fundamentals.",
    icon: BookOpen,
    badge: "Computer Module",
    gradient: "from-fuchsia-600 to-pink-700",
  },
};

export default function QuizLearning() {
  const navigate = useNavigate();
  const { subject } = useParams();

  const config = SUBJECT_CONFIG[subject];

  const [allTopics, setAllTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [problems, setProblems] = useState([]);
  const [currentProblem, setCurrentProblem] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [difficulty, setDifficulty] = useState("all");
  const [loading, setLoading] = useState(true);

  // Redirect if invalid subject
  useEffect(() => {
    if (!config) {
      navigate("/", { replace: true });
      return;
    }
    // reset selection when subject changes
    setSelectedTopic(null);
    setProblems([]);
    setCurrentProblem(0);
    setUserAnswer("");
    setShowResult(false);
    setResult(null);
    setDifficulty("all");
    fetchTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/quiz/${subject}/topics`);
      setAllTopics(response.data || []);
      setFilteredTopics(response.data || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setAllTopics([]);
      setFilteredTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = (level) => {
    setDifficulty(level);

    if (level === "all") {
      setFilteredTopics(allTopics);
    } else {
      setFilteredTopics(allTopics.filter((t) => t.difficulty === level));
    }
  };

  const selectTopic = async (topic) => {
    setSelectedTopic(topic);
    setProblems([]);
    setCurrentProblem(0);
    setUserAnswer("");
    setShowResult(false);
    setResult(null);

    try {
      const response = await axios.get(
        `${API}/quiz/${subject}/problems/${topic._id}`,
      );
      const data = Array.isArray(response.data) ? response.data : [];
      setProblems(data);
      setCurrentProblem(0);
    } catch (error) {
      console.error("Error fetching problems:", error);
      setProblems([]);
    }
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim()) {
      toast.error("Please enter an answer!");
      return;
    }

    const problem = problems[currentProblem];
    if (!problem) {
      toast.error("No problem selected or problems not loaded.");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/quiz/${subject}/check-answer?problem_id=${problem._id}&user_answer=${encodeURIComponent(
          userAnswer,
        )}`,
      );

      setResult(response.data);
      setShowResult(true);

      response.data.correct
        ? toast.success("Correct! 🎉")
        : toast.error("Try again!");
    } catch (error) {
      console.error("Error checking answer:", error);
      toast.error("Error checking answer");
    }
  };

  const nextProblem = () => {
    if (currentProblem < problems.length - 1) {
      setCurrentProblem((p) => p + 1);
      setUserAnswer("");
      setShowResult(false);
      setResult(null);
    } else {
      toast.success("You've completed all problems! 🌟");
      setSelectedTopic(null);
      setProblems([]);
    }
  };

  if (!config) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100 pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-900/40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-12 py-14">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-8 text-slate-300 hover:text-white hover:bg-white/10 font-bold rounded-xl">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          <div className="flex items-center gap-6">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="h-9 w-9 text-white" />
            </div>

            <div>
              <span className="inline-block mb-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest">
                {config.badge}
              </span>

              <h1 className="text-4xl md:text-5xl font-black text-white">
                {config.title}
              </h1>

              <p className="text-lg text-slate-300 mt-2">{config.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-8">
        {!selectedTopic ? (
          <>
            {/* Difficulty Filter */}
            <div
              className="flex flex-wrap gap-4 mb-10"
              data-testid="difficulty-filter">
              {["all", "easy", "medium", "hard"].map((level) => (
                <Button
                  key={level}
                  onClick={() => filterTopics(level)}
                  className={`h-11 px-6 rounded-full font-bold transition-all ${
                    difficulty === level
                      ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg"
                      : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                  }`}>
                  {level.toUpperCase()}
                </Button>
              ))}
            </div>

            {/* Topics Grid */}
            {filteredTopics.length === 0 ? (
              <div className="text-center text-slate-400 py-20">
                No topics available for this subject / difficulty.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredTopics.map((topic) => (
                  <div
                    key={topic._id}
                    data-testid={`topic-card-${topic._id}`}
                    onClick={() => selectTopic(topic)}
                    className="group cursor-pointer rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:-translate-y-2 hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                        <BookOpen className="text-indigo-400" />
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          topic.difficulty === "easy"
                            ? "bg-green-500/20 text-green-300"
                            : topic.difficulty === "medium"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : "bg-red-500/20 text-red-300"
                        }`}>
                        {topic.difficulty}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-slate-400">{topic.description}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Problem Solving Panel */}
            <div className="max-w-3xl mx-auto">
              <Button
                data-testid="back-to-topics-button"
                onClick={() => {
                  setSelectedTopic(null);
                  setProblems([]);
                }}
                variant="ghost"
                className="mb-6 text-slate-300 hover:text-white hover:bg-white/10 font-bold">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Topics
              </Button>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-white">
                    {selectedTopic.title}
                  </h2>
                  <span className="text-slate-400 font-bold">
                    {problems.length > 0
                      ? `${currentProblem + 1} / ${problems.length}`
                      : "0 / 0"}
                  </span>
                </div>

                {/* If there are no problems, show friendly message */}
                {problems.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    No problems available for this topic.
                    <div className="mt-6">
                      <Button
                        onClick={() => {
                          setSelectedTopic(null);
                          setProblems([]);
                        }}
                        className="bg-amber-600 text-white px-6 py-3 rounded-full">
                        Back to Topics
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-indigo-500/10 border border-indigo-400/20 rounded-2xl p-6">
                      <p
                        className="text-2xl font-bold text-white"
                        data-testid="problem-question">
                        {problems[currentProblem]?.question ??
                          "Question missing"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">
                        Your Answer:
                      </label>
                      <input
                        data-testid="answer-input"
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !showResult && checkAnswer()
                        }
                        disabled={showResult}
                        className="w-full h-12 rounded-2xl bg-black/40 border border-white/10 px-4 text-white font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 outline-none"
                        placeholder="Type your answer here..."
                      />
                    </div>

                    {!showResult ? (
                      <Button
                        data-testid="check-answer-button"
                        onClick={checkAnswer}
                        className="bg-blue-600 text-white hover:bg-blue-700 h-12 px-8 rounded-full font-bold shadow-lg active:shadow-none active:translate-y-[2px] transition-all w-full">
                        Check Answer
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div
                          className={`rounded-2xl p-6 border ${
                            result?.correct
                              ? "bg-green-500/10 border-green-400/30"
                              : "bg-red-500/10 border-red-400/30"
                          }`}>
                          <div className="flex items-center gap-3 mb-3">
                            {result?.correct ? (
                              <Award className="text-green-400 h-8 w-8" />
                            ) : (
                              <BookOpen className="text-red-400 h-8 w-8" />
                            )}
                            <h3 className="text-xl font-black text-white">
                              {result?.correct ? "Correct!" : "Try Again"}
                            </h3>
                          </div>
                          <p className="text-slate-300">
                            <strong className="text-white">Answer:</strong>{" "}
                            {result?.answer ?? "—"}
                          </p>
                          <p className="text-slate-400 mt-2">
                            {result?.explanation ?? ""}
                          </p>
                        </div>

                        <Button
                          data-testid="next-problem-button"
                          onClick={nextProblem}
                          className="bg-amber-600 text-white hover:bg-amber-700 h-12 px-8 rounded-full font-bold shadow-lg active:shadow-none active:translate-y-[2px] transition-all w-full">
                          Next Problem
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
