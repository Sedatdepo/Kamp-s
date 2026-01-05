
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  Student,
  TeacherProfile,
  Class,
  GradingScores,
  Criterion,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, FileDown, ClipboardPaste, Settings } from 'lucide-react';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { exportTermGradesToRtf } from '@/lib/word-export';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { GradingSettingsDialog } from './GradingSettingsDialog';


interface GradingToolTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}

export type TermKey = 'term1Grades' | 'term2Grades';
export type GradeField = 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade';
type CriteriaKey = 'perfCriteria' | 'projCriteria' | 'behaviorCriteria';
type ScoreKey = 'scores1' | 'scores2' | 'projectScores' | 'behaviorScores';


// --- KRİTER BAZLI DEĞERLENDİRME TABLOSU ---
const CriteriaGradingTable = ({
  students,
  criteria,
  scoreKey,
  termKey,
  onScoresChange,
  onSave
}: {
  students: Student[];
  criteria: Criterion[];
  scoreKey: ScoreKey;
  termKey: TermKey;
  onScoresChange: (studentId: string, criteriaId: string, value: number | null) => void;
  onSave: () => void;
}) => {
    
    const calculateTotal = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        const scores = student?.[termKey]?.[scoreKey];
        if (!scores) return 0;
        return criteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
    };

    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle>Kriter Bazlı Değerlendirme</CardTitle>
                    <Button onClick={onSave}><Save className="mr-2 h-4 w-4"/> Notları Kaydet</Button>
                 </div>
                 <CardDescription>Aşağıdaki tabloyu kullanarak her öğrenci için belirtilen kriterlere göre not girişi yapın.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-secondary z-10">Öğrenci</TableHead>
                                {criteria.map(c => (
                                    <TableHead key={c.id} className="text-center">{c.name}<br/><span className="text-xs text-muted-foreground">({c.max} P)</span></TableHead>
                                ))}
                                <TableHead className="text-center sticky right-0 bg-secondary z-10">Toplam</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => {
                                const termGrades = student[termKey];
                                // @ts-ignore
                                const studentScores = termGrades ? termGrades[scoreKey] : {};
                                return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">{student.name}</TableCell>
                                    {criteria.map(c => (
                                        <TableCell key={c.id} className="text-center">
                                            <Input
                                                type="number"
                                                max={c.max}
                                                min={0}
                                                value={studentScores?.[c.id] || ''}
                                                onChange={(e) => onScoresChange(student.id, c.id, e.target.value === '' ? null : Number(e.target.value))}
                                                className="w-20 mx-auto text-center h-9"
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-lg sticky right-0 bg-background z-10">
                                        {calculateTotal(student.id)}
                                    </TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};


// --- ANA DEĞERLENDİRME ARACI BİLEŞENİ ---
export function GradingToolTab({
  classId,
  teacherProfile,
  students: initialStudents,
  currentClass,
}: GradingToolTabProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [activeTerm, setActiveTerm] = useState<1 | 2>(1);
  
  const [isGradingSettingsOpen, setGradingSettingsOpen] = useState(false);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacherProfile?.id || !db) return;
    const teacherRef = doc(db, 'teachers', teacherProfile.id);
    await updateDoc(teacherRef, data);
  };
  
  const handleScoreChange = (studentId: string, criteriaId: string, value: number | null, scoreKey: ScoreKey) => {
    const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === studentId) {
          const updatedTermGrades = { ...(student[termKey] || {}) };
          // @ts-ignore
          const updatedScores = { ...(updatedTermGrades[scoreKey] || {}) };

          if (value === null) {
            delete updatedScores[criteriaId];
          } else {
            updatedScores[criteriaId] = value;
          }
          // @ts-ignore
          updatedTermGrades[scoreKey] = updatedScores;
          return { ...student, [termKey]: updatedTermGrades };
        }
        return student;
      })
    );
  };

  const handleSaveScores = async (scoreKey: ScoreKey, criteria: Criterion[]) => {
      if (!db || students.length === 0) return;
      const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      const batch = writeBatch(db);

      students.forEach(student => {
          const studentRef = doc(db, 'students', student.id);
          // @ts-ignore
          const studentScores = student[termKey]?.[scoreKey] || {};
          
          const totalScore = criteria.reduce((sum, c) => sum + (Number(studentScores[c.id]) || 0), 0);
          const maxScore = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 100);
          const finalGrade = (totalScore / maxScore) * 100;
          
          let performanceGradeKey: 'perf1' | 'perf2' | 'projectGrade' = 'perf1';
          if(scoreKey === 'scores1') performanceGradeKey = 'perf1';
          else if(scoreKey === 'scores2') performanceGradeKey = 'perf2';
          else if(scoreKey === 'projectScores') performanceGradeKey = 'projectGrade';

          if (scoreKey === 'behaviorScores') {
               batch.update(studentRef, { 
                  [`${termKey}.${scoreKey}`]: studentScores,
                  behaviorScore: Math.round(finalGrade)
              });
          } else {
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
  const behaviorCriteria = teacherProfile?.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;

  return (
    <>
      <Tabs defaultValue="performance">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="performance">Performans</TabsTrigger>
            <TabsTrigger value="project">Proje</TabsTrigger>
            <TabsTrigger value="behavior">Davranış</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={() => setGradingSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Kriter Ayarları
            </Button>
          </div>
        </div>
        <TabsContent value="performance">
          <Tabs defaultValue="perf1">
             <TabsList>
                <TabsTrigger value="perf1">1. Performans Notu</TabsTrigger>
                <TabsTrigger value="perf2">2. Performans Notu</TabsTrigger>
              </TabsList>
               <TabsContent value="perf1" className="mt-4">
                    <CriteriaGradingTable 
                        students={students} 
                        criteria={perfCriteria} 
                        scoreKey="scores1"
                        termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                        onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'scores1')}
                        onSave={() => handleSaveScores('scores1', perfCriteria)}
                    />
               </TabsContent>
               <TabsContent value="perf2" className="mt-4">
                    <CriteriaGradingTable 
                        students={students} 
                        criteria={perfCriteria} 
                        scoreKey="scores2"
                        termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                        onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'scores2')}
                        onSave={() => handleSaveScores('scores2', perfCriteria)}
                    />
               </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="project">
           <CriteriaGradingTable 
                students={students.filter(s => s.hasProject)} 
                criteria={projCriteria} 
                scoreKey="projectScores"
                termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'projectScores')}
                onSave={() => handleSaveScores('projectScores', projCriteria)}
            />
        </TabsContent>
        <TabsContent value="behavior">
            <CriteriaGradingTable 
                students={students} 
                criteria={behaviorCriteria} 
                scoreKey="behaviorScores"
                termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'behaviorScores')}
                onSave={() => handleSaveScores('behaviorScores', behaviorCriteria)}
            />
        </TabsContent>
      </Tabs>

      {teacherProfile && (
        <GradingSettingsDialog 
            isOpen={isGradingSettingsOpen}
            setIsOpen={setGradingSettingsOpen}
            teacherProfile={teacherProfile}
            updateTeacherProfile={updateTeacherProfile}
        />
      )}
    </>
  );
}
