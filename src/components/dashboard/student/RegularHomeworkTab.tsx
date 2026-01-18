
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Homework, Submission, Question, Badge as BadgeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle, Paperclip, Download, Send } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';

const HomeworkItem = ({ homework, student, classId }: { homework: Homework, student: any, classId: string }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{dataUrl: string, name: string, type: string} | null>(null);

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'), where('studentId', '==', student.id));
    }, [db, classId, homework.id, student.id]);

    const { data: submissions, forceRefresh } = useCollection<Submission>(submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.[0];
    }, [submissions]);

    // **ÇÖZÜM**: Soruların her zaman güncel homework prop'undan gelmesini garantilemek için useMemo kullanıldı.
    const questions = useMemo(() => homework.questions || [], [homework.questions]);

    const handleAnswerChange = (questionId: string | number, answer: string, isMulti: boolean = false) => {
        setAnswers(prev => {
            const currentAnswer = prev[questionId as string];
            if (isMulti) {
                const currentArr = Array.isArray(currentAnswer) ? currentAnswer : [];
                if (currentArr.includes(answer)) {
                    return { ...prev, [questionId as string]: currentArr.filter(a => a !== answer) };
                } else {
                    return { ...prev, [questionId as string]: [...currentArr, answer] };
                }
            }
            return { ...prev, [questionId as string]: answer };
        });
    };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 750 * 1024) { // ~750KB
                toast({
                    variant: "destructive",
                    title: "Dosya Boyutu Çok Büyük",
                    description: "Lütfen 750 KB'tan küçük bir dosya yükleyin.",
                });
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setSubmissionFile({
                    dataUrl: reader.result as string,
                    name: file.name,
                    type: file.type,
                });
            };
            reader.onerror = (error) => {
                console.error("File reading error:", error);
                toast({ variant: "destructive", title: "Dosya Okuma Hatası" });
            };
        }
    };

    const handleSubmit = async (isCheckboxMark: boolean = false) => {
        const hasQuestions = questions.length > 0;
        if (hasQuestions && !isCheckboxMark && questions.some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
            return;
        }

        if (!hasQuestions && !isCheckboxMark && !submissionText.trim() && !submissionFile) {
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
          answers: hasQuestions ? answers : undefined,
          text: isCheckboxMark ? "Öğrenci tarafından tamamlandı olarak işaretlendi." : (submissionText || undefined),
          file: submissionFile || undefined,
        };

        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            await addDoc(submissionsColRef, submissionData);
            
            toast({ title: "Ödev başarıyla teslim edildi!" });
            setSubmissionText('');
            setSubmissionFile(null);
            setAnswers({});
            forceRefresh();

        } catch (error: any) {
            console.error("Submission error:", error);
            toast({ variant: "destructive", title: "Teslimat sırasında hata oluştu.", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDownload = (file: {dataUrl: string, name: string}) => {
        saveAs(file.dataUrl, file.name);
    }
    
    return (
        <div className={`border p-4 rounded-lg shadow-sm space-y-3 ${existingSubmission ? 'bg-green-50 dark:bg-green-900/20' : 'bg-background'}`}>
            <div>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>
                 
                 {questions.length > 0 ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg p-4">
                            <h2 className="text-xl font-bold text-center mb-4">{homework.text}</h2>
                            {questions.map((q: Question, index: number) => (
                                <div key={q.id || index} className="mb-6 pb-4 border-b">
                                    <p className="font-semibold mb-3">{index + 1}. {q.text}</p>
                                    {q.image && <img src={q.image} alt={`Soru ${index+1}`} className="my-2 rounded-md border max-w-sm"/>}
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
                                     {q.type === 'checkbox' && q.options && (
                                        <div className="space-y-2">
                                          {q.options.map((opt, i) => (
                                            <div key={i} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`${q.id}-${i}`}
                                                onCheckedChange={() => handleAnswerChange(q.id, opt, true)}
                                                disabled={!!existingSubmission}
                                              />
                                              <Label htmlFor={`${q.id}-${i}`}>{opt}</Label>
                                            </div>
                                          ))}
                                        </div>
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
                     <div>
                        <p className="text-sm font-semibold">{homework.text}</p>
                        {homework.file && (
                            <Button variant="outline" onClick={() => handleDownload(homework.file!)} className="flex items-center gap-2 mt-2">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">{homework.file.name}</span>
                                <Download className="h-4 w-4 ml-auto" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {existingSubmission ? (
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border space-y-2'>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5"/>
                        <p>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    </div>
                    {existingSubmission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md bg-muted/50">{existingSubmission.text}</p>}
                    {existingSubmission.file && (
                         <Button variant="outline" size="sm" onClick={() => handleDownload(existingSubmission.file!)} className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate">{existingSubmission.file.name}</span>
                        </Button>
                    )}
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
            ) : questions.length > 0 ? (
                 <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ödevi Teslim Et
                 </Button>
            ) : (
                <div className="space-y-3 pt-3 border-t">
                    <Textarea 
                        placeholder="Cevabınızı buraya yazın..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={3}
                    />
                    <Input
                        type="file"
                        onChange={handleFileChange}
                    />
                    <Button onClick={() => handleSubmit(false)} disabled={isSubmitting || (!submissionText.trim() && !submissionFile)}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </div>
            )}
        </div>
    )
}

function RegularHomeworkTabContent({ student, classId }: { student: any, classId: string }) {
    const { db } = useAuth();
    
    // Fetch only homeworks that are "regular" (rubric is null or undefined)
    const regularHomeworksQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '==', null));
    }, [db, classId]);
    
    const { data: regularHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(regularHomeworksQuery);
    
    const sortedHomeworks = useMemo(() => {
        if (!regularHomeworks) return [];
        return [...regularHomeworks].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [regularHomeworks]);


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
            <ScrollArea className="h-[60vh] pr-2">
                <div className="space-y-4">
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
            </ScrollArea>
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
    
    

