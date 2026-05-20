import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mongoose } from "./src/utils/mongoose_mock";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.use(cors());
  app.use(express.json());
  
  // Serve uploaded files statically
  app.use("/uploads", express.static(uploadsDir));

  // Connect to simulated MongoDB connection
  await mongoose.connect("mongodb://127.0.0.1:27017/learningPlatform");

  // ===============================
  // USER MODEL
  // ===============================
  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
  });
  const User = mongoose.model("User", userSchema);

  // ===============================
  // VIDEO MODEL
  // ===============================
  const videoSchema = new mongoose.Schema({
    title: String,
    description: String,
    filename: String,
    createdAt: {
      type: Date,
      default: () => new Date()
    }
  });
  const Video = mongoose.model("Video", videoSchema);

  // ===============================
  // MULTER CONFIG
  // ===============================
  const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
    }
  });
  const upload = multer({ storage });

  // ===============================
  // REGISTER API
  // ===============================
  app.post("/api/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Registration failed: Missing parameters" });
      }

      // Check duplicate
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword
      });
      await user.save();

      res.json({ message: "User Registered Successfully" });
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: "Registration Failed" });
    }
  });

  // ===============================
  // LOGIN API
  // ===============================
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User Not Found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid Password" });
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        "SECRETKEY"
      );

      res.json({
        token,
        user: { name: user.name, email: user.email },
        message: "Login Success"
      });
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: "Login Failed" });
    }
  });

  // ===============================
  // VIDEO UPLOAD API
  // ===============================
  app.post("/api/upload", upload.single("video"), async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const video = new Video({
        title: title || req.file.originalname,
        description: description || "No description provided.",
        filename: req.file.filename
      });
      await video.save();

      res.json({ message: "Video Uploaded Successfully", video });
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: "Upload Failed" });
    }
  });

  // ===============================
  // GET ALL VIDEOS
  // ===============================
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await Video.find({});
      res.json(videos);
    } catch(error) {
      console.error(error);
      res.status(500).json({ message: "Cannot Fetch Videos" });
    }
  });

  // --- VITE MIDDLEWARE CONFIG ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
