'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Student, Class, TeacherProfile, Club } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileDown, Users } from 'lucide-react';
import { exportClubPetitionsToRtf } from '@/lib/word-export';

interface ClubPetitionsTabProps {
    classId: string;
    teacherProfile: TeacherProfile | null;
    currentClass: Class | null;
}

export function ClubPetitionsTab({ classId, teacherProfile, currentClass }: ClubPetitionsTabProps) {
    const { db } = useAuth();
    const { toast } = useToast();

    const [teacherName, setTeacherName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [students, setStudents] = useState<Partial<Student>[]>([]);

    const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
    const { data: initialStudents } = useCollection<Student>(studentsQuery);
    
    const clubsQuery = useMemoFirebase(() => (teacherProfile?.id && db ? query(collection(db, 'clubs'), where('teacherId', '==', teacherProfile.id)) : null), [teacherProfile?.id, db]);
    const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

    useEffect(() => {
        if (teacherProfile) {
            setTeacherName(teacherProfile.name || '');
            setSchoolName(teacherProfile.schoolName || '');
        }
    }, [teacherProfile]);

    const importClassList = () => {
        if (!initialStudents) {
            toast({ variant: 'destructive', title: 'Öğrenci listesi yüklenemedi.'});
            return;
        };
        const classStudents = initialStudents.map(s => ({
            id: s.id,
            number: s.number,
            name: s.name,
            className: currentClass?.name || '',
            clubPreferences: s.clubPreferences || [],
        }));
        setStudents(classStudents);
        toast({ title: 'Sınıf listesi aktarıldı!' });
    };

    const addStudentRow = () => {
        setStudents([...students, { id: `manual_${Date.now()}`, number: '', name: '', className: currentClass?.name || '' }]);
    };

    const removeStudentRow = (id: any) => {
        setStudents(students.filter(s => s.id !== id));
    };

    const updateStudentRow = (id: any, field: string, value: string) => {
        setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleDownloadDoc = () => {
        if (students.length === 0) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Listede öğrenci yok.' });
            return;
        }
        if (!currentClass || !teacherProfile || !clubs) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Gerekli veriler yüklenemedi.' });
            return;
        }
        exportClubPetitionsToRtf({ students, clubs, currentClass, teacherProfile });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Kulüp Tercih Dilekçesi Oluşturucu</CardTitle>
                    <Button onClick={handleDownloadDoc}><FileDown className="mr-2"/> Word Olarak İndir</Button>
                </div>
                <CardDescription>
                    Sınıf listenizi aktarın ve öğrencilerin dijitalde yaptığı kulüp tercihlerini içeren dilekçeleri oluşturun.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                    <div>
                        <Label className="text-xs font-semibold">Okul Adı</Label>
                        <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                    </div>
                    <div>
                        <Label className="text-xs font-semibold">Eğitim Yılı</Label>
                        <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                    </div>
                    <div>
                        <Label className="text-xs font-semibold">Sınıf Rehber Öğretmeni</Label>
                        <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={importClassList}><Users className="mr-2"/>Sınıf Listesini Aktar</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">No</TableHead>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead className="w-32">Sınıf</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell><Input value={student.number} onChange={(e) => updateStudentRow(student.id!, 'number', e.target.value)} placeholder="No" /></TableCell>
                                <TableCell><Input value={student.name} onChange={(e) => updateStudentRow(student.id!, 'name', e.target.value)} placeholder="İsim" /></TableCell>
                                <TableCell><Input value={student.className} onChange={(e) => updateStudentRow(student.id!, 'className', e.target.value)} placeholder="Sınıf" /></TableCell>
                                <TableCell><Button variant="ghost" size="icon" onClick={() => removeStudentRow(student.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Button variant="outline" onClick={addStudentRow} className="w-full border-dashed"><Plus className="mr-2"/>Öğrenci Ekle</Button>
            </CardContent>
        </Card>
    )
}
