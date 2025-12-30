
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, Submission } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, User, Paperclip, Send, Download } from 'lucide-react';
import { collection, doc, addDoc, query, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const HomeworkItem = ({ homework, student, classId }: { homework: Homework, student: any, classId: string }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [submissionText, setSubmissionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submissionsQuery = useMemo(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'));
    }, [db, classId, homework.id]);

    const { data: submissions } = useFirestore<Submission>(`submissions-for-homework-${homework.id}`, submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.find(s => s.studentId === student.id);
    }, [submissions, student.id]);

    const handleSubmit = async () => {
        if (!submissionText.trim()) {
            toast({ variant: 'destructive', title: 'Teslimat boş olamaz.' });
            return;
        }
        if (!db || !classId) return;

        setIsSubmitting(true);
        
        const submissionData: any = {
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.number,
          homeworkId: homework.id,
          submittedAt: new Date().toISOString(),
          text: submissionText || null,
        };
    
        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            await addDoc(submissionsColRef, submissionData);
            toast({ title: "Ödev başarıyla teslim edildi!" });
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
                <div className='flex items-center justify-end gap-2'>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-auto">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                        Gönder
                    </Button>
                </div>
            </div>
        </div>
    )
}

function HomeworkTabContent({ student, classId }: { student: any, classId: string }) {
    const { db } = useAuth();
    const homeworksQuery = useMemo(() => (db ? query(collection(db, 'classes', classId, 'homeworks')) : null), [db, classId]);
    const { data: homeworks, loading: homeworksLoading } = useFirestore<Homework>(`homeworks-for-class-${classId}`, homeworksQuery);

    const sortedHomeworks = useMemo(() => {
        if (!homeworks) return [];
        return [...homeworks].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [homeworks]);

    if (homeworksLoading) {
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
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map((hw) => (
                <HomeworkItem key={hw.id} homework={hw} student={student} classId={classId} />
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

  return <HomeworkTabContent student={appUser.data} classId={appUser.data.classId} />;
}
