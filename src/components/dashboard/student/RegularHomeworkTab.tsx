
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Homework, Submission, Question, Exam, Badge as BadgeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ExamPaper } from '../teacher/ExamPaper';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';

const HomeworkItem = ({ homework, student, classId }: { homework: Homework, student: any, classId: string }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'));
    }, [db, classId, homework.id]);

    const { data: submissions, forceRefresh } = useCollection<Submission>(submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.find(s => s.studentId === student.id);
    }, [submissions, student.id]);

    const handleAnswerChange = (questionId: string | number, answer: string) => {
        setAnswers(prev => ({...prev, [questionId]: answer }));
    }

    const handleSubmit = async (isCheckboxMark: boolean = false) => {
        if (homework.questions && homework.questions.length > 0 && !isCheckboxMark && homework.questions.some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
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
          answers: answers,
          text: isCheckboxMark ? "Öğrenci tarafından tamamlandı olarak işaretlendi." : undefined,
        };
    
        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            await addDoc(submissionsColRef, submissionData);
            
            const isLate = homework.dueDate && new Date() > new Date(homework.dueDate);
            if (!isLate) {
                const studentRef = doc(db, 'students', student.id);
                // The 'badges' field needs to be of type BadgeType[] to satisfy the type.
                const currentBadges: BadgeType[] = (student.badges || []).map((b: any) => typeof b === 'string' ? { id: b, name: 'Bilinmeyen', description: '', icon: ''} : b);
                
                const updates: any = { xp: increment(10) };
                
                if (!currentBadges.some(b => b.id === 'hw-master')) {
                    const newBadge: BadgeType = {
                        id: 'hw-master',
                        name: 'Ödev Ustası',
                        description: 'Bir ödevi zamanında teslim etti.',
                        icon: 'BookCheck',
                        dateAwarded: new Date().toISOString(),
                    };
                    updates.badges = [...currentBadges, newBadge];
                }

                // await updateDoc(studentRef, updates);
                toast({ title: "Ödev başarıyla teslim edildi!", description: "+10 XP ve 'Ödev Ustası' rozeti kazanıldı!" });
            } else {
                 toast({ title: "Ödev başarıyla teslim edildi!" });
            }
            forceRefresh();

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
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>
                 
                 {homework.questions && homework.questions.length > 0 ? (
                    <div className="space-y-6">
                         <div className="bg-white rounded-lg shadow-md p-4">
                            <h2 className="text-2xl font-bold text-center mb-4">{homework.text}</h2>
                            {homework.questions.map((q: Question, index: number) => (
                                <div key={q.id || index} className="mb-6 pb-4 border-b">
                                    <p className="font-semibold mb-3">{index + 1}. {q.text}</p>
                                    {q.type === 'multiple-choice' && q.options && (
                                        <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)} disabled={!!existingSubmission} className="space-y-2">
                                            {q.options.map((opt, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <RadioGroupItem value={opt} id={`${q.id}-${i}`} />
                                                    <Label htmlFor={`${q.id}-${i}`}>{opt}</Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    )}
                                    {q.type === 'open-ended' && (
                                        <Textarea 
                                            placeholder="Cevabınızı buraya yazın..."
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            disabled={!!existingSubmission}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm font-semibold">{homework.text}</p>
                )}
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
            ) : homework.questions && homework.questions.length > 0 ? (
                 <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ödevi Teslim Et
                 </Button>
            ) : (
                <div className="flex items-center space-x-2">
                    <Checkbox id={`hw-done-${homework.id}`} onCheckedChange={() => handleSubmit(true)} disabled={isSubmitting} />
                    <Label htmlFor={`hw-done-${homework.id}`} className="text-sm font-medium">Bu ödevi tamamladım olarak işaretle.</Label>
                </div>
            )}
        </div>
    )
}

function RegularHomeworkTabContent({ student, classId }: { student: any, classId: string }) {
    const { db } = useAuth();
    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        // Only get homeworks that DO NOT have a rubric (i.e., regular/live homeworks)
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '==', null));
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

export function RegularHomeworkTab() {
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

  return <RegularHomeworkTabContent student={appUser.data} classId={appUser.data.classId} />;
}
