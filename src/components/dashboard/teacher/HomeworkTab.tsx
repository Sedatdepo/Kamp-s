'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Class, Student, TeacherProfile, Lesson } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { LiveHomeworkManagement } from './homework/LiveHomeworkManagement';
import { HomeworkEvaluationTab } from './homework/HomeworkEvaluationTab';
import { HomeworkLibrary } from './homework/HomeworkLibrary';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ProjectPetitionsTab } from './ProjectPetitionsTab';
import { ProjectGradingTab } from './ProjectGradingTab';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';


interface HomeworkTabProps {
  classId: string;
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  classes: Class[];
  lessons: Lesson[];
}

export function ProjectAssignmentView({
    classId,
    teacherId,
    teacherProfile,
    currentClass,
    students,
    lessons
}: {
    classId: string;
    teacherId: string;
    teacherProfile: TeacherProfile | null;
    currentClass: Class | null;
    students: Student[];
    lessons: Lesson[];
}) {
    const { db } = useAuth();
    const { toast } = useToast();

    const [localStudents, setLocalStudents] = useState<Student[]>([]);
    const [filterLessonId, setFilterLessonId] = useState<string>('all');
    
    useEffect(() => {
        const sorted = [...students].sort((a, b) => {
            const aPref = a.projectPreferences || [];
            const bPref = b.projectPreferences || [];
            if (aPref.length === 0 && bPref.length > 0) return 1;
            if (aPref.length > 0 && bPref.length === 0) return -1;
            return a.number.localeCompare(b.number, 'tr', { numeric: true });
        });
        setLocalStudents(sorted);
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (filterLessonId === 'all') {
            return localStudents;
        }
        return localStudents.filter(s => (s.projectPreferences || [])[0] === filterLessonId);
    }, [localStudents, filterLessonId]);

    const handleAssignmentChange = (studentId: string, lessonId: string | null) => {
        setLocalStudents(prev =>
            prev.map(s => (s.id === studentId ? { ...s, assignedLesson: lessonId } : s))
        );
    };
    
    const handleSaveChanges = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        localStudents.forEach(student => {
            const originalStudent = students.find(s => s.id === student.id);
            if (student.assignedLesson !== originalStudent?.assignedLesson) {
                const studentRef = doc(db, 'students', student.id);
                batch.update(studentRef, { assignedLesson: student.assignedLesson, hasProject: !!student.assignedLesson });
            }
        });
        try {
            await batch.commit();
            toast({ title: "Başarılı!", description: "Tüm proje atamaları güncellendi." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Hata", description: "Değişiklikler kaydedilemedi." });
        }
    };

     const handleToggleChange = async (checked: boolean) => {
        if (!currentClass || !db) return;
        const classRef = doc(db, 'classes', classId);
        try {
            await updateDoc(classRef, { isProjectSelectionActive: checked });
            toast({ title: 'Başarılı', description: `Proje seçimi öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.` });
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.' });
        }
    };


    if (!lessons) return <Loader2 className="animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Proje Ödevi Tercih ve Atama</CardTitle>
                     <div className="flex items-center space-x-2">
                        <label htmlFor="election-toggle" className="text-sm font-medium">Öğrenci Tercihi Aktif</label>
                        <Switch id="election-toggle" checked={currentClass?.isProjectSelectionActive || false} onCheckedChange={handleToggleChange} disabled={!currentClass} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead>Tercihleri</TableHead>
                            <TableHead className="w-[200px]">Atanan Proje</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map(student => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                <TableCell>
                                    <ol className="list-decimal list-inside text-xs">
                                        {(student.projectPreferences || []).map(prefId => {
                                            const lesson = lessons.find(l => l.id === prefId);
                                            return <li key={prefId}>{lesson ? lesson.name : 'Bilinmeyen Ders'}</li>
                                        })}
                                    </ol>
                                </TableCell>
                                <TableCell>
                                    <select
                                        value={student.assignedLesson || ''}
                                        onChange={(e) => handleAssignmentChange(student.id, e.target.value || null)}
                                        className="w-full p-2 border rounded-md text-sm"
                                    >
                                        <option value="">Proje Ata</option>
                                        {lessons.map(lesson => (
                                            <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                                        ))}
                                    </select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="flex justify-end mt-4">
                    <Button onClick={handleSaveChanges}>Değişiklikleri Kaydet</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes, lessons }: HomeworkTabProps) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemoFirebase(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useCollection<Student>(allStudentsForTeacherQuery);

    const studentsForCurrentClass = useMemo(() => {
      if (!currentClass) return [];
      return students.filter(s => s.classId === currentClass!.id);
    }, [students, currentClass]);

    return (
        <Tabs defaultValue="live">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                    <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                    <TabsTrigger value="library">Performans Ödevleri</TabsTrigger>
                    <TabsTrigger value="project-assignment">Proje Tercihleri</TabsTrigger>
                    <TabsTrigger value="petitions">Proje Dilekçeleri</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="live" className="mt-4">
                <LiveHomeworkManagement
                    classId={classId}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                    students={students}
                />
            </TabsContent>
            <TabsContent value="evaluation" className="mt-4">
                <HomeworkEvaluationTab
                    classId={classId}
                    students={students}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                />
            </TabsContent>
            <TabsContent value="library" className="mt-4">
                <HomeworkLibrary 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    classes={classes}
                    students={allStudents || []}
                />
            </TabsContent>
            <TabsContent value="project-assignment" className="mt-4">
                <ProjectAssignmentView
                    classId={classId}
                    teacherId={teacherProfile!.id}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    students={studentsForCurrentClass} // Pass filtered students
                    lessons={lessons}
                />
            </TabsContent>
            <TabsContent value="petitions" className="mt-4">
                 <ProjectPetitionsTab 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    lessons={lessons || []}
                    students={studentsForCurrentClass}
                 />
            </TabsContent>
        </Tabs>
    );
}
