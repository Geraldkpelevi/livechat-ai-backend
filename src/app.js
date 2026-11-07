import cors from "cors";
import express from "express";
import adminRoutes from "./routes/adminRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import timeClockRoutes from "./routes/timeClockRoutes.js";

const app = express();

// CORS configuration
const allowedOrigins = [
  "https://live-chat-ai-nine.vercel.app",
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        console.warn("Invalid CORS origin:", origin);
        return null;
      }
    })
    .filter(Boolean),
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

console.log("Allowed CORS origins:", allowedOrigins);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ReplyMate AI API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/employees", employeeRoutes);
app.use("/api/employee/time-clock", timeClockRoutes);
app.use("/api", attendanceRoutes);
// Global error handler

app.use((err, req, res, next) => {
  console.error("API Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err.statusCode ||
    (err.name === "ValidationError" ? 400 : 500);

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
});


export default app;
