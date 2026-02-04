'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Class, Homework, TeacherProfile, Student, Submission, Question, QuestionType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Save, Users, Clock, Loader2, FileText, Calendar as CalendarIcon, Check, Paperclip, XCircle, Plus, CheckSquare, AlignLeft, X, ImageIcon, ExternalLink, FileDown } from 'lucide-react';
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
import { exportHomeworkStatusToRtf, exportHomeworkDetailToRtf } from '@/lib/word-export';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


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

export const LiveHomeworkManagement = ({ classId, currentClass, teacherProfile, students }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[] }) => {
    const { toast } = useToast();
    const { db, appUser, storage } = useAuth();
  
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [link, setLink] = useState('');
    const [linkText, setLinkText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState<string | number | null>(null);
    const [questionIdForImageUpload, setQuestionIdForImageUpload] = useState<string | number | null>(null);

    const liveHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '==', null));
    }, [db, classId]);

    const { data: liveHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(liveHomeworksQuery);
    
    const [submissions, setSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    
    const fetchSubmissions = useCallback(async () => {
        if (!db || !classId || !liveHomeworks || liveHomeworks.length === 0) return;

        const newSubmissions: { [homeworkId: string]: Submission[] } = {};
        for (const hw of liveHomeworks) {
            const subsQuery = query(collection(db, 'classes', classId, 'homeworks', hw.id, 'submissions'));
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

    const handleHomeworkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.size > 750 * 1024) { // ~750KB limit
            toast({
                variant: "destructive",
                title: "Dosya Boyutu Çok Büyük",
                description: "Lütfen 750 KB'tan küçük bir dosya yükleyin. Bu yöntem daha büyük dosyaları desteklemez.",
            });
            setFile(null);
            e.target.value = ''; // Clear file input
        } else {
            setFile(selectedFile || null);
        }
    };
    
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string | number) => {
        if (!e.target.files || !storage || !appUser) return;
        const file = e.target.files[0];
        
        if (file.size > 750 * 1024) { // ~750KB
            toast({
                variant: "destructive",
                title: "Dosya Boyutu Çok Büyük",
                description: "Lütfen 750 KB'tan küçük bir dosya yükleyin.",
            });
            return;
        }

        setIsUploading(qId);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const imageRef = storageRef(storage, `exam_images/${appUser.data.uid}/${Date.now()}_${file.name}`);
            try {
              await uploadString(imageRef, dataUrl, 'data_url');
              const downloadUrl = await getDownloadURL(imageRef);
              updateQuestionField(qId, 'image', downloadUrl);
              toast({title: "Resim Yüklendi"});
            } catch(error) {
              console.error("Image upload error:", error);
              toast({variant: "destructive", title: "Yükleme Hatası"});
            } finally {
              setIsUploading(null);
            }
        };
        reader.readAsDataURL(file);
    };
    
    const handleDeleteImage = async (qId: string | number, imageUrl: string) => {
        if (!storage) return;
        try {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
            updateQuestionField(qId, 'image', null);
            toast({title: "Resim Silindi"});
        } catch(error) {
           console.error("Image delete error:", error);
           if ((error as any).code === 'storage/object-not-found') {
                updateQuestionField(qId, 'image', null);
           } else {
                toast({variant: "destructive", title: "Hata", description: "Resim silinemedi."});
           }
        }
    };


    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            id: uuidv4(),
            text: '',
            type: type,
            options: type === 'multiple-choice' ? ['', '', '', ''] : undefined,
            points: 10,
        };
        setQuestions(prev => [...prev, newQuestion]);
    };

    const updateQuestionField = (id: string | number, field: keyof Question, value: any) => {
        setQuestions(prev => prev.map(q => (q.id === id ? { ...q, [field]: value } : q)));
    };

    const deleteQuestion = (id: string | number) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };
    
    const handleAddOrUpdateHomework = async () => {
        const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : null;
        if (!db || !classId || (!text.trim() && !file && questions.length === 0) || !teacherId) {
            toast({
                variant: 'destructive',
                title: 'Eksik Bilgi',
                description: 'Lütfen bir ödev açıklaması yazın, bir dosya ekleyin veya bir soru oluşturun.',
            });
            return;
        }

        setIsProcessing(true);

        try {
            let fileData = editingHomework?.file || null;
            
            if (file) {
                 const reader = new FileReader();
                 reader.readAsDataURL(file);
                 await new Promise<void>((resolve, reject) => {
                     reader.onload = () => {
                         fileData = {
                             dataUrl: reader.result as string,
                             name: file.name,
                             type: file.type,
                         };
                         resolve();
                     };
                     reader.onerror = error => reject(error);
                 });
            }

            const homeworkData = {
                text,
                dueDate: dueDate ? dueDate.toISOString() : null,
                file: fileData,
                questions: questions,
                link: link.trim() || null,
                linkText: linkText.trim() || null,
            };

            if (editingHomework) {
                const homeworkRef = doc(db, 'classes', classId, 'homeworks', editingHomework.id);
                await updateDoc(homeworkRef, homeworkData);
                toast({ title: "Ödev güncellendi!" });
            } else {
                await addDoc(collection(db, 'classes', classId, 'homeworks'), {
                    ...homeworkData,
                    classId,
                    assignedDate: new Date().toISOString(),
                    teacherName: teacherProfile?.name || '',
                    lessonName: teacherProfile?.branch || '',
                    assignedStudents: students.map(s => s.id),
                    seenBy: [],
                    rubric: null, 
                });
                toast({ title: "Ödev eklendi!" });
            }
            
            cancelEditing();

        } catch (error) {
            console.error("Homework error:", error);
            toast({ variant: "destructive", title: "İşlem sırasında bir sorun oluştu." });
        } finally {
            setIsProcessing(false);
        }
    };


    const handleDeleteHomework = async (homework: Homework) => {
        if (!db || !classId) return;
        try {
            const batch = writeBatch(db);
            const homeworkRef = doc(db, 'classes', classId, 'homeworks', homework.id);
    
            // Query and delete all submissions in the subcollection
            const submissionsQuery = query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'));
            const submissionsSnapshot = await getDocs(submissionsQuery);
            submissionsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Delete the homework document itself
            batch.delete(homeworkRef);
            
            await batch.commit();
    
            toast({ title: "Ödev ve tüm teslimler silindi." });
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
            const submissionsColRef = collection(db, 'classes', classId, 'homeworks', homeworkId, 'submissions');
            await addDoc(submissionsColRef, submissionData);
            toast({ title: "Teslim Edildi", description: `${student.name} adlı öğrencinin ödevi teslim edildi olarak işaretlendi.` });
            fetchSubmissions(); 
        } catch (error) {
            toast({ variant: "destructive", title: "Hata", description: "İşlem kaydedilemedi." });
        }
    };


    const startEditing = (hw: Homework) => {
        setEditingHomework(hw);
        setText(hw.text);
        setFile(null); // Clear file input when starting edit
        setQuestions(hw.questions || []);
        setLink(hw.link || '');
        setLinkText(hw.linkText || '');
        if (hw.dueDate) {
            setDueDate(new Date(hw.dueDate));
        }
    };

    const cancelEditing = () => {
        setEditingHomework(null);
        setText('');
        setFile(null);
        setDueDate(undefined);
        setQuestions([]);
        setLink('');
        setLinkText('');
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

    const handleDownload = (file: {dataUrl: string, name: string}) => {
        saveAs(file.dataUrl, file.name);
    }
    
    const handleExportHomework = (homework: Homework) => {
        exportHomeworkDetailToRtf({ homework, teacherProfile, currentClass });
    }

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
                        rows={3}
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

                    <div>
                        <Label htmlFor="file-upload">Dosya Eki (Max 750KB)</Label>
                        <Input id="file-upload" type="file" onChange={handleHomeworkFileChange} className="mt-1"/>
                    </div>
                    
                    {(file || (editingHomework && editingHomework.file)) && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                            <Paperclip className="h-4 w-4"/>
                            <span className="truncate flex-1">{file?.name || editingHomework?.file?.name}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); if(editingHomework) setEditingHomework(p => ({...p!, file: undefined}))}}>
                                <XCircle className="h-4 w-4 text-red-500"/>
                            </Button>
                        </div>
                    )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="İsteğe bağlı link (https://...)" />
                        <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link metni (örn: Videoyu izle)" />
                    </div>
                    
                     <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Sorular</Label>
                        <input type="file" ref={imageInputRef} onChange={(e) => { if(questionIdForImageUpload) handleImageUpload(e, questionIdForImageUpload) }} accept="image/*" className="hidden" />
                        {questions.map((q, index) => (
                            <Card key={q.id} className="p-4 bg-slate-50">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="font-semibold text-sm">Soru {index + 1}</p>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" value={q.points || 10} onChange={e => updateQuestionField(q.id, 'points', parseInt(e.target.value) || 0)} className="w-20 h-8 text-xs text-center" />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => { setQuestionIdForImageUpload(q.id); imageInputRef.current?.click(); }} disabled={isUploading === q.id}>
                                             {isUploading === q.id ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16}/>}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteQuestion(q.id)}><Trash2 size={16}/></Button>
                                    </div>
                                </div>
                                {q.image && (
                                    <div className="relative group/image mb-2">
                                        <img src={q.image} alt="Soru görseli" className="rounded-md border max-h-48" />
                                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100" onClick={() => handleDeleteImage(q.id, q.image!)}><X size={14}/></Button>
                                    </div>
                                 )}
                                <Textarea value={q.text} onChange={e => updateQuestionField(q.id, 'text', e.target.value)} placeholder="Soru metnini yazın..."/>
                                {q.type === 'multiple-choice' && (
                                    <div className="mt-3 space-y-2">
                                        {(q.options || []).map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <Label htmlFor={`${q.id}-opt-${i}`} className='p-2 bg-slate-200 rounded-md text-xs'>{String.fromCharCode(65 + i)}</Label>
                                                <Input id={`${q.id}-opt-${i}`} value={opt} onChange={e => {
                                                    const newOptions = [...(q.options || [])];
                                                    newOptions[i] = e.target.value;
                                                    updateQuestionField(q.id, 'options', newOptions);
                                                }} />
                                                <RadioGroup value={q.correctAnswer as string} onValueChange={() => updateQuestionField(q.id, 'correctAnswer', opt)}>
                                                    <RadioGroupItem value={opt} id={`${q.id}-correct-${i}`} />
                                                </RadioGroup>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => addQuestion('multiple-choice')}>
                                <CheckSquare className="mr-2 h-4 w-4" /> Test Sorusu Ekle
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addQuestion('open-ended')}>
                                <AlignLeft className="mr-2 h-4 w-4" /> Açık Uçlu Soru Ekle
                            </Button>
                        </div>
                    </div>


                    <div className="flex gap-2">
                        {editingHomework && <Button variant="ghost" onClick={cancelEditing}>İptal</Button>}
                        <Button onClick={handleAddOrUpdateHomework} className="w-full" disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingHomework ? 'Güncelle' : 'Ekle'}
                        </Button>
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
                                    <div key={hw.id} className="border rounded-lg bg-white shadow-sm">
                                        <div className="flex items-start p-4">
                                            <div className="flex-1 space-y-2">
                                                <p className="font-semibold">{hw.text}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Son Teslim: {hw.dueDate ? format(new Date(hw.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                    {hw.file && <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => handleDownload(hw.file!)}><Paperclip className="h-3 w-3 mr-1"/>{hw.file.name}</Button>}
                                                    {hw.link && <a href={hw.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><ExternalLink className="h-3 w-3"/>{hw.linkText || 'İlgili Bağlantı'}</a>}
                                                </div>
                                            </div>
                                            <div className="flex items-center ml-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportHomework(hw)}><FileDown className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(hw)}><Edit className="h-4 w-4"/></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                            <AlertDialogDescription>Bu ödevi ve tüm teslimleri kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>İptal</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteHomework(hw)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value={`content-${hw.id}`} className="border-t">
                                                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline text-muted-foreground">
                                                    {submissions[hw.id]?.length || 0} / {students.length} Teslim (Görüntüle)
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-0 p-4">
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Öğrenci</TableHead><TableHead>Teslim Durumu</TableHead></TableRow></TableHeader>
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
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
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
