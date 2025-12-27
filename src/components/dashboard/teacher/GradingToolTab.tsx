"use client";

import React, { useState, useMemo } from 'react';
import { doc, updateDoc, writeBatch, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, TeacherProfile, Class } from '@/lib/types';
import { GradingHeader } from './GradingHeader';
import { GradingTable } from './GradingTable';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GradingToolTabProps {
  classId: string;
}

export type ActiveGradingTab = 1 | 2 | 3 | 4; // 1: Perf1, 2: Perf2, 3: Proje, 4: Davranış

export function GradingToolTab({ classId }: GradingToolTabProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);

  // Firestore Data Hooks
  const teacherQuery = useMemo(() => teacherId ? doc(db, 'teachers', teacherId) : null, [teacherId]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData.length > 0 ? teacherData[0] : null;

  const classQuery = useMemo(() => doc(db, 'classes', classId), [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${classId}`, studentsQuery);

  const perfCriteria = teacherProfile?.perfCriteria ?? INITIAL_PERF_CRITERIA;
  const projCriteria = teacherProfile?.projCriteria ?? INITIAL_PROJ_CRITERIA;
  const behaviorCriteria = teacherProfile?.behaviorCriteria ?? INITIAL_BEHAVIOR_CRITERIA;

  const currentCriteria = useMemo(() => {
    if (activeTab === 3) return projCriteria;
    if (activeTab === 4) return behaviorCriteria;
    return perfCriteria;
  }, [activeTab, perfCriteria, projCriteria, behaviorCriteria]);

  const updateStudents = async (updatedStudents: Student[]) => {
    if (students.length === 0) return;
    const batch = writeBatch(db);
    // We only update the fields that have changed to avoid overwriting other data
    // and to be more efficient. We'll compare against the original `students` state.
    updatedStudents.forEach(updatedStudent => {
        const originalStudent = students.find(s => s.id === updatedStudent.id);
        if (originalStudent) {
            const changes: Partial<Student> = {};
            // This is a simple deep-ish compare for the score objects.
            const keys: (keyof Student)[] = ['scores1', 'scores2', 'projectScores', 'behaviorScores', 'hasProject'];
            keys.forEach(key => {
                if (JSON.stringify(originalStudent[key]) !== JSON.stringify(updatedStudent[key])) {
                   (changes as any)[key] = updatedStudent[key];
                }
            });

            if (Object.keys(changes).length > 0) {
                 const studentRef = doc(db, "students", updatedStudent.id);
                 batch.update(studentRef, changes);
            }
        }
    });
    try {
        await batch.commit();
        toast({ title: "Notlar kaydedildi." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Kaydederken hata oluştu!", description: (e as Error).message });
        console.error(e);
    }
  };

  const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacherId) return;
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, data);
  };
  
  const isLoading = teacherLoading || studentsLoading || classLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!teacherProfile || !currentClass) {
    return <p>Öğretmen profili veya sınıf bilgisi yüklenemedi.</p>
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
        className={currentClass.name}
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
