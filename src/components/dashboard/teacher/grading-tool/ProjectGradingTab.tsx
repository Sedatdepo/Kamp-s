'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, TeacherProfile, Class, Criterion } from '@/lib/types';
import { INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { CriteriaGradingTable } from './CriteriaGradingTable';
import { doc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ProjectGradingTabProps {
  students: Student[];
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function ProjectGradingTab({ students, teacherProfile, currentClass }: ProjectGradingTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [localStudents, setLocalStudents] = useState<Student[]>(students);
  
  useEffect(() => {
    setLocalStudents(students);
  }, [students]);

  const projCriteria = useMemo(() => teacherProfile?.projCriteria || INITIAL_PROJ_CRITERIA, [teacherProfile]);
  
  const projectStudents = useMemo(() => {
    return (localStudents || []).filter(s => s.hasProject);
  }, [localStudents]);

  const handleScoreChange = (studentId: string, criteriaId: string, value: number | null) => {
    setLocalStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const updatedStudent = JSON.parse(JSON.stringify(s));
          const termGrades = updatedStudent.term2Grades || {};
          const projectScores = termGrades.projectScores || {};
          if (value === null) {
            delete projectScores[criteriaId];
          } else {
            projectScores[criteriaId] = value;
          }
          termGrades.projectScores = projectScores;
          delete termGrades.projectGrade; 
          updatedStudent.term2Grades = termGrades;
          return updatedStudent;
        }
        return s;
      })
    );
  };
  
  const handleTotalScoreChange = (studentId: string, value: number | null) => {
      setLocalStudents(prev =>
          prev.map(s => {
              if (s.id === studentId) {
                  const updatedStudent = JSON.parse(JSON.stringify(s));
                  const updatedTermGrades = updatedStudent.term2Grades || {};

                  if (value !== null && value >= 0) {
                      const totalMax = projCriteria.reduce((sum, c) => sum + (c.max || 0), 0);
                      const newScores: { [key: string]: number } = {};
                      if (totalMax > 0) {
                          projCriteria.forEach(c => {
                              const proportion = (c.max || 0) / totalMax;
                              newScores[c.id] = Math.round(value * proportion);
                          });
                      }
                      updatedTermGrades.projectGrade = value;
                      updatedTermGrades.projectScores = newScores;
                  } else {
                      delete updatedTermGrades.projectGrade;
                      updatedTermGrades.projectScores = {};
                  }
                  updatedStudent.term2Grades = updatedTermGrades;
                  return updatedStudent;
              }
              return s;
          })
      );
  };
  
  const handleSaveScores = async () => {
    if (!db || projectStudents.length === 0) return;
    
    const batch = writeBatch(db);
    projectStudents.forEach(student => {
      const studentRef = doc(db, 'students', student.id);
      const scores = student.term2Grades?.projectScores || {};
      const manualTotal = student.term2Grades?.projectGrade;

      let finalGrade;
      if (manualTotal !== null && manualTotal !== undefined) {
         finalGrade = manualTotal;
      } else {
         const totalScore = projCriteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
         const maxScore = projCriteria.reduce((sum, c) => sum + (Number(c.max) || 0), 100);
         finalGrade = (maxScore > 0) ? Math.round((totalScore / maxScore) * 100) : 0;
      }

      batch.update(studentRef, {
        'term2Grades.projectScores': scores,
        'term2Grades.projectGrade': finalGrade
      });
    });

    try {
      await batch.commit();
      toast({ title: 'Başarılı!', description: 'Proje notları başarıyla kaydedildi.' });
    } catch (e) {
      toast({ title: 'Hata!', description: 'Notlar kaydedilemedi.', variant: 'destructive' });
    }
  };
  
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
    <CriteriaGradingTable
      students={projectStudents}
      criteria={projCriteria}
      scoreKey="projectScores"
      activeTerm={2} // Projects are always in term 2
      onScoresChange={handleScoreChange}
      onTotalScoreChange={handleTotalScoreChange}
      onSave={handleSaveScores}
      teacherProfile={teacherProfile}
      currentClass={currentClass}
    />
  );
}
