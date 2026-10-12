const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const apiRouter = require("./routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Main API Router
app.use("/api", apiRouter);

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

  // Prisma Error Mapping
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Unique constraint failed",
      code: "CONFLICT",
    });
  }
  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Foreign key constraint failed",
      code: "BAD_REQUEST",
    });
  }
  if (err.code === "P2025") {
    return res
      .status(404)
      .json({ success: false, message: "Record not found", code: "NOT_FOUND" });
  }

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
