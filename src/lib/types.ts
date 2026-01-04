
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
  studentAuthUid?: string;
  studentName: string;
  studentNumber: string;
  submittedAt: string;
  homeworkId?: string; // To link back to the homework
  text?: string;
  file?: {
    url: string;
    name: string;
    type: string;
  };
  grade?: number;
  feedback?: string;
  rubricScores?: { [criteriaId: string]: number };
  answers?: { [questionId: string]: string | string[] };
}

export interface Homework {
  id: string; // Document ID
  classId: string;
  text: string;
  assignedDate: string;
  dueDate?: string; // Optional due date
  teacherName?: string;
  lessonName?: string;
  seenBy: string[];
  questions?: Question[]; // Added to support exam questions
  rubric?: any; // To differentiate performance homeworks
  instructions?: string;
  assignedStudents?: string[];
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
  email?: string;
  branch: string;
  schoolName: string;
  principalName: string;
  fcmTokens?: string[];
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

export interface MatchingPair {
  id: string;
  question: string;
  answer: string;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'open-ended' | 'short-answer' | 'matching' | 'multiple' | 'checkbox' | 'dropdown' | 'linear' | 'date' | 'paragraph' | 'choice' | 'open';

export interface Question {
  id: string | number;
  text: string;
  type: QuestionType;
  options?: string[]; // For multiple-choice
  matchingPairs?: MatchingPair[]; // For matching questions
  correctAnswer?: string | number | boolean | null;
  kazanimId?: string;
  difficulty?: 'kolay' | 'orta' | 'zor';
  points?: number;
  teacherId?: string;
  required?: boolean;
  image?: string | null;
  span?: number;
  filled?: boolean;
}


export interface Kazanım {
  id: string;
  text: string;
  teacherId: string;
}


export interface Survey {
  id: string;
  title: string;
  description: string;
  classId: string;
  teacherId: string;
  isActive: boolean;
  questions: Question[];
  createdAt: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  studentId: string;
  submittedAt: Timestamp;
  answers: {
      questionId: string;
      answer: string | string[];
  }[];
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
  homeworks?: Homework[];
  election?: Election;
  dutyRoster?: RosterItem[];
  seatingPlan?: { [key: string]: string }; // key: 'r-c-s', value: studentId
  seatingPlanRows?: number;
  seatingPlanCols?: number;
}

export type GradingScores = {
    exam1?: number;
    exam2?: number;
    // Use scores1/scores2 for performance grades, projectScores for project, behaviorScores for behavior
    scores1?: { [key: string]: number };
    scores2?: { [key: string]: number };
    projectScores?: { [key: string]: number };
    behaviorScores?: { [key: string]: number };
}

export interface Student {
  id: string;
  authUid?: string;
  classId: string;
  number: string;
  name: string;
  
  risks: string[]; // Array of riskFactor IDs
  projectPreferences: string[]; // Array of lesson IDs
  assignedLesson: string | null; // lesson ID
  fcmTokens?: string[]; // For Push Notifications
  
  // Grading data separated by term
  term1Grades: GradingScores;
  term2Grades: GradingScores;
  
  behaviorScore: number;

  hasProject?: boolean;
  
  // New Attendance Field
  attendance?: {
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];

  // Project Fields - DEPRECATED, use assignedLesson
  projectCode?: string;
  projectDueDate?: string; // YYYY-MM-DD
  projectSubmitted?: boolean;
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

// --- ARCHIVABLE DOCUMENT TYPES ---
export interface Archivable {
    id: string;
    name: string;
    date: string;
    classId?: string; // classId is optional for some documents like Dilekce
    data: any;
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

export interface HomeworkDocument extends Archivable {
    data: {
        homeworks: Homework[];
        submissions: Submission[];
    }
}

// Yeni eklenen DisciplineRecord tipi
export interface DisciplineRecord {
    id: string;
    name: string;
    date: string;
    currentPhase: number;
    formData: any;
    classId: string;
    studentName?: string; // Add studentName for easy access
}

export interface BepStudent {
    id: string;
    name: string;
    class: string;
    diagnosis: string;
}

export interface SavedDocument<T> {
  id: string;
  name: string;
  date: string;
  data: T;
}

export interface Scenario {
  id: string;
  title: string;
  content: string;
}

// Exam types
export interface Exam {
  examInfo: ExamInfo;
  questions: Question[];
}

export interface ExamInfo {
  title: string;
  logo: string | null;
  group: 'A' | 'B' | 'C' | 'D' | null;
  theme: ExamTheme;
  settings: {
    fontSize: number;
    lineHeight: number;
    watermark: string;
  };
}

export type ExamTheme = 'classic' | 'modern' | 'minimalist';

export interface ExamDocument extends Archivable {
    data: Exam;
}
