/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import BrowseView from "./components/BrowseView";
import CourseDetailView from "./components/CourseDetailView";
import LessonView from "./components/LessonView";
import CreatorStudioView from "./components/CreatorStudioView";
import MyProgressView from "./components/MyProgressView";
import MernPortalView from "./components/MernPortalView";

import { dbService } from "./utils/db";
import { Course, Lesson, UserProgress, AuthenticatedUser } from "./types";
import { 
  BookOpen, 
  HelpCircle, 
  Award, 
  Menu, 
  Sparkles,
  Info
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [progress, setProgress] = useState<UserProgress>({
    completedLessons: [],
    watchedSeconds: {},
    streak: 1,
    lastActive: new Date().toISOString().split("T")[0],
    experiencePoints: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Auth credentials
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // Restore active MERN login claims
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const info = localStorage.getItem("userInfo");
    if (token && info) {
      try {
        const parsedInfo = JSON.parse(info);
        setUser({
          name: parsedInfo.name,
          email: parsedInfo.email,
          token: token
        });
      } catch (err) {
        console.error("Failed to restore claims on load:", err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    setUser(null);
    setActiveTab("mern-portal");
  };

  const handleLoginSuccess = (authenticatedUser: AuthenticatedUser) => {
    setUser(authenticatedUser);
    setActiveTab("mern-portal");
  };

  // Router pointers
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Refresh helper triggered by nested components (Studio uploads, etc)
  const refreshAllLocalStates = async () => {
    try {
      const loadedCourses = await dbService.getCourses();
      setCourses(loadedCourses);

      const lessonsMap: Record<string, Lesson[]> = {};
      for (const course of loadedCourses) {
        lessonsMap[course.id] = await dbService.getLessonsByCourse(course.id);
      }
      setLessons(lessonsMap);

      const loadedProgress = await dbService.getProgress();
      setProgress(loadedProgress);
    } catch (err) {
      console.error("Failed to sync IndexedDB entries:", err);
    }
  };

  // Run initialization on mount
  useEffect(() => {
    const initAppState = async () => {
      try {
        // Seeding standard courses to avoid empty-screen cold starts
        await dbService.seedInitialData();
        await refreshAllLocalStates();
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAppState();
  }, []);

  // Update study progress and add XP
  const toggleLessonCompletion = async (lessonId: string) => {
    const completed = [...progress.completedLessons];
    const idx = completed.indexOf(lessonId);
    let xpChange = 0;

    if (idx !== -1) {
      completed.splice(idx, 1);
      xpChange = -50; // Deduct if unmarked
    } else {
      completed.push(lessonId);
      xpChange = 50; // Allocate XP on ticking completion
    }

    const updatedProgress: UserProgress = {
      ...progress,
      completedLessons: completed,
      experiencePoints: Math.max(0, progress.experiencePoints + xpChange),
      lastActive: new Date().toISOString().split("T")[0]
    };

    setProgress(updatedProgress);
    await dbService.saveProgress(updatedProgress);
  };

  // Custom XP reward triggers inside quizzes or notes
  const addExperiencePoints = async (xp: number) => {
    const updatedProgress: UserProgress = {
      ...progress,
      experiencePoints: progress.experiencePoints + xp,
      lastActive: new Date().toISOString().split("T")[0]
    };

    setProgress(updatedProgress);
    await dbService.saveProgress(updatedProgress);
  };

  // Central Routing Engine rendering relative screen states
  const renderCoreWorkspaceTab = () => {
    if (activeTab === "dashboard") {
      return (
        <DashboardView
          courses={courses}
          lessons={lessons}
          progress={progress}
          onNavigateToCourse={(cId) => setActiveTab(`course-${cId}`)}
          onNavigateToTab={(tId) => setActiveTab(tId)}
        />
      );
    }

    if (activeTab === "browse") {
      return (
        <BrowseView
          courses={courses}
          lessons={lessons}
          progress={progress}
          onNavigateToCourse={(cId) => setActiveTab(`course-${cId}`)}
          onNavigateToTab={(tId) => setActiveTab(tId)}
        />
      );
    }

    if (activeTab === "analytics") {
      return (
        <MyProgressView
          courses={courses}
          lessons={lessons}
          progress={progress}
          onNavigateToLesson={(cId, lId) => {
            setActiveCourseId(cId);
            setActiveLessonId(lId);
            setActiveTab(`lesson-${lId}`);
          }}
        />
      );
    }

    if (activeTab === "creator-studio") {
      return (
        <CreatorStudioView
          courses={courses}
          lessons={lessons}
          onRefreshData={refreshAllLocalStates}
          onAddXP={addExperiencePoints}
        />
      );
    }

    if (activeTab === "mern-portal") {
      return (
        <MernPortalView
          user={user}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      );
    }

    // Detail course syllabus view
    if (activeTab.startsWith("course-")) {
      const courseId = activeTab.replace("course-", "");
      const course = courses.find((c) => c.id === courseId);
      const courseLessons = lessons[courseId] || [];

      if (!course) {
        return (
          <div className="bg-white border rounded-xl p-8 text-center text-neutral-400 text-xs">
            Subject syllabus not found or has been deleted.
          </div>
        );
      }

      return (
        <CourseDetailView
          course={course}
          lessons={courseLessons}
          progress={progress}
          onBack={() => setActiveTab("browse")}
          onPlayLesson={(lId) => {
            setActiveCourseId(courseId);
            setActiveLessonId(lId);
            setActiveTab(`lesson-${lId}`);
          }}
          toggleCompletion={toggleLessonCompletion}
        />
      );
    }

    // Theater level streaming environment
    if (activeTab.startsWith("lesson-")) {
      const lessonId = activeTab.replace("lesson-", "");
      
      // Auto resolve parent course
      const resolvedCourseId = activeCourseId || Object.keys(lessons).find(cId => {
        return lessons[cId].some(l => l.id === lessonId);
      }) || "";

      const course = courses.find((c) => c.id === resolvedCourseId);
      const courseLessons = lessons[resolvedCourseId] || [];

      if (!course) {
        return (
          <div className="bg-white border text-center p-8 text-neutral-400 text-xs">
            Syllabus path unresolved. Exit theater or try re-entering.
          </div>
        );
      }

      return (
        <LessonView
          course={course}
          lessons={courseLessons}
          currentLessonId={lessonId}
          progress={progress}
          onBackToCourse={() => setActiveTab(`course-${resolvedCourseId}`)}
          onSwitchLesson={(lId) => {
            setActiveLessonId(lId);
            setActiveTab(`lesson-${lId}`);
          }}
          toggleCompletion={toggleLessonCompletion}
          onAddXP={addExperiencePoints}
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-50 p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-md">
            <BookOpen className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-850 tracking-tight uppercase">Loading Vantage Academy</h2>
            <span className="text-[10px] text-slate-400 block font-medium">Preparing your personalized learning experience...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-100 antialiased selection:bg-orange-600 selection:text-black">
      
      {/* Dynamic Left Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userProgressScore={progress.experiencePoints} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main workspace display panel structure */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
        
        {/* Top Header Console matching Professional Polish */}
        <header className="h-16 bg-[#09090b] border-b border-zinc-800 px-8 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2.5">
            <span className="text-xs font-bold text-orange-500 tracking-tight font-mono">
              // VANTAGE ACADEMY PORTAL
            </span>
          </div>

          <div className="flex items-center space-x-6">
            {/* Profile segment from design template */}
            <div className="flex items-center space-x-3 pl-6">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-black font-extrabold text-xs shadow-md shadow-orange-600/20 shrink-0 select-none">
                {user ? (user.name ? user.name.slice(0, 2).toUpperCase() : "ST") : "G"}
              </div>
              <div className="text-sm hidden sm:block">
                <p className="font-semibold text-zinc-100 leading-tight">{user ? user.name : "Guest Student"}</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider font-mono">
                  {user ? "Authenticated claims" : "Offline sandbox session"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Core workspace content container scroll window */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          {renderCoreWorkspaceTab()}
        </main>
      </div>

    </div>
  );
}
