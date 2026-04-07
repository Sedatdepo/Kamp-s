'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Lesson, Homework } from '@/lib/types';
import { Loader2, ArrowLeft, ClipboardList, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Header } from '@/components/dashboard/Header';

export default function StudentProjectPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const [student, setStudent] = useState<Student | null>(null);
    const [openHomeworks, setOpenHomeworks] = useState<Record<string, boolean>>({});

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

    // Real-time listener for student data
    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;

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
                    console.error("Could not update session storage on project homework page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);


    const projectHomeworkQuery = useMemoFirebase(() => {
        if (!db || !student?.id || !student.classId) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks'),
            where('assignmentType', '==', 'project'),
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, student?.classId, student?.id]);

    const { data: projectHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(projectHomeworkQuery);
    
    const toggleHomework = (id: string) => {
        setOpenHomeworks(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (isUserLoading || !student || homeworksLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Proje Ödevlerim</h1>
                        <p className="text-sm text-muted-foreground">{student.name}</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href={`/portal/${classCode}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Portala Geri Dön
                        </Link>
                    </Button>
                </div>
                <div className="space-y-6">
                    {projectHomeworks && projectHomeworks.length > 0 ? (
                        projectHomeworks.map((hw, idx) => (
                            <Card key={hw.id} className="overflow-hidden border-l-4 border-l-purple-500">
                                <Collapsible open={openHomeworks[hw.id] ?? (idx === 0)} onOpenChange={() => toggleHomework(hw.id)}>
                                    <CollapsibleTrigger asChild>
                                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors flex flex-row items-center justify-between space-y-0">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5 text-purple-600" />
                                                    {hw.text}
                                                </CardTitle>
                                                <CardDescription>
                                                    Veriliş Tarihi: {new Date(hw.assignedDate).toLocaleDateString('tr-TR')}
                                                </CardDescription>
                                            </div>
                                            {openHomeworks[hw.id] ?? (idx === 0) ? <ChevronUp /> : <ChevronDown />}
                                        </CardHeader>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <CardContent className="pt-4 border-t">
                                            <div className="space-y-6">
                                                {hw.instructions && (
                                                    <div>
                                                        <h3 className="font-bold mb-2 text-md text-purple-800">Proje Yönergesi</h3>
                                                        <div className="p-4 bg-purple-50/50 rounded-lg text-sm border border-purple-100 whitespace-pre-wrap">
                                                            {hw.instructions}
                                                        </div>
                                                    </div>
                                                )}
                                                {hw.rubric && (
                                                    <div>
                                                        <h3 className="font-bold mb-2 text-md flex items-center gap-2 text-purple-800">
                                                            <ClipboardList className="h-4 w-4"/> Değerlendirme Kriterleri
                                                        </h3>
                                                        <div className="border rounded-lg overflow-hidden bg-white">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="bg-muted/50">
                                                                        <TableHead>Kriter</TableHead>
                                                                        <TableHead className="text-right w-[100px]">Puan</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {hw.rubric.map((item: any, index: number) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>
                                                                                <p className="font-medium text-sm">{item.label}</p>
                                                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                                            </TableCell>
                                                                            <TableCell className="text-right font-bold text-md">{item.score}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Collapsible>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-slate-100 p-4 rounded-full mb-4">
                                    <ClipboardList className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-slate-600 font-medium">Henüz bir proje ödevi atanmamış.</p>
                                <p className="text-sm text-slate-400 mt-1">Öğretmeniniz bir proje atadığında burada görünecektir.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
