"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Lesson, Student } from '@/lib/types';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

export function ProjectDistributionTab({ classId }: { classId: string }) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [isLessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonQuota, setNewLessonQuota] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const lessonsQuery = appUser?.type === 'teacher' ? query(collection(db, 'lessons'), where('teacherId', '==', appUser.data.uid)) : null;
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery!);

  const handleAssignmentChange = async (studentId: string, lessonId: string) => {
    const studentRef = doc(db, 'students', studentId);
    // 'unassigned' değeri gelirse null olarak kaydet
    await updateDoc(studentRef, { assignedLesson: lessonId === 'unassigned' ? null : lessonId });
  };
  
  const handleAddLesson = async () => {
    if (!newLessonName.trim() || !appUser || appUser.type !== 'teacher') return;
    setIsLoading(true);
    try {
        const lessonColl = collection(db, 'lessons');
        // A simple way to create a unique ID, consider more robust methods for production
        await doc(lessonColl, newLessonName.toLowerCase().replace(/\s/g, '_')).set({
            name: newLessonName,
            quota: newLessonQuota,
            teacherId: appUser.data.uid
        });
        toast({ title: "Başarılı", description: "Ders eklendi."});
        setLessonDialogOpen(false);
        setNewLessonName('');
        setNewLessonQuota(5);
    } catch (e) {
        toast({ variant: 'destructive', title: "Hata", description: "Ders eklenemedi."});
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    // Ayrıca bu dersi olan öğrencilerden de kaldır
    const batch = writeBatch(db);
    const lessonRef = doc(db, 'lessons', lessonId);
    batch.delete(lessonRef);
    students.forEach(student => {
        if(student.assignedLesson === lessonId) {
            const studentRef = doc(db, 'students', student.id);
            batch.update(studentRef, { assignedLesson: null });
        }
    });
    await batch.commit();
    toast({ title: "Başarılı", description: "Ders silindi."});
  }

  const getLessonName = (lessonId: string) => lessons.find(l => l.id === lessonId)?.name || 'N/A';
  const getStudentCountForLesson = (lessonId: string) => students.filter(s => s.assignedLesson === lessonId).length;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline">Öğrenci Atamaları</CardTitle>
          <CardDescription>Öğrencilere tercihlerine göre dersler atayın.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Öğrenci</TableHead>
                  <TableHead>Tercihler</TableHead>
                  <TableHead>Atanan Ders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <ol className="list-decimal list-inside text-sm">
                          {student.projectPreferences.slice(0, 3).map((prefId, index) => (
                            <li key={index} className="truncate">{getLessonName(prefId)}</li>
                          ))}
                           {student.projectPreferences.length > 3 && <li className="text-muted-foreground">...daha fazla</li>}
                        </ol>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={student.assignedLesson || 'unassigned'}
                          onValueChange={(value) => handleAssignmentChange(student.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Ders ata..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">- Atanmamış -</SelectItem>
                            {lessons.map(lesson => (
                              <SelectItem key={lesson.id} value={lesson.id} disabled={getStudentCountForLesson(lesson.id) >= lesson.quota && student.assignedLesson !== lesson.id}>
                                {lesson.name} ({getStudentCountForLesson(lesson.id)}/{lesson.quota})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Dersler</CardTitle>
                <CardDescription>Ders kotalarını yönetin.</CardDescription>
            </div>
            <Dialog open={isLessonDialogOpen} onOpenChange={setLessonDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="icon"><Plus /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-headline">Yeni Ders Ekle</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Ders Adı" value={newLessonName} onChange={e => setNewLessonName(e.target.value)} />
                        <Input type="number" placeholder="Kontenjan" value={newLessonQuota} onChange={e => setNewLessonQuota(Number(e.target.value))} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
                        <Button onClick={handleAddLesson} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Ders Ekle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ders</TableHead>
                    <TableHead>Kontenjan</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {lessonsLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : (
                lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.name}</TableCell>
                    <TableCell>{getStudentCountForLesson(lesson.id)} / {lesson.quota}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
