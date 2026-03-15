'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Class, Student, TeacherProfile, Lesson } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { LiveHomeworkManagement } from './LiveHomeworkManagement';
import { HomeworkEvaluationTab } from './HomeworkEvaluationTab';
import { HomeworkLibrary } from './HomeworkLibrary';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ProjectPetitionsTab } from '../ProjectPetitionsTab';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { LessonManager } from '../LessonManager';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


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

    const handleToggleAssignment = (studentId: string, lessonId: string) => {
        setLocalStudents(prev =>
            prev.map(s => {
                if (s.id !== studentId) return s;
                
                const currentIds = s.assignedLessonIds || [];
                const isSelected = currentIds.includes(lessonId);
                
                const nextIds = isSelected 
                    ? currentIds.filter(id => id !== lessonId)
                    : [...currentIds, lessonId];
                
                return { 
                    ...s, 
                    assignedLessonIds: nextIds,
                    assignedLesson: nextIds.length > 0 ? nextIds[0] : null // Backward compatibility
                };
            })
        );
    };
    
    const handleSaveChanges = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        localStudents.forEach(student => {
            const originalStudent = students.find(s => s.id === student.id);
            // Check if assignedLessonIds changed
            const currentIds = student.assignedLessonIds || [];
            const originalIds = originalStudent?.assignedLessonIds || [];
            
            if (JSON.stringify(currentIds) !== JSON.stringify(originalIds)) {
                const studentRef = doc(db, 'students', student.id);
                batch.update(studentRef, { 
                    assignedLessonIds: currentIds, 
                    assignedLesson: currentIds.length > 0 ? currentIds[0] : null,
                    hasProject: currentIds.length > 0 
                });
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                <LessonManager teacherId={teacherId} students={students} />
            </div>
            <div className="lg:col-span-2">
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
                                    <TableHead className="w-[200px]">Atanan Projeler</TableHead>
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
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {(student.assignedLessonIds || []).map(id => {
                                                        const lesson = lessons.find(l => l.id === id);
                                                        return lesson ? (
                                                            <Badge key={id} variant="secondary" className="text-[10px] py-0 px-1">
                                                                {lesson.name}
                                                                <button onClick={() => handleToggleAssignment(student.id, id)} className="ml-1 hover:text-red-500">
                                                                    <X size={10} />
                                                                </button>
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                </div>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-between">
                                                            Proje Ekle/Çıkar
                                                            <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[200px] p-0">
                                                        <ScrollArea className="h-72">
                                                            <div className="p-2 space-y-1">
                                                                {lessons.map(lesson => (
                                                                    <div 
                                                                        key={lesson.id} 
                                                                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                                                        onClick={() => handleToggleAssignment(student.id, lesson.id)}
                                                                    >
                                                                        <Checkbox 
                                                                            checked={(student.assignedLessonIds || []).includes(lesson.id)}
                                                                            onCheckedChange={() => handleToggleAssignment(student.id, lesson.id)}
                                                                        />
                                                                        <label className="text-sm cursor-pointer">{lesson.name}</label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
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
            </div>
        </div>
    );
}

interface HomeworkTabProps {
  classId: string;
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  classes: Class[];
  lessons: Lesson[];
}

export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes, lessons }: HomeworkTabProps) {
    const { db } = useAuth();
    const { toast } = useToast();

    const handleTogglePublish = async (field: 'isRegularHomeworkPublished' | 'isPerformanceHomeworkPublished' | 'isProjectHomeworkPublished', checked: boolean) => {
        if (!currentClass || !db) return;
        const classRef = doc(db, 'classes', classId);
        try {
            await updateDoc(classRef, { [field]: checked });
            toast({ title: 'Başarılı', description: `Modül yayın durumu güncellendi.` });
        } catch {
            toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.' });
        }
    };
    
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
             <div className="flex justify-between items-center mb-4">
                <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                        <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                        <TabsTrigger value="library">Performans Ödevleri</TabsTrigger>
                        <TabsTrigger value="project-assignment">Proje Tercihleri</TabsTrigger>
                        <TabsTrigger value="petitions">Proje Dilekçeleri</TabsTrigger>
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <Card className="ml-4 p-3 flex-shrink-0">
                  <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                      <div className="flex items-center space-x-2">
                          <Switch id="publish-regular" checked={currentClass?.isRegularHomeworkPublished || false} onCheckedChange={(c) => handleTogglePublish('isRegularHomeworkPublished', c)} disabled={!currentClass} />
                          <Label htmlFor="publish-regular" className="text-xs font-medium">Günlük</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                          <Switch id="publish-performance" checked={currentClass?.isPerformanceHomeworkPublished || false} onCheckedChange={(c) => handleTogglePublish('isPerformanceHomeworkPublished', c)} disabled={!currentClass} />
                          <Label htmlFor="publish-performance" className="text-xs font-medium">Performans</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                          <Switch id="publish-project" checked={currentClass?.isProjectHomeworkPublished || false} onCheckedChange={(c) => handleTogglePublish('isProjectHomeworkPublished', c)} disabled={!currentClass} />
                          <Label htmlFor="publish-project" className="text-xs font-medium">Proje</Label>
                      </div>
                  </div>
                </Card>
            </div>
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
