
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores, Class, Homework, Submission, InfoForm, RiskFactor, DisciplineRecord, Lesson } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gauge, BookOpen, UserCheck, GraduationCap, Edit, ClipboardCheck, Download, Paperclip, Loader2, Wand2 } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { exportStudentDevelopmentReportToRtf } from '@/lib/word-export';
import { useDatabase } from '@/hooks/use-database';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { generateStudentReport, StudentReportInput, StudentReportOutput } from '@/ai/flows/generate-student-report-flow';


interface StudentDetailModalProps {
  student: Student;
  teacherProfile: TeacherProfile;
  currentClass: Class | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria.length || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return (totalScore / totalMax) * 100;
};

const GradeCard = ({ title, icon, value }: { title: string, icon: React.ReactNode, value: number | string | null }) => (
    <Card className="flex-1">
        <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">{icon} {title}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">
                {value === null || value === undefined ? 'N/A' : typeof value === 'number' ? value.toFixed(2) : value}
            </p>
        </CardContent>
    </Card>
);

const TermGrades = ({ termGrades, teacherProfile, student }: { termGrades?: GradingScores, teacherProfile: TeacherProfile, student: Student }) => {
    const grades = termGrades || {};
    const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    
    const exam1 = grades.exam1;
    const exam2 = grades.exam2;
    const perf1 = calculateAverage(grades.scores1, perfCriteria);
    const perf2 = calculateAverage(grades.scores2, perfCriteria);
    const projAvg = student.hasProject ? calculateAverage(grades.projectScores, projCriteria) : null;
    const behaviorAvg = calculateAverage(grades.behaviorScores, INITIAL_BEHAVIOR_CRITERIA);
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <GradeCard title="1. Sınav" icon={<Edit/>} value={exam1 ?? 'Girmedi'} />
            <GradeCard title="2. Sınav" icon={<Edit/>} value={exam2 ?? 'Girmedi'} />
            <GradeCard title="1. Performans" icon={<Gauge/>} value={perf1} />
            <GradeCard title="2. Performans" icon={<Gauge/>} value={perf2} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
        </div>
    )
};

const HomeworkStatusTab = ({ student, currentClass }: { student: Student, currentClass: Class | null }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const [submissionsState, setSubmissionsState] = useState<{[key: string]: Partial<Submission>}>({});
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    const homeworksQuery = useMemoFirebase(() => {
      if (!db || !currentClass) return null;
      return query(collection(db, 'classes', currentClass.id, 'homeworks'));
    }, [db, currentClass]);

    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!db || !currentClass || homeworksLoading || !homeworks) {
                setSubmissionsLoading(false);
                return;
            };
            setSubmissionsLoading(true);
            const submissionsPromises = homeworks.map(hw => {
                const subQuery = query(collection(db, 'classes', currentClass.id, 'homeworks', hw.id, 'submissions'), where('studentId', '==', student.id));
                return getDocs(subQuery);
            });

            const snapshots = await Promise.all(submissionsPromises);
            const fetchedSubmissions: Submission[] = [];
            snapshots.forEach(snapshot => {
                snapshot.forEach(doc => {
                    fetchedSubmissions.push({ id: doc.id, ...doc.data() } as Submission);
                });
            });
            setAllSubmissions(fetchedSubmissions);
            setSubmissionsLoading(false);
        };
        fetchSubmissions();
    }, [db, currentClass, homeworks, student.id, homeworksLoading]);


    if (!currentClass) {
        return <p>Sınıf bilgisi yüklenemedi.</p>;
    }

    const handleFieldChange = (subId: string, field: 'grade' | 'feedback', value: string | number) => {
        setSubmissionsState(prev => ({
            ...prev,
            [subId]: {
                ...prev[subId],
                [field]: value
            }
        }));
    };
    
    const handleSaveFeedback = async (hwId: string, subId: string) => {
        if (!currentClass || !db) return;

        const subRef = doc(db, 'classes', currentClass.id, 'homeworks', hwId, 'submissions', subId);
        
        const localChanges = submissionsState[subId];
        if (!localChanges) return;

        try {
            await updateDoc(subRef, localChanges);
            toast({ title: 'Değerlendirme kaydedildi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Değerlendirme kaydedilemedi.' });
        }
    };
    
    if (homeworksLoading || submissionsLoading) return <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ödev Değerlendirme</CardTitle>
                <CardDescription>Öğrencinin teslim ettiği ödevleri inceleyip not ve geri bildirim girin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {homeworks && homeworks.length > 0 ? (
                    homeworks.map(hw => {
                        const submission = allSubmissions.find(s => s.homeworkId === hw.id);

                        if (!submission) {
                            return (
                                <div key={hw.id} className="p-4 border rounded-lg bg-muted/50">
                                    <p className="text-sm font-medium">{hw.text}</p>
                                    <p className="text-xs text-center text-muted-foreground mt-2">Öğrenci bu ödevi henüz teslim etmedi.</p>
                                </div>
                            );
                        }

                        const localGrade = submissionsState[submission.id]?.grade;
                        const localFeedback = submissionsState[submission.id]?.feedback;

                        return (
                            <div key={hw.id} className="p-4 border rounded-lg space-y-3">
                                <p className="text-sm font-semibold">{hw.text}</p>
                                <div className='bg-muted p-3 rounded-md'>
                                    <p className='text-xs font-bold text-muted-foreground mb-1'>Öğrenci Teslimi ({format(new Date(submission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                                    {submission.text && <p className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded-md">{submission.text}</p>}
                                    {submission.file && (
                                        <a href={submission.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 bg-white p-2 rounded-md hover:bg-blue-50 text-blue-600">
                                            <Paperclip className="h-4 w-4" />
                                            <span className="truncate underline">{submission.file.name}</span>
                                            <Download className="h-4 w-4 ml-auto" />
                                        </a>
                                    )}
                                    {!submission.text && !submission.file && <p className="text-sm text-muted-foreground italic">Öğrenci metin veya dosya göndermedi.</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                                    <div className='md:col-span-3 space-y-1'>
                                        <Textarea 
                                            placeholder="Geri bildirim yazın..." 
                                            defaultValue={submission.feedback}
                                            onChange={(e) => handleFieldChange(submission.id, 'feedback', e.target.value)}
                                            className='text-xs'
                                            rows={2}
                                        />
                                    </div>
                                    <div className='space-y-1'>
                                         <Input 
                                            type="number" 
                                            placeholder="Not" 
                                            defaultValue={submission.grade}
                                            onChange={(e) => handleFieldChange(submission.id, 'grade', Number(e.target.value))}
                                            className='h-9 text-center font-bold text-lg'
                                        />
                                         <Button onClick={() => handleSaveFeedback(hw.id, submission.id)} size="sm" className="w-full" disabled={localGrade === undefined && localFeedback === undefined}>Kaydet</Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Bu sınıfa henüz ödev atanmamış.</p>
                )}
            </CardContent>
        </Card>
    );
};

const AIReportDisplay = ({ report, onRegenerate, isLoading }: { report: StudentReportOutput | null, onRegenerate: () => void, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card className="flex flex-col items-center justify-center p-10 text-center bg-blue-50/50 border-blue-200 border-dashed">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-blue-700 font-semibold">Yapay zeka öğrenciyi analiz ediyor...</p>
                <p className="text-blue-600 text-sm">Bu işlem 15-20 saniye sürebilir.</p>
            </Card>
        );
    }
    if (!report) return null;

    return (
        <Card className="border-blue-200 bg-blue-50/20">
             <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-blue-800 flex items-center gap-2"><Wand2 /> Yapay Zeka Gelişim Raporu</CardTitle>
                     <Button onClick={onRegenerate} variant="ghost" size="sm"><Loader2 className="mr-2 h-4 w-4" /> Yeniden Oluştur</Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Akademik Durum</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{report.academicStatus}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Sosyal ve Davranışsal Durum</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{report.socialAndBehavioralStatus}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Risk Analizi</h4>
                    <p className="text-sm text-slate-600 leading-relaxed bg-amber-50 p-3 rounded-md border border-amber-200">{report.riskAnalysis}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Öne Çıkan Güçlü Yönler</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                       {report.strengths.split('\n').map((item, index) => item.trim() && <li key={index}>{item.replace('-', '').trim()}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-lg text-slate-800 mb-2">Öğretmene Tavsiyeler</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                       {report.recommendations.split('\n').map((item, index) => item.trim() && <li key={index}>{item.replace('-', '').trim()}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
};


export function StudentDetailModal({ student, teacherProfile, currentClass, isOpen, setIsOpen }: StudentDetailModalProps) {
    const { db } = useAuth();
    const { toast } = useToast();
    const { db: localDb } = useDatabase();
    const { disciplineRecords = [] } = localDb;
    
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [aiReport, setAiReport] = useState<StudentReportOutput | null>(null);

    // Data fetching for the report
    const { data: infoForm } = useDoc<InfoForm | null>(useMemoFirebase(() => db ? doc(db, 'infoForms', student.id) : null, [db, student.id]));
    const { data: riskFactors } = useCollection<RiskFactor>(useMemoFirebase(() => db ? query(collection(db, 'riskFactors')) : null, [db]));
    const { data: homeworks } = useCollection<Homework>(useMemoFirebase(() => db ? query(collection(db, 'classes', student.classId, 'homeworks')) : null, [db, student.classId]));
    const { data: submissions } = useCollection<Submission>(useMemoFirebase(() => db ? query(collection(db, `classes/${student.classId}/homeworks`), where('studentId', '==', student.id)) : null, [db, student.classId, student.id]));
    const { data: lessons } = useCollection<Lesson>(useMemoFirebase(() => db ? query(collection(db, 'lessons'), where('teacherId', '==', teacherProfile.id)) : null, [db, teacherProfile.id]));

    const handleExportReport = () => {
        if (!currentClass || !riskFactors || !homeworks || !submissions || !lessons) {
            toast({
                title: "Veri Eksik",
                description: "Raporu oluşturmak için gerekli tüm veriler henüz yüklenmedi.",
                variant: "destructive"
            });
            return;
        }
        exportStudentDevelopmentReportToRtf({
            student,
            infoForm,
            riskFactors,
            teacherProfile,
            currentClass,
            homeworks,
            submissions,
            disciplineRecords,
            lessons
        });
    };
    
    const calculateTermAverage = (termGrades?: GradingScores) => {
        if (!termGrades) return 0;
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
        
        const exam1 = termGrades.exam1;
        const exam2 = termGrades.exam2;
        const perf1 = calculateAverage(termGrades.scores1, perfCriteria);
        const perf2 = calculateAverage(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? calculateAverage(termGrades.projectScores, projCriteria) : null;

        const allScores = [exam1, exam2, perf1, perf2, projAvg].filter(
            (score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0
        );
        
        if (allScores.length === 0) return 0;
        
        const sum = allScores.reduce((acc, score) => acc + score, 0);
        return sum / allScores.length;
    };
    
    const term1Avg = calculateTermAverage(student.term1Grades);
    const term2Avg = calculateTermAverage(student.term2Grades);
    const finalAverage = (term1Avg > 0 && term2Avg > 0) ? (term1Avg + term2Avg) / 2 : (term1Avg > 0 ? term1Avg : term2Avg);
    
    const handleGenerateAIReport = async () => {
        if (!riskFactors || !currentClass) return;

        setIsGeneratingReport(true);
        setAiReport(null);

        const input: StudentReportInput = {
            studentName: student.name,
            classInfo: currentClass.name,
            finalAverage: finalAverage,
            term1Average: term1Avg,
            term2Average: term2Avg,
            attendanceCount: student.attendance?.filter(a => a.status === 'absent').length || 0,
            behaviorScore: student.behaviorScore,
            riskFactors: student.risks.map(rId => riskFactors.find(rf => rf.id === rId)?.label || 'Bilinmeyen Risk'),
            infoFormData: infoForm ? `Anne: ${infoForm.motherStatus}, Baba: ${infoForm.fatherStatus}, Kardeşler: ${infoForm.siblingsInfo}, Ekonomik Durum: ${infoForm.economicStatus}` : "Doldurulmamış",
        };
        try {
            const report = await generateStudentReport(input);
            setAiReport(report);
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Rapor oluşturulamadı', description: 'Yapay zeka ile iletişim kurulamadı.'});
        } finally {
            setIsGeneratingReport(false);
        }
    };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl">{getInitials(student.name)}</AvatarFallback>
                </Avatar>
                <div>
                <DialogTitle className="text-2xl font-headline">{student.name}</DialogTitle>
                <DialogDescription>Okul No: {student.number}</DialogDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button onClick={handleGenerateAIReport} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    <Wand2 className="mr-2 h-4 w-4" /> Yapay Zeka ile Rapor Oluştur
                </Button>
                <Button onClick={handleExportReport} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Gelişim Raporu İndir
                </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 pt-0 bg-muted/50 max-h-[80vh] overflow-y-auto">
             <div className="my-4">
                 <AIReportDisplay report={aiReport} onRegenerate={handleGenerateAIReport} isLoading={isGeneratingReport} />
             </div>
             <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="homeworks">Ödevler</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    <Tabs defaultValue="term1">
                        <div className="flex justify-between items-center mb-4">
                            <TabsList>
                                <TabsTrigger value="term1">1. Dönem</TabsTrigger>
                                <TabsTrigger value="term2">2. Dönem</TabsTrigger>
                            </TabsList>
                            <Card className="p-4 bg-background">
                                <CardDescription className="flex items-center gap-2"><GraduationCap/> Yıl Sonu Genel Ortalama</CardDescription>
                                <p className="text-4xl font-bold text-primary text-center mt-1">{finalAverage.toFixed(2)}</p>
                            </Card>
                        </div>
                        <TabsContent value="term1">
                            <TermGrades termGrades={student.term1Grades} teacherProfile={teacherProfile} student={student} />
                        </TabsContent>
                        <TabsContent value="term2">
                            <TermGrades termGrades={student.term2Grades} teacherProfile={teacherProfile} student={student} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="homeworks" className="mt-4">
                   <HomeworkStatusTab student={student} currentClass={currentClass} />
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
