'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile, Submission, Homework, HomeworkStatusDocument } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Edit, Trash2, Calendar as CalendarIcon, Users, Save, X, Check, FileText } from 'lucide-react';
import { collection, query, where, doc, updateDoc, writeBatch, getDocs, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '../RecordManager';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';


const HomeworkEvaluationCard = ({ homework, students, submissions, classId, teacherProfile, onHomeworkDelete, onScoresUpdated }: { homework: Homework, students: Student[], submissions: Submission[], classId: string, teacherProfile: TeacherProfile | null, onHomeworkDelete: (id: string) => void, onScoresUpdated: () => void }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});
    const [feedback, setFeedback] = useState<{ [studentId: string]: string }>({});

    // Initialize state from existing submissions
    useEffect(() => {
        const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
        const initialFeedback: { [studentId: string]: string } = {};
        students.forEach(student => {
            const submission = submissions.find(s => s.studentId === student.id);
            if (submission) {
                initialScores[student.id] = submission.rubricScores || {};
                initialFeedback[student.id] = submission.feedback || '';
            }
        });
        setScores(initialScores);
        setFeedback(initialFeedback);
    }, [submissions, students]);

    const handleScoreChange = (studentId: string, criteriaId: string, value: string) => {
        const newScore = parseInt(value, 10);
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [criteriaId]: isNaN(newScore) ? 0 : newScore,
            },
        }));
    };
    
    const handleFeedbackChange = (studentId: string, value: string) => {
        setFeedback(prev => ({ ...prev, [studentId]: value }));
    };

    const handleSaveAll = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        students.forEach(student => {
            const submission = submissions.find(s => s.studentId === student.id);
            if (submission) {
                const subRef = doc(db, 'classes', classId, 'homeworks', homework.id, 'submissions', submission.id);
                const studentScores = scores[student.id];
                const studentFeedback = feedback[student.id];
                
                const totalScore = homework.rubric?.reduce((sum, c) => sum + (Number(studentScores?.[c.label]) || 0), 0) || 0;
                
                const updates: any = {};
                if (studentScores !== submission.rubricScores) updates.rubricScores = studentScores;
                if (studentFeedback !== submission.feedback) updates.feedback = studentFeedback;
                updates.grade = totalScore;
                
                if (Object.keys(updates).length > 1) { // Only update if there are changes
                    batch.update(subRef, updates);
                }
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Değerlendirmeler kaydedildi.' });
            onScoresUpdated(); // Callback to refresh data in parent
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata!', description: 'Değerlendirmeler kaydedilemedi.' });
        }
    };
    
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={homework.id}>
                <AccordionTrigger>
                    <div>
                        <p className="font-semibold text-left">{homework.text}</p>
                        <p className="text-xs text-muted-foreground text-left">
                            Son Teslim: {homework.dueDate ? format(new Date(homework.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Yok'}
                        </p>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="flex justify-end gap-2">
                             <Button size="sm" onClick={handleSaveAll}><Save className="mr-2 h-4 w-4" /> Tümünü Kaydet</Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Ödevi Sil</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu ödevi ve tüm teslimleri silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onHomeworkDelete(homework.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Öğrenci</TableHead>
                                    {homework.rubric?.map((c: any) => <TableHead key={c.label} className="text-center">{c.label} ({c.score}P)</TableHead>)}
                                    <TableHead className="text-center">Toplam</TableHead>
                                    <TableHead>Geri Bildirim</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const submission = submissions.find(s => s.studentId === student.id);
                                    if (!submission) return null;
                                    const studentScores = scores[student.id] || {};
                                    const totalScore = homework.rubric?.reduce((sum, c) => sum + (Number(studentScores?.[c.label]) || 0), 0) || 0;
                                    
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            {homework.rubric?.map((c: any) => (
                                                <TableCell key={c.label}>
                                                    <Input 
                                                        type="number" 
                                                        className="w-16 text-center mx-auto" 
                                                        value={studentScores[c.label] || ''} 
                                                        onChange={(e) => handleScoreChange(student.id, c.label, e.target.value)}
                                                        max={c.score}
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


export const HomeworkEvaluationTab = ({ classId, students, currentClass, teacherProfile }: { classId: string, students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const { db: localDb, setDb: setLocalDb, loading: localDbLoading } = useDatabase();
    const { homeworkStatusDocuments = [] } = localDb;

    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '!=', null));
    }, [db, classId]);

    const { data: liveHomeworks, isLoading: homeworksLoading, forceRefresh } = useCollection<Homework>(homeworksQuery);
    
    const [allSubmissions, setAllSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    const fetchSubmissions = useCallback(async () => {
        if (homeworksLoading || !db || !classId || !liveHomeworks || liveHomeworks.length === 0) {
            setSubmissionsLoading(false);
            return;
        }
        setSubmissionsLoading(true);
        const subsByHomework: { [homeworkId: string]: Submission[] } = {};
        for (const hw of liveHomeworks) {
            const subsQuery = query(collection(db, `classes/${classId}/homeworks/${hw.id}/submissions`));
            const querySnapshot = await getDocs(subsQuery);
            const subs: Submission[] = [];
            querySnapshot.forEach(doc => {
                subs.push({ id: doc.id, ...doc.data() } as Submission);
            });
            subsByHomework[hw.id] = subs;
        }
        setAllSubmissions(subsByHomework);
        setSubmissionsLoading(false);
    }, [liveHomeworks, db, classId, homeworksLoading]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const displayedData = useMemo(() => {
        if (selectedRecordId) {
            const record = homeworkStatusDocuments.find(d => d.id === selectedRecordId);
            if (record) {
                const subsByHw: { [homeworkId: string]: Submission[] } = {};
                record.data.homeworks.forEach(hw => {
                    subsByHw[hw.id] = record.data.submissions.filter(s => s.homeworkId === hw.id);
                });
                return {
                    homeworks: record.data.homeworks,
                    submissions: subsByHw,
                };
            }
        }
        return {
            homeworks: liveHomeworks,
            submissions: allSubmissions,
        };
    }, [selectedRecordId, homeworkStatusDocuments, liveHomeworks, allSubmissions]);
    
    const handleHomeworkDelete = async (homeworkId: string) => {
        if (!db) return;
        const homeworkRef = doc(db, 'classes', classId, 'homeworks', homeworkId);
        try {
            await deleteDoc(homeworkRef);
            toast({ title: "Ödev silindi." });
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "Ödev silinemedi." });
        }
    }

    const handleScoresUpdated = () => {
        fetchSubmissions();
    }
    
    const handleSaveToArchive = () => {
        if (!currentClass || !liveHomeworks) return;

        const newRecord: HomeworkStatusDocument = {
            id: `hw_status_${Date.now()}`,
            name: `Ödev Durumu - ${new Date().toLocaleDateString('tr-TR')}`,
            date: new Date().toISOString(),
            classId: currentClass.id,
            data: { 
                homeworks: liveHomeworks,
                submissions: Object.values(allSubmissions).flat()
            },
        };

        setLocalDb(prev => ({ ...prev, homeworkStatusDocuments: [...(prev.homeworkStatusDocuments || []), newRecord] }));
        toast({ title: 'Arşivlendi', description: 'Ödev durumu arşive kaydedildi.' });
    };

    const handleNewRecord = useCallback(() => setSelectedRecordId(null), []);
    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({ ...prev, homeworkStatusDocuments: (prev.homeworkStatusDocuments || []).filter(d => d.id !== selectedRecordId)}));
        handleNewRecord();
        toast({ title: 'Kayıt Silindi', variant: 'destructive' });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);


    if (homeworksLoading || submissionsLoading || localDbLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             <div className="lg:col-span-1">
                 <RecordManager
                    records={(homeworkStatusDocuments || []).filter(d => d.classId === classId)}
                    selectedRecordId={selectedRecordId}
                    onSelectRecord={setSelectedRecordId}
                    onNewRecord={handleNewRecord}
                    onDeleteRecord={handleDeleteRecord}
                    noun="Ödev Durumu"
                />
                 <Button onClick={handleSaveToArchive} className="w-full mt-4" disabled={!!selectedRecordId}>
                    <Save className="mr-2 h-4 w-4" /> Mevcut Durumu Arşivle
                </Button>
            </div>
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Performans Ödevi Değerlendirme</CardTitle>
                        <CardDescription>Atadığınız performans ödevlerini yönetin ve öğrencilerinizi kriterlere göre notlayın.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {displayedData.homeworks && displayedData.homeworks.length > 0 ? (
                            displayedData.homeworks.map(hw => (
                                <HomeworkEvaluationCard
                                    key={hw.id}
                                    homework={hw}
                                    students={students}
                                    submissions={displayedData.submissions[hw.id] || []}
                                    classId={classId}
                                    teacherProfile={teacherProfile}
                                    onHomeworkDelete={handleHomeworkDelete}
                                    onScoresUpdated={handleScoresUpdated}
                                />
                            ))
                        ) : (
                            <div className="text-center p-10 bg-muted/50 rounded-lg">
                                <p className="text-muted-foreground">Bu sınıfa atanmış performans ödevi bulunmuyor.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
