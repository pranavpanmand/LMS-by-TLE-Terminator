import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FlaskConical,
  Calculator,
  Atom,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@radix-ui/themes";
import Loader from "../components/Loader";
import {motion} from 'framer-motion'
import AdventureSection from "../components/AdventureSection";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const mainUrl = import.meta.env.VITE_MAIN_URL || "http://localhost:5173";

const API = `${BACKEND_URL}/api/stem`;

export default function Dashboard() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("quiz");
  // const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   initializeData();
  // }, []);

  // const initializeData = async () => {
  //   try {
  //     await axios.post(`${API}/init-data`);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error("Error initializing data:", error);
  //     setIsLoading(false);
  //   }
  // };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <Loader/>
  //     </div>
  //   );
  // }
  
  const adventures = [
    {
      id: "quiz",
      title: "Quiz Arena",
      subtitle: "Test your knowledge & sharpen your mind",
      items: [
        {
          id: "math",
          title: "Math Explorer",
          description: "Solve puzzles, logic & challenges.",
          icon: Calculator,
          color: "from-indigo-500 to-blue-600",
          bgImage:
            "https://images.unsplash.com/photo-1735116356965-ad5b323d1af8",
          path: "/quiz/math",
        },
        {
          id: "science",
          title: "Science Quiz",
          description: "Explore biology, physics & chemistry.",
          icon: Atom,
          color: "from-green-500 to-emerald-600",
          bgImage:
            "https://images.unsplash.com/photo-1532094349884-543bc11b234d",
          path: "/quiz/science",
        },
        {
          id: "computer",
          title: "Computer Quiz",
          description: "Test your CS & programming skills.",
          icon: Sparkles,
          color: "from-fuchsia-500 to-pink-600",
          bgImage:
            "https://images.unsplash.com/photo-1518770660439-4636190af475",
          path: "/quiz/computer",
        },
      ],
    },

    {
      id: "experiment",
      title: "Experiment Lab",
      subtitle: "Learn by doing real simulations",
      items: [
        {
          id: "physics",
          title: "Physics Lab",
          description: "Motion, forces & simulations.",
          icon: Atom,
          color: "from-orange-500 to-amber-600",
          bgImage:
            "https://images.unsplash.com/photo-1675627453075-0f170b02186a",
          path: "/experiment/physics",
        },
        {
          id: "chemistry",
          title: "Chemistry Lab",
          description: "React, mix & discover.",
          icon: FlaskConical,
          color: "from-lime-500 to-emerald-600",
          bgImage:
            "https://images.unsplash.com/photo-1633412748213-0cf8268c357f",
          path: "/experiment/chemistry",
        },
        {
          id: "computer",
          title: "Computer Lab",
          description: "Simulate algorithms & systems.",
          icon: TrendingUp,
          color: "from-cyan-500 to-blue-600",
          bgImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
          path: "/experiment/computer",
        },
        {
          id: "math",
          title: "Math Lab",
          description: "Visualise in real lifr.",
          icon: TrendingUp,
          color: "from-cyan-500 to-blue-600",
          bgImage: "https://images.unsplash.com/photo-1555949963-aa79dcee981c",
          path: "/experiment/math",
        },
      ],
    },
  ];



  return (
    <div
      className="min-h-screen  bg-[#0b1220] text-slate-100 pb-20"
      data-testid="dashboard-page">
      {/* Back Button */}
      <div className="container mx-auto px-6 md:px-12 pt-6 c">
        <Button
          variant="outline"
          className="flex items-center gap-2 mb-4 hover:bg-slate-100 text-white hover:text-slate-900 rounded-xl px-4 py-2 font-bold"
          onClick={() => (window.location.href = mainUrl)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
        <Button onClick={()=>{navigate('/progress')}}>
          Progress
        </Button>

      {/* ================= HERO ================= */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1633412748213-0cf8268c357f"
            alt="STEM Background"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-900/40" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 mb-6 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest backdrop-blur-md">
            Interactive STEM Platform
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Explore. Experiment.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
              Dominate.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
            Learn Math, Physics, and Chemistry through challenges, experiments,
            and AI-powered guidance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/tutor")}
              className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-bold text-lg hover:bg-blue-50 transition-all shadow-xl shadow-white/10">
              Ask AI Tutor
            </button>

            <button
              onClick={() => navigate("/quiz/math")}
              className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all">
              Start Learning
            </button>
            <button
              onClick={() => {window.location.href="https://ai-3d-playground.vercel.app/"}}
              className="px-8 py-4 rounded-2xl bg-blue-600 border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all">
              Explore 3D models
            </button>
          </motion.div>
        </div>
      </section>

      <AdventureSection adventures={adventures} />

      {/* Quick Stats */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto bg-slate-200 rounded-[2.5rem] shadow-xl border border-slate-100 p-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { value: "100+", label: "Math Challenges" },
              { value: "20+", label: "Experiments" },
              { value: "24/7", label: "AI Tutor" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}>
                <div className="text-4xl font-black text-indigo-600">
                  {stat.value}
                </div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
