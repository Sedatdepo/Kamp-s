
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  Student,
  TeacherProfile,
  Class,
  Criterion,
  GradingDocument,
  GradingScores,
} from '@/lib/types';
import { GradingHeader } from './GradingHeader';
import { GradingTable } from './GradingTable';
import {
  INITIAL_BEHAVIOR_CRITERIA,
  INITIAL_PERF_CRITERIA,
} from '@/lib/grading-defaults';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { Save, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamAnalysisTab } from './ExamAnalysisTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface GradingToolTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  students: Student[];
  currentClass?: Class | null;
}

export type ActiveGradingTab = 1 | 2 | 4; // 1: Perf1, 2: Perf2, 4: Davranış
export type ActiveTerm = 1 | 2;

const PerformanceRanking = ({ students, termGradesKey, scoreKey }: { students: Student[], termGradesKey: 'term1Grades' | 'term2Grades', scoreKey: 'scores1' | 'scores2' | 'behaviorScores' }) => {
    
    const rankedStudents = useMemo(() => {
        return students.map(student => {
            const termGrades = student[termGradesKey];
            const scores = termGrades ? termGrades[scoreKey] : undefined;
            const total = scores ? Object.values(scores).reduce((sum, val) => sum + (Number(val) || 0), 0) : 0;
            return { 
                ...student, 
                totalScore: total,
                exam1: termGrades?.exam1,
                exam2: termGrades?.exam2,
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }, [students, termGradesKey, scoreKey]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Target/> Performans Sıralaması</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead className="text-right">1. Yazılı</TableHead>
                            <TableHead className="text-right">2. Yazılı</TableHead>
                            <TableHead className="text-right">Performans</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rankedStudents.map(student => (
                            <TableRow key={student.id}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell className="text-right font-medium">{student.exam1 ?? '-'}</TableCell>
                                <TableCell className="text-right font-medium">{student.exam2 ?? '-'}</TableCell>
                                <TableCell className="text-right font-bold">{student.totalScore}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export function GradingToolTab({
  classId,
  teacherProfile,
  students: initialStudents,
  currentClass,
}: GradingToolTabProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const {
    db: localDb,
    setDb: setLocalDb,
    loading: localDbLoading,
  } = useDatabase();
  const { gradingDocuments = [] } = localDb;

  const [activeTab, setActiveTab] = useState<ActiveGradingTab>(1);
  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(1);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // This local state will hold the student data, either live from Firestore or from an archive
  const [students, setStudents] = useState<Student[]>(initialStudents);

  useEffect(() => {
    const classRecords = gradingDocuments.filter(
      (doc) => doc.classId === classId
    );

    if (selectedRecordId) {
      const record = classRecords.find((doc) => doc.id === selectedRecordId);
      if (record) {
        const tempStudents = initialStudents.map((student) => {
          const archivedData = record.data.studentGrades.find(
            (sg) => sg.studentId === student.id
          );
          const termKey =
            record.data.term === 'term1' ? 'term1Grades' : 'term2Grades';
          return {
            ...student,
            [termKey]: archivedData ? archivedData.grades : student[termKey],
          };
        });
        setStudents(tempStudents);
        setActiveTerm(record.data.term === 'term1' ? 1 : 2);
      } else {
        setStudents(initialStudents); // If record not found, fall back to live data
      }
    } else {
      setStudents(initialStudents); // If no record selected, use live data
    }
  }, [selectedRecordId, gradingDocuments, initialStudents, classId]);

  const teacherId = teacherProfile?.id;
  const perfCriteria = teacherProfile?.perfCriteria ?? INITIAL_PERF_CRITERIA;
  const behaviorCriteria =
    teacherProfile?.behaviorCriteria ?? INITIAL_BEHAVIOR_CRITERIA;

  const termGradesKey: 'term1Grades' | 'term2Grades' =
    activeTerm === 1 ? 'term1Grades' : 'term2Grades';

  const currentCriteria = useMemo(() => {
    if (activeTab === 4) return behaviorCriteria;
    return perfCriteria;
  }, [activeTab, perfCriteria, behaviorCriteria]);

  const getScoreTargetKey = (tab: ActiveGradingTab) => {
    switch (tab) {
      case 1:
        return 'scores1';
      case 2:
        return 'scores2';
      case 4:
        return 'behaviorScores';
    }
  };
  const scoreKey = getScoreTargetKey(activeTab);

  const handleClearScores = async () => {
    if (!db) return;
    const batch = writeBatch(db);

    students.forEach((student) => {
      const studentRef = doc(db, 'students', student.id);
      const currentTermGrades = student[termGradesKey] || {};

      batch.update(studentRef, {
        [termGradesKey]: {
          ...currentTermGrades,
          [scoreKey]: {},
        },
      });
    });

    try {
      await batch.commit();
      toast({ title: 'Tüm notlar temizlendi.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Temizleme sırasında hata oluştu!',
        description: (e as Error).message,
      });
    }
  };

  const updateStudents = async (updatedStudents: Student[]) => {
    if (!db || students.length === 0) return;
    const batch = writeBatch(db);
    updatedStudents.forEach((updatedStudent) => {
      const originalStudent = students.find((s) => s.id === updatedStudent.id);
      if (originalStudent) {
        // Compare only the fields that can be changed by GradingTable
        const hasProjectChanged =
          originalStudent.hasProject !== updatedStudent.hasProject;
        const termGradesChanged =
          JSON.stringify(originalStudent[termGradesKey]) !==
          JSON.stringify(updatedStudent[termGradesKey]);

        if (hasProjectChanged || termGradesChanged) {
          const studentRef = doc(db, 'students', updatedStudent.id);
          const changes: Partial<Student> = {};
          if (hasProjectChanged) changes.hasProject = updatedStudent.hasProject;
          if (termGradesChanged)
            changes[termGradesKey] = updatedStudent[termGradesKey];
          batch.update(studentRef, changes);
        }
      }
    });
    try {
      await batch.commit();
      toast({ title: 'Notlar kaydedildi.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Kaydederken hata oluştu!',
        description: (e as Error).message,
      });
      console.error(e);
    }
  };
  
  const updateSingleStudent = async (studentId: string, updates: Partial<Student>) => {
    if (!db) return;
    const studentRef = doc(db, 'students', studentId);
    try {
      await updateDoc(studentRef, updates);
      // No toast here to avoid spamming on every small update
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Kaydederken hata oluştu!',
        description: (e as Error).message,
      });
    }
  }

  const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacherId || !db) return;
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, data);
  };

  const handleSaveToArchive = () => {
    if (!currentClass) return;

    const studentGrades = students.map((student) => ({
      studentId: student.id,
      grades: student[termGradesKey] || {},
    }));

    const newRecord: GradingDocument = {
      id: `grading_${Date.now()}`,
      name: `${activeTerm}. Dönem Notları - ${new Date().toLocaleDateString(
        'tr-TR'
      )}`,
      date: new Date().toISOString(),
      classId: currentClass.id,
      data: {
        term: activeTerm === 1 ? 'term1' : 'term2',
        studentGrades,
      },
    };

    setLocalDb((prevDb) => ({
      ...prevDb,
      gradingDocuments: [...(prevDb.gradingDocuments || []), newRecord],
    }));

    toast({
      title: 'Notlar Arşive Kaydedildi',
      description: 'Mevcut not tablosunun bir kopyası oluşturuldu.',
    });
  };

  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    setStudents(initialStudents); // Revert to live data
  }, [initialStudents]);

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb((prevDb) => ({
      ...prevDb,
      gradingDocuments: (prevDb.gradingDocuments || []).filter(
        (d) => d.id !== selectedRecordId
      ),
    }));
    handleNewRecord();
    toast({
      title: 'Silindi',
      description: 'Not kaydı arşivden silindi.',
      variant: 'destructive',
    });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  if (!teacherProfile || !currentClass) {
    return <p>Öğretmen profili veya sınıf bilgisi yüklenemedi.</p>;
  }
  
    const getTabStyle = (tabId: ActiveGradingTab) => {
        const isActive = activeTab === tabId;
        return `flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap 
        ${isActive ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 'text-slate-500 hover:bg-slate-50'}`;
    };

  return (
    <Tabs defaultValue="grading">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <TabsList className="w-full justify-start">
                <TabsTrigger value="grading">Not Girişi & Ölçekler</TabsTrigger>
                <TabsTrigger value="analysis">Sınav Analizi & Telafi</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="grading" className="mt-4">
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <GradingHeader
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            activeTerm={activeTerm}
                            setActiveTerm={setActiveTerm}
                            teacherProfile={teacherProfile}
                            onClearScores={handleClearScores}
                            updateTeacherProfile={updateTeacherProfile}
                        />
                         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto gap-1 mt-4">
                            <button onClick={() => setActiveTab(1)} className={getTabStyle(1)}>1. Performans</button>
                            <button onClick={() => setActiveTab(2)} className={getTabStyle(2)}>2. Performans</button>
                            <button onClick={() => setActiveTab(4)} className={getTabStyle(4)}>Davranış Notu</button>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <RecordManager
                            records={(gradingDocuments || [])
                                .filter((d) => d.classId === classId)
                                .map((r) => ({ id: r.id, name: r.name }))}
                            selectedRecordId={selectedRecordId}
                            onSelectRecord={setSelectedRecordId}
                            onNewRecord={handleNewRecord}
                            onDeleteRecord={handleDeleteRecord}
                            noun="Not Kaydı"
                        />
                        <Button
                            onClick={handleSaveToArchive}
                            className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        >
                            <Save className="mr-2 h-4 w-4" /> Notları Arşive Kaydet
                        </Button>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <GradingTable
                        activeTab={activeTab}
                        students={students}
                        currentCriteria={currentCriteria}
                        updateStudents={updateStudents}
                        updateSingleStudent={updateSingleStudent}
                        termGradesKey={termGradesKey}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <PerformanceRanking 
                      students={students} 
                      termGradesKey={termGradesKey} 
                      scoreKey={scoreKey}
                    />
                  </div>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="analysis" className="mt-4">
            <ExamAnalysisTab students={students} currentClass={currentClass} teacherProfile={teacherProfile} />
        </TabsContent>
    </Tabs>
  );
}
