// StudentDashboard.tsx
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

function ProjectSelection() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const { data: classes, loading: classLoading } = useFirestore<Class>('classes');
  const studentClass = useMemo(() => classes.find(c => c.id === appUser.data.classId), [classes, appUser.data.classId]);

  const [selected, setSelected] = useState<string[]>(appUser.data.projectPreferences || []);

  const lessonsQuery = useMemo(() => {
    if (!studentClass?.teacherId || !db) return null;
    return query(collection(db, 'lessons'), where('teacherId', '==', studentClass.teacherId));
  }, [studentClass?.teacherId, db]);

  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery);

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
    if (appUser.type !== 'student' || !db) return;
    const studentRef = doc(db, 'students', appUser.data.id);
    await updateDoc(studentRef, { projectPreferences: selected });
    toast({ title: 'Tercihleriniz kaydedildi!' });
  };

  const assignedLesson = lessons.find(l => l.id === appUser.data.assignedLesson);

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

  if (classLoading || !studentClass?.isProjectSelectionActive) {
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
        {lessonsLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
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
        )}
      </CardContent>
    </Card>
  );
}

export function HomeTab() {
  const { appUser } = useAuth();
  if (appUser?.type !== 'student') return null;
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Anasayfa</CardTitle>
          <CardDescription>
            Hoş geldin, {appUser.data.name}! Burası senin kişisel panon. 
            Menüden duyurulara, formlara ve proje tercihlerine ulaşabilirsin.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Gelecekte burada sana özel bilgiler ve kısayollar yer alacak.</p>
        </CardContent>
      </Card>
      <ProjectSelection />
    </div>
  );
}
