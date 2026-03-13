
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, updateDoc, getDocs } from 'firebase/firestore';
import { Class, Student, Candidate } from '@/lib/types';
import { Loader2, User, Key, Vote, CheckCircle, AlertCircle, Frown, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/Logo';
import { signInAnonymously, type User as AuthUser } from 'firebase/auth';


export default function OylamaPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore, auth } = useFirebase();
    const { toast } = useToast();
    
    const [currentClass, setCurrentClass] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'login' | 'vote' | 'voted' | 'error'>('login');

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [enteredSchoolNumber, setEnteredSchoolNumber] = useState('');
    const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const initAndFetch = async () => {
            if (!firestore || !auth || !classCode) return;
            setLoading(true);
            setError(null);
            
            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }

                const classCodeRef = doc(firestore, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);

                if (classCodeSnap.exists()) {
                    const classId = classCodeSnap.data().classId;
                    
                    const classDocRef = doc(firestore, 'classes', classId);
                    const classSnap = await getDoc(classDocRef);

                    if (classSnap.exists()) {
                        const classData = { id: classSnap.id, ...classSnap.data() } as Class;
                        setCurrentClass(classData);
                        if (!classData.isElectionActive) {
                            setError("Bu sınıf için oylama şu anda aktif değil.");
                            setStep('error');
                            setLoading(false);
                            return;
                        }
                    } else {
                         setError("Sınıf bilgisi bulunamadı.");
                         setStep('error');
                         setLoading(false);
                         return;
                    }
                    
                    const studentsQuery = query(collection(firestore, 'students'), where('classId', '==', classId));
                    const studentsSnap = await getDocs(studentsQuery);
                    setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));

                } else {
                    setError("Geçersiz sınıf kodu. Lütfen linki kontrol edin.");
                    setStep('error');
                }
            } catch(e) {
                console.error(e);
                setError("Veriler alınırken bir hata oluştu.");
                setStep('error');
            } finally {
                setLoading(false);
            }
        };

        initAndFetch();
    }, [firestore, auth, classCode]);

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
                if (currentClass?.election?.votedStudentIds?.includes(student.id)) {
                    setError('Bu seçim için zaten oy kullandınız.');
                    setStep('error');
                    setIsProcessing(false);
                    return;
                }

                let user: AuthUser | null = auth.currentUser;
                
                if (user) {
                    const updatedStudent = { ...student, authUid: user.uid };
                    setLoggedInStudent(updatedStudent);
                    setStep('vote');
                    setError('');
                } else {
                    throw new Error("Kullanıcı oturumu oluşturulamadı.");
                }
            } catch (e) {
                console.error("Login failed:", e);
                toast({ variant: 'destructive', title: 'Giriş Hatası', description: 'Giriş yapılamadı. Lütfen tekrar deneyin.' });
            }
        } else {
            toast({ variant: 'destructive', title: 'Okul numarası yanlış.' });
        }
        
        setIsProcessing(false);
    };
    
    const handleVote = async (candidate: Candidate) => {
        if (!loggedInStudent || !currentClass || !firestore) return;
        
        setIsProcessing(true);
        const classRef = doc(firestore, 'classes', currentClass.id);
        
        const newCandidates = currentClass.election?.candidates.map(c => 
            c.id === candidate.id ? { ...c, votes: (c.votes || 0) + 1 } : c
        );
        const newVotedStudentIds = [...(currentClass.election?.votedStudentIds || []), loggedInStudent.id];
        
        try {
            await updateDoc(classRef, {
                'election.candidates': newCandidates,
                'election.votedStudentIds': newVotedStudentIds
            });
            toast({ title: 'Oyunuz başarıyla kaydedildi!' });
            setStep('voted');
            setTimeout(() => {
                router.push(`/portal/${classCode}`);
            }, 2000);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Hata', description: 'Oyunuz kaydedilirken bir sorun oluştu.' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                 <div className="flex flex-col items-center text-center mb-6">
                    <Logo className="h-12 w-12 text-primary" />
                    <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
                        {currentClass?.name} Sınıf Seçimi
                    </h1>
                </div>

                {step === 'login' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> Öğrenci Girişi</CardTitle>
                            <CardDescription>Oy kullanmak için lütfen adınızı seçin ve okul numaranızı girin.</CardDescription>
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
                            <Button onClick={handleLogin} disabled={isProcessing} className="w-full">
                                {isProcessing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                Giriş Yap ve Oy Kullan
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'vote' && loggedInStudent && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Merhaba, {loggedInStudent.name}!</CardTitle>
                            <CardDescription>Lütfen oy vermek istediğiniz adayın üzerine tıklayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {currentClass?.election?.candidates.map(candidate => (
                                <Card key={candidate.id} onClick={() => handleVote(candidate)} className="p-4 cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-4">
                                     <Vote className="h-6 w-6 text-primary" />
                                     <span className="font-bold text-lg">{candidate.name}</span>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                )}
                
                {step === 'voted' && (
                    <Card className="text-center p-8">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <CardTitle>Teşekkürler!</CardTitle>
                        <CardDescription>Oyunuz başarıyla kaydedildi. Öğrenci portalına yönlendiriliyorsunuz...</CardDescription>
                    </Card>
                )}

                {step === 'error' && (
                    <Card className="text-center p-8 border-red-500 bg-red-50">
                        <Frown className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <CardTitle className="text-red-800">Bir Sorun Oluştu</CardTitle>
                        <CardDescription className="text-red-700">{error}</CardDescription>
                         <Button variant="outline" onClick={() => router.back()} className="mt-4">Geri Dön</Button>
                    </Card>
                )}
            </div>
        </div>
    );
}
