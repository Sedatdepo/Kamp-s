'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Homework, Submission, Student, Question } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle, ArrowLeft, ClipboardList, Send, Paperclip, Download } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useMemoFirebase } from '@/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveAs } from 'file-saver';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';


const ProjectDetailView = ({ projectHomework, student, onBack }: { projectHomework: Homework, student: Student, onBack: () => void }) => {
    const { db } = useAuth();

    const submissionQuery = useMemoFirebase(() => {
        if (!db || !student.classId) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks', projectHomework.id, 'submissions'),
            where('studentId', '==', student.id)
        );
    }, [db, student.classId, projectHomework.id, student.id]);
    
    const { data: submissions, isLoading: submissionLoading } = useCollection<Submission>(submissionQuery);
    const submission = useMemo(() => submissions?.[0], [submissions]);

    const rubricScores = useMemo(() => {
        return submission?.rubricScores;
    }, [submission]);

    const totalGrade = useMemo(() => {
        return submission?.grade;
    }, [submission]);

    const maxScore = useMemo(() => {
        return projectHomework.rubric?.reduce((sum: number, item: any) => sum + (Number(item.score) || 0), 0) || 100;
    }, [projectHomework.rubric]);
    
    const handleDownload = (file: {dataUrl: string, name: string}) => {
        saveAs(file.dataUrl, file.name);
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{projectHomework.text}</CardTitle>
                        <CardDescription>Projenizin detayları ve değerlendirme kriterleri aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {submission && (
                     <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 space-y-3'>
                        <h3 className="font-bold flex items-center gap-2"><CheckCircle className="text-green-600"/> Teslim Edilen Çalışma</h3>
                        {submission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md bg-white">{submission.text}</p>}
                        {submission.file && (
                             <Button variant="outline" size="sm" onClick={() => handleDownload(submission.file!)} className="flex items-center gap-2 bg-white">
                                <Paperclip className="h-4 w-4" />
                                <span className="truncate">{submission.file.name}</span>
                            </Button>
                        )}
                         {submission.feedback && (
                             <div className='bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 mt-2'>
                                 <p className='text-xs font-bold text-blue-700 mb-1'>Öğretmen Geri Bildirimi</p>
                                 <p className="text-sm">{submission.feedback}</p>
                             </div>
                        )}
                    </div>
                )}
                {projectHomework.instructions && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Proje Yönergesi</h3>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm prose">
                            <p>{projectHomework.instructions}</p>
                        </div>
                    </div>
                )}
                 {projectHomework.questions && projectHomework.questions.length > 0 && (
                     <div>
                        <h3 className="font-bold mb-2 text-lg">Proje Soruları</h3>
                        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                        {projectHomework.questions.map((q, index) => (
                             <div key={q.id}>
                                <p className="font-semibold">{index + 1}. {q.text}</p>
                                {q.image && <img src={q.image} alt={`Soru ${index+1}`} className="my-2 rounded-md border max-w-sm"/>}
                                <p className="text-xs text-muted-foreground mt-2">Cevabınız: {submission?.answers?.[q.id as string] || "Cevaplanmadı"}</p>
                             </div>
                        ))}
                        </div>
                     </div>
                 )}
                {projectHomework.rubric && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><ClipboardList/> Değerlendirme Kriterleri</h3>
                        {submissionLoading ? (
                            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kriter</TableHead>
                                            <TableHead className="text-right">Alınan Puan / Maks. Puan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectHomework.rubric.map((item: any) => {
                                            const score = rubricScores?.[item.label];
                                            const hasScore = score !== undefined && score !== null;
                                            return (
                                                <TableRow key={item.label}>
                                                    <TableCell>
                                                        <p className="font-medium">{item.label}</p>
                                                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-lg w-48">
                                                        {hasScore ? (
                                                            <span>{score} / {item.score}</span>
                                                        ) : (
                                                            <span className="text-muted-foreground font-normal">- / {item.score}</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                         <TableRow className="bg-muted/50 font-bold text-primary">
                                            <TableCell>Toplam Proje Notu</TableCell>
                                            <TableCell className="text-right text-xl">
                                                {totalGrade !== undefined && totalGrade !== null ? `${totalGrade} / ${maxScore}` : `0 / ${maxScore}`}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const HomeworkItem = ({ homework, student, classId, onSelect }: { homework: Homework, student: any, classId: string, onSelect: () => void }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<{dataUrl: string, name: string, type: string} | null>(null);
    const [answers, setAnswers] = useState<{ [key: string]: string | string[] }>({});

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'), where('studentId', '==', student.id));
    }, [db, classId, homework.id, student.id]);

    const { data: submissions, forceRefresh } = useCollection<Submission>(submissionsQuery);

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
        if (questions.length > 0 && questions.some(q => q.required && !answers[q.id])) {
            toast({ variant: 'destructive', title: 'Lütfen tüm zorunlu soruları cevaplayın.' });
            return;
        }

        if (questions.length === 0 && !submissionText.trim() && !submissionFile) {
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
          answers: answers,
        };

        if (submissionText) submissionData.text = submissionText;
        if (submissionFile) submissionData.file = submissionFile;
        
        const cleanData = JSON.parse(JSON.stringify(submissionData));

        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
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
        <div className={`border p-4 rounded-lg shadow-sm space-y-3 transition-all ${existingSubmission ? 'bg-green-50 dark:bg-green-900/20' : 'bg-background'}`}>
            <div onClick={onSelect} className="cursor-pointer hover:opacity-70">
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>
                 <h2 className="text-xl font-bold">{homework.text}</h2>
                 <p className="text-xs text-muted-foreground">(Değerlendirme kriterlerini görmek için tıklayın)</p>
            </div>

            {existingSubmission ? (
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border space-y-3'>
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
                            <Badge>Toplam Not: {existingSubmission.grade}</Badge>
                         </div>
                    )}
                </div>
            ) : questions.length > 0 ? (
                <div className="space-y-6 pt-3 border-t">
                    {questions.map((q: Question, index: number) => (
                        <div key={q.id || index} className="mb-6 pb-4 border-b">
                            <p className="font-semibold mb-3">{index + 1}. {q.text}</p>
                            {q.image && <img src={q.image} alt={`Soru ${index+1}`} className="my-2 rounded-md border max-w-sm"/>}
                            {q.type === 'multiple-choice' && q.options && (
                                <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)} className="space-y-2">
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
                                      <Checkbox id={`${q.id}-${i}`} onCheckedChange={() => handleAnswerChange(q.id, opt, true)} />
                                      <Label htmlFor={`${q.id}-${i}`}>{opt}</Label>
                                    </div>
                                  ))}
                                </div>
                            )}
                            {q.type === 'open-ended' && (
                                <Textarea placeholder="Cevabınızı buraya yazın..." onChange={(e) => handleAnswerChange(q.id, e.target.value)} />
                            )}
                        </div>
                    ))}
                    <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Gönder
                    </Button>
                </div>
            ) : (
                <div className="space-y-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
                    <Textarea 
                        placeholder="Metin cevabınızı buraya yazın..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows={2}
                    />
                    <Input
                        type="file"
                        onChange={handleFileChange}
                    />
                    <Button onClick={() => handleSubmit()} disabled={isSubmitting || (!submissionText.trim() && !submissionFile)} className="w-full">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </div>
            )}
        </div>
    )
}

export function ProjectTab() {
  const { appUser, db } = useAuth();
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  if (appUser?.type !== 'student') return null;

  const classId = appUser.data.classId;

  const homeworksQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'classes', classId, 'homeworks'), where('assignmentType', '==', 'project'), where('assignedStudents', 'array-contains', appUser.data.id));
  }, [db, classId, appUser.data.id]);

  const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

  const sortedHomeworks = useMemo(() => {
    if (!homeworks) return [];
    return [...homeworks].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
  }, [homeworks]);

  if (selectedHomework) {
    return <ProjectDetailView projectHomework={selectedHomework} student={appUser.data} onBack={() => setSelectedHomework(null)} />;
  }
  
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
            Proje Ödevim
        </CardTitle>
        <CardDescription>Size atanan proje ödevini buradan görüp teslim edebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-2">
            <div className="space-y-4">
            {sortedHomeworks.length > 0 ? (
                sortedHomeworks.map((hw) => (
                <HomeworkItem key={hw.id} homework={hw} student={appUser.data} classId={classId} onSelect={() => setSelectedHomework(hw)} />
                ))
            ) : (
                <div className="text-center py-10 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Henüz atanmış bir proje ödeviniz yok.</p>
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
