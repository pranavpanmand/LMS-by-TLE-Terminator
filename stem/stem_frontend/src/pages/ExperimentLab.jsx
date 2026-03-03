import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Atom, Zap, FlaskConical, Monitor } from "lucide-react";
import { Button } from "@radix-ui/themes";
import Loader from "../components/Loader";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api/stem`;

const SUBJECT_CONFIG = {
  physics: {
    title: "Physics Lab",
    subtitle: "Explore forces, motion & energy.",
    icon: Atom,
    badge: "Physics Lab",
    gradient: "from-orange-500 to-yellow-400",
    bg: "from-orange-900 via-orange-800/90 to-orange-900/50",
  },
  chemistry: {
    title: "Chemistry Lab",
    subtitle: "React, mix & discover chemical wonders.",
    icon: FlaskConical,
    badge: "Chemistry Lab",
    gradient: "from-lime-500 to-emerald-600",
    bg: "from-emerald-900 via-emerald-800/90 to-emerald-900/50",
  },
  computer: {
    title: "Computer Lab",
    subtitle: "Simulate algorithms & systems.",
    icon: Monitor,
    badge: "Computer Lab",
    gradient: "from-cyan-500 to-blue-600",
    bg: "from-cyan-900 via-cyan-800/90 to-cyan-900/50",
  },
  math: {
    title: "Math Lab",
    subtitle: "Visualise mathematical concepts in real life.",
    icon: Zap,
    badge: "Math Lab",
    gradient: "from-purple-500 to-pink-600",
    bg: "from-purple-900 via-purple-800/90 to-purple-900/50",
  }
};

export default function ExperimentLab() {
  const navigate = useNavigate();
  const { subject } = useParams();
  const config = SUBJECT_CONFIG[subject];

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (config) fetchExperiments();
  }, [subject]);

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/${subject}/experiments`);
      setExperiments(response.data);
    } catch (error) {
      console.error("Error fetching experiments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        Invalid Lab 🚫
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

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#1b1f2a] text-slate-100 pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-r ${config.bg}`} />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-12 py-14">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            className="mb-8 p-2 text-slate-300 hover:text-white hover:bg-white/10 font-bold rounded-xl">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </Button>

          <div className="flex items-center gap-6">
            <div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="h-9 w-9 text-white" />
            </div>

            <div>
              <span className="inline-block mb-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-widest">
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

      {/* Grid */}
      <div className="container mx-auto px-6 md:px-12 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiments.map((experiment) => (
            <div
              key={experiment._id}
              onClick={() =>
                navigate(`/experiment/${subject}/${experiment._id}`)
              }
              className="group cursor-pointer rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:-translate-y-2 hover:shadow-2xl transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Zap className="text-white" />
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    experiment.difficulty === "easy"
                      ? "bg-green-500/20 text-green-300"
                      : experiment.difficulty === "medium"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                  }`}>
                  {experiment.difficulty}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white mb-2">
                {experiment.title}
              </h3>

              <p className="text-slate-400 font-medium mb-4">
                {experiment.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {experiment.materials.slice(0, 3).map((m, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-slate-300">
                    {m}
                  </span>
                ))}

                {experiment.materials.length > 3 && (
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-slate-300">
                    +{experiment.materials.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
