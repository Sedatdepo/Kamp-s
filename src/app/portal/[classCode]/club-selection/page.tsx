'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Club } from '@/lib/types';
import { Loader2, ArrowLeft, Save, Drama, CheckCircle } from 'lucide-react';
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

export default function StudentClubSelectionPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>(Array(5).fill(''));
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const authData = localStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setStudent(storedStudent);
                const currentPrefs = storedStudent.clubPreferences || [];
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

    // Real-time listener for student data
    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;

        const unsubscribe = onSnapshot(doc(db, 'students', student.id), (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                
                const currentPrefs = liveStudentData.clubPreferences || [];
                const newPrefs = Array(5).fill('');
                currentPrefs.forEach((p, i) => {
                    if(i < 5) newPrefs[i] = p;
                });
                setSelectedPreferences(newPrefs);

                try {
                    const authData = JSON.parse(localStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    localStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on club selection page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);

    const clubsQuery = useMemoFirebase(() => {
        if (!db || !student?.teacherId) return null;
        return query(collection(db, 'clubs'), where('teacherId', '==', student.teacherId));
    }, [db, student?.teacherId]);
    const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

    const assignedClubs = useMemo(() => {
        if (!student?.assignedClubIds || !clubs) return [];
        return student.assignedClubIds.map(clubId => clubs.find(c => c.id === clubId)?.name).filter(Boolean);
    }, [student?.assignedClubIds, clubs]);

    const handlePreferenceChange = (index: number, clubId: string) => {
        const newPrefs = [...selectedPreferences];
        if (clubId && newPrefs.filter((p, i) => i !== index).includes(clubId)) {
            toast({
                variant: "destructive",
                title: "Kulüp Zaten Seçildi",
                description: "Bu kulübü başka bir tercih olarak zaten seçtiniz.",
            });
            return;
        }
        newPrefs[index] = clubId;
        setSelectedPreferences(newPrefs);
    };

    const handleSavePreferences = async () => {
        if (!db || !student) return;
        setIsSaving(true);
        const studentRef = doc(db, 'students', student.id);
        const finalPreferences = selectedPreferences.filter(p => p && p !== '');

        try {
            await updateDoc(studentRef, {
                clubPreferences: finalPreferences
            });
            
            try {
                const authData = JSON.parse(localStorage.getItem('student_portal_auth') || '{}');
                authData.student.clubPreferences = finalPreferences;
                localStorage.setItem('student_portal_auth', JSON.stringify(authData));
            } catch (e) {
                console.error("Could not update session storage on club selection page", e);
            }
            
            toast({
                title: 'Tercihleriniz Kaydedildi!',
                description: `${finalPreferences.length} kulüp tercihi başarıyla güncellendi.`,
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
        if (!isUserLoading && student && !clubsLoading) {
            setLoading(false);
        }
    }, [isUserLoading, student, clubsLoading]);

    if (loading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Sosyal Kulüp Tercihi</h1>
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
                        <CardTitle className="flex items-center gap-2"><Drama /> Kulüp Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {assignedClubs.length > 0 ? (
                            <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-800 rounded-r-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6"/>
                                    <div>
                                        <h3 className="font-bold">Kulüp Atamanız Yapıldı!</h3>
                                        <p>Atandığınız kulüpler: <strong>{assignedClubs.join(', ')}</strong></p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                             <CardDescription>
                                Lütfen katılmak istediğiniz sosyal kulüpleri öncelik sırasına göre en fazla 5 tane olacak şekilde seçiniz.
                            </CardDescription>
                        )}
                        
                        <div className={cn("space-y-4", assignedClubs.length > 0 && "opacity-50 pointer-events-none")}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index}>
                                    <Label className="font-semibold text-muted-foreground"> {index + 1}. Tercih</Label>
                                    <Select
                                        value={selectedPreferences[index] || ''}
                                        onValueChange={(value) => handlePreferenceChange(index, value === 'none' ? '' : value)}
                                        disabled={assignedClubs.length > 0}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Kulüp seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Seçimi Kaldır --</SelectItem>
                                            {clubs?.map(club => (
                                                <SelectItem 
                                                    key={club.id} 
                                                    value={club.id} 
                                                    disabled={selectedPreferences.includes(club.id) && selectedPreferences[index] !== club.id}
                                                >
                                                    {club.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleSavePreferences} disabled={isSaving || assignedClubs.length > 0} className="w-full">
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
