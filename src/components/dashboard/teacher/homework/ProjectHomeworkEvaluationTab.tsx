'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Submission, Homework, TeacherProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Trash2, Paperclip } from 'lucide-react';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCollection, useMemoFirebase } from '@/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ProjectHomeworkCard = ({ homework, students, submissions, classId, onScoresUpdated }: { homework: Homework, students: Student[], submissions: Submission[], classId: string, onScoresUpdated: () => void }) => {
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

            } else if (hasDataToSave) {
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
    
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={homework.id}>
                <AccordionTrigger className="p-4 border rounded-lg data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                    <div className="text-left">
                        <p className="font-semibold">{homework.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Son Teslim: {homework.dueDate ? format(new Date(homework.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Yok'}
                        </p>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="border border-t-0 rounded-b-lg p-0">
                    <div className="space-y-4 p-4">
                        <div className="flex justify-end gap-2">
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
                                            <TableCell className="font-medium">{student.name}</TableCell>
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


interface ProjectHomeworkEvaluationTabProps {
  classId: string;
  students: Student[];
  teacherProfile: TeacherProfile | null;
}

export const ProjectHomeworkEvaluationTab = ({ classId, students, teacherProfile }: ProjectHomeworkEvaluationTabProps) => {
    const { db } = useAuth();
    const projectHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('assignmentType', '==', 'project'));
    }, [db, classId]);

    const { data: homeworks, isLoading } = useCollection<Homework>(projectHomeworksQuery);
    
    const [allSubmissions, setAllSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

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

    if (isLoading || submissionsLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />;

    const sortedHomeworks = [...(homeworks || [])].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());

    return (
        <div className="space-y-4">
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map(hw => (
                    <ProjectHomeworkCard
                        key={hw.id}
                        homework={hw}
                        students={students.filter(s => hw.assignedStudents?.includes(s.id))}
                        submissions={allSubmissions[hw.id] || []}
                        classId={classId}
                        onScoresUpdated={fetchSubmissions}
                    />
                ))
            ) : (
                <div className="text-center p-10 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Değerlendirilecek proje ödevi bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};
