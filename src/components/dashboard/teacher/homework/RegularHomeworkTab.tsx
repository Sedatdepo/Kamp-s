'use client';

import { useMemo, useState, useEffect } from 'react';
import { Homework, Submission, Question, Student, Badge as BadgeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle, Paperclip, Download, Send } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';

export const HomeworkItem = ({ homework, student, classId }: { homework: Homework, student: Student, classId: string }) => {
    const { db } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{dataUrl: string, name: string, type: string} | null>(null);

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'), where('studentId', '==', student.id));
    }, [db, classId, homework.id, student.id]);

    const { data: submissions } = useCollection<Submission>(submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.[0];
    }, [submissions]);
    
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
        };

        if(hasQuestions) {
            const sanitizedAnswers: { [key: string]: string | string[] } = {};
            for (const key in answers) {
                if (Object.prototype.hasOwnProperty.call(answers, key) && answers[key] !== undefined) {
                    sanitizedAnswers[key] = answers[key];
                }
            }
             if (Object.keys(sanitizedAnswers).length > 0) {
               submissionData.answers = sanitizedAnswers;
            }
        }

        if(isCheckboxMark) {
            submissionData.text = "Öğrenci tarafından tamamlandı olarak işaretlendi.";
        } else if (submissionText.trim()) {
            submissionData.text = submissionText;
        }
        
        if(submissionFile) {
            submissionData.file = submissionFile;
        }

        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            const cleanData = JSON.parse(JSON.stringify(submissionData));
            await addDoc(submissionsColRef, cleanData);
            
            const isLate = homework.dueDate && new Date() > new Date(homework.dueDate);
            if (!isLate) {
                const studentRef = doc(db, 'students', student.id);
                const currentBadges: string[] = student.badges || [];
                
                const updates: any = { behaviorScore: increment(10) };
                
                let toastDescription = "+10 Davranış Puanı kazanıldı!";
                if (!currentBadges.includes('hw-master')) {
                    updates.badges = arrayUnion('hw-master');
                    toastDescription = "+10 Davranış Puanı ve 'Ödev Ustası' rozeti kazanıldı!"
                }

                await updateDoc(studentRef, updates);
                toast({ title: "Ödev başarıyla teslim edildi!", description: toastDescription });
            } else {
                 toast({ title: "Ödev başarıyla teslim edildi!" });
            }

            setSubmissionText('');
            setSubmissionFile(null);
            setAnswers({});
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
