
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, updateDoc, getDocs } from 'firebase/firestore';
import { Student, Class, SociogramQuestion } from '@/lib/types';
import { Loader2, User, Key, Send, CheckCircle, Frown, Users, UserX, Star, BookOpen, Coffee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/Logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { signInAnonymously } from 'firebase/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getIconComponent = (iconName: string) => {
    switch (iconName) {
        case 'UserX': return <UserX className="mr-2 h-5 w-5" />;
        case 'Star': return <Star className="mr-2 h-5 w-5" />;
        case 'BookOpen': return <BookOpen className="mr-2 h-5 w-5" />;
        case 'Coffee': return <Coffee className="mr-2 h-5 w-5" />;
        default: return <Users className="mr-2 h-5 w-5" />;
    }
};

export default function SociogramPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, auth, user, isUserLoading } = useFirebase();
    const { toast } = useToast();
    
    const [currentClass, setCurrentClass] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'login' | 'survey' | 'voted' | 'error'>('login');

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [enteredPassword, setEnteredPassword] = useState('');
    const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selections, setSelections] = useState<{[questionId: number]: string[]}>({});

    const sortedStudents = useMemo(() => {
        return [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
    }, [students]);

    useEffect(() => {
        const initAndFetch = async () => {
            if (isUserLoading || !auth || !db) return;
            if (!user) {
                await signInAnonymously(auth);
                return;
            }
            try {
                const classCodeRef = doc(db, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);

                if (classCodeSnap.exists()) {
                    const classId = classCodeSnap.data().classId;
                    const classDocRef = doc(db, 'classes', classId);
                    const classSnap = await getDoc(classDocRef);
                    if (classSnap.exists()) {
                        const classData = { id: classSnap.id, ...classSnap.data() } as Class;
                        setCurrentClass(classData);
                        if (!classData.isSociogramActive) {
                            setError("Bu sınıf için sosyogram anketi şu anda aktif değil.");
                            setStep('error');
                        }
                    } else {
                        setError("Sınıf bilgisi bulunamadı.");
                        setStep('error');
                    }
                    const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
                    const studentsSnap = await getDocs(studentsQuery);
                    setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
                } else {
                    setError("Geçersiz sınıf kodu.");
                    setStep('error');
                }
            } catch (e) {
                console.error(e);
                setError("Veriler alınırken bir hata oluştu.");
                setStep('error');
            } finally {
                setPageLoading(false);
            }
        };
        initAndFetch();
    }, [isUserLoading, user, db, auth, classCode]);

    const handleLogin = async () => {
        if (!currentClass || !db || !selectedStudentId) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Lütfen öğrenci seçin.' });
            return;
        }
        setIsProcessing(true);
        try {
            const studentRef = doc(db, 'students', selectedStudentId);
            const studentSnap = await getDoc(studentRef);
            
            if (!studentSnap.exists()) {
                toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci bulunamadı.' });
                setIsProcessing(false);
                return;
            }
            
            const studentData = studentSnap.data();
            let passwordMatches = false;

            if (studentData.password) {
                passwordMatches = studentData.password === enteredPassword.trim();
            } else if (studentData.number === enteredPassword.trim()) {
                passwordMatches = true;
            }

            if(passwordMatches) {
                const student = { id: studentSnap.id, ...studentData } as Student;
                if (student.positiveSelections?.length || student.negativeSelections?.length || student.leadershipSelections?.length) {
                    setError('Bu anketi daha önce doldurdunuz.');
                    setStep('error');
                } else {
                    setLoggedInStudent(student);
                    setStep('survey');
                }
            } else {
                toast({ variant: 'destructive', title: 'Hata', description: 'Bilgiler uyuşmuyor.' });
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Giriş yapılamadı.' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSelectionChange = (questionId: number, studentId: string, maxSelections: number) => {
        setSelections(prev => {
            const current = prev[questionId] || [];
            if (current.includes(studentId)) return { ...prev, [questionId]: current.filter(id => id !== studentId) };
            if (current.length < maxSelections) return { ...prev, [questionId]: [...current, studentId] };
            toast({ variant: 'destructive', title: `Maksimum ${maxSelections} seçim yapabilirsiniz.` });
            return prev;
        });
    };

    const handleSubmit = async () => {
        if (!loggedInStudent || !db) return;
        setIsProcessing(true);
        const updates: any = {};
        currentClass?.sociogramSurvey?.questions.forEach(q => {
            if(selections[q.id]) {
                if(q.type === 'positive') updates.positiveSelections = selections[q.id];
                if(q.type === 'negative') updates.negativeSelections = selections[q.id];
                if(q.type === 'leadership') updates.leadershipSelections = selections[q.id];
            }
        });
        try {
            await updateDoc(doc(db, 'students', loggedInStudent.id), updates);
            setStep('voted');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kaydedilemedi.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (pageLoading) return <div className="flex h-screen items-center justify-center bg-[#0a0f14]"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f14] p-4 text-white">
            <div className="w-full max-w-lg">
                <div className="flex flex-col items-center mb-8"><Logo /></div>
                
                {step === 'login' && (
                    <Card className="bg-slate-900/50 border-white/10 text-white">
                        <CardHeader><CardTitle>Sosyogram Girişi</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={(e) => { e.preventDefault(); handleLogin();}} className="space-y-4">
                                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="İsmini seç..." /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 text-white border-slate-700">
                                        {sortedStudents.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input type="password" placeholder="Şifre (Genellikle okul numaranız)" className="bg-slate-800 border-slate-700 text-white" value={enteredPassword} onChange={e => setEnteredPassword(e.target.value)} />
                                <Button type="submit" disabled={isProcessing} className="w-full bg-cyan-600 hover:bg-cyan-700">
                                    {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null} Giriş Yap
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {step === 'survey' && (
                    <Card className="bg-slate-900/50 border-white/10 text-white">
                        <CardHeader><CardTitle>Anket Formu</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {currentClass?.sociogramSurvey?.questions.filter(q => q.active).map(q => (
                                <div key={q.id} className="space-y-3">
                                    <h3 className="font-medium flex items-center">{getIconComponent(q.icon)} {q.text}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {sortedStudents.filter(s => s.id !== loggedInStudent?.id).map(s => (
                                            <div key={s.id} className="flex items-center space-x-2 p-2 rounded border border-white/5 hover:bg-white/5">
                                                <Checkbox id={`${q.id}-${s.id}`} checked={(selections[q.id] || []).includes(s.id)} onCheckedChange={() => handleSelectionChange(q.id, s.id, q.maxSelections)} />
                                                <Label htmlFor={`${q.id}-${s.id}`} className="flex-1 cursor-pointer">{s.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button onClick={handleSubmit} disabled={isProcessing} className="w-full bg-cyan-600 hover:bg-cyan-700">Gönder</Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'voted' && <div className="text-center"><CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" /><h3>Anket tamamlandı!</h3></div>}
                {step === 'error' && <div className="text-center text-red-400"><h3>{error}</h3><Button variant="link" onClick={() => window.location.reload()}>Tekrar Dene</Button></div>}
            </div>
        </div>
    );
}
