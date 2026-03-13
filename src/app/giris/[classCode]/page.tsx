'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, updateDoc, getDocs } from 'firebase/firestore';
import { Student, Class } from '@/lib/types';
import { Loader2, User as UserIcon, Key, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/Logo';
import { signInAnonymously, type User } from 'firebase/auth';

export default function StudentLoginPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore, auth, user, isUserLoading } = useFirebase();
    const { toast } = useToast();
    
    const [className, setClassName] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [enteredName, setEnteredName] = useState('');
    const [enteredSchoolNumber, setEnteredSchoolNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const initAndFetch = async () => {
            if (isUserLoading || !auth || !firestore) {
                setPageLoading(true);
                return;
            }

            if (!user) {
                await signInAnonymously(auth);
                // The onAuthStateChanged listener will trigger a re-render.
                // We return here and let the next effect run handle the data fetching.
                return;
            }
            
            // User is now authenticated (at least anonymously). Proceed with data fetching.
            try {
                const classCodeRef = doc(firestore, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);

                if (classCodeSnap.exists()) {
                    const foundClassId = classCodeSnap.data().classId;
                    const classRef = doc(firestore, 'classes', foundClassId);
                    const classSnap = await getDoc(classRef);
                    
                    if (classSnap.exists()) {
                        setClassName(classSnap.data().name);
                    } else {
                        setError("Sınıf bilgisi bulunamadı.");
                    }
                } else {
                    setError("Geçersiz sınıf kodu. Lütfen linki kontrol edin.");
                }
            } catch (e: any) {
                console.error(e);
                setError("Sınıf bilgileri alınırken bir hata oluştu.");
            } finally {
                setPageLoading(false);
            }
        };

        initAndFetch();
    }, [isUserLoading, user, auth, firestore, classCode]);

    const handleLogin = async () => {
        if (!auth || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Giriş sistemi hazır değil.' });
            return;
        }
        if (!enteredName.trim() || !enteredSchoolNumber.trim()) {
            toast({ variant: 'destructive', title: 'Lütfen adınızı ve okul numaranızı girin.' });
            return;
        }
        
        setIsProcessing(true);

        try {
            const classCodeRef = doc(firestore, 'classCodes', classCode);
            const classCodeSnap = await getDoc(classCodeRef);

            if (!classCodeSnap.exists()) {
                toast({ variant: 'destructive', title: 'Geçersiz Sınıf Kodu' });
                setIsProcessing(false);
                return;
            }
            const foundClassId = classCodeSnap.data().classId;

            const studentQuery = query(
                collection(firestore, 'students'),
                where('classId', '==', foundClassId),
                where('name', '==', enteredName.trim()),
                where('number', '==', enteredSchoolNumber.trim())
            );
            
            const studentSnap = await getDocs(studentQuery);

            if (studentSnap.empty) {
                toast({ variant: 'destructive', title: 'Hata', description: 'Girilen bilgilerle eşleşen öğrenci bulunamadı.' });
                setIsProcessing(false);
                return;
            }
            
            const student = { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } as Student;

            const studentRef = doc(firestore, 'students', student.id);
            await updateDoc(studentRef, { authUid: user.uid });
            
            const studentForSession = { ...student, authUid: user.uid };
            sessionStorage.setItem('student_portal_auth', JSON.stringify({ student: studentForSession, classCode }));
            router.push(`/portal/${classCode}`);

        } catch (e) {
            console.error("Login or student query failed:", e);
            toast({ variant: 'destructive', title: 'Giriş Hatası', description: 'Giriş yapılamadı. Bilgilerinizi kontrol edip tekrar deneyin.' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (pageLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
     if (error) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-bold">{error}</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                 <div className="flex flex-col items-center text-center mb-6">
                    <Logo className="h-12 w-12 text-primary" />
                    <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
                        {className || 'Öğrenci Portalı'}
                    </h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserIcon /> Öğrenci Girişi</CardTitle>
                        <CardDescription>Portala erişmek için bilgilerinizi girin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Adın Soyadın" 
                                className="pl-9"
                                value={enteredName}
                                onChange={(e) => setEnteredName(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="password" 
                                placeholder="Okul Numaran" 
                                className="pl-9"
                                value={enteredSchoolNumber}
                                onChange={(e) => setEnteredSchoolNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <Button onClick={handleLogin} disabled={isProcessing} className="w-full gap-2">
                             {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogIn size={16}/>} Giriş Yap
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
    