/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailColor: string;
  instructor: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number; // in seconds
  videoUrl?: string; // YouTube, Vimeo, MP4, etc.
  videoFileId?: string; // key pointing to IndexedDB Blob
  quiz?: QuizQuestion[];
  order: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface LessonNote {
  id: string;
  courseId: string;
  lessonId: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

export interface UserProgress {
  completedLessons: string[]; // array of finished lesson IDs
  watchedSeconds: Record<string, number>; // lessonID -> current playback time in seconds
  streak: number;
  lastActive: string; // YYYY-MM-DD
  experiencePoints: number;
}

export const CATEGORIES = [
  "Software Engineering",
  "Product Design",
  "Data Science",
  "Business & Marketing",
  "Creative Arts",
  "Other"
];

export const TAILWIND_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-400 to-teal-600",
  "from-orange-400 to-rose-500",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-fuchsia-600",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-600"
];

export interface ServerVideo {
  _id: string;
  title: string;
  description: string;
  filename: string;
  createdAt: string;
}

export interface AuthenticatedUser {
  name: string;
  email: string;
  token?: string;
}

