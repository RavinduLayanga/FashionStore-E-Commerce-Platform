const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const apiRouter = require("./routes");

const app = express();
const PORT = process.env.PORT || 5001;

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());

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

  if (res.headersSent) {
    return next(err);
  }

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with these details already exists",
      code: "CONFLICT",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Invalid related record",
      code: "BAD_REQUEST",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
      code: "NOT_FOUND",
    });
  }

  const status = err.status || err.statusCode || 500;
  const safeStatus =
    Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(safeStatus).json({
    success: false,
    message:
      safeStatus >= 500 && isProduction
        ? "Internal server error"
        : err.message || "Request failed",
    code: safeStatus >= 500 ? "INTERNAL_ERROR" : err.code || "REQUEST_ERROR",
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
