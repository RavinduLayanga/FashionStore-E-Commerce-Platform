const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup: Authoritative check against client origin
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(morgan("dev"));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Centralized 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: "NOT_FOUND",
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
