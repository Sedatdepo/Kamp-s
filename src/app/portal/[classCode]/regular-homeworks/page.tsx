'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework, Submission } from '@/lib/types';
import { Loader2, ArrowLeft, BookText, Send, Paperclip, Download, Clock, CalendarIcon, CheckCircle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
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

const StudentHomeworkItem = ({ homework, student, classId }: { homework: Homework, student: Student, classId: string }) => {
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

    const existingSubmission = useMemo(() => submissions?.[0], [submissions]);

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
        }
    };
    
    const handleAnswerChange = (questionId: string | number, answer: string) => {
      setAnswers(prev => ({ ...prev, [questionId as string]: answer }));
    };

    const handleSubmit = async () => {
        const hasQuestions = (homework.questions || []).length > 0;
        if (hasQuestions && homework.questions!.some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
            return;
        }

        if (!hasQuestions && !submissionText.trim() && !submissionFile) {
             toast({ variant: 'destructive', title: 'Teslimat boş olamaz.' });
            return;
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
            submissionData.answers = answers;
        }
        if (submissionText.trim()) {
            submissionData.text = submissionText;
        }
        if (submissionFile) {
            submissionData.file = submissionFile;
        }

        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            await addDoc(submissionsColRef, JSON.parse(JSON.stringify(submissionData)));

            toast({ title: "Ödev başarıyla teslim edildi!" });

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
    };

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
                    {existingSubmission.file && (
                         <Button variant="outline" size="sm" onClick={() => handleDownload(existingSubmission.file!)} className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate">{existingSubmission.file.name}</span>
                        </Button>
                    )}
                 </div>
            ) : (
                (homework.questions && homework.questions.length > 0) ? (
                    // Question form here
                     <div className="space-y-3 pt-3 border-t">
                        {homework.questions.map((q, i) => (
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
                         <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Gönder
                        </Button>
                    </div>
                ) : (
                    // Standard text/file submission
                    <div className="space-y-3 pt-3 border-t">
                        <Textarea placeholder="Cevabınızı buraya yazın..." value={submissionText} onChange={(e) => setSubmissionText(e.target.value)} rows={3} />
                        <Input type="file" onChange={handleFileChange} />
                        <Button onClick={handleSubmit} disabled={isSubmitting || (!submissionText.trim() && !submissionFile)}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Gönder
                        </Button>
                    </div>
                )
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
    
    if (!student || homeworksLoading) {
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
                         {homeworksLoading ? (
                            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                         ) : (
                            <ScrollArea className="h-[60vh] pr-2">
                                <div className="space-y-4">
                                {regularHomeworks.length > 0 ? (
                                    regularHomeworks.map((hw) => (
                                        <StudentHomeworkItem key={hw.id} homework={hw} student={student!} classId={student!.classId} />
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
