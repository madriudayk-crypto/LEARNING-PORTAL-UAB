/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  CheckCircle2, 
  Award, 
  User, 
  ListOrdered,
  Sparkles,
  PlayCircle
} from "lucide-react";
import { Course, Lesson, UserProgress } from "../types";

interface CourseDetailViewProps {
  course: Course;
  lessons: Lesson[];
  progress: UserProgress;
  onBack: () => void;
  onPlayLesson: (lessonId: string) => void;
  toggleCompletion: (lessonId: string) => void;
}

export default function CourseDetailView({
  course,
  lessons,
  progress,
  onBack,
  onPlayLesson,
  toggleCompletion
}: CourseDetailViewProps) {
  // Stats
  const completedInCourse = lessons.filter((lesson) => 
    progress.completedLessons.includes(lesson.id)
  ).length;

  const percent = lessons.length > 0 
    ? Math.round((completedInCourse / lessons.length) * 100) 
    : 0;

  const totalDurationSeconds = lessons.reduce((acc, lesson) => acc + lesson.duration, 0);
  const minutes = Math.floor(totalDurationSeconds / 60);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-1 text-zinc-100"
    >
      {/* Breadcrumb row */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-1.5 text-xs text-zinc-550 text-zinc-450 hover:text-zinc-300 font-bold transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-orange-500" />
        <span>Back to Directory</span>
      </button>

      {/* Hero Header Card */}
      <div className={`p-8 bg-gradient-to-r ${course.thumbnailColor} text-white rounded-2xl relative overflow-hidden shadow-md`}>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-40 h-40 text-white" />
        </div>

        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="text-[10px] bg-black/40 backdrop-blur-md font-bold tracking-widest uppercase px-2.5 py-1 rounded w-max inline-block font-mono">
            {course.category}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display leading-tight text-white drop-shadow">
            {course.title}
          </h2>
          <p className="text-white/90 text-sm leading-relaxed max-w-xl">
            {course.description}
          </p>

          <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-white/95 font-mono">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1.5 text-orange-400" />
              Lecturer: {course.instructor}
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1.5 text-orange-400" />
              {lessons.length} Modules ({minutes} mins total)
            </span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Lesson Stepper checklist / Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center space-x-2 font-mono">
              <ListOrdered className="w-4.5 h-4.5 text-orange-500" />
              <span>Syllabus & Video Lessons ({lessons.length})</span>
            </h3>
            <span className="text-xs text-zinc-550 text-zinc-500 font-bold font-mono">// Click to study</span>
          </div>

          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson, idx) => {
                const isCompleted = progress.completedLessons.includes(lesson.id);
                return (
                  <motion.div
                    key={lesson.id}
                    whileHover={{ scale: 1.005 }}
                    className={`p-4 bg-[#0e0e11] border border-zinc-800 rounded-2xl flex items-start gap-4 transition-all hover:border-zinc-700 hover:shadow-md ${
                      isCompleted ? "border-emerald-500/20 bg-emerald-500/5" : ""
                    }`}
                  >
                    {/* Tick Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompletion(lesson.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer mt-1 ${
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-550 text-white" 
                          : "border-zinc-700 hover:border-orange-500 hover:bg-zinc-800 text-transparent"
                      }`}
                      title={isCompleted ? "Mark incomplete" : "Mark as completed"}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </button>

                    {/* Lesson Core description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2.5">
                        <h4 className={`text-sm font-bold text-zinc-200 truncate leading-snug ${
                          isCompleted ? "text-zinc-500 line-through" : ""
                        }`}>
                          {lesson.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-mono font-bold bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded shrink-0">
                          {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed font-semibold">
                        {lesson.description}
                      </p>
                      
                      {lesson.quiz && lesson.quiz.length > 0 && (
                        <div className="mt-2.5 inline-flex items-center text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded font-mono">
                          Integrated Quiz: {lesson.quiz.length} Qs
                        </div>
                      )}
                    </div>

                    {/* Quick Play Trigger button */}
                    <button
                      onClick={() => onPlayLesson(lesson.id)}
                      className="w-10 h-10 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 flex items-center justify-center shrink-0 transition-all cursor-pointer self-center"
                      title="Play lecture"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#0e0e11] border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs shadow-sm">
              This course does not have any video lectures. Go to Creator Studio to add lessons and make it live!
            </div>
          )}
        </div>

        {/* Right checklist requirements / Column */}
        <div className="space-y-6">
          <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center space-x-1.5 font-mono">
                <Award className="w-4 h-4 text-orange-500" />
                <span>// Path Completion</span>
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">Requirements for course certificate</p>
            </div>

            <div className="space-y-4">
              {/* Progress metric */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-zinc-400 font-bold font-mono">
                  <span>Completed Lessons</span>
                  <span className="text-orange-500 font-extrabold">{completedInCourse} / {lessons.length}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Requirements checkmarks */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center text-xs text-zinc-300 font-semibold">
                  <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${percent === 100 ? "text-emerald-500" : "text-zinc-700"}`} />
                  <span>Watch every lecture video (100%)</span>
                </div>
                <div className="flex items-center text-xs text-zinc-300 font-semibold">
                  <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${lessons.length > 0 ? "text-emerald-500" : "text-zinc-700"}`} />
                  <span>Enrolled as active student</span>
                </div>
                <div className="flex items-center text-xs text-zinc-300 font-semibold">
                  <CheckCircle2 className={`w-4 h-4 mr-2 shrink-0 ${completedInCourse > 0 ? "text-emerald-500" : "text-zinc-700"}`} />
                  <span>Submit answering quizzes</span>
                </div>
              </div>
            </div>

            {percent === 100 && lessons.length > 0 ? (
              <div className="p-4 bg-zinc-950 border border-orange-500/20 rounded-xl text-center space-y-2 pt-4 shadow-md">
                <Award className="w-8 h-8 text-orange-500 mx-auto animate-bounce" />
                <h4 className="text-xs font-bold text-orange-500">Honor Certificate Unlocked!</h4>
                <p className="text-[10px] text-zinc-400 leading-normal font-medium">
                  Congratulations! You finished the syllabus. Your professional digital profile is ready to share.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-zinc-950/60 rounded-xl text-center text-[11px] text-zinc-500 font-semibold border border-zinc-850">
                Finish all {lessons.length} video lectures to claim your academic certification!
              </div>
            )}
          </div>

          {/* Instructor Bio Box */}
          <div className="bg-[#0e0e11] border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">// Lecturer Info</span>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold font-display text-sm border border-orange-500/20 font-mono">
                {course.instructor.split(" ").map(w => w[0]).join("")}
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white leading-tight">{course.instructor}</h4>
                <span className="text-[10px] text-zinc-500 font-semibold">Vantage Academy Lecturer</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
              Vetted academic leader providing clear conceptual timelines, visual design principles, and engineering blueprints under verified curriculum constraints.
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
