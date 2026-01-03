
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Lesson } from '@/lib/types';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


function ProjectSelection({ studentClass, lessons, student, db }: { studentClass: Class | null, lessons: Lesson[], student: any, db: any }) {
  const { toast } = useToast();
  
  const [selected, setSelected] = useState<string[]>(student.projectPreferences || []);

  const handleCheckboxChange = (lessonId: string) => {
    setSelected(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      }
      if (prev.length < 5) {
        return [...prev, lessonId];
      }
      toast({ variant: 'destructive', title: 'En fazla 5 tercih yapabilirsiniz.' });
      return prev;
    });
  };

  const handleSavePreferences = async () => {
    if (!db) return;
    const studentRef = doc(db, 'students', student.id);
    await updateDoc(studentRef, { projectPreferences: selected });
    toast({ title: 'Tercihleriniz kaydedildi!' });
  };

  const assignedLesson = lessons.find(l => l.id === student.assignedLesson);

  if (assignedLesson) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Atanan Projeniz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-6 rounded-lg text-center">
            <p className="text-muted-foreground">Size atanan proje:</p>
            <p className="text-2xl font-bold text-primary mt-2">{assignedLesson.name}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!studentClass?.isProjectSelectionActive) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Proje Tercih Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Proje tercih dönemi henüz başlamadı veya sona erdi. Lütfen öğretmeninizden bilgi alın.</p>
                </div>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Proje Tercih Seçimi</CardTitle>
        <CardDescription>Tercih sırasına göre en fazla 5 ders seçin. İlk seçtiğiniz ders 1. tercihiniz olacaktır.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className='space-y-2'>
            {lessons.map(lesson => (
              <div key={lesson.id} className="flex items-center space-x-2">
                <Checkbox
                  id={lesson.id}
                  checked={selected.includes(lesson.id)}
                  onCheckedChange={() => handleCheckboxChange(lesson.id)}
                />
                <label htmlFor={lesson.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {lesson.name}
                </label>
                {selected.includes(lesson.id) && <span className="text-xs font-bold text-primary">({selected.indexOf(lesson.id) + 1})</span>}
              </div>
            ))}
          </div>
          <Button onClick={handleSavePreferences}>Tercihleri Kaydet</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectTab() {
  const { appUser, db } = useAuth();

  if (appUser?.type !== 'student') return null;

  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const { data: studentClass, loading: classLoading } = useFirestore<Class>(
    `class-${classId}`,
    useMemo(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db])
  );
  
  const lessonsQuery = useMemo(() => {
    if (!studentClass?.teacherId || !db) return null;
    return query(collection(db, 'lessons'), where('teacherId', '==', studentClass.teacherId));
  }, [studentClass?.teacherId, db]);

  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson[]>('lessons', lessonsQuery);

  if (classLoading || lessonsLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }
  
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Proje Ödevim</CardTitle>
          <CardDescription>
            Hoş geldin, {appUser.data.name}! Buradan proje tercihlerini yapabilirsin.
          </CardDescription>
        </CardHeader>
      </Card>

      <ProjectSelection studentClass={studentClass} lessons={lessons || []} student={appUser.data} db={db} />
    </div>
  );
}

