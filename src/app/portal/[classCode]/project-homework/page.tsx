'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework, Submission } from '@/lib/types';
import { Loader2, ArrowLeft, ClipboardList } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where } from 'firebase/firestore';
import { RegularHomeworkTab } from '@/components/dashboard/teacher/homework/RegularHomeworkTab'; // Re-using this component structure

export default function StudentProjectHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { db } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

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

    const projectHomeworkQuery = useMemoFirebase(() => {
        if (!db || !student) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks'),
            where('assignmentType', '==', 'project'),
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, student]);

    const { data: projectHomeworks, isLoading } = useCollection<Homework>(projectHomeworkQuery);
    
    if (loading || isLoading || !student) {
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
                {projectHomeworks && projectHomeworks.length > 0 ? (
                    <RegularHomeworkTab student={student} classId={student.classId} homeworks={projectHomeworks} />
                ) : (
                    <div className="text-center py-20 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">Size atanmış bir proje ödevi bulunmamaktadır.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// NOTE: We need to adapt RegularHomeworkTab to accept homeworks as a prop or create a new component.
// For now, I will modify RegularHomeworkTab to accept an optional homeworks prop.
