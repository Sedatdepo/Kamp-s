

import type { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: number;
  text: string;
  date: string;
  seenBy: string[];
}

export interface Submission {
  id: string; // Document ID
  studentId: string;
  studentName: string;
  studentNumber: string;
  submittedAt: string;
  homeworkId?: string; // To link back to the homework
  studentAuthUid?: string; // To verify storage rules
  text?: string;
  file?: {
    url: string;
    name: string;
    type: string;
  };
  grade?: number;
  feedback?: string;
}

export interface Homework {
  id: string; // Document ID
  classId: string;
  text: string;
  assignedDate: string;
  dueDate?: string;
  seenBy: string[];
  teacherName?: string;
  lessonName?: string;
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

export type ElectionType = 'class_president' | 'school_representative' | 'honor_board';

export interface Candidate extends Student {
  votes: number;
}

export interface Election {
  type: ElectionType;
  candidates: Candidate[];
  votedStudentIds: string[];
}

export interface RosterItem {
  date: string;
  day: string;
  student: string; // "Student Name 1 - Student Name 2"
  studentIds: string[];
}

export interface Class {
  id: string;
  name:string;
  teacherId: string;
  code: string;
  isProjectSelectionActive?: boolean;
  isRiskFormActive?: boolean;
  isInfoFormActive?: boolean;
  isElectionActive?: boolean;
  announcements?: Announcement[];
  // homeworks?: Homework[]; // REMOVED - Now a subcollection
  election?: Election;
  dutyRoster?: RosterItem[];
  seatingPlan?: { [key: string]: string }; // key: 'r-c-s', value: studentId
  seatingPlanRows?: number;
  seatingPlanCols?: number;
}

export type GradingScores = {
    exam1?: number;
    exam2?: number;
    perf1?: number;
    perf2?: number;
    projectScores?: { [key: string]: number };
    behaviorScores?: { [key: string]: number };
    // Deprecated, use perf1/perf2
    scores1?: { [key: string]: number };
    scores2?: { [key: string]: number };
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
  authUid?: string; // UID from anonymous authentication
  
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
  file?: {
    url: string;
    name: string;
    type: string;
  };
}

// Annual Plan Types
export interface DailyPlan {
  id: string;
  date: string;
  konu: string;
  kazanim: string;
  materyal: string;
  plan: {
      giris: string;
      gelisme: string;
      sonuc: string;
  };
  degerlendirme: string;
}

export interface AnnualPlanEntry {
  id: string;
  hafta: string;
  saat: string;
  unite: string;
  konu: string;
  cikti: string; // Kazanım
  yontem: string;
  arac: string;
  degerlendirme: string;
  isDone: boolean;
  isSpecial: boolean; // For holidays etc.
  dailyPlan: DailyPlan | null;
}

export interface AnnualPlan {
  id: number;
  title: string;
  rows: AnnualPlanEntry[];
  dailyPlanSettings: {
      okul: string;
      mudur: string;
      ogretmen: string;
      ders: string;
  };
}

export interface Archivable {
    id: string;
    name: string;
    date: string;
    classId: string;
    data: any;
}

export interface DilekceDocument extends Archivable {
    data: {
        id: string;
        kurum: string;
        kaymakamlik: string;
        mudurluk: string;
        sayi?: string;
        konu?: string;
        tarih: string;
        muhatap: string;
        muhatap_detay?: string;
        ilgiler: { value: string }[];
        metin: string;
        kapanis: string;
        imza_ad_soyad: string;
        imza_unvan: string;
        ekler: { value: string }[];
        dagitim_geregi?: string;
        dagitim_bilgi?: string;
    }
}

export interface DutyRosterDocument extends Archivable {
    data: RosterItem[];
}
export interface SeatingPlanDocument extends Archivable {
    data: {
        plan: { [key: string]: string };
        rows: number;
        cols: number;
    }
}
export interface ElectionDocument extends Archivable {
    data: Election;
}

export interface GradingDocument extends Archivable {
    data: {
        term: 'term1' | 'term2';
        // A snapshot of the relevant grade parts of all students in a class
        studentGrades: { studentId: string, grades: GradingScores }[];
    }
}

export interface RiskMapDocument extends Archivable {
    data: {
        studentRisks: { studentId: string, risks: string[] }[];
    }
}

export interface CommunicationDocument extends Archivable {
    data: {
        announcements: Announcement[];
    }
}

    