
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, HomeworkDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Send, Plus, Trash2, CalendarIcon, Clock, FileText, Search, Library, CheckCircle, XCircle, File, ChevronDown, Save } from 'lucide-react';
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
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { assignmentsData } from '@/lib/maarif-modeli-odevleri';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';


const branchToSubjectMap: { [key: string]: string } = {
    "Türk Dili ve Edebiyatı": "literature",
    "Fizik": "physics",
};

const HomeworkManager = ({ classId, teacherProfile, students, currentClass, liveHomeworks, liveSubmissions, liveHomeworksLoading, liveSubmissionsLoading, onSelectHomework }: { classId: string, teacherProfile: TeacherProfile | null, students: Student[], currentClass: Class | null, liveHomeworks: Homework[], liveSubmissions: Submission[], liveHomeworksLoading: boolean, liveSubmissionsLoading: boolean, onSelectHomework: (hw: Homework | null) => void; }) => {
    const [homeworkText, setHomeworkText] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const { toast } = useToast();
    const { db } = useAuth();

    const sortedHomeworks = useMemo(() => {
        return [...(liveHomeworks || [])].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [liveHomeworks]);

    const handleAddHomework = async () => {
        if (!db || !classId) return;
        if (!homeworkText.trim()) {
            toast({ variant: 'destructive', title: 'Ödev metni boş olamaz.' });
            return;
        }

        const newHomework: Omit<Homework, 'id'> = {
            classId: classId,
            text: homeworkText,
            assignedDate: new Date().toISOString(),
            dueDate: dueDate ? dueDate.toISOString() : undefined,
            teacherName: teacherProfile?.name,
            lessonName: teacherProfile?.branch,
            seenBy: [],
        };

        try {
            const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
            await addDoc(homeworksColRef, newHomework);
            setHomeworkText('');
            setDueDate(undefined);
            toast({ title: 'Ödev gönderildi!' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Ödev gönderilemedi.' });
        }
    };

    const handleDeleteHomework = async (homeworkId: string) => {
        if (!db || !classId) return;
        try {
            // First delete all submissions in the homework
            const submissionsQuery = query(collection(db, 'classes', classId, 'homeworks', homeworkId, 'submissions'));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const batch = writeBatch(db);
            submissionsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // Then delete the homework itself
            const homeworkRef = doc(db, 'classes', classId, 'homeworks', homeworkId);
            await deleteDoc(homeworkRef);

            toast({ title: 'Ödev ve tüm teslimatlar silindi.' });
            onSelectHomework(null); // Reset selected homework
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Ödev silinemedi.' });
        }
    };
    
    const handleExport = () => {
        if (!db || !currentClass || !teacherProfile || !liveHomeworks) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için gerekli veriler eksik.' });
            return;
        }
        exportHomeworkStatusToRtf({
            students,
            homeworks: liveHomeworks,
            submissions: liveSubmissions,
            currentClass,
            teacherProfile
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <Plus className="h-6 w-6" />
                            Yeni Ödev Gönder
                        </CardTitle>
                        <CardDescription>Bu sınıftaki tüm öğrencilere gönderilecek bir ödev oluşturun.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={homeworkText}
                            onChange={(e) => setHomeworkText(e.target.value)}
                            placeholder="Ödev açıklamasını buraya yazın veya hazır bir şablon seçin..."
                            rows={5}
                        />
                         <div className="flex flex-col sm:flex-row gap-2">
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
                                    {dueDate ? format(dueDate, "PPP", { locale: tr }) : <span>Teslim tarihi seçin</span>}
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
                            <Button onClick={handleAddHomework} className="w-full">
                                <Send className="mr-2 h-4 w-4"/>
                                Gönder
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline">Geçmiş Ödevler</CardTitle>
                                <CardDescription>İncelemek için bir ödev seçin.</CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleExport} disabled={!liveHomeworks || liveHomeworks.length === 0}>
                                <FileText className="mr-2 h-4 w-4"/>
                                Raporu Dışa Aktar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64 pr-4">
                            {liveHomeworksLoading ? <Loader2 className="mx-auto animate-spin" /> : (
                                sortedHomeworks && sortedHomeworks.length > 0 ? (
                                    <Accordion type="single" collapsible onValueChange={(value) => onSelectHomework(liveHomeworks.find(hw => hw.id === value) || null)}>
                                        {sortedHomeworks.map((hw) => (
                                             <AccordionItem value={hw.id} key={hw.id}>
                                                <div className='flex items-center group'>
                                                    <AccordionTrigger className="flex-1 p-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-left">{hw.text}</p>
                                                            <p className="text-xs text-muted-foreground text-left mt-1">Veriliş: {format(new Date(hw.assignedDate), 'd MMMM yyyy', { locale: tr })}</p>
                                                            {hw.dueDate && <p className="text-xs text-red-600 font-semibold mt-1 text-left">Son Teslim: {format(new Date(hw.dueDate), 'd MMMM yyyy', { locale: tr })}</p>}
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500/70 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                                <AlertDialogDescription>Bu ödevi silmek istediğinize emin misiniz? Öğrenci teslimatları da dahil tüm veriler silinecektir. Bu işlem geri alınamaz.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteHomework(hw.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                                <AccordionContent>
                                                    {/* The table will now be rendered outside */}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <p className="text-center text-sm text-muted-foreground py-4">Henüz gönderilmiş bir ödev yok.</p>
                                )
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const HomeworkSubmissionsTable = ({ homework, students, submissions, loading, classId }: { homework: Homework, students: Student[], submissions: Submission[], loading: boolean, classId: string }) => {
    const { db } = useAuth();
    const { toast } = useToast();

    const [submissionsState, setSubmissionsState] = useState<{ [key: string]: Partial<Submission> }>({});

    const handleSetStatus = async (student: Student, done: boolean) => {
        if (!db) return;

        const existingSubmission = submissions?.find(s => s.studentId === student.id);

        if (done && !existingSubmission) {
            const submissionData: Partial<Submission> = {
                studentId: student.id, studentName: student.name, studentNumber: student.number,
                homeworkId: homework.id, submittedAt: new Date().toISOString(), text: "Öğretmen tarafından 'yapıldı' olarak işaretlendi.",
            };
            try {
                const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
                await addDoc(submissionsColRef, submissionData);
                toast({ title: `${student.name} için ödev 'yapıldı' olarak işaretlendi.` });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Hata", description: error.message });
            }
        } else if (!done && existingSubmission) {
            try {
                const subDocRef = doc(db, 'classes', classId, 'homeworks', homework.id, 'submissions', existingSubmission.id);
                await deleteDoc(subDocRef);
                toast({ title: `${student.name} için ödev 'yapılmadı' olarak işaretlendi.` });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Hata", description: error.message });
            }
        }
    };

    const handleFieldChange = (subId: string, field: 'grade' | 'feedback', value: string | number) => {
        setSubmissionsState(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
    };
    
    const handleSaveFeedback = async (hwId: string, subId: string) => {
        if (!classId || !db) return;
        const subRef = doc(db, 'classes', classId, 'homeworks', hwId, 'submissions', subId);
        const localChanges = submissionsState[subId];
        if (!localChanges) return;

        try {
            await updateDoc(subRef, localChanges);
            toast({ title: 'Değerlendirme kaydedildi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Değerlendirme kaydedilemedi.' });
        }
    };

    if (loading) {
        return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Ödev Teslim Durumları: {homework.text}</CardTitle>
                <CardDescription>Aşağıdaki listeden öğrencilerin teslim durumlarını takip edebilir ve manuel olarak işaretleyebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">No</TableHead>
                            <TableHead>Adı Soyadı</TableHead>
                            <TableHead className="w-[150px]">Durum</TableHead>
                             <TableHead>Teslimat</TableHead>
                            <TableHead className="w-[300px]">Değerlendirme</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map(student => {
                            const submission = submissions.find(s => s.studentId === student.id);
                            const hasSubmitted = !!submission;

                            return (
                                <TableRow key={student.id}>
                                    <TableCell>{student.number}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                        {hasSubmitted ? (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                <CheckCircle className="mr-1 h-3 w-3"/> Teslim Edildi
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <XCircle className="mr-1 h-3 w-3"/> Bekleniyor
                                            </Badge>
                                        )}
                                        <Button size="xs" variant="outline" className="text-green-600 border-green-200" onClick={() => handleSetStatus(student, true)} disabled={hasSubmitted}>+</Button>
                                        <Button size="xs" variant="outline" className="text-red-600 border-red-200" onClick={() => handleSetStatus(student, false)} disabled={!hasSubmitted}>-</Button>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {submission?.text}
                                    </TableCell>
                                    <TableCell>
                                        {submission && (
                                            <div className="flex gap-2">
                                                <Textarea placeholder="Geri bildirim..." defaultValue={submission.feedback} onChange={(e) => handleFieldChange(submission.id, 'feedback', e.target.value)} rows={1} className="text-xs" />
                                                <div className="flex flex-col gap-1">
                                                    <Input type="number" placeholder="Not" defaultValue={submission.grade} onChange={(e) => handleFieldChange(submission.id, 'grade', Number(e.target.value))} className="h-8 w-16 text-center" />
                                                    <Button size="xs" onClick={() => handleSaveFeedback(homework.id, submission.id)} disabled={!submissionsState[submission.id]}>Kaydet</Button>
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

function HomeworkLibrary({ onSelect }: { onSelect: (text: string) => void }) {
    const { teacherProfile, currentClass } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
  
    const initialGradeFilter = useMemo(() => {
        const gradeMatch = currentClass?.name.match(/\d+/);
        return gradeMatch ? parseInt(gradeMatch[0], 10) : null;
    }, [currentClass]);
  
    const initialSubjectFilter = useMemo(() => {
        return teacherProfile?.branch ? branchToSubjectMap[teacherProfile.branch] || null : null;
    }, [teacherProfile]);
    
    const [gradeFilter, setGradeFilter] = useState<number | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

    useEffect(() => {
        setGradeFilter(initialGradeFilter);
        setSubjectFilter(initialSubjectFilter);
    }, [initialGradeFilter, initialSubjectFilter]);


    const filteredAssignments = useMemo(() => {
        let filtered = assignmentsData;
        if (gradeFilter) {
        filtered = filtered.filter(a => a.grade === gradeFilter);
        }
        if (subjectFilter) {
        filtered = filtered.filter(a => a.subject === subjectFilter);
        }
        if (searchTerm) {
        filtered = filtered.filter(
            (a) =>
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        }
        return filtered;
    }, [searchTerm, gradeFilter, subjectFilter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Maarif Modeli Ödev Kütüphanesi</CardTitle>
                <CardDescription>Aşağıdaki filtreleri kullanarak ödevleri aratın veya tüm ödevlere göz atın. Seçtiğiniz ödevi göndermek için üzerine tıklayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Ödev başlığında ara..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button variant={gradeFilter ? "secondary" : "outline"} onClick={() => setGradeFilter(gradeFilter ? null : initialGradeFilter)}>
                            {gradeFilter ? `${gradeFilter}. Sınıflar` : 'Tüm Sınıflar'}
                        </Button>
                        <Button variant={subjectFilter ? "secondary" : "outline"} onClick={() => setSubjectFilter(subjectFilter ? null : initialSubjectFilter)}>
                            {subjectFilter ? teacherProfile?.branch : 'Tüm Dersler'}
                        </Button>
                    </div>
                </div>
                <ScrollArea className="h-[60vh] mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAssignments.map(a => (
                            <Card key={a.id} className="cursor-pointer hover:border-primary" onClick={() => {
                                const fullText = `Başlık: ${a.title}\n\nAçıklama: ${a.description}\n\nYapılacaklar: ${a.instructions}`;
                                onSelect(fullText);
                            }}>
                                <CardHeader>
                                    <CardTitle className="text-base">{a.title}</CardTitle>
                                    <div className="flex gap-2 text-xs pt-2">
                                        <Badge variant="outline">{a.grade}. Sınıf</Badge>
                                    </div>
                                    <CardDescription className="pt-2">{a.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                        {filteredAssignments.length === 0 && <p className="text-muted-foreground text-center col-span-full py-8">Bu filtrelerle eşleşen ödev bulunamadı.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

interface HomeworkTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}

export function HomeworkTab({ classId, teacherProfile, students, currentClass }: HomeworkTabProps) {
  const { toast } = useToast();
  const { db: firestoreDb } = useAuth();
  const { db: localDb, setDb: setLocalDb, loading: dbLoading } = useDatabase();
  const { homeworkDocuments = [] } = localDb;
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Live Data
  const liveHomeworksQuery = useMemo(() => currentClass ? query(collection(firestoreDb, 'classes', currentClass.id, 'homeworks')) : null, [currentClass, firestoreDb]);
  const { data: liveHomeworks, loading: liveHomeworksLoading } = useFirestore<Homework>(`homeworks-for-class-${currentClass?.id}`, liveHomeworksQuery);
  const [liveSubmissions, setLiveSubmissions] = useState<Submission[]>([]);
  const [liveSubmissionsLoading, setLiveSubmissionsLoading] = useState(true);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
        if (!firestoreDb || !currentClass || liveHomeworksLoading || liveHomeworks.length === 0) {
            if (!liveHomeworksLoading) setLiveSubmissionsLoading(false);
            return;
        }
        setLiveSubmissionsLoading(true);
        try {
            const submissionsPromises = liveHomeworks.map(hw => getDocs(collection(firestoreDb, 'classes', currentClass.id, 'homeworks', hw.id, 'submissions')));
            const submissionsSnapshots = await Promise.all(submissionsPromises);
            const fetchedSubmissions: Submission[] = submissionsSnapshots.flatMap(snapshot =>
                snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission))
            );
            setLiveSubmissions(fetchedSubmissions);
        } catch (e) {
            console.error("Error fetching all submissions", e);
        } finally {
            setLiveSubmissionsLoading(false);
        }
    };
    fetchAllSubmissions();
  }, [liveHomeworks, liveHomeworksLoading, currentClass, firestoreDb]);

  const { displayedHomeworks, displayedSubmissions } = useMemo(() => {
    if (selectedRecordId) {
        const record = homeworkDocuments.find(doc => doc.id === selectedRecordId);
        return {
            displayedHomeworks: record?.data.homeworks || [],
            displayedSubmissions: record?.data.submissions || []
        };
    }
    return {
        displayedHomeworks: liveHomeworks,
        displayedSubmissions: liveSubmissions
    };
  }, [selectedRecordId, homeworkDocuments, liveHomeworks, liveSubmissions]);

  const handleSaveToArchive = () => {
      if (!currentClass) return;
      const newRecord: HomeworkDocument = {
          id: `hw_${Date.now()}`,
          name: `Ödev Arşivi - ${new Date().toLocaleDateString('tr-TR')}`,
          date: new Date().toISOString(),
          classId: currentClass.id,
          data: {
              homeworks: liveHomeworks,
              submissions: liveSubmissions
          },
      };
      setLocalDb(prevDb => ({ ...prevDb, homeworkDocuments: [...(prevDb.homeworkDocuments || []), newRecord] }));
      toast({ title: 'Arşivlendi', description: 'Mevcut ödev durumu arşive kaydedildi.' });
  };
  
  const handleNewRecord = useCallback(() => setSelectedRecordId(null), []);
  const handleDeleteRecord = useCallback(() => {
      if (!selectedRecordId) return;
      setLocalDb(prevDb => ({ ...prevDb, homeworkDocuments: (prevDb.homeworkDocuments || []).filter(d => d.id !== selectedRecordId) }));
      handleNewRecord();
      toast({ title: 'Arşiv kaydı silindi', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);
  
  return (
    <Tabs defaultValue="manager">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manager"><BookOpen className="mr-2 h-4 w-4" />Ödev Yönetimi</TabsTrigger>
        <TabsTrigger value="library"><Library className="mr-2 h-4 w-4" />Hazır Ödev Kütüphanesi</TabsTrigger>
      </TabsList>
      <TabsContent value="manager" className="mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <HomeworkManager 
                    classId={classId} 
                    teacherProfile={teacherProfile} 
                    students={students} 
                    currentClass={currentClass} 
                    liveHomeworks={liveHomeworks}
                    liveSubmissions={liveSubmissions}
                    liveHomeworksLoading={liveHomeworksLoading}
                    liveSubmissionsLoading={liveSubmissionsLoading}
                    onSelectHomework={setSelectedHomework}
                />
                 {selectedHomework && (
                    <HomeworkSubmissionsTable
                        homework={selectedHomework}
                        students={students}
                        submissions={displayedSubmissions.filter(s => s.homeworkId === selectedHomework.id)}
                        loading={selectedRecordId ? dbLoading : liveSubmissionsLoading}
                        classId={classId}
                    />
                )}
            </div>
            <div className="lg:col-span-1 space-y-4">
                <RecordManager 
                    records={homeworkDocuments.filter(d => d.classId === classId).map(r => ({ id: r.id, name: r.name }))}
                    selectedRecordId={selectedRecordId}
                    onSelectRecord={setSelectedRecordId}
                    onNewRecord={handleNewRecord}
                    onDeleteRecord={handleDeleteRecord}
                    noun="Ödev Arşivi"
                />
                 <Button onClick={handleSaveToArchive} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" /> Canlı Veriyi Arşive Kaydet
                </Button>
            </div>
        </div>
      </TabsContent>
      <TabsContent value="library" className="mt-4">
        <HomeworkLibrary onSelect={(text) => {
            toast({ title: "Ödev metni panoya kopyalandı.", description: "Ödev Yönetimi sekmesine giderek metni yapıştırabilirsiniz." });
            navigator.clipboard.writeText(text);
        }} />
      </TabsContent>
    </Tabs>
  );
}
