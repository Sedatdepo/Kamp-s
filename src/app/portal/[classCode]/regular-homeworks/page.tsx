'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework, Submission, Question, Badge } from '@/lib/types';
import { Loader2, ArrowLeft, BookText, Send, Paperclip, Download, Clock, CalendarIcon, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, increment, arrayUnion, collectionGroup, getDocs, onSnapshot } from 'firebase/firestore';
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
import { User } from 'firebase/auth';
import { Header } from '@/components/dashboard/Header';

export const HomeworkItem = ({ homework, student, authUser, classId }: { homework: Homework, student: Student, authUser: User | null, classId: string }) => {
    const { firestore: db } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{dataUrl: string, name: string, type: string} | null>(null);

    const submissionsQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(
            collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'),
            where('studentId', '==', student.id)
        );
    }, [db, classId, homework.id, student.id]);

    const { data: submissions } = useCollection<Submission>(submissionsQuery);

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
        
        // Soru varsa ve zorunlu olan cevaplanmamışsa hata ver.
        if (hasQuestions && (homework.questions || []).some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
            return;
        }

        // Soru yoksa, metin veya dosya da yoksa, yine de gönderime izin ver.
        if (!hasQuestions && !submissionText.trim() && !submissionFile) {
            // Boş gönderim, "tamamlandı" olarak işaretlemek anlamına gelir.
        }

        if (!db || !classId || !authUser) return;

        setIsSubmitting(true);
        
        const submissionData: Partial<Submission> = {
          studentId: student.id,
          studentAuthUid: authUser.uid,
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
        } else if (!hasQuestions && !submissionFile) {
            submissionData.text = "Öğrenci ödevi tamamladı olarak işaretledi.";
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
                const currentBadges: string[] = student.badges?.map(b => b.badgeId) || [];
                
                const updates: any = { behaviorScore: increment(10) };
                
                let toastDescription = "+10 Davranış Puanı kazanıldı!";
                if (!currentBadges.includes('2')) { // Badge ID for 'Ödev Canavarı'
                    const newBadge = {
                        id: `badge_${Date.now()}`,
                        badgeId: '2',
                        name: 'Ödev Canavarı',
                        icon: '⚡',
                        dateAwarded: new Date().toISOString()
                    };
                    updates.badges = arrayUnion(newBadge);
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
                {(homework.file || homework.link) && (
                    <div className="flex flex-col space-y-2 mt-2">
                        {homework.file && (
                            <Button variant="outline" onClick={() => handleDownload(homework.file!)} className="flex items-center gap-2 justify-start w-full">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">{homework.file.name}</span>
                                <Download className="h-4 w-4 ml-auto" />
                            </Button>
                        )}
                        {homework.link && (
                            <a href={homework.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 rounded-md hover:bg-blue-50">
                                <ExternalLink className="h-4 w-4" />
                                <span>{homework.linkText || homework.link}</span>
                            </a>
                        )}
                    </div>
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
                            {q.type === 'open-ended' && <Textarea onChange={e => handleAnswerChange(q.id, e.target.value)} />}
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
    const { firestore: db, user: authUser, isUserLoading: authLoading } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    
    useEffect(() => {
        const authData = sessionStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setStudent(storedStudent);
            } catch (e) {
                console.error("Failed to parse student auth data", e);
            }
        }
    }, []);

    useEffect(() => {
        if (authLoading || !student?.id || !db) return;

        const studentRef = doc(db, 'students', student.id);
        const unsubscribe = onSnapshot(studentRef, (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on regular homeworks page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, authLoading]);

    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !student?.classId) return null;
        return query(collection(db, 'classes', student.classId, 'homeworks'), where('assignmentType', '==', 'regular'));
    }, [db, student?.classId]);

    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);
    
    const regularHomeworks = useMemo(() => {
        if (!homeworks) return [];
        return [...homeworks].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [homeworks]);
    
    if (authLoading || !student || homeworksLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Günlük Ödevlerim</h1>
                        <p className="text-sm text-muted-foreground">{student?.name}</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href={`/portal/${classCode}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Portala Geri Dön
                        </Link>
                    </Button>
                </div>
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
                            {regularHomeworks.length > 0 ? (
                                regularHomeworks.map((hw) => (
                                    <HomeworkItem 
                                        key={hw.id} 
                                        homework={hw} 
                                        student={student!} 
                                        authUser={authUser}
                                        classId={student!.classId} 
                                    />
                                ))
                            ) : (
                                <div className="text-center py-10 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">Henüz verilmiş bir günlük ödev yok.</p>
                                </div>
                            )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
