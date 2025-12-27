
import type { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: number;
  text: string;
  date: string;
  seenBy: string[];
}

export interface Criterion {
  id: string;
  name: string;
  max: number;
}

export interface ReportConfig {
  schoolName?: string;
  academicYear?: string;
  semester?: '1' | '2';
  lessonName?: string;
  teacherName?: string;
  principalName?: string;
  date?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  branch: string;
  schoolName: string;
  principalName: string;
  // Grading Tool Data
  reportConfig?: ReportConfig;
  perfCriteria?: Criterion[];
  projCriteria?: Criterion[];
  behaviorCriteria?: Criterion[];
}

export interface Class {
  id: string;
  name:string;
  teacherId: string;
  code: string;
  isProjectSelectionActive?: boolean;
  isRiskFormActive?: boolean;
  isInfoFormActive?: boolean;
  announcements?: Announcement[];
}

export type GradingScores = {
    scores1?: { [key: string]: number };
    scores2?: { [key: string]: number };
    projectScores?: { [key: string]: number };
    behaviorScores?: { [key: string]: number };
}

export interface Student {
  id: string;
  classId: string;
  number: string;
  name: string;
  password?: string;
  needsPasswordChange: boolean;
  risks: string[]; // Array of riskFactor IDs
  projectPreferences: string[]; // Array of lesson IDs
  assignedLesson: string | null; // lesson ID
  
  // Grading data separated by term
  term1Grades: GradingScores;
  term2Grades: GradingScores;

  hasProject?: boolean;
  
  // New Attendance Field
  attendance?: {
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];
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
  isRead: boolean;
}
