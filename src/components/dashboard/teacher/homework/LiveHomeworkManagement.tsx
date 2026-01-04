'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, HomeworkDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Save, Calendar, Users, Clock, Loader2, FileText } from 'lucide-react';
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
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '../RecordManager';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export const LiveHomeworkManagement = ({ classId, currentClass, teacherProfile, students }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[] }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const { db: localDb, setDb: setLocalDb } = useDatabase();
    const { homeworkDocuments = [] } = localDb;
  
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const liveHomeworksQuery = useMemo(() => {
        if (!db || !classId) return null;
        // Only get homeworks that DO NOT have a rubric (i.e., regular/live homeworks)
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '==', null));
    }, [db, classId]);

    const { data: liveHomeworks, loading: homeworksLoading } = useFirestore<Homework[]>(`live-homeworks-${classId}`, liveHomeworksQuery);

    const displayedHomeworks = useMemo(() => {
        if (selectedRecordId) {
            const record = homeworkDocuments.find(d => d.id === selectedRecordId);
            return record ? record.data.homeworks : [];
        }
        return liveHomeworks ?? [];
    }, [selectedRecordId, homeworkDocuments, liveHomeworks]);

    const displayedSubmissions = useMemo(() => {
        if (selectedRecordId) {
            const record = homeworkDocuments.find(d => d.id === selectedRecordId);
            const subsByHwId: { [homeworkId: string]: Submission[] } = {};
            if(record) {
                for (const sub of record.data.submissions) {
                    if(!subsByHwId[sub.homeworkId as string]) {
                        subsByHwId[sub.homeworkId as string] = [];
                    }
                    subsByHwId[sub.homeworkId as string].push(sub);
                }
            }
            return subsByHwId;
        }
        return submissions;
    }, [selectedRecordId, homeworkDocuments, submissions]);

    useEffect(() => {
        if (homeworksLoading || !db || !classId || !liveHomeworks) return;

        const fetchSubmissions = async () => {
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
        };

        fetchSubmissions();
    }, [liveHomeworks, homeworksLoading, db, classId]);
    
    const handleSaveToArchive = async () => {
        if (!currentClass) return;
        const allSubmissions: Submission[] = Object.values(submissions).flat();

        const newRecord: HomeworkDocument = {
            id: `hw_${Date.now()}`,
            name: `Ödevler - ${new Date().toLocaleDateString('tr-TR')}`,
            date: new Date().toISOString(),
            classId: currentClass.id,
            data: {
                homeworks: liveHomeworks ?? [],
                submissions: allSubmissions
            },
        };
        
        setLocalDb(prevDb => ({
            ...prevDb,
            homeworkDocuments: [...(prevDb.homeworkDocuments || []), newRecord],
        }));
        toast({ title: 'Kaydedildi', description: 'Mevcut ödevler ve teslimler arşive başarıyla kaydedildi.' });
    };

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
    }, []);

    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prevDb => ({
            ...prevDb,
            homeworkDocuments: (prevDb.homeworkDocuments || []).filter(d => d.id !== selectedRecordId),
        }));
        handleNewRecord();
        toast({ title: "Silindi", description: "Ödev kaydı arşivden silindi.", variant: "destructive" });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);


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
                    rubric: null, // Explicitly set to null for live homeworks
                });
                toast({ title: "Ödev eklendi!" });
            }
            setText('');
            setDueDate(undefined);
            setEditingHomework(null);
        } catch (error) {
            console.error("Homework error:", error);
            toast({ variant: "destructive", title: "Hata", description: "İşlem sırasında bir sorun oluştu." });
        }
    };

    const handleDeleteHomework = async (id: string) => {
        if (!db || !classId) return;
        const homeworkRef = doc(db, 'classes', classId, 'homeworks', id);
        await deleteDoc(homeworkRef);
        toast({ title: "Ödev silindi." });
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
        <div className="lg:col-span-1 space-y-6">
           <RecordManager
                records={(homeworkDocuments || []).filter(d => d.classId === classId).map(r => ({ id: r.id, name: r.name }))}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Ödev Kaydı"
            />
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
                                <Calendar className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP", { locale: tr }) : <span>Son teslim tarihi seçin</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <CalendarPicker
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
            <div className='flex items-center gap-2'>
                <Button onClick={handleSaveToArchive} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" /> Canlı Veriyi Arşive Kaydet
                </Button>
                <Button onClick={handleExport} variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4"/> Raporu İndir
                </Button>
            </div>
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
                                {displayedHomeworks.length > 0 ? displayedHomeworks.map(hw => {
                                    const assignedStudentIds = (hw as any).assignedStudents || [];
                                    const submittedCount = (displayedSubmissions[hw.id] || []).length;
                                    const studentCount = assignedStudentIds.length;
                                    const relevantStudents = students.filter(s => assignedStudentIds.includes(s.id));
                                    
                                    return (
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
                                                        <p className="text-sm font-medium">{submittedCount}/{studentCount} öğrenci teslim etti.</p>
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
                                                            {relevantStudents.map(student => {
                                                                const submission = (displayedSubmissions[hw.id] || []).find(s => s.studentId === student.id);
                                                                return (
                                                                    <TableRow key={student.id}>
                                                                        <TableCell>{student.name}</TableCell>
                                                                        <TableCell>
                                                                            {submission ? <Badge>Teslim Edildi</Badge> : <Badge variant="secondary">Bekleniyor</Badge>}
                                                                        </TableCell>
                                                                        <TableCell>{submission?.grade ?? 'N/A'}</TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    );
                                }) : <p className="text-center text-muted-foreground py-4">Henüz ödev eklenmemiş.</p>}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    );
};
