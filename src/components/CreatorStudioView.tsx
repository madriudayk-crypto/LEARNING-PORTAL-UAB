/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  UploadCloud, 
  Globe, 
  FileVideo, 
  ChevronRight, 
  ChevronDown, 
  FolderPlus, 
  Sparkles, 
  HelpCircle,
  Video,
  CheckCircle2,
  X,
  PlusCircle,
  FileText
} from "lucide-react";
import { Course, Lesson, QuizQuestion, CATEGORIES, TAILWIND_GRADIENTS } from "../types";
import { dbService } from "../utils/db";

interface CreatorStudioViewProps {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  onRefreshData: () => void;
  onAddXP: (xp: number) => void;
}

export default function CreatorStudioView({
  courses,
  lessons,
  onRefreshData,
  onAddXP
}: CreatorStudioViewProps) {
  // Navigation states inside Studio
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  
  // Create Course State
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseCategory, setCourseCategory] = useState(CATEGORIES[0]);
  const [courseInstructor, setCourseInstructor] = useState("M. Uday Kumar");
  const [courseGradient, setCourseGradient] = useState(TAILWIND_GRADIENTS[0]);

  // Create Lesson State
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonDurationMin, setLessonDurationMin] = useState("2");
  const [lessonDurationSec, setLessonDurationSec] = useState("30");
  const [videoSourceType, setVideoSourceType] = useState<"url" | "file">("url");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  // Lesson Quiz Creation States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIdx, setCorrectOptionIdx] = useState<number>(0);

  // --- ACTIONS: COURSES ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || !courseDesc.trim()) return;

    const newCourse: Course = {
      id: "course_" + Date.now(),
      title: courseTitle,
      description: courseDesc,
      category: courseCategory,
      thumbnailColor: courseGradient,
      instructor: courseInstructor,
      createdAt: new Date().toISOString()
    };

    await dbService.saveCourse(newCourse);
    onRefreshData();
    onAddXP(50); // XP reward

    // Reset Form
    setCourseTitle("");
    setCourseDesc("");
    setCourseInstructor("M. Uday Kumar");
    setShowCreateCourseForm(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? This will remove all associated lesson videos, notes, and user stats.")) {
      await dbService.deleteCourse(courseId);
      if (activeCourseId === courseId) setActiveCourseId(null);
      onRefreshData();
    }
  };

  // --- ACTIONS: LESSONS ---
  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleFileDragLeave = () => {
    setIsFileDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        alert("Please drop a valid video file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        alert("Please select a valid video file.");
      }
    }
  };

  // Add constructed quiz question to active lesson builder
  const handleAddQuizQuestion = () => {
    if (!currentQuizQuestion.trim()) return;
    const cleanOptions = quizOptions.filter(opt => opt.trim() !== "");
    if (cleanOptions.length < 2) {
      alert("At least 2 options are required for the quiz question!");
      return;
    }

    const newQ: QuizQuestion = {
      id: "q_" + Date.now(),
      question: currentQuizQuestion,
      options: cleanOptions,
      correctAnswerIndex: correctOptionIdx < cleanOptions.length ? correctOptionIdx : 0
    };

    setQuizQuestions(prev => [...prev, newQ]);
    
    // reset current builder
    setCurrentQuizQuestion("");
    setQuizOptions(["", "", "", ""]);
    setCorrectOptionIdx(0);
  };

  const handleRemoveBuilderQuiz = (qId: string) => {
    setQuizQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !lessonTitle.trim()) return;

    if (videoSourceType === "url" && !videoUrl.trim()) {
      alert("Please specify a valid web video link!");
      return;
    }

    if (videoSourceType === "file" && !videoFile) {
      alert("Please choose or drag-and-drop a local video file (MP4/WebM)!");
      return;
    }

    setIsSavingLesson(true);

    try {
      // Calculate duration seconds
      const minutes = parseInt(lessonDurationMin) || 0;
      const seconds = parseInt(lessonDurationSec) || 0;
      const durationSum = (minutes * 60) + seconds;

      const courseLessons = lessons[activeCourseId] || [];
      const nextOrder = courseLessons.length + 1;

      const lessonId = "lesson_" + Date.now();
      const videoFileId = videoSourceType === "file" ? "video_file_" + Date.now() : undefined;

      const newLesson: Lesson = {
        id: lessonId,
        courseId: activeCourseId,
        title: lessonTitle,
        description: lessonDesc || "No description provided for this lesson module.",
        duration: durationSum > 0 ? durationSum : 120, // default 2 minutes fallback
        videoUrl: videoSourceType === "url" ? videoUrl : undefined,
        videoFileId,
        quiz: quizQuestions.length > 0 ? quizQuestions : undefined,
        order: nextOrder,
        createdAt: new Date().toISOString()
      };

      // If local file, save as Blob in IndexedDB
      if (videoSourceType === "file" && videoFile && videoFileId) {
        await dbService.saveLesson(newLesson, videoFile);
      } else {
        await dbService.saveLesson(newLesson);
      }

      onRefreshData();
      onAddXP(100); // 100XP for uploading lesson

      // Reset
      setLessonTitle("");
      setLessonDesc("");
      setLessonDurationMin("2");
      setLessonDurationSec("30");
      setVideoUrl("");
      setVideoFile(null);
      setQuizQuestions([]);

    } catch (err) {
      console.error(err);
      alert("Failed to preserve video file in IndexedDB binary buffer. Check file size limits!");
    } finally {
      setIsSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lecture video?")) {
      await dbService.deleteLesson(lessonId);
      onRefreshData();
    }
  };

  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeCourseLessons = activeCourseId ? (lessons[activeCourseId] || []) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8 p-1 text-zinc-100"
    >
      {/* Intro header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-display flex items-center space-x-2">
            <Video className="w-5 h-5 text-orange-500" />
            <span className="font-mono uppercase tracking-tight">// Vantage Studio</span>
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5 font-semibold">
            Design subjects, upload streaming or offline MP4 lessons, and integrate custom review tests.
          </p>
        </div>

        <button
          onClick={() => setShowCreateCourseForm(prev => !prev)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-black font-extrabold text-xs shadow-md shadow-orange-500/15 flex items-center space-x-1.5 cursor-pointer select-none transition-all"
        >
          {showCreateCourseForm ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>Cancel Form</span>
            </>
          ) : (
            <>
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Establish New Course</span>
            </>
          )}
        </button>
      </div>

      {/* --- SECTION A: CREATE NEW COURSE FORM --- */}
      <AnimatePresence>
        {showCreateCourseForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateCourse}
            className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-5 overflow-hidden"
          >
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5 font-mono uppercase">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Course Initialization Matrix</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Form */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Class in Micro-interactions"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Category Segment</label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-950 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Host Lecturer</label>
                  <input
                    type="text"
                    required
                    value={courseInstructor}
                    onChange={(e) => setCourseInstructor(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                  />
                </div>
              </div>

              {/* Right Form: Description and Gradient choice */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Course Synopsis & Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a professional description mapping modules with outcomes..."
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold resize-none"
                  />
                </div>

                {/* Theme Gradients */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Aesthetic Visual Cover Template</label>
                  <div className="flex flex-wrap gap-2.5">
                    {TAILWIND_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient}
                        type="button"
                        onClick={() => setCourseGradient(gradient)}
                        className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} border transition-all cursor-pointer ${
                          courseGradient === gradient 
                            ? "scale-110 border-white shadow-lg ring-2 ring-orange-500/20" 
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        title={gradient}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-zinc-900 mt-2">
              <button
                type="button"
                onClick={() => setShowCreateCourseForm(false)}
                className="px-4 py-2 border border-zinc-800 text-zinc-400 rounded-lg text-xs font-semibold hover:bg-zinc-900 cursor-pointer hover:text-zinc-100"
              >
                Dismiss
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-extrabold text-xs transition-colors cursor-pointer"
              >
                Save Course Struct
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* --- SECTION B: TWO COLUMN WORKSPACE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Course selection list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">// Active Curriculum ({courses.length})</h3>
            <span className="text-[10px] text-zinc-500 font-bold">Upload destination</span>
          </div>

          <div className="space-y-3">
            {courses.map((course) => {
              const isActive = course.id === activeCourseId;
              const cl = lessons[course.id] || [];
              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setActiveCourseId(course.id);
                    setQuizQuestions([]);
                  }}
                  className={`p-4 bg-[#0e0e11] border rounded-2xl cursor-pointer select-none transition-all relative overflow-hidden group ${
                    isActive 
                      ? "border-orange-500 text-white shadow-md ring-1 ring-orange-500/20" 
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mb-1 block font-mono">
                        {course.category}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight block truncate">
                        {course.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1 block font-semibold font-mono">
                        {cl.length} Lessons active
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id);
                        }}
                        className="p-1 hover:bg-rose-950/40 hover:text-rose-400 rounded text-zinc-600 transition-colors cursor-pointer"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${
                        isActive ? "translate-x-1 text-orange-500" : ""
                      }`} />
                    </div>
                  </div>

                  {/* Thumbnail micro gradient line */}
                  <div className={`h-1.5 absolute left-0 bottom-0 right-0 bg-gradient-to-r ${course.thumbnailColor}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column (2 grids wide) - Lesson management for selected course */}
        <div className="lg:col-span-2 space-y-6">
          {activeCourse ? (
            <div className="space-y-6">
              
              {/* Selected Course Core banner details */}
              <div className="p-5 bg-[#0e0e11] border border-zinc-800 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${activeCourse.thumbnailColor} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-mono">LECTURES & VIDEOS MANAGER</span>
                    <h3 className="text-sm font-extrabold text-white truncate leading-snug">{activeCourse.title}</h3>
                  </div>
                </div>

                <span className="text-xs font-bold text-zinc-350 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg shrink-0 font-mono">
                  {activeCourseLessons.length} Modules
                </span>
              </div>

              {/* Add lesson form */}
              <form onSubmit={handleSaveLesson} className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 font-mono">
                    <FileVideo className="w-4 h-4 text-orange-500" />
                    <span>Upload Lesson Video Structure</span>
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold">Step {activeCourseLessons.length + 1}</span>
                </div>

                {/* Grid fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Lesson Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1. Introduction and Setup"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>

                  {/* Duration input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Est. Video Duration</label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1">
                        <input
                          type="number"
                          min="0"
                          required
                          value={lessonDurationMin}
                          onChange={(e) => setLessonDurationMin(e.target.value)}
                          className="w-full bg-transparent text-xs text-white text-center font-extrabold focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 ml-1 font-bold">mins</span>
                      </div>
                      <div className="flex-1 flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          required
                          value={lessonDurationSec}
                          onChange={(e) => setLessonDurationSec(e.target.value)}
                          className="w-full bg-transparent text-xs text-white text-center font-extrabold focus:outline-none"
                        />
                        <span className="text-[10px] text-zinc-500 ml-1 font-bold">secs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Lesson Summary Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short timeline context for this curriculum video..."
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 font-semibold resize-none"
                  />
                </div>

                {/* Video Media Source type selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Video Media Type</label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType("url")}
                      className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        videoSourceType === "url"
                          ? "bg-orange-500/5 border-orange-500 text-orange-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900/50"
                      }`}
                    >
                      <Globe className="w-5 h-5 text-orange-500" />
                      <div>
                        <span className="text-[10px] font-bold block leading-none">Web Streaming Link</span>
                        <span className="text-[8px] text-zinc-500 font-bold tracking-tight mt-0.5 block">YouTube / Direct MP4 URL</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoSourceType("file")}
                      className={`py-3.5 px-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        videoSourceType === "file"
                          ? "bg-orange-500/5 border-orange-500 text-orange-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900/50"
                      }`}
                    >
                      <UploadCloud className="w-5 h-5 text-orange-500" />
                      <div>
                        <span className="text-[10px] font-bold block leading-none">Local MP4 Uplink File</span>
                        <span className="text-[8px] text-zinc-500 font-bold tracking-tight mt-0.5 block">Offline IndexedDB Storage Blob</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Subfields relative to selection type */}
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl">
                  {videoSourceType === "url" ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Streaming Stream Link / URL</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                      />
                      <span className="text-[9px] text-zinc-500 block font-semibold leading-none mt-1">
                        Paste YouTube, Vimeo or raw mp4 streams. We will automatically output full iframe displays.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Drag Video File</label>
                      
                      {/* Drag Area */}
                      <div
                        onDragOver={handleFileDragOver}
                        onDragLeave={handleFileDragLeave}
                        onDrop={handleFileDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${
                          isFileDragging 
                            ? "border-orange-500 bg-orange-500/10" 
                            : videoFile 
                              ? "border-orange-500 bg-orange-500/5" 
                              : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        <div className="flex flex-col items-center justify-center space-y-1.5 pointer-events-none">
                          <UploadCloud className={`w-7 h-7 ${videoFile ? "text-orange-500 animate-pulse" : "text-zinc-500"}`} />
                          
                          {videoFile ? (
                            <div>
                              <span className="text-xs font-bold text-orange-400 block">File Loaded Successfully</span>
                              <span className="text-[10px] text-zinc-400 block line-clamp-1 mt-0.5 font-semibold">
                                {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs font-bold text-zinc-300 block">Drag & Drop or Click to browse</span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5 font-semibold">MP4, WebM (Highly compressed recommended)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- COURSE QUIZ BUILDER SUB COMPONENT --- */}
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center font-mono">
                      <FileText className="w-4 h-4 text-orange-500 mr-1.5" />
                      Lesson Test Builder ({quizQuestions.length} Questions)
                    </span>
                    <span className="text-[9px] text-orange-500 font-bold font-mono">REWARD: +30XP per Q</span>
                  </div>

                  {/* List of current builders */}
                  {quizQuestions.length > 0 && (
                    <div className="space-y-2">
                      {quizQuestions.map((q, idx) => (
                        <div key={q.id} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-start justify-between text-xs text-zinc-350 font-semibold font-mono">
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="font-bold text-white leading-tight block">Q{idx+1}: {q.question}</span>
                            <span className="text-[10px] text-zinc-500 italic block">Correct Option {q.correctAnswerIndex + 1} ({q.options[q.correctAnswerIndex]})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuilderQuiz(q.id)}
                            className="p-1 hover:bg-zinc-850 text-zinc-500 hover:text-rose-500 rounded cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* builder fields */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-orange-400 uppercase tracking-wider block font-mono">Question Headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Which of these is a semantic element?"
                        value={currentQuizQuestion}
                        onChange={(e) => setCurrentQuizQuestion(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 px-3 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-orange-500 font-semibold shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {quizOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block flex justify-between font-mono">
                            <span>Option {oIdx+1}</span>
                            <button
                              type="button"
                              onClick={() => setCorrectOptionIdx(oIdx)}
                              className={`text-[8px] font-bold px-1.5 py-0.2 rounded transition-all shrink-0 ${
                                correctOptionIdx === oIdx 
                                  ? "bg-orange-500 text-black font-extrabold" 
                                  : "text-orange-500/80 hover:bg-zinc-900"
                              }`}
                            >
                              Set as Correct
                            </button>
                          </label>
                          <input
                            type="text"
                            placeholder={`Option ${oIdx+1} string`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizOptions];
                              updated[oIdx] = e.target.value;
                              setQuizOptions(updated);
                            }}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1 px-2.5 text-xs text-white placeholder-zinc-650 focus:outline-none font-semibold"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddQuizQuestion}
                      className="w-full text-center py-2 border border-dashed border-zinc-800 hover:bg-zinc-900/50 text-orange-500 font-bold text-[10px] rounded-lg tracking-wide uppercase transition-colors cursor-pointer"
                    >
                      + Stack Quiz Question Structure
                    </button>
                  </div>
                </div>

                {/* Form submit */}
                <div className="pt-2 flex justify-end border-t border-zinc-900 mt-2">
                  <button
                    type="submit"
                    disabled={isSavingLesson}
                    className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-sm text-black flex items-center space-x-1.5 cursor-pointer select-none transition-colors bg-orange-500 hover:bg-orange-600 font-extrabold`}
                  >
                    {isSavingLesson ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-900/30 border-t-black animate-spin shrink-0" />
                        <span>Preserving Video Matrix...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Publish Video Lesson</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Syllabus view section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest block font-mono">// Course Syllabus Modules ({activeCourseLessons.length})</h4>
                
                {activeCourseLessons.length > 0 ? (
                  <div className="space-y-2">
                    {activeCourseLessons.map((lesson, index) => (
                      <div key={lesson.id} className="p-3 bg-[#0e0e11] border border-zinc-800 rounded-xl flex items-center justify-between gap-4 self-center shadow-md hover:border-zinc-700 transition-all">
                        <div className="min-w-0 flex-1 flex items-center space-x-3">
                          <span className="text-xs font-bold font-mono text-zinc-400 bg-zinc-900 border border-zinc-850 w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate leading-snug">{lesson.title}</h5>
                            <span className="text-[9px] text-zinc-500 leading-none block font-semibold mt-0.5">
                              {lesson.videoFileId ? "Local Binary Storage Blob" : "Remote Iframe Link"} &bull; {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer shrink-0"
                          title="Delete Lesson"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-[#0e0e11] border border-dashed border-zinc-800 text-zinc-550 text-zinc-500 text-xs text-center rounded-2xl shadow-sm">
                    No modules exist yet. Complete the form above to add your first lecture video.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-[#0e0e11] border rounded-2xl p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center min-h-[360px] shadow-sm border-zinc-800">
              <FolderPlus className="w-10 h-10 text-zinc-750 text-zinc-700 mb-2" />
              <h4 className="font-extrabold text-white font-display font-mono">// No Course Profile Selected</h4>
              <p className="max-w-xs mt-1 font-semibold leading-relaxed">Select an existing course profile on the left column or instantiate a new class to start adding lessons.</p>
              <button 
                onClick={() => setShowCreateCourseForm(true)} 
                className="mt-4 px-4 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 font-extrabold text-xs rounded-xl cursor-pointer shadow-sm shadow-orange-555/5 transition-all"
              >
                Create a course now
              </button>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
