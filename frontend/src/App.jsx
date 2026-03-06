import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import axios from "axios";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { ToastContainer } from "react-toastify";
import ForgotPassword from "./pages/ForgotPassword";
import getCurrentUser from "./customHooks/getCurrentUser";
import { useSelector } from "react-redux";
import Profile from "./pages/Profile";
import AllCourses from "./pages/AllCourses";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/admin/Dashboard";
import Courses from "./pages/admin/Courses";
import AddCourses from "./pages/admin/AddCourses";
import CreateCourse from "./pages/admin/CreateCourse";
import CreateLecture from "./pages/admin/CreateLecture";
import EditLecture from "./pages/admin/EditLecture";
import getCouseData from "./customHooks/getCouseData";
import ViewCourse from "./pages/ViewCourse";
import ScrollToTop from "./components/ScrollToTop";
import getCreatorCourseData from "./customHooks/getCreatorCourseData";
import EnrolledCourse from "./pages/EnrolledCourse";
import ViewLecture from "./pages/ViewLecture";
import SearchWithAi from "./pages/SearchWithAi";
import getAllReviews from "./customHooks/getAllReviews";
import Career from "./pages/Career";
import EditQuiz from "./pages/admin/EditQuiz";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherArena from "./pages/live-quiz/TeacherArena";
import StudentArena from "./pages/live-quiz/StudentArena";
import LiveClassDashboard from "./pages/LiveClassDashboard";
import LiveRoom from "./pages/LiveRoom";
import AIScheduler from "./pages/AIScheduler";
import StressAnalysis from "./pages/StressAnalysis";
import useUsageTracker from "./hooks/useUsageTracker";
import FlowchartDashboard from "./pages/FlowchartDashboard";
import FlowchartEditor from "./pages/FlowchartEditor";

export const serverUrl =
  import.meta.env.VITE_BACKEND || "http://localhost:8000";

// 👇 THE MAGIC FIX: GLOBAL AXIOS CONFIGURATION 👇
// This forces EVERY single request in your app to attach your secure cookies!
axios.defaults.withCredentials = true;

function App() {
  const { userData, isAuthChecked } = useSelector((state) => state.user);
  useUsageTracker();
  // custom hooks must be called at top level
  getCurrentUser();
  getCouseData();
  getCreatorCourseData();
  getAllReviews();

  if (!isAuthChecked) {
    return null;
  }

  return (
    <>
      <ToastContainer />
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/signup"
          element={!userData ? <SignUp /> : <Navigate to="/" />}
        />
        <Route path="/flowcharts" element={<FlowchartDashboard />} />

        <Route
          path="/flowcharts/course/:courseId"
          element={<FlowchartDashboard />}
        />

        <Route path="/flowchart/:id" element={<FlowchartEditor />} />

        <Route
          path="/profile"
          element={userData ? <Profile /> : <Navigate to="/login" />}
        />

        <Route
          path="/allcourses"
          element={userData ? <AllCourses /> : <Navigate to="/login" />}
        />

        <Route
          path="/viewcourse/:courseId"
          element={userData ? <ViewCourse /> : <Navigate to="/login" />}
        />

        <Route
          path="/editprofile"
          element={userData ? <EditProfile /> : <Navigate to="/login" />}
        />

        <Route
          path="/enrolledcourses"
          element={userData ? <EnrolledCourse /> : <Navigate to="/login" />}
        />

        <Route
          path="/viewlecture/:courseId"
          element={userData ? <ViewLecture /> : <Navigate to="/login" />}
        />

        <Route
          path="/searchwithai"
          element={userData ? <SearchWithAi /> : <Navigate to="/login" />}
        />

        <Route
          path="/live/:meetingId"
          element={userData ? <LiveRoom /> : <Navigate to="/login" />}
        />

        <Route
          path="/live-arena/host"
          element={
            userData?.role === "educator" ? (
              <TeacherArena />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/live-arena/join"
          element={userData ? <StudentArena /> : <Navigate to="/login" />}
        />

        <Route
          path="/live-schedule"
          element={userData ? <LiveClassDashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/dashboard"
          element={
            userData?.role === "educator" ? <Dashboard /> : <Navigate to="/" />
          }
        />

        <Route
          path="/courses"
          element={
            userData?.role === "educator" ? <Courses /> : <Navigate to="/" />
          }
        />

        <Route
          path="/addcourses/:courseId"
          element={
            userData?.role === "educator" ? <AddCourses /> : <Navigate to="/" />
          }
        />

        <Route
          path="/createcourses"
          element={
            userData?.role === "educator" ? (
              <CreateCourse />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/createlecture/:courseId"
          element={
            userData?.role === "educator" ? (
              <CreateLecture />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/editlecture/:courseId/:lectureId"
          element={
            userData?.role === "educator" ? (
              <EditLecture />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/admin/edit-quiz/:lectureId/:courseId/:quizId?"
          element={
            userData?.role === "educator" ? <EditQuiz /> : <Navigate to="/" />
          }
        />

        <Route
          path="/studentdashboard"
          element={
            userData?.role === "student" ? (
              <StudentDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/career"
          element={
            userData?.role === "student" ? <Career /> : <Navigate to="/" />
          }
        />

        <Route
          path="/ai-scheduler"
          element={userData ? <AIScheduler /> : <Navigate to="/login" />}
        />
        <Route
          path="/stress-analysis"
          element={userData ? <StressAnalysis /> : <Navigate to="/login" />}
        />

        <Route path="/forgotpassword" element={<ForgotPassword />} />
      </Routes>
    </>
  );
}

export default App;
