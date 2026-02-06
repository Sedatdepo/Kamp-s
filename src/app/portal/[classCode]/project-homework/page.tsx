'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Lesson } from '@/lib/types';
import { Loader2, ArrowLeft, ClipboardList } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentProjectPage() {
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

    const assignedLessonRef = useMemoFirebase(() => {
        if (!db || !student?.assignedLesson) return null;
        return doc(db, 'lessons', student.assignedLesson);
    }, [db, student?.assignedLesson]);
    
    const { data: assignedLesson, isLoading: lessonLoading } = useDoc<Lesson>(assignedLessonRef);

    if (!student || lessonLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Proje Ödevim</h1>
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
                            <ClipboardList className="h-6 w-6"/>
                            Atanan Proje Ödevi Dersiniz
                        </CardTitle>
                        <CardDescription>Aşağıda, öğretmeniniz tarafından size atanmış olan proje ödevi dersini görebilirsiniz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignedLesson ? (
                            <div className="p-6 bg-primary/10 rounded-lg text-center">
                                <p className="text-muted-foreground">Proje Dersiniz</p>
                                <p className="text-3xl font-bold text-primary mt-2">{assignedLesson.name}</p>
                                <p className="text-sm text-muted-foreground mt-4">Ödev detayları ve teslim tarihi öğretmeniniz tarafından ayrıca bildirilecektir.</p>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-muted/50 rounded-lg">
                               <p className="text-sm text-muted-foreground">Size henüz bir proje dersi atanmamış.</p>
                               <p className="text-xs text-muted-foreground mt-1">Proje tercihi yaptıysanız, öğretmeninizin atama yapmasını bekleyin.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
