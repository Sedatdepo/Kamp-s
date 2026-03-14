'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Submission, Homework, TeacherProfile, Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, Paperclip, FileDown } from 'lucide-react';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCollection, useMemoFirebase } from '@/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { exportHomeworkEvaluationToRtf } from '@/lib/word-export';


const PerformanceHomeworkCard = ({ homework, students, submissions, classId, onScoresUpdated, onDelete, teacherProfile, currentClass }: { homework: Homework, students: Student[], submissions: Submission[], classId: string, onScoresUpdated: () => void, onDelete: (homeworkId: string) => void, teacherProfile: TeacherProfile | null, currentClass: Class | null }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaLabel: string]: number } }>({});
    const [feedback, setFeedback] = useState<{ [studentId: string]: string }>({});

    useEffect(() => {
        const initialScores: any = {};
        const initialFeedback: any = {};
        students.forEach((student: Student) => {
            const submission = submissions.find((s: Submission) => s.studentId === student.id);
            if (submission) {
                initialScores[student.id] = submission.rubricScores || {};
                initialFeedback[student.id] = submission.feedback || '';
            }
        });
        setScores(initialScores);
        setFeedback(initialFeedback);
    }, [submissions, students]);

    const handleScoreChange = (studentId: string, criteriaLabel: string, value: string) => {
        const newScore = parseInt(value, 10);
        setScores(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [criteriaLabel]: isNaN(newScore) ? 0 : newScore },
        }));
    };
    
    const handleFeedbackChange = (studentId: string, value: string) => {
        setFeedback(prev => ({ ...prev, [studentId]: value }));
    };

    const handleSaveAll = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        
        for (const student of students) {
            const submission = submissions.find((s: Submission) => s.studentId === student.id);
            const studentScores = scores[student.id];
            const studentFeedback = feedback[student.id];
            
            const hasDataToSave = (studentScores && Object.keys(studentScores).length > 0) || (studentFeedback && studentFeedback.trim() !== '');

            const totalScore = homework.rubric?.reduce((sum: number, c: any) => sum + (Number(studentScores?.[c.label]) || 0), 0) || 0;

            if (submission) {
                const subRef = doc(db, 'classes', classId, 'homeworks', homework.id, 'submissions', submission.id);
                const updates: any = {};
                if (JSON.stringify(studentScores) !== JSON.stringify(submission.rubricScores || {})) updates.rubricScores = studentScores;
                if (studentFeedback !== (submission.feedback || '')) updates.feedback = studentFeedback;
                if (totalScore !== submission.grade) updates.grade = totalScore;
                
                if (Object.keys(updates).length > 0) batch.update(subRef, updates);

            } else if(hasDataToSave) {
                const newSubRef = doc(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'));
                batch.set(newSubRef, {
                    studentId: student.id, studentName: student.name, studentNumber: student.number,
                    homeworkId: homework.id, submittedAt: new Date().toISOString(), rubricScores: studentScores || {},
                    feedback: studentFeedback || '', grade: totalScore, text: 'Öğretmen tarafından not girişi yapıldı.'
                });
            }
        }
        await batch.commit();
        toast({ title: 'Değerlendirmeler kaydedildi.' });
        onScoresUpdated();
    };

    const handleExport = () => {
        if (currentClass && teacherProfile) {
            exportHomeworkEvaluationToRtf({
                students,
                selectedHomework: homework,
                scores,
                currentClass,
                teacherProfile,
            });
        } else {
            toast({
                title: 'Hata',
                description: 'Rapor oluşturmak için gerekli bilgiler yüklenemedi.',
                variant: 'destructive',
            });
        }
    };
    
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={homework.id} className="border-b-0">
                <AccordionTrigger className="p-4 border rounded-lg data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-left">
                            <p className="font-semibold">{homework.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Son Teslim: {homework.dueDate ? format(new Date(homework.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Yok'}
                            </p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <div role="button" className="inline-flex items-center justify-center p-2 rounded-md hover:bg-red-100 cursor-pointer">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bu ödevi ve tüm öğrenci teslimlerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDelete(homework.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                    <div className="space-y-4 p-4">
                        <div className="flex justify-end gap-2">
                             <Button size="sm" variant="outline" onClick={handleExport}><FileDown className="mr-2 h-4 w-4"/> Raporu İndir</Button>
                             <Button size="sm" onClick={handleSaveAll}><Save className="mr-2 h-4 w-4" /> Tümünü Kaydet</Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead>Teslimat</TableHead>
                                    {homework.rubric?.map((c: any) => <TableHead key={c.label} className="text-center">{c.label} ({c.score}P)</TableHead>)}
                                    <TableHead className="text-center">Toplam</TableHead>
                                    <TableHead>Geri Bildirim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const submission = submissions.find(s => s.studentId === student.id);
                                    const studentScores = scores[student.id] || {};
                                    const totalScore = homework.rubric?.reduce((sum, c) => sum + (Number(studentScores?.[c.label]) || 0), 0) || 0;
                                    
                                    return (
                                        <TableRow key={student.id} className={!submission ? 'bg-yellow-50/50' : ''}>
                                            <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                            <TableCell className="text-xs">
                                                {submission ? (
                                                    <>
                                                        {submission.text && <p className="whitespace-pre-wrap">{submission.text}</p>}
                                                        {submission.file && (
                                                            <a href={submission.file.dataUrl} download={submission.file.name} className="flex items-center gap-1 text-blue-600 hover:underline">
                                                                <Paperclip className="h-3 w-3" />
                                                                {submission.file.name}
                                                            </a>
                                                        )}
                                                    </>
                                                ) : "Teslim edilmedi"}
                                            </TableCell>
                                            {homework.rubric?.map((c: any) => (
                                                <TableCell key={c.label}>
                                                    <Input 
                                                        type="number" 
                                                        className="w-16 text-center mx-auto" 
                                                        value={studentScores[c.label] ?? ''} 
                                                        onChange={(e) => handleScoreChange(student.id, c.label, e.target.value)}
                                                        max={c.score}
                                                        placeholder="-"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-bold text-lg">{totalScore}</TableCell>
                                            <TableCell>
                                                <Textarea 
                                                    value={feedback[student.id] || ''}
                                                    onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                    rows={1}
                                                    className="text-xs"
                                                    placeholder="Geri bildirim..."
                                                />
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};


interface PerformanceHomeworkEvaluationTabProps {
  classId: string;
  students: Student[];
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export const PerformanceHomeworkEvaluationTab = ({ classId, students, teacherProfile, currentClass }: PerformanceHomeworkEvaluationTabProps) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const performanceHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('assignmentType', '==', 'performance'));
    }, [db, classId]);

    const { data: homeworks, isLoading } = useCollection<Homework>(performanceHomeworksQuery);
    
    const [allSubmissions, setAllSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    const sortedHomeworks = useMemo(() => {
        if (!homeworks) return [];
        return [...homeworks].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [homeworks]);

    const sortedStudents = useMemo(() => {
        if (!students) return [];
        return [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true}));
    }, [students]);
    
    const fetchSubmissions = useCallback(async () => {
        if (isLoading || !db || !classId || !homeworks || homeworks.length === 0) {
            setSubmissionsLoading(false);
            return;
        }
        setSubmissionsLoading(true);
        const subsByHomework: { [homeworkId: string]: Submission[] } = {};
        for (const hw of homeworks) {
            const subsQuery = query(collection(db, `classes/${classId}/homeworks/${hw.id}/submissions`));
            const querySnapshot = await getDocs(subsQuery);
            const subs: Submission[] = [];
            querySnapshot.forEach(doc => subs.push({ id: doc.id, ...doc.data() } as Submission));
            subsByHomework[hw.id] = subs;
        }
        setAllSubmissions(subsByHomework);
        setSubmissionsLoading(false);
    }, [homeworks, db, classId, isLoading]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleDeleteHomework = async (homeworkId: string) => {
        if (!db || !classId) return;
        try {
            const batch = writeBatch(db);
            const homeworkRef = doc(db, 'classes', classId, 'homeworks', homeworkId);

            const submissionsQuery = query(collection(db, 'classes', classId, 'homeworks', homeworkId, 'submissions'));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            submissionsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            batch.delete(homeworkRef);
            await batch.commit();
            
            toast({ 
                title: "Ödev ve tüm teslimler silindi.",
                description: "Ödevleri düzenlemek için 'Canlı Ödev Yönetimi' sekmesini kullanabilirsiniz."
            });
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "Ödev silinemedi." });
        }
    };

    if (isLoading || submissionsLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin"/>;
    
    return (
        <div className="space-y-4">
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map(hw => (
                    <PerformanceHomeworkCard
                        key={hw.id}
                        homework={hw}
                        students={sortedStudents.filter(s => hw.assignedStudents?.includes(s.id))}
                        submissions={allSubmissions[hw.id] || []}
                        classId={classId}
                        onScoresUpdated={fetchSubmissions}
                        onDelete={handleDeleteHomework}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                    />
                ))
            ) : (
                <div className="text-center p-10 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Değerlendirilecek performans ödevi bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};
