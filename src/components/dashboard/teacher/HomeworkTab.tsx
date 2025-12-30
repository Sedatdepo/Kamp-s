
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, Criterion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Send, Plus, Trash2, CalendarIcon, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';


function HomeworkManager({ classId, teacherProfile, students }: { classId: string, teacherProfile: TeacherProfile | null, students: Student[] }) {
  const [homeworkText, setHomeworkText] = useState('');
  const { toast } = useToast();
  const { db } = useAuth();
  
  const homeworksQuery = useMemo(() => (db ? query(collection(db, 'classes', classId, 'homeworks')) : null), [db, classId]);
  const { data: homeworks, loading } = useFirestore<Homework>(`homeworks-for-class-${classId}`, homeworksQuery);

  const handleAddHomework = async () => {
    if (!db || !classId) return;
    if (!homeworkText.trim()) {
      toast({ variant: 'destructive', title: 'Ödev metni boş olamaz.' });
      return;
    }

    const newHomework: Omit<Homework, 'id'> = {
      classId: classId,
      text: homeworkText,
      assignedDate: new Date().toISOString(),
      seenBy: [],
      teacherName: teacherProfile?.name,
      lessonName: teacherProfile?.branch,
    };

    try {
      const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
      await addDoc(homeworksColRef, newHomework);
      setHomeworkText('');
      toast({ title: 'Ödev gönderildi!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Ödev gönderilemedi.' });
    }
  };

  const handleDeleteHomework = async (homeworkId: string) => {
    if (!db || !classId) return;
    try {
      const homeworkRef = doc(db, 'classes', classId, 'homeworks', homeworkId);
      await deleteDoc(homeworkRef);
      toast({ title: 'Ödev silindi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Ödev silinemedi.' });
    }
  };

  const handleExport = async () => {
     if (!db || !currentClass || !teacherProfile || !homeworks) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için gerekli veriler eksik.' });
        return;
    }
    
    const allSubmissions: Submission[] = [];
    for (const hw of homeworks) {
        const submissionQuery = query(collection(db, 'classes', classId, 'homeworks', hw.id, 'submissions'));
        const querySnapshot = await getDocs(submissionQuery);
        querySnapshot.forEach((doc) => {
            allSubmissions.push({ id: doc.id, ...doc.data() } as Submission);
        });
    }

    exportHomeworkStatusToRtf({
        students,
        homeworks,
        submissions: allSubmissions,
        currentClass,
        teacherProfile
    });
  };

  const currentClass = useFirestore<Class>(`class-${classId}`, db ? doc(db, 'classes', classId) : null).data[0];
  
  return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Plus className="h-6 w-6" />
              Yeni Ödev Gönder
            </CardTitle>
            <CardDescription>Bu sınıftaki tüm öğrencilere gönderilecek bir ödev oluşturun.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={homeworkText}
              onChange={(e) => setHomeworkText(e.target.value)}
              placeholder="Ödev açıklamasını buraya yazın..."
              rows={5}
            />
            <Button onClick={handleAddHomework} className="w-full">
                <Send className="mr-2 h-4 w-4"/>
                Gönder
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline">Geçmiş Ödevler</CardTitle>
                    <CardDescription>Bu sınıfa daha önce gönderilmiş ödevler.</CardDescription>
                </div>
                 <Button variant="outline" onClick={handleExport} disabled={!homeworks || homeworks.length === 0}>
                    <FileText className="mr-2 h-4 w-4"/>
                    Raporu Dışa Aktar
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {homeworks && homeworks.length > 0 ? (
                homeworks.map((hw) => (
                  <div key={hw.id} className="border p-4 rounded-lg bg-muted/50 flex justify-between items-start">
                    <div>
                      <p className="text-sm">{hw.text}</p>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                         <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>Veriliş: {format(new Date(hw.assignedDate), 'd MMMM yyyy', { locale: tr })}</span>
                         </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu ödevi silmek istediğinize emin misiniz? Öğrenci teslimatları da dahil tüm veriler silinecektir. Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteHomework(hw.id)} className="bg-destructive hover:bg-destructive/90">
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">Henüz gönderilmiş bir ödev yok.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

interface HomeworkTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}

export function HomeworkTab({ classId, teacherProfile, students, currentClass }: HomeworkTabProps) {
  return (
    <HomeworkManager classId={classId} teacherProfile={teacherProfile} students={students} />
  );
}
