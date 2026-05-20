/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  Play, 
  Award, 
  BookOpen, 
  Flame, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  CheckCircle,
  FileCheck2,
  Tv
} from "lucide-react";
import { Course, Lesson, UserProgress } from "../types";

interface DashboardViewProps {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  progress: UserProgress;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({
  courses,
  lessons,
  progress,
  onNavigateToCourse,
  onNavigateToTab
}: DashboardViewProps) {
  // Calculations
  const completedCount = progress.completedLessons.length;
  
  // Group lessons to calculate course progress
  const courseCompleteness = courses.map(course => {
    const courseLessons = lessons[course.id] || [];
    if (courseLessons.length === 0) return { course, percent: 0, completed: 0, total: 0 };
    
    const completedInCourse = courseLessons.filter(lesson => 
      progress.completedLessons.includes(lesson.id)
    ).length;
    
    const percent = Math.round((completedInCourse / courseLessons.length) * 100);
    return {
      course,
      percent,
      completed: completedInCourse,
      total: courseLessons.length
    };
  });

  const unlockedCertificates = courseCompleteness.filter(item => item.percent === 100 && item.total > 0);

  // Suggested next course or video
  const lastLessonId = progress.completedLessons[progress.completedLessons.length - 1];
  let focusCourse: Course | null = courses[0] || null;
  let focusLesson: Lesson | null = null;

  if (lastLessonId) {
    // find parent course or next sibling
    for (const course of courses) {
      const cls = lessons[course.id] || [];
      const idx = cls.findIndex(l => l.id === lastLessonId);
      if (idx !== -1) {
        if (idx + 1 < cls.length) {
          focusCourse = course;
          focusLesson = cls[idx + 1];
        } else {
          // completed course! find another incomplete course
          const nextIncomp = courseCompleteness.find(item => item.percent < 100);
          if (nextIncomp) {
            focusCourse = nextIncomp.course;
            const incLessons = lessons[nextIncomp.course.id] || [];
            focusLesson = incLessons.find(l => !progress.completedLessons.includes(l.id)) || incLessons[0] || null;
          }
        }
        break;
      }
    }
  }

  if (!focusLesson && focusCourse) {
    const cls = lessons[focusCourse.id] || [];
    focusLesson = cls.find(l => !progress.completedLessons.includes(l.id)) || cls[0] || null;
  }

  // Study stats
  const totalDurationSeconds = Object.values(lessons).flat().reduce((acc, lesson) => {
    if (progress.completedLessons.includes(lesson.id)) {
      return acc + (lesson.duration || 0);
    }
    return acc;
  }, 0);
  
  const studyHours = (totalDurationSeconds / 3600).toFixed(1);
  const studyMinutes = Math.round((totalDurationSeconds % 3600) / 60);

  // Quick Achievements
  const achievements = [
    {
      title: "First Steps",
      desc: "Complete your first lesson video",
      unlocked: completedCount > 0,
      xp: "+50 XP",
    },
    {
      title: "Self Starters",
      desc: "Upload a custom course or lesson in Studio",
      unlocked: courses.length > 2 || Object.values(lessons).flat().length > 3,
      xp: "+100 XP",
    },
    {
      title: "Scholar",
      desc: "Reach over 300 experience points",
      unlocked: progress.experiencePoints >= 300,
      xp: "+200 XP",
    },
    {
      title: "Graduate",
      desc: "Unlock your first Course certificate",
      unlocked: unlockedCertificates.length > 0,
      xp: "+500 XP",
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-8 p-1 text-zinc-100"
    >
      {/* Welcome Banner */}
      <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-black/80">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Sparkles className="w-48 h-48 text-orange-500 rotate-12" />
        </div>
        
        <div className="max-w-xl relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-orange-450 text-xs font-semibold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back, M. Uday Kumar</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight font-display leading-tight text-white">
            Learn and master complex skills at Vantage Academy.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Upload your lectures and courses, answer customized quizzes, review notes synced instantly with timeline streams, and track your performance badges.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigateToTab("browse")}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm font-semibold shadow-lg shadow-orange-600/25 text-black font-extrabold transition-colors cursor-pointer flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Courses</span>
            </button>
            <button 
              onClick={() => onNavigateToTab("creator-studio")}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-zinc-200"
            >
              Upload Videos
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#0e0e11] border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">// Honor Points</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white font-display block">
            {progress.experiencePoints} <span className="text-xs text-orange-500 font-bold font-mono">XP</span>
          </span>
          <span className="text-xs text-zinc-500 mt-1 block font-medium">Leveling up criteria</span>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">// Completed Lessons</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white font-display block">
            {completedCount} <span className="text-xs text-zinc-500 font-bold font-mono">Videos</span>
          </span>
          <span className="text-xs text-zinc-500 mt-1 block font-medium">Of all active courses</span>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">// Study Duration</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white font-display block">
            {Number(studyHours) > 0 ? `${studyHours}h ` : ""}{studyMinutes}m
          </span>
          <span className="text-xs text-zinc-500 mt-1 block font-medium">Total screening time</span>
        </div>

        <div className="bg-[#0e0e11] border border-zinc-800 rounded-xl p-5 shadow-sm hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">// Study Streak</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Flame className="w-4.5 h-4.5" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white font-display block">
            {progress.streak} <span className="text-xs text-zinc-500 font-bold font-mono font-sans">Days</span>
          </span>
          <span className="text-xs text-zinc-500 mt-1 block font-medium">Active streak index</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Playback Focus Suggestion / Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-2 font-mono">
            <Tv className="w-4 h-4 text-orange-500" />
            <span>// Continue Learning</span>
          </h3>

          {focusLesson && focusCourse ? (
            <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row hover:border-zinc-700 transition-all">
              <div className={`md:w-56 shrink-0 bg-gradient-to-tr ${focusCourse.thumbnailColor} p-6 flex flex-col justify-between text-white relative min-h-[160px]`}>
                <div className="text-[9px] font-extrabold tracking-widest uppercase bg-black/40 backdrop-blur-md px-2 py-0.5 rounded w-max">
                  {focusCourse.category}
                </div>
                <div className="space-y-1 mt-6">
                  <h4 className="text-sm font-bold tracking-tight line-clamp-2 leading-snug drop-shadow-md">{focusCourse.title}</h4>
                  <p className="text-[10px] text-white/90 font-semibold font-mono">Lecturer: {focusCourse.instructor}</p>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded font-mono">Up Next</span>
                    <span className="text-[11px] text-zinc-400 flex items-center font-mono">
                      <Clock className="w-3.5 h-3.5 mr-1 text-orange-500" />
                      {Math.floor(focusLesson.duration / 60)}m {focusLesson.duration % 60}s
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white tracking-tight leading-snug">
                    {focusLesson.title}
                  </h4>
                  <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                    {focusLesson.description}
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between border-t border-zinc-800 mt-4">
                  <span className="text-xs text-zinc-500 font-mono">
                    Course progress: {courseCompleteness.find(item => item.course.id === focusCourse?.id)?.percent || 0}%
                  </span>
                  <button 
                    onClick={() => onNavigateToCourse(focusCourse!.id)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-orange-650 bg-orange-600 text-black font-extrabold text-xs shadow-md shadow-orange-600/10 hover:bg-orange-700 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Lesson</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0e0e11] border border-dashed border-zinc-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <BookOpen className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-500">No courses setup yet.</p>
              <button 
                onClick={() => onNavigateToTab("creator-studio")} 
                className="mt-3 text-xs bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 px-3.5 py-1.5 rounded-lg text-orange-500 font-bold cursor-pointer"
              >
                Go to Creator Studio to add videos
              </button>
            </div>
          )}

          {/* Locked/Unlocked Certificate List */}
          <div>
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-2 mb-4 font-mono">
              <Award className="w-4 h-4 text-orange-500" />
              <span>// Academic Certifications ({unlockedCertificates.length})</span>
            </h3>

            {unlockedCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unlockedCertificates.map(item => (
                  <div key={item.course.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-start space-x-3.5 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-black shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-orange-500 font-mono">UNLOCKED CERTIFICATE</span>
                      <h4 className="text-xs font-bold text-white truncate leading-tight mt-0.5">{item.course.title}</h4>
                      <p className="text-[10px] text-zinc-500 block truncate">Given to M. Uday Kumar</p>
                      <div className="mt-2 text-[10px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded w-max font-mono">
                        Verify Code: CU-{item.course.id.toUpperCase()}-VAL
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 text-xs">
                Certificates are unlocked when you complete 100% of the lessons in a course. Begin watching.
              </div>
            )}
          </div>
        </div>

        {/* Gamified Achievements Progress / Right Column */}
        <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-md space-y-6 h-max">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">// Achievements</h3>
            <p className="text-[11px] text-zinc-500 font-medium">Earn additional honor XP along your journey</p>
          </div>

          <div className="space-y-4">
            {achievements.map((ach) => (
              <div key={ach.title} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  ach.unlocked 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-zinc-950 text-zinc-700 border-zinc-800"
                }`}>
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${ach.unlocked ? "text-zinc-200" : "text-zinc-653 text-zinc-600 line-through"}`}>
                      {ach.title}
                    </span>
                    <span className={`text-[10px] font-bold uppercase font-mono ${ach.unlocked ? "text-emerald-400" : "text-orange-500"}`}>
                      {ach.unlocked ? "Unlocked" : ach.xp}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-snug">
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800 bg-zinc-950/50 -mx-6 -mb-6 p-4 rounded-b-2xl flex items-center justify-between">
            <div>
              <span className="text-[9px] block font-bold text-zinc-500 uppercase tracking-widest font-mono">Streak Score</span>
              <span className="text-xs font-bold flex items-center text-orange-500 font-mono">
                <Flame className="w-3.5 h-3.5 mr-1" />
                {progress.streak} Day Study Streak
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 text-right font-mono">
              Last log: <br />
              <span className="font-bold text-zinc-400">{progress.lastActive}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
