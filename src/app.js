
import express from "express";
import cors from "cors";

import adminRoutes from "./routes/adminRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// --------------------------------------------------
// CORS CONFIGURATION
// --------------------------------------------------

const allowedOrigins = new Set([
  "https://live-chat-ai-nine.vercel.app",
  "http://localhost:5173",

  ...(process.env.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        console.warn(`Invalid CLIENT_URL origin: ${origin}`);
        return null;
      }
    })
    .filter(Boolean),
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header (e.g. server-to-server)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);

    return callback(null, false);
  },

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  credentials: true,

  optionsSuccessStatus: 204,
};

// Register CORS before routes and other middleware
app.use(cors(corsOptions));

// --------------------------------------------------
// BODY PARSING
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ReplyMate AI API is running",
  });
});

// --------------------------------------------------
// API ROUTES
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("API Error:", err.message);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
