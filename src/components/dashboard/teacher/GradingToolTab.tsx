'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  Student,
  TeacherProfile,
  Class,
  Criterion,
  ActiveGradingTab, 
  ActiveTerm,
  DisciplineRecord,
  GradingScores
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, Settings, Sheet } from 'lucide-react';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { CriteriaGradingTable } from './grading-tool/CriteriaGradingTable';

type ScoreKey = 'scores1' | 'scores2' | 'projectScores' | 'behaviorScores';


// --- ANA DEĞERLENDİRME ARACI BİLEŞENİ ---
export function GradingToolTab({
  teacherProfile,
  students: initialStudents,
  currentClass,
}: {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}) {
  const { toast } = useToast();
  const { db } = useAuth();
  
  const getCurrentTerm = (): ActiveTerm => {
    const today = new Date();
    const month = today.getMonth(); // 0 = Jan, 8 = Sep
    // Term 1: September (8) to January (0)
    if (month >= 8 || month === 0) {
      return 1;
    }
    // Term 2: February (1) to August (7)
    return 2;
  };

  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(getCurrentTerm());
  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);
  
  const [isGradingSettingsOpen, setGradingSettingsOpen] = useState(false);
  const [isBulkEntryOpen, setBulkEntryOpen] = useState(false);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
  }, [students]);

  const handleScoreChange = useCallback((studentId: string, criteriaId: string, value: number | null, scoreKey: ScoreKey) => {
    const termKey: keyof Student = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          const updatedStudent = { ...student };
          const updatedTermGrades: GradingScores = { ...(updatedStudent[termKey] || {}) };
          const updatedScores = { ...(updatedTermGrades[scoreKey] || {}) };

          if (value === null) {
            delete updatedScores[criteriaId];
          } else {
            updatedScores[criteriaId] = value;
          }
          updatedTermGrades[scoreKey] = updatedScores;
          
          let perfGradeKey: 'perf1' | 'perf2' | 'projectGrade' | null = null;
          if (scoreKey === 'scores1') perfGradeKey = 'perf1';
          else if (scoreKey === 'scores2') perfGradeKey = 'perf2';
          else if (scoreKey === 'projectScores') perfGradeKey = 'projectGrade';

           if (perfGradeKey) {
             delete updatedTermGrades[perfGradeKey];
           }
           (updatedStudent as any)[termKey] = updatedTermGrades;
          return updatedStudent;
        }
        return student;
      })
    );
  }, [activeTerm]);

  const handleTotalScoreChange = useCallback((studentId: string, value: number | null, scoreKey: ScoreKey, criteria: Criterion[]) => {
      const termKey: keyof Student = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      
      let perfGradeKey: 'perf1' | 'perf2' | 'projectGrade' | null = null;
      if (scoreKey === 'scores1') perfGradeKey = 'perf1';
      else if (scoreKey === 'scores2') perfGradeKey = 'perf2';
      else if (scoreKey === 'projectScores') perfGradeKey = 'projectGrade';
  
      setStudents(prevStudents =>
          prevStudents.map(s => {
              if (s.id === studentId) {
                  const updatedStudent = { ...s };
                  const updatedTermGrades: GradingScores = { ...(updatedStudent[termKey] || {}) };

                  if (value !== null && value >= 0) {
                      const totalMax = criteria.reduce((sum, c) => sum + (c.max || 0), 0);
                      const newScores: { [key: string]: number } = {};
                      
                      if (totalMax > 0) {
                          criteria.forEach(c => {
                              const proportion = (c.max || 0) / totalMax;
                              newScores[c.id] = Math.round(value * proportion);
                          });
                      }
                      
                      if (perfGradeKey) {
                          updatedTermGrades[perfGradeKey] = value;
                      }
                      updatedTermGrades[scoreKey] = newScores;
                  } else { // value is null, clear scores
                      if (perfGradeKey) delete updatedTermGrades[perfGradeKey];
                      updatedTermGrades[scoreKey] = {};
                  }
                  (updatedStudent as any)[termKey] = updatedTermGrades;
                  return updatedStudent;
              }
              return s;
          })
      );
  }, [activeTerm]);

  const handleSaveScores = async (scoreKey: ScoreKey, criteria: Criterion[]) => {
      if (!db || students.length === 0) return;
      const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      const batch = writeBatch(db);

      students.forEach(student => {
          const studentRef = doc(db, 'students', student.id);
          const studentScores = (student as any)[termKey]?.[scoreKey] || {};
          
          let performanceGradeKey: 'perf1' | 'perf2' | null = null;
          if(scoreKey === 'scores1') performanceGradeKey = 'perf1';
          else if(scoreKey === 'scores2') performanceGradeKey = 'perf2';
          
          const manualTotal = performanceGradeKey ? (student as any)[termKey]?.[performanceGradeKey] : undefined;

          let finalGrade;
          if (manualTotal !== null && manualTotal !== undefined) {
             finalGrade = manualTotal;
          } else {
             const totalScore = criteria.reduce((sum, c) => sum + (Number(studentScores[c.id]) || 0), 0);
             const maxScore = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 100);
             finalGrade = (maxScore > 0) ? (totalScore / maxScore) * 100 : 0;
          }

          if (performanceGradeKey) {
               batch.update(studentRef, { 
                  [`${termKey}.${scoreKey}`]: studentScores,
                  [`${termKey}.${performanceGradeKey}`]: Math.round(finalGrade)
              });
          }
      });
      
      try {
          await batch.commit();
          toast({ title: "Başarılı!", description: `Notlar kaydedildi ve genel ortalamalar güncellendi.` });
      } catch (e) {
          toast({ title: "Hata!", description: "Notlar kaydedilemedi.", variant: 'destructive' });
          console.error(e);
      }
  };


  const perfCriteria = teacherProfile?.perfCriteria || INITIAL_PERF_CRITERIA;
  const projCriteria = teacherProfile?.projCriteria || INITIAL_PROJ_CRITERIA;

  return (
    <>
      <Tabs defaultValue="performance" onValueChange={(value) => setActiveTab(value === 'performance' ? 1 : 3)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="project">Proje</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 ml-4">
            {activeTab !== 3 && (
                 <div className="flex items-center space-x-2">
                    <Label>Dönem:</Label>
                    <Select value={String(activeTerm)} onValueChange={(val) => setActiveTerm(Number(val) as 1 | 2)}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1. Dönem</SelectItem>
                            <SelectItem value="2">2. Dönem</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <Button variant="outline" onClick={() => setBulkEntryOpen(true)}>
                <Sheet className="mr-2 h-4 w-4" /> Toplu Not Girişi
            </Button>
            <Button variant="outline" onClick={() => setGradingSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Kriter Ayarları
            </Button>
          </div>
        </div>
        <TabsContent value="performance">
          <Tabs defaultValue="perf1" onValueChange={(value) => setActiveTab(value === 'perf1' ? 1 : 2)}>
             <TabsList>
                <TabsTrigger value="perf1">1. Performans Notu</TabsTrigger>
                <TabsTrigger value="perf2">2. Performans Notu</TabsTrigger>
              </TabsList>
               <TabsContent value="perf1" className="mt-4">
                    <CriteriaGradingTable 
                        students={sortedStudents} 
                        criteria={perfCriteria} 
                        scoreKey="scores1"
                        activeTerm={activeTerm}
                        onScoresChange={handleScoreChange}
                        onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'scores1', perfCriteria)}
                        onSave={() => handleSaveScores('scores1', perfCriteria)}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                    />
               </TabsContent>
               <TabsContent value="perf2" className="mt-4">
                    <CriteriaGradingTable 
                        students={sortedStudents} 
                        criteria={perfCriteria} 
                        scoreKey="scores2"
                        activeTerm={activeTerm}
                        onScoresChange={handleScoreChange}
                        onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'scores2', perfCriteria)}
                        onSave={() => handleSaveScores('scores2', perfCriteria)}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                    />
               </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="project" className="mt-4">
            <CriteriaGradingTable 
                students={sortedStudents.filter(s => s.hasProject)}
                criteria={projCriteria}
                scoreKey="projectScores"
                activeTerm={2} // Projects are always 2nd term
                onScoresChange={handleScoreChange}
                onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'projectScores', projCriteria)}
                onSave={() => handleSaveScores('projectScores', projCriteria)}
                teacherProfile={teacherProfile}
                currentClass={currentClass}
            />
        </TabsContent>
      </Tabs>
      
      <BulkGradeEntryDialog
        isOpen={isBulkEntryOpen}
        setIsOpen={setBulkEntryOpen}
        students={students}
        activeTerm={activeTerm}
        teacherBranch={teacherProfile?.branch || ''}
        onBulkUpdate={setStudents}
        perfCriteria={perfCriteria}
        projCriteria={projCriteria}
        disciplineRecords={[]}
      />

      {teacherProfile && (
        <GradingSettingsDialog 
            isOpen={isGradingSettingsOpen}
            setIsOpen={setGradingSettingsOpen}
            teacherProfile={teacherProfile}
        />
      )}
    </>
  );
}
