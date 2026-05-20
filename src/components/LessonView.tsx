/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Clock, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle, 
  RotateCcw,
  BookOpen,
  ClipboardList,
  AlertCircle,
  VideoOff,
  CornerDownRight,
  ExternalLink
} from "lucide-react";
import { Course, Lesson, LessonNote, UserProgress } from "../types";
import { dbService } from "../utils/db";

interface LessonViewProps {
  course: Course;
  lessons: Lesson[];
  currentLessonId: string;
  progress: UserProgress;
  onBackToCourse: () => void;
  onSwitchLesson: (lessonId: string) => void;
  toggleCompletion: (lessonId: string) => void;
  onAddXP: (xp: number) => void;
}

export default function LessonView({
  course,
  lessons,
  currentLessonId,
  progress,
  onBackToCourse,
  onSwitchLesson,
  toggleCompletion,
  onAddXP
}: LessonViewProps) {
  const currentLesson = lessons.find(l => l.id === currentLessonId) || lessons[0];
  const [activeSubTab, setActiveSubTab] = useState<"notes" | "quiz" | "about">("about");
  
  // Local video state
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  
  // Note fields
  const [noteText, setNoteText] = useState("");
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>([]);
  
  // Quiz fields
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load Video File if stored locally inside IndexedDB
  useEffect(() => {
    if (!currentLesson) return;

    // Reset some states for new video
    setQuizScore(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    
    // Clean up previous Object URL to avoid memory leakage
    if (localVideoUrl && localVideoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(localVideoUrl);
    }
    setLocalVideoUrl(null);

    // If local file exists, fetch it
    if (currentLesson.videoFileId) {
      setIsLoadingVideo(true);
      dbService.getVideoFile(currentLesson.videoFileId)
        .then((blob) => {
          if (blob) {
            const fileUrl = URL.createObjectURL(blob);
            setLocalVideoUrl(fileUrl);
          } else {
            console.error("Blob key not found in storage store.");
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingVideo(false));
    } else if (currentLesson.videoUrl) {
      setLocalVideoUrl(currentLesson.videoUrl);
    }

    // Load Notes
    dbService.getNotes(currentLesson.id).then(notes => {
      setLessonNotes(notes);
    });

  }, [currentLessonId, currentLesson]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localVideoUrl && localVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(localVideoUrl);
      }
    };
  }, [localVideoUrl]);

  // Handle timestamp seeking operation
  const seekToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  // Add notes linked with current timestamp
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !currentLesson) return;

    let timestamp = 0;
    if (videoRef.current) {
      timestamp = Math.round(videoRef.current.currentTime);
    }

    const newNote: LessonNote = {
      id: "note_" + Date.now(),
      courseId: course.id,
      lessonId: currentLesson.id,
      timestamp,
      text: noteText,
      createdAt: new Date().toISOString()
    };

    await dbService.saveNote(newNote);
    const updatedNotes = await dbService.getNotes(currentLesson.id);
    setLessonNotes(updatedNotes);
    setNoteText("");
    onAddXP(10); // Reward for taking notes
  };

  const handleDeleteNote = async (noteId: string) => {
    await dbService.deleteNote(noteId);
    const updatedNotes = await dbService.getNotes(currentLesson.id);
    setLessonNotes(updatedNotes);
  };

  // Helper for formatting notes playback time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Check if standard YouTube
  const getPlayableState = () => {
    if (!localVideoUrl && !currentLesson?.videoUrl) {
      return { type: "none" };
    }

    const url = localVideoUrl || currentLesson?.videoUrl || "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      let videoId = "";
      if (url.includes("youtube.com/watch")) {
        try {
          const urlParams = new URLSearchParams(new URL(url).search);
          videoId = urlParams.get("v") || "";
        } catch {
          // ignore
        }
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (url.includes("youtube.com/embed/")) {
        // extract ID
        videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
      }
      return { 
        type: "youtube", 
        url: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0` : url 
      };
    }

    return { type: "native", url };
  };

  const videoMeta = getPlayableState();

  // Handle Quiz Submissions
  const handleSelectAnswer = (qIdx: number, aIdx: number) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  };

  const submitQuizAnswers = () => {
    if (!currentLesson.quiz) return;
    
    let correct = 0;
    currentLesson.quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });

    setQuizScore(correct);
    setQuizSubmitted(true);
    
    // Give experience points for submitted answers
    const quizXP = correct * 30; // 30XP per correct answer
    onAddXP(quizXP);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
  };

  const isCompleted = progress.completedLessons.includes(currentLesson.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-1"
    >
      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToCourse}
          className="inline-flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white font-bold cursor-pointer transition-colors font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Syllabus Directory ({course.title})</span>
        </button>

        <button
          onClick={() => toggleCompletion(currentLesson.id)}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all font-mono ${
            isCompleted 
              ? "bg-orange-500 text-black font-extrabold border border-orange-500" 
              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850 hover:text-white"
          }`}
        >
          <CheckCircle className={`w-3.5 h-3.5 ${isCompleted ? "text-black" : "text-zinc-500"}`} />
          <span>{isCompleted ? "Lesson Completed" : "Mark Complete"}</span>
        </button>
      </div>

      {/* Modern Layout Row: Theater / Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Playback Console Container (2 Grid spaces) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visual Display Block */}
          <div className="bg-black aspect-video rounded-2xl overflow-hidden relative shadow-lg group border border-zinc-800">
            {isLoadingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-orange-500 animate-spin" />
                <span className="text-xs font-semibold">Loading video...</span>
              </div>
            ) : videoMeta.type === "youtube" ? (
              <iframe
                src={videoMeta.url}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                title={currentLesson.title}
              />
            ) : videoMeta.type === "native" && videoMeta.url ? (
              <video
                ref={videoRef}
                src={videoMeta.url}
                className="w-full h-full object-contain"
                controls
                playsInline
                title={currentLesson.title}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 p-8 text-center space-y-3 bg-[#0a0a0c]">
                <VideoOff className="w-10 h-10 text-zinc-700" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 leading-tight">No connected media file found</h4>
                  <p className="text-[10px] text-zinc-650 max-w-sm mt-1 leading-normal">
                    Connect a standard YouTube stream URL, or upload a local WebM/MP4 file inside the Creator Studio section to start watching.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabbed Deck underneath the Player */}
          <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-md overflow-hidden">
            {/* Header tab buttons */}
            <div className="border-b border-zinc-850 flex items-center bg-zinc-900/50">
              <button
                onClick={() => setActiveSubTab("about")}
                className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer font-mono ${
                  activeSubTab === "about"
                    ? "border-orange-500 text-orange-500 bg-zinc-900/10"
                    : "border-transparent text-zinc-500 hover:text-zinc-350"
                }`}
              >
                About Lesson
              </button>
              <button
                onClick={() => setActiveSubTab("notes")}
                className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer font-mono ${
                  activeSubTab === "notes"
                    ? "border-orange-500 text-orange-500 bg-zinc-900/10"
                    : "border-transparent text-zinc-500 hover:text-zinc-350"
                }`}
              >
                <span>Timestamped Notes</span>
                <span className="text-[9px] bg-zinc-850 text-zinc-350 px-1.5 py-0.2 rounded-full font-mono font-extrabold">
                  {lessonNotes.length}
                </span>
              </button>
              <button
                onClick={() => setActiveSubTab("quiz")}
                className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer font-mono ${
                  activeSubTab === "quiz"
                    ? "border-orange-500 text-orange-500 bg-zinc-900/10"
                    : "border-transparent text-zinc-500 hover:text-zinc-350"
                }`}
              >
                <span>Quiz & Exercises</span>
                {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                  <span className="text-[9px] bg-orange-500 text-black px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">
                    {currentLesson.quiz.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Body contents */}
            <div className="p-6">
              {activeSubTab === "about" && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase font-mono">// Overview</span>
                    <h3 className="text-base font-extrabold text-white tracking-tight leading-snug mt-0.5">
                      {currentLesson.title}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-350 leading-relaxed font-semibold">
                    {currentLesson.description}
                  </p>
                  
                  {currentLesson.videoFileId ? (
                    <div className="inline-flex items-center text-[10px] font-bold text-orange-400 bg-orange-500/5 px-2.5 py-1 rounded-md border border-orange-500/20 font-mono">
                      Offline media active (local)
                    </div>
                  ) : currentLesson.videoUrl ? (
                    <div className="inline-flex items-center text-[10px] text-zinc-400 font-semibold bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800 font-mono">
                      Remote link: <span className="font-bold text-orange-455 text-orange-400 truncate ml-1 max-w-xs">{currentLesson.videoUrl}</span>
                    </div>
                  ) : null}
                </div>
              )}

              {activeSubTab === "notes" && (
                <div className="space-y-6">
                  {/* Notes Form */}
                  {videoMeta.type === "native" ? (
                    <form onSubmit={handleAddNote} className="space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type an educational note linked to current timeline second..."
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2 px-3 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-medium"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-xs flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Note</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-semibold font-mono">
                        Your notes will capture the timestamp automatically. Click a note's timestamp value later to scroll the video seeking head immediately!
                      </span>
                    </form>
                  ) : (
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-start space-x-3 text-zinc-300 text-xs shadow-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
                      <div className="w-full">
                        <strong className="text-white font-mono">// Curriculum Note-Taking:</strong> Pin bookmark notes or questions directly to this course timeline.
                        <form onSubmit={handleAddNote} className="flex gap-2 mt-2.5 w-full">
                          <input
                            type="text"
                            placeholder="Type a manual summary/bookmark note..."
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-850 border-zinc-800 rounded-xl text-xs py-1.5 px-3 text-white placeholder-zinc-550 focus:outline-none focus:border-orange-500 font-semibold"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-black font-extrabold rounded-xl text-xs shrink-0 cursor-pointer"
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Note List display */}
                  <div className="space-y-3 pt-2">
                    {lessonNotes.length > 0 ? (
                      lessonNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-start justify-between gap-4">
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => seekToTimestamp(note.timestamp)}
                              className="px-2 py-0.5 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-550 border-orange-500/30 rounded text-[11px] font-mono text-orange-500 font-bold tracking-tight shrink-0 flex items-center cursor-pointer"
                              title="Jump to time"
                            >
                              <Play className="w-2.5 h-2.5 mr-1 fill-current inline text-orange-500" />
                              {formatTime(note.timestamp)}
                            </button>
                            <span className="text-xs text-zinc-300 font-semibold leading-relaxed">
                              {note.text}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded transition-colors shrink-0 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-6 text-zinc-550 text-zinc-500 text-xs font-mono">
                        No notes submitted yet. Write notes to study better!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSubTab === "quiz" && (
                <div className="space-y-6">
                  {currentLesson.quiz && currentLesson.quiz.length > 0 ? (
                    <div className="space-y-6">
                      {currentLesson.quiz.map((q, qIdx) => {
                        const answer = userAnswers[qIdx];
                        const isCorrectAnswer = answer === q.correctAnswerIndex;
                        
                        return (
                          <div key={q.id} className="space-y-3 border-b border-zinc-900 pb-5 last:border-b-0">
                            <h4 className="text-sm font-extrabold text-white leading-snug">
                              Q{qIdx + 1}: {q.question}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {q.options.map((opt, aIdx) => {
                                const isSelected = answer === aIdx;
                                let btnStyle = "bg-zinc-950 border-zinc-800 text-zinc-350 hover:border-zinc-700 hover:bg-zinc-900/30";
                                
                                if (isSelected) {
                                  if (quizSubmitted) {
                                    btnStyle = isCorrectAnswer 
                                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold" 
                                      : "bg-rose-500/10 border-rose-500 text-rose-450 text-rose-400 font-bold";
                                  } else {
                                    btnStyle = "bg-orange-500/5 border-orange-500 text-orange-400 font-bold";
                                  }
                                } else if (quizSubmitted && aIdx === q.correctAnswerIndex) {
                                  btnStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold";
                                }

                                return (
                                  <button
                                    key={aIdx}
                                    onClick={() => handleSelectAnswer(qIdx, aIdx)}
                                    disabled={quizSubmitted}
                                    className={`w-full text-left p-3 border rounded-xl text-xs transition-colors cursor-pointer ${btnStyle}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Score Result indicators */}
                      {quizSubmitted ? (
                        <div className="p-4 rounded-xl bg-zinc-950 flex flex-col md:flex-row items-center justify-between gap-4 border border-zinc-800 shadow-sm">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">// TEST SCORE</span>
                            <h5 className="text-sm font-bold text-white mt-1">
                              You got <span className="text-orange-500 font-extrabold">{quizScore} / {currentLesson.quiz.length}</span> correct answers!
                            </h5>
                            <span className="text-[10px] text-orange-400 font-bold block mt-1 font-mono">
                              + {(quizScore || 0) * 30} XP added to your student profile metrics
                            </span>
                          </div>
                          
                          <button
                            onClick={resetQuiz}
                            className="inline-flex items-center space-x-1 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
                            <span>Retake Quiz</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={submitQuizAnswers}
                            disabled={Object.keys(userAnswers).length < currentLesson.quiz.length}
                            className={`px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all ${
                              Object.keys(userAnswers).length === currentLesson.quiz.length
                                ? "bg-orange-500 hover:bg-orange-600 text-black"
                                : "bg-zinc-900 text-zinc-650 text-zinc-500 cursor-not-allowed border border-zinc-850 border-zinc-800"
                            }`}
                          >
                            Submit Answers
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-zinc-500 text-xs font-mono">
                      No integrated tests matching this module. Check back later!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Playlist selection column */}
        <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 h-max">
          <div>
            <span className="text-[9px] font-extrabold text-zinc-500 uppercase tracking-widest font-mono">// Syllabus Path</span>
            <h3 className="text-sm font-bold text-white tracking-tight leading-tight font-sans">Course Navigation</h3>
          </div>

          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
            {lessons.map((lesson, idx) => {
              const isSelected = lesson.id === currentLesson.id;
              const lessonCompleted = progress.completedLessons.includes(lesson.id);
              
              return (
                <button
                  key={lesson.id}
                  onClick={() => onSwitchLesson(lesson.id)}
                  className={`w-full flex items-start text-left gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-orange-500/5 text-white border-orange-500 font-bold"
                      : "bg-transparent hover:bg-zinc-900/30 border-transparent text-zinc-400"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border mt-0.5 ${
                    lessonCompleted 
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/30" 
                      : isSelected 
                        ? "bg-orange-500 text-black border-orange-500"
                        : "bg-zinc-950 text-zinc-500 border-zinc-800"
                  }`}>
                    {lessonCompleted ? (
                      <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                    ) : (
                      <span className="text-[10px] font-bold font-mono">{idx + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-bold leading-snug truncate ${
                      isSelected ? "text-orange-400 font-extrabold" : "text-zinc-300 font-semibold"
                    }`}>
                      {lesson.title}
                    </h4>
                    <span className="text-[9px] text-zinc-500 font-semibold flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1 shrink-0 text-orange-500" />
                      {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-850 bg-zinc-950/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <button
              onClick={onBackToCourse}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 border border-zinc-800 rounded-lg text-xs font-extrabold transition-colors cursor-pointer text-center hover:text-white"
            >
              Exit Theater Mode
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
