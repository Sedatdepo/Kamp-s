"use server";

import { collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

// NOTE: In a real app, teacherId should be dynamic based on the logged-in user.
// For seeding purposes, we use a placeholder.
const SEED_TEACHER_ID = "default_teacher";

const defaultLessons = [
  { id: "math_proj", name: "Math Project", quota: 5 },
  { id: "sci_proj", name: "Science Fair", quota: 5 },
  { id: "hist_proj", name: "History Report", quota: 5 },
  { id: "art_proj", name: "Art Portfolio", quota: 5 },
  { id: "music_proj", name: "Music Composition", quota: 5 },
];

const defaultRiskFactors = [
  { id: "risk_family", label: "Broken Family", weight: 3 },
  { id: "risk_attendance", label: "Poor Attendance", weight: 5 },
  { id: "risk_grades", label: "Low Grades", weight: 4 },
  { id: "risk_social", label: "Social Isolation", weight: 2 },
];

export async function seedDatabase() {
  try {
    const lessonsCollection = collection(db, "lessons");
    const riskFactorsCollection = collection(db, "riskFactors");

    const lessonsSnapshot = await getDocs(lessonsCollection);
    const riskFactorsSnapshot = await getDocs(riskFactorsCollection);

    const batch = writeBatch(db);
    let operations = 0;

    if (lessonsSnapshot.empty) {
      console.log("Seeding default lessons...");
      defaultLessons.forEach(lesson => {
        const docRef = collection(db, "lessons").doc(lesson.id);
        batch.set(docRef, { ...lesson, teacherId: SEED_TEACHER_ID });
        operations++;
      });
    }

    if (riskFactorsSnapshot.empty) {
      console.log("Seeding default risk factors...");
      defaultRiskFactors.forEach(risk => {
        const docRef = collection(db, "riskFactors").doc(risk.id);
        batch.set(docRef, { ...risk, teacherId: SEED_TEACHER_ID });
        operations++;
      });
    }

    if (operations > 0) {
      await batch.commit();
      return { success: true, message: "Database seeded successfully." };
    }

    return { success: true, message: "Database already contains data. No seeding needed." };

  } catch (error) {
    console.error("Error seeding database:", error);
    // Ensure that even in case of an error, a structured response is returned.
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Failed to seed database: ${errorMessage}` };
  }
}
