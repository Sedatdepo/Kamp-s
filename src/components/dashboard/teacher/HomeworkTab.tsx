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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LessonManager } from './LessonManager';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- ProjectAssignmentView Component ---
interface ProjectAssignmentViewProps {
  classId: string;
  teacherId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
  students: Student[];
  lessons: Lesson[];
}

export function ProjectAssignmentView({ classId, teacherId, teacherProfile, currentClass, students, lessons }: ProjectAssignmentViewProps) {
  const { db } = useAuth();
  const { toast } = useToast();

  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [filterLessonId, setFilterLessonId] = useState<string>('all');

  useEffect(() => {
    if (students) {
      const sorted = [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true}));
      setLocalStudents(sorted);
    }
  }, [students]);

  const handleFieldChange = (studentId: string, field: keyof Student, value: string | boolean | null) => {
    const finalValue = value === 'unassigned' ? null : value;
    setLocalStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          // Update both assignedLesson and hasProject in the local state for immediate UI feedback.
          const hasProject = !!finalValue;
          return { ...s, [field]: finalValue, hasProject };
        }
        return s;
      })
    );
  };
  
  const handleSaveChanges = async () => {
    if (!db || !students) return;
    const batch = writeBatch(db);
    localStudents.forEach(student => {
      const originalStudent = students.find(s => s.id === student.id);
      if (JSON.stringify(student) !== JSON.stringify(originalStudent)) {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, {
          assignedLesson: student.assignedLesson || null,
          hasProject: student.hasProject || false,
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
  
  const handleResetProjects = async () => {
    if (!db || !students || students.length === 0) return;

    const batch = writeBatch(db);
    students.forEach(student => {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, {
            assignedLesson: null,
            hasProject: false,
            projectPreferences: []
        });
    });

    try {
        await batch.commit();
        setLocalStudents(prev => prev.map(s => ({
            ...s,
            assignedLesson: null,
            hasProject: false,
            projectPreferences: []
        })));
        toast({ title: 'Tüm Projeler Sıfırlandı', description: 'Tüm öğrencilerin proje atamaları ve tercihleri temizlendi.' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Sıfırlama işlemi başarısız oldu.' });
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
    if (filterLessonId === 'all' || !localStudents) return localStudents;
    return localStudents.filter(s => s.projectPreferences.includes(filterLessonId));
  }, [localStudents, filterLessonId]);

  const isLoading = !lessons;

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
                            disabled={!currentClass}
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
                        <div className="flex gap-2">
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                  <RotateCcw className="mr-2 h-4 w-4" /> Tümünü Sıfırla
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Tüm Proje Atamalarını Sıfırla?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu işlem, bu sınıftaki TÜM öğrencilerin proje atamalarını ve proje tercihlerini kalıcı olarak temizleyecektir. Bu işlem geri alınamaz. Emin misiniz?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>İptal</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleResetProjects} className="bg-destructive hover:bg-destructive/90">Sıfırla</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button onClick={handleSaveChanges}>
                                <Save className="mr-2 h-4 w-4" /> Atamaları Kaydet
                            </Button>
                        </div>
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
    
    const allStudentsForTeacherQuery = useMemoFirebase(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useCollection<Student>(allStudentsForTeacherQuery);

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
                    students={students}
                    lessons={lessons}
                />
            </TabsContent>
            <TabsContent value="petitions" className="mt-4">
                 <ProjectPetitionsTab 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    lessons={lessons}
                    students={students}
                 />
            </TabsContent>
        </Tabs>
    );
}
