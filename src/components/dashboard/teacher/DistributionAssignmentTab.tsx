
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useCollection } from '@/firebase'; // Changed import
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile, Lesson } from '@/lib/types';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LessonManager } from './LessonManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface DistributionAssignmentTabProps {
  classId: string;
  teacherId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
  students: Student[];
}

export function DistributionAssignmentTab({ classId, teacherId, teacherProfile, currentClass, students }: DistributionAssignmentTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();

  const lessonsQuery = useMemo(() => (teacherId && db ? query(collection(db, 'lessons'), where('teacherId', '==', teacherId)) : null), [teacherId, db]);
  // Changed useFirestore to useCollection
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [filterLessonId, setFilterLessonId] = useState<string>('all');

  useEffect(() => {
    if (students) {
      setLocalStudents(students);
    }
  }, [students]);

  const handleFieldChange = (studentId: string, field: keyof Student, value: string | boolean | null) => {
    // If "unassigned" is selected, treat it as clearing the value.
    const finalValue = value === 'unassigned' ? null : value;
    setLocalStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, [field]: finalValue } : s)
    );
  };
  
  const handleSaveChanges = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    localStudents.forEach(student => {
      const originalStudent = students.find(s => s.id === student.id);
      if (JSON.stringify(student) !== JSON.stringify(originalStudent)) {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, {
          assignedLesson: student.assignedLesson || null,
        });
      }
    });

    try {
      await batch.commit();
      toast({ title: 'Başarılı', description: 'Tüm proje atamaları güncellendi.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Değişiklikler kaydedilemedi.' });
    }
  };

  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', classId);
    try {
      await updateDoc(classRef, { isProjectSelectionActive: checked });
      toast({
        title: 'Başarılı',
        description: `Proje seçimi öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme sırasında bir sorun oluştu.',
      });
    }
  };

  const filteredStudents = useMemo(() => {
    if (filterLessonId === 'all') return localStudents;
    return localStudents.filter(s => s.projectPreferences.includes(filterLessonId));
  }, [localStudents, filterLessonId]);

  const isLoading = lessonsLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-headline">Proje Dersleri ve Kontenjanları</CardTitle>
                            <CardDescription>Proje olarak sunulacak dersleri ve öğrenci kotalarını yönetin.</CardDescription>
                        </div>
                        <Switch
                            checked={currentClass?.isProjectSelectionActive || false}
                            onCheckedChange={handleToggleChange}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <LessonManager teacherId={teacherId} students={students} />
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-headline">Proje Atama</CardTitle>
                            <CardDescription>Öğrenci tercihlerine göre proje dersi ataması yapın.</CardDescription>
                        </div>
                        <Button onClick={handleSaveChanges}>
                            <Save className="mr-2 h-4 w-4" /> Atamaları Kaydet
                        </Button>
                    </div>
                     <div className="mt-4">
                        <Label>Filtrele:</Label>
                         <Select value={filterLessonId} onValueChange={setFilterLessonId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Bir ders seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                                {lessons?.map(lesson => (
                                    <SelectItem key={lesson.id} value={lesson.id}>{lesson.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Öğrenci</TableHead>
                                <TableHead>Tercihleri</TableHead>
                                <TableHead className="w-[250px]">Atanan Proje Dersi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {filteredStudents && filteredStudents.length > 0 ? filteredStudents.map(student => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                <TableCell>
                                    {!student.assignedLesson && (
                                        <ol className="list-decimal list-inside text-xs">
                                            {(student.projectPreferences || []).map(prefId => {
                                                const lesson = lessons?.find(l => l.id === prefId);
                                                return <li key={prefId}>{lesson ? lesson.name : 'Bilinmeyen Ders'}</li>
                                            })}
                                        </ol>
                                    )}
                                </TableCell>
                                <TableCell>
                                     <Select 
                                        value={student.assignedLesson || 'unassigned'} 
                                        onValueChange={(value) => handleFieldChange(student.id, 'assignedLesson', value)}
                                     >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Proje atayın..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Yok</SelectItem>
                                            {lessons?.map(lesson => (
                                                <SelectItem key={lesson.id} value={lesson.id}>{lesson.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                            )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
                                    Bu filtreye uygun öğrenci bulunmuyor.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
