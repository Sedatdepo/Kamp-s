"use client";

import React, { useState, useMemo } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, TeacherProfile, Class, Criterion } from '@/lib/types';
import { GradingHeader } from './GradingHeader';
import { GradingTable } from './GradingTable';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportGradingToRtf } from '@/lib/word-export';

interface GradingToolTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  students: Student[];
  currentClass?: Class | null;
}

export type ActiveGradingTab = 1 | 2 | 3 | 4; // 1: Perf1, 2: Perf2, 3: Proje, 4: Davranış

export function GradingToolTab({ classId, teacherProfile, students, currentClass }: GradingToolTabProps) {
  const { toast } = useToast();
  const teacherId = teacherProfile?.id;
  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);

  const perfCriteria = teacherProfile?.perfCriteria ?? INITIAL_PERF_CRITERIA;
  const projCriteria = teacherProfile?.projCriteria ?? INITIAL_PROJ_CRITERIA;
  const behaviorCriteria = teacherProfile?.behaviorCriteria ?? INITIAL_BEHAVIOR_CRITERIA;

  const currentCriteria = useMemo(() => {
    if (activeTab === 3) return projCriteria;
    if (activeTab === 4) return behaviorCriteria;
    return perfCriteria;
  }, [activeTab, perfCriteria, projCriteria, behaviorCriteria]);

  const handleExport = () => {
    if (currentClass) {
      exportGradingToRtf({
        activeTab,
        students,
        currentCriteria,
        currentClass,
        teacherProfile,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dışa aktarmak için sınıf verisi bulunamadı.",
      });
    }
  };

  const updateStudents = async (updatedStudents: Student[]) => {
    if (students.length === 0) return;
    const batch = writeBatch(db);
    updatedStudents.forEach(updatedStudent => {
        const originalStudent = students.find(s => s.id === updatedStudent.id);
        if (originalStudent) {
            const changes: Partial<Student> = {};
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
  
  if (!teacherProfile || !currentClass) {
    return <p>Öğretmen profili veya sınıf bilgisi yüklenemedi.</p>
  }

  return (
    <div className="space-y-6">
      <GradingHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teacherProfile={teacherProfile}
        onExport={handleExport}
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
