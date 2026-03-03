import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css'
import Dashboard from './pages/Dashboard';
import ExperimentDetail from './pages/ExperimentDetail';
import AITutor from './pages/AITutor';
import ProgressTracker from './pages/ProgressTracker';
import { Toaster } from 'sonner';
import QuizLearning from './pages/QuizLearning';
import ExperimentLab from './pages/ExperimentLab';
import useAuth from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null; // redirect is already happening in useAuth

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Quiz */}
          <Route path="/quiz/:subject" element={<QuizLearning />} />

          {/* Labs */}
          <Route path="/experiment/:subject" element={<ExperimentLab />} />

          <Route
            path="/experiment/:subject/:id"
            element={<ExperimentDetail />}
          />
          <Route path="/tutor" element={<AITutor />} />
          <Route path="/progress" element={<ProgressTracker />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
