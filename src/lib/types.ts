

import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

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
  assignmentType?: 'performance' | 'project';
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

export type QuestionType = 'multiple-choice' | 'true-false' | 'open-ended' | 'short-answer' | 'matching' | 'multiple' | 'checkbox' | 'dropdown' | 'linear' | 'date' | 'paragraph' | 'choice' | 'open' | 'text';

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

export interface SociogramQuestion {
    id: number;
    text: string;
    type: 'positive' | 'negative' | 'leadership';
    maxSelections: number;
    active: boolean;
    icon: 'Users' | 'UserX' | 'Star' | 'BookOpen' | 'Coffee';
}
export interface SociogramSurvey {
    title: string;
    questions: SociogramQuestion[];
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
  isClubSelectionActive?: boolean; // NEW
  isSociogramActive?: boolean; // NEW for Sociogram
  announcements?: Announcement[];
  homeworks?: Homework[];
  election?: Election;
  dutyRoster?: RosterItem[];
  seatingPlan?: { [key: string]: string }; // key: 'r-c-s', value: studentId
  seatingPlanRows?: number;
  seatingPlanCols?: number;
  sociogramSurvey?: SociogramSurvey; // NEW
}

export type GradingScores = {
    exam1?: number;
    exam2?: number;
    perf1?: number;
    perf2?: number;
    projectGrade?: number;
    // Use scores1/scores2 for performance grades, projectScores for project, behaviorScores for behavior
    scores1?: { [key: string]: number };
    scores2?: { [key: string]: number };
    projectScores?: { [key: string]: number };
    behaviorScores?: { [key: string]: number };
}

export interface Student {
  id: string;
  authUid?: string;
  uid?: string; // Added for compatibility
  classId: string;
  teacherId: string;
  number: string;
  name: string;
  gender?: 'M' | 'F';
  
  risks: string[]; // Array of riskFactor IDs
  projectPreferences: string[]; // Array of lesson IDs
  clubPreferences?: string[]; // NEW: Array of club IDs
  assignedLesson: string | null; // lesson ID
  assignedClubIds?: string[]; // NEW: Array of club IDs
  fcmTokens?: string[]; // For Push Notifications
  
  // Grading data separated by term
  term1Grades: GradingScores;
  term2Grades: GradingScores;
  
  behaviorScore: number;
  xp?: number; // Gamification experience points
  badges?: string[]; // Gamification badge IDs - should be an array of badge IDs (string)
  customBadges?: CustomBadge[]; // Custom, one-off badges

  hasProject?: boolean;
  
  // New Attendance Field
  attendance?: {
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused';
  }[];

  // UPDATED for new sociogram
  positiveSelections?: string[]; 
  negativeSelections?: string[];
  leadershipSelections?: string[];
}

export interface Lesson {
  id: string;
  name: string;
  quota: number;
  teacherId: string;
}

// NEW: Club type
export interface Club {
  id: string;
  name: string;
  teacherId: string;
  description?: string;
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
export interface DisciplineRecord extends Archivable {
    studentName?: string; // Add studentName for easy access
    currentPhase?: number;
    formData?: {
        studentInfo?: any; // Add studentInfo to formData
        phase1Data?: any;
        incidentDate: string;
        incidentTime: string;
        location: string;
        description: string;
        witnesses: string;
        evidence: string;
        defense?: string;
        decision?: string;
        sanction?: string;
    };
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

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  dateAwarded?: string; 
  cost?: number; 
}

export interface CustomBadge extends Badge {
}

// Mock Database interface to satisfy type checker if needed, 
// though typically this should be handled by Firestore types.
export interface Database {
    disciplineRecords?: DisciplineRecord[];
    zumreDocuments?: any[];
}


// --- SOCIOGRAM AI ANALYSIS TYPES ---

export const SociogramAnalysisInput = z.object({
    studentNames: z.array(z.string()).describe("Sınıftaki tüm öğrencilerin isim listesi."),
    relationships: z.array(z.object({
        from: z.string().describe("Seçimi yapan öğrenci."),
        to: z.string().describe("Seçilen öğrenci."),
        type: z.enum(['positive', 'negative', 'leadership']).describe("Seçim türü (olumlu, olumsuz, lider)."),
    })).describe("Öğrenciler arasındaki tüm seçim ilişkileri."),
});
export type SociogramAnalysisInput = z.infer<typeof SociogramAnalysisInput>;

export const SociogramAnalysisOutput = z.object({
  summary: z.string().describe("Sınıfın genel sosyal yapısı hakkında kısa bir özet."),
  cliques: z.array(z.object({
    members: z.array(z.string()).describe("Grup üyelerinin isimleri."),
    description: z.string().describe("Bu grubun (kliğin) belirgin özelliği."),
  })).describe("Birbirini karşılıklı seçen 3 veya daha fazla öğrenciden oluşan gruplar."),
  leaders: z.array(z.object({
    student: z.string().describe("Lider olarak tanımlanan öğrencinin adı."),
    reason: z.string().describe("Bu öğrencinin neden lider olarak görüldüğünün açıklaması."),
  })).describe("Sınıfın popüler ve gizli liderleri."),
  risks: z.array(z.object({
    student: z.string().describe("Risk grubundaki öğrencinin adı."),
    reason: z.string().describe("Risk grubunda olmasının nedeni (izole, reddedilmiş vb.)."),
    recommendation: z.string().describe("Öğretmene yönelik somut pedagojik tavsiye."),
  })).describe("Sosyal olarak izole edilmiş veya reddedilmiş, destek gerektiren öğrenciler."),
   tensions: z.array(z.object({
    students: z.array(z.string()).length(2).describe("Arasında gerilim olan iki öğrenci."),
    description: z.string().describe("Bu gerilimin olası etkisi hakkında kısa bir yorum."),
  })).describe("Karşılıklı olarak birbirini negatif seçen öğrenci çiftleri arasındaki potansiyel çatışmalar."),
});
export type SociogramAnalysisOutput = z.infer<typeof SociogramAnalysisOutput>;
