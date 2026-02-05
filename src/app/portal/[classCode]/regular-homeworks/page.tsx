'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework, Submission, Question, Badge } from '@/lib/types';
import { Loader2, ArrowLeft, BookText, Send, Paperclip, Download, Clock, CalendarIcon, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, increment, arrayUnion, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const HomeworkItem = ({ homework, student, classId, submissions }: { homework: Homework, student: Student, classId: string, submissions: Submission[] }) => {
    const { db } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{dataUrl: string, name: string, type: string} | null>(null);

    const existingSubmission = useMemo(() => {
        return submissions?.[0];
    }, [submissions]);

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

    const handleSubmit = async () => {
        const hasQuestions = (homework.questions || []).length > 0;
        
        if (hasQuestions && (homework.questions || []).some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
            return;
        }

        if (!hasQuestions && !submissionText.trim() && !submissionFile) {
             submissionData.text = "Öğrenci ödevi tamamladı olarak işaretledi.";
        }

        if (!db || !classId) return;

        setIsSubmitting(true);
        
        const submissionData: Partial<Submission> = {
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.number,
          homeworkId: homework.id,
          submittedAt: new Date().toISOString(),
        };

        if (hasQuestions) {
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
        
        if (submissionText.trim()) {
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
                if (!currentBadges.includes('2')) { // Badge ID for 'Ödev Canavarı'
                    updates.badges = arrayUnion('2');
                    toastDescription = "+10 Davranış Puanı ve 'Ödev Canavarı' rozeti kazanıldı!"
                }

                await updateDoc(studentRef, updates);
                toast({ title: "Ödev başarıyla teslim edildi!", description: toastDescription });
            } else {
                 toast({ title: "Ödev başarıyla teslim edildi!" });
            }

            setAnswers({});
            setSubmissionFile(null);
            setSubmissionText('');
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
    
    const questions = useMemo(() => homework.questions || [], [homework.questions]);

    return (
        <div className={`border p-4 rounded-lg shadow-sm space-y-3 ${existingSubmission ? 'bg-green-50' : 'bg-background'}`}>
             <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                {homework.dueDate && (
                    <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                )}
             </div>
             
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

            {existingSubmission ? (
                 <div className='bg-white p-3 rounded-md border space-y-2'>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5"/>
                        <p>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    </div>
                    {existingSubmission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md bg-muted/50">{existingSubmission.text}</p>}
                 </div>
            ) : questions.length > 0 ? (
                <div className="space-y-3 pt-3 border-t">
                    {questions.map((q, i) => (
                         <div key={q.id || i} className="p-3 bg-slate-50 rounded-md">
                            <Label className="font-semibold block mb-2">{i+1}. {q.text} {q.required && <span className="text-red-500">*</span>}</Label>
                            {q.type === 'open-ended' && <Textarea onChange={e => handleAnswerChange(q.id, e.target.value)} />}
                            {q.type === 'multiple-choice' && (
                                 <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)}>
                                    {(q.options || []).map((opt, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                            <RadioGroupItem value={opt} id={`${q.id}-${idx}`} />
                                            <Label htmlFor={`${q.id}-${idx}`}>{opt}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            )}
                         </div>
                    ))}
                     <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </div>
            ) : (
                <div className="space-y-3 pt-3 border-t">
                    <Textarea 
                        placeholder="Öğretmeninize bir not bırakın (isteğe bağlı)..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={2}
                    />
                    <Input
                        type="file"
                        onChange={handleFileChange}
                    />
                    <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </div>
            )}
        </div>
    );
};

export default function StudentRegularHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [allSubmissions, setAllSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [submissionsLoading, setSubmissionsLoading] = useState(true);
    
    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) throw new Error("Auth data not found");
            const { student: storedStudent } = JSON.parse(authData);
            if (!storedStudent) throw new Error("Student data not found in auth");
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);

    const allHomeworksQuery = useMemoFirebase(() => {
        if (!db || !student?.classId || !student?.id) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks'), 
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, student?.classId, student?.id]);
    
    const { data: allHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(allHomeworksQuery);
    
    const regularHomeworks = useMemo(() => {
        if (!allHomeworks) return [];
        return allHomeworks
            .filter(hw => !hw.assignmentType)
            .sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [allHomeworks]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!db || !student || !regularHomeworks || homeworksLoading) return;
            setSubmissionsLoading(true);
            try {
                const subsByHomework: { [homeworkId: string]: Submission[] } = {};
                for (const hw of regularHomeworks) {
                    const subQuery = query(collection(db, `classes/${student.classId}/homeworks/${hw.id}/submissions`), where('studentId', '==', student.id));
                    const querySnapshot = await getDocs(subQuery);
                    const subs: Submission[] = [];
                    querySnapshot.forEach(doc => {
                        subs.push({ id: doc.id, ...doc.data() } as Submission);
                    });
                    subsByHomework[hw.id] = subs;
                }
                setAllSubmissions(subsByHomework);
            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setSubmissionsLoading(false);
            }
        };

        if (regularHomeworks.length > 0) {
            fetchSubmissions();
        } else {
            setSubmissionsLoading(false);
        }
    }, [db, student, regularHomeworks, homeworksLoading]);
    
    if (!student || homeworksLoading || submissionsLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Günlük Ödevlerim</h1>
                        <p className="text-sm text-muted-foreground">{student?.name}</p>
                    </div>
                </div>
                 <Button asChild variant="outline">
                    <Link href={`/portal/${classCode}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Portala Geri Dön
                    </Link>
                </Button>
            </header>
            <main className="max-w-4xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookText className="h-6 w-6"/>
                            Ödevlerim
                        </CardTitle>
                        <CardDescription>Öğretmeninizin verdiği ödevleri buradan teslim edebilirsiniz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {(homeworksLoading || submissionsLoading) ? (
                            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                         ) : (
                            <ScrollArea className="h-[60vh] pr-2">
                                <div className="space-y-4">
                                {regularHomeworks.length > 0 ? (
                                    regularHomeworks.map((hw) => (
                                        <HomeworkItem 
                                            key={hw.id} 
                                            homework={hw} 
                                            student={student!} 
                                            classId={student!.classId} 
                                            submissions={allSubmissions[hw.id] || []}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Henüz verilmiş bir günlük ödev yok.</p>
                                    </div>
                                )}
                                </div>
                            </ScrollArea>
                         )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
