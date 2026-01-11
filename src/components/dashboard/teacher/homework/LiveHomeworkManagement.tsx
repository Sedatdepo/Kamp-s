'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Class, Homework, TeacherProfile, Student, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Save, Users, Clock, Loader2, FileText, Calendar as CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase } from '@/firebase';
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
                <Checkbox id={`mark-${student.id}`} onCheckedChange={() => onMarkAsSubmitted(student.id, homework.id)} />
                <Label htmlFor={`mark-${student.id}`} className="text-xs">Teslim Etti</Label>
            </div>
        );
    }
    
    return <Badge variant="secondary">Bekleniyor</Badge>;
};

export const LiveHomeworkManagement = ({ classId, currentClass, teacherProfile, students }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[] }) => {
    const { toast } = useToast();
    const { db } = useAuth();
  
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});

    const liveHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '==', null));
    }, [db, classId]);

    const { data: liveHomeworks, isLoading: homeworksLoading, forceRefresh } = useCollection<Homework>(liveHomeworksQuery);
    
    const fetchSubmissions = useCallback(async () => {
        if (!db || !classId || !liveHomeworks || liveHomeworks.length === 0) return;

        const newSubmissions: { [homeworkId: string]: Submission[] } = {};
        for (const hw of liveHomeworks) {
            const subsQuery = query(collection(db, `classes/${classId}/homeworks/${hw.id}/submissions`));
            const querySnapshot = await getDocs(subsQuery);
            const subs: Submission[] = [];
            querySnapshot.forEach(doc => {
                subs.push({ id: doc.id, ...doc.data() } as Submission);
            });
            newSubmissions[hw.id] = subs;
        }
        setSubmissions(newSubmissions);
    }, [liveHomeworks, db, classId]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);
    
    const handleAddOrUpdateHomework = async () => {
        if (!db || !classId || !text.trim()) return;

        try {
            if (editingHomework) {
                const homeworkRef = doc(db, 'classes', classId, 'homeworks', editingHomework.id);
                await updateDoc(homeworkRef, {
                    text: text,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                });
                toast({ title: "Ödev güncellendi!" });
            } else {
                await addDoc(collection(db, 'classes', classId, 'homeworks'), {
                    classId,
                    text,
                    assignedDate: new Date().toISOString(),
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    teacherName: teacherProfile?.name,
                    lessonName: teacherProfile?.branch,
                    assignedStudents: students.map(s => s.id),
                    seenBy: [],
                    rubric: null, 
                });
                toast({ title: "Ödev eklendi!" });
            }
            setText('');
            setDueDate(undefined);
            setEditingHomework(null);
            // forceRefresh(); // This would be ideal if useCollection supported it.
        } catch (error) {
            console.error("Homework error:", error);
            toast({ variant: "destructive", title: "İşlem sırasında bir sorun oluştu." });
        }
    };

    const handleDeleteHomework = async (id: string) => {
        if (!db || !classId) return;
        try {
            const subsSnapshot = await getDocs(collection(db, `classes/${classId}/homeworks/${id}/submissions`));
            const batch = writeBatch(db);
            subsSnapshot.forEach(doc => batch.delete(doc.ref));
            const homeworkRef = doc(db, 'classes', classId, 'homeworks', id);
            batch.delete(homeworkRef);
            await batch.commit();
            toast({ title: "Ödev ve tüm teslimler silindi." });
            // forceRefresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "Ödev silinemedi." });
        }
    };
    
    const handleMarkAsSubmitted = async (studentId: string, homeworkId: string) => {
        if (!db || !classId) return;
        
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const submissionData = {
            studentId: student.id,
            studentName: student.name,
            studentNumber: student.number,
            homeworkId: homeworkId,
            submittedAt: new Date().toISOString(),
            text: "Öğretmen tarafından teslim edildi olarak işaretlendi.",
        };
        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homeworkId}/submissions`);
            await addDoc(submissionsColRef, submissionData);
            toast({ title: "Teslim Edildi", description: `${student.name} adlı öğrencinin ödevi teslim edildi olarak işaretlendi.` });
            fetchSubmissions(); // Re-fetch to update the UI
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "İşlem kaydedilemedi." });
        }
    };


    const startEditing = (hw: Homework) => {
        setEditingHomework(hw);
        setText(hw.text);
        if (hw.dueDate) {
            setDueDate(new Date(hw.dueDate));
        }
    };

    const cancelEditing = () => {
        setEditingHomework(null);
        setText('');
        setDueDate(undefined);
    };

    const handleExport = () => {
        if (currentClass) {
            exportHomeworkStatusToRtf({
                students,
                homeworks: liveHomeworks ?? [],
                submissions: Object.values(submissions).flat(),
                currentClass,
                teacherProfile
            });
        }
    };
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{editingHomework ? 'Ödevi Düzenle' : 'Yeni Ödev Ekle'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ödev açıklamasını buraya yazın..."
                        rows={5}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP", { locale: tr }) : <span>Son teslim tarihi seçin</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                        {editingHomework && <Button variant="ghost" onClick={cancelEditing}>İptal</Button>}
                        <Button onClick={handleAddOrUpdateHomework} className="w-full">{editingHomework ? 'Güncelle' : 'Ekle'}</Button>
                    </div>
                </CardContent>
            </Card>
            <Button onClick={handleExport} variant="outline" className="w-full mt-4">
                <FileText className="mr-2 h-4 w-4"/> Raporu İndir
            </Button>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Ödev Listesi ve Teslim Durumu</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[70vh]">
                        {homeworksLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                            <div className="space-y-4">
                                {liveHomeworks && liveHomeworks.length > 0 ? liveHomeworks.map(hw => (
                                    <Accordion key={hw.id} type="single" collapsible>
                                        <AccordionItem value={hw.id} className="border rounded-lg p-4">
                                            <AccordionTrigger>
                                                <div className="flex flex-col text-left">
                                                    <p className="font-semibold">{hw.text}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Son Teslim: {hw.dueDate ? format(new Date(hw.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                                                    </p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-4">
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-sm font-medium">{(submissions[hw.id] || []).length}/{students.length} öğrenci teslim etti.</p>
                                                    <div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(hw)}><Edit className="h-4 w-4"/></Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                                    <AlertDialogDescription>Bu ödevi ve tüm teslimleri kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDeleteHomework(hw.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                                <Table>
                                                    <TableHeader><TableRow><TableHead>Öğrenci</TableHead><TableHead>Teslim Durumu</TableHead><TableHead>Not</TableHead></TableRow></TableHeader>
                                                    <TableBody>
                                                        {students.map(student => (
                                                            <TableRow key={student.id}>
                                                                <TableCell>{student.name}</TableCell>
                                                                <TableCell>
                                                                     <SubmissionStatus 
                                                                        student={student} 
                                                                        homework={hw}
                                                                        submissions={submissions[hw.id] || []}
                                                                        classId={classId}
                                                                        onMarkAsSubmitted={handleMarkAsSubmitted}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{(submissions[hw.id] || []).find(s => s.studentId === student.id)?.grade ?? 'N/A'}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )) : <p className="text-center text-muted-foreground py-4">Henüz ödev eklenmemiş.</p>}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    );
};
