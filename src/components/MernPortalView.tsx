import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cloud,
  User, 
  Lock, 
  Mail, 
  UploadCloud, 
  Play, 
  Clock, 
  FileVideo,
  CheckCircle, 
  AlertCircle,
  Key,
  Database,
  Trash2,
  Bookmark,
  Sparkles,
  Info
} from "lucide-react";
import { ServerVideo, AuthenticatedUser } from "../types";

interface MernPortalViewProps {
  user: AuthenticatedUser | null;
  onLoginSuccess: (user: AuthenticatedUser) => void;
  onLogout: () => void;
}

export default function MernPortalView({
  user,
  onLoginSuccess,
  onLogout
}: MernPortalViewProps) {
  // File input reference Spec
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Form selection: "login" or "register"
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // Registration Inputs
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  
  // Login Inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Feedback/Status States
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Video Upload Inputs
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Loaded Videos List
  const [serverVideos, setServerVideos] = useState<ServerVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [activePlaybackVideo, setActivePlaybackVideo] = useState<string | null>(null);

  // Fetch all videos from backend
  const fetchVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch("/api/videos");
      if (response.ok) {
        const data = await response.json();
        setServerVideos(data);
      } else {
        console.error("Failed to fetch videos from server.");
      }
    } catch (err) {
      console.error("Fetch videos API error:", err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle Registration Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setAuthError("All registration inputs are required");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        setAuthSuccess("Account generated successfully! You can log in now.");
        setRegName("");
        setRegEmail("");
        setRegPassword("");
        setAuthMode("login");
      } else {
        setAuthError(data.message || "Registration failed. Try again.");
      }
    } catch (err) {
      setAuthError("Network connection error during registration.");
      console.error(err);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!loginEmail.trim() || !loginPassword) {
      setAuthError("Email and Password are required to sign in.");
      return;
    }

    setIsSubmittingAuth(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      const data = await res.json();

      if (res.ok && data.token) {
        // Save to browser state / storage
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userInfo", JSON.stringify(data.user));
        
        onLoginSuccess({
          name: data.user.name,
          email: data.user.email,
          token: data.token
        });

        setLoginEmail("");
        setLoginPassword("");
        setAuthSuccess("Login successful!");
      } else {
        setAuthError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      setAuthError("Network connection error during sign in.");
      console.error(err);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  // Multipart Multer Upload
  const handleUploadVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress("Preparing file headers...");

    const formData = new FormData();
    formData.append("title", videoTitle || uploadFile.name);
    formData.append("description", videoDesc || "Uploaded via Vantage Cloud Hub.");
    formData.append("video", uploadFile);

    try {
      setUploadProgress("Uploading payload to Express server filesystem...");
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          // Note: Do NOT set Content-Type header on FormData fetch, browser handles it with boundary
          "Authorization": user?.token ? `Bearer ${user.token}` : ""
        },
        body: formData
      });

      const resData = await response.json();
      if (response.ok) {
        setVideoTitle("");
        setVideoDesc("");
        setUploadFile(null);
        setUploadProgress("Sync completed successfully!");
        setTimeout(() => setUploadProgress(null), 3000);
        fetchVideos();
      } else {
        alert("Upload error: " + (resData.message || "Failed to save file on server"));
        setUploadProgress(null);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please make sure files are within reasonable size bounds!");
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop inputs handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleDragLeave = () => {
    setIsFileDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setUploadFile(file);
      } else {
        alert("Oops, only video files (MP4, WebM) are allowed!");
      }
    }
  };

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setUploadFile(file);
      } else {
        alert("Oops, only video files (MP4, WebM) are allowed!");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8 p-1 text-zinc-100"
    >
      {/* Intro Header Console */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-orange-500" />
            <span className="font-mono uppercase tracking-tight">// Vantage Server Cloud</span>
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5 font-semibold">
            Deploy secure MERN-ready JWT Authentication, stateful file vaults, and Express/Multer persistent video servers.
          </p>
        </div>

        <div className="text-xs bg-[#0e0e11] border border-zinc-800 rounded-xl px-4 py-2 font-mono flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>Local DB Sync: <span className="text-orange-400 font-bold">ACTIVE</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Authorization or Vault Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          <AnimatePresence mode="wait">
            {!user ? (
              // ---------------- AUTHENTICATION FORMS ----------------
              <motion.div
                key="auth-card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-5"
              >
                <div className="flex border-b border-zinc-850 bg-zinc-900/40 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all font-mono uppercase ${
                      authMode === "login"
                        ? "bg-orange-500 text-black font-extrabold"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    JWT Access
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setAuthError(null);
                      setAuthSuccess(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all font-mono uppercase ${
                      authMode === "register"
                        ? "bg-orange-500 text-black font-extrabold"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    User Singup
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-rose-400 text-xs rounded-xl flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-450" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {authMode === "login" ? (
                  // --- LOGIN FORM ---
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">// Email Credentials</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-550 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          placeholder="student@vantage.academy"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs pl-10 pr-3 py-2.5 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">// Secret Hashkey</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-550 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs pl-10 pr-3 py-2.5 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center space-x-2 font-mono"
                    >
                      {isSubmittingAuth ? (
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5 mr-0.5" />
                          <span>Decrypt & Authenticate</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  // --- REGISTER FORM ---
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">// Student Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-550 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="M. Uday Kumar"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs pl-10 pr-3 py-2.5 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">// Unified Email Contact</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-zinc-550 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="email"
                          placeholder="madriudayk@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs pl-10 pr-3 py-2.5 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">// Secret Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-550 text-zinc-500 absolute left-3 top-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs pl-10 pr-3 py-2.5 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingAuth}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl shadow-md transition-all uppercase cursor-pointer flex items-center justify-center space-x-2 font-mono"
                    >
                      {isSubmittingAuth ? (
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      ) : (
                        <span>Generate Student Claims</span>
                      )}
                    </button>
                  </form>
                )}
                
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-1.5 text-[10px] text-zinc-500 font-mono leading-normal">
                  <span className="text-orange-500 font-bold block">// EDUCATION ARCHITECTURE</span>
                  Users registering here will generate persistent entries in our Express Node filesystem. Password data is hashed with bcryptjs salt factors before storage.
                </div>
              </motion.div>
            ) : (
              // ---------------- LOGGED IN: VAULT UPLOADER ----------------
              <motion.div
                key="uploader-card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Active JWT Inspector */}
                <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block font-mono flex items-center gap-1">
                      <Key className="w-3 h-3" /> // Active Session JWT
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold font-mono">VERIFIED</span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-[10px] text-zinc-400 leading-normal break-all">
                      <span className="text-zinc-600">HEADER.</span>
                      <span className="text-orange-400">{user.token ? user.token.split(".")[1] : "CLAIM"}</span>
                      <span className="text-zinc-600">.SIGNATURE</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono text-[10px] border-b border-zinc-900 pb-1">
                        <span className="text-zinc-500">ISSUED BY</span>
                        <span className="text-zinc-300 font-bold">EXPRESS ROUTER</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px] border-b border-zinc-900 pb-1 pt-1">
                        <span className="text-zinc-500">STUDENT</span>
                        <span className="text-zinc-300 font-bold truncate max-w-[150px]">{user.name}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[10px] pt-1">
                        <span className="text-zinc-500">PERMISSIONS</span>
                        <span className="text-orange-400 font-bold font-mono">WRITE_FS, READ_DB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleUploadVideo} className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-lg space-y-5">
                  <h3 className="text-xs font-bold text-white tracking-tight flex items-center space-x-1.5 font-mono uppercase">
                    <UploadCloud className="w-4 h-4 text-orange-500" />
                    <span>Express payload Injector</span>
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Video Subject Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Masterclass on Node Multer"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs px-3 py-2 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Lecture Description</label>
                      <textarea
                        placeholder="Comprehensive details of the lecture syllabus..."
                        value={videoDesc}
                        onChange={(e) => setVideoDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs px-3 py-2 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium resize-none"
                      />
                    </div>

                    {/* Drag and Drop Container */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Lecture Media Spec (MP4/WebM)</label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center min-h-[140px] ${
                          isFileDragging
                            ? "border-orange-500 bg-orange-500/5 text-orange-450"
                            : uploadFile
                              ? "border-orange-500/30 bg-zinc-950 text-zinc-300"
                              : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          id="cloud-video-select"
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleSelectFile}
                        />

                        {uploadFile ? (
                          <div className="space-y-2">
                            <FileVideo className="w-8 h-8 text-orange-500 mx-auto animate-fade-in" />
                            <div className="text-xs">
                              <p className="font-bold text-white truncate max-w-[200px]">{uploadFile.name}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                            <span className="text-[10px] text-orange-500 font-extrabold underline block pt-1 font-mono">REPLACE FILE</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <UploadCloud className="w-8 h-8 text-zinc-650 text-zinc-600 mx-auto" />
                            <div className="text-xs leading-normal font-semibold">
                              Drag & Drop standard video files or <span className="text-orange-500 font-bold underline font-mono">Browse disk</span>
                            </div>
                            <p className="text-[9px] text-zinc-600 leading-snug">Compatible formats: WebM/MP4 sizes up to 100MB</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {uploadProgress && (
                      <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center space-x-2 text-[10px] font-mono text-orange-400">
                        <div className="w-3.5 h-3.5 border border-t-transparent border-orange-500 rounded-full animate-spin" />
                        <span>{uploadProgress}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUploading}
                      onClick={(e) => {
                        if (!uploadFile) {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`w-full py-2.5 font-extrabold rounded-xl text-xs uppercase shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                        !isUploading
                          ? "bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/10"
                          : "bg-zinc-900 text-zinc-650 text-zinc-500 cursor-not-allowed border border-zinc-850"
                      }`}
                    >
                      {isUploading ? (
                        <span>Executing Express Transfer...</span>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          <span>{uploadFile ? "Stream to Multer Pipeline" : "Select & Upload Video File"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Columns - Dynamic Videos List */}
        <div className="lg:col-span-2 space-y-6">

          {/* Player Display Shield when active video is loaded */}
          {activePlaybackVideo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0c] border border-orange-500/25 rounded-2xl overflow-hidden shadow-lg p-2 space-y-3"
            >
              <div className="bg-black aspect-video rounded-xl overflow-hidden relative border border-zinc-900">
                <video
                  className="w-full h-full object-contain"
                  src={`/uploads/${activePlaybackVideo}`}
                  controls
                  autoPlay
                />
              </div>
              <div className="px-3 pb-1.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-orange-500 font-mono flex items-center gap-1 bg-orange-500/5 px-2 py-0.5 rounded border border-orange-500/20 w-max mb-1">
                    <Sparkles className="w-2.5 h-2.5" /> Now Streaming from Server FS
                  </span>
                  <p className="text-xs font-bold text-white truncate">
                    {serverVideos.find(v => v.filename === activePlaybackVideo)?.title || "Active Lecture Session"}
                  </p>
                </div>
                <button
                  onClick={() => setActivePlaybackVideo(null)}
                  className="px-3 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[10px] font-bold font-mono transition-colors shrink-0"
                >
                  Close Stream Player
                </button>
              </div>
            </motion.div>
          )}

          {/* Videos Grid Deck */}
          <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">// Repository Index</span>
                <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5 font-display flex items-center gap-1.5">
                  All Learning Videos <span className="text-xs bg-zinc-850 border border-zinc-800 text-orange-500 font-mono px-2 py-0.5 rounded-full font-extrabold">{serverVideos.length}</span>
                </h3>
              </div>

              <button
                onClick={fetchVideos}
                disabled={isLoadingVideos}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg text-xs font-bold font-mono transition-all flex items-center space-x-1 shrink-0 select-none cursor-pointer"
              >
                {isLoadingVideos ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                ) : (
                  <span>Sync Server Index</span>
                )}
              </button>
            </div>

            {isLoadingVideos && serverVideos.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-orange-500 animate-spin mx-auto" />
                <span className="text-xs text-zinc-500 font-semibold block">Querying system database records...</span>
              </div>
            ) : serverVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serverVideos.map((item) => {
                  const isActiveStream = activePlaybackVideo === item.filename;
                  return (
                    <div
                      key={item._id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between h-[180px] group select-none relative overflow-hidden ${
                        isActiveStream
                          ? "bg-orange-500/[0.02] border-orange-500 shadow-sm"
                          : "bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950 hover:border-zinc-700"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded leading-none">
                            ID: {item._id.slice(-5).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(item.createdAt).toLocaleDateString(undefined, {month: "short", day: "numeric"})}
                          </span>
                        </div>

                        <div>
                          <h4 className={`text-xs font-extra font-extrabold group-hover:text-orange-400 transition-colors truncate max-w-[240px] ${isActiveStream ? "text-orange-400" : "text-white"}`}>
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 line-clamp-3 leading-normal mt-1 pr-2">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-2">
                        <span className="text-[9px] text-zinc-650 text-zinc-500 font-mono truncate max-w-[150px]">
                          File: {item.filename}
                        </span>

                        <button
                          onClick={() => setActivePlaybackVideo(item.filename)}
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-[10px] font-extrabold transition-colors cursor-pointer font-mono ${
                            isActiveStream
                              ? "bg-orange-500 text-black"
                              : "bg-zinc-900 hover:bg-orange-500 text-zinc-400 hover:text-black border border-zinc-800 hover:border-orange-500"
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current shrink-0" />
                          <span>{isActiveStream ? "Streaming" : "Launch Player"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center space-y-4">
                <UploadCloud className="w-10 h-10 text-zinc-700" />
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold text-zinc-400">Node Storage Container Empty</h4>
                  <p className="text-[10px] text-zinc-550 text-zinc-500 max-w-sm px-6 leading-relaxed">
                    Log in with a JWT credentials card, select or drag-and-drop a movie file (.mp4/webm) inside the sidebar panel, and stream it here dynamically!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

    </motion.div>
  );
}
