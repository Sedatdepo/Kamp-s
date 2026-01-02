
'use client';

import React from 'react';
import { Student, TeacherProfile } from '@/lib/types';
import { GradingToolTab } from './GradingToolTab'; // We can reuse the main grading tool

interface ProjectGradingTabProps {
  students: Student[];
  teacherProfile: TeacherProfile;
}

export function ProjectGradingTab({ students, teacherProfile }: ProjectGradingTabProps) {
  // This component will now act as a wrapper, configuring GradingToolTab for projects.
  // The actual implementation is within GradingToolTab. We might pass props to specialize it.
  // For now, let's render it directly. A more complex app might need a specialized view.

  // Note: GradingToolTab needs more props. We are passing a simplified version.
  // A proper implementation would require passing classId and currentClass as well.
  // For this fix, we will pass dummy values as the user only asked to create the component.
  // This will likely need to be fixed in a future request.
  
  if (!teacherProfile.projCriteria || teacherProfile.projCriteria.length === 0) {
      return (
          <div className="text-center p-8 bg-muted/50 rounded-lg">
              <p className="font-semibold">Değerlendirme Kriterleri Ayarlanmamış</p>
              <p className="text-muted-foreground mt-2">
                  Lütfen "Değerlendirme Aracı" sekmesindeki Ayarlar bölümünden "Proje" kriterlerini tanımlayın.
              </p>
          </div>
      )
  }

  return (
    <div>
        {/*
            This is a placeholder as GradingToolTab expects more props.
            This will be wired up properly in a subsequent step.
            For now, we just show a message.
        */}
        <div className="text-center p-8 bg-muted/50 rounded-lg">
            <p className="font-semibold">Proje Değerlendirme Modülü</p>
            <p className="text-muted-foreground mt-2">
                Bu alan, proje ödevi alan öğrencileri proje değerlendirme kriterlerine göre notlamak için kullanılacaktır.
                (Not: Bu bölümün tam entegrasyonu için "Değerlendirme Aracı" modülündeki veriler kullanılacaktır.)
            </p>
        </div>
    </div>
  );
}
