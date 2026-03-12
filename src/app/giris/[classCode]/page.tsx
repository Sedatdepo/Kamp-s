'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, updateDoc, setDoc } from 'firebase/firestore';
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
    const { firestore, auth } = useFirebase();
    const { toast } = useToast();
    
    const [classId, setClassId] = useState<string | null>(null);
    const [className, setClassName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [enteredSchoolNumber, setEnteredSchoolNumber] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchClassId = async () => {
            if (!firestore || !classCode) return;
            setLoading(true);
            try {
                const classCodeRef = doc(firestore, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);
                if (classCodeSnap.exists()) {
                    const foundClassId = classCodeSnap.data().classId;
                    setClassId(foundClassId);
                    const classRef = doc(firestore, 'classes', foundClassId);
                    const classSnap = await getDoc(classRef);
                    if (classSnap.exists()) {
                        setClassName(classSnap.data().name);
                    } else {
                        setError("Sınıf bilgisi bulunamadı.");
                        setLoading(false);
                    }
                } else {
                    setError("Geçersiz sınıf kodu. Lütfen linki kontrol edin.");
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                setError("Sınıf bilgileri alınırken bir hata oluştu.");
                setLoading(false);
            }
        };
        fetchClassId();
    }, [firestore, classCode]);

    const studentsQuery = useMemoFirebase(() => (classId ? query(collection(firestore, 'students'), where('classId', '==', classId)) : null), [firestore, classId]);
    const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
    
    useEffect(() => {
        if (!studentsLoading && classId) {
            setLoading(false);
        }
    }, [studentsLoading, classId]);

    const handleLogin = async () => {
        if (!auth || !firestore) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Giriş sistemi hazır değil.' });
            return;
        }
        if (!selectedStudentId || !enteredSchoolNumber) {
            toast({ variant: 'destructive', title: 'Lütfen adınızı seçip okul numaranızı girin.' });
            return;
        }
        
        setIsProcessing(true);

        const student = students?.find(s => s.id === selectedStudentId);
        if (student && student.number === enteredSchoolNumber) {
             try {
                let user: User | null = auth.currentUser;
                // If there's no user, or the user is not anonymous (e.g. a teacher is logged in), sign in anonymously.
                if (!user || !user.isAnonymous) {
                    const userCredential = await signInAnonymously(auth);
                    user = userCredential.user;
                }
                
                if (user) {
                    const studentRef = doc(firestore, 'students', student.id);
                    
                    // Only update the student document to link the authUid.
                    // The infoForm document will be created/updated when the student visits the form page itself.
                    await setDoc(studentRef, { authUid: user.uid }, { merge: true });
                    
                    const updatedStudent = { ...student, authUid: user.uid };

                    sessionStorage.setItem('student_portal_auth', JSON.stringify({ student: updatedStudent, classCode }));
                    router.push(`/portal/${classCode}`);
                } else {
                    throw new Error("Kullanıcı oturumu oluşturulamadı.");
                }
            } catch (e) {
                console.error("Anonymous sign-in or student update failed:", e);
                toast({ variant: 'destructive', title: 'Giriş Hatası', description: 'Giriş yapılamadı. Lütfen tekrar deneyin.' });
            }
        } else {
            toast({ variant: 'destructive', title: 'Okul numarası yanlış.' });
        }
        
        setIsProcessing(false);
    };
    
    if (loading) {
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
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                            <SelectTrigger><SelectValue placeholder="Adını seç..." /></SelectTrigger>
                            <SelectContent>
                                {students?.sort((a, b) => a.name.localeCompare(b.name)).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
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
