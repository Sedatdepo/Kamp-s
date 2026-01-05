
"use client";

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { Header } from '@/components/dashboard/Header';
import { ProjectDistributionTab } from '@/components/dashboard/teacher/ProjectDistributionTab';
import { RiskMapTab } from '@/components/dashboard/teacher/RiskMapTab';
import { InfoFormsTab } from '@/components/dashboard/teacher/InfoFormsTab';
import { GradingToolTab } from '@/components/dashboard/teacher/GradingToolTab';
import { CommunicationTab } from '@/components/dashboard/teacher/CommunicationTab';
import { HomeworkTab } from '@/components/dashboard/teacher/HomeworkTab';
import { ElectionTab } from '@/components/dashboard/teacher/ElectionTab';
import { AnnualPlanTab } from '@/components/dashboard/teacher/AnnualPlanTab';
import { DilekceTab } from '@/components/dashboard/teacher/DilekceTab';
import { SurveyTab } from '@/components/dashboard/teacher/SurveyTab';
import { DisciplineTab } from './DisciplineTab';
import { BepTab } from './BepTab';
import VeliToplantisiTab from './VeliToplantisiTab';
import SokTab from './SokTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2, Calendar, ChevronDown, Users, ArrowLeft, Plus, Trash2, Edit, BookText, Vote, Grid, ClipboardList, List, Gauge, MessageCircle, FileSignature, Home, FileHeart, ClipboardCheck, Scale, FileQuestion, Target, FolderKanban, Users2, Upload, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student, TeacherProfile, RosterItem } from '@/lib/types';
import { doc, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, arrayRemove, arrayUnion } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ZumreTab from './ZumreTab';
import { StudentDetailModal } from './StudentDetailModal';
import { ClassInviteDialog } from './ClassInviteDialog';
import * as XLSX from 'xlsx';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type ActiveTab = "dashboard" | "students" | "grading" | "planning" | "election" | "projects" | "homework" | "risks" | "forms" | "communication" | "dilekce" | "surveys" | "discipline" | "bep" | "zumre" | "veli-toplantisi" | "sok";

const MenuCard = ({ icon, title, description, onClick, isDisabled }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, isDisabled?: boolean }) => {
  return (
    <Card 
      onClick={!isDisabled ? onClick : undefined} 
      className={`cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group relative ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/50' : ''}`}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
          {icon}
        </div>
        <div>
          <CardTitle className="font-headline text-lg group-hover:text-primary">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};


function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


function ClassSelectionScreen({ 
    onSelectClass, 
    classes,
    students: allStudents,
    loading,
    setOrderedClasses,
    setActiveTab,
}: { 
    onSelectClass: (id: string) => void;
    classes: Class[];
    students: Student[];
    loading: boolean;
    setOrderedClasses: React.Dispatch<React.SetStateAction<Class[]>>;
    setActiveTab: (tab: ActiveTab) => void;
}) {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

    const [newClassName, setNewClassName] = useState('');
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
    const [draggedClassId, setDraggedClassId] = useState<string | null>(null);

    const handleAddClass = async () => {
        if (!newClassName.trim() || !teacherId || !db) return;
        try {
            await addDoc(collection(db, 'classes'), {
                name: newClassName,
                teacherId: teacherId,
                isProjectSelectionActive: false,
                isRiskFormActive: false,
                isInfoFormActive: false,
                isElectionActive: false,
                code: generateClassCode(),
                announcements: [],
                homeworks: [],
            });
            toast({ title: 'Sınıf oluşturuldu!' });
            setNewClassName('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf oluşturulamadı.' });
        }
    };

    const handleUpdateClass = async () => {
        if (!editingClass || !editingClass.name.trim() || !db) return;
        try {
            await updateDoc(doc(db, 'classes', editingClass.id), { name: editingClass.name });
            toast({ title: 'Sınıf adı güncellendi' });
            setEditingClass(null);
        } catch(error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf güncellenemedi.' });
        }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!db) return;
        setDeletingClassId(classId);
        try {
            const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
            const studentSnapshot = await getDocs(studentsQuery);
            const batch = writeBatch(db);
            studentSnapshot.forEach(studentDoc => {
                batch.delete(doc(db, 'students', studentDoc.id));
            });
            batch.delete(doc(db, 'classes', classId));
            await batch.commit();
            toast({ title: 'Sınıf ve öğrenciler silindi', variant: 'destructive' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Sınıf silinemedi.' });
        } finally {
            setDeletingClassId(null);
        }
    }
    
    const studentCounts = useMemo(() => {
        const counts = new Map<string, number>();
        classes.forEach(cls => {
            const count = allStudents.filter(s => s.classId === cls.id).length;
            counts.set(cls.id, count);
        })
        return counts;
    }, [allStudents, classes]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, classId: string) => {
        setDraggedClassId(classId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetClassId: string) => {
        e.preventDefault();
        if (!draggedClassId || draggedClassId === targetClassId) return;

        const draggedIndex = classes.findIndex(c => c.id === draggedClassId);
        const targetIndex = classes.findIndex(c => c.id === targetClassId);

        const newOrderedClasses = [...classes];
        const [draggedItem] = newOrderedClasses.splice(draggedIndex, 1);
        newOrderedClasses.splice(targetIndex, 0, draggedItem);
        
        setOrderedClasses(newOrderedClasses);
        setDraggedClassId(null);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
                    </Card>
                ))}
            </div>
        );
    }
    
    return (
        <Tabs defaultValue="classes">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="classes"><School className="mr-2"/>Sınıflarınız</TabsTrigger>
                <TabsTrigger value="documents"><FolderKanban className="mr-2"/>Evraklar</TabsTrigger>
            </TabsList>
            <TabsContent value="classes" className="mt-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold font-headline">Sınıflarınız</h1>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Sınıf Ekle</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Yeni Sınıf Oluştur</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                                <Input 
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="Sınıf Adı (örn. 9/A)"
                                />
                                <DialogClose asChild>
                                    <Button onClick={handleAddClass} className="w-full">Oluştur</Button>
                                </DialogClose>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                 {classes.length === 0 ? (
                     <Card className="w-full text-center shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                <School className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="mt-4 font-headline text-2xl">Henüz Sınıfınız Yok</CardTitle>
                            <CardDescription>
                               Öğrencilerinizi ve etkinliklerinizi yönetmeye başlamak için "Yeni Sınıf Ekle" butonuna tıklayarak ilk sınıfınızı oluşturun.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map(cls => (
                            <div
                                key={cls.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, cls.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, cls.id)}
                                className={cn(
                                    'transition-opacity duration-300',
                                    draggedClassId === cls.id ? 'opacity-50' : 'opacity-100'
                                )}
                            >
                                <Card className="flex flex-col hover:shadow-lg transition-shadow h-full cursor-grab active:cursor-grabbing">
                                    <div className="flex-1 p-6" onClick={() => onSelectClass(cls.id)}>
                                        <CardTitle>{cls.name}</CardTitle>
                                        <CardDescription className="mt-1">Sınıf Kodu: {cls.code}</CardDescription>
                                    </div>
                                    <CardContent className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4 relative">
                                        <span>{studentCounts.get(cls.id) || 0} Öğrenci</span>
                                        <div className="flex items-center">
                                            <Dialog onOpenChange={(open) => !open && setEditingClass(null)}>
                                                <DialogTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingClass(cls);
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>Sınıf Adını Düzenle</DialogTitle></DialogHeader>
                                                    <Input defaultValue={cls.name} onChange={(e) => setEditingClass(prev => prev ? {...prev, name: e.target.value} : null)}/>
                                                    <DialogClose asChild>
                                                        <Button onClick={handleUpdateClass}>Kaydet</Button>
                                                    </DialogClose>
                                                </DialogContent>
                                            </Dialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            disabled={deletingClassId === cls.id}
                                                        >
                                                            {deletingClassId === cls.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin"/> 
                                                            ) : (
                                                                <Trash2 className="h-4 w-4"/>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu sınıfı ({cls.name}) ve içindeki TÜM öğrencileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteClass(cls.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                 )}
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <MenuCard icon={<FileSignature />} title="Dilekçe Sihirbazı" description="Resmi dilekçeler ve tutanaklar oluşturun." onClick={() => setActiveTab('dilekce')} />
                    <MenuCard icon={<Users2 />} title="Zümre Tutanağı" description="Zümre toplantısı tutanakları oluşturun." onClick={() => setActiveTab('zumre')} />
                    <MenuCard icon={<Users />} title="ŞÖK Tutanağı" description="Şube öğretmenler kurulu tutanakları." onClick={() => setActiveTab('sok')} />
                    <MenuCard icon={<BookText />} title="Veli Toplantısı Tutanağı" description="Veli toplantısı gündem ve kararları." onClick={() => setActiveTab('veli-toplantisi')} />
                    <MenuCard icon={<FileHeart />} title="BEP Modülü" description="Bireyselleştirilmiş eğitim programları." onClick={() => setActiveTab('bep')} />
                    <MenuCard icon={<Target />} title="Kazanımlar" description="Ders kazanımlarını yönetin." onClick={() => {}} isDisabled={true} />
                </div>
            </TabsContent>
        </Tabs>
    );
}

// Student Management Tab Content
function StudentManagementTab({ students, currentClass, teacherProfile }: { students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
  return (
    <Tabs defaultValue="student-list">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="student-list"><Users className="mr-2 h-4 w-4" />Öğrenci Listesi</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="mr-2 h-4 w-4" />Yoklama</TabsTrigger>
          <TabsTrigger value="duty-roster"><ClipboardList className="mr-2 h-4 w-4" />Nöbet Listesi</TabsTrigger>
          <TabsTrigger value="seating-plan"><Grid className="mr-2 h-4 w-4" />Oturma Planı</TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="student-list" className="mt-4">
        {currentClass && <StudentList classId={currentClass.id} students={students} currentClass={currentClass} teacherProfile={teacherProfile} />}
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceTab students={students} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="duty-roster" className="mt-4">
        <DutyRosterTab students={students} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="seating-plan" className="mt-4">
        <SeatingPlanTab students={students} currentClass={currentClass} />
      </TabsContent>
    </Tabs>
  );
}

// Student List Component (was in its own file)
function StudentList({ classId, students, currentClass, teacherProfile }: { classId: string, students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [students]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim() || !db) return;
    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName,
        number: newStudentNumber,
        classId: classId,
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        behaviorScore: 100,
      });
      toast({ title: 'Öğrenci eklendi!' });
      setNewStudentName('');
      setNewStudentNumber('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci eklenemedi.' });
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.name.trim() || !editingStudent.number.trim() || !db) return;
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        number: editingStudent.number,
      });
      toast({ title: 'Öğrenci güncellendi.' });
      setEditingStudent(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci güncellenemedi.' });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!db) return;
    if (confirm("Bu öğrenciyi silmek istediğinizden emin misiniz?")) {
        try {
            await deleteDoc(doc(db, 'students', studentId));
            toast({ title: 'Öğrenci silindi.', variant: 'destructive' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci silinemedi.' });
        }
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !db) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const studentsToAdd = json.slice(1).map(row => ({
                number: String(row[0] || ''),
                name: String(row[1] || ''),
            })).filter(s => s.number && s.name);

            const batch = writeBatch(db);
            studentsToAdd.forEach(student => {
                const newStudentRef = doc(collection(db, 'students'));
                batch.set(newStudentRef, { ...student, classId: classId, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100 });
            });
            
            await batch.commit();
            toast({ title: `${studentsToAdd.length} öğrenci başarıyla eklendi!` });

        } catch (error) {
            console.error("Error importing students:", error);
            toast({ variant: 'destructive', title: 'Dosya Okuma Hatası', description: 'Öğrenci listesi içe aktarılamadı.' });
        }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };
  
  const handleOpenDetailModal = (student: Student) => {
      setSelectedStudent(student);
      setIsDetailModalOpen(true);
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Öğrenci Listesi</CardTitle>
              <CardDescription>{currentClass?.name} sınıfındaki öğrencilerin listesi.</CardDescription>
            </div>
             <div className="flex gap-2">
                 <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
                    <QrCode className="mr-2 h-4 w-4"/> Davet Et
                </Button>
                <Button variant="outline" asChild>
                    <label htmlFor="student-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4"/> Excel'den Aktar
                    </label>
                </Button>
                <input id="student-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload}/>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Okul No</TableHead>
                <TableHead>Adı Soyadı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map(student => (
                editingStudent?.id === student.id ? (
                  <TableRow key={student.id}>
                    <TableCell><Input value={editingStudent.number} onChange={(e) => setEditingStudent({...editingStudent, number: e.target.value})} /></TableCell>
                    <TableCell><Input value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" onClick={handleUpdateStudent} className="mr-2"><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingStudent(null)}><X className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={student.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDetailModal(student)}>
                    <TableCell>{student.number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              ))}
              <TableRow>
                <TableCell><Input placeholder="Okul No" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)} /></TableCell>
                <TableCell><Input placeholder="Adı Soyadı" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} /></TableCell>
                <TableCell className="text-right">
                  <Button onClick={handleAddStudent}><UserPlus className="mr-2 h-4 w-4" /> Ekle</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedStudent && teacherProfile && currentClass && (
        <StudentDetailModal 
            student={selectedStudent} 
            teacherProfile={teacherProfile}
            currentClass={currentClass}
            isOpen={isDetailModalOpen}
            setIsOpen={setIsDetailModalOpen}
        />
      )}
      {currentClass && (
        <ClassInviteDialog
            isOpen={isInviteModalOpen}
            setIsOpen={setIsInviteModalOpen}
            classCode={currentClass.code}
            className={currentClass.name}
        />
      )}
    </div>
  );
}

// Attendance Tab Component
function AttendanceTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { db } = useAuth();
    const { toast } = useToast();

    const handleStatusChange = async (studentId: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
        if (!date || !db) return;
        const studentRef = doc(db, 'students', studentId);
        const dateString = format(date, 'yyyy-MM-dd');
        const student = students.find(s => s.id === studentId);
        const existingAttendance = student?.attendance?.find(a => a.date === dateString);

        try {
            let updatedAttendance = student?.attendance ? [...student.attendance] : [];
            if (existingAttendance) {
                updatedAttendance = updatedAttendance.filter(a => a.date !== dateString);
            }
            updatedAttendance.push({ date: dateString, status: newStatus });
            
            await updateDoc(studentRef, { attendance: updatedAttendance });
            toast({ title: 'Yoklama kaydedildi.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yoklama kaydedilemedi.' });
        }
    };

    const getStudentStatusForDate = (student: Student, selectedDate: Date): 'present' | 'absent' | 'late' | 'excused' => {
        if (!student.attendance) return 'present';
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return student.attendance.find(a => a.date === dateString)?.status || 'present';
    };

    if (!students || students.length === 0) return <Card><CardHeader><CardTitle>Yoklama</CardTitle><CardDescription>Bu sınıfta öğrenci bulunmuyor.</CardDescription></CardHeader></Card>;

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1"><Card><CardHeader><CardTitle>Tarih Seçimi</CardTitle></CardHeader><CardContent><CalendarPicker mode="single" selected={date} onSelect={setDate} className="rounded-md border" locale={tr} /></CardContent></Card></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Öğrenci Yoklama Listesi</CardTitle><CardDescription>{date ? format(date, 'dd MMMM yyyy, cccc', { locale: tr }) : 'Tarih seçin'}</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Öğrenci Adı</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader><TableBody>{students.map(student => (<TableRow key={student.id}><TableCell>{student.name}</TableCell><TableCell><RadioGroup defaultValue="present" value={date ? getStudentStatusForDate(student, date) : 'present'} onValueChange={(status) => handleStatusChange(student.id, status as any)} className="flex gap-4" disabled={!date}><Label className="flex items-center gap-2 cursor-pointer text-green-600"><RadioGroupItem value="present" />Geldi</Label><Label className="flex items-center gap-2 cursor-pointer text-red-600"><RadioGroupItem value="absent" />Gelmedi</Label><Label className="flex items-center gap-2 cursor-pointer text-orange-600"><RadioGroupItem value="late" />Geç</Label><Label className="flex items-center gap-2 cursor-pointer text-blue-600"><RadioGroupItem value="excused" />İzinli</Label></RadioGroup></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>
        </div>
    );
}

// Duty Roster Tab Component
function DutyRosterTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [numberOfWeeks, setNumberOfWeeks] = useState(4);
    const [studentsPerDuty, setStudentsPerDuty] = useState(2);

    const handleGenerateRoster = async () => {
        if (!db || !currentClass || !startDate || selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen başlangıç tarihi ve en az bir öğrenci seçin.' });
            return;
        }
        const roster: RosterItem[] = [];
        let currentDate = new Date(startDate);
        let studentIndex = 0;
        for (let i = 0; i < numberOfWeeks * 5; i++) {
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) { currentDate = addDays(currentDate, 1); i--; continue; }
            const dutyStudents: Student[] = [];
            const dutyStudentIds: string[] = [];
            for (let j = 0; j < studentsPerDuty; j++) {
                const studentId = selectedStudents[studentIndex % selectedStudents.length];
                const student = students.find(s => s.id === studentId);
                if (student) { dutyStudents.push(student); dutyStudentIds.push(studentId); }
                studentIndex++;
            }
            roster.push({ date: format(currentDate, 'dd.MM.yyyy'), day: format(currentDate, 'cccc', { locale: tr }), student: dutyStudents.map(s => s.name).join(' - '), studentIds: dutyStudentIds });
            currentDate = addDays(currentDate, 1);
        }
        try {
            const classRef = doc(db, 'classes', currentClass.id);
            await updateDoc(classRef, { dutyRoster: roster });
            toast({ title: 'Nöbet Listesi Oluşturuldu!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Hata', description: 'Liste güncellenemedi.' }); }
    };

    if (!currentClass) return <p>Sınıf bilgisi yüklenemedi.</p>;
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6"><Card><CardHeader><CardTitle>Ayarlar</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Başlangıç Tarihi</Label><CalendarPicker mode="single" selected={startDate} onSelect={setStartDate} className="rounded-md border" locale={tr} /></div><div className="space-y-2"><Label>Hafta Sayısı</Label><Input type="number" value={numberOfWeeks} onChange={e => setNumberOfWeeks(Number(e.target.value))} /></div><div className="space-y-2"><Label>Günlük Öğrenci Sayısı</Label><Select value={String(studentsPerDuty)} onValueChange={v => setStudentsPerDuty(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select></div></CardContent></Card><Card><CardHeader><CardTitle>Öğrenci Seçimi</CardTitle></CardHeader><CardContent className="space-y-2 max-h-60 overflow-y-auto">{students.map(s => (<div key={s.id} className="flex items-center gap-2"><Checkbox id={`roster-${s.id}`} checked={selectedStudents.includes(s.id)} onCheckedChange={(checked) => { setSelectedStudents(prev => checked ? [...prev, s.id] : prev.filter(id => id !== s.id)); }} /><Label htmlFor={`roster-${s.id}`}>{s.name}</Label></div>))}</CardContent></Card><Button onClick={handleGenerateRoster}>Nöbet Listesini Oluştur</Button></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Nöbet Listesi Önizlemesi</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Gün</TableHead><TableHead>Nöbetçi Öğrenciler</TableHead></TableRow></TableHeader><TableBody>{(currentClass.dutyRoster || []).map((item, idx) => (<TableRow key={idx}><TableCell>{item.date}</TableCell><TableCell>{item.day}</TableCell><TableCell>{item.student}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>
        </div>
    );
}

// Seating Plan Tab Component
function SeatingPlanTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [rowCount, setRowCount] = useState(currentClass?.seatingPlanRows || 4);
    const [colCount, setColCount] = useState(currentClass?.seatingPlanCols || 3);
    const [seatingPlan, setSeatingPlan] = useState<{ [key: string]: string }>(currentClass?.seatingPlan || {});

    const handleSavePlan = async () => {
        if (!db || !currentClass) return;
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { seatingPlan: seatingPlan, seatingPlanRows: rowCount, seatingPlanCols: colCount });
            toast({ title: 'Oturma planı kaydedildi!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Hata', description: 'Plan kaydedilemedi.' }); }
    };
    const handleSeatChange = (key: string, studentId: string) => {
        const newPlan = { ...seatingPlan };
        Object.keys(newPlan).forEach(k => { if (newPlan[k] === studentId) { delete newPlan[k]; } });
        if (studentId === "empty") { delete newPlan[key]; } else { newPlan[key] = studentId; }
        setSeatingPlan(newPlan);
    };

    if (!students) return <p>Öğrenci verisi yükleniyor...</p>;
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6"><Card><CardHeader><CardTitle>Plan Ayarları</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Sıra Sayısı (Dikey)</Label><Input type="number" value={rowCount} onChange={e => setRowCount(Number(e.target.value))} /></div><div className="space-y-2"><Label>Sütun Sayısı (Yatay)</Label><Input type="number" value={colCount} onChange={e => setColCount(Number(e.target.value))} /></div><Button onClick={handleSavePlan} className="w-full">Değişiklikleri Kaydet</Button></CardContent></Card></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Sınıf Oturma Planı</CardTitle></CardHeader><CardContent className="flex flex-col"><div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md"><span className="font-bold tracking-widest text-lg">TAHTA</span></div><div className="flex-1 flex justify-center items-start overflow-x-auto p-4"><div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)` }}>{Array.from({ length: rowCount }).map((_, r) => Array.from({ length: colCount }).map((_, c) => (<div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">{[0, 1].map((side) => { const key = `${r}-${c}-${side}`; const selectedStudentId = seatingPlan[key]; return (<div key={key} className="flex-1"><Select value={selectedStudentId || "empty"} onValueChange={(studentId) => handleSeatChange(key, studentId)}><SelectTrigger className="h-full bg-background border-primary/20 shadow-sm text-xs p-1"><SelectValue placeholder="Boş" /></SelectTrigger><SelectContent><SelectItem value="empty">Boş</SelectItem>{students.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>); })}</div>)))}</div></div></CardContent></Card></div>
        </div>
    );
}

const TABS_CONFIG = {
  "dashboard": { label: "Panel", icon: School },
  "students": { label: "Öğrenci Yönetimi", icon: Users },
  "grading": { label: "Değerlendirme Aracı", icon: Gauge },
  "planning": { label: "Planlama Araçları", icon: ClipboardList },
  "election": { label: "Sınıf Seçimleri", icon: Vote },
  "projects": { label: "Proje Dağıtımı", icon: BookText },
  "homework": { label: "Ödev Takibi", icon: BookText },
  "risks": { label: "Sınıf Risk Haritası", icon: List },
  "forms": { label: "Bilgi Formları", icon: FileSignature },
  "communication": { label: "İletişim Paneli", icon: MessageCircle },
  "dilekce": { label: "Dilekçe Sihirbazı", icon: FileSignature },
  "surveys": { label: "Anket Modülü", icon: ClipboardCheck },
  "discipline": { label: "Disiplin Süreci", icon: Scale },
  "bep": { label: "BEP Modülü", icon: FileHeart },
  "zumre": { label: "Zümre Tutanağı", icon: Users2 },
  "veli-toplantisi": { label: "Veli Toplantısı Tutanağı", icon: BookText },
  "sok": { label: "ŞÖK Tutanağı", icon: Users },
} as const;

// Main Component
export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const { appUser, db } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const teacherQuery = useMemo(() => (teacherId && db) ? doc(db, 'teachers', teacherId) : null, [teacherId, db]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData ?? null;

  const classesQuery = useMemo(() => (teacherId && db) ? query(collection(db, 'classes'), where('teacherId', '==', teacherId)) : null, [teacherId, db]);
  const { data: classes, loading: classesLoading } = useFirestore<Class[]>('classes', classesQuery);
  
  const [orderedClasses, setOrderedClasses] = useState<Class[]>([]);

  useEffect(() => {
    if (classes) {
        try {
            const storedOrderJSON = localStorage.getItem(`classOrder_${teacherId}`);
            if (storedOrderJSON) {
                const storedOrder: string[] = JSON.parse(storedOrderJSON);
                const classMap = new Map(classes.map(c => [c.id, c]));
                const sorted = storedOrder.map(id => classMap.get(id)).filter((c): c is Class => !!c);
                const newClasses = classes.filter(c => !storedOrder.includes(c.id));
                setOrderedClasses([...sorted, ...newClasses]);
            } else {
                setOrderedClasses(classes);
            }
        } catch (error) {
            console.error("Failed to parse class order from localStorage:", error);
            setOrderedClasses(classes);
        }
    }
  }, [classes, teacherId]);

  const setAndStoreOrderedClasses = useCallback((newOrder: Class[]) => {
      setOrderedClasses(newOrder);
      const orderIds = newOrder.map(c => c.id);
      localStorage.setItem(`classOrder_${teacherId}`, JSON.stringify(orderIds));
  }, [teacherId]);

  useEffect(() => {
    if (!classesLoading && teacherId && db && classes && classes.length === 0) {
      const createInitialClass = async () => {
        try {
          await addDoc(collection(db, 'classes'), {
            name: '10-A',
            teacherId: teacherId,
            isProjectSelectionActive: false,
            isRiskFormActive: false,
            isInfoFormActive: false,
            isElectionActive: false,
            code: generateClassCode(),
            announcements: [],
            homeworks: [],
          });
        } catch (error) {
          console.error("Failed to create initial class:", error);
        }
      };
      createInitialClass();
    }
  }, [classesLoading, classes, teacherId, db]);

  const currentClass = useMemo(() => classes?.find((c: Class) => c.id === selectedClassId), [classes, selectedClassId]);

  const allStudentsForTeacherQuery = useMemo(() => {
    if (!teacherId || !db) return null;
    const classIds = (classes || []).map(c => c.id);
    if (classIds.length === 0) return null;
    return query(collection(db, 'students'), where('classId', 'in', classIds));
  }, [teacherId, db, classes]);
  const { data: allStudents, loading: allStudentsLoading } = useFirestore<Student[]>('all-students-for-teacher', allStudentsForTeacherQuery);

  const students = useMemo(() => {
    if (!selectedClassId || !allStudents) return [];
    return allStudents.filter(s => s.classId === selectedClassId);
  }, [selectedClassId, allStudents]);

  const isLoading = teacherLoading || classesLoading || allStudentsLoading;
  
  const renderContent = () => {
    if (isLoading && (selectedClassId || activeTab !== 'dashboard')) {
      return (
        <div className="flex justify-center items-center h-full p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (activeTab === 'dilekce' && !selectedClassId) {
        return (
             <div>
               <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                  <FileSignature className="w-7 h-7 text-primary" />
                  Dilekçe Sihirbazı
                </h2>
                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </div>
              <DilekceTab teacherProfile={teacherProfile} />
            </div>
        );
    }
    
    if (activeTab === 'zumre' && !selectedClassId) {
        return (
             <div>
               <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                  <Users2 className="w-7 h-7 text-primary" />
                  Zümre Toplantı Tutanağı
                </h2>
                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </div>
              <ZumreTab />
            </div>
        );
    }
    
    if (activeTab === 'bep' && !selectedClassId) {
        return (
             <div>
               <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                  <FileHeart className="w-7 h-7 text-primary" />
                  BEP Modülü
                </h2>
                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </div>
              <BepTab />
            </div>
        );
    }
    
    if (activeTab === 'veli-toplantisi' && !selectedClassId) {
        return (
             <div>
               <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                  <BookText className="w-7 h-7 text-primary" />
                  Veli Toplantısı Tutanağı
                </h2>
                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </div>
              <VeliToplantisiTab />
            </div>
        );
    }

    if (activeTab === 'sok' && !selectedClassId) {
        return (
             <div>
               <div className="mb-6 flex justify-between items-center">
                 <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                  <Users className="w-7 h-7 text-primary" />
                  ŞÖK Tutanağı
                </h2>
                <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Ana Sayfaya Dön
                </Button>
              </div>
              <SokTab />
            </div>
        );
    }

    if (!selectedClassId) {
        return <ClassSelectionScreen onSelectClass={setSelectedClassId} classes={orderedClasses || []} students={allStudents || []} loading={classesLoading} setOrderedClasses={setAndStoreOrderedClasses} setActiveTab={setActiveTab} />;
    }

    if (activeTab !== "dashboard") {
        let tabContent;
        switch(activeTab) {
            case 'students':
                tabContent = (
                    <StudentManagementTab
                        students={students || []}
                        currentClass={currentClass}
                        teacherProfile={teacherProfile}
                    />
                );
                break;
            case 'grading':
                tabContent = <GradingToolTab classId={selectedClassId} teacherProfile={teacherProfile} students={students || []} currentClass={currentClass} />;
                break;
            case 'planning':
                tabContent = <Suspense fallback={<div>Yükleniyor...</div>}><AnnualPlanTab teacherProfile={teacherProfile} currentClass={currentClass} /></Suspense>;
                break;
            case 'election':
                tabContent = <ElectionTab students={students || []} currentClass={currentClass} />;
                break;
            case 'projects':
                tabContent = <ProjectDistributionTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} classes={classes || []} />;
                break;
            case 'homework':
                tabContent = <HomeworkTab classId={selectedClassId} currentClass={currentClass} teacherProfile={teacherProfile} students={students || []} classes={classes || []}/>;
                break;
            case 'risks':
                tabContent = <RiskMapTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
                break;
            case 'forms':
                tabContent = <InfoFormsTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
                break;
            case 'communication':
                tabContent = <CommunicationTab classId={selectedClassId} currentClass={currentClass} />;
                break;
            case 'dilekce':
                tabContent = <DilekceTab teacherProfile={teacherProfile} />;
                break;
            case 'surveys':
                tabContent = <SurveyTab students={students || []} currentClass={currentClass} teacherProfile={teacherProfile}/>;
                break;
             case 'discipline':
                tabContent = <DisciplineTab students={students || []} currentClass={currentClass} teacherProfile={teacherProfile} />;
                break;
            case 'bep':
                tabContent = <BepTab />;
                break;
             case 'zumre':
                tabContent = <ZumreTab />;
                break;
            case 'veli-toplantisi':
                tabContent = <VeliToplantisiTab />;
                break;
            case 'sok':
                tabContent = <SokTab />;
                break;
            default:
                tabContent = null;
        }

      return (
        <div>
           <div className="mb-6 flex justify-between items-center">
             <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
              {React.createElement(TABS_CONFIG[activeTab]?.icon || School, { className: "w-7 h-7 text-primary" })}
              {TABS_CONFIG[activeTab]?.label}
            </h2>
            <div className="flex items-center gap-2">
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      {currentClass?.name}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setSelectedClassId(null)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ana Sayfa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {(orderedClasses || []).map((cls: Class) => (
                        <DropdownMenuItem key={cls.id} onSelect={() => setSelectedClassId(cls.id)}>
                            {cls.name}
                        </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setActiveTab('dashboard')}>
                <Home className="mr-2 h-4 w-4" /> Panele Dön
              </Button>
            </div>
          </div>
          {tabContent}
        </div>
      );
    }

    // Dashboard view
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <h1 className="text-2xl font-headline">{currentClass?.name || 'Sınıf Paneli'}</h1>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline">
                                {currentClass?.name}
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setSelectedClassId(null)}>
                                  <ArrowLeft className="mr-2 h-4 w-4" />
                                  Ana Sayfa
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(orderedClasses || []).map((cls: Class) => (
                                  <DropdownMenuItem key={cls.id} onSelect={() => setSelectedClassId(cls.id)}>
                                      {cls.name}
                                  </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardDescription>Sınıfınıza ait modüllere aşağıdan erişebilirsiniz.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <MenuCard icon={<Users />} title="Öğrenci Yönetimi" description="Liste, devamsızlık ve oturma planı." onClick={() => setActiveTab('students')} />
                <MenuCard icon={<Gauge />} title="Değerlendirme Aracı" description="Performans, proje ve davranış notları." onClick={() => setActiveTab('grading')} />
                <MenuCard icon={<ClipboardList />} title="Planlama Araçları" description="Yıllık plan ve günlük plan oluşturun." onClick={() => setActiveTab('planning')} />
                <MenuCard icon={<Vote />} title="Seçim Modülü" description="Sınıf başkanlığı ve temsilci seçimi." onClick={() => setActiveTab('election')} />
                <MenuCard icon={<BookText />} title="Proje Dağıtımı" description="Öğrencilerin proje tercihlerini yönetin." onClick={() => setActiveTab('projects')} />
                <MenuCard icon={<BookText />} title="Ödev Takibi" description="Ödev oluşturun ve takibini yapın." onClick={() => setActiveTab('homework')} />
                <MenuCard icon={<List />} title="Sınıf Risk Haritası" description="Risk haritası ve istatistiklerini görüntüleyin." onClick={() => setActiveTab('risks')} />
                <MenuCard icon={<FileSignature />} title="Bilgi Formları" description="Öğrenci bilgi formu durumlarını takip edin." onClick={() => setActiveTab('forms')} />
                <MenuCard icon={<Scale />} title="Disiplin Süreci" description="MEB yönetmeliğine uygun süreç takibi." onClick={() => setActiveTab('discipline')} />
                <MenuCard icon={<MessageCircle />} title="İletişim Paneli" description="Duyurular ve veli/öğrenci mesajları." onClick={() => setActiveTab('communication')} />
                <MenuCard icon={<ClipboardCheck />} title="Anket Modülü" description="Anketler oluşturun ve uygulayın." onClick={() => setActiveTab('surveys')} />
            </div>
        </div>
    );
  }


  return (
      <div className="flex flex-col min-h-screen w-full bg-muted/40">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            {renderContent()}
          </main>
      </div>
  );
}
