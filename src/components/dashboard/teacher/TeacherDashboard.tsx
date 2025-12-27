
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button';
import { StudentListTab } from '@/components/dashboard/teacher/StudentListTab';
import { ProjectDistributionTab } from '@/components/dashboard/teacher/ProjectDistributionTab';
import { RiskMapTab } from '@/components/dashboard/teacher/RiskMapTab';
import { InfoFormsTab } from '@/components/dashboard/teacher/InfoFormsTab';
import { GradingToolTab } from '@/components/dashboard/teacher/GradingToolTab';
import { CommunicationTab } from '@/components/dashboard/teacher/CommunicationTab';
import { ReportTab } from '@/components/dashboard/teacher/ReportTab';
import { AttendanceTab } from '@/components/dashboard/teacher/AttendanceTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2, Calendar, ChevronDown, Users, ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { doc, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const TABS = [
    { value: "students", label: "Öğrenci Listesi", icon: null },
    { value: "attendance", label: "Yoklama", icon: <Calendar className="w-4 h-4 mr-2"/> },
    { value: "grading", label: "Değerlendirme", icon: null },
    { value: "projects", label: "Proje Dağılımı", icon: null },
    { value: "risks", label: "Risk Haritası", icon: null },
    { value: "forms", label: "Bilgi Formları", icon: null },
    { value: "communication", label: "İletişim", icon: null },
    { value: "report", label: "Rapor", icon: null },
];

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
    students: allStudents 
}: { 
    onSelectClass: (id: string) => void; 
    students: Student[];
}) {
    const { appUser } = useAuth();
    const { toast } = useToast();
    const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

    const classesQuery = useMemo(() => query(collection(db, 'classes'), where('teacherId', '==', teacherId)), [teacherId]);
    const { data: classes, loading } = useFirestore<Class>('classes', teacherId ? classesQuery : null);

    const [newClassName, setNewClassName] = useState('');
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

    const handleAddClass = async () => {
        if (!newClassName.trim() || !teacherId) return;
        try {
            await addDoc(collection(db, 'classes'), {
                name: newClassName,
                teacherId: teacherId,
                isProjectSelectionActive: false,
                isRiskFormActive: false,
                isInfoFormActive: false,
                code: generateClassCode(),
                announcements: []
            });
            toast({ title: 'Sınıf oluşturuldu!' });
            setNewClassName('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf oluşturulamadı.' });
        }
    };

    const handleUpdateClass = async () => {
        if (!editingClass || !editingClass.name.trim()) return;
        await updateDoc(doc(db, 'classes', editingClass.id), { name: editingClass.name });
        toast({ title: 'Sınıf adı güncellendi' });
        setEditingClass(null);
    };

    const handleDeleteClass = async (classId: string) => {
        if (window.confirm("Bu sınıfı ve içindeki TÜM öğrencileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
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
    }
    
    const studentCounts = useMemo(() => {
        const counts = new Map<string, number>();
        classes.forEach(cls => {
            const count = allStudents.filter(s => s.classId === cls.id).length;
            counts.set(cls.id, count);
        })
        return counts;
    }, [allStudents, classes]);


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
        <div>
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
                        <Card key={cls.id} className="flex flex-col hover:shadow-lg transition-shadow">
                            <div className="flex-1 cursor-pointer" onClick={() => onSelectClass(cls.id)}>
                                <CardHeader>
                                    <CardTitle>{cls.name}</CardTitle>
                                    <CardDescription>Sınıf Kodu: {cls.code}</CardDescription>
                                </CardHeader>
                            </div>
                            <CardContent className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
                                <span>{studentCounts.get(cls.id) || 0} Öğrenci</span>
                                <div className="flex items-center">
                                    <Dialog onOpenChange={(open) => !open && setEditingClass(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingClass(cls)}>
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteClass(cls.id)} disabled={deletingClassId === cls.id}>
                                       {deletingClassId === cls.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             )}
        </div>
    );
}


export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("students");
  const { appUser } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const teacherQuery = useMemo(() => teacherId ? doc(db, 'teachers', teacherId) : null, [teacherId]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData.length > 0 ? teacherData[0] : null;

  const classQuery = useMemo(() => selectedClassId ? doc(db, 'classes', selectedClassId) : null, [selectedClassId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${selectedClassId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => selectedClassId ? query(collection(db, 'students'), where('classId', '==', selectedClassId)) : null, [selectedClassId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${selectedClassId}`, studentsQuery);
  
  const allStudentsForTeacherQuery = useMemo(() => {
    if (!teacherId) return null;
    // This is not a direct query, but we need all students to calculate counts per class.
    // The useFirestore hook will handle fetching all documents from the students collection.
    // In a real-world scenario with many students, this should be optimized.
    // For now, we'll fetch all students and filter client-side.
    // A better approach would be to have a 'teacherId' on each student.
    // Let's assume we can get all classes first, then get students for those classes.
    return query(collection(db, 'students'));
  }, [teacherId]);
  const { data: allStudents } = useFirestore<Student>('all-students-for-count', allStudentsForTeacherQuery);

  const isLoading = teacherLoading || (selectedClassId && (classLoading || studentsLoading));
  
  const activeTabLabel = TABS.find(t => t.value === activeTab)?.label;

  return (
      <div className="flex flex-col min-h-screen w-full bg-muted/40">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            {!selectedClassId ? (
                 <ClassSelectionScreen onSelectClass={setSelectedClassId} students={allStudents} />
            ) : isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div>
                   <Button variant="ghost" onClick={() => setSelectedClassId(null)} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Tüm Sınıflar
                    </Button>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                    {/* Mobile Dropdown Menu */}
                    <div className="md:hidden mb-4">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full">
                            {TABS.find(t => t.value === activeTab)?.icon}
                            {activeTabLabel}
                            <ChevronDown className="ml-auto h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                            {TABS.map(tab => (
                                <DropdownMenuItem key={tab.value} onClick={() => setActiveTab(tab.value)}>
                                    {tab.icon}{tab.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop Tabs */}
                    <TabsList className="hidden md:grid w-full grid-cols-8">
                        {TABS.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                {tab.icon}{tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    <TabsContent value="students" className="mt-4">
                        <StudentListTab 
                        classId={selectedClassId} 
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="attendance" className="mt-4">
                        <AttendanceTab 
                        students={students}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="grading" className="mt-4">
                        <GradingToolTab 
                        classId={selectedClassId}
                        teacherProfile={teacherProfile}
                        students={students}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="projects" className="mt-4">
                        <ProjectDistributionTab 
                        classId={selectedClassId}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="risks" className="mt-4">
                        <RiskMapTab 
                        classId={selectedClassId}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="forms" className="mt-4">
                        <InfoFormsTab 
                        classId={selectedClassId}
                        teacherProfile={teacherProfile}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="communication" className="mt-4">
                        <CommunicationTab
                        classId={selectedClassId}
                        currentClass={currentClass}
                        />
                    </TabsContent>
                    <TabsContent value="report" className="mt-4">
                        <ReportTab />
                    </TabsContent>
                    </Tabs>
                </div>
            )}
          </main>
      </div>
  );
}

    