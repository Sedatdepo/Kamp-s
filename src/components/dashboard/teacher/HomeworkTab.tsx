

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, HomeworkDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Atom, FileText, Video, Mic, Paperclip, CheckCircle, GraduationCap, Filter, Send, ClipboardList, X, Plus, Trash2, Save, Edit, Pencil, PlusCircle, Calendar, Users, Clock, Search, Heart, Bell, History, Printer, BarChart3, PieChart, Download } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf, exportHomeworkEvaluationToRtf } from '@/lib/word-export';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { Checkbox } from '@/components/ui/checkbox';
import { AssignSettingsModal } from './homework/AssignSettingsModal';
import { EditAssignmentModal } from './homework/EditAssignmentModal';
import { CreateAssignmentModal } from './homework/CreateAssignmentModal';
import { RubricModal } from './homework/RubricModal';
import { AddRubricModal } from './homework/AddRubricModal';
import { PrintPreviewModal } from './homework/PrintPreviewModal';
import { SuccessModal } from './homework/SuccessModal';
import { HomeworkLibrary } from './homework/HomeworkLibrary';


// --- LIVE HOMEWORK MANAGEMENT COMPONENT ---
const LiveHomeworkManagement = ({ classId, currentClass, teacherProfile, students }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[] }) => {
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
        return query(collection(db, 'classes', classId, 'homeworks'));
    }, [db, classId]);

    const { data: liveHomeworks, loading: homeworksLoading } = useFirestore<Homework[]>(`homeworks-${classId}`, liveHomeworksQuery);

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
                    // Assign to all students in the class by default for this simple form
                    assignedStudents: students.map(s => s.id),
                    seenBy: [],
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



// --- HOMEWORK EVALUATION TAB ---
const HomeworkEvaluationTab = ({ classId, students, currentClass, teacherProfile }: { classId: string, students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const [selectedHwId, setSelectedHwId] = useState<string | null>(null);
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});
    const [submissions, setSubmissions] = useState<{ [studentId: string]: Submission | null }>({});

    const homeworksQuery = useMemo(() => {
        if (!db || !classId) return null;
        // Sadece rubrik içeren (yani kütüphaneden atanmış) ödevleri getir
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '!=', null));
    }, [db, classId]);

    const { data: homeworks, loading: homeworksLoading } = useFirestore<any[]>(`performance-homeworks-${classId}`, homeworksQuery);
    
    const selectedHomework = useMemo(() => {
        if (!selectedHwId) return null;
        return homeworks.find(hw => hw.id === selectedHwId);
    }, [selectedHwId, homeworks]);
    
    const assignedStudents = useMemo(() => {
        if (!selectedHomework || !selectedHomework.assignedStudents) return [];
        return students.filter(s => selectedHomework.assignedStudents.includes(s.id));
    }, [selectedHomework, students]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedHomework) return;
            const subs: { [studentId: string]: Submission | null } = {};
            const subsQuery = query(collection(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`));
            const snapshot = await getDocs(subsQuery);
            snapshot.forEach(doc => {
                const sub = { id: doc.id, ...doc.data() } as Submission;
                subs[sub.studentId] = sub;
            });
            setSubmissions(subs);

            // Populate scores from existing submissions
            const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
            Object.values(subs).forEach(sub => {
                if (sub && sub.rubricScores) {
                    initialScores[sub.studentId] = sub.rubricScores;
                }
            });
            setScores(initialScores);
        };
        fetchSubmissions();
    }, [selectedHomework, db, classId]);


    const handleScoreChange = (studentId: string, criteriaLabel: string, value: string) => {
        const newScore = parseInt(value, 10) || 0;
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [criteriaLabel]: newScore,
            }
        }));
    };
    
    const handleToggleSubmission = async (student: Student, checked: boolean) => {
        if (!db || !selectedHomework) return;
        
        const subColRef = collection(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`);

        if (checked) {
            // Create a submission
            const newSub: Omit<Submission, 'id'> = {
                studentId: student.id,
                studentName: student.name,
                studentNumber: student.number,
                submittedAt: new Date().toISOString(),
                homeworkId: selectedHomework.id,
            };
            const docRef = await addDoc(subColRef, newSub);
            setSubmissions(prev => ({...prev, [student.id]: { id: docRef.id, ...newSub }}));
            toast({title: `${student.name} için ödev teslim edildi olarak işaretlendi.`});
        } else {
            // Delete the submission
            const submission = submissions[student.id];
            if (submission) {
                const subDocRef = doc(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`, submission.id);
                await deleteDoc(subDocRef);
                setSubmissions(prev => ({...prev, [student.id]: null}));
                toast({title: `${student.name} için teslimat iptal edildi.`, variant: 'destructive'});
            }
        }
    };
    
    const handleSaveScores = async () => {
        if (!db || !selectedHomework) return;
        const batch = writeBatch(db);

        Object.keys(scores).forEach(studentId => {
            const submission = submissions[studentId];
            if (submission) {
                const submissionRef = doc(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`, submission.id);
                const studentScores = scores[studentId];
                const totalScore = Object.values(studentScores).reduce((sum, val) => sum + val, 0);
                batch.update(submissionRef, { grade: totalScore, rubricScores: studentScores });
            }
        });
        
        try {
            await batch.commit();
            toast({ title: "Notlar başarıyla kaydedildi!" });
        } catch (error) {
             toast({ title: "Hata!", description: "Notlar kaydedilirken bir sorun oluştu.", variant: 'destructive' });
        }
    };

    const handleExport = () => {
        if (currentClass && selectedHomework) {
            exportHomeworkEvaluationToRtf({
                students: assignedStudents,
                selectedHomework,
                scores,
                currentClass,
                teacherProfile,
            });
        }
    }


    if (homeworksLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performans Ödevi Değerlendirme</CardTitle>
                <CardDescription>Atadığınız performans ödevlerini seçerek öğrencilerinizi kriterlere göre notlayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <label className="font-medium">Değerlendirilecek Ödev:</label>
                    <select 
                        value={selectedHwId || ''} 
                        onChange={e => setSelectedHwId(e.target.value)}
                        className="flex-grow p-2 border rounded-md"
                    >
                        <option value="" disabled>Bir ödev seçin...</option>
                        {homeworks.map(hw => (
                            <option key={hw.id} value={hw.id}>{hw.text}</option>
                        ))}
                    </select>
                    <Button onClick={handleExport} disabled={!selectedHomework} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        RTF Olarak İndir
                    </Button>
                </div>

                {selectedHomework && (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/4">Öğrenci</TableHead>
                                    <TableHead className="w-[120px] text-center">Teslim Durumu</TableHead>
                                    {selectedHomework.rubric.map((item: any) => (
                                        <TableHead key={item.label} className="text-center">{item.label} ({item.score}p)</TableHead>
                                    ))}
                                    <TableHead className="text-center w-[100px]">Toplam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedStudents.map(student => {
                                    const submission = submissions[student.id];
                                    const studentScores = scores[student.id] || {};
                                    const totalScore = Object.values(studentScores).reduce((sum, val) => sum + val, 0);
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={!!submission}
                                                    onCheckedChange={(checked) => handleToggleSubmission(student, !!checked)}
                                                />
                                            </TableCell>
                                            {selectedHomework.rubric.map((item: any) => (
                                                <TableCell key={item.label} className="text-center">
                                                    <Input
                                                        type="number"
                                                        max={item.score}
                                                        min={0}
                                                        disabled={!submission}
                                                        value={studentScores[item.label] || ''}
                                                        onChange={e => handleScoreChange(student.id, item.label, e.target.value)}
                                                        className="w-20 mx-auto text-center h-8"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-bold text-lg">{totalScore}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         <div className="p-4 bg-muted flex justify-end">
                            <Button onClick={handleSaveScores} disabled={Object.keys(scores).length === 0}>Değerlendirmeyi Kaydet</Button>
                        </div>
                    </div>
                )}
                 {homeworks.length === 0 && !homeworksLoading && (
                    <div className="text-center p-10 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Bu sınıfa atanmış performans ödevi bulunmuyor.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};



// --- MAIN EXPORTED COMPONENT ---
export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[], classes: Class[] }) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemo(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useFirestore<Student[]>(
        `all-students-for-teacher-${teacherProfile?.id}`,
        allStudentsForTeacherQuery
    );

    return (
        <Tabs defaultValue="live">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                <TabsTrigger value="library">Hazır Ödev Kütüphanesi</TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="mt-4">
                <LiveHomeworkManagement
                    classId={classId}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                    students={students}
                />
            </TabsContent>
            <TabsContent value="evaluation" className="mt-4">
                <HomeworkEvaluationTab
                    classId={classId}
                    students={students}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                />
            </TabsContent>
            <TabsContent value="library" className="mt-4">
                <HomeworkLibrary 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    classes={classes}
                    students={allStudents || []}
                />
            </TabsContent>
        </Tabs>
    );
}
