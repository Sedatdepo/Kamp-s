'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Student, Homework, Submission } from '@/lib/types';
import { Loader2, ArrowLeft, BookText, Clock, CalendarIcon, ClipboardList, Paperclip, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { saveAs } from 'file-saver';
import { Header } from '@/components/dashboard/Header';

const handleDownload = (file: { dataUrl: string, name: string }) => {
    saveAs(file.dataUrl, file.name);
};

const HomeworkDetailView = ({ homework, onBack }: { homework: Homework, onBack: () => void }) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{homework.text}</CardTitle>
                        <CardDescription>Ödevinizin detayları ve değerlendirme kriterleri aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                 {(homework.file || homework.link) && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Ekler</h3>
                        <div className="flex flex-col space-y-2">
                           {homework.file && (
                               <Button variant="outline" onClick={() => handleDownload(homework.file!)} className="justify-start">
                                   <Paperclip className="h-4 w-4 mr-2" />
                                   {homework.file.name}
                               </Button>
                           )}
                           {homework.link && (
                               <a href={homework.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline p-2 rounded-md hover:bg-blue-50">
                                   <ExternalLink className="h-4 w-4" />
                                   <span>{homework.linkText || homework.link}</span>
                               </a>
                           )}
                        </div>
                    </div>
                )}
                {homework.instructions && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Yönerge</h3>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm prose">
                            <p>{homework.instructions}</p>
                        </div>
                    </div>
                )}
                {homework.rubric && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><ClipboardList/> Değerlendirme Kriterleri</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kriter</TableHead>
                                        <TableHead className="text-right">Puan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homework.rubric.map((item: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">{item.score}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const HomeworkItem = ({ homework, onSelect }: { homework: Homework, onSelect: () => void }) => {
    return (
        <div onClick={onSelect} className={`cursor-pointer border p-4 rounded-lg shadow-sm space-y-3 transition-all hover:border-primary/50 bg-background`}>
             <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                {homework.dueDate && (
                    <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                )}
             </div>
             <p className="text-sm font-semibold">{homework.text}</p>
             <p className="text-xs text-muted-foreground">(Detayları ve değerlendirme kriterlerini görmek için tıklayın)</p>
        </div>
    )
}

export default function StudentPerformanceHomeworkPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    useEffect(() => {
        const authData = sessionStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setStudent(storedStudent);
            } catch (e) {
                console.error("Failed to parse student auth data", e);
            }
        }
    }, []);

    // Real-time listener for student data
    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;
        const studentRef = doc(db, 'students', student.id);
        const unsubscribe = onSnapshot(studentRef, (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                 try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on performance homeworks page", e);
                }
            }
        });
        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);


    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !student?.classId || !student?.id) return null;
        return query(
            collection(db, 'classes', student.classId, 'homeworks'), 
            where('assignmentType', '==', 'performance'),
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, student?.classId, student?.id]);

    const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

    const sortedHomeworks = useMemo(() => {
        if (!homeworks) return [];
        return [...homeworks].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
    }, [homeworks]);

    if (isUserLoading || !student || homeworksLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (selectedHomework) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Header studentMode={true} studentData={student} />
                <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                    <HomeworkDetailView homework={selectedHomework} onBack={() => setSelectedHomework(null)} />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Performans Ödevlerim</h1>
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
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookText className="h-6 w-6"/>
                            Performans Ödevlerim
                        </CardTitle>
                        <CardDescription>Kütüphaneden atanan performans ödevlerinizi buradan görebilirsiniz.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {sortedHomeworks.length > 0 ? (
                                sortedHomeworks.map((hw) => (
                                    <HomeworkItem key={hw.id} homework={hw} onSelect={() => setSelectedHomework(hw)} />
                                ))
                            ) : (
                                <div className="text-center py-10 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Henüz verilmiş bir performans ödevi yok.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
