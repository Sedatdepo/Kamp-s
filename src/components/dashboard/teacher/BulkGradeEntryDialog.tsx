'use client';

import { useState, useMemo, useEffect } from 'react';
import { Student, GradingScores, Criterion, DisciplineRecord, Homework, Submission } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch, collection, query, where, getDocs, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, AlertCircle } from 'lucide-react';
import { generatePerformanceGrade } from '@/ai/flows/generate-performance-grade-flow';

interface BulkGradeEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  students: Student[];
  teacherBranch: string;
  activeTerm: 1 | 2;
  onBulkUpdate: (updatedStudents: Student[]) => void;
  perfCriteria: Criterion[];
  projCriteria: Criterion[];
  disciplineRecords: DisciplineRecord[];
}

export type GradeType = 
    | 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade'
    | 'writtenExam1' | 'speakingExam1' | 'listeningExam1'
    | 'writtenExam2' | 'speakingExam2' | 'listeningExam2';

const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria.length || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return (totalScore / totalMax) * 100;
};

const calculateTermAverage = (student: Student, termKey: 'term1Grades' | 'term2Grades', perfCriteria: Criterion[], projCriteria: Criterion[], newPerf1?: number, newPerf2?: number) => {
    const termGrades = student[termKey];
    if (!termGrades) return 0;
    
    const perf1 = newPerf1 ?? (termGrades.perf1 ?? calculateAverage(termGrades.scores1, perfCriteria));
    const perf2 = newPerf2 ?? (termGrades.perf2 ?? calculateAverage(termGrades.scores2, perfCriteria));

    const exams = [termGrades.exam1, termGrades.exam2].filter(g => g !== undefined && g !== null && g >= 0) as number[];
    const projAvg = student.hasProject ? (termGrades.projectGrade ?? calculateAverage(termGrades.projectScores, projCriteria)) : null;

    const allScores = [...exams, perf1, perf2, projAvg].filter(
      (score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0
    );

    if (allScores.length === 0) return 0;
    
    const sum = allScores.reduce((acc, score) => acc + score, 0);
    return sum / allScores.length;
};

export function BulkGradeEntryDialog({ isOpen, setIsOpen, students, teacherBranch, activeTerm, onBulkUpdate, perfCriteria, projCriteria, disciplineRecords }: BulkGradeEntryDialogProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const termGradesKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
  const isLiteratureTeacher = teacherBranch === 'Edebiyat' || teacherBranch === 'Türk Dili ve Edebiyatı';

  const [editableStudents, setEditableStudents] = useState<Student[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [criticalStudentIds, setCriticalStudentIds] = useState<string[]>([]);

  useEffect(() => {
    setEditableStudents(JSON.parse(JSON.stringify(students)));
  }, [students, isOpen]);

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
                const parsedGrade = parseFloat(lineValue.replace(',', '.'));
                if (!isNaN(parsedGrade)) {
                    grade = parsedGrade;
                }
            }
            
            const studentIndex = updatedStudents.findIndex(s => s.id === student.id);
            if (grade !== null && studentIndex !== -1) {
                const studentToUpdate = updatedStudents[studentIndex];
                if (!studentToUpdate[termGradesKey]) {
                    (studentToUpdate as any)[termGradesKey] = {};
                }
                const termGrades = studentToUpdate[termGradesKey] as GradingScores;
                
                (termGrades as any)[gradeType] = grade;

                let criteriaToUse: Criterion[] | null = null;
                let scoreKey: keyof GradingScores | null = null;

                if (gradeType === 'perf1') {
                    criteriaToUse = perfCriteria;
                    scoreKey = 'scores1';
                } else if (gradeType === 'perf2') {
                    criteriaToUse = perfCriteria;
                    scoreKey = 'scores2';
                } else if (gradeType === 'projectGrade') {
                    criteriaToUse = projCriteria;
                    scoreKey = 'projectScores';
                }

                if (criteriaToUse && scoreKey && grade >= 0) {
                    const totalMax = criteriaToUse.reduce((sum, c) => sum + (c.max || 0), 0);
                    const newScores: { [key: string]: number } = {};
                    if (totalMax > 0) {
                        criteriaToUse.forEach(c => {
                            const proportion = (c.max || 0) / totalMax;
                            newScores[c.id] = Math.round(grade! * proportion);
                        });
                    }
                    termGrades[scoreKey] = newScores;
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
  
  const handleAiFill = async () => {
    if (!db) return;
    setIsGenerating(true);
    setCriticalStudentIds([]);

    try {
        const studentDataPromises = sortedStudents.map(async (student) => {
            const homeworksColRef = collection(db, 'classes', student.classId, 'homeworks');
            const q = query(homeworksColRef, where('assignmentType', '==', 'performance'));
            const homeworksSnapshot = await getDocs(q);
            const performanceHomeworks = homeworksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Homework));

            let performanceGrades: number[] = [];
            for (const hw of performanceHomeworks) {
                const submissionsColRef = collection(db, `classes/${student.classId}/homeworks/${hw.id}/submissions`);
                const subQuery = query(submissionsColRef, where('studentId', '==', student.id));
                const subSnapshot = await getDocs(subQuery);
                if (!subSnapshot.empty) {
                    const submission = subSnapshot.docs[0].data() as Submission;
                    if (submission.grade !== undefined && submission.grade !== null) {
                        performanceGrades.push(submission.grade);
                    }
                }
            }
            const performanceHomeworkAverage = performanceGrades.length > 0 ? performanceGrades.reduce((a, b) => a + b, 0) / performanceGrades.length : undefined;

            const termGrades = student[termGradesKey];
            const exams = [termGrades?.exam1, termGrades?.exam2].filter(g => g !== undefined && g !== null && g >= 0) as number[];
            const examAverage = exams.length > 0 ? exams.reduce((a, b) => a + b, 0) / exams.length : 50;

            const badgeCount = (student.badges || []).length;
            const negativeBehaviorCount = (student.behaviorLogs || []).filter(log => log.points < 0).length;
            const disciplineRecordCount = (disciplineRecords || []).filter(r => r.formData?.studentInfo?.studentId === student.id).length;

            const aiInput = {
                studentName: student.name,
                examAverage,
                behaviorScore: student.behaviorScore || 100,
                badgeCount,
                negativeBehaviorCount,
                disciplineRecordCount,
                performanceHomeworkAverage,
            };

            const result = await generatePerformanceGrade(aiInput);
            
            const updatedStudent = JSON.parse(JSON.stringify(student));
            if (!updatedStudent[termGradesKey]) updatedStudent[termGradesKey] = {};
            updatedStudent[termGradesKey].perf1 = result.perf1_grade;
            updatedStudent[termGradesKey].perf2 = result.perf2_grade;

            return { student: updatedStudent, aiInput }; 
        });

        const firstPassResults = await Promise.all(studentDataPromises);
        const firstPassStudents = firstPassResults.map(r => r.student);

        const studentsToAdjust = firstPassResults.filter(({ student }) => {
            const newAverage = calculateTermAverage(student, termGradesKey, perfCriteria, projCriteria, student[termGradesKey]?.perf1, student[termGradesKey]?.perf2);
            return newAverage >= 45 && newAverage < 50;
        });
        
        if (studentsToAdjust.length > 0) {
            toast({
                title: "Kritik Eşik Tespiti",
                description: `${studentsToAdjust.length} öğrencinin ortalaması 45-50 aralığında. Notlar otomatik olarak ayarlanıyor...`
            });

            const adjustmentPromises = studentsToAdjust.map(async ({ student, aiInput }) => {
                const adjustmentInput = { ...aiInput, adjustmentGoal: 'bring_below_45' };
                const result = await generatePerformanceGrade(adjustmentInput);
                const adjustedStudent = JSON.parse(JSON.stringify(student));
                adjustedStudent[termGradesKey].perf1 = result.perf1_grade;
                adjustedStudent[termGradesKey].perf2 = result.perf2_grade;
                return adjustedStudent;
            });

            const adjustedStudents = await Promise.all(adjustmentPromises);

            adjustedStudents.forEach(adjStudent => {
                const index = firstPassStudents.findIndex(s => s.id === adjStudent.id);
                if (index !== -1) {
                    firstPassStudents[index] = adjStudent;
                }
            });

            setCriticalStudentIds(studentsToAdjust.map(s => s.student.id));
        }

        setEditableStudents(firstPassStudents);
        toast({
            title: "Yapay Zeka Tamamladı!",
            description: "Tüm öğrenciler için performans notları başarıyla oluşturuldu. Kaydetmeyi unutmayın.",
        });

    } catch (error) {
        console.error("AI grade generation failed:", error);
        toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Yapay zeka ile notlar oluşturulurken bir sorun oluştu.'
        });
    } finally {
        setIsGenerating(false);
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
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>Toplu Not Girişi ({activeTerm}. Dönem)</DialogTitle>
              <DialogDescription>
                Excel'den bir not sütununu kopyalayıp ilgili sütunun altındaki alana yapıştırın veya doğrudan tablo üzerinden notları girin.
              </DialogDescription>
            </div>
            <Button onClick={handleAiFill} disabled={isGenerating} size="sm">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4"/>}
              AI ile Doldur
            </Button>
          </div>
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
                        <TableCell className="font-medium flex items-center gap-2">
                           {student.name}
                           {criticalStudentIds.includes(student.id) && <AlertCircle className="h-4 w-4 text-orange-500" title="Bu öğrencinin notu, 45-50 aralığında kaldığı için ortalamayı düşürecek şekilde AI tarafından otomatik olarak ayarlandı."/>}
                        </TableCell>
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
