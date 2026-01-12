
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
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '../RecordManager';


const HomeworkEvaluationCard = ({ homework, students, submissions, classId, teacherProfile, onHomeworkDelete, onScoresUpdated }: any) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});
    const [editingHomework, setEditingHomework] = useState<any | null>(null);
    
    useEffect(() => {
        const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
        submissions.forEach((sub: Submission) => {
            if (sub && sub.rubricScores) {
                initialScores[sub.studentId] = sub.rubricScores;
            }
        });
        setScores(initialScores);
    }, [submissions]);

    const handleScoreChange = (studentId: string, criteriaLabel: string, value: string) => {
        const newScore = parseInt(value, 10) || 0;
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [criteriaLabel]: newScore,
            }
        }));
    };

    const handleSaveScores = async () => {
        if (!db) return;
        const batch = writeBatch(db);

        for (const studentId of Object.keys(scores)) {
            const student = students.find((s: Student) => s.id === studentId);
            if (!student) continue;

            const studentScores = scores[studentId];
            if (!studentScores) continue;

            let submission = submissions.find((s: Submission) => s.studentId === studentId);
            const totalScore = homework.rubric.reduce((sum: number, c: any) => sum + (Number(studentScores[c.label]) || 0), 0);

            if (submission) {
                // Update existing submission
                const submissionRef = doc(db, `classes/${classId}/homeworks/${homework.id}/submissions`, submission.id);
                batch.update(submissionRef, { grade: totalScore, rubricScores: studentScores });
            } else {
                // Create a new submission if one doesn't exist for the scored student
                const newSubmissionRef = doc(collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`));
                const newSubmissionData: Partial<Submission> = {
                    studentId: student.id,
                    studentName: student.name,
                    studentNumber: student.number,
                    homeworkId: homework.id,
                    submittedAt: new Date().toISOString(), // Mark as now since it's being graded
                    grade: totalScore,
                    rubricScores: studentScores,
                    feedback: 'Ödev teslim edilmedi, öğretmen tarafından değerlendirildi.'
                };
                batch.set(newSubmissionRef, newSubmissionData);
            }
        }

        try {
            await batch.commit();
            toast({ title: "Notlar başarıyla kaydedildi!" });
            onScoresUpdated(); // Callback to refresh data in parent
        } catch (error) {
            toast({ title: "Hata!", description: "Notlar kaydedilirken bir sorun oluştu.", variant: 'destructive' });
            console.error("Score saving error:", error);
        }
    };
    
    const handleUpdateHomework = async () => {
        if (!db || !editingHomework) return;
        const homeworkRef = doc(db, 'classes', classId, 'homeworks', homework.id);
        try {
            await updateDoc(homeworkRef, {
                text: editingHomework.text,
                dueDate: editingHomework.dueDate,
            });
            toast({ title: "Ödev güncellendi." });
            setEditingHomework(null);
        } catch (error) {
            toast({ variant: 'destructive', title: "Güncelleme hatası", description: (error as Error).message });
        }
    };

    const handleMarkAsSubmitted = async (student: Student) => {
        if (!db || !classId) return;
        
        const submissionData = {
            studentId: student.id,
            studentName: student.name,
            studentNumber: student.number,
            homeworkId: homework.id,
            submittedAt: new Date().toISOString(),
            feedback: 'Öğretmen tarafından teslim edildi olarak işaretlendi.'
        };
        try {
            await addDoc(collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`), submissionData);
            toast({ title: "Teslim Edildi", description: `${student.name} için ödev teslim edilmiş sayıldı.` });
            onScoresUpdated();
        } catch (error) {
            toast({ title: "Hata", description: "İşlem kaydedilemedi.", variant: 'destructive' });
        }
    };


    const assignedStudents = students.filter((s: Student) => homework.assignedStudents?.includes(s.id));
    const submittedCount = submissions.length;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50">
                <div className="flex justify-between items-start">
                    <div>
                         {editingHomework ? (
                            <Textarea 
                                value={editingHomework.text} 
                                onChange={(e) => setEditingHomework({ ...editingHomework, text: e.target.value })}
                                className="mb-2"
                            />
                        ) : (
                             <CardTitle>{homework.text}</CardTitle>
                        )}
                        <CardDescription className="flex items-center gap-4 mt-2 text-xs">
                             {editingHomework ? (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            size="sm"
                                            className={cn("w-[200px] justify-start text-left font-normal h-8", !editingHomework.dueDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editingHomework.dueDate ? format(new Date(editingHomework.dueDate), "PPP", { locale: tr }) : <span>Tarih seç</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={editingHomework.dueDate ? new Date(editingHomework.dueDate) : undefined}
                                            onSelect={(date) => setEditingHomework({ ...editingHomework, dueDate: date?.toISOString() })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                             ) : (
                                <span className="flex items-center gap-1.5"><CalendarIcon size={14}/> Son Teslim: {homework.dueDate ? format(new Date(homework.dueDate), 'dd MMMM yyyy', {locale: tr}) : 'Belirtilmemiş'}</span>
                             )}
                            <span className="flex items-center gap-1.5"><Users size={14}/> {submittedCount} / {assignedStudents.length} Teslim</span>
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-1">
                        {editingHomework ? (
                            <>
                                <Button size="sm" onClick={handleUpdateHomework}><Save size={16} className="mr-2"/>Kaydet</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingHomework(null)}><X size={16}/></Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingHomework(homework)}><Edit size={16}/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 size={16}/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>Bu ödevi ve tüm teslimleri kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onHomeworkDelete(homework.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <div className="p-4 max-h-[400px] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/4">Öğrenci</TableHead>
                            {homework.rubric.map((item: any) => (
                                <TableHead key={item.label} className="text-center">{item.label} ({item.score}p)</TableHead>
                            ))}
                            <TableHead className="text-center w-[100px]">Toplam</TableHead>
                             <TableHead className="text-center w-[150px]">Durum</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignedStudents.map((student: Student) => {
                            const submission = submissions.find((s: Submission) => s.studentId === student.id);
                            const studentScores = scores[student.id] || {};
                            const totalScore = homework.rubric.reduce((sum: number, c: any) => sum + (Number(studentScores[c.label]) || 0), 0);
                            return (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    {homework.rubric.map((item: any) => (
                                        <TableCell key={item.label} className="text-center">
                                            <Input
                                                type="number"
                                                max={item.score}
                                                min={0}
                                                value={studentScores[item.label] || ''}
                                                onChange={e => handleScoreChange(student.id, item.label, e.target.value)}
                                                className="w-20 mx-auto text-center h-8"
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center font-bold text-lg">{totalScore}</TableCell>
                                    <TableCell className="text-center">
                                        {submission ? (
                                            <Badge>Teslim Edildi</Badge>
                                        ) : (
                                            <Button size="sm" variant="outline" onClick={() => handleMarkAsSubmitted(student)}>
                                                <Check className="mr-1 h-3 w-3" /> Teslim Et
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
             <div className="p-4 bg-muted/50 flex justify-end border-t">
                <Button onClick={handleSaveScores} disabled={Object.keys(scores).length === 0}>Değerlendirmeyi Kaydet</Button>
            </div>
        </Card>
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

    const { data: liveHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

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
        setLocalDb(prev => ({ ...prev, homeworkStatusDocuments: (prev.homeworkStatusDocuments || []).filter(d => d.id !== selectedRecordId) }));
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
