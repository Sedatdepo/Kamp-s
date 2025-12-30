'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, Criterion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Send, Plus, Trash2, CalendarIcon, Clock, FileText, Search, Library } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { assignmentsData } from '@/lib/maarif-modeli-odevleri';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const branchToSubjectMap: { [key: string]: string } = {
    "Türk Dili ve Edebiyatı": "literature",
    "Fizik": "physics",
};

function HomeworkManager({ classId, teacherProfile, students, currentClass }: { classId: string, teacherProfile: TeacherProfile | null, students: Student[], currentClass: Class | null }) {
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
      teacherName: teacherProfile?.name,
      lessonName: teacherProfile?.branch,
      seenBy: [],
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

function HomeworkLibrary({ classId, teacherProfile, currentClass, onSelect }: { classId: string, teacherProfile: TeacherProfile | null, currentClass: Class | null, onSelect: (text: string) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
  
    const initialGradeFilter = useMemo(() => {
        const gradeMatch = currentClass?.name.match(/\d+/);
        return gradeMatch ? parseInt(gradeMatch[0], 10) : 0;
    }, [currentClass]);
  
    const initialSubjectFilter = useMemo(() => {
        return teacherProfile?.branch ? branchToSubjectMap[teacherProfile.branch] || null : null;
    }, [teacherProfile]);
    
    const [gradeFilter, setGradeFilter] = useState<number | null>(null);
    const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

    useEffect(() => {
        setGradeFilter(initialGradeFilter);
        setSubjectFilter(initialSubjectFilter);
    }, [initialGradeFilter, initialSubjectFilter]);


    const filteredAssignments = useMemo(() => {
        let filtered = assignmentsData;
        if (gradeFilter) {
        filtered = filtered.filter(a => a.grade === gradeFilter);
        }
        if (subjectFilter) {
        filtered = filtered.filter(a => a.subject === subjectFilter);
        }
        if (searchTerm) {
        filtered = filtered.filter(
            (a) =>
            a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        }
        return filtered;
    }, [searchTerm, gradeFilter, subjectFilter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Maarif Modeli Ödev Kütüphanesi</CardTitle>
                <CardDescription>Aşağıdaki filtreleri kullanarak ödevleri aratın veya tüm ödevlere göz atın. Seçtiğiniz ödevi göndermek için üzerine tıklayın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Ödev başlığında ara..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button variant={gradeFilter ? "secondary" : "outline"} onClick={() => setGradeFilter(gradeFilter ? null : initialGradeFilter)}>
                            {gradeFilter ? `${gradeFilter}. Sınıflar` : 'Tüm Sınıflar'}
                        </Button>
                        <Button variant={subjectFilter ? "secondary" : "outline"} onClick={() => setSubjectFilter(subjectFilter ? null : initialSubjectFilter)}>
                            {subjectFilter ? teacherProfile?.branch : 'Tüm Dersler'}
                        </Button>
                    </div>
                </div>
                <ScrollArea className="h-[60vh] mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAssignments.map(a => (
                            <Card key={a.id} className="cursor-pointer hover:border-primary" onClick={() => {
                                const fullText = `Başlık: ${a.title}\n\nAçıklama: ${a.description}\n\nYapılacaklar: ${a.instructions}`;
                                onSelect(fullText);
                            }}>
                                <CardHeader>
                                    <CardTitle className="text-base">{a.title}</CardTitle>
                                    <div className="flex gap-2 text-xs pt-2">
                                        <Badge variant="outline">{a.grade}. Sınıf</Badge>
                                    </div>
                                    <CardDescription className="pt-2">{a.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                        {filteredAssignments.length === 0 && <p className="text-muted-foreground text-center col-span-full py-8">Bu filtrelerle eşleşen ödev bulunamadı.</p>}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

interface HomeworkTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  currentClass: Class | null;
}

export function HomeworkTab({ classId, teacherProfile, students, currentClass }: HomeworkTabProps) {
  const { toast } = useToast();
  
  return (
    <Tabs defaultValue="manager">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manager">
          <BookOpen className="mr-2 h-4 w-4" />
          Ödev Yönetimi
        </TabsTrigger>
        <TabsTrigger value="library">
          <Library className="mr-2 h-4 w-4" />
          Hazır Ödev Kütüphanesi
        </TabsTrigger>
      </TabsList>
      <TabsContent value="manager">
        <HomeworkManager 
            classId={classId} 
            teacherProfile={teacherProfile} 
            students={students} 
            currentClass={currentClass} 
        />
      </TabsContent>
      <TabsContent value="library">
        <HomeworkLibrary
            classId={classId}
            teacherProfile={teacherProfile}
            currentClass={currentClass}
            onSelect={(text) => {
                toast({
                    title: "Ödev metni panoya kopyalandı.",
                    description: "Ödev Yönetimi sekmesine giderek metni yapıştırabilirsiniz.",
                });
                navigator.clipboard.writeText(text);
            }}
        />
      </TabsContent>
    </Tabs>
  );
}
