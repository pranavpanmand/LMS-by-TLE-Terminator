import express from "express"
import dotenv from "dotenv"
import connectDb from "./configs/db.js"
import authRouter from "./routes/authRoute.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import userRouter from "./routes/userRoute.js"
import courseRouter from "./routes/courseRoute.js"
import paymentRouter from "./routes/paymentRoute.js"
import aiRouter from "./routes/aiRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
import attentionRouter from "./routes/attentionRoute.js"
import uploadRouter from "./routes/upload.js"
import aiSchedulerRoute from "./routes/aiScheduler.route.js";
import quizRouter from "./routes/quizRoute.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import http from "http";
import { initSocket } from "./socket.js";
import chatRoutes from "./routes/chatRoutes.js";
import aiChatRoute from "./routes/aiChatRoute.js";
import usageRoutes from "./routes/usageRoutes.js";
import liveRouter from "./routes/liveRoutes.js"; 
import summaryRouter from "./routes/summaryRoute.js"
import stressRoutes from "./routes/stressRoutes.js";


// ─── STEM Routes ───
import stemQuizRouter from "./routes/stemQuizRoute.js";
import stemExperimentRouter from "./routes/stemExperimentRoute.js";
import stemChatRouter from "./routes/stemChatRoute.js";
import stemProgressRouter from "./routes/stemProgressRoute.js";
import stemInitRouter from "./routes/stemInitRoute.js";

dotenv.config()

let port = process.env.PORT || 8000

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://lms-by-tle-terminator.vercel.app",
  "https://lms-ten-gold.vercel.app",
  "http://lmsbytle.codes",
  "https://lmsbytle.codes",
  "http://www.lmsbytle.codes",
  "https://www.lmsbytle.codes",
  "http://stem.lmsbytle.codes",
  "https://stem.lmsbytle.codes",
];

let app = express()

// 🚨 THE MAGIC FIX FOR RENDER 🚨
// This tells Express to trust the secure HTTPS proxy from Render
app.set("trust proxy", 1);

// 🚨 CORS MUST BE BEFORE ROUTES AND BODY PARSERS 🚨
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}))

app.use(express.json())
app.use(cookieParser())

// --- Routes ---
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/course", courseRouter)
app.use("/api/payment", paymentRouter)
app.use("/api/ai", aiRouter)
app.use("/api/review", reviewRouter)
app.use("/api/attention", attentionRouter)
app.use("/api/divide", uploadRouter)
app.use("/api/quiz", quizRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chatai", aiChatRoute);
app.use("/api/ai-scheduler", aiSchedulerRoute);
app.use("/api/summary", summaryRouter);
app.use("/api/live", liveRouter);
app.use("/api/usage", usageRoutes);

// ─── STEM Routes ───
app.use("/api/stem/quiz", stemQuizRouter);
app.use("/api/stem/experiments", stemExperimentRouter);
app.use("/api/stem/chat", stemChatRouter);
app.use("/api/stem/progress", stemProgressRouter);
app.use("/api/stem", stemInitRouter);


app.use("/api/stress", stressRoutes);
app.get("/" , (req,res)=>{
    res.send("Hello From Server")
})

const server = http.createServer(app);
initSocket(server);

server.listen(port,"0.0.0.0", () => {
    connectDb();
  console.log(`Server running on port ${port}`);
});