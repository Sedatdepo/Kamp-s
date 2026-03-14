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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [students, setStudents] = useState<Student[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedStudentId, setSelectedStudentId] = useState('');
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
                return;
            }
            
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
                    
                    // Fetch students
                    const studentsQuery = query(collection(firestore, 'students'), where('classId', '==', foundClassId));
                    const studentsSnap = await getDocs(studentsQuery);
                    const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)).sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
                    setStudents(studentsList);

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
        if (!selectedStudentId || !enteredSchoolNumber.trim()) {
            toast({ variant: 'destructive', title: 'Lütfen adınızı seçin ve okul numaranızı girin.' });
            return;
        }
        
        setIsProcessing(true);

        try {
            const studentRef = doc(firestore, 'students', selectedStudentId);
            const studentSnap = await getDoc(studentRef);

            if (!studentSnap.exists() || studentSnap.data().number !== enteredSchoolNumber.trim()) {
                toast({ variant: 'destructive', title: 'Hata', description: 'Girilen bilgilerle eşleşen öğrenci bulunamadı.' });
                setIsProcessing(false);
                return;
            }
            
            const student = { id: studentSnap.id, ...studentSnap.data() } as Student;

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
                    <Logo className="h-24 w-24 text-primary" />
                    <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground">
                        Kampüs Online
                    </h1>
                     <p className="text-muted-foreground text-xl mt-2">{className || 'Öğrenci Portalı'}</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><UserIcon /> Öğrenci Girişi</CardTitle>
                        <CardDescription>Portala erişmek için bilgilerinizi girin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                             <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="pl-9">
                                    <SelectValue placeholder="Adını listeden seç..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map(student => (
                                        <SelectItem key={student.id} value={student.id}>({student.number}) {student.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
