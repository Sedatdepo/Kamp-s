
"use client";

import React, { useState, useMemo } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student, TeacherProfile, Class, Criterion } from '@/lib/types';
import { GradingHeader } from './GradingHeader';
import { GradingTable } from './GradingTable';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';
import { useToast } from '@/hooks/use-toast';
import { exportGradingToRtf } from '@/lib/word-export';

interface GradingToolTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  students: Student[];
  currentClass?: Class | null;
}

export type ActiveGradingTab = 1 | 2 | 3 | 4; // 1: Perf1, 2: Perf2, 3: Proje, 4: Davranış
export type ActiveTerm = 1 | 2;

export function GradingToolTab({ classId, teacherProfile, students, currentClass }: GradingToolTabProps) {
  const { toast } = useToast();
  const teacherId = teacherProfile?.id;
  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(1);

  const perfCriteria = teacherProfile?.perfCriteria ?? INITIAL_PERF_CRITERIA;
  const projCriteria = teacherProfile?.projCriteria ?? INITIAL_PROJ_CRITERIA;
  const behaviorCriteria = teacherProfile?.behaviorCriteria ?? INITIAL_BEHAVIOR_CRITERIA;
  
  const termGradesKey: keyof Student = activeTerm === 1 ? 'term1Grades' : 'term2Grades';

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
        activeTerm,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Dışa aktarmak için sınıf verisi bulunamadı.",
      });
    }
  };

  const getScoreTargetKey = (tab: ActiveGradingTab) => {
    switch (tab) {
        case 1: return 'scores1';
        case 2: return 'scores2';
        case 3: return 'projectScores';
        case 4: return 'behaviorScores';
    }
  };
  
  const handleClearScores = async () => {
    if (!window.confirm("Bu sayfadaki tüm notları temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
        return;
    }
    const scoreKey = getScoreTargetKey(activeTab);
    const batch = writeBatch(db);

    students.forEach(student => {
        const studentRef = doc(db, 'students', student.id);
        const currentTermGrades = student[termGradesKey] || {};
        
        batch.update(studentRef, {
            [termGradesKey]: {
                ...currentTermGrades,
                [scoreKey]: {}
            }
        });
    });

    try {
        await batch.commit();
        toast({ title: "Tüm notlar temizlendi." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Temizleme sırasında hata oluştu!", description: (e as Error).message });
    }
  };

  const updateStudents = async (updatedStudents: Student[]) => {
    if (students.length === 0) return;
    const batch = writeBatch(db);
    updatedStudents.forEach(updatedStudent => {
        const originalStudent = students.find(s => s.id === updatedStudent.id);
        if (originalStudent) {
            // Compare only the fields that can be changed by GradingTable
            const hasProjectChanged = originalStudent.hasProject !== updatedStudent.hasProject;
            const termGradesChanged = JSON.stringify(originalStudent[termGradesKey]) !== JSON.stringify(updatedStudent[termGradesKey]);

            if (hasProjectChanged || termGradesChanged) {
                 const studentRef = doc(db, "students", updatedStudent.id);
                 const changes: Partial<Student> = {};
                 if (hasProjectChanged) changes.hasProject = updatedStudent.hasProject;
                 if (termGradesChanged) changes[termGradesKey] = updatedStudent[termGradesKey];
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
        activeTerm={activeTerm}
        setActiveTerm={setActiveTerm}
        teacherProfile={teacherProfile}
        onExport={handleExport}
        onClearScores={handleClearScores}
        updateTeacherProfile={updateTeacherProfile}
      />
      <GradingTable
        activeTab={activeTab}
        students={students}
        currentCriteria={currentCriteria}
        updateStudents={updateStudents}
        termGradesKey={termGradesKey}
      />
    </div>
  );
}
