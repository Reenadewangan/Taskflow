import cors from "cors";
import "dotenv/config";
import express from "express";
import dotenv from "dotenv";

import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import organizationRoute from "./routes/organizationRoute.js";
import projectRoute from "./routes/projectRoute.js";
import taskRoute from "./routes/taskRoute.js";
import commentRoute from "./routes/commentRoute.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/organizations", organizationRoute);
app.use("/api/projects", projectRoute);
app.use("/api/tasks", taskRoute);
app.use("/api/comments", commentRoute);
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to TaskFlow API!",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected",
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`TaskFlow server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start TaskFlow:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;
