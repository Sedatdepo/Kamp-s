'use client';

import { useState, useMemo, useEffect } from 'react';
import { Student, GradingScores } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

  const [editableStudents, setEditableStudents] = useState<Student[]>([]);

  useEffect(() => {
    // Deep copy students to local state when dialog opens or students prop changes
    setEditableStudents(JSON.parse(JSON.stringify(students)));
  }, [students, isOpen]); // Also depends on isOpen to reset when reopened

  const sortedStudents = useMemo(() => {
    return [...editableStudents].sort((a, b) => {
       return a.number.localeCompare(b.number, 'tr', { numeric: true });
     });
  }, [editableStudents]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, gradeType: GradeType) => {
    e.preventDefault();
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
    
    const updatedStudents = [...editableStudents];

    sortedStudents.forEach((student, index) => {
        if (index < lines.length) {
            const lineValue = lines[index].toUpperCase();
            let grade: number | null = null;
            
            if(lineValue === 'G') {
                grade = -1;
            } else {
                const parsedGrade = parseFloat(lineValue.replace(',', '.')); // Handle comma decimal separator
                if (!isNaN(parsedGrade)) {
                    grade = parsedGrade;
                }
            }
            
            if (grade !== null) {
                const studentIndex = updatedStudents.findIndex(s => s.id === student.id);
                if (studentIndex !== -1) {
                    const studentToUpdate = updatedStudents[studentIndex];
                    if (!studentToUpdate[termGradesKey]) {
                        (studentToUpdate as any)[termGradesKey] = {};
                    }
                    (studentToUpdate[termGradesKey] as any)[gradeType] = grade;
                }
            }
        }
    });

    setEditableStudents(updatedStudents);
    toast({
        title: 'Notlar Yapıştırıldı',
        description: 'Lütfen kontrol edin ve kaydetmek için "Kaydet ve Kapat" butonuna tıklayın.'
    });
  };
  
  const handleGradeChange = (studentId: string, gradeType: GradeType, value: string) => {
    const grade = value.toUpperCase() === 'G' ? -1 : (value === '' ? null : parseFloat(value.replace(',', '.')));

    if (value !== '' && value.toUpperCase() !== 'G' && isNaN(grade as number)) {
        toast({ variant: 'destructive', title: 'Geçersiz Not', description: 'Lütfen sayı veya "G" girin.'});
        return;
    }

    setEditableStudents(prev => 
        prev.map(s => {
            if (s.id === studentId) {
                const updatedStudent = JSON.parse(JSON.stringify(s)); 
                if (!updatedStudent[termGradesKey]) {
                    updatedStudent[termGradesKey] = {};
                }
                if (grade === null) {
                    delete updatedStudent[termGradesKey][gradeType];
                } else {
                    updatedStudent[termGradesKey][gradeType] = grade;
                }
                return updatedStudent;
            }
            return s;
        })
    );
  };
  
  const handleSave = async () => {
    if (!db) return;
    
    const batch = writeBatch(db);
    let updatedCount = 0;

    editableStudents.forEach(editedStudent => {
        const originalStudent = students.find(s => s.id === editedStudent.id);
        if (JSON.stringify(editedStudent[termGradesKey]) !== JSON.stringify(originalStudent?.[termGradesKey])) {
            const studentRef = doc(db, 'students', editedStudent.id);
            batch.update(studentRef, {
                [termGradesKey]: editedStudent[termGradesKey] || {}
            });
            updatedCount++;
        }
    });

    if (updatedCount === 0) {
        toast({ title: 'Değişiklik yok', description: 'Kaydedilecek bir değişiklik bulunamadı.' });
        setIsOpen(false);
        return;
    }

    try {
        await batch.commit();
        onBulkUpdate(editableStudents);
        toast({ title: 'Notlar Kaydedildi', description: `${updatedCount} öğrencinin notu başarıyla güncellendi.` });
        setIsOpen(false);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Kayıt Hatası',
            description: error.message || "Notları kaydederken bir hata oluştu."
        });
    }
  };

  const GradeInput = ({ studentId, gradeType }: { studentId: string; gradeType: GradeType }) => {
    const student = editableStudents.find(s => s.id === studentId);
    const value = student?.[termGradesKey]?.[gradeType];
    let displayValue = '';
    if (value === -1) displayValue = 'G';
    else if (value !== null && value !== undefined) displayValue = String(value);

    return (
        <Input
            value={displayValue}
            onChange={e => handleGradeChange(studentId, gradeType, e.target.value)}
            className="h-9 w-20 text-center"
            placeholder="-"
        />
    );
  };

  const renderStudentGradeCells = (student: Student) => {
    if (isLiteratureTeacher) {
        return (
            <>
                <TableCell><GradeInput studentId={student.id} gradeType="writtenExam1" /></TableCell>
                <TableCell><GradeInput studentId={student.id} gradeType="speakingExam1" /></TableCell>
                <TableCell><GradeInput studentId={student.id} gradeType="listeningExam1" /></TableCell>
                <TableCell><GradeInput studentId={student.id} gradeType="writtenExam2" /></TableCell>
                <TableCell><GradeInput studentId={student.id} gradeType="speakingExam2" /></TableCell>
                <TableCell><GradeInput studentId={student.id} gradeType="listeningExam2" /></TableCell>
            </>
        )
    }
    return (
        <>
            <TableCell><GradeInput studentId={student.id} gradeType="exam1" /></TableCell>
            <TableCell><GradeInput studentId={student.id} gradeType="exam2" /></TableCell>
            <TableCell><GradeInput studentId={student.id} gradeType="perf1" /></TableCell>
            <TableCell><GradeInput studentId={student.id} gradeType="perf2" /></TableCell>
            {activeTerm === 2 && <TableCell><GradeInput studentId={student.id} gradeType="projectGrade" /></TableCell>}
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
            Excel'den bir not sütununu kopyalayıp ilgili sütunun altındaki alana yapıştırın veya doğrudan tablo üzerinden notları girin.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-1/4">Öğrenci Adı</TableHead>
                {isLiteratureTeacher ? (
                  <>
                    <TableHead>1. Yazılı</TableHead>
                    <TableHead>1. Konuşma</TableHead>
                    <TableHead>1. Dinleme</TableHead>
                    <TableHead>2. Yazılı</TableHead>
                    <TableHead>2. Konuşma</TableHead>
                    <TableHead>2. Dinleme</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>1. Sınav</TableHead>
                    <TableHead>2. Sınav</TableHead>
                    <TableHead>1. Performans</TableHead>
                    <TableHead>2. Performans</TableHead>
                    {activeTerm === 2 && <TableHead>Proje</TableHead>}
                  </>
                )}
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
         <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>İptal</Button>
            <Button onClick={handleSave}>Kaydet ve Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}