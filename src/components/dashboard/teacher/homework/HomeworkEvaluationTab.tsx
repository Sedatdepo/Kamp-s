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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';


const SubmissionStatus = ({ student, homework, submissions, classId, onMarkAsSubmitted }: { student: Student, homework: Homework, submissions: Submission[], classId: string, onMarkAsSubmitted: (studentId: string, homeworkId: string) => void }) => {
    const submission = submissions.find(s => s.studentId === student.id);

    if (submission) {
        return <Badge>Teslim Edildi</Badge>;
    }

    if (!homework.questions || homework.questions.length === 0) {
        return (
            <div className="flex items-center space-x-2">
                <Checkbox id={`mark-${student.id}-${homework.id}`} onCheckedChange={() => onMarkAsSubmitted(student.id, homework.id)} />
                <Label htmlFor={`mark-${student.id}-${homework.id}`} className="text-xs">Teslim Etti</Label>
            </div>
        );
    }
    
    return <Badge variant="secondary">Bekleniyor</Badge>;
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