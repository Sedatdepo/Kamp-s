
"use client";

import { useMemo, useState } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, Lesson } from '@/lib/types';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, X, MoreHorizontal, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const highSchoolLessons = [
    "Matematik", "Fizik", "Kimya", "Biyoloji", "Türk Dili ve Edebiyatı",
    "Tarih", "Coğrafya", "Felsefe", "İngilizce", "Almanca",
    "Beden Eğitimi", "Müzik", "Görsel Sanatlar", "Din Kültürü ve Ahlak Bilgisi",
    "Psikoloji", "Sosyoloji", "Girişimcilik", "Astronomi", "Yazılım"
];


interface ProjectDistributionTabProps {
  classId: string;
}

function LessonManager({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const lessonsQuery = useMemo(() => query(collection(db, 'lessons'), where('teacherId', '==', teacherId)), [teacherId]);
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery);

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
    if (window.confirm('Bu dersi silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'lessons', lessonId));
        toast({ title: 'Ders silindi', variant: 'destructive' });
    }
  };
  
  const handleAddLesson = async () => {
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
        {lessons.map(lesson => (
            isEditing === lesson.id ? (
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
                        <Badge variant="secondary">Kontenjan: {lesson.quota}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(lesson)}><Edit className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(lesson.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                    </div>
                </div>
            )
        ))}
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
              <PopoverContent className="w-[200px] p-0">
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


export function ProjectDistributionTab({ classId }: ProjectDistributionTabProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();

  const classQuery = useMemo(() => doc(db, 'classes', classId), [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
  const lessonsQuery = useMemo(() => query(collection(db, 'lessons'), where('teacherId', '==', teacherId)), [teacherId]);
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery);
  
  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', classId);
    try {
      await updateDoc(classRef, { isProjectSelectionActive: checked });
      toast({
        title: 'Başarılı',
        description: `Proje seçimi ${checked ? 'başlatıldı' : 'durduruldu'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme sırasında bir sorun oluştu.',
      });
    }
  };

  const handleAssignLesson = async (studentId: string, lessonId: string | null) => {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, { assignedLesson: lessonId });
    toast({ title: 'Atama yapıldı!' });
  };

  const isLoading = classLoading || studentsLoading || lessonsLoading;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">Proje Dağılımı ve Atama</CardTitle>
                        <CardDescription>Öğrenci tercihlerini görüntüleyin ve proje atamalarını yapın.</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="project-selection-toggle" 
                            checked={currentClass?.isProjectSelectionActive || false}
                            onCheckedChange={handleToggleChange}
                            disabled={classLoading}
                        />
                        <Label htmlFor="project-selection-toggle">Seçim Aktif</Label>
                    </div>
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
                        <TableHead>Tercihler</TableHead>
                        <TableHead className="text-right">Atanan Proje</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {students.length > 0 ? students.map(student => {
                        const assignedLesson = lessons.find(l => l.id === student.assignedLesson);
                        return (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {student.projectPreferences && student.projectPreferences.length > 0 ? student.projectPreferences.map((prefId, index) => {
                                        const lesson = lessons.find(l => l.id === prefId);
                                        return lesson ? <Badge key={`${student.id}-${prefId}-${index}`} variant="outline">{index + 1}. {lesson.name}</Badge> : null;
                                    }) : <span className="text-xs text-muted-foreground">Tercih yok</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-full justify-end gap-2">
                                            <span>{assignedLesson ? assignedLesson.name : 'Ata'}</span>
                                            <MoreHorizontal className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleAssignLesson(student.id, null)}>Atamayı Kaldır</DropdownMenuItem>
                                        {lessons.map(lesson => (
                                            <DropdownMenuItem key={lesson.id} onClick={() => handleAssignLesson(student.id, lesson.id)}>{lesson.name}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        );
                    }) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Bu sınıfta öğrenci bulunmuyor.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                )}
            </CardContent>
            </Card>
        </div>
        <div>
            { appUser?.type === 'teacher' && <LessonManager teacherId={appUser.data.uid} /> }
        </div>
    </div>
  );
}

    