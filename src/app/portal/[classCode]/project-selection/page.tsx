'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Lesson } from '@/lib/types';
import { Loader2, ArrowLeft, Save, ListChecks } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, doc, updateDoc, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function StudentProjectSelectionPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

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
            setSelectedPreferences(storedStudent.projectPreferences || []);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        } finally {
            setLoading(false);
        }
    }, [classCode, router]);

    const lessonsQuery = useMemoFirebase(() => {
        if (!db || !student) return null;
        return query(collection(db, 'lessons'), where('teacherId', '==', student.teacherId));
    }, [db, student]);

    const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

    const handlePreferenceChange = (lessonId: string) => {
        const isSelected = selectedPreferences.includes(lessonId);
        if (isSelected) {
            setSelectedPreferences(prev => prev.filter(id => id !== lessonId));
        } else {
            if (selectedPreferences.length < 5) {
                setSelectedPreferences(prev => [...prev, lessonId]);
            } else {
                setTimeout(() => {
                    toast({
                        variant: 'destructive',
                        title: 'En Fazla 5 Tercih',
                        description: 'En fazla 5 proje dersi seçebilirsiniz.',
                    });
                }, 0);
            }
        }
    };

    const handleSavePreferences = async () => {
        if (!db || !student) return;

        setIsSaving(true);
        const studentRef = doc(db, 'students', student.id);

        try {
            await updateDoc(studentRef, {
                projectPreferences: selectedPreferences
            });
            // Update sessionStorage as well
            const authData = JSON.parse(sessionStorage.getItem('student_portal_auth')!);
            authData.student.projectPreferences = selectedPreferences;
            sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));

            toast({
                title: 'Tercihleriniz Kaydedildi!',
                description: `${selectedPreferences.length} proje tercihi başarıyla güncellendi.`,
            });
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Tercihleriniz kaydedilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || lessonsLoading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Proje Ödevi Tercihi</h1>
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
                        <CardTitle>Proje Dersi Seçimi</CardTitle>
                        <CardDescription>
                            Lütfen proje ödevi almak istediğiniz dersleri öncelik sırasına göre en fazla 5 tane olacak şekilde seçiniz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {lessons?.map(lesson => (
                                <div
                                    key={lesson.id}
                                    onClick={() => handlePreferenceChange(lesson.id)}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPreferences.includes(lesson.id) ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted/50'}`}
                                >
                                     <Checkbox
                                        id={`lesson-${lesson.id}`}
                                        checked={selectedPreferences.includes(lesson.id)}
                                     />
                                     <Label htmlFor={`lesson-${lesson.id}`} className="flex-grow cursor-pointer">{lesson.name}</Label>
                                     <span className="text-xs text-muted-foreground">Kontenjan: {lesson.quota}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSavePreferences} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4"/>
                            Tercihlerimi Kaydet
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
