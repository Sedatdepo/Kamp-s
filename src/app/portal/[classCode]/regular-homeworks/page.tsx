'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework } from '@/lib/types';
import { Loader2, ArrowLeft, BookText } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { HomeworkItem } from '@/components/dashboard/teacher/homework/RegularHomeworkTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';


export default function StudentRegularHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    
    const { db } = useFirebase();
    
    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) {
                router.replace(`/giris/${classCode}`);
                return;
            }
            const { student: storedStudent, classCode: storedClassCode } = JSON.parse(authData);
            if (storedClassCode !== classCode || !storedStudent) {
                router.replace(`/giris/${classCode}`);
                return;
            }
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        } finally {
            setLoading(false);
        }
    }, [classCode, router]);
    
    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !student?.classId || !student?.id) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks'), 
            where('rubric', '==', null),
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, student?.classId, student?.id]);
    
    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);
    
    const sortedHomeworks = useMemo(() => {
        if (!homeworks) return [];
        return [...homeworks].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [homeworks]);

    const initialLoading = loading || !student;

    if (initialLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Günlük Ödevlerim</h1>
                        <p className="text-sm text-muted-foreground">{student.name}</p>
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
                                {sortedHomeworks.length > 0 ? (
                                    sortedHomeworks.map((hw) => (
                                        <HomeworkItem key={hw.id} homework={hw} student={student} classId={student.classId} />
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-muted/50 rounded-lg">
                                        <p className="text-sm text-muted-foreground">Henüz verilmiş bir ödev yok.</p>
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
