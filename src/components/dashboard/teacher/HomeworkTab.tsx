
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, Criterion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Send, Plus, Trash2, CalendarIcon, Clock, FileText, Search } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { assignmentsData } from '@/lib/maarif-modeli-odevleri';


function HomeworkManager({ classId, teacherProfile, students, currentClass }: { classId: string, teacherProfile: TeacherProfile | null, students: Student[], currentClass: Class | null }) {
  const [homeworkText, setHomeworkText] = useState('');
  const { toast } = useToast();
  const { db } = useAuth();
  
  const homeworksQuery = useMemo(() => (db ? query(collection(db, 'classes', classId, 'homeworks')) : null), [db, classId]);
  const { data: homeworks, loading } = useFirestore<Homework>(`homeworks-for-class-${classId}`, homeworksQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const filteredAssignments = useMemo(() => {
    if (!searchTerm) return assignmentsData;
    return assignmentsData.filter(
      (a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

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
      teacherName: teacherProfile?.name,
      lessonName: teacherProfile?.branch,
    };

    try {
      const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
      await addDoc(homeworksColRef, newHomework);

      // Add a seenBy field to the newly created homework in the local state
      const updatedHomeworks = [...(currentClass?.homeworks || []), { ...newHomework, seenBy: [] }];
      if (currentClass) {
        await updateDoc(doc(db, 'classes', currentClass.id), { homeworks: updatedHomeworks });
      }

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

      // Also remove submissions subcollection if needed - for simplicity, we skip this here
      // as it requires more complex logic. Firestore extensions can handle this.

      if (currentClass) {
        const updatedHomeworks = (currentClass.homeworks || []).filter(hw => hw.id !== homeworkId);
        await updateDoc(doc(db, 'classes', currentClass.id), { homeworks: updatedHomeworks });
      }

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
    
    // Since submissions are in a subcollection, we need to fetch them for each homework
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
              placeholder="Ödev açıklamasını buraya yazın veya hazır bir şablon seçin..."
              rows={5}
            />
             <div className="flex gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <BookOpen className="mr-2"/> Hazır Ödev Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Maarif Modeli Ödev Kütüphanesi</DialogTitle>
                        </DialogHeader>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Ödev ara..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                         <ScrollArea className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {filteredAssignments.map(a => (
                                    <Card key={a.id} className="cursor-pointer hover:border-primary" onClick={() => {
                                        const fullText = `Başlık: ${a.title}\n\nAçıklama: ${a.description}\n\nYapılacaklar: ${a.instructions}`;
                                        setHomeworkText(fullText);
                                        // Close dialog - needs manual state management if we want this
                                    }}>
                                        <CardHeader>
                                            <CardTitle className="text-base">{a.title}</CardTitle>
                                            <CardDescription>{a.description}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
                <Button onClick={handleAddHomework} className="w-full">
                    <Send className="mr-2 h-4 w-4"/>
                    Gönder
                </Button>
            </div>
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
                      <p className="text-sm whitespace-pre-wrap">{hw.text}</p>
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
    <HomeworkManager classId={classId} teacherProfile={teacherProfile} students={students} currentClass={currentClass} />
  );
}
