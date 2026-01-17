'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc, writeBatch, increment } from 'firebase/firestore';
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
import { Save, Settings, Sheet, FileDown, Plus, Minus } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { exportGradingToRtf } from '@/lib/word-export';


interface GradingToolTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}

export type ActiveGradingTab = 1 | 2 | 3 | 4; // 1:perf1, 2:perf2, 3:project, 4:behavior
export type ActiveTerm = 1 | 2;

type TermKey = 'term1Grades' | 'term2Grades';
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
  onTotalScoreChange,
  onSave,
  onExport,
  isBehaviorTab = false,
}: {
  students: Student[];
  criteria: Criterion[];
  scoreKey: ScoreKey;
  termKey: TermKey;
  onScoresChange: (studentId: string, criteriaId: string, value: number | null) => void;
  onTotalScoreChange: (studentId: string, value: number | null) => void;
  onSave: () => void;
  onExport: () => void;
  isBehaviorTab?: boolean;
}) => {
    const { db } = useAuth();
    const { toast } = useToast();

    const calculateTotal = (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        if(isBehaviorTab) {
            return student?.behaviorScore ?? 100;
        }
        const scores = student?.[termKey]?.[scoreKey];
        if (!scores) return 0;
        
        let total = 0;
        for (const criteriaId in scores) {
            total += Number(scores[criteriaId]);
        }
        return total;
    };

    const getPerformanceGradeKey = () => {
        if(scoreKey === 'scores1') return 'perf1';
        if(scoreKey === 'scores2') return 'perf2';
        if(scoreKey === 'projectScores') return 'projectGrade';
        return null;
    }
    
    const handlePointChange = async (studentId: string, change: number) => {
        if (!db) return;
    
        const student = students.find(s => s.id === studentId);
        if (!student) return;
    
        const studentRef = doc(db, 'students', studentId);
        
        try {
            await updateDoc(studentRef, {
                behaviorScore: increment(change)
            });
            toast({
                title: `${change > 0 ? '+' : ''}${change} Puan`,
                description: `${student.name} adlı öğrencinin puanı güncellendi.`
            })
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Puan güncellenemedi: ' + e.message });
        }
    }

    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <CardTitle>Kriter Bazlı Değerlendirme</CardTitle>
                    <div className="flex items-center gap-2">
                         <Button onClick={onExport} variant="outline"><FileDown className="mr-2 h-4 w-4"/> Çıktı Al (.rtf)</Button>
                         <Button onClick={onSave}><Save className="mr-2 h-4 w-4"/> Notları Kaydet</Button>
                    </div>
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
                                const studentScores = (termGrades as any)?.[scoreKey] || {};
                                const total = calculateTotal(student.id);
                                const perfGradeKey = getPerformanceGradeKey();
                                const manualTotal = (perfGradeKey && termGrades) ? (termGrades as any)[perfGradeKey] : null;

                                return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium sticky left-0 bg-background z-10">{student.name}</TableCell>
                                    {criteria.map(c => (
                                        <TableCell key={c.id} className="text-center">
                                            {isBehaviorTab ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePointChange(student.id, c.max)}><Plus className="h-4 w-4 text-green-600"/></Button>
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handlePointChange(student.id, -c.max)}><Minus className="h-4 w-4"/></Button>
                                                </div>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    max={c.max}
                                                    min={0}
                                                    value={studentScores[c.id] || ''}
                                                    onChange={(e) => onScoresChange(student.id, c.id, e.target.value === '' ? null : Number(e.target.value))}
                                                    className="w-20 mx-auto text-center h-9"
                                                />
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-lg sticky right-0 bg-background z-10">
                                         <Input
                                            type="number"
                                            max={100}
                                            min={0}
                                            value={isBehaviorTab ? total : (manualTotal ?? total)}
                                            onChange={(e) => onTotalScoreChange(student.id, e.target.value === '' ? null : Number(e.target.value))}
                                            className="w-24 mx-auto text-center h-10 font-bold text-lg bg-yellow-50 border-yellow-300"
                                            placeholder={isBehaviorTab ? student.behaviorScore.toString() : total.toString()}
                                            readOnly={isBehaviorTab}
                                        />
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
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(1);
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
          const updatedScores = { ...((updatedTermGrades as any)[scoreKey] || {}) };

          if (value === null) {
            delete updatedScores[criteriaId];
          } else {
            updatedScores[criteriaId] = value;
          }
          (updatedTermGrades as any)[scoreKey] = updatedScores;
          
          const perfGradeKey = scoreKey === 'scores1' ? 'perf1' : scoreKey === 'scores2' ? 'perf2' : scoreKey === 'projectScores' ? 'projectGrade' : null;
           if (perfGradeKey) {
             (updatedTermGrades as any)[perfGradeKey] = null;
           }

          return { ...student, [termKey]: updatedTermGrades };
        }
        return student;
      })
    );
  };

  const handleTotalScoreChange = (studentId: string, value: number | null, scoreKey: ScoreKey, criteria: Criterion[]) => {
      const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      const isBehavior = scoreKey === 'behaviorScores';
      
      let perfGradeKey: 'perf1' | 'perf2' | 'projectGrade' | null = null;
      if (scoreKey === 'scores1') perfGradeKey = 'perf1';
      else if (scoreKey === 'scores2') perfGradeKey = 'perf2';
      else if (scoreKey === 'projectScores') perfGradeKey = 'projectGrade';
  
      setStudents(prevStudents =>
          prevStudents.map(student => {
              if (student.id === studentId) {
                  const updatedTermGrades = { ...(student[termKey] || {}) };
                  const newScores: { [key: string]: number } = {};
  
                  if (value !== null && value >= 0 && !isBehavior) {
                      const totalMax = criteria.reduce((sum, c) => sum + (c.max || 0), 0);
                      if (totalMax > 0) {
                          criteria.forEach(c => {
                              const proportion = (c.max || 0) / totalMax;
                              newScores[c.id] = Math.round(value * proportion);
                          });
                      }
                      if (perfGradeKey) (updatedTermGrades as any)[perfGradeKey] = value;
                      (updatedTermGrades as any)[scoreKey] = newScores;

                  } else if (isBehavior && value !== null) {
                      return { ...student, behaviorScore: value };
                  } else { // value is null, clear scores
                      if (perfGradeKey) (updatedTermGrades as any)[perfGradeKey] = null;
                      (updatedTermGrades as any)[scoreKey] = {};
                  }
  
                  return { ...student, [termKey]: updatedTermGrades };
              }
              return student;
          })
      );
  };

  const handleSaveScores = async (scoreKey: ScoreKey, criteria: Criterion[]) => {
      if (!db || students.length === 0) return;
      const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      const isBehavior = scoreKey === 'behaviorScores';
      const batch = writeBatch(db);

      students.forEach(student => {
          const studentRef = doc(db, 'students', student.id);
          const studentScores = (student as any)[termKey]?.[scoreKey] || {};
          
          let performanceGradeKey: 'perf1' | 'perf2' | 'projectGrade' | null = null;
          if(scoreKey === 'scores1') performanceGradeKey = 'perf1';
          else if(scoreKey === 'scores2') performanceGradeKey = 'perf2';
          else if(scoreKey === 'projectScores') performanceGradeKey = 'projectGrade';
          
          const manualTotal = isBehavior ? student.behaviorScore : (performanceGradeKey ? (student as any)[termKey]?.[performanceGradeKey] : undefined);

          let finalGrade;
          if (manualTotal !== null && manualTotal !== undefined) {
             finalGrade = manualTotal;
          } else {
             if (isBehavior) {
                finalGrade = student.behaviorScore;
             } else {
                const totalScore = criteria.reduce((sum, c) => sum + (Number(studentScores[c.id]) || 0), 0);
                const maxScore = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 100);
                finalGrade = (maxScore > 0) ? (totalScore / maxScore) * 100 : 0;
             }
          }

          if (isBehavior) {
               batch.update(studentRef, { 
                  [`${termKey}.${scoreKey}`]: studentScores,
                  behaviorScore: Math.round(finalGrade)
              });
          } else if (performanceGradeKey) {
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

  const handleExport = (activeTab: ActiveGradingTab) => {
    if(!currentClass || !teacherProfile) return;

    let currentCriteria: Criterion[];
    
    switch(activeTab) {
        case 1:
        case 2:
            currentCriteria = perfCriteria;
            break;
        case 3:
            currentCriteria = projCriteria;
            break;
        case 4:
            currentCriteria = behaviorCriteria;
            break;
        default:
            return;
    }

    exportGradingToRtf({
      activeTab: activeTab,
      activeTerm,
      students,
      currentCriteria,
      currentClass,
      teacherProfile
    });
  };

  return (
    <>
      <Tabs defaultValue="performance" onValueChange={(value) => setActiveTab(value === 'performance' ? 1 : 4)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performans</TabsTrigger>
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
                        termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                        onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'scores1')}
                        onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'scores1', perfCriteria)}
                        onSave={() => handleSaveScores('scores1', perfCriteria)}
                        onExport={() => handleExport(1)}
                    />
               </TabsContent>
               <TabsContent value="perf2" className="mt-4">
                    <CriteriaGradingTable 
                        students={sortedStudents} 
                        criteria={perfCriteria} 
                        scoreKey="scores2"
                        termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                        onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'scores2')}
                        onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'scores2', perfCriteria)}
                        onSave={() => handleSaveScores('scores2', perfCriteria)}
                        onExport={() => handleExport(2)}
                    />
               </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="behavior">
            <CriteriaGradingTable 
                students={sortedStudents} 
                criteria={behaviorCriteria} 
                scoreKey="behaviorScores"
                termKey={activeTerm === 1 ? 'term1Grades' : 'term2Grades'}
                onScoresChange={(studentId, criteriaId, value) => handleScoreChange(studentId, criteriaId, value, 'behaviorScores')}
                onTotalScoreChange={(studentId, value) => handleTotalScoreChange(studentId, value, 'behaviorScores', behaviorCriteria)}
                onSave={() => handleSaveScores('behaviorScores', behaviorCriteria)}
                onExport={() => handleExport(4)}
                isBehaviorTab={true}
            />
        </TabsContent>
      </Tabs>
      
      <BulkGradeEntryDialog
        isOpen={isBulkEntryOpen}
        setIsOpen={setBulkEntryOpen}
        students={students}
        activeTerm={activeTerm}
        teacherBranch={teacherProfile?.branch || ''}
        onBulkUpdate={(updatedStudents) => setStudents(updatedStudents)}
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
