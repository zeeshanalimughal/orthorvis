const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const fileUpload = require("express-fileupload");
const path = require("path");
const { logger } = require("./utils/logger");
const requestLogger = require("./middlewares/requestLogger");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/error");

dotenv.config();

(async () => {
  logger.info("Initializing server...");
  await connectDB();
})();

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const caseRoutes = require("./routes/caseRoutes");
const fileRoutes = require("./routes/fileRoutes");

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(requestLogger);

app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "tmp"),
  })
);

app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") {
  logger.debug("Running in development mode");
}

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/protected", protectedRoutes);
app.use("/api/v1/cases", caseRoutes);
app.use("/api/v1/files", fileRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err, promise) => {
  logger.fatal({ err }, `Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, `Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
  });
});
