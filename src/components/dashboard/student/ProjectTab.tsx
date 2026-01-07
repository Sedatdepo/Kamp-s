
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Lesson, Homework } from '@/lib/types';
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


function ProjectDetailView({ projectHomework, onBack }: { projectHomework: Homework, onBack: () => void }) {
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
                                        <TableHead className="text-right">Puan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectHomework.rubric.map((item: any) => (
                                        <TableRow key={item.label}>
                                            <TableCell>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">{item.score}</TableCell>
                                        </TableRow>
                                    ))}
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

  const studentClassQuery = useMemo(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: studentClass, loading: classLoading } = useFirestore<Class>(`class-for-project-${classId}`, studentClassQuery);
  
  const lessonsQuery = useMemo(() => {
    if (!studentClass?.teacherId || !db) return null;
    return query(collection(db, 'lessons'), where('teacherId', '==', studentClass.teacherId));
  }, [studentClass?.teacherId, db]);
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson[]>(`lessons-for-project-${studentClass?.teacherId}`, lessonsQuery);

  const homeworksQuery = useMemo(() => {
    if (!db || !classId || !assignedLessonId) return null;
    // Find the homework document associated with the project ID
    const projectHomeworkId = assignedLessonId.replace('project_', '');
    // This query is a bit of a guess, we need to find the homework by the project ID
    // Assuming the project ID is stored in a field, e.g., `projectId` in the homework document
    return query(collection(db, `classes/${classId}/homeworks`), where("text", "==", assignmentsData.find(p => p.id.toString() === projectHomeworkId)?.title));
  }, [db, classId, assignedLessonId]);

  const { data: projectHomeworks, loading: homeworksLoading } = useFirestore<Homework[]>(`project-homework-${assignedLessonId}`, homeworksQuery);

  const projectHomework = useMemo(() => projectHomeworks?.[0], [projectHomeworks]);

  const isLoading = classLoading || lessonsLoading || (assignedLessonId ? homeworksLoading : false);
  
  if (isLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }
  
  if (activeProject) {
      return <ProjectDetailView projectHomework={activeProject} onBack={() => setActiveProject(null)} />
  }

  let assignedProjectName = null;
  if (assignedLessonId) {
      if (assignedLessonId.startsWith('project_')) {
          const projectId = parseInt(assignedLessonId.replace('project_', ''), 10);
          const project = assignmentsData.find(p => p.id === projectId);
          if (project) {
              assignedProjectName = project.title;
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
