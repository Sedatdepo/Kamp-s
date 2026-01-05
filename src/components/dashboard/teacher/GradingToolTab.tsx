
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
import { Save } from 'lucide-react';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { ClipboardPaste } from 'lucide-react';


interface GradingToolTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  students: Student[];
  currentClass?: Class | null;
}

type TermKey = 'term1Grades' | 'term2Grades';
type GradeField = 'exam1' | 'exam2' | 'perf1' | 'perf2';


// --- DÖNEM NOT TABLOSU BİLEŞENİ ---
const TermGradingTable = ({
  students,
  termKey,
  onSave,
  onStudentGradeChange
}: {
  students: Student[];
  termKey: TermKey;
  onSave: () => void;
  onStudentGradeChange: (studentId: string, field: GradeField, value: number | null) => void;
}) => {
  
  const calculateAverage = (grades: GradingScores = {}) => {
      const scores = [grades.exam1, grades.exam2, grades.perf1, grades.perf2].filter(g => g !== undefined && g !== null) as number[];
      if (scores.length === 0) return 0;
      return scores.reduce((a, b) => a + b, 0) / scores.length;
  };
  
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [students]);

  return (
      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                  <CardTitle>{termKey === 'term1Grades' ? '1. Dönem Notları' : '2. Dönem Notları'}</CardTitle>
                  <Button onClick={onSave}><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
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
                          <TableHead className="text-center">Ortalama</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sortedStudents.map(student => {
                          const grades: any = student[termKey] || {};
                          const average = calculateAverage(grades);
                          return (
                              <TableRow key={student.id}>
                                  <TableCell>{student.number}</TableCell>
                                  <TableCell className="font-medium">{student.name}</TableCell>
                                  {(['exam1', 'exam2', 'perf1', 'perf2'] as GradeField[]).map(field => (
                                       <TableCell key={field}>
                                          <Input
                                              type="number"
                                              className="w-20 mx-auto text-center h-8"
                                              value={grades[field] ?? ''}
                                              onChange={e => onStudentGradeChange(student.id, field, e.target.value === '' ? null : Number(e.target.value))}
                                          />
                                      </TableCell>
                                  ))}
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
  const [activeTermForBulk, setActiveTermForBulk] = useState<1 | 2>(1);


  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  
  const handleStudentGradeChange = (studentId: string, field: GradeField, value: number | null) => {
      setStudents(prevStudents => 
          prevStudents.map(student => {
              if (student.id === studentId) {
                  const termKey = activeTermForBulk === 1 ? 'term1Grades' : 'term2Grades';
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


  return (
    <>
      <Tabs defaultValue="term1" onValueChange={(val) => setActiveTermForBulk(val === 'term1' ? 1 : 2)}>
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
          />
        </TabsContent>
        <TabsContent value="term2">
          <TermGradingTable
            students={students}
            termKey="term2Grades"
            onSave={() => handleSaveChanges('term2Grades')}
            onStudentGradeChange={handleStudentGradeChange}
          />
        </TabsContent>
      </Tabs>

      <BulkGradeEntryDialog 
        isOpen={isBulkGradeOpen}
        setIsOpen={setIsBulkGradeOpen}
        students={students}
        activeTerm={activeTermForBulk}
      />
    </>
  );
}
