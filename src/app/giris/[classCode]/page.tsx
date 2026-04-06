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
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen adınızı seçin ve okul numaranızı girin.' });
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
        return <div className="flex h-screen items-center justify-center bg-[#0a0f14] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
    }
     if (error) {
        return <div className="flex h-screen items-center justify-center bg-[#0a0f14] text-red-500 font-bold">{error}</div>;
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f14] p-4 font-sans text-white">
            <div className="w-full max-w-md flex flex-col items-center">
                 {/* Logo - Kartın tam üstünde */}
                <div className="mb-4 transform scale-110">
                    <Logo />
                </div>

                <div className="text-center mb-6">
                     <p className="text-xl font-medium text-slate-300 italic">{className || 'Öğrenci Portalı'}</p>
                </div>

                <Card className="w-full shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-sm text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-2xl font-headline text-white"><UserIcon /> Öğrenci Girişi</CardTitle>
                        <CardDescription className="text-center text-slate-400">Portala erişmek için bilgilerinizi girin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400 z-10" />
                             <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="pl-9 bg-slate-800 border-slate-700 text-white focus:ring-cyan-500">
                                    <SelectValue placeholder="Adını listeden seç..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {students.map(student => (
                                        <SelectItem key={student.id} value={student.id} className="focus:bg-slate-700 focus:text-white">({student.number}) {student.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input 
                                type="text"
                                inputMode="numeric" 
                                placeholder="Okul Numaran" 
                                className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500"
                                value={enteredSchoolNumber}
                                onChange={(e) => setEnteredSchoolNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <Button 
                            onClick={handleLogin} 
                            disabled={isProcessing} 
                            className="w-full h-12 gap-2 text-lg font-semibold bg-cyan-600 hover:bg-cyan-700 text-white border-none shadow-lg shadow-cyan-900/20 transition-all"
                        >
                             {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <LogIn size={20}/>} Giriş Yap
                        </Button>
                    </CardContent>
                </Card>
                <p className="text-center text-xs text-slate-500 mt-8">
                    Sedat İleri tarafından geliştirildi.
                </p>
            </div>
        </div>
    );
}
