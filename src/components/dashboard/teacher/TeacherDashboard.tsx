'use client';

import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/dashboard/Header';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2, ChevronDown, Users, ArrowLeft, Plus, Trash2, Edit, BookText, Vote, Grid, ClipboardList, List, Gauge, MessageCircle, FileSignature, Home, FileHeart, ClipboardCheck, Scale, Target, FolderKanban, Users2, User, FileQuestion, BarChart3, Drama, Trophy, Share2, MessagesSquare, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Class, Student, TeacherProfile, Lesson, RiskFactor, Club } from '@/lib/types';
import { doc, collection, query, where, addDoc, updateDoc, deleteDoc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
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
import { ProfileDialog } from './ProfileDialog';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
);

// Dynamically import all tab components
const StudentManagementTab = dynamic(() => import('@/components/dashboard/teacher/StudentManagementTab').then(mod => mod.StudentManagementTab), { loading: LoadingSpinner });
const KazanımlarTab = dynamic(() => import('./KazanımlarTab'), { loading: LoadingSpinner });
const ProjectDistributionTab = dynamic(() => import('@/components/dashboard/teacher/ProjectDistributionTab').then(mod => mod.ProjectDistributionTab), { loading: LoadingSpinner });
const RiskMapTab = dynamic(() => import('@/components/dashboard/teacher/RiskMapTab').then(mod => mod.RiskMapTab), { loading: LoadingSpinner });
const InfoFormsTab = dynamic(() => import('@/components/dashboard/teacher/InfoFormsTab').then(mod => mod.InfoFormsTab), { loading: LoadingSpinner });
const GradingToolTab = dynamic(() => import('@/components/dashboard/teacher/GradingToolTab').then(mod => mod.GradingToolTab), { loading: LoadingSpinner });
const CommunicationTab = dynamic(() => import('@/components/dashboard/teacher/CommunicationTab').then(mod => mod.CommunicationTab), { loading: LoadingSpinner });
const HomeworkTab = dynamic(() => import('@/components/dashboard/teacher/HomeworkTab').then(mod => mod.HomeworkTab), { loading: LoadingSpinner });
const ElectionTab = dynamic(() => import('@/components/dashboard/teacher/ElectionTab').then(mod => mod.ElectionTab), { loading: LoadingSpinner });
const AnnualPlanTab = dynamic(() => import('@/components/dashboard/teacher/AnnualPlanTab').then(mod => mod.AnnualPlanTab), { loading: LoadingSpinner });
const DilekceTab = dynamic(() => import('@/components/dashboard/teacher/DilekceTab').then(mod => mod.DilekceTab), { loading: LoadingSpinner });
const SurveyTab = dynamic(() => import('@/components/dashboard/teacher/SurveyTab').then(mod => mod.SurveyTab), { loading: LoadingSpinner });
const DisciplineTab = dynamic(() => import('./DisciplineTab').then(mod => mod.DisciplineTab), { loading: LoadingSpinner });
const BepTab = dynamic(() => import('./BepTab').then(mod => mod.BepTab), { loading: LoadingSpinner });
const VeliToplantisiTab = dynamic(() => import('./VeliToplantisiTab'), { loading: LoadingSpinner });
const SokTab = dynamic(() => import('./SokTab'), { loading: LoadingSpinner });
const MebClubTab = dynamic(() => import('./MebClubTab'), { loading: LoadingSpinner });
const SocialClubTab = dynamic(() => import('./SocialClubTab').then(mod => mod.SocialClubTab), { loading: LoadingSpinner });
const SociogramTab = dynamic(() => import('./SociogramTab').then(mod => mod.SociogramTab), { loading: LoadingSpinner });
const ZumreTab = dynamic(() => import('./ZumreTab'), { loading: LoadingSpinner });
const ExamBuilder = dynamic(() => import('./ExamBuilder'), { loading: LoadingSpinner });
const ExamAnalysisTab = dynamic(() => import('./ExamAnalysisTab').then(mod => mod.ExamAnalysisTab), { loading: LoadingSpinner });
const SinifKahramanlariTab = dynamic(() => import('./SinifKahramanlariTab').then(mod => mod.SinifKahramanlariTab), { loading: LoadingSpinner });
const DiscussionBoardTab = dynamic(() => import('./DiscussionBoardTab').then(mod => mod.DiscussionBoardTab), { loading: LoadingSpinner });
const TimetableTab = dynamic(() => import('./TimetableTab'), { loading: LoadingSpinner });
const AgendaTab = dynamic(() => import('./AgendaTab'), { loading: LoadingSpinner });


type ActiveTab = "dashboard" | "students" | "grading" | "planning" | "election" | "projects" | "homework" | "risks" | "forms" | "communication" | "dilekce" | "surveys" | "discipline" | "bep" | "zumre" | "veli-toplantisi" | "sok" | "kazanimlar" | "exam-builder" | "exam-analysis" | "meb-club" | "social-club" | "gamification" | "sociogram" | "discussion" | "timetable" | "agenda";

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
    setIsProfileOpen,
    initialTab = 'classes',
}: { 
    onSelectClass: (id: string | null) => void;
    classes: Class[];
    students: Student[];
    loading: boolean;
    setOrderedClasses: React.Dispatch<React.SetStateAction<Class[]>>;
    setActiveTab: (tab: ActiveTab) => void;
    setIsProfileOpen: (isOpen: boolean) => void;
    initialTab?: 'classes' | 'documents';
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
        
        const newClassCode = generateClassCode();
        const newClassRef = doc(collection(db, 'classes'));
        const classCodeRef = doc(db, 'classCodes', newClassCode);

        try {
            const batch = writeBatch(db);
            
            batch.set(newClassRef, {
                name: newClassName,
                teacherId: teacherId,
                isProjectSelectionActive: false,
                isRiskFormActive: false,
                isInfoFormActive: false,
                isElectionActive: false,
                code: newClassCode,
                announcements: [],
                homeworks: [],
            });

            batch.set(classCodeRef, {
                classId: newClassRef.id,
            });

            await batch.commit();
            
            toast({ title: 'Sınıf oluşturuldu!' });
            setNewClassName('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf oluşturulamadı. Lütfen Firestore kurallarınızı kontrol edin.' });
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
            const batch = writeBatch(db);

            const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
            const studentsSnapshot = await getDocs(studentsQuery);
            studentsSnapshot.forEach(studentDoc => {
                batch.delete(studentDoc.ref);
            });

            const subcollections = ['homeworks', 'discussionTopics'];
            for (const sub of subcollections) {
                const subQuery = query(collection(db, `classes/${classId}/${sub}`));
                const subSnapshot = await getDocs(subQuery);
                 for (const itemDoc of subSnapshot.docs) {
                    if(sub === 'homeworks') {
                        const submissionsQuery = query(collection(db, `classes/${classId}/homeworks/${itemDoc.id}/submissions`));
                        const submissionsSnapshot = await getDocs(submissionsQuery);
                        submissionsSnapshot.forEach(subDoc => batch.delete(subDoc.ref));
                    }
                     if(sub === 'discussionTopics') {
                        const postsQuery = query(collection(db, `classes/${classId}/discussionTopics/${itemDoc.id}/posts`));
                        const postsSnapshot = await getDocs(postsQuery);
                        postsSnapshot.forEach(postDoc => batch.delete(postDoc.ref));
                    }
                    batch.delete(itemDoc.ref);
                }
            }
            
            const classRef = doc(db, 'classes', classId);
            batch.delete(classRef);

            await batch.commit();

            toast({ title: 'Sınıf Tamamen Silindi', description: 'Sınıf ve ona ait tüm veriler silindi.', variant: 'destructive' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Sınıf silinirken bir hata oluştu.' });
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

        const newOrder = [...classes];
        const [draggedItem] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        
        setOrderedClasses(newOrder);
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
        <Tabs defaultValue={initialTab}>
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
                                <Card className="flex flex-col hover:shadow-lg transition-shadow h-full">
                                    <div className="flex-1 p-6 cursor-pointer" onClick={() => onSelectClass(cls.id)}>
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
                                                        onClick={() => setEditingClass(cls)}
                                                    >
                                                        <Edit className="h-4 w-4"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>Sınıf Adını Düzenle</DialogTitle></DialogHeader>
                                                    <Input defaultValue={cls.name} onChange={(e) => setEditingClass(prev => prev ? {...prev, name: e.target.value} : { ...cls, name: e.target.value })}/>
                                                    <DialogClose asChild>
                                                        <Button onClick={handleUpdateClass}>Kaydet</Button>
                                                    </DialogClose>
                                                </DialogContent>
                                            </Dialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
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
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Bu sınıfı ({cls.name}) ve içindeki TÜM ÖĞRENCİLERİ kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!
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
                    <MenuCard icon={<Target />} title="Kazanımlar" description="Ders kazanımlarını yönetin." onClick={() => setActiveTab('kazanimlar')} />
                    <MenuCard icon={<FileQuestion />} title="Soru Bankası" description="AI ile sınav soruları oluşturun." onClick={() => setActiveTab('exam-builder')} />
                    <MenuCard icon={<Trophy />} title="Kulüp Evrak" description="Sosyal etkinlik ve kulüp yönetimi." onClick={() => setActiveTab('meb-club')} />
                    <MenuCard icon={<Clock />} title="Ders Programı" description="Haftalık ders programı oluşturun." onClick={() => setActiveTab('timetable')} />
                    <MenuCard icon={<ClipboardCheck />} title="Ajanda" description="Planlayıcı, hatırlatıcı ve not defteri." onClick={() => setActiveTab('agenda')} />
                </div>
            </TabsContent>
        </Tabs>
    );
}

const TABS_CONFIG = {
  "dashboard": { label: "Panel", icon: School },
  "students": { label: "Öğrenci Yönetimi", icon: Users },
  "grading": { label: "Değerlendirme Aracı", icon: Gauge },
  "planning": { label: "Yıllık Plan", icon: ClipboardList },
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
  "kazanimlar": { label: "Kazanımlar", icon: Target },
  "exam-builder": { label: "Soru Bankası", icon: FileQuestion },
  "exam-analysis": { label: "Sınav Analizi", icon: BarChart3 },
  "meb-club": { label: "Kulüp Evrak", icon: Trophy },
  "social-club": { label: "Sosyal Etkinlik Yönetimi", icon: Drama },
  "gamification": { label: "Rozetler", icon: Trophy },
  "sociogram": { label: "Sosyogram", icon: Share2 },
  "discussion": { label: "Tartışma Panosu", icon: MessagesSquare },
  "timetable": { label: "Ders Programı", icon: Clock },
  "agenda": { label: "Ajanda", icon: ClipboardCheck },
} as const;


export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const { appUser, db } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [initialMainTab, setInitialMainTab] = useState<'classes' | 'documents'>('classes');
  
  const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;
  
  const classesQuery = useMemoFirebase(() => {
    if (!teacherId || !db) return null;
    return query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  }, [db, teacherId]);

  const { data: classes, isLoading: classesLoading } = useCollection<Class>(classesQuery);
  
  const allStudentsQuery = useMemoFirebase(() => {
    if (!teacherId || !db) return null;
    return query(collection(db, 'students'), where('teacherId', '==', teacherId));
  }, [db, teacherId]);
  const { data: allStudents, isLoading: allStudentsLoading } = useCollection<Student>(allStudentsQuery);
  
  const lessonsQuery = useMemoFirebase(() => (teacherId && db ? query(collection(db, 'lessons'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  
  const clubsQuery = useMemoFirebase(() => (teacherId && db ? query(collection(db, 'clubs'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

  const riskFactorsQuery = useMemoFirebase(() => (teacherId && db ? query(collection(db, 'riskFactors'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: riskFactors, isLoading: factorsLoading } = useCollection<RiskFactor>(riskFactorsQuery);

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

  const currentClass = useMemo(() => classes?.find((c: Class) => c.id === selectedClassId), [classes, selectedClassId]);
  
  const studentsForSelectedClass = useMemo(() => {
    if (!selectedClassId || !allStudents) return [];
    return allStudents.filter(s => s.classId === selectedClassId);
  }, [selectedClassId, allStudents]);

  const centralDataLoading = classesLoading || allStudentsLoading || lessonsLoading || factorsLoading || clubsLoading;
  
  const handleBackToDashboard = () => {
    setActiveTab("dashboard");
  };

  const handleSelectClass = (classId: string | null) => {
    setSelectedClassId(classId);
    setActiveTab("dashboard");
    setInitialMainTab('classes');
  };
  
  const handleBackToDocuments = () => {
    setSelectedClassId(null);
    setActiveTab('dashboard'); 
    setInitialMainTab('documents');
  };

  const renderContent = () => {
    let tabContent;
    const fullPageTabs: ActiveTab[] = ['dilekce', 'zumre', 'veli-toplantisi', 'sok', 'kazanimlar', 'exam-builder', 'meb-club', 'timetable', 'agenda', 'bep'];
    if (!selectedClassId && fullPageTabs.includes(activeTab)) {
        switch(activeTab) {
          case 'dilekce': tabContent = <DilekceTab teacherProfile={teacherProfile} />; break;
          case 'zumre': tabContent = <ZumreTab />; break;
          case 'veli-toplantisi': tabContent = <VeliToplantisiTab />; break;
          case 'sok': tabContent = <SokTab />; break;
          case 'kazanimlar': tabContent = <KazanımlarTab />; break;
          case 'exam-builder': tabContent = <ExamBuilder classes={classes || []} students={allStudents || []} />; break;
          case 'meb-club': tabContent = <MebClubTab classes={classes || []} allStudents={allStudents || []} teacherProfile={teacherProfile} />; break;
          case 'timetable': tabContent = <TimetableTab classes={classes || []} lessons={lessons || []} />; break;
          case 'agenda': tabContent = <AgendaTab />; break;
          case 'bep': tabContent = <BepTab teacherProfile={teacherProfile} currentClass={currentClass} />; break;
          default: tabContent = null;
        }
        return (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                {React.createElement(TABS_CONFIG[activeTab]?.icon || School, { className: "w-7 h-7 text-primary" })}
                {TABS_CONFIG[activeTab]?.label}
              </h2>
              <Button variant="outline" onClick={handleBackToDocuments}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Evraklar Modülüne Dön
              </Button>
            </div>
            {tabContent}
          </div>
        );
    }
    
    if (!selectedClassId) {
        return <ClassSelectionScreen onSelectClass={handleSelectClass} classes={orderedClasses || []} students={allStudents || []} loading={classesLoading} setOrderedClasses={setAndStoreOrderedClasses} setActiveTab={setActiveTab} setIsProfileOpen={setIsProfileOpen} initialTab={initialMainTab} />;
    }
    
    if (centralDataLoading && activeTab !== 'dashboard') {
        return <div className="flex justify-center items-center h-full p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (activeTab === 'dashboard') {
      return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <h1 className="text-2xl font-headline">{currentClass?.name || 'Sınıf Paneli'}</h1>
                         <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => handleSelectClass(null)} className="h-9">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Sınıf Seçimine Dön
                            </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline">
                                    {currentClass?.name}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {(orderedClasses || []).map((cls: Class) => (
                                      <DropdownMenuItem key={cls.id} onSelect={() => handleSelectClass(cls.id)}>
                                          {cls.name}
                                      </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                    </div>
                    <CardDescription>Sınıfınıza ait modüllere aşağıdan erişebilirsiniz.</CardDescription>
                </CardHeader>
            </Card>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <MenuCard icon={<Users />} title="Öğrenci Yönetimi" description="Liste, devamsızlık ve oturma planı." onClick={() => setActiveTab('students')} />
                <MenuCard icon={<Gauge />} title="Değerlendirme Aracı" description="Performans, proje ve davranış notları." onClick={() => setActiveTab('grading')} />
                <MenuCard icon={<FileHeart />} title="BEP Modülü" description="Bireyselleştirilmiş eğitim planları." onClick={() => setActiveTab('bep')} />
                <MenuCard icon={<Trophy />} title="Rozetler" description="Puan ve rozetlerle sınıfı oyunlaştırın." onClick={() => setActiveTab('gamification')} />
                <MenuCard icon={<Share2 />} title="Sosyogram" description="Sınıf içi ilişki haritasını çıkarın." onClick={() => setActiveTab('sociogram')} />
                <MenuCard icon={<MessageCircle />} title="İletişim Paneli" description="Duyurular ve öğrenci mesajları." onClick={() => setActiveTab('communication')} />
                <MenuCard icon={<MessagesSquare />} title="Tartışma Panosu" description="Sınıf içi konuları tartışmaya açın." onClick={() => setActiveTab('discussion')} />
                <MenuCard icon={<ClipboardList />} title="Yıllık Plan" description="Yıllık plan ve günlük plan oluşturun." onClick={() => setActiveTab('planning')} />
                <MenuCard icon={<BarChart3 />} title="Sınav Analizi" description="Sınav sonuçlarını ve kazanımları analiz et." onClick={() => setActiveTab('exam-analysis')} />
                <MenuCard icon={<Vote />} title="Seçim Modülü" description="Sınıf başkanlığı ve temsilci seçimi." onClick={() => setActiveTab('election')} />
                <MenuCard icon={<BookText />} title="Proje Dağıtımı" description="Öğrencilerin proje tercihlerini yönetin." onClick={() => setActiveTab('projects')} />
                <MenuCard icon={<BookText />} title="Ödev Takibi" description="Ödev oluşturun ve takibini yapın." onClick={() => setActiveTab('homework')} />
                <MenuCard icon={<List />} title="Sınıf Risk Haritası" description="Risk haritası ve istatistiklerini görüntüleyin." onClick={() => setActiveTab('risks')} />
                <MenuCard icon={<FileSignature />} title="Bilgi Formları" description="Öğrenci bilgi formu durumlarını takip edin." onClick={() => setActiveTab('forms')} />
                <MenuCard icon={<Scale />} title="Disiplin Süreci" description="MEB yönetmeliğine uygun süreç takibi." onClick={() => setActiveTab('discipline')} />
                <MenuCard icon={<Drama />} title="Sosyal Kulüpler" description="Kulüp ve sosyal etkinlik atamaları." onClick={() => setActiveTab('social-club')} />
                <MenuCard icon={<ClipboardCheck />} title="Anket Modülü" description="Anketler oluşturun ve uygulayın." onClick={() => setActiveTab('surveys')} />
            </div>
        </div>
      );
    }
    
    switch(activeTab) {
        case 'students': tabContent = <StudentManagementTab students={studentsForSelectedClass} classes={classes || []} currentClass={currentClass} teacherProfile={teacherProfile} />; break;
        case 'grading': tabContent = <GradingToolTab classId={selectedClassId!} teacherProfile={teacherProfile!} students={studentsForSelectedClass} currentClass={currentClass} />; break;
        case 'planning': tabContent = <Suspense fallback={<div>Yükleniyor...</div>}><AnnualPlanTab teacherProfile={teacherProfile} currentClass={currentClass} /></Suspense>; break;
        case 'election': tabContent = <ElectionTab students={studentsForSelectedClass} currentClass={currentClass} />; break;
        case 'projects': tabContent = <ProjectDistributionTab classId={selectedClassId!} teacherId={teacherId!} teacherProfile={teacherProfile} currentClass={currentClass} classes={classes || []} students={allStudents || []} lessons={lessons || []} />; break;
        case 'homework': tabContent = <HomeworkTab classId={selectedClassId!} currentClass={currentClass} teacherProfile={teacherProfile} students={studentsForSelectedClass} classes={classes || []}/>; break;
        case 'risks': tabContent = <RiskMapTab classId={selectedClassId!} teacherProfile={teacherProfile} currentClass={currentClass} riskFactors={riskFactors || []} students={studentsForSelectedClass} />; break;
        case 'forms': tabContent = <InfoFormsTab classId={selectedClassId!} teacherProfile={teacherProfile} currentClass={currentClass} students={studentsForSelectedClass} />; break;
        case 'communication': tabContent = <CommunicationTab classId={selectedClassId!} currentClass={currentClass} />; break;
        case 'surveys': tabContent = <SurveyTab students={studentsForSelectedClass} currentClass={currentClass} teacherProfile={teacherProfile}/>; break;
        case 'discipline': tabContent = <DisciplineTab students={studentsForSelectedClass} currentClass={currentClass} teacherProfile={teacherProfile} />; break;
        case 'bep': tabContent = <BepTab teacherProfile={teacherProfile} currentClass={currentClass} />; break;
        case 'exam-analysis': tabContent = <ExamAnalysisTab students={studentsForSelectedClass} currentClass={currentClass} teacherProfile={teacherProfile} />; break;
        case 'social-club': tabContent = <SocialClubTab students={studentsForSelectedClass} teacherId={teacherId} currentClass={currentClass} clubs={clubs || []} />; break;
        case 'gamification': tabContent = <SinifKahramanlariTab students={studentsForSelectedClass} />; break;
        case 'sociogram': tabContent = <SociogramTab students={studentsForSelectedClass} currentClass={currentClass} />; break;
        case 'discussion': tabContent = <DiscussionBoardTab classId={selectedClassId!} currentClass={currentClass} />; break;
        default: tabContent = <div>Bilinmeyen sekme</div>;
    }

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
           <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
            {React.createElement(TABS_CONFIG[activeTab]?.icon || School, { className: "w-7 h-7 text-primary" })}
            {TABS_CONFIG[activeTab]?.label}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleSelectClass(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Sınıf Seçimine Dön
            </Button>
            <Button variant="outline" onClick={handleBackToDashboard}>
              <Home className="mr-2 h-4 w-4" /> Sınıf Paneline Dön
            </Button>
          </div>
        </div>
        {tabContent}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        {centralDataLoading && !appUser ? (
          <div className="flex justify-center items-center h-full p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : renderContent()}
      </main>
      {teacherProfile && (
          <ProfileDialog
              isOpen={isProfileOpen}
              setIsOpen={setIsProfileOpen}
              teacherProfile={teacherProfile}
          />
      )}
    </div>
  );
}
