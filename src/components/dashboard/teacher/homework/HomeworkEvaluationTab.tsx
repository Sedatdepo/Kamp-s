'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Student, Class, TeacherProfile, Submission } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { collection, query, where, doc, updateDoc, writeBatch, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { exportHomeworkEvaluationToRtf } from '@/lib/word-export';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';


export const HomeworkEvaluationTab = ({ classId, students, currentClass, teacherProfile }: { classId: string, students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const [selectedHwId, setSelectedHwId] = useState<string | null>(null);
    const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});
    const [submissions, setSubmissions] = useState<{ [studentId: string]: Submission | null }>({});

    const homeworksQuery = useMemo(() => {
        if (!db || !classId) return null;
        // Sadece rubrik içeren (yani kütüphaneden atanmış) ödevleri getir
        return query(collection(db, 'classes', classId, 'homeworks'), where('rubric', '!=', null));
    }, [db, classId]);

    const { data: homeworks, loading: homeworksLoading } = useFirestore<any[]>(`performance-homeworks-${classId}`, homeworksQuery);
    
    const selectedHomework = useMemo(() => {
        if (!selectedHwId) return null;
        return homeworks.find(hw => hw.id === selectedHwId);
    }, [selectedHwId, homeworks]);
    
    const assignedStudents = useMemo(() => {
        if (!selectedHomework || !selectedHomework.assignedStudents) return [];
        return students.filter(s => selectedHomework.assignedStudents.includes(s.id));
    }, [selectedHomework, students]);

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!selectedHomework) return;
            const subs: { [studentId: string]: Submission | null } = {};
            const subsQuery = query(collection(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`));
            const snapshot = await getDocs(subsQuery);
            snapshot.forEach(doc => {
                const sub = { id: doc.id, ...doc.data() } as Submission;
                subs[sub.studentId] = sub;
            });
            setSubmissions(subs);

            // Populate scores from existing submissions
            const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
            Object.values(subs).forEach(sub => {
                if (sub && sub.rubricScores) {
                    initialScores[sub.studentId] = sub.rubricScores;
                }
            });
            setScores(initialScores);
        };
        fetchSubmissions();
    }, [selectedHomework, db, classId]);


    const handleScoreChange = (studentId: string, criteriaLabel: string, value: string) => {
        const newScore = parseInt(value, 10) || 0;
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [criteriaLabel]: newScore,
            }
        }));
    };
    
    const handleToggleSubmission = async (student: Student, checked: boolean) => {
        if (!db || !selectedHomework) return;
        
        const subColRef = collection(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`);

        if (checked) {
            // Create a submission
            const newSub: Omit<Submission, 'id'> = {
                studentId: student.id,
                studentName: student.name,
                studentNumber: student.number,
                submittedAt: new Date().toISOString(),
                homeworkId: selectedHomework.id,
            };
            const docRef = await addDoc(subColRef, newSub);
            setSubmissions(prev => ({...prev, [student.id]: { id: docRef.id, ...newSub }}));
            toast({title: `${student.name} için ödev teslim edildi olarak işaretlendi.`});
        } else {
            // Delete the submission
            const submission = submissions[student.id];
            if (submission) {
                const subDocRef = doc(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`, submission.id);
                await deleteDoc(subDocRef);
                setSubmissions(prev => ({...prev, [student.id]: null}));
                toast({title: `${student.name} için teslimat iptal edildi.`, variant: 'destructive'});
            }
        }
    };
    
    const handleSaveScores = async () => {
        if (!db || !selectedHomework) return;
        const batch = writeBatch(db);

        Object.keys(scores).forEach(studentId => {
            const submission = submissions[studentId];
            if (submission) {
                const submissionRef = doc(db, `classes/${classId}/homeworks/${selectedHomework.id}/submissions`, submission.id);
                const studentScores = scores[studentId];
                const totalScore = Object.values(studentScores).reduce((sum, val) => sum + val, 0);
                batch.update(submissionRef, { grade: totalScore, rubricScores: studentScores });
            }
        });
        
        try {
            await batch.commit();
            toast({ title: "Notlar başarıyla kaydedildi!" });
        } catch (error) {
             toast({ title: "Hata!", description: "Notlar kaydedilirken bir sorun oluştu.", variant: 'destructive' });
        }
    };

    const handleExport = () => {
        if (currentClass && selectedHomework) {
            exportHomeworkEvaluationToRtf({
                students: assignedStudents,
                selectedHomework,
                scores,
                currentClass,
                teacherProfile,
            });
        }
    }


    if (homeworksLoading) return <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performans Ödevi Değerlendirme</CardTitle>
                <CardDescription>Atadığınız performans ödevlerini seçerek öğrencilerinizi kriterlere göre notlayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <label className="font-medium">Değerlendirilecek Ödev:</label>
                    <select 
                        value={selectedHwId || ''} 
                        onChange={e => setSelectedHwId(e.target.value)}
                        className="flex-grow p-2 border rounded-md"
                    >
                        <option value="" disabled>Bir ödev seçin...</option>
                        {homeworks.map(hw => (
                            <option key={hw.id} value={hw.id}>{hw.text}</option>
                        ))}
                    </select>
                    <Button onClick={handleExport} disabled={!selectedHomework} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        RTF Olarak İndir
                    </Button>
                </div>

                {selectedHomework && (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-1/4">Öğrenci</TableHead>
                                    <TableHead className="w-[120px] text-center">Teslim Durumu</TableHead>
                                    {selectedHomework.rubric.map((item: any) => (
                                        <TableHead key={item.label} className="text-center">{item.label} ({item.score}p)</TableHead>
                                    ))}
                                    <TableHead className="text-center w-[100px]">Toplam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignedStudents.map(student => {
                                    const submission = submissions[student.id];
                                    const studentScores = scores[student.id] || {};
                                    const totalScore = Object.values(studentScores).reduce((sum, val) => sum + val, 0);
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={!!submission}
                                                    onCheckedChange={(checked) => handleToggleSubmission(student, !!checked)}
                                                />
                                            </TableCell>
                                            {selectedHomework.rubric.map((item: any) => (
                                                <TableCell key={item.label} className="text-center">
                                                    <Input
                                                        type="number"
                                                        max={item.score}
                                                        min={0}
                                                        disabled={!submission}
                                                        value={studentScores[item.label] || ''}
                                                        onChange={e => handleScoreChange(student.id, item.label, e.target.value)}
                                                        className="w-20 mx-auto text-center h-8"
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center font-bold text-lg">{totalScore}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                         <div className="p-4 bg-muted flex justify-end">
                            <Button onClick={handleSaveScores} disabled={Object.keys(scores).length === 0}>Değerlendirmeyi Kaydet</Button>
                        </div>
                    </div>
                )}
                 {homeworks.length === 0 && !homeworksLoading && (
                    <div className="text-center p-10 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground">Bu sınıfa atanmış performans ödevi bulunmuyor.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
