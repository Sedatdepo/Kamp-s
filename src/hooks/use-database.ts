'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    AnnualPlan, DilekceDocument, DutyRosterDocument, SeatingPlanDocument, 
    ElectionDocument, GradingDocument, RiskMapDocument, CommunicationDocument, 
    HomeworkDocument, DisciplineRecord, ExamAnalysisDocument, HomeworkStatusDocument,
    InfoFormsStatusDocument, GuidanceReferralRecord, SchoolInfo, StudentInfoFormData, ObservationDocument, Timetable, TimetableCell, Class, AgendaEvent
} from '@/lib/types';

// localStorage anahtarı
const DB_KEY = 'ito_kampus_database';

// Veritabanı yapısı
export interface Database {
  annualPlans: AnnualPlan[];
  dilekceDocuments: DilekceDocument[];
  dutyRosterDocuments: DutyRosterDocument[];
  seatingPlanDocuments: SeatingPlanDocument[];
  electionDocuments: ElectionDocument[];
  gradingDocuments: GradingDocument[];
  riskMapDocuments: RiskMapDocument[];
  communicationDocuments: CommunicationDocument[];
  homeworkDocuments: HomeworkDocument[];
  disciplineRecords: DisciplineRecord[];
  zumreDocuments: any[];
  userScenarios: Record<string, string[]>; 
  examAnalysisDocuments?: ExamAnalysisDocument[];
  homeworkStatusDocuments?: HomeworkStatusDocument[];
  infoFormsStatusDocuments?: InfoFormsStatusDocument[];
  guidanceReferralRecords: GuidanceReferralRecord[]; // NEW
  observationDocuments?: ObservationDocument[]; // NEW
  schoolInfo?: SchoolInfo; // NEW
  studentInfoForms: StudentInfoFormData[];
  dersProgrami: Timetable;
  agendaEvents?: AgendaEvent[];
}

// Varsayılan boş veritabanı
const initialDb: Database = {
  annualPlans: [],
  dilekceDocuments: [],
  dutyRosterDocuments: [],
  seatingPlanDocuments: [],
  electionDocuments: [],
  gradingDocuments: [],
  riskMapDocuments: [],
  communicationDocuments: [],
  homeworkDocuments: [],
  disciplineRecords: [],
  zumreDocuments: [],
  userScenarios: {}, 
  examAnalysisDocuments: [],
  homeworkStatusDocuments: [],
  infoFormsStatusDocuments: [],
  guidanceReferralRecords: [], // NEW
  observationDocuments: [], // NEW
  schoolInfo: { schoolName: '', className: '', classTeacherName: '', dutyDay: '', dutyPlace: '' }, // NEW
  studentInfoForms: [],
  dersProgrami: {
    schedule: {},
    timeSlots: [
        { id: 1, start: '08:30', end: '09:10' },
        { id: 2, start: '09:20', end: '10:00' },
        { id: 3, start: '10:10', end: '10:50' },
        { id: 4, start: '11:00', end: '11:40' },
        { id: 5, start: '12:20', end: '13:00' },
        { id: 6, start: '13:10', end: '13:50' },
        { id: 7, start: '14:00', end: '14:40' },
        { id: 8, start: '14:50', end: '15:30' },
    ],
    subjects: [
      { id: 1, name: 'Matematik', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { id: 2, name: 'Türkçe', color: 'bg-red-100 text-red-800 border-red-200' },
      { id: 3, name: 'Fen Bilimleri', color: 'bg-green-100 text-green-800 border-green-200' },
      { id: 4, name: 'Sosyal Bilgiler', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { id: 5, name: 'İngilizce', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      { id: 6, name: 'Beden Eğitimi', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      { id: 7, name: 'Görsel Sanatlar', color: 'bg-pink-100 text-pink-800 border-pink-200' },
      { id: 8, name: 'Müzik', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    ]
  },
  agendaEvents: [],
};

export const useDatabase = () => {
  const [db, setDb] = useState<Database>(initialDb);
  const [loading, setLoading] = useState(true);

  // Component mount olduğunda localStorage'dan veriyi yükle
  useEffect(() => {
    setLoading(true);
    try {
      const storedDb = localStorage.getItem(DB_KEY);
      if (storedDb && storedDb.trim().length > 2) { // Basic check for non-empty JSON
        const parsedDb = JSON.parse(storedDb);
        // Merge with initialDb to ensure all keys are present and the app doesn't crash on new fields
        setDb(prevDb => ({ ...initialDb, ...parsedDb }));
      } else {
        // If no valid data, initialize localStorage with the default structure
        localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
        setDb(initialDb);
      }
    } catch (error) {
      console.error("Failed to load or parse database from localStorage, resetting:", error);
      // On parsing error, reset to initial state to prevent crash loop
      localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
      setDb(initialDb);
    } finally {
      setLoading(false);
    }
  }, []);

  // `db` state'i her değiştiğinde localStorage'ı güncelle
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      } catch (error) {
        console.error("Failed to save database to localStorage:", error);
      }
    }
  }, [db, loading]);
  
  const memoizedSetDb = useCallback((value: React.SetStateAction<Database>) => {
    setDb(value);
  }, []);

  return { db, setDb: memoizedSetDb, loading };
};
