'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Student, TeacherProfile, Badge } from '@/lib/types';
import { Loader2, Trophy, ArrowLeft, Star, BookOpen, Heart, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INITIAL_BADGES } from '@/lib/grading-defaults';


export default function StudentGamificationPage() {
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
                    console.error("Could not update session storage on kahramanlar page", e);
                }
            }
        });
        return () => unsubscribe();
    }, [student?.id, firestore]);
    
    const teacherDocRef = useMemoFirebase(() => (student ? doc(firestore, 'teachers', student.teacherId) : null), [firestore, student]);
    const { data: teacherProfile, isLoading: teacherLoading } = useDoc<TeacherProfile>(teacherDocRef);
    
    const availableBadges = useMemo(() => teacherProfile?.badgeCriteria || INITIAL_BADGES, [teacherProfile]);
    
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
                        <h1 className="text-xl font-bold text-gray-800">Başarılarım</h1>
                        <p className="text-sm text-muted-foreground">{student.name}</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/portal/${classCode}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Portala Geri Dön
                    </Link>
                </Button>
            </header>

            <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card className="text-center sticky top-8">
                        <CardHeader>
                            <CardTitle>Davranış Puanı</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-7xl font-bold text-primary">{student.behaviorScore || 100}</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kazanılan Rozetler</CardTitle>
                            <CardDescription>Yıl boyunca gösterdiğin başarılar için tebrikler!</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(student.badges && student.badges.length > 0) ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {student.badges.map(badgeId => {
                                        const badge = availableBadges.find(b => b.id === badgeId);
                                        return badge ? (
                                            <Card key={badge.id} className="p-4 flex flex-col items-center justify-center text-center">
                                                <div className="text-6xl mb-2">{badge.icon}</div>
                                                <p className="font-bold">{badge.name}</p>
                                                <p className="text-xs text-muted-foreground">{badge.description}</p>
                                            </Card>
                                        ) : null;
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-muted/50 rounded-lg">
                                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-sm text-muted-foreground">Henüz bir rozet kazanmadın.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Ödevlerini yaparak ve derse katılarak rozetler kazanabilirsin!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
