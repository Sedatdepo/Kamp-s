
"use client";

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Lesson } from '@/lib/types';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit, Save, X, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useCollection, useMemoFirebase } from '@/firebase';


const highSchoolLessons = [
    "Matematik", "Fizik", "Kimya", "Biyoloji", "Türk Dili ve Edebiyatı",
    "Tarih", "Coğrafya", "Felsefe", "İngilizce", "Almanca",
    "Beden Eğitimi", "Müzik", "Görsel Sanatlar", "Din Kültürü ve Ahlak Bilgisi",
    "Psikoloji", "Sosyoloji", "Girişimcilik", "Astronomi", "Yazılım"
];


export function LessonManager({ teacherId, students }: { teacherId: string, students: Student[] }) {
  const { toast } = useToast();
  const { db } = useAuth();
  const lessonsQuery = useMemoFirebase(() => (db ? query(collection(db, 'lessons'), where('teacherId', '==', teacherId)) : null), [teacherId, db]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQuota, setEditingQuota] = useState<number>(0);
  
  const [newLessonName, setNewLessonName] = useState('');
  const [newLessonQuota, setNewLessonQuota] = useState<number>(5);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleStartEdit = (lesson: Lesson) => {
    setIsEditing(lesson.id);
    setEditingName(lesson.name);
    setEditingQuota(lesson.quota);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
  };

  const handleSaveEdit = async (lessonId: string) => {
    if (!db) return;
    if (!editingName.trim() || editingQuota <= 0) {
      toast({ variant: 'destructive', title: 'Geçersiz giriş', description: 'Ders adı boş olamaz ve kontenjan 0 dan büyük olmalı.'});
      return;
    }
    const lessonRef = doc(db, 'lessons', lessonId);
    await updateDoc(lessonRef, { name: editingName, quota: editingQuota });
    setIsEditing(null);
    toast({ title: 'Ders güncellendi!' });
  };

  const handleDelete = async (lessonId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'lessons', lessonId));
    toast({ title: 'Ders silindi', variant: 'destructive' });
  };
  
  const handleAddLesson = async () => {
      if (!db) return;
      if (!newLessonName.trim() || newLessonQuota <= 0) {
        toast({ variant: 'destructive', title: 'Geçersiz giriş', description: 'Ders adı boş olamaz ve kontenjan 0 dan büyük olmalı.'});
        return;
      }
      await addDoc(collection(db, 'lessons'), {
          name: newLessonName,
          quota: newLessonQuota,
          teacherId: teacherId
      });
      setNewLessonName('');
      setNewLessonQuota(5);
      toast({ title: 'Yeni ders eklendi!' });
  }

  if (lessonsLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Proje Dersleri ve Kontenjanları</CardTitle>
        <CardDescription>Proje olarak sunulacak dersleri ve öğrenci kotalarını yönetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lessons && lessons.map(lesson => {
            const assignedCount = students.filter(s => s.assignedLesson === lesson.id).length;
            return isEditing === lesson.id ? (
                <div key={lesson.id} className="flex gap-2 items-center p-2 bg-slate-100 rounded-lg">
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-9"/>
                    <Input type="number" value={editingQuota} onChange={e => setEditingQuota(Number(e.target.value))} className="h-9 w-20"/>
                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(lesson.id)}><Save className="h-5 w-5 text-green-600"/></Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="h-5 w-5 text-red-600"/></Button>
                </div>
            ) : (
                <div key={lesson.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span className="font-medium">{lesson.name}</span>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary">Kontenjan: {assignedCount} / {lesson.quota}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(lesson)}><Edit className="h-4 w-4"/></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-red-500"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu dersi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(lesson.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )
        })}
         <div className="flex gap-2 items-center pt-4 border-t">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-[200px] justify-between"
                >
                  {newLessonName || "Ders seçin..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Ders ara veya yaz..." 
                    onValueChange={setNewLessonName}
                  />
                  <CommandList>
                    <CommandEmpty>Ders bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      {highSchoolLessons.map((lesson) => (
                        <CommandItem
                          key={lesson}
                          value={lesson}
                          onSelect={(currentValue) => {
                            setNewLessonName(currentValue === newLessonName ? "" : currentValue);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newLessonName === lesson ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {lesson}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Input type="number" value={newLessonQuota} onChange={e => setNewLessonQuota(Number(e.target.value))} className="h-9 w-24" placeholder="Kota"/>
            <Button onClick={handleAddLesson}><Plus className="mr-2 h-4 w-4"/> Ekle</Button>
        </div>
      </CardContent>
    </Card>
  );
}
