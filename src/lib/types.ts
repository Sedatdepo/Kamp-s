import type { Timestamp } from 'firebase/firestore';

export interface TeacherProfile {
  id: string;
  name: string;
  branch: string;
  schoolName: string;
  principalName: string;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  isProjectSelectionActive?: boolean;
}

export interface Student {
  id: string;
  classId: string;
  number: string;
  name: string;
  password?: string;
  needsPasswordChange: boolean;
  behaviorScore: number;
  risks: string[]; // Array of riskFactor IDs
  projectPreferences: string[]; // Array of lesson IDs
  assignedLesson: string | null; // lesson ID
  grades: {
    term1: number | null;
    term2: number | null;
  };
  referrals: string[];
}

export interface Lesson {
  id: string;
  name: string;
  quota: number;
  teacherId: string;
}

export interface RiskFactor {
  id: string;
  label: string;
  weight: number;
  teacherId: string;
}

export interface InfoForm {
  id: string; // Should be the same as studentId
  studentId: string;
  submitted: boolean;
  // Personal Info
  birthDate?: Timestamp;
  birthPlace?: string;
  address?: string;
  healthIssues?: string;
  hobbies?: string;
  techUsage?: string;
  // Parent Info
  motherStatus?: 'alive' | 'deceased' | 'unknown';
  motherEducation?: string;
  motherJob?: string;
  fatherStatus?: 'alive' | 'deceased' | 'unknown';
  fatherEducation?: string;
  fatherJob?: string;
  // Family Info
  siblingsInfo?: string;
  economicStatus?: 'low' | 'middle' | 'high';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  participants: string[];
}
