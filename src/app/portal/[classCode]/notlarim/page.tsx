
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Student, TeacherProfile, Criterion, GradingScores } from '@/lib/types';
import { Loader2, ArrowLeft, BookOpen, Edit, GraduationCap, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';


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

const TermGrades = ({ termGrades, teacherProfile, student }: { termGrades?: GradingScores, teacherProfile: TeacherProfile | null, student: Student }) => {
    if (!teacherProfile) return null;
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <GradeCard title="1. Sınav" icon={<Edit/>} value={exam1 ?? 'Girilmedi'} />
            <GradeCard title="2. Sınav" icon={<Edit/>} value={exam2 ?? 'Girilmedi'} />
            <GradeCard title="1. Performans" icon={<GraduationCap/>} value={perf1} />
            <GradeCard title="2. Performans" icon={<GraduationCap/>} value={perf2} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Puanı" icon={<UserCheck/>} value={student.behaviorScore} />
        </div>
    )
};


export default function StudentGradesPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) {
                router.replace(`/giris/${classCode}`); return;
            }
            const { student: storedStudent } = JSON.parse(authData);
            if (!storedStudent) {
                 router.replace(`/giris/${classCode}`); return;
            }
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);

    useEffect(() => {
        if (!student?.id || !firestore) return;
        const unsubscribe = onSnapshot(doc(firestore, 'students', student.id), (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on notlarim page", e);
                }
            }
        });
        return () => unsubscribe();
    }, [student?.id, firestore]);
    
    const teacherDocRef = useMemoFirebase(() => (student ? doc(firestore, 'teachers', student.teacherId) : null), [firestore, student]);
    const { data: teacherProfile, isLoading: teacherLoading } = useDoc<TeacherProfile>(teacherDocRef);
    
    useEffect(() => {
        if (student && !teacherLoading) {
            setLoading(false);
        }
    }, [student, teacherLoading]);

    if (loading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Notlarım</h1>
                        <p className="text-sm text-muted-foreground">{student.name}</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/portal/${classCode}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Portala Geri Dön
                    </Link>
                </Button>
            </header>

            <main className="max-w-4xl mx-auto">
                 <Tabs defaultValue="term1">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="term1">1. Dönem</TabsTrigger>
                        <TabsTrigger value="term2">2. Dönem</TabsTrigger>
                    </TabsList>
                    <TabsContent value="term1">
                        <TermGrades termGrades={student.term1Grades} teacherProfile={teacherProfile} student={student} />
                    </TabsContent>
                    <TabsContent value="term2">
                        <TermGrades termGrades={student.term2Grades} teacherProfile={teacherProfile} student={student} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
