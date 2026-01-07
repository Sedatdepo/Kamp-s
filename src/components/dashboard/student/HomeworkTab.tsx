

"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Class, Homework, Submission, Criterion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, ClipboardList, CheckCircle } from 'lucide-react';
import { collection, doc, addDoc, query, updateDoc, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCollection, useMemoFirebase } from '@/firebase';

const HomeworkItem = ({ homework, student, classId }: { homework: Homework, student: any, classId: string }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [submissionText, setSubmissionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'));
    }, [db, classId, homework.id]);

    const { data: submissions } = useCollection<Submission>(submissionsQuery);

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
    
    return (
        <div className={`border p-4 rounded-lg shadow-sm space-y-3 ${existingSubmission ? 'bg-green-50 dark:bg-green-900/20' : 'bg-background'}`}>
            <div>
                <p className="text-sm font-semibold">{homework.text}</p>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>
            </div>

            {existingSubmission ? (
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border'>
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                        <CheckCircle className="h-5 w-5"/>
                        <p>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    </div>
                    {existingSubmission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md bg-muted/50">{existingSubmission.text}</p>}
                     {existingSubmission.feedback && (
                         <div className='bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 mt-2'>
                             <p className='text-xs font-bold text-blue-700 mb-1'>Öğretmen Geri Bildirimi</p>
                             <p className="text-sm">{existingSubmission.feedback}</p>
                         </div>
                    )}
                     {existingSubmission.grade !== undefined && (
                         <div className='flex justify-end mt-2'>
                            <Badge>Not: {existingSubmission.grade}</Badge>
                         </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

function HomeworkTabContent({ student, classId }: { student: any, classId: string }) {
    const { db } = useAuth();
    const homeworksQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      // Only get homeworks that have a rubric, which identifies them as performance homework
      return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '!=', null));
    }, [db, classId]);

    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

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
                Performans Ödevlerim
            </CardTitle>
            <CardDescription>Kütüphaneden atanan performans ödevlerinizi buradan görebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map((hw) => (
                <HomeworkItem key={hw.id} homework={hw} student={student} classId={classId} />
                ))
            ) : (
                <div className="text-center py-10 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Henüz verilmiş bir performans ödevi yok.</p>
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
