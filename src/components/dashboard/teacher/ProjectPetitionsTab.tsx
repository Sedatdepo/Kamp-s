'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, FileDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Student, Class, TeacherProfile, Lesson } from '@/lib/types';
import { saveAs } from 'file-saver';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { exportProjectPetitionsToRtf } from '@/lib/word-export';


interface ProjectPetitionsTabProps {
    classId: string;
    teacherProfile: TeacherProfile | null;
    currentClass: Class | null;
    lessons: Lesson[];
    students: Student[];
}

export function ProjectPetitionsTab({ classId, teacherProfile, currentClass, lessons, students: initialStudents }: ProjectPetitionsTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [students, setStudents] = useState<Partial<Student>[]>([]);

  const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: fetchedStudents } = useCollection<Student>(studentsQuery);

  useEffect(() => {
    if (teacherProfile) {
        setTeacherName(teacherProfile.name || '');
        setSchoolName(teacherProfile.schoolName || '');
    }
  }, [teacherProfile]);
  
  useEffect(() => {
    if (initialStudents) {
      setStudents(initialStudents);
    }
  }, [initialStudents]);

  const importClassList = () => {
    if(!fetchedStudents) return;
    const classStudents = fetchedStudents.map(s => ({
      id: s.id,
      number: s.number,
      name: s.name,
      className: currentClass?.name || '', 
      projectPreferences: s.projectPreferences || [],
    }));
    setStudents(classStudents);
  };
  
  const addStudent = () => {
    setStudents([...students, { id: `manual_${Date.now()}`, number: '', name: '', className: currentClass?.name || '' }]);
  };

  const removeStudent = (id: any) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: any, field: string, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDownloadDoc = () => {
    if (!currentClass || !teacherProfile) {
        toast({ title: "Hata", description: "Gerekli bilgiler yüklenemedi.", variant: "destructive" });
        return;
    }
    exportProjectPetitionsToRtf({ students, lessons, currentClass, teacherProfile });
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Proje Tercih Dilekçesi Oluşturucu</CardTitle>
                <Button onClick={handleDownloadDoc}><FileDown className="mr-2"/> Word Olarak İndir</Button>
            </div>
            <CardDescription>
                Sınıf listenizi aktarın ve öğrencilerin dijitalde yaptığı tercihleri içeren dilekçeleri oluşturun.
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
                    <TableCell><Input value={student.number || ''} onChange={(e) => updateStudent(student.id!, 'number', e.target.value)} placeholder="No" /></TableCell>
                    <TableCell><Input value={student.name || ''} onChange={(e) => updateStudent(student.id!, 'name', e.target.value)} placeholder="İsim" /></TableCell>
                    <TableCell><Input value={student.className || ''} onChange={(e) => updateStudent(student.id!, 'className', e.target.value)} placeholder="Sınıf" /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeStudent(student.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" onClick={addStudent} className="w-full border-dashed"><Plus className="mr-2"/>Öğrenci Ekle</Button>
        </CardContent>
    </Card>
  )
}
