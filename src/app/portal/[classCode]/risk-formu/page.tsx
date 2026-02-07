'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, RiskFactor } from '@/lib/types';
import { Loader2, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function StudentRiskFormPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) {
                router.replace(`/giris/${classCode}`); return;
            }
            const { student: storedStudent, classCode: storedClassCode } = JSON.parse(authData);
            if (storedClassCode !== classCode || !storedStudent) {
                router.replace(`/giris/${classCode}`); return;
            }
            setStudent(storedStudent);
            setSelectedRisks(storedStudent.risks || []);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);

    // Real-time listener for student data
    useEffect(() => {
        if (!student?.id || !db) return;

        const unsubscribe = onSnapshot(doc(db, 'students', student.id), (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                setSelectedRisks(liveStudentData.risks || []);
                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on risk form page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db]);

    const riskFactorsQuery = useMemoFirebase(() => {
        if (!db || !student?.teacherId) return null;
        return query(collection(db, 'riskFactors'), where('teacherId', '==', student.teacherId));
    }, [db, student?.teacherId]);
    const { data: riskFactors, isLoading: risksLoading } = useCollection<RiskFactor>(riskFactorsQuery);

    const handleRiskToggle = (riskId: string) => {
        setSelectedRisks(prev =>
            prev.includes(riskId) ? prev.filter(id => id !== riskId) : [...prev, riskId]
        );
    };

    const handleSaveChanges = async () => {
        if (!db || !student) return;
        setIsSaving(true);
        const studentRef = doc(db, 'students', student.id);

        try {
            await updateDoc(studentRef, {
                risks: selectedRisks
            });
            
            toast({
                title: 'Tercihleriniz Kaydedildi!',
                description: `Risk faktörleri güncellendi.`,
            });
            router.push(`/portal/${classCode}`);
        } catch (error) {
            console.error("Failed to save risks:", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Risk faktörleri kaydedilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
     useEffect(() => {
        if (student && !risksLoading) {
            setLoading(false);
        }
    }, [student, risksLoading]);

    if (loading || !student) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Özel Durum ve Risk Bildirimi</h1>
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
                        <CardTitle className="flex items-center gap-2"><AlertTriangle /> Risk Faktörleri</CardTitle>
                        <CardDescription>
                            Aşağıdaki durumlardan size uygun olanları işaretleyiniz. Bu bilgiler sadece rehber öğretmeniniz tarafından görülecektir ve size daha iyi destek olabilmemiz için kullanılacaktır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            {(riskFactors || []).map((factor) => (
                                <div key={factor.id} onClick={() => handleRiskToggle(factor.id)} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer has-[:checked]:bg-amber-50 has-[:checked]:border-amber-300">
                                    <Checkbox
                                        checked={selectedRisks.includes(factor.id)}
                                        onCheckedChange={() => handleRiskToggle(factor.id)}
                                    />
                                    <div className="space-y-1 leading-none">
                                        <Label className="cursor-pointer">{factor.label}</Label>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4"/>
                            Kaydet
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
