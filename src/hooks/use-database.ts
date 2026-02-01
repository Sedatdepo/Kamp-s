'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { 
    AnnualPlan, DilekceDocument, DutyRosterDocument, SeatingPlanDocument, 
    ElectionDocument, GradingDocument, RiskMapDocument, CommunicationDocument, 
    HomeworkDocument, DisciplineRecord, ExamAnalysisDocument, HomeworkStatusDocument,
    InfoFormsStatusDocument, GuidanceReferralRecord, SchoolInfo, StudentInfoFormData, ObservationRecord, Timetable, TimetableCell, AssignmentTemplate, EdebiyatAsistanDocument, SokDocument, VeliToplantisiDocument, ZumreDocument
} from '@/lib/types';

// localStorage anahtarı
export const DB_KEY = 'ito_kampus_database';

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
  zumreDocuments: ZumreDocument[];
  sokDocuments: SokDocument[];
  veliToplantisiDocuments: VeliToplantisiDocument[];
  userScenarios: Record<string, string[]>; 
  examAnalysisDocuments: ExamAnalysisDocument[];
  homeworkStatusDocuments: HomeworkStatusDocument[];
  infoFormsStatusDocuments: InfoFormsStatusDocument[];
  guidanceReferralRecords: GuidanceReferralRecord[];
  observationRecords: ObservationRecord[];
  schoolInfo: SchoolInfo | null;
  studentInfoForms: StudentInfoFormData[];
  dersProgrami: Timetable;
  performanceAssignments: AssignmentTemplate[];
  projectAssignments: AssignmentTemplate[];
  performanceFavorites: number[];
  projectFavorites: number[];
  edebiyatAsistanArsivi: EdebiyatAsistanDocument[];
  edebiyatKazanımlar: any | null;
}

// Varsayılan boş veritabanı
export const initialDb: Database = {
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
  sokDocuments: [],
  veliToplantisiDocuments: [],
  userScenarios: {}, 
  examAnalysisDocuments: [],
  homeworkStatusDocuments: [],
  infoFormsStatusDocuments: [],
  guidanceReferralRecords: [],
  observationRecords: [],
  schoolInfo: { schoolName: '', className: '', classTeacherName: '', dutyDay: '', dutyPlace: '' },
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
  performanceAssignments: [],
  projectAssignments: [],
  performanceFavorites: [],
  projectFavorites: [],
  edebiyatAsistanArsivi: [],
  edebiyatKazanımlar: null,
};

// Create the context
export const DatabaseContext = createContext<{
  db: Database;
  setDb: React.Dispatch<React.SetStateAction<Database>>;
  loading: boolean;
} | undefined>(undefined);

// Update the hook to use the context
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
