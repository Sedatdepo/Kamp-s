'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Submission, Homework } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Paperclip } from 'lucide-react';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCollection, useMemoFirebase } from '@/firebase';

const RegularHomeworkCard = ({ homework, students, submissions, classId, onScoresUpdated }: { homework: Homework, students: Student[], submissions: Submission[], classId: string, onScoresUpdated: () => void }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [localSubmissions, setLocalSubmissions] = useState<{ [submissionId: string]: Partial<Submission> }>({});

    useEffect(() => {
        const initialSubmissions: { [submissionId: string]: Partial<Submission> } = {};
        submissions.forEach(sub => {
            initialSubmissions[sub.id] = { grade: sub.grade, feedback: sub.feedback };
        });
        setLocalSubmissions(initialSubmissions);
    }, [submissions]);

    const handleFieldChange = (subId: string, field: 'grade' | 'feedback', value: string | number) => {
        setLocalSubmissions(prev => ({
            ...prev,
            [subId]: {
                ...prev[subId],
                [field]: value
            }
        }));
    };

    const handleSaveAll = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        submissions.forEach(sub => {
            const localChanges = localSubmissions[sub.id];
            if (localChanges) {
                const originalSub = submissions.find(s => s.id === sub.id) || {};
                const updates: { [key: string]: any } = {};

                const localGrade = localChanges.grade === undefined ? null : localChanges.grade;
                const originalGrade = originalSub.grade === undefined ? null : originalSub.grade;

                if (localGrade !== originalGrade) {
                    updates.grade = localGrade;
                }
                if (localChanges.feedback !== originalSub.feedback) {
                    updates.feedback = localChanges.feedback || '';
                }

                if (Object.keys(updates).length > 0) {
                    const subRef = doc(db, 'classes', classId, 'homeworks', homework.id, 'submissions', sub.id);
                    batch.update(subRef, updates);
                }
            }
        });
        try {
            await batch.commit();
            toast({ title: 'Değerlendirmeler kaydedildi.' });
            onScoresUpdated();
        } catch (error) {
            console.error('Save all error:', error);
            toast({ variant: 'destructive', title: 'Hata!', description: 'Değerlendirmeler kaydedilemedi.' });
        }
    };
    
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={homework.id}>
                <AccordionTrigger className="p-4 border rounded-lg data-[state=open]:rounded-b-none data-[state=open]:border-b-0">
                    <div className="text-left">
                        <p className="font-semibold">{homework.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Veriliş: {format(new Date(homework.assignedDate), 'dd MMMM yyyy', { locale: tr })}
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
                                    <TableHead className="w-24">Not</TableHead>
                                    <TableHead>Geri Bildirim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const submission = submissions.find(s => s.studentId === student.id);
                                    if (!submission) return null;
                                    
                                    const localGrade = localSubmissions[submission.id]?.grade;
                                    const localFeedback = localSubmissions[submission.id]?.feedback;
                                    
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                            <TableCell className="text-xs">
                                                 {submission.text && <p className="whitespace-pre-wrap">{submission.text}</p>}
                                                 {submission.file && (
                                                     <a href={submission.file.dataUrl} download={submission.file.name} className="flex items-center gap-1 text-blue-600 hover:underline">
                                                         <Paperclip className="h-3 w-3" />
                                                         {submission.file.name}
                                                     </a>
                                                 )}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={localGrade ?? ''}
                                                    onChange={(e) => handleFieldChange(submission.id, 'grade', parseInt(e.target.value) || 0)}
                                                    className="w-20 text-center h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Textarea
                                                    value={localFeedback ?? ''}
                                                    onChange={(e) => handleFieldChange(submission.id, 'feedback', e.target.value)}
                                                    rows={1}
                                                    className="text-xs"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         {submissions.length === 0 && <p className="text-center text-sm text-muted-foreground p-4">Bu ödeve henüz teslimat yapılmamış.</p>}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

interface RegularHomeworkEvaluationTabProps {
  classId: string;
  students: Student[];
}

export const RegularHomeworkEvaluationTab = ({ classId, students }: RegularHomeworkEvaluationTabProps) => {
    const { db } = useAuth();

    const regularHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('assignmentType', '==', 'regular'));
    }, [db, classId]);

    const { data: homeworks, isLoading } = useCollection<Homework>(regularHomeworksQuery);
    
    const [submissions, setSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    const fetchSubmissions = useCallback(async () => {
        if (isLoading || !db || !classId || !homeworks || homeworks.length === 0) {
            setSubmissionsLoading(false);
            return;
        }
        setSubmissionsLoading(true);
        const subsByHomework: { [homeworkId: string]: Submission[] } = {};
        for (const hw of homeworks) {
            const subsQuery = query(collection(db, 'classes', classId, 'homeworks', hw.id, 'submissions'));
            const querySnapshot = await getDocs(subsQuery);
            const subs: Submission[] = [];
            querySnapshot.forEach(doc => subs.push({ id: doc.id, ...doc.data() } as Submission));
            subsByHomework[hw.id] = subs;
        }
        setSubmissions(subsByHomework);
        setSubmissionsLoading(false);
    }, [homeworks, db, classId, isLoading]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    if (isLoading || submissionsLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />;
    
    const sortedHomeworks = [...(homeworks || [])].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    const sortedStudents = useMemo(() => [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true})), [students]);

    return (
        <div className="space-y-4">
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map(hw => (
                    <RegularHomeworkCard
                        key={hw.id}
                        homework={hw}
                        students={sortedStudents}
                        submissions={submissions[hw.id] || []}
                        classId={classId}
                        onScoresUpdated={fetchSubmissions}
                    />
                ))
            ) : (
                <div className="text-center p-10 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Değerlendirilecek ödev bulunmuyor.</p>
                </div>
            )}
        </div>
    );
};
