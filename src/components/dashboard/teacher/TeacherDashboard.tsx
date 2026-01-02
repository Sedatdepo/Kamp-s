

"use client";

import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { Header } from '@/components/dashboard/Header';
import { StudentManagementTab } from '@/components/dashboard/teacher/StudentManagementTab';
import { StudentListTab } from './StudentListTab';
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
import ExamBuilder from './ExamBuilder';
import { BepTab } from './BepTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2, Calendar, ChevronDown, Users, ArrowLeft, Plus, Trash2, Edit, BookText, Vote, Grid, ClipboardList, List, Gauge, MessageCircle, FileSignature, Home, FileHeart, ClipboardCheck, Scale, FileQuestion, Target, FolderKanban } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { AttendanceTab } from './AttendanceTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type ActiveTab = "dashboard" | "students" | "grading" | "planning" | "election" | "projects" | "homework" | "risks" | "forms" | "communication" | "dilekce" | "surveys" | "discipline" | "questionbank" | "bep";

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
    setOrderedClasses
}: { 
    onSelectClass: (id: string) => void;
    classes: Class[];
    students: Student[];
    loading: boolean;
    setOrderedClasses: React.Dispatch<React.SetStateAction<Class[]>>;
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
  "risks": { label: "Rehberlik Araçları", icon: List },
  "forms": { label: "Bilgi Formları", icon: FileSignature },
  "communication": { label: "İletişim", icon: MessageCircle },
  "dilekce": { label: "Dilekçe Sihirbazı", icon: FileSignature },
  "surveys": { label: "Anket Modülü", icon: ClipboardCheck },
  "discipline": { label: "Disiplin Süreci", icon: Scale },
  "questionbank": { label: "Sınav Hazırlama Modülü", icon: FileQuestion },
  "bep": { label: "BEP Modülü", icon: FileHeart },
} as const;


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
    // Automatically create a class if the teacher has none
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


  const currentClass = useMemo(() => orderedClasses?.find((c: Class) => c.id === selectedClassId), [orderedClasses, selectedClassId]);

  const studentsQuery = useMemo(() => (selectedClassId && db ? query(collection(db, 'students'), where('classId', '==', selectedClassId)) : null), [selectedClassId, db]);
  const { data: students } = useFirestore<Student[]>('students-in-class', studentsQuery);

  const allStudentsForTeacherQuery = useMemo(() => {
    if (!teacherId || !db) return null;
    const classIds = (classes || []).map(c => c.id);
    if (classIds.length === 0) return null;
    return query(collection(db, 'students'), where('classId', 'in', classIds));
  }, [teacherId, db, classes]);
  const { data: allStudents } = useFirestore<Student[]>('all-students-for-count', allStudentsForTeacherQuery);

  const isLoading = teacherLoading || (selectedClassId && classesLoading);
  
  const renderContent = () => {
    if (isLoading && selectedClassId) {
      return (
        <div className="flex justify-center items-center h-full p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!selectedClassId) {
        return (
            <Tabs defaultValue="classes">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="classes"><School className="mr-2"/>Sınıflarınız</TabsTrigger>
                    <TabsTrigger value="documents"><FolderKanban className="mr-2"/>Evraklar</TabsTrigger>
                </TabsList>
                <TabsContent value="classes" className="mt-4">
                     <ClassSelectionScreen onSelectClass={setSelectedClassId} classes={orderedClasses || []} students={allStudents || []} loading={classesLoading} setOrderedClasses={setAndStoreOrderedClasses}/>
                </TabsContent>
                <TabsContent value="documents" className="mt-4">
                     <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <MenuCard icon={<FileSignature />} title="Dilekçe Sihirbazı" description="Resmi dilekçeler ve tutanaklar oluşturun." onClick={() => setActiveTab('dilekce')} />
                    </div>
                </TabsContent>
            </Tabs>
        )
    }

    if (activeTab !== "dashboard") {
        let tabContent;
        switch(activeTab) {
            case 'students':
                tabContent = (
                    <StudentManagementTab
                        studentList={<StudentListTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />}
                        attendance={<AttendanceTab students={students || []} currentClass={currentClass} />}
                        dutyRoster={<DutyRosterTab students={students || []} currentClass={currentClass} teacherProfile={teacherProfile} db={db!} />}
                        seatingPlan={<SeatingPlanTab students={students || []} currentClass={currentClass} teacherProfile={teacherProfile} db={db!} />}
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
                tabContent = <ProjectDistributionTab classId={selectedClassId} teacherProfile={teacherProfile} currentClass={currentClass} />;
                break;
            case 'homework':
                tabContent = <HomeworkTab classId={selectedClassId} currentClass={currentClass} teacherProfile={teacherProfile} students={allStudents || []} classes={classes || []}/>;
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
            case 'questionbank':
                tabContent = <ExamBuilder />;
                break;
            case 'bep':
                tabContent = <BepTab />;
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
                <MenuCard icon={<List />} title="Rehberlik Araçları" description="Risk haritası ve bilgi formları." onClick={() => setActiveTab('risks')} />
                <MenuCard icon={<Scale />} title="Disiplin Süreci" description="MEB yönetmeliğine uygun süreç takibi." onClick={() => setActiveTab('discipline')} />
                <MenuCard icon={<MessageCircle />} title="İletişim Paneli" description="Duyurular ve veli/öğrenci mesajları." onClick={() => setActiveTab('communication')} />
                <MenuCard icon={<ClipboardCheck />} title="Anket Modülü" description="Anketler oluşturun ve uygulayın." onClick={() => setActiveTab('surveys')} />
                <MenuCard icon={<FileQuestion />} title="Sınav Hazırlama Modülü" description="Soru bankası ve sınav oluşturucu." onClick={() => setActiveTab('questionbank')} isDisabled={false} />
                <MenuCard icon={<Target />} title="Kazanımlar" description="Ders kazanımlarını yönetin." onClick={() => {}} isDisabled={true} />
                <MenuCard icon={<FileHeart />} title="BEP Modülü" description="Bireyselleştirilmiş eğitim programları." onClick={() => setActiveTab('bep')} />
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

    
