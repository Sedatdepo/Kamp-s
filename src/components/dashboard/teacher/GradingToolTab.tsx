"use client";

import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, TeacherProfile } from '@/lib/types';
import { GradingHeader } from './GradingHeader';
import { GradingTable } from './GradingTable';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';
import { Loader2 } from 'lucide-react';

interface GradingToolTabProps {
  classId: string;
}

export type ActiveGradingTab = 1 | 2 | 3 | 4; // 1: Perf1, 2: Perf2, 3: Proje, 4: Davranış

export function GradingToolTab({ classId }: GradingToolTabProps) {
  const { appUser } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);

  // Firestore Data Hooks
  const teacherQuery = useMemo(() => teacherId ? doc(db, 'teachers', teacherId) : null, [teacherId]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData.length > 0 ? teacherData[0] : null;

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const perfCriteria = teacherProfile?.perfCriteria ?? INITIAL_PERF_CRITERIA;
  const projCriteria = teacherProfile?.projCriteria ?? INITIAL_PROJ_CRITERIA;
  const behaviorCriteria = teacherProfile?.behaviorCriteria ?? INITIAL_BEHAVIOR_CRITERIA;

  const currentCriteria = useMemo(() => {
    if (activeTab === 3) return projCriteria;
    if (activeTab === 4) return behaviorCriteria;
    return perfCriteria;
  }, [activeTab, perfCriteria, projCriteria, behaviorCriteria]);

  const updateStudents = async (updatedStudents: Student[]) => {
    const batch = writeBatch(db);
    updatedStudents.forEach(student => {
      const studentRef = doc(db, "students", student.id);
      batch.update(studentRef, student);
    });
    await batch.commit();
  };

  const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacherId) return;
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, data);
  };
  
  const isLoading = teacherLoading || studentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!teacherProfile) {
    return <p>Öğretmen profili yüklenemedi.</p>
  }

  return (
    <div className="space-y-6">
      <GradingHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teacherProfile={teacherProfile}
        students={students}
        currentCriteria={currentCriteria}
        updateTeacherProfile={updateTeacherProfile}
      />
      <GradingTable
        activeTab={activeTab}
        students={students}
        currentCriteria={currentCriteria}
        updateStudents={updateStudents}
      />
    </div>
  );
}
