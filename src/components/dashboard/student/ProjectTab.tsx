
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Class, Lesson, Homework, Student } from '@/lib/types';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ClipboardList } from 'lucide-react';
import { assignmentsData } from '@/lib/maarif-modeli-odevleri';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';


function ProjectDetailView({ projectHomework, student, onBack }: { projectHomework: Homework, student: Student, onBack: () => void }) {

    const projectScores = useMemo(() => {
        return student.term2Grades?.projectScores || student.term1Grades?.projectScores;
    }, [student]);

    const totalScore = useMemo(() => {
        if (!projectScores) return 0;
        return Object.values(projectScores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    }, [projectScores]);

    const maxScore = useMemo(() => {
        return projectHomework.rubric?.reduce((sum: number, item: any) => sum + (Number(item.score) || 0), 0) || 100;
    }, [projectHomework.rubric]);
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{projectHomework.text}</CardTitle>
                        <CardDescription>Projenizin detayları ve değerlendirme kriterleri aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {projectHomework.instructions && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Proje Yönergesi</h3>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm prose">
                            <p>{projectHomework.instructions}</p>
                        </div>
                    </div>
                )}
                {projectHomework.rubric && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><ClipboardList/> Değerlendirme Kriterleri</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kriter</TableHead>
                                        <TableHead className="text-right">Alınan Puan / Maks. Puan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectHomework.rubric.map((item: any) => {
                                        const score = projectScores?.[item.label];
                                        const hasScore = score !== undefined && score !== null;
                                        return (
                                            <TableRow key={item.label}>
                                                <TableCell>
                                                    <p className="font-medium">{item.label}</p>
                                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-lg w-48">
                                                    {hasScore ? (
                                                        <span>{score} / {item.score}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground font-normal">- / {item.score}</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                     <TableRow className="bg-muted/50 font-bold text-primary">
                                        <TableCell>Toplam Proje Notu</TableCell>
                                        <TableCell className="text-right text-xl">
                                            {totalScore} / {maxScore}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

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
  const [activeProject, setActiveProject] = useState<Homework | null>(null);

  if (appUser?.type !== 'student') return null;

  const classId = appUser.data.classId;
  const assignedLessonId = appUser.data.assignedLesson;

  const studentClassQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: studentClass, isLoading: classLoading } = useDoc<Class>(studentClassQuery);
  
  const lessonsQuery = useMemoFirebase(() => {
    if (!studentClass?.teacherId || !db) return null;
    return query(collection(db, 'lessons'), where('teacherId', '==', studentClass.teacherId));
  }, [studentClass?.teacherId, db]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  
  const projectHomeworkRef = useMemoFirebase(() => {
    if (!db || !classId || !assignedLessonId || !assignedLessonId.startsWith('project_')) {
      return null;
    }
    const projectHomeworkId = assignedLessonId.replace('project_', '');
    return doc(db, 'classes', classId, 'homeworks', `project_${projectHomeworkId}`);
  }, [db, classId, assignedLessonId]);

  const { data: projectHomework, isLoading: homeworksLoading } = useDoc<Homework>(projectHomeworkRef);

  const isLoading = classLoading || lessonsLoading || (assignedLessonId?.startsWith('project_') ? homeworksLoading : false);
  
  if (isLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }
  
  if (activeProject) {
      return <ProjectDetailView projectHomework={activeProject} student={appUser.data} onBack={() => setActiveProject(null)} />
  }

  let assignedProjectName = null;
  if (assignedLessonId) {
      if (assignedLessonId.startsWith('project_')) {
          if (projectHomework) {
            assignedProjectName = projectHomework.text;
          }
      } else {
          const lesson = lessons?.find(l => l.id === assignedLessonId);
          if (lesson) {
              assignedProjectName = lesson.name;
          }
      }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Proje Ödevim</CardTitle>
          <CardDescription>
            Hoş geldin, {appUser.data.name}! Buradan proje tercihlerini yapabilirsin veya atanan projenin detaylarını görebilirsin.
          </CardDescription>
        </CardHeader>
      </Card>

      {assignedProjectName ? (
        <Card onClick={() => {if (projectHomework) setActiveProject(projectHomework)}} className={projectHomework ? "cursor-pointer hover:border-primary" : ""}>
          <CardHeader>
            <CardTitle className="font-headline">Atanan Projeniz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-primary/10 p-6 rounded-lg text-center">
              <p className="text-muted-foreground">Size atanan proje:</p>
              <p className="text-2xl font-bold text-primary mt-2">{assignedProjectName}</p>
              {projectHomework && <p className="text-xs text-muted-foreground mt-2">(Detayları görmek için tıklayın)</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
         <ProjectSelection studentClass={studentClass} lessons={lessons || []} student={appUser.data} db={db} />
      )}
    </div>
  );
}

    
