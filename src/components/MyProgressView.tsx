/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Award, 
  Flame, 
  TrendingUp, 
  BookOpen, 
  StickyNote, 
  Clock, 
  CheckCircle,
  ExternalLink,
  Milestone
} from "lucide-react";
import { Course, Lesson, LessonNote, UserProgress } from "../types";
import { dbService } from "../utils/db";

interface MyProgressViewProps {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  progress: UserProgress;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
}

export default function MyProgressView({
  courses,
  lessons,
  progress,
  onNavigateToLesson
}: MyProgressViewProps) {
  const [allNotes, setAllNotes] = useState<LessonNote[]>([]);

  useEffect(() => {
    // Collect notes from all lessons
    const fetchAllNotes = async () => {
      const activeLessons = Object.values(lessons).flat();
      const notesPromises = activeLessons.map(lesson => dbService.getNotes(lesson.id));
      const resolvedNotesLists = await Promise.all(notesPromises);
      const flattenedNotes = resolvedNotesLists.flat().sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      setAllNotes(flattenedNotes);
    };

    fetchAllNotes();
  }, [lessons]);

  // Statistics
  const completedLessonsCount = progress.completedLessons.length;
  
  const courseStatistics = courses.map(course => {
    const courseLessons = lessons[course.id] || [];
    if (courseLessons.length === 0) return { course, percent: 0, completed: 0, total: 0 };
    
    const completed = courseLessons.filter(l => progress.completedLessons.includes(l.id)).length;
    const percent = Math.round((completed / courseLessons.length) * 100);
    return {
      course,
      percent,
      completed,
      total: courseLessons.length
    };
  });

  const totalLessonsCount = Object.values(lessons).flat().length;
  const overallCompleteness = totalLessonsCount > 0 
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100) 
    : 0;

  // Format Helper
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8 p-1 text-zinc-100"
    >
      {/* Visual Level circle segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - overall visual stats */}
        <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">// Overall Rank</h3>
            <p className="text-[11px] text-zinc-500 font-medium font-sans">Vantage Academy progress tracker</p>
          </div>

          {/* Large Ring SVG indicator */}
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-zinc-900"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-orange-500 transition-all duration-500 ease-out"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallCompleteness / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-white font-display">{overallCompleteness}%</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 font-sans">FINISHED</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-350 font-mono">
              <span className="flex items-center text-zinc-400">
                <CheckCircle className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                Completed Videos
              </span>
              <span className="font-bold text-white">{completedLessonsCount} / {totalLessonsCount}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-350 font-mono">
              <span className="flex items-center text-zinc-400">
                <Flame className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                Active Streak
              </span>
              <span className="font-bold text-white">{progress.streak} Days</span>
            </div>
            
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-350 font-mono">
              <span className="flex items-center text-zinc-400">
                <TrendingUp className="w-4 h-4 text-orange-400 mr-2 shrink-0" />
                Total Academic Points
              </span>
              <span className="font-bold text-white">{progress.experiencePoints} XP</span>
            </div>
          </div>
        </div>

        {/* Right column (2 grid spaces) - Course progress detailed charts */}
        <div className="lg:col-span-2 bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">// Class Breakdown</h3>
            <p className="text-[11px] text-zinc-500 font-medium">Completion metrics across every individual subject</p>
          </div>

          <div className="space-y-5">
            {courseStatistics.map(item => (
              <div key={item.course.id} className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider font-mono">
                      {item.course.category}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-200 truncate leading-snug mt-0.5">
                      {item.course.title}
                    </h4>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white font-display block">
                      {item.percent}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium block">
                      {item.completed} of {item.total} videos
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}

            {courses.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-6 font-mono">// Courses created inside studio will map here.</p>
            )}
          </div>
        </div>

      </div>

      {/* Global Timestamped Notes Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <StickyNote className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">// Notes Portfolio ({allNotes.length})</h3>
        </div>

        {allNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allNotes.map((note) => {
              const matchedCourse = courses.find(c => c.id === note.courseId);
              const activeCourseLessons = lessons[note.courseId] || [];
              const matchedLesson = activeCourseLessons.find(l => l.id === note.lessonId);
              
              if (!matchedCourse || !matchedLesson) return null;

              return (
                <div key={note.id} className="p-4 bg-[#0e0e11] border border-zinc-800 rounded-2xl relative hover:border-zinc-700 shadow-md flex flex-col justify-between group transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] uppercase font-bold text-orange-500 tracking-wide block truncate font-mono">
                          {matchedCourse.title}
                        </span>
                        <h4 className="text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                          {matchedLesson.title}
                        </h4>
                      </div>
                      
                      <div className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-300 font-bold shrink-0">
                        {formatTime(note.timestamp)}
                      </div>
                    </div>

                    <p className="text-zinc-300 text-xs leading-relaxed font-semibold bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      {note.text}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-850 mt-4 flex justify-between items-center text-[10px] font-bold text-orange-500 font-mono">
                    <span className="text-zinc-500 font-medium">Added on {new Date(note.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => onNavigateToLesson(note.courseId, note.lessonId)}
                      className="inline-flex items-center space-x-1 hover:text-orange-400 cursor-pointer text-orange-500"
                    >
                      <span>Jump straight here</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0e0e11] border text-center p-8 text-zinc-500 text-xs rounded-2xl shadow-sm border-zinc-800">
            You haven't written any timestamped notes yet. Go to your lessons, watch videos, and click "Add Note" underneath theater mode to populate this list!
          </div>
        )}
      </div>

    </motion.div>
  );
}
