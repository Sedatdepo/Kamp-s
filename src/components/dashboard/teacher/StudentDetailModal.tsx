
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores, Class, Homework, Submission, InfoForm, RiskFactor, DisciplineRecord, Lesson, PerformanceGradeOutput, StudentReportOutput } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, UserCheck, GraduationCap, Edit, ClipboardCheck, Download, Paperclip, Loader2, Wand2, Shield, AlertTriangle } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { doc, updateDoc, collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
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
import { generateStudentReport, StudentReportInput } from '@/ai/flows/generate-student-report-flow';
import { generatePerformanceGrade, PerformanceGradeInput } from '@/ai/flows/generate-performance-grade-flow';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
    
    const isLiteratureTeacher = teacherProfile.branch === 'Edebiyat' || teacherProfile.branch === 'Türk Dili ve Edebiyatı';

    const getExamAverage = (written?: number, speaking?: number, listening?: number, standard?: number): number | null => {
        if(isLiteratureTeacher) {
            if (written === undefined && speaking === undefined && listening === undefined) return null;
            const w = written !== undefined && written >= 0 ? written : 0;
            const s = speaking !== undefined && speaking >= 0 ? speaking : 0;
            const l = listening !== undefined && listening >= 0 ? listening : 0;
            return (w * 0.7) + (s * 0.15) + (l * 0.15);
        }
        return standard ?? null;
    }

    const exam1 = getExamAverage(grades.writtenExam1, grades.speakingExam1, grades.listeningExam1, grades.exam1);
    const exam2 = getExamAverage(grades.writtenExam2, grades.speakingExam2, grades.listeningExam2, grades.exam2);

    const perf1 = grades.perf1 ?? calculateAverage(grades.scores1, perfCriteria);
    const perf2 = grades.perf2 ?? calculateAverage(grades.scores2, perfCriteria);
    const projAvg = student.hasProject ? (grades.projectGrade ?? calculateAverage(grades.projectScores, projCriteria)) : null;
    const behaviorAvg = calculateAverage(grades.behaviorScores, INITIAL_BEHAVIOR_CRITERIA);
    
    if (isLiteratureTeacher) {
         return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <Card className="flex-1 col-span-full lg:col-span-2">
                    <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2 text-xs"><Edit/> 1. Sınav Detayları</CardDescription></CardHeader>
                    <CardContent className="flex gap-2">
                        <GradeCard title="Yazılı" icon={<></>} value={grades.writtenExam1 ?? 'Girilmedi'} />
                        <GradeCard title="Konuşma" icon={<></>} value={grades.speakingExam1 ?? 'Girilmedi'} />
                        <GradeCard title="Dinleme" icon={<></>} value={grades.listeningExam1 ?? 'Girilmedi'} />
                        <Card className="flex-1 bg-primary/10"><CardHeader className="pb-2"><CardDescription className="text-xs">1. Sınav Ort.</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{exam1?.toFixed(2)}</p></CardContent></Card>
                    </CardContent>
                </Card>
                <Card className="flex-1 col-span-full lg:col-span-2">
                    <CardHeader className="pb-2"><CardDescription className="flex items-center gap-2 text-xs"><Edit/> 2. Sınav Detayları</CardDescription></CardHeader>
                    <CardContent className="flex gap-2">
                        <GradeCard title="Yazılı" icon={<></>} value={grades.writtenExam2 ?? 'Girilmedi'} />
                        <GradeCard title="Konuşma" icon={<></>} value={grades.speakingExam2 ?? 'Girilmedi'} />
                        <GradeCard title="Dinleme" icon={<></>} value={grades.listeningExam2 ?? 'Girilmedi'} />
                        <Card className="flex-1 bg-primary/10"><CardHeader className="pb-2"><CardDescription className="text-xs">2. Sınav Ort.</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{exam2?.toFixed(2)}</p></CardContent></Card>
                    </CardContent>
                </Card>
                 <GradeCard title="1. Performans" icon={<GraduationCap/>} value={perf1} />
                <GradeCard title="2. Performans" icon={<GraduationCap/>} value={perf2} />
                <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
                <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
            </div>
         )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <GradeCard title="1. Sınav" icon={<Edit/>} value={exam1 ?? 'Girilmedi'} />
            <GradeCard title="2. Sınav" icon={<Edit/>} value={exam2 ?? 'Girilmedi'} />
            <GradeCard title="1. Performans" icon={<GraduationCap/>} value={perf1} />
            <GradeCard title="2. Performans" icon={<GraduationCap/>} value={perf2} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
        </div>
    )
};

const HomeworkStatusTab = ({ student, currentClass }: { student: Student, currentClass: Class | null }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const [submissionsState, setSubmissionsState] = useState<{ [key: string]: Partial<Submission> }>({});
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
            const submissionsQuery = query(collectionGroup(db, 'submissions'), where('studentId', '==', student.id));
            const querySnapshot = await getDocs(submissionsQuery);
            const fetchedSubmissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));

            setAllSubmissions(fetchedSubmissions);
            setSubmissionsLoading(false);
        };
        fetchSubmissions();
    }, [db, currentClass, homeworks, student.id, homeworksLoading]);

    if (!currentClass) {
        return <p>Sınıf bilgisi yüklenemedi.</p>;
    }

    const handleFieldChange = (subId: string, field: 'grade' | 'feedback', value: string | number) => {
        setSubmissionsState(prev => ({ ...prev, [subId]: { ...prev[subId], [field]: value } }));
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
                <CardTitle>Ödev Teslim Durumu</CardTitle>
                <CardDescription>Öğrencinin teslim ettiği ve etmediği tüm ödevler.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                {homeworks && homeworks.length > 0 ? (
                    homeworks.map(hw => {
                        const submission = allSubmissions.find(s => s.homeworkId === hw.id);
                        return (
                            <div key={hw.id} className="p-4 border rounded-lg space-y-3 bg-background">
                                <p className="text-sm font-semibold">{hw.text}</p>
                                {submission ? (
                                    <div className='bg-muted p-3 rounded-md'>
                                        <p className='text-xs font-bold text-muted-foreground mb-1'>Öğrenci Teslimi ({format(new Date(submission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                                        {submission.text && <p className="text-sm whitespace-pre-wrap font-mono bg-white p-2 rounded-md">{submission.text}</p>}
                                        {submission.grade !== undefined && (<p className="text-sm mt-2"><b>Not:</b> {submission.grade}</p>)}
                                        {submission.feedback && (<p className="text-sm mt-2"><b>Geri Bildirim:</b> {submission.feedback}</p>)}
                                    </div>
                                ) : (
                                    <p className="text-xs text-center text-red-500 mt-2">Bu ödev teslim edilmedi.</p>
                                )}
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

const InfoFormDisplay = ({ form }: { form: InfoForm | null }) => {
    if (!form) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Öğrenci Bilgi Formu</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Bu öğrenci için doldurulmuş bir bilgi formu bulunmuyor.</p>
                </CardContent>
            </Card>
        );
    }

    const renderFieldValue = (value: any) => {
        if (value === undefined || value === null || value === '') return <span className="text-muted-foreground italic">Belirtilmemiş</span>;
        if (value === 'yes') return 'Evet';
        if (value === 'no') return 'Hayır';
        if (value === 'alive') return 'Hayatta';
        if (value === 'deceased') return 'Vefat Etti';
        return String(value);
    };

    const sections = [
        { title: "Kişisel ve İletişim", fields: [
            { label: "Doğum Tarihi/Yeri", value: `${renderFieldValue(form.birthDate)} / ${renderFieldValue(form.birthPlace)}` },
            { label: "Telefon", value: renderFieldValue(form.studentPhone) },
            { label: "E-posta", value: renderFieldValue(form.studentEmail) },
            { label: "Adres", value: renderFieldValue(form.address) },
        ]},
        { title: "Sağlık", fields: [
            { label: "Kan Grubu", value: renderFieldValue(form.bloodType) },
            { label: "Sürekli Hastalık/Alerji", value: renderFieldValue(form.healthIssues) },
        ]},
        { title: "Ailevi Durum", fields: [
            { label: "Anne Durumu", value: `${renderFieldValue(form.motherStatus)} - Eğitimi: ${renderFieldValue(form.motherEducation)} - Mesleği: ${renderFieldValue(form.motherJob)}` },
            { label: "Baba Durumu", value: `${renderFieldValue(form.fatherStatus)} - Eğitimi: ${renderFieldValue(form.fatherEducation)} - Mesleği: ${renderFieldValue(form.fatherJob)}` },
        ]},
        { title: "Sosyo-Ekonomik Durum", fields: [
            { label: "Okula Ulaşım", value: renderFieldValue(form.commutesToSchoolBy) },
            { label: "Ailenin Gelir Düzeyi", value: renderFieldValue(form.economicStatus) },
        ]}
    ];

    return (
        <Card>
            <CardHeader><CardTitle>Öğrenci Bilgi Formu Detayları</CardTitle></CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={['item-0']} className="w-full">
                    {sections.map((section, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>{section.title}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    {section.fields.map(field => (
                                        <div key={field.label}>
                                            <p className="font-semibold text-muted-foreground">{field.label}</p>
                                            <p>{field.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
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

    const { data: infoForm } = useDoc<InfoForm | null>(useMemoFirebase(() => db ? doc(db, 'infoForms', student.id) : null, [db, student.id]));
    const { data: riskFactors } = useCollection<RiskFactor>(useMemoFirebase(() => db ? query(collection(db, 'riskFactors'), where('teacherId', '==', teacherProfile.id)) : null, [db, teacherProfile.id]));
    const { data: homeworks } = useCollection<Homework>(useMemoFirebase(() => db && currentClass ? query(collection(db, 'classes', currentClass.id, 'homeworks')) : null, [db, currentClass]));
    const { data: submissions } = useCollection<Submission>(useMemoFirebase(() => {
        if (!db || !currentClass) return null;
        return query(collectionGroup(db, 'submissions'), where('studentId', '==', student.id));
    }, [db, student.id, currentClass]));
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
            lessons,
            aiReport,
        });
    };
    
    const calculateTermAverage = (termGrades?: GradingScores) => {
        if (!termGrades || !teacherProfile) return 0;
        const isLiterature = teacherProfile.branch === 'Edebiyat' || teacherProfile.branch === 'Türk Dili ve Edebiyatı';
        const getExamAvg = (written?: number, speaking?: number, listening?: number, standard?: number) => {
            if(isLiterature) {
                if (written === undefined && speaking === undefined && listening === undefined) return null;
                const w = written !== undefined && written >= 0 ? written : 0;
                const s = speaking !== undefined && speaking >= 0 ? speaking : 0;
                const l = listening !== undefined && listening >= 0 ? listening : 0;
                return (w * 0.7) + (s * 0.15) + (l * 0.15);
            }
            return standard;
        }
        
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
        
        const exam1 = getExamAvg(termGrades.writtenExam1, termGrades.speakingExam1, termGrades.listeningExam1, termGrades.exam1);
        const exam2 = getExamAvg(termGrades.writtenExam2, termGrades.speakingExam2, termGrades.listeningExam2, termGrades.exam2);

        const perf1 = termGrades.perf1 ?? calculateAverage(termGrades.scores1, perfCriteria);
        const perf2 = termGrades.perf2 ?? calculateAverage(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? (termGrades.projectGrade ?? calculateAverage(termGrades.projectScores, projCriteria)) : null;

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
            teacherNotes: 'Öğretmen notu alanı eklenecek.',
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
                    <Wand2 className="mr-2 h-4 w-4" /> Yapay Zeka ile Gelişim Raporu Oluştur
                </Button>
                <Button onClick={handleExportReport} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Gelişim Raporu İndir
                </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 pt-0 bg-muted/50 max-h-[80vh] overflow-y-auto">
            <Tabs defaultValue="report">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="report">Gelişim Raporu</TabsTrigger>
                    <TabsTrigger value="grades">Notlar</TabsTrigger>
                    <TabsTrigger value="homeworks">Ödevler</TabsTrigger>
                    <TabsTrigger value="risk">Risk & Davranış</TabsTrigger>
                </TabsList>
                <TabsContent value="report" className="mt-4">
                    <div className="space-y-4">
                        <AIReportDisplay report={aiReport} onRegenerate={handleGenerateAIReport} isLoading={isGeneratingReport} />
                        <InfoFormDisplay form={infoForm} />
                    </div>
                </TabsContent>
                <TabsContent value="grades" className="mt-4">
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
                <TabsContent value="risk" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                             <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Risk Faktörleri</CardTitle></CardHeader>
                             <CardContent>
                                {student.risks && student.risks.length > 0 ? (
                                    <ul className="space-y-2">
                                        {student.risks.map(riskId => {
                                            const factor = riskFactors?.find(rf => rf.id === riskId);
                                            return factor ? <li key={riskId} className="text-sm p-2 bg-red-50 rounded-md">{factor.label}</li> : null;
                                        })}
                                    </ul>
                                ) : <p className="text-sm text-muted-foreground">Öğrenci tarafından belirtilmiş risk faktörü yok.</p>}
                             </CardContent>
                        </Card>
                         <Card>
                             <CardHeader><CardTitle className="flex items-center gap-2"><Shield /> Davranış & Disiplin</CardTitle></CardHeader>
                             <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold">Davranış Puanı</h4>
                                    <p className="text-3xl font-bold text-primary">{student.behaviorScore}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Disiplin Kayıtları</h4>
                                    {disciplineRecords.filter(dr => dr.formData?.studentInfo?.studentId === student.id).length > 0 ? (
                                         <ul className="space-y-1 mt-2">
                                            {disciplineRecords.filter(dr => dr.formData?.studentInfo?.studentId === student.id).map(dr => (
                                                <li key={dr.id} className="text-xs p-1 bg-muted rounded-md">{dr.name} - {dr.date}</li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-sm text-muted-foreground">Disiplin kaydı bulunmuyor.</p>}
                                </div>
                             </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
