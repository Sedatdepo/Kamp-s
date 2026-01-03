
'use client';

import React from 'react';
import { Student, TeacherProfile, Class } from '@/lib/types';
import { GradingToolTab } from './GradingToolTab';
import { INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';


interface ProjectGradingTabProps {
  students: Student[];
  teacherProfile: TeacherProfile;
  currentClass: Class | null;
}

export function ProjectGradingTab({ students, teacherProfile, currentClass }: ProjectGradingTabProps) {
  
  if (!teacherProfile.projCriteria || teacherProfile.projCriteria.length === 0) {
      teacherProfile.projCriteria = INITIAL_PROJ_CRITERIA;
  }

  const projectStudents = students.filter(s => s.assignedLesson);

  if (projectStudents.length === 0) {
    return (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
            <p className="font-semibold">Proje Alan Öğrenci Yok</p>
            <p className="text-muted-foreground mt-2">
                Bu sınıfta henüz proje ödevi atanmış bir öğrenci bulunmuyor.
            </p>
        </div>
    )
  }

  return (
    <div>
        <GradingToolTab
            classId={currentClass?.id || ''}
            teacherProfile={teacherProfile}
            students={projectStudents}
            currentClass={currentClass}
        />
    </div>
  );
}
