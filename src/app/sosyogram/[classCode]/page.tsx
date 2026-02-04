
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, getDoc, collection, query, where, updateDoc } from 'firebase/firestore';
import { Student, Class, SociogramQuestion } from '@/lib/types';
import { Loader2, User, Key, Send, CheckCircle, Frown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/Logo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const getIconComponent = (iconName: SociogramQuestion['icon']) => {
    const icons = { Users, UserX, Star, BookOpen, Coffee };
    const Icon = icons[iconName] || Users;
    return <Icon className="mr-2 h-5 w-5" />;
};


export default function SociogramPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db } = useFirebase();
    const { toast } = useToast();
    
    const [classId, setClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'login' | 'survey' | 'voted' | 'error'>('login');

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [enteredSchoolNumber, setEnteredSchoolNumber] = useState('');
    const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selections, setSelections] = useState<{[questionId: number]: string[]}>({});


    useEffect(() => {
        const fetchClassId = async () => {
            if (!db || !classCode) return;
            try {
                const classCodeRef = doc(db, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);
                if (classCodeSnap.exists()) {
                    setClassId(classCodeSnap.data().classId);
                } else {
                    setError("Geçersiz sınıf kodu. Lütfen linki kontrol edin.");
                    setStep('error');
                }
            } catch (e) {
                console.error(e);
                setError("Sınıf bilgileri alınırken bir hata oluştu.");
                setStep('error');
            }
        };
        fetchClassId();
    }, [db, classCode]);

    const classDocRef = useMemoFirebase(() => (classId ? doc(db, 'classes', classId) : null), [db, classId]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);

    const studentsQuery = useMemoFirebase(() => (classId ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [db, classId]);
    const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
    
    useEffect(() => {
        if (!classLoading && currentClass && !currentClass.isSociogramActive) {
            setError("Bu sınıf için sosyogram anketi şu anda aktif değil.");
            setStep('error');
        }
        if (!classLoading && !studentsLoading) {
            setLoading(false);
        }
    }, [classLoading, studentsLoading, currentClass]);

    const handleLogin = () => {
        if (!selectedStudentId || !enteredSchoolNumber) {
            toast({ variant: 'destructive', title: 'Lütfen adınızı seçip okul numaranızı girin.' });
            return;
        }
        const student = students?.find(s => s.id === selectedStudentId);
        if (student && student.number === enteredSchoolNumber) {
             if (student.positiveSelections?.length || student.negativeSelections?.length || student.leadershipSelections?.length) {
                setError('Bu anketi daha önce doldurdunuz.');
                setStep('error');
                return;
            }
            setLoggedInStudent(student);
            setStep('survey');
            setError('');
        } else {
            toast({ variant: 'destructive', title: 'Okul numarası yanlış.' });
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

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
                            <CardDescription>Anketi doldurmak için lütfen adınızı seçin ve okul numaranızı girin.</CardDescription>
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
