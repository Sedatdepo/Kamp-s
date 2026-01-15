
"use client";

import { useState, useMemo } from 'react';
import { Student, GradingScores } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  students: Student[];
  teacherBranch: string;
  activeTerm: 1 | 2;
  onBulkUpdate: (updatedStudents: Student[]) => void;
}

export type GradeType = 
    | 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade'
    | 'writtenExam1' | 'speakingExam1' | 'listeningExam1'
    | 'writtenExam2' | 'speakingExam2' | 'listeningExam2';

export function BulkGradeEntryDialog({ isOpen, setIsOpen, students, teacherBranch, activeTerm, onBulkUpdate }: BulkGradeEntryDialogProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const termGradesKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
  const isLiteratureTeacher = teacherBranch === 'Edebiyat' || teacherBranch === 'Türk Dili ve Edebiyatı';

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      return a.number.localeCompare(b.number, 'tr', { numeric: true });
    });
  }, [students]);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, gradeType: GradeType) => {
    e.preventDefault();
    if (!db) return;
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) return;

    if (lines.length > sortedStudents.length) {
        toast({
            variant: 'destructive',
            title: 'Hata: Veri Uyuşmazlığı',
            description: `Yapıştırdığınız ${lines.length} satır, sınıftaki ${sortedStudents.length} öğrenciden fazla. Lütfen kontrol edin.`
        });
        return;
    }

    const batch = writeBatch(db);
    let updatedCount = 0;
    const updatedStudents = [...students];

    sortedStudents.forEach((student, index) => {
        if (index < lines.length) {
            const lineValue = lines[index].toUpperCase();
            let grade: number | null = null;
            
            if(lineValue === 'G') {
                grade = -1; // "G" için özel kod
            } else {
                const parsedGrade = parseFloat(lineValue);
                if (!isNaN(parsedGrade)) {
                    grade = parsedGrade;
                }
            }
            
            if (grade !== null) {
                const studentRef = doc(db, 'students', student.id);
                const gradeField = `${termGradesKey}.${gradeType}`;
                batch.update(studentRef, { [gradeField]: grade });

                const studentIndexInOriginalArray = updatedStudents.findIndex(s => s.id === student.id);
                if (studentIndexInOriginalArray !== -1) {
                    const studentToUpdate = { ...updatedStudents[studentIndexInOriginalArray] };
                    const termGrades = { ...(studentToUpdate[termGradesKey] || {}) };
                    // @ts-ignore
                    termGrades[gradeType] = grade;
                    studentToUpdate[termGradesKey] = termGrades;
                    updatedStudents[studentIndexInOriginalArray] = studentToUpdate;
                }
                
                updatedCount++;
            }
        }
    });

    try {
        await batch.commit();
        onBulkUpdate(updatedStudents);
        toast({
            title: 'Notlar Kaydedildi',
            description: `${updatedCount} öğrencinin notu başarıyla güncellendi.`
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Kayıt Hatası',
            description: error.message || "Notları kaydederken bir hata oluştu."
        });
    }
  };
  
  const displayGrade = (grade: number | undefined | null) => {
    if (grade === -1) return 'G';
    if (grade === null || grade === undefined) return 'Girmedi';
    return grade;
  }

  const renderGradeHeaders = () => {
    if (isLiteratureTeacher) {
      return (
        <>
          <TableHead>1. Yazılı</TableHead>
          <TableHead>1. Konuşma</TableHead>
          <TableHead>1. Dinleme</TableHead>
          <TableHead>2. Yazılı</TableHead>
          <TableHead>2. Konuşma</TableHead>
          <TableHead>2. Dinleme</TableHead>
        </>
      );
    }
    return (
      <>
        <TableHead>1. Sınav</TableHead>
        <TableHead>2. Sınav</TableHead>
        <TableHead>1. Performans</TableHead>
        <TableHead>2. Performans</TableHead>
        {activeTerm === 2 && <TableHead>Proje</TableHead>}
      </>
    );
  };

  const renderStudentGradeCells = (student: Student) => {
    const termGrades = student[termGradesKey];
    if (isLiteratureTeacher) {
        return (
            <>
                <TableCell>{displayGrade(termGrades?.writtenExam1)}</TableCell>
                <TableCell>{displayGrade(termGrades?.speakingExam1)}</TableCell>
                <TableCell>{displayGrade(termGrades?.listeningExam1)}</TableCell>
                <TableCell>{displayGrade(termGrades?.writtenExam2)}</TableCell>
                <TableCell>{displayGrade(termGrades?.speakingExam2)}</TableCell>
                <TableCell>{displayGrade(termGrades?.listeningExam2)}</TableCell>
            </>
        )
    }
    return (
        <>
            <TableCell>{displayGrade(termGrades?.exam1)}</TableCell>
            <TableCell>{displayGrade(termGrades?.exam2)}</TableCell>
            <TableCell>{displayGrade(termGrades?.perf1)}</TableCell>
            <TableCell>{displayGrade(termGrades?.perf2)}</TableCell>
            {activeTerm === 2 && <TableCell>{displayGrade(termGrades?.projectGrade)}</TableCell>}
        </>
    )
  }

  const renderPasteAreas = () => {
    const commonProps = (gradeType: GradeType) => ({
        className:"h-full min-h-[40px] resize-none text-xs p-1 font-mono",
        onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => handlePaste(e, gradeType),
        onChange:(e: React.ChangeEvent<HTMLTextAreaElement>) => e.target.value = ''
    });

    if (isLiteratureTeacher) {
        return (
            <>
                <TableCell className="p-1 align-top"><Textarea placeholder="1. Yazılı..." {...commonProps('writtenExam1')} /></TableCell>
                <TableCell className="p-1 align-top"><Textarea placeholder="1. Konuşma..." {...commonProps('speakingExam1')} /></TableCell>
                <TableCell className="p-1 align-top"><Textarea placeholder="1. Dinleme..." {...commonProps('listeningExam1')} /></TableCell>
                <TableCell className="p-1 align-top"><Textarea placeholder="2. Yazılı..." {...commonProps('writtenExam2')} /></TableCell>
                <TableCell className="p-1 align-top"><Textarea placeholder="2. Konuşma..." {...commonProps('speakingExam2')} /></TableCell>
                <TableCell className="p-1 align-top"><Textarea placeholder="2. Dinleme..." {...commonProps('listeningExam2')} /></TableCell>
            </>
        )
    }
     return (
        <>
            <TableCell className="p-1 align-top"><Textarea placeholder="1. Sınav..." {...commonProps('exam1')} /></TableCell>
            <TableCell className="p-1 align-top"><Textarea placeholder="2. Sınav..." {...commonProps('exam2')} /></TableCell>
            <TableCell className="p-1 align-top"><Textarea placeholder="1. Perf..." {...commonProps('perf1')} /></TableCell>
            <TableCell className="p-1 align-top"><Textarea placeholder="2. Perf..." {...commonProps('perf2')} /></TableCell>
            {activeTerm === 2 && <TableCell className="p-1 align-top"><Textarea placeholder="Proje..." {...commonProps('projectGrade')} /></TableCell>}
        </>
     )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Toplu Not Girişi ({activeTerm}. Dönem)</DialogTitle>
          <DialogDescription>
            Excel'den bir not sütununu kopyalayıp ilgili sütunun altındaki alana yapıştırın. 'G' harfi de desteklenmektedir.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-1/4">Öğrenci Adı</TableHead>
                {renderGradeHeaders()}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell>{student.number}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        {renderStudentGradeCells(student)}
                    </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={2} className="font-bold p-1 text-right pr-4 align-top pt-3">Yapıştırma Alanı:</TableCell>
                {renderPasteAreas()}
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
