
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
  activeTerm: 1 | 2;
  onBulkUpdate: (updatedStudents: Student[]) => void; // Callback to update parent state
}

type GradeType = 'writtenExam1' | 'speakingExam1' | 'listeningExam1' | 'writtenExam2' | 'speakingExam2' | 'listeningExam2' | 'perf1' | 'perf2' | 'projectGrade';


export function BulkGradeEntryDialog({ isOpen, setIsOpen, students, activeTerm, onBulkUpdate }: BulkGradeEntryDialogProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const termGradesKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, gradeType: GradeType) => {
    e.preventDefault();
    if (!db) return;
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line);
    
    if (lines.length === 0) return;

    if (lines.length > students.length) {
        toast({
            variant: 'destructive',
            title: 'Hata: Veri Uyuşmazlığı',
            description: `Yapıştırdığınız ${lines.length} satır, sınıftaki ${students.length} öğrenciden fazla. Lütfen kontrol edin.`
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

                // Update local state copy
                const studentIndexInOriginalArray = updatedStudents.findIndex(s => s.id === student.id);
                if (studentIndexInOriginalArray !== -1) {
                    const studentToUpdate = { ...updatedStudents[studentIndexInOriginalArray] };
                    const termGrades = { ...(studentToUpdate[termGradesKey] || {}) } as GradingScores;
                    // @ts-ignore
                    termGrades[gradeType] = grade;
                    
                    // Recalculate main exam grade
                    if (gradeType.includes('1')) {
                        const w = termGrades.writtenExam1 ?? 0;
                        const s = termGrades.speakingExam1 ?? 0;
                        const l = termGrades.listeningExam1 ?? 0;
                        if (w>0 || s>0 || l>0) {
                           termGrades.exam1 = w * 0.7 + s * 0.15 + l * 0.15;
                        }
                    }
                    if (gradeType.includes('2')) {
                        const w = termGrades.writtenExam2 ?? 0;
                        const s = termGrades.speakingExam2 ?? 0;
                        const l = termGrades.listeningExam2 ?? 0;
                         if (w>0 || s>0 || l>0) {
                           termGrades.exam2 = w * 0.7 + s * 0.15 + l * 0.15;
                        }
                    }

                    studentToUpdate[termGradesKey] = termGrades;
                    updatedStudents[studentIndexInOriginalArray] = studentToUpdate;
                }
                
                updatedCount++;
            }
        }
    });

    try {
        await batch.commit();
        onBulkUpdate(updatedStudents); // Update parent component's state
        toast({
            title: 'Notlar Kaydedildi',
            description: `${updatedCount} öğrencinin notu başarıyla güncellendi.`
        });
        // Optionally close dialog after success
        // setIsOpen(false); 
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Kayıt Hatası',
            description: error.message || "Notları kaydederken bir hata oluştu."
        });
    }
  };
  
  const sortedStudents = [...students].sort((a, b) => {
    return a.number.localeCompare(b.number, 'tr', { numeric: true });
  });
  
  const displayGrade = (grade: number | undefined | null) => {
    if (grade === -1) return 'G';
    if (grade === null || grade === undefined) return 'Girmedi';
    return grade;
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
                <TableHead className="w-1/5">Öğrenci Adı</TableHead>
                <TableHead>1. Yazılı</TableHead>
                <TableHead>1. Konuşma</TableHead>
                <TableHead>1. Dinleme</TableHead>
                <TableHead>2. Yazılı</TableHead>
                <TableHead>2. Konuşma</TableHead>
                <TableHead>2. Dinleme</TableHead>
                <TableHead>1. Perf.</TableHead>
                <TableHead>2. Perf.</TableHead>
                {activeTerm === 2 && <TableHead>Proje</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => {
                const termGrades = student[termGradesKey];
                return (
                    <TableRow key={student.id}>
                        <TableCell>{student.number}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{displayGrade(termGrades?.writtenExam1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.speakingExam1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.listeningExam1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.writtenExam2)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.speakingExam2)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.listeningExam2)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.perf1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.perf2)}</TableCell>
                         {activeTerm === 2 && <TableCell>{displayGrade(termGrades?.projectGrade)}</TableCell>}
                    </TableRow>
                )
              })}
               <TableRow>
                <TableCell colSpan={2} className="font-bold p-1 text-right pr-4 align-top pt-3">Yapıştırma Alanı:</TableCell>
                 {(['writtenExam1', 'speakingExam1', 'listeningExam1', 'writtenExam2', 'speakingExam2', 'listeningExam2', 'perf1', 'perf2'] as GradeType[]).map(gradeType => (
                    <TableCell key={gradeType} className="p-1 align-top">
                        <Textarea
                        placeholder="..."
                        className="h-full min-h-[40px] resize-none text-xs p-1 font-mono"
                        onPaste={(e) => handlePaste(e, gradeType)}
                        onChange={(e) => e.target.value = ''} 
                        />
                    </TableCell>
                 ))}
                 {activeTerm === 2 && (
                    <TableCell className="p-1 align-top">
                        <Textarea
                        placeholder="Proje..."
                        className="h-full min-h-[40px] resize-none text-xs p-1 font-mono"
                        onPaste={(e) => handlePaste(e, 'projectGrade')}
                        onChange={(e) => e.target.value = ''} 
                        />
                    </TableCell>
                 )}
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
