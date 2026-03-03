import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  Target,
  CheckCircle,
} from "lucide-react";
import { Button } from "@radix-ui/themes";
import Loader from "../components/Loader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api/stem`;

const SUBJECT_UI = {
  physics: {
    color: "#f97316",
    label: "Physics",
  },
  chemistry: {
    color: "#84cc16",
    label: "Chemistry",
  },
  computer: {
    color: "#38bdf8",
    label: "Computer",
  },
  math: {
    color: "#a855f7",
    label: "Math",
  }
};

export default function ExperimentDetail() {
  const { subject, id } = useParams();
  const navigate = useNavigate();

  const ui = SUBJECT_UI[subject];

  const [experiment, setExperiment] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ui) fetchExperiment();
  }, [subject, id]);

  const fetchExperiment = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/${subject}/experiments/${id}`);
      setExperiment(response.data);
    } catch (error) {
      console.error("Error fetching experiment:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (index) => {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  if (!ui) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Invalid Experiment 🚫
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Experiment not found
          </h2>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-white rounded-full px-6 py-3">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b1f2a] text-slate-100 pb-20">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden border-b border-slate-800"
        style={{
          background: `linear-gradient(135deg, ${ui.color}15 0%, ${ui.color}35 100%)`,
        }}>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-12 py-14">
          <Button
            onClick={() => navigate(`/experiment/${subject}`)}
            variant="ghost"
            className="mb-8 text-slate-300 p-2 hover:text-white hover:bg-white/10 font-bold rounded-xl">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to {ui.label} Lab
          </Button>

          <div className="max-w-4xl">
            <span
              className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest"
              style={{
                backgroundColor: `${ui.color}20`,
                color: ui.color,
              }}>
              {ui.label} Experiment
            </span>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white">
              {experiment.title}
            </h1>

            <p className="text-lg text-slate-300 font-medium">
              {experiment.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Materials */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/30 rounded-xl flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-indigo-200" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Materials Needed
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {experiment.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="font-medium text-slate-200">{material}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety */}
          <div className="bg-amber-900/10 rounded-3xl border border-amber-700/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-700/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-amber-300">
                Safety First!
              </h2>
            </div>

            <ul className="space-y-2">
              {experiment.safety_notes.map((note, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 text-amber-200 font-medium">
                  <span className="font-bold mt-1">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              Experiment Steps
            </h2>

            <div className="space-y-4">
              {experiment.steps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => toggleStep(index)}
                  className="flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all"
                  style={{
                    backgroundColor: completedSteps.includes(index)
                      ? `${ui.color}20`
                      : "rgba(255,255,255,0.05)",
                    borderColor: completedSteps.includes(index)
                      ? ui.color
                      : "rgba(255,255,255,0.2)",
                  }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                    style={{
                      backgroundColor: completedSteps.includes(index)
                        ? ui.color
                        : "#94a3b8",
                    }}>
                    {completedSteps.includes(index) ? "✓" : index + 1}
                  </div>

                  <p className="font-medium text-slate-200 pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-200" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                What You'll Learn
              </h2>
            </div>

            <ul className="space-y-3">
              {experiment.learning_objectives.map((obj, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-purple-300 font-bold mt-1">•</span>
                  <span className="font-medium text-slate-200">{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tutor */}
          <div className="text-center">
            <Button
              onClick={() => navigate("/tutor")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold shadow-[0_4px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] transition-all mt-6">
              Ask AI Tutor About This Experiment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
