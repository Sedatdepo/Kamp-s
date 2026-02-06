
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores, Class, Homework, Submission, StudentReportOutput, RiskFactor, InfoForm } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, UserCheck, GraduationCap, Edit, Wand2, Loader2, FileDown } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { generateStudentReport } from '@/ai/flows/generate-student-report-flow';
import { exportStudentDevelopmentReportToRtf } from '@/lib/word-export';


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
            <GradeCard title="Davranış Puanı" icon={<UserCheck/>} value={student.behaviorScore} />
        </div>
    )
};

const HomeworkStatusTab = ({ student, currentClass }: { student: Student, currentClass: Class | null }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(true);

    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !currentClass) return null;
        return query(collection(db, 'classes', currentClass.id, 'homeworks'));
    }, [db, currentClass]);

    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

    const fetchSubmissions = useCallback(async () => {
        if (!db || !currentClass || !student?.id || homeworksLoading || !homeworks) {
            setSubmissionsLoading(false);
            return;
        }
        setSubmissionsLoading(true);
        try {
            const submissionPromises = (homeworks || []).map(hw => 
                getDocs(query(
                    collection(db, `classes/${currentClass!.id}/homeworks/${hw.id}/submissions`),
                    where('studentId', '==', student.id)
                ))
            );
            const querySnapshots = await Promise.all(submissionPromises);
            const submissionsData = querySnapshots.flatMap(snap => 
                snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission))
            );
            setAllSubmissions(submissionsData);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Ödev teslim durumu alınamadı.' });
        } finally {
            setSubmissionsLoading(false);
        }
    }, [db, currentClass, student?.id, homeworks, homeworksLoading, toast]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    if (!currentClass) {
        return <p>Sınıf bilgisi yüklenemedi.</p>;
    }

    if (homeworksLoading || submissionsLoading) return <div>Yükleniyor...</div>;

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

export function StudentDetailModal({ student, teacherProfile, currentClass, isOpen, setIsOpen }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('grades');
  const { db } = useAuth();
  const { toast } = useToast();
  
  // AI Report State
  const [aiReport, setAiReport] = useState<StudentReportOutput | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [teacherNotes, setTeacherNotes] = useState('');

  // Fetch data needed for the report
  const riskFactorsQuery = useMemoFirebase(() => {
    if (!db || !teacherProfile?.id) return null;
    return query(collection(db, 'riskFactors'), where('teacherId', '==', teacherProfile.id));
  }, [db, teacherProfile?.id]);
  const { data: allRiskFactors } = useCollection<RiskFactor>(riskFactorsQuery);
  
  const infoFormQuery = useMemoFirebase(() => {
    if(!db || !student?.id) return null;
    return doc(db, 'infoForms', student.id);
  }, [db, student?.id]);
  const { data: infoForm } = useDoc<InfoForm>(infoFormQuery);


  const calculateTermAverage = (termGrades?: GradingScores) => {
    if (!termGrades || !teacherProfile) return 0;
    const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    
    const isLiteratureTeacher = teacherProfile.branch === 'Edebiyat' || teacherProfile.branch === 'Türk Dili ve Edebiyatı';
     const getExamAvg = (written?: number, speaking?: number, listening?: number, standard?: number) => {
        if(isLiteratureTeacher) {
            if (written === undefined && speaking === undefined && listening === undefined) return null;
            const w = written !== undefined && written >= 0 ? written : 0;
            const s = speaking !== undefined && speaking >= 0 ? speaking : 0;
            const l = listening !== undefined && listening >= 0 ? listening : 0;
            return (w * 0.7) + (s * 0.15) + (l * 0.15);
        }
        return standard;
    }
    
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

  const handleGenerateReport = async () => {
    if (!student || !currentClass || !allRiskFactors) {
      toast({ title: 'Eksik Veri', description: 'Rapor oluşturmak için gerekli tüm veriler yüklenemedi.', variant: 'destructive' });
      return;
    }
    setIsGeneratingReport(true);
    setAiReport(null);

    const riskFactorLabels = (student.risks || [])
      .map(riskId => allRiskFactors.find(rf => rf.id === riskId)?.label)
      .filter(Boolean) as string[];

    let infoFormDataString = "Öğrenci bilgi formu doldurulmamış.";
    if (infoForm) {
      infoFormDataString = Object.entries(infoForm)
        .filter(([key, value]) => key !== 'id' && key !== 'studentId' && key !== 'submitted' && value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    }
    
    try {
      const reportInput = {
        studentName: student.name,
        classInfo: currentClass.name,
        finalAverage: finalAverage,
        term1Average: term1Avg,
        term2Average: term2Avg,
        attendanceCount: student.attendance?.filter(a => a.status === 'absent').length || 0,
        behaviorScore: student.behaviorScore || 100,
        riskFactors: riskFactorLabels,
        infoFormData: infoFormDataString,
        teacherNotes: teacherNotes,
      };

      const result = await generateStudentReport(reportInput);
      setAiReport(result);
    } catch(err) {
      console.error(err);
      toast({ title: 'Yapay Zeka Hatası', description: 'Rapor oluşturulurken bir sorun oluştu.', variant: 'destructive'});
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportReport = () => {
    if (!aiReport || !student || !currentClass || !teacherProfile) {
        toast({ title: 'Rapor Yok', description: 'Lütfen önce yapay zeka ile bir rapor oluşturun.', variant: 'destructive'});
        return;
    }
    exportStudentDevelopmentReportToRtf({
        student,
        teacherProfile,
        currentClass,
        aiReport,
    });
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-headline">{student.name}</DialogTitle>
              <DialogDescription>Okul No: {student.number}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 pt-0 bg-muted/50">
            <Tabs defaultValue="grades" onValueChange={(val) => setActiveTab(val)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="grades">Not Durumu</TabsTrigger>
                    <TabsTrigger value="homeworks">Ödevler</TabsTrigger>
                    <TabsTrigger value="report">Gelişim Raporu</TabsTrigger>
                </TabsList>
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
                <TabsContent value="report" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                              <CardTitle>Yapay Zeka Destekli Gelişim Raporu</CardTitle>
                              <CardDescription>Öğrencinin tüm verilerini analiz ederek bütüncül bir rapor oluşturun.</CardDescription>
                          </div>
                          {aiReport && (
                              <Button variant="outline" size="sm" onClick={handleExportReport}>
                                  <FileDown className="mr-2 h-4 w-4" />
                                  Word Olarak İndir
                              </Button>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="teacher-notes">Ek Öğretmen Notları</Label>
                            <Textarea id="teacher-notes" value={teacherNotes} onChange={(e) => setTeacherNotes(e.target.value)} placeholder="Rapor oluşturulurken dikkate alınmasını istediğiniz ek gözlemlerinizi buraya yazın..." />
                        </div>
                        <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                            {isGeneratingReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Rapor Oluştur
                        </Button>

                        {isGeneratingReport && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto"/> <p>Rapor oluşturuluyor...</p></div>}
                        
                        {aiReport && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-bold text-lg">Oluşturulan Rapor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <h4 className="font-semibold text-blue-800">1. Dönem Analizi</h4>
                                        <p className="text-sm text-slate-700">{aiReport.term1Analysis}</p>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                                        <h4 className="font-semibold text-purple-800">2. Dönem Analizi</h4>
                                        <p className="text-sm text-slate-700">{aiReport.term2Analysis}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                    <h4 className="font-semibold text-green-800">Genel Sosyal ve Davranışsal Durum</h4>
                                    <p className="text-sm text-slate-700">{aiReport.socialAndBehavioralStatus}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <h4 className="font-semibold text-red-800">Risk ve Ailevi Durum Analizi</h4>
                                    <p className="text-sm text-slate-700">{aiReport.overallRiskAnalysis}</p>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <h4 className="font-semibold text-yellow-800">Güçlü Yönler</h4>
                                    <p className="text-sm text-slate-700 whitespace-pre-line">{aiReport.strengths}</p>
                                </div>
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <h4 className="font-semibold text-indigo-800">Öğretmene Tavsiyeler</h4>
                                    <p className="text-sm text-slate-700 whitespace-pre-line">{aiReport.recommendations}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
