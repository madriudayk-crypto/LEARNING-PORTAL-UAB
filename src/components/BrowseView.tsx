/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  Clock, 
  Award,
  BookMarked
} from "lucide-react";
import { Course, Lesson, CATEGORIES, UserProgress } from "../types";

interface BrowseViewProps {
  courses: Course[];
  lessons: Record<string, Lesson[]>;
  progress: UserProgress;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function BrowseView({
  courses,
  lessons,
  progress,
  onNavigateToCourse,
  onNavigateToTab
}: BrowseViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Filter logic
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 p-1 text-zinc-100"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-white font-display">
            Course Catalog
          </h2>
          <p className="text-zinc-500 text-xs font-semibold">
            Filter or search through all available course curriculums in Vantage Academy.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses, titles, lecturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e0e11] border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Category Horizontal Scrolling Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
            selectedCategory === "All"
              ? "bg-orange-600 text-black shadow-sm font-bold"
              : "bg-[#0e0e11] text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          All Subjects
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === cat
                ? "bg-orange-600 text-black shadow-md shadow-orange-600/10 font-bold"
                : "bg-[#0e0e11] text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const courseLessons = lessons[course.id] || [];
            
            // Calculate progress percent
            const completedInCourse = courseLessons.filter((lesson) => 
               progress.completedLessons.includes(lesson.id)
            ).length;
            const progressPercent = courseLessons.length > 0 
              ? Math.round((completedInCourse / courseLessons.length) * 100)
              : 0;

            const lessonCountText = courseLessons.length === 1 
              ? "1 Lesson Video" 
              : `${courseLessons.length} Lesson Videos`;

            const totalDurationSeconds = courseLessons.reduce((acc, l) => acc + (l.duration || 0), 0);
            const durationText = `${Math.ceil(totalDurationSeconds / 60)} mins`;

            return (
              <motion.div
                key={course.id}
                whileHover={{ y: -4 }}
                className="bg-[#0e0e11] border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md hover:border-zinc-700"
              >
                <div>
                  {/* Decorative Thumbnail Header */}
                  <div className={`h-36 bg-gradient-to-tr ${course.thumbnailColor} p-5 flex flex-col justify-between text-white relative`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-2.5 py-1 rounded font-mono">
                        {course.category}
                      </span>
                      {progressPercent === 100 && courseLessons.length > 0 && (
                        <span className="inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-widest bg-amber-500 text-black px-2 py-1 rounded shadow-md">
                          <Award className="w-3 h-3" />
                          <span>Certified</span>
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight text-white leading-snug line-clamp-2 drop-shadow-md">
                        {course.title}
                      </h3>
                      <span className="text-[10px] text-white/95 font-semibold tracking-tight mt-1 inline-block font-mono">
                        Lectured by {course.instructor}
                      </span>
                    </div>
                  </div>

                  {/* Course Body Meta Description */}
                  <div className="p-5 space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-[11px] text-zinc-500 font-semibold font-mono">
                      <span className="flex items-center">
                        <BookMarked className="w-3.5 h-3.5 text-orange-500 mr-1" />
                        {lessonCountText}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 text-orange-500 mr-1" />
                        {durationText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators and Footer Action items */}
                <div className="p-5 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3">
                  {courseLessons.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold font-mono">
                        <span>Course Study Progress</span>
                        <span className="text-orange-500 font-extrabold">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-500 block tracking-tight font-medium">
                      No lecture materials added yet. Content coming soon!
                    </span>
                  )}

                  <button
                    onClick={() => onNavigateToCourse(course.id)}
                    className="w-full mt-1.5 py-2.5 px-3 rounded-lg bg-orange-650 bg-orange-600 text-black font-extrabold text-xs transition-colors hover:bg-orange-700 flex items-center justify-center space-x-1 cursor-pointer shadow-md shadow-orange-600/10"
                  >
                    <span>{courseLessons.length > 0 ? "Enter Class" : "View Syllabus"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0e0e11] border border-dashed border-zinc-850 p-12 text-center rounded-2xl flex flex-col items-center justify-center shadow-md">
          <BookMarked className="w-12 h-12 text-zinc-700 mb-2" />
          <h4 className="text-sm font-bold text-zinc-300">No courses match query</h4>
          <p className="text-zinc-500 text-xs mt-1">Try tweaking your search keywords or choosing another subject tab!</p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
            className="mt-4 px-4 py-1.5 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </motion.div>
  );
}
