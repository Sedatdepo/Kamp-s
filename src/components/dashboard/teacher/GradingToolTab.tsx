
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import {
  Student,
  TeacherProfile,
  Class,
  GradingScores,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, FileDown, ClipboardPaste } from 'lucide-react';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { exportTermGradesToRtf } from '@/lib/word-export';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';


interface GradingToolTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  students: Student[];
  currentClass?: Class | null;
}

export type TermKey = 'term1Grades' | 'term2Grades';
export type GradeField = 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade';


// --- DÖNEM NOT TABLOSU BİLEŞENİ ---
const TermGradingTable = ({
  students,
  termKey,
  onSave,
  onStudentGradeChange,
  onExport,
}: {
  students: Student[];
  termKey: TermKey;
  onSave: () => void;
  onStudentGradeChange: (studentId: string, field: GradeField, value: number | null) => void;
  onExport: () => void;
}) => {
  
  const calculateAverage = (grades: GradingScores = {}, hasProject?: boolean) => {
      const scores = [grades.exam1, grades.exam2, grades.perf1, grades.perf2];
      if (hasProject) {
          scores.push(grades.projectGrade);
      }
      const validScores = scores.filter(g => g !== undefined && g !== null && g !== -1) as number[];
      if (validScores.length === 0) return 0;
      return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  };
  
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [students]);

  const displayGrade = (grade: number | undefined | null) => {
    if (grade === -1) return 'G';
    return grade ?? '';
  };

  const handleInputChange = (studentId: string, field: GradeField, value: string) => {
    if (value.toUpperCase() === 'G') {
        onStudentGradeChange(studentId, field, -1);
    } else {
        const numValue = value === '' ? null : Number(value);
        if(numValue === null || !isNaN(numValue)) {
            onStudentGradeChange(studentId, field, numValue);
        }
    }
  };

  return (
      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>{termKey === 'term1Grades' ? '1. Dönem Notları' : '2. Dönem Notları'}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onExport}><FileDown className="mr-2 h-4 w-4"/> Çıktı Al</Button>
                    <Button onClick={onSave}><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>No</TableHead>
                          <TableHead>Öğrenci</TableHead>
                          <TableHead className="text-center">1. Sınav</TableHead>
                          <TableHead className="text-center">2. Sınav</TableHead>
                          <TableHead className="text-center">1. Performans</TableHead>
                          <TableHead className="text-center">2. Performans</TableHead>
                          {termKey === 'term2Grades' && <TableHead className="text-center">Proje</TableHead>}
                          <TableHead className="text-center">Ortalama</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedStudents.map(student => {
                          const grades: any = student[termKey] || {};
                          const average = calculateAverage(grades, student.hasProject);
                          return (
                              <TableRow key={student.id}>
                                  <TableCell>{student.number}</TableCell>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  {(['exam1', 'exam2', 'perf1', 'perf2'] as GradeField[]).map(field => (
                                       <TableCell key={field}>
                                          <Input
                                              type="text" // Change to text to allow 'G'
                                              className="w-20 mx-auto text-center h-8"
                                              value={displayGrade(grades[field])}
                                              onChange={e => handleInputChange(student.id, field, e.target.value)}
                                          />
                                      </TableCell>
                                  ))}
                                  {termKey === 'term2Grades' && (
                                     <TableCell>
                                         <Input
                                            type="text" // Change to text
                                            className="w-20 mx-auto text-center h-8"
                                            value={displayGrade(grades.projectGrade)}
                                            disabled={!student.hasProject}
                                            onChange={e => handleInputChange(student.id, 'projectGrade', e.target.value)}
                                         />
                                     </TableCell>
                                  )}
                                  <TableCell className="text-center font-bold text-lg">{average.toFixed(2)}</TableCell>
                              </TableRow>
                          )
                      })}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
  )
}


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
  const [isBulkGradeOpen, setIsBulkGradeOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState<1 | 2>(1);


  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  
  const handleStudentGradeChange = (studentId: string, field: GradeField, value: number | null) => {
      const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
      setStudents(prevStudents => 
          prevStudents.map(student => {
              if (student.id === studentId) {
                  const updatedGrades = { ...(student[termKey] || {}) };
                  
                  if (value === null) {
                    // @ts-ignore
                    delete updatedGrades[field];
                  } else {
                    // @ts-ignore
                    updatedGrades[field] = value;
                  }
                  
                  return { ...student, [termKey]: updatedGrades };
              }
              return student;
          })
      );
  };
  
  const handleSaveChanges = async (termKey: TermKey) => {
    if (!db || students.length === 0) return;

    const batch = writeBatch(db);
    students.forEach(student => {
        const studentRef = doc(db, 'students', student.id);
        const termGrades = student[termKey] || {};
        batch.update(studentRef, { [termKey]: termGrades });
    });
    
    try {
        await batch.commit();
        toast({ title: "Başarılı!", description: `${termKey === 'term1Grades' ? '1. Dönem' : '2. Dönem'} notları kaydedildi.` });
    } catch (e) {
        toast({ title: "Hata!", description: "Notlar kaydedilemedi.", variant: 'destructive' });
        console.error(e);
    }
  };

  const handleExport = () => {
    if (!currentClass || !teacherProfile) {
        toast({variant: "destructive", title: "Hata", description: "Rapor oluşturmak için gerekli bilgiler eksik."});
        return;
    }
    exportTermGradesToRtf({
        students,
        term: activeTerm,
        currentClass,
        teacherProfile,
        perfCriteria: teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA,
        projCriteria: teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA
    })
  }


  return (
    <>
      <Tabs defaultValue="term1" onValueChange={(val) => setActiveTerm(val === 'term1' ? 1 : 2)}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="term1">1. Dönem</TabsTrigger>
            <TabsTrigger value="term2">2. Dönem</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={() => setIsBulkGradeOpen(true)}>
             <ClipboardPaste className="mr-2 h-4 w-4" /> Toplu Not Girişi
          </Button>
        </div>
        <TabsContent value="term1">
          <TermGradingTable
            students={students}
            termKey="term1Grades"
            onSave={() => handleSaveChanges('term1Grades')}
            onStudentGradeChange={handleStudentGradeChange}
            onExport={handleExport}
          />
        </TabsContent>
        <TabsContent value="term2">
          <TermGradingTable
            students={students}
            termKey="term2Grades"
            onSave={() => handleSaveChanges('term2Grades')}
            onStudentGradeChange={handleStudentGradeChange}
            onExport={handleExport}
          />
        </TabsContent>
      </Tabs>

      <BulkGradeEntryDialog 
        isOpen={isBulkGradeOpen}
        setIsOpen={setIsBulkGradeOpen}
        students={students}
        activeTerm={activeTerm}
        onBulkUpdate={setStudents}
      />
    </>
  );
}
