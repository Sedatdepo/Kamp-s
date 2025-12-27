
"use client";

import { useState, useMemo } from 'react';
import { Student, GradingScores } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  students: Student[];
}

type GradeType = 'exam1' | 'exam2' | 'perf1' | 'perf2';

export function BulkGradeEntryDialog({ isOpen, setIsOpen, students }: BulkGradeEntryDialogProps) {
  const { toast } = useToast();

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, gradeType: GradeType) => {
    e.preventDefault();
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
                // We are only updating term 1 for simplicity based on user request
                batch.update(studentRef, {
                    [`term1Grades.${gradeType}`]: grade,
                });
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
        // We can close the dialog after a successful paste, or keep it open for more entries
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Toplu Not Girişi (1. Dönem)</DialogTitle>
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
              {sortedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.number}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.term1Grades?.exam1 ?? 'Girmedi'}</TableCell>
                  <TableCell>{student.term1Grades?.exam2 ?? 'Girmedi'}</TableCell>
                  <TableCell>{student.term1Grades?.perf1 ?? 'Girmedi'}</TableCell>
                  <TableCell>{student.term1Grades?.perf2 ?? 'Girmedi'}</TableCell>
                </TableRow>
              ))}
               <TableRow>
                <TableCell className="font-bold p-1">Yapıştırma Alanı:</TableCell>
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
