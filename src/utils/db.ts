/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Course, Lesson, LessonNote, UserProgress } from "../types";

const DB_NAME = "UAB_LearningHub_DB";
const DB_VERSION = 2;

const STORES = {
  COURSES: "courses",
  LESSONS: "lessons",
  VIDEO_FILES: "video_files",
  NOTES: "notes",
  PROGRESS: "progress",
};

/**
 * Open the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        // Initial setup
        db.createObjectStore(STORES.COURSES, { keyPath: "id" });
        db.createObjectStore(STORES.LESSONS, { keyPath: "id" });
        db.createObjectStore(STORES.VIDEO_FILES); // keys will be custom string fileIds
        db.createObjectStore(STORES.NOTES, { keyPath: "id" });
        db.createObjectStore(STORES.PROGRESS); // key will be a standard key like "user"
      } else if (oldVersion < 2) {
        // Upgrade structure if needed
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          db.createObjectStore(STORES.NOTES, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
          db.createObjectStore(STORES.PROGRESS);
        }
      }
    };
  });
}

/**
 * Database API Wrapper
 */
export const dbService = {
  // --- COURSES ---
  async getCourses(): Promise<Course[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.COURSES, "readonly");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async saveCourse(course: Course): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.COURSES, "readwrite");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.put(course);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteCourse(courseId: string): Promise<void> {
    const db = await openDB();
    // Also delete associated lessons and notes
    const lessons = await this.getLessonsByCourse(courseId);
    for (const lesson of lessons) {
      await this.deleteLesson(lesson.id);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.COURSES, "readwrite");
      const store = transaction.objectStore(STORES.COURSES);
      const request = store.delete(courseId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- LESSONS ---
  async getLessonsByCourse(courseId: string): Promise<Lesson[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LESSONS, "readonly");
      const store = transaction.objectStore(STORES.LESSONS);
      const request = store.getAll();
      request.onsuccess = () => {
        const allLessons: Lesson[] = request.result || [];
        const filtered = allLessons
          .filter((lesson) => lesson.courseId === courseId)
          .sort((a, b) => a.order - b.order);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getLesson(lessonId: string): Promise<Lesson | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LESSONS, "readonly");
      const store = transaction.objectStore(STORES.LESSONS);
      const request = store.get(lessonId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async saveLesson(lesson: Lesson, videoBlob?: Blob): Promise<void> {
    const db = await openDB();
    if (videoBlob && lesson.videoFileId) {
      await this.saveVideoFile(lesson.videoFileId, videoBlob);
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LESSONS, "readwrite");
      const store = transaction.objectStore(STORES.LESSONS);
      const request = store.put(lesson);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLesson(lessonId: string): Promise<void> {
    const db = await openDB();
    const lesson = await this.getLesson(lessonId);
    if (lesson && lesson.videoFileId) {
      await this.deleteVideoFile(lesson.videoFileId);
    }

    // Delete notes for this lesson
    const notes = await this.getNotes(lessonId);
    for (const note of notes) {
      await this.deleteNote(note.id);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LESSONS, "readwrite");
      const store = transaction.objectStore(STORES.LESSONS);
      const request = store.delete(lessonId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- VIDEO FILES (BLOBS) ---
  async getVideoFile(fileId: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.VIDEO_FILES, "readonly");
      const store = transaction.objectStore(STORES.VIDEO_FILES);
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async saveVideoFile(fileId: string, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.VIDEO_FILES, "readwrite");
      const store = transaction.objectStore(STORES.VIDEO_FILES);
      const request = store.put(blob, fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteVideoFile(fileId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.VIDEO_FILES, "readwrite");
      const store = transaction.objectStore(STORES.VIDEO_FILES);
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- NOTES ---
  async getNotes(lessonId: string): Promise<LessonNote[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.NOTES, "readonly");
      const store = transaction.objectStore(STORES.NOTES);
      const request = store.getAll();
      request.onsuccess = () => {
        const allNotes: LessonNote[] = request.result || [];
        const filtered = allNotes
          .filter((note) => note.lessonId === lessonId)
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async saveNote(note: LessonNote): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.NOTES, "readwrite");
      const store = transaction.objectStore(STORES.NOTES);
      const request = store.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteNote(noteId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.NOTES, "readwrite");
      const store = transaction.objectStore(STORES.NOTES);
      const request = store.delete(noteId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- PROGRESS ---
  async getProgress(): Promise<UserProgress> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PROGRESS, "readonly");
      const store = transaction.objectStore(STORES.PROGRESS);
      const request = store.get("user");
      request.onsuccess = () => {
        const defaultObject: UserProgress = {
          completedLessons: [],
          watchedSeconds: {},
          streak: 1,
          lastActive: new Date().toISOString().split("T")[0],
          experiencePoints: 0,
        };
        resolve(request.result || defaultObject);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async saveProgress(progress: UserProgress): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.PROGRESS, "readwrite");
      const store = transaction.objectStore(STORES.PROGRESS);
      const request = store.put(progress, "user");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- FACTORY RESET ---
  async seedInitialData(): Promise<void> {
    const currentCourses = await this.getCourses();
    // Seed only if databases are completely empty
    if (currentCourses.length > 0) return;

    const dummyCourses: Course[] = [
      {
        id: "c1",
        title: "Introduction to Full Stack Web Development",
        description: "Master modern HTML5, Tailwind CSS, React, and server-side state in this comprehensive course from scratch.",
        category: "Software Engineering",
        thumbnailColor: "from-indigo-500 to-purple-600",
        instructor: "Dr. Sarah Adams",
        createdAt: new Date().toISOString(),
      },
      {
        id: "c2",
        title: "Sleek User Interface Principles",
        description: "Learn color theories, visual hierarchy, elegant negative spaces, typography pairing, and micro-motions that capture users.",
        category: "Product Design",
        thumbnailColor: "from-pink-500 to-rose-600",
        instructor: "Marcus Kaelen",
        createdAt: new Date().toISOString(),
      },
    ];

    const dummyLessons: Lesson[] = [
      {
        id: "l1_1",
        courseId: "c1",
        title: "1. The Anatomy of Modern Web Platforms",
        description: "Understand layout architectures, component structures, and standard responsive interfaces that run gracefully on multi-screen displays.",
        duration: 98,
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-with-multiple-screens-and-code-39942-large.mp4",
        order: 1,
        quiz: [
          {
            id: "q1",
            question: "What is primary advantage of layout grids in full-screen modern dashboards?",
            options: [
              "They increase performance latency",
              "They maintain proportions and visual alignment across wide resolutions",
              "They restrict dynamic responsive actions",
              "None of the above"
            ],
            correctAnswerIndex: 1,
          },
          {
            id: "q2",
            question: "Why do systems disable Hot Module Replacement (HMR) under structural rebuild contexts?",
            options: [
              "HMR files are insecure",
              "To prevent aggressive reload flickering and inconsistent state updates as files are created in stages",
              "To make code build faster on mobile browsers"
            ],
            correctAnswerIndex: 1,
          }
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "l1_2",
        courseId: "c1",
        title: "2. Setting up state mechanics in React",
        description: "Dive deep into functional React, custom hook development, and modern client storage such as IndexedDB that replaces sluggish API networks.",
        duration: 124,
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-typing-fast-on-a-glowing-keyboard-41712-large.mp4",
        order: 2,
        quiz: [
          {
            id: "q3",
            question: "Which web architecture is most robust for offline video learning?",
            options: [
              "Storing large mp4 videos directly inside simple browser LocalStorage (max 5MB limit)",
              "IndexedDB Binary Blobs matched with local Blob URLs",
              "Simulated API mock text lines saved in .env"
            ],
            correctAnswerIndex: 1,
          }
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: "l2_1",
        courseId: "c2",
        title: "1. Visual Hierarchy & Spacing Secrets",
        description: "Elevate your visuals. Avoid low-quality slops by prioritizing negative space, typography kerning, and micro-interactions.",
        duration: 65,
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-designing-on-a-digital-tablet-screen-close-up-39962-large.mp4",
        order: 1,
        createdAt: new Date().toISOString(),
      }
    ];

    for (const course of dummyCourses) {
      await this.saveCourse(course);
    }
    for (const lesson of dummyLessons) {
      await this.saveLesson(lesson);
    }

    // Add initial notes to make the playground delightful
    const dummyNotes: LessonNote[] = [
      {
        id: "n1",
        courseId: "c1",
        lessonId: "l1_1",
        timestamp: 12,
        text: "Make sure grids are always fluid. Do not use absolute widths.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "n2",
        courseId: "c1",
        lessonId: "l1_1",
        timestamp: 45,
        text: "HMR is indeed disabled to stop flashing behavior on rapid auto-saving environments.",
        createdAt: new Date().toISOString(),
      }
    ];

    for (const note of dummyNotes) {
      await this.saveNote(note);
    }

    console.log("Database seeded successfully!");
  }
};
