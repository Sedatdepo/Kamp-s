
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student } from '@/lib/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegularHomeworkTab } from '@/components/dashboard/teacher/homework/RegularHomeworkTab';
import { PerformanceHomeworkTab } from '@/components/dashboard/teacher/homework/PerformanceHomeworkTab';

export default function StudentHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;

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

    if (loading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Ödevlerim</h1>
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
                 <Tabs defaultValue="regular">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="regular">Günlük Ödevlerim</TabsTrigger>
                        <TabsTrigger value="performance">Performans Ödevlerim</TabsTrigger>
                    </TabsList>
                    <TabsContent value="regular" className="mt-4">
                        <RegularHomeworkTab student={student} classId={student.classId} />
                    </TabsContent>
                    <TabsContent value="performance" className="mt-4">
                        <PerformanceHomeworkTab student={student} classId={student.classId} />
                    </TabsContent>
                 </Tabs>
            </main>
        </div>
    );
}
