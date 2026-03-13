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

const getIconComponent = (iconName: SociogramQuestion['icon']) => {
    const icons = { Users, UserX, Star, BookOpen, Coffee };
    const Icon = icons[iconName] || Users;
    return <Icon className="mr-2 h-5 w-5" />;
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

    const [enteredName, setEnteredName] = useState('');
    const [enteredSchoolNumber, setEnteredSchoolNumber] = useState('');
    const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selections, setSelections] = useState<{[questionId: number]: string[]}>({});


    useEffect(() => {
        const initAndFetch = async () => {
            if (isUserLoading || !auth || !db) {
                setPageLoading(true);
                return;
            }
            
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
                    setError("Geçersiz sınıf kodu. Lütfen linki kontrol edin.");
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
        if (!currentClass || !db) {
             toast({ variant: 'destructive', title: 'Sistem hazır değil.' });
             return;
        }
        if (!enteredName.trim() || !enteredSchoolNumber.trim()) {
            toast({ variant: 'destructive', title: 'Lütfen adınızı ve okul numaranızı girin.' });
            return;
        }

        setIsProcessing(true);
        try {
            const studentQuery = query(
                collection(db, 'students'),
                where('classId', '==', currentClass.id),
                where('name', '==', enteredName.trim()),
                where('number', '==', enteredSchoolNumber.trim())
            );
            
            const studentSnap = await getDocs(studentQuery);
            if(studentSnap.empty) {
                 toast({ variant: 'destructive', title: 'Hata', description: 'Girilen bilgilerle öğrenci bulunamadı.' });
                 setIsProcessing(false);
                 return;
            }
            
            const student = { id: studentSnap.docs[0].id, ...studentSnap.docs[0].data() } as Student;

            if (student.positiveSelections?.length || student.negativeSelections?.length || student.leadershipSelections?.length) {
                setError('Bu anketi daha önce doldurdunuz.');
                setStep('error');
                setIsProcessing(false);
                return;
            }
            setLoggedInStudent(student);
            setStep('survey');
            setError('');
        } catch (e) {
             console.error("Login failed:", e);
             toast({ variant: 'destructive', title: 'Giriş Hatası', description: 'Giriş yapılamadı.' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleSelectionChange = (questionId: number, studentId: string, maxSelections: number) => {
        setSelections(prev => {
            const currentSelections = prev[questionId] || [];
            if (currentSelections.includes(studentId)) {
                return { ...prev, [questionId]: currentSelections.filter(id => id !== studentId) };
            } else {
                if (currentSelections.length < maxSelections) {
                    return { ...prev, [questionId]: [...currentSelections, studentId] };
                } else {
                    toast({ variant: 'destructive', title: `En fazla ${maxSelections} kişi seçebilirsiniz.` });
                    return prev;
                }
            }
        });
    };
    
    const handleSubmit = async () => {
        if (!loggedInStudent || !db) return;
        
        setIsProcessing(true);
        
        const updates: Partial<Student> = {};
        const survey = currentClass?.sociogramSurvey;
        survey?.questions.forEach(q => {
            if(selections[q.id]) {
                if(q.type === 'positive') updates.positiveSelections = selections[q.id];
                if(q.type === 'negative') updates.negativeSelections = selections[q.id];
                if(q.type === 'leadership') updates.leadershipSelections = selections[q.id];
            }
        });

        const studentRef = doc(db, 'students', loggedInStudent.id);
        
        try {
            await updateDoc(studentRef, updates);
            toast({ title: 'Cevaplarınız başarıyla kaydedildi!' });
            setStep('voted');
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Hata', description: 'Cevaplarınız kaydedilirken bir sorun oluştu.' });
        } finally {
            setIsProcessing(false);
        }
    };

    if (pageLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    const survey = currentClass?.sociogramSurvey;
    
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-lg">
                <div className="flex flex-col items-center text-center mb-6">
                    <Logo className="h-12 w-12 text-primary" />
                    <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
                        {survey?.title || 'Sosyogram Anketi'}
                    </h1>
                </div>

                {step === 'login' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User /> Öğrenci Girişi</CardTitle>
                            <CardDescription>Anketi doldurmak için lütfen adınızı ve okul numaranızı girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Adın Soyadın" className="pl-9" value={enteredName} onChange={(e) => setEnteredName(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="password" placeholder="Okul Numaran" className="pl-9" value={enteredSchoolNumber} onChange={(e) => setEnteredSchoolNumber(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                            </div>
                            <Button onClick={handleLogin} className="w-full">Giriş Yap ve Ankete Başla</Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'survey' && loggedInStudent && survey && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Merhaba, {loggedInStudent.name}!</CardTitle>
                            <CardDescription>Aşağıdaki soruları dürüstçe cevaplaman sınıfımızın sosyal dinamiklerini anlamamız için önemlidir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {survey.questions.filter(q => q.active).map(q => (
                                <div key={q.id}>
                                    <h3 className="font-semibold mb-2 flex items-center">{getIconComponent(q.icon)} {q.text} <span className="ml-2 text-xs text-muted-foreground">(En fazla {q.maxSelections} kişi)</span></h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {students?.filter(s => s.id !== loggedInStudent.id).map(student => (
                                            <div key={student.id} className="flex items-center space-x-2 p-2 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors">
                                                <Checkbox 
                                                    id={`${q.id}-${student.id}`} 
                                                    checked={(selections[q.id] || []).includes(student.id)}
                                                    onCheckedChange={() => handleSelectionChange(q.id, student.id, q.maxSelections)}
                                                />
                                                <Label htmlFor={`${q.id}-${student.id}`} className="text-sm font-medium w-full cursor-pointer">{student.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <Button onClick={handleSubmit} disabled={isProcessing} className="w-full">
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                <Send className="mr-2 h-4 w-4" /> Cevaplarımı Gönder
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'voted' && (
                    <Card className="text-center p-8">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <CardTitle>Teşekkürler!</CardTitle>
                        <CardDescription>Ankete katıldığın için teşekkür ederiz. Cevapların kaydedildi.</CardDescription>
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
    