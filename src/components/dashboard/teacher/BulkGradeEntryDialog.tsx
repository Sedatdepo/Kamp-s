
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

type GradeType = 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade';

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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Toplu Not Girişi ({activeTerm}. Dönem)</DialogTitle>
          <DialogDescription>
            Excel'den bir not sütununu kopyalayıp ilgili sütunun altındaki alana yapıştırın. Sistem, notları sırayla öğrencilere atayacaktır. 'G' harfi de desteklenmektedir.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-1/4">Öğrenci Adı</TableHead>
                <TableHead>1. Yazılı</TableHead>
                <TableHead>2. Yazılı</TableHead>
                <TableHead>1. Performans</TableHead>
                <TableHead>2. Performans</TableHead>
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
                        <TableCell>{displayGrade(termGrades?.exam1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.exam2)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.perf1)}</TableCell>
                        <TableCell>{displayGrade(termGrades?.perf2)}</TableCell>
                         {activeTerm === 2 && <TableCell>{displayGrade(termGrades?.projectGrade)}</TableCell>}
                    </TableRow>
                )
              })}
               <TableRow>
                <TableCell colSpan={2} className="font-bold p-1 text-right pr-4 align-top pt-3">Yapıştırma Alanı:</TableCell>
                 {(['exam1', 'exam2', 'perf1', 'perf2'] as GradeType[]).map(gradeType => (
                    <TableCell key={gradeType} className="p-1 align-top">
                        <Textarea
                        placeholder="Notları buraya yapıştırın"
                        className="h-full min-h-[40px] resize-none text-xs p-1 font-mono"
                        onPaste={(e) => handlePaste(e, gradeType)}
                        onChange={(e) => e.target.value = ''} 
                        />
                    </TableCell>
                 ))}
                 {activeTerm === 2 && (
                    <TableCell className="p-1 align-top">
                        <Textarea
                        placeholder="Proje notlarını buraya yapıştırın"
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
