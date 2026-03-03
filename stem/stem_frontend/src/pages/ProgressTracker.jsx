import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, TrendingUp, Award, BookOpen, FlaskConical, Atom } from "lucide-react";
import { Button } from "@radix-ui/themes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api/stem`;

export default function ProgressTracker() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId] = useState("default_user");

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`${API}/progress/${userId}`);
      setProgress(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setLoading(false);
    }
  };

  const getSubjectIcon = (subject) => {
    switch (subject) {
      case "math":
        return BookOpen;
      case "chemistry":
        return FlaskConical;
      case "physics":
        return Atom;
      default:
        return Award;
    }
  };

  const getSubjectColor = (subject) => {
    switch (subject) {
      case "math":
        return "#6366f1";
      case "chemistry":
        return "#84cc16";
      case "physics":
        return "#f97316";
      default:
        return "#6366f1";
    }
  };

  const stats = {
    math: progress.filter((p) => p.subject === "math").length,
    chemistry: progress.filter((p) => p.subject === "chemistry").length,
    physics: progress.filter((p) => p.subject === "physics").length,
    total: progress.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots flex gap-2">
          <span className="w-3 h-3 bg-primary rounded-full"></span>
          <span className="w-3 h-3 bg-primary rounded-full"></span>
          <span className="w-3 h-3 bg-primary rounded-full"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" data-testid="progress-tracker-page">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-b-2 border-slate-100">
        <div className="container mx-auto px-6 md:px-12 py-8">
          <Button
            data-testid="back-button"
            onClick={() => navigate("/")}
            className="hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl px-4 py-2 font-bold mb-4"
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight" data-testid="page-heading">
                My Progress
              </h1>
              <p className="text-lg font-medium text-slate-600 mt-1">Track your learning journey!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="h-8 w-8 text-purple-500" strokeWidth={2.5} />
              <div className="text-3xl font-black text-purple-500">{stats.total}</div>
            </div>
            <div className="text-slate-600 font-bold">Total Activities</div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-8 w-8 text-primary" strokeWidth={2.5} />
              <div className="text-3xl font-black text-primary">{stats.math}</div>
            </div>
            <div className="text-slate-600 font-bold">Math Problems</div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <FlaskConical className="h-8 w-8 text-secondary" strokeWidth={2.5} />
              <div className="text-3xl font-black text-secondary">{stats.chemistry}</div>
            </div>
            <div className="text-slate-600 font-bold">Chemistry</div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <Atom className="h-8 w-8 text-accent" strokeWidth={2.5} />
              <div className="text-3xl font-black text-accent">{stats.physics}</div>
            </div>
            <div className="text-slate-600 font-bold">Physics</div>
          </div>
        </div>

        {/* Progress List */}
        {progress.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Progress Yet</h2>
            <p className="text-slate-600 font-medium mb-6">
              Start learning to see your progress here!
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-full font-bold shadow-[0_4px_0_0_rgba(79,70,229,1)] active:shadow-none active:translate-y-[4px] transition-all"
            >
              Start Learning
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {progress.slice(0, 20).map((item, index) => {
                const IconComponent = getSubjectIcon(item.subject);
                const color = getSubjectColor(item.subject);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color }} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 capitalize">
                        {item.subject} - {item.topic_id}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">
                        {item.completed ? "Completed" : "In Progress"}
                        {item.score && ` • Score: ${item.score}%`}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
