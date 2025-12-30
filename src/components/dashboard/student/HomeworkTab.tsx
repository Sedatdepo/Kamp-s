"use client";

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, User, Paperclip, Send, Download } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


const HomeworkItem = ({ homework, studentId, classId }: { homework: Homework, studentId: string, classId: string }) => {
    const { db, storage } = useAuth();
    const { toast } = useToast();
    const [submissionText, setSubmissionText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const existingSubmission = useMemo(() => {
        return homework.submissions?.find(s => s.studentId === studentId);
    }, [homework.submissions, studentId]);

    const handleSubmit = async () => {
        if (!submissionText.trim() && !file) {
            toast({ variant: 'destructive', title: 'Teslimat boş olamaz.' });
            return;
        }
        if (!db || !storage || !classId) return;

        setIsSubmitting(true);

        let fileData: Submission['file'] | undefined = undefined;

        if (file) {
            try {
                const storageRef = ref(storage, `homework_submissions/${classId}/${homework.id}/${studentId}/${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                fileData = {
                    url: downloadURL,
                    name: file.name,
                    type: file.type,
                };

            } catch (error) {
                console.error("File upload error: ", error);
                toast({ variant: "destructive", title: "Dosya Yükleme Hatası" });
                setIsSubmitting(false);
                return;
            }
        }

        const newSubmission: Submission = {
            studentId,
            submittedAt: new Date().toISOString(),
            text: submissionText,
            ...(fileData && { file: fileData }),
        };

        const classRef = doc(db, 'classes', classId);

        try {
            // Atomically update the homework item in the array
            // This requires reading the document first, updating in memory, then writing back
            const classDoc = (await getDoc(classRef)).data() as Class;
            const homeworks = classDoc.homeworks || [];
            
            const homeworkIndex = homeworks.findIndex(hw => hw.id === homework.id);
            if (homeworkIndex === -1) {
                throw new Error("Ödev bulunamadı.");
            }

            const targetHomework = homeworks[homeworkIndex];
            const updatedSubmissions = [...(targetHomework.submissions || []), newSubmission];
            
            homeworks[homeworkIndex] = {
                ...targetHomework,
                submissions: updatedSubmissions
            };

            await updateDoc(classRef, { homeworks: homeworks });

            toast({ title: "Ödev başarıyla teslim edildi!" });
            setFile(null);
            setSubmissionText('');
        } catch (error: any) {
            console.error("Submission error:", error);
            toast({ variant: "destructive", title: "Teslimat sırasında hata oluştu.", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (existingSubmission) {
        return (
             <div className="border p-4 rounded-lg bg-green-50 dark:bg-green-900/20 shadow-sm space-y-3">
                <div>
                    <p className="text-sm font-semibold">{homework.text}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMM yyyy', { locale: tr })}</span></div>
                        {homework.dueDate && <div className="flex items-center gap-1.5 font-medium text-red-600"><CalendarIcon className="h-3 w-3" /><span>Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>}
                    </div>
                </div>
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border'>
                    <p className='text-xs font-bold text-muted-foreground mb-1'>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    {existingSubmission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md">{existingSubmission.text}</p>}
                    {existingSubmission.file && (
                        <a href={existingSubmission.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 text-blue-600 hover:underline">
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate">{existingSubmission.file.name}</span>
                        </a>
                    )}
                </div>
                {existingSubmission.feedback && (
                     <div className='bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200'>
                         <p className='text-xs font-bold text-blue-700 mb-1'>Öğretmen Geri Bildirimi</p>
                         <p className="text-sm">{existingSubmission.feedback}</p>
                     </div>
                )}
                 {existingSubmission.grade !== undefined && (
                     <div className='flex justify-end'>
                        <Badge>Not: {existingSubmission.grade}</Badge>
                     </div>
                )}
            </div>
        )
    }

    return (
        <div className="border p-4 rounded-lg bg-background shadow-sm space-y-3">
            <div>
                <p className="text-sm font-semibold">{homework.text}</p>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && <div className="flex items-center gap-1.5 font-medium text-red-600"><CalendarIcon className="h-3 w-3" /><span>Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>}
                    {(homework.teacherName || homework.lessonName) && <div className="flex items-center gap-1.5 font-medium text-slate-600"><User className="h-3 w-3" /><span className="font-semibold">{homework.teacherName || ''}</span>{homework.teacherName && homework.lessonName && <span>-</span>}<span>{homework.lessonName || ''}</span></div>}
                 </div>
            </div>
            <div className='space-y-2'>
                <Textarea 
                    placeholder="Ödev cevabını buraya yaz..."
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    disabled={isSubmitting}
                />
                <div className='flex items-center justify-between gap-2'>
                    <Button variant="outline" size="sm" onClick={() => document.getElementById(`file-input-${homework.id}`)?.click()} disabled={isSubmitting}>
                        <Paperclip className="mr-2 h-4 w-4"/> Dosya Ekle
                    </Button>
                    <input type="file" id={`file-input-${homework.id}`} className="hidden" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                    {file && <span className="text-xs text-muted-foreground truncate">{file.name}</span>}
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-auto">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Gönder
                    </Button>
                </div>
            </div>
        </div>
    )
}

function HomeworkTabContent({ studentId, classId }: { studentId: string, classId: string }) {
    const { db } = useAuth();
    const classQuery = useMemo(() => doc(db, 'classes', classId), [db, classId]);
    const { data: classDataResult, loading: classLoading } = useFirestore<Class>(`class-homeworks-${classId}`, classQuery);
    const studentClass = useMemo(() => (classDataResult && classDataResult.length > 0 ? classDataResult[0] : null), [classDataResult]);

    useEffect(() => {
        if (db && studentClass && studentClass.homeworks && studentId) {
        const unseenHomeworks = studentClass.homeworks.filter(
            (hw) => !hw.seenBy?.includes(studentId)
        );

        if (unseenHomeworks.length > 0) {
            const classRef = doc(db, 'classes', studentClass.id);
            const updatedHomeworks = studentClass.homeworks.map((hw) => {
            if (!hw.seenBy?.includes(studentId)) {
                return {
                ...hw,
                seenBy: [...(hw.seenBy || []), studentId],
                };
            }
            return hw;
            });
            updateDoc(classRef, { homeworks: updatedHomeworks });
        }
        }
    }, [studentClass, studentId, db]);
    
    const homeworks = useMemo(() => {
        return [...(studentClass?.homeworks || [])].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [studentClass]);


    if (classLoading) {
        return (
        <Card>
            <CardContent className="flex justify-center items-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
        );
    }
    
    return (
        <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <BookText className="h-6 w-6"/>
                Ödevlerim
            </CardTitle>
            <CardDescription>Öğretmeninizin verdiği ödevleri buradan teslim edebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {homeworks.length > 0 ? (
                homeworks.map((hw) => (
                <HomeworkItem key={hw.id} homework={hw} studentId={studentId} classId={classId} />
                ))
            ) : (
                <div className="text-center py-10 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Henüz verilmiş bir ödev yok.</p>
                </div>
            )}
            </div>
        </CardContent>
        </Card>
    );
}

export function HomeworkTab() {
  const { appUser, loading } = useAuth();
  
  if (loading) {
    return (
        <Card>
            <CardContent className="flex justify-center items-center p-6">
                <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
        </Card>
    );
  }

  if (appUser?.type !== 'student') {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Yetki Hatası</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Bu sayfayı görüntülemek için öğrenci olarak giriş yapmalısınız.</p>
            </CardContent>
        </Card>
    );
  }

  return <HomeworkTabContent studentId={appUser.data.id} classId={appUser.data.classId} />;
}
