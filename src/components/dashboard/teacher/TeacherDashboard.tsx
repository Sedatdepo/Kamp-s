"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Header } from '@/components/dashboard/Header';
import { StudentListTab } from '@/components/dashboard/teacher/StudentListTab';
import { ProjectDistributionTab } from '@/components/dashboard/teacher/ProjectDistributionTab';
import { RiskMapTab } from '@/components/dashboard/teacher/RiskMapTab';
import { InfoFormsTab } from '@/components/dashboard/teacher/InfoFormsTab';
import { GradingToolTab } from '@/components/dashboard/teacher/GradingToolTab';
import { CommunicationTab } from '@/components/dashboard/teacher/CommunicationTab';
import { HomeworkTab } from '@/components/dashboard/teacher/HomeworkTab';
import { AttendanceTab } from '@/components/dashboard/teacher/AttendanceTab';
import { ElectionTab } from '@/components/dashboard/teacher/ElectionTab';
import { DutyRosterTab } from '@/components/dashboard/teacher/DutyRosterTab';
import { SeatingPlanTab } from '@/components/dashboard/teacher/SeatingPlanTab';
import { AnnualPlanTab } from '@/components/dashboard/teacher/AnnualPlanTab';
import { DilekceTab } from '@/components/dashboard/teacher/DilekceTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2, Calendar, ChevronDown, Users, ArrowLeft, Plus, Trash2, Edit, BookText, Vote, Grid, ClipboardList, List, Gauge, MessageCircle, FileSignature, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { doc, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

type ActiveTab = "dashboard" | "students" | "attendance" | "dutyRoster" | "seatingPlan" | "grading" | "planning" | "election" | "projects" | "homework" | "risks" | "forms" | "communication" | "dilekce";

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
    students: allStudents 
}: { 
    onSelectClass: (id: string) => void; 
    students: Student[];
}) {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

    const classesQuery = useMemo(() => (teacherId && db) ? query(collection(db, 'classes'), where('teacherId', '==', teacherId)) : null, [teacherId, db]);
    const { data: classes, loading } = useFirestore('classes', classesQuery);

    const [newClassName, setNewClassName] = useState('');
    const [editingClass, setEditingClass] = useState<Class | null>(null);
    const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

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
                             <div className="flex-1 cursor-pointer p-6" onClick={() => onSelectClass(cls.id)}>
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
                                                    Bu sınıfı ({cls.name}) ve içindeki TÜM öğrencileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!
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
                    ))}
                </div>
             )}
        </div>
    );
}

const TABS_CONFIG = {
  "dashboard": { label: "Panel", icon: School },
  "students": { label: "Öğrenci Yönetimi", icon: Users },
  "attendance": { label: "Yoklama", icon: Calendar },
  "dutyRoster": { label: "Nöbet Listesi", icon: Users },
  "seatingPlan": { label: "Oturma Planı", icon: Grid },
  "grading": { label: "Değerlendirme Aracı", icon: Gauge },
  "planning": { label: "Planlama Araçları", icon: ClipboardList },
  "election": { label: "Sınıf Seçimleri", icon: Vote },
  "projects": { label: "Ödev & Proje Takibi", icon: BookText },
  "risks": { label: "Rehberlik Araçları", icon: List },
  "communication": { label: "İletişim Paneli", icon: MessageCircle },
  "dilekce": { label: "Dilekçe Sihirbazı", icon: FileSignature },
} as const;


export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const { appUser, db } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const teacherQuery = useMemo(() => (teacherId && db) ? doc(db, 'teachers', teacherId) : null, [teacherId, db]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData.length > 0 ? teacherData[0] : null;

  const classQuery = useMemo(() => (selectedClassId && db) ? doc(db, 'classes', selectedClassId) : null, [selectedClassId, db]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${selectedClassId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => (selectedClassId && db) ? query(collection(db, 'students'), where('classId', '==', selectedClassId)) : null, [selectedClassId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${selectedClassId}`, studentsQuery);
  
  const allStudentsForTeacherQuery = useMemo(() => {
    if (!teacherId || !db) return null;
    return query(collection(db, 'students'));
  }, [teacherId, db]);
  const { data: allStudents } = useFirestore<Student>('all-students-for-count', allStudentsForTeacherQuery);

  const isLoading = teacherLoading || (selectedClassId && (classLoading || studentsLoading));
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!selectedClassId) {
        return <ClassSelectionScreen onSelectClass={setSelectedClassId} students={allStudents} />;
    }

    switch(activeTab) {
        case 'students': return <StudentListTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
        case 'attendance': return <AttendanceTab students={students} currentClass={currentClass} />;
        case 'dutyRoster': return <DutyRosterTab students={students} currentClass={currentClass} teacherProfile={teacherProfile} />;
        case 'seatingPlan': return <SeatingPlanTab students={students} currentClass={currentClass} teacherProfile={teacherProfile} />;
        case 'grading': return <GradingToolTab classId={selectedClassId} teacherProfile={teacherProfile} students={students} currentClass={currentClass} />;
        case 'planning': return <Suspense fallback={<div>Yükleniyor...</div>}><AnnualPlanTab teacherProfile={teacherProfile} currentClass={currentClass} /></Suspense>;
        case 'election': return <ElectionTab students={students} currentClass={currentClass} />;
        case 'projects': return <ProjectDistributionTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
        case 'homework': return <HomeworkTab classId={selectedClassId} currentClass={currentClass} />;
        case 'risks': return <RiskMapTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
        case 'forms': return <InfoFormsTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
        case 'communication': return <CommunicationTab classId={selectedClassId} currentClass={currentClass} />;
        case 'dilekce': return <DilekceTab teacherProfile={teacherProfile} />;
        case 'dashboard':
        default:
            return (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="font-headline text-2xl">{currentClass?.name || 'Sınıf Paneli'}</CardTitle>
                                <Button variant="ghost" onClick={() => setSelectedClassId(null)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Tüm Sınıflar
                                </Button>
                            </div>
                            <CardDescription>Sınıfınıza ait modüllere aşağıdan erişebilirsiniz.</CardDescription>
                        </CardHeader>
                    </Card>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <MenuCard icon={<Users />} title="Öğrenci Yönetimi" description="Liste, devamsızlık ve oturma planı." onClick={() => setActiveTab('students')} />
                        <MenuCard icon={<Gauge />} title="Değerlendirme Aracı" description="Performans, proje ve davranış notları." onClick={() => setActiveTab('grading')} />
                        <MenuCard icon={<ClipboardList />} title="Planlama Araçları" description="Yıllık plan ve günlük plan oluşturun." onClick={() => setActiveTab('planning')} />
                        <MenuCard icon={<FileSignature />} title="Dilekçe Sihirbazı" description="Resmi dilekçeler ve tutanaklar oluşturun." onClick={() => setActiveTab('dilekce')} />
                        <MenuCard icon={<Vote />} title="Seçim Modülü" description="Sınıf başkanlığı ve temsilci seçimi." onClick={() => setActiveTab('election')} />
                        <MenuCard icon={<BookText />} title="Ödev & Proje Takibi" description="Proje dağıtımı ve ödev yönetimi." onClick={() => setActiveTab('projects')} />
                        <MenuCard icon={<List />} title="Rehberlik Araçları" description="Risk haritası ve bilgi formları." onClick={() => setActiveTab('risks')} />
                        <MenuCard icon={<MessageCircle />} title="İletişim Paneli" description="Duyurular ve veli/öğrenci mesajları." onClick={() => setActiveTab('communication')} />
                    </div>
                </div>
            );
    }
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
