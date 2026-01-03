
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, TeacherProfile, GradingScores, Criterion } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Gauge, BookOpen, UserCheck, GraduationCap, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';

const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria || criteria.length === 0 || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
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

const TermGrades = ({ termGrades, teacherProfile, student }: { termGrades?: GradingScores, teacherProfile: TeacherProfile | null, student: any }) => {
    const grades = termGrades || {};
    const perfCriteria = teacherProfile?.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile?.projCriteria || INITIAL_PROJ_CRITERIA;
    const behaviorCriteria = teacherProfile?.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
    
    const exam1 = grades.exam1;
    const exam2 = grades.exam2;
    const perf1 = calculateAverage(grades.scores1, perfCriteria);
    const perf2 = calculateAverage(grades.scores2, perfCriteria);
    const projAvg = student.hasProject ? calculateAverage(grades.projectScores, projCriteria) : null;
    const behaviorAvg = calculateAverage(grades.behaviorScores, behaviorCriteria);
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <GradeCard title="1. Sınav" icon={<Edit/>} value={exam1 ?? 'Girilmedi'} />
            <GradeCard title="2. Sınav" icon={<Edit/>} value={exam2 ?? 'Girilmedi'} />
            <GradeCard title="1. Performans" icon={<Gauge/>} value={perf1} />
            <GradeCard title="2. Performans" icon={<Gauge/>} value={perf2} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
        </div>
    )
};

export function GradesTab() {
  const { appUser, db } = useAuth();

  if (appUser?.type !== 'student') return null;

  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const { data: studentClass, loading: classLoading } = useFirestore<Class>(
    `class-${classId}`,
    useMemo(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db])
  );

  const teacherQuery = useMemo(() => (studentClass?.teacherId && db ? doc(db, 'teachers', studentClass.teacherId) : null), [studentClass?.teacherId, db]);
  const { data: teacherProfile, loading: teacherLoading } = useFirestore<TeacherProfile>(`teacher-for-student-${studentClass?.teacherId}`, teacherQuery);
  
  const calculateTermAverage = (termGrades?: GradingScores) => {
        if (!termGrades || !teacherProfile) return 0;
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
        
        const exam1 = termGrades.exam1;
        const exam2 = termGrades.exam2;
        const perf1 = calculateAverage(termGrades.scores1, perfCriteria);
        const perf2 = calculateAverage(termGrades.scores2, perfCriteria);
        const projAvg = appUser.data.hasProject ? calculateAverage(termGrades.projectScores, projCriteria) : null;

        const allScores = [exam1, exam2, perf1, perf2, projAvg].filter(
            (score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0
        );
        
        if (allScores.length === 0) return 0;
        
        const sum = allScores.reduce((acc, score) => acc + score, 0);
        return sum / allScores.length;
    };
    
    const term1Avg = calculateTermAverage(appUser.data.term1Grades);
    const term2Avg = calculateTermAverage(appUser.data.term2Grades);
    const finalAverage = (term1Avg > 0 && term2Avg > 0) ? (term1Avg + term2Avg) / 2 : (term1Avg > 0 ? term1Avg : term2Avg);

  if (classLoading || teacherLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }
  
  return (
    <div className="grid gap-6">
       <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Notlarım</CardTitle>
                    <Card className="p-4 bg-background">
                        <CardDescription className="flex items-center gap-2"><GraduationCap/> Yıl Sonu Ortalama</CardDescription>
                        <p className="text-4xl font-bold text-primary text-center mt-1">{finalAverage.toFixed(2)}</p>
                    </Card>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="term1">
                    <TabsList>
                        <TabsTrigger value="term1">1. Dönem</TabsTrigger>
                        <TabsTrigger value="term2">2. Dönem</TabsTrigger>
                    </TabsList>
                    <TabsContent value="term1" className="mt-4">
                        <TermGrades termGrades={appUser.data.term1Grades} teacherProfile={teacherProfile} student={appUser.data} />
                    </TabsContent>
                    <TabsContent value="term2" className="mt-4">
                        <TermGrades termGrades={appUser.data.term2Grades} teacherProfile={teacherProfile} student={appUser.data} />
                    </TabsContent>
                </Tabs>
            </CardContent>
       </Card>
    </div>
  );
}
