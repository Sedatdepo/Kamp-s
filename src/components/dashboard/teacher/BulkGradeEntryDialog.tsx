
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
import { ActiveTerm } from './GradingToolTab';

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  students: Student[];
  activeTerm: ActiveTerm;
}

type GradeType = 'exam1' | 'exam2' | 'perf1' | 'perf2';

export function BulkGradeEntryDialog({ isOpen, setIsOpen, students, activeTerm }: BulkGradeEntryDialogProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const termGradesKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';


  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, gradeType: GradeType) => {
    e.preventDefault();
    if (!db) return;
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').map(line => line.trim()).filter(line => line);
    
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

    students.forEach((student, index) => {
        if (index < lines.length) {
            const grade = parseFloat(lines[index]);
            if (!isNaN(grade)) {
                const studentRef = doc(db, 'students', student.id);
                
                const gradeFieldMap: Record<GradeType, string> = {
                  exam1: `${termGradesKey}.exam1`,
                  exam2: `${termGradesKey}.exam2`,
                  perf1: `${termGradesKey}.scores1`,
                  perf2: `${termGradesKey}.scores2`,
                };
                const gradeField = gradeFieldMap[gradeType];

                let updateData: any = {};
                if (gradeType === 'perf1' || gradeType === 'perf2') {
                    // This is a placeholder logic for bulk entering performance.
                    // It overwrites the criteria with a single value.
                    updateData[gradeField] = { 'topluGiris': grade };
                } else {
                    updateData[gradeField] = grade;
                }

                batch.update(studentRef, updateData);
                updatedCount++;
            }
        }
    });

    try {
        await batch.commit();
        toast({
            title: 'Notlar Kaydedildi',
            description: `${updatedCount} öğrencinin notu başarıyla güncellendi.`
        });
        // You might want to close the dialog or refresh data after paste
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
    const numA = parseInt(a.number, 10);
    const numB = parseInt(b.number, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
    }
    return a.number.localeCompare(b.number, 'tr');
  });

  const getPerformanceGrade = (scores: { [key:string]: number } | undefined) => {
      if (!scores) return "Girmedi";
      // This is a simplification. Assuming the pasted value is in a known key.
      return scores['topluGiris'] ?? 'Girmedi';
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Toplu Not Girişi ({activeTerm}. Dönem)</DialogTitle>
          <DialogDescription>
            Excel'den bir not sütununu kopyalayıp ilgili sütunun altındaki alana yapıştırın. Sistem, notları sırayla öğrencilere atayacaktır.
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student) => {
                const termGrades = student[termGradesKey];
                return (
                    <TableRow key={student.id}>
                        <TableCell>{student.number}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{termGrades?.exam1 ?? 'Girmedi'}</TableCell>
                        <TableCell>{termGrades?.exam2 ?? 'Girmedi'}</TableCell>
                        <TableCell>{getPerformanceGrade(termGrades?.scores1)}</TableCell>
                        <TableCell>{getPerformanceGrade(termGrades?.scores2)}</TableCell>
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
                        // Prevent typing, only allow pasting
                        onChange={(e) => e.target.value = ''} 
                        />
                    </TableCell>
                 ))}
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
