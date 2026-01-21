
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Homework, Submission, Question, Badge as BadgeType, Student } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle, ArrowLeft, ClipboardList } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useMemoFirebase } from '@/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';


const HomeworkDetailView = ({ homework, student, onBack }: { homework: Homework, student: Student, onBack: () => void }) => {
    const { db } = useAuth();

    const submissionQuery = useMemoFirebase(() => {
        if (!db || !student.classId || homework.assignmentType === 'project') return null; // Don't fetch for projects, scores are on student doc
        return query(
            collection(db, 'classes', student.classId, 'homeworks', homework.id, 'submissions'),
            where('studentId', '==', student.id)
        );
    }, [db, student.classId, homework.id, student.id, homework.assignmentType]);
    
    const { data: submissions, isLoading: submissionLoading } = useCollection<Submission>(submissionQuery);

    const rubricScores = useMemo(() => {
        if (homework.assignmentType === 'project') {
            // Project scores are on the student doc
            return student.term2Grades?.projectScores || student.term1Grades?.projectScores;
        }
        // Performance scores are on the submission doc
        return submissions?.[0]?.rubricScores;
    }, [homework.assignmentType, student, submissions]);

    const totalGrade = useMemo(() => {
        if (homework.assignmentType === 'project') {
            if (!rubricScores) return null;
            return Object.values(rubricScores).reduce((sum, score) => sum + (Number(score) || 0), 0);
        }
        return submissions?.[0]?.grade;
    }, [homework.assignmentType, rubricScores, submissions]);

    const maxScore = useMemo(() => {
        return homework.rubric?.reduce((sum: number, item: any) => sum + (Number(item.score) || 0), 0) || 100;
    }, [homework.rubric]);


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{homework.text}</CardTitle>
                        <CardDescription>Ödevin detayları ve değerlendirme kriterleri aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {homework.instructions && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Yönerge</h3>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm prose">
                            <p>{homework.instructions}</p>
                        </div>
                    </div>
                )}
                {homework.rubric && (
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
                                        {homework.rubric.map((item: any) => {
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
                                            <TableCell>Toplam Not</TableCell>
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
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      // PERFORMANS İYİLEŞTİRMESİ: Tüm teslimler yerine sadece bu öğrencinin teslimini sorgula.
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'), where('studentId', '==', student.id));
    }, [db, classId, homework.id, student.id]);

    const { data: submissions } = useCollection<Submission>(submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.[0];
    }, [submissions]);

    const handleAnswerChange = (questionId: string | number, answer: string) => {
        setAnswers(prev => ({...prev, [questionId]: answer }));
    }

    const handleSubmit = async () => {
        if (homework.questions && homework.questions.some(q => q.required && !answers[q.id])) {
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
        };
    
        try {
            const submissionsColRef = collection(db, `classes/${classId}/homeworks/${homework.id}/submissions`);
            await addDoc(submissionsColRef, submissionData);

            // Check for on-time submission and award badge/XP
            const isLate = homework.dueDate && new Date() > new Date(homework.dueDate);
            if (!isLate) {
                const studentRef = doc(db, 'students', student.id);
                const currentBadges: string[] = student.badges || [];
                
                const updates: any = { behaviorScore: increment(10) };
                
                if (!currentBadges.includes('hw-master')) {
                    updates.badges = [...currentBadges, 'hw-master'];
                }

                await updateDoc(studentRef, updates);
                toast({ title: "Ödev başarıyla teslim edildi!", description: "+10 Davranış Puanı ve 'Ödev Ustası' rozeti kazanıldı!" });
            } else {
                 toast({ title: "Ödev başarıyla teslim edildi!" });
            }

        } catch (error: any) {
            console.error("Submission error:", error);
            toast({ variant: "destructive", title: "Teslimat sırasında hata oluştu.", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div onClick={onSelect} className={`cursor-pointer border p-4 rounded-lg shadow-sm space-y-3 transition-all hover:border-primary/50 ${existingSubmission ? 'bg-green-50 dark:bg-green-900/20' : 'bg-background'}`}>
            <div>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>

                 {homework.questions && homework.questions.length > 0 ? (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold">{homework.text}</h2>
                        <p className="text-xs text-muted-foreground">(Detayları ve değerlendirme kriterlerini görmek için tıklayın)</p>
                    </div>
                ) : (
                    <p className="text-sm font-semibold">{homework.text}</p>
                )}
            </div>

            {existingSubmission ? (
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border space-y-3'>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5"/>
                        <p>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    </div>
                    
                    {existingSubmission.rubricScores && homework.rubric && (
                        <div className="mt-2 space-y-2">
                            <p className="font-semibold text-sm">Detaylı Değerlendirme</p>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kriter</TableHead>
                                            <TableHead className="text-right">Alınan Puan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {homework.rubric.map((item: any) => (
                                            <TableRow key={item.label}>
                                                <TableCell className="text-sm">{item.label}</TableCell>
                                                <TableCell className="text-right font-bold text-sm">
                                                    {existingSubmission.rubricScores?.[item.label] || 0} / {item.score}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                    
                    {existingSubmission.feedback && (
                         <div className='bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200'>
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
            ) : null}
        </div>
    )
}

export function PerformanceHomeworkTab() {
  const { appUser, db } = useAuth();
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  if (appUser?.type !== 'student') return null;

  const classId = appUser.data.classId;

  const homeworksQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '!=', null));
  }, [db, classId]);

  const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

  const sortedHomeworks = useMemo(() => {
    if (!homeworks) return [];
    return [...homeworks].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
  }, [homeworks]);

  if (selectedHomework) {
    return <HomeworkDetailView homework={selectedHomework} student={appUser.data} onBack={() => setSelectedHomework(null)} />;
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
            Performans Ödevlerim
        </CardTitle>
        <CardDescription>Kütüphaneden atanan performans ödevlerinizi buradan görebilirsiniz.</CardDescription>
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
                <p className="text-sm text-muted-foreground">Henüz verilmiş bir performans ödevi yok.</p>
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
