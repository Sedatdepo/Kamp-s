'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Lesson } from '@/lib/types';
import { Loader2, ArrowLeft, Save, ListChecks, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, doc, updateDoc, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Header } from '@/components/dashboard/Header';

export default function StudentProjectSelectionPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>(Array(5).fill(''));
    const [isSaving, setIsSaving] = useState(false);

    // 1. Initial load from session storage
    useEffect(() => {
        const authData = sessionStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setStudent(storedStudent);
                const currentPrefs = storedStudent.projectPreferences || [];
                const initialPrefs = Array(5).fill('');
                currentPrefs.forEach((p: string, i: number) => {
                    if (i < 5) initialPrefs[i] = p;
                });
                setSelectedPreferences(initialPrefs);
            } catch (e) {
                console.error("Failed to parse student auth data", e);
            }
        }
    }, []);

    // 2. Real-time listener for student data
    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;

        const unsubscribe = onSnapshot(doc(db, 'students', student.id), (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                
                const currentPrefs = liveStudentData.projectPreferences || [];
                const newPrefs = Array(5).fill('');
                currentPrefs.forEach((p, i) => {
                    if(i < 5) newPrefs[i] = p;
                });
                setSelectedPreferences(newPrefs);

                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on project selection page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);

    // 3. Fetch available lessons for the teacher
    const lessonsQuery = useMemoFirebase(() => {
        if (!db || !student?.teacherId) return null;
        return query(collection(db, 'lessons'), where('teacherId', '==', student.teacherId));
    }, [db, student?.teacherId]);

    const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

    // 4. Find the assigned lesson
    const assignedLesson = useMemo(() => {
        if (!student?.assignedLesson || !lessons) return null;
        return lessons.find(l => l.id === student.assignedLesson);
    }, [student?.assignedLesson, lessons]);


    const handlePreferenceChange = (index: number, lessonId: string) => {
        const newPrefs = [...selectedPreferences];
        if (lessonId && newPrefs.filter((p, i) => i !== index).includes(lessonId)) {
            toast({
                variant: "destructive",
                title: "Ders Zaten Seçildi",
                description: "Bu dersi başka bir tercih olarak zaten seçtiniz.",
            });
            return;
        }
        newPrefs[index] = lessonId;
        setSelectedPreferences(newPrefs);
    };

    const handleSavePreferences = async () => {
        if (!db || !student) return;
        setIsSaving(true);
        const studentRef = doc(db, 'students', student.id);
        const finalPreferences = selectedPreferences.filter(p => p && p !== '');

        try {
            await updateDoc(studentRef, {
                projectPreferences: finalPreferences
            });
            
            try {
                const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                authData.student.projectPreferences = finalPreferences;
                sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
            } catch (e) {
                console.error("Could not update session storage on project selection page", e);
            }
            
            toast({
                title: 'Tercihleriniz Kaydedildi!',
                description: `${finalPreferences.length} proje tercihi başarıyla güncellendi.`,
            });
            router.push(`/portal/${classCode}`);
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Tercihleriniz kaydedilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    useEffect(() => {
        if (!isUserLoading && student && !lessonsLoading) {
            setLoading(false);
        }
    }, [isUserLoading, student, lessonsLoading]);

    if (loading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Proje Ödevi Tercihi</h1>
                        <p className="text-sm text-muted-foreground">{student.name}</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href={`/portal/${classCode}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Portala Geri Dön
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Proje Dersi Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       {assignedLesson ? (
                            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-r-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6"/>
                                    <div>
                                        <h3 className="font-bold">Proje Dersiniz Atandı!</h3>
                                        <p>Öğretmeniniz tarafından size atanan proje dersi: <strong>{assignedLesson.name}</strong></p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <CardDescription>
                                Lütfen proje ödevi almak istediğiniz dersleri öncelik sırasına göre seçiniz. En fazla 5 tercih yapabilirsiniz.
                            </CardDescription>
                        )}
                        
                        <div className={cn("space-y-4", assignedLesson && "opacity-50 pointer-events-none")}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index}>
                                    <Label className="font-semibold text-muted-foreground"> {index + 1}. Tercih</Label>
                                    <Select
                                        value={selectedPreferences[index] || ''}
                                        onValueChange={(value) => handlePreferenceChange(index, value === 'none' ? '' : value)}
                                        disabled={!!assignedLesson}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Ders seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Seçimi Kaldır --</SelectItem>
                                            {lessons?.map(lesson => (
                                                <SelectItem 
                                                    key={lesson.id} 
                                                    value={lesson.id} 
                                                    disabled={selectedPreferences.includes(lesson.id) && selectedPreferences[index] !== lesson.id}
                                                >
                                                    {lesson.name} (Kontenjan: {lesson.quota})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSavePreferences} disabled={isSaving || !!assignedLesson} className="w-full">
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
