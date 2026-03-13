'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Student, Class, TeacherProfile, Badge, Homework } from '@/lib/types';
import { Loader2, User, Key, LogOut, Vote, Trophy, Users, Grid, ListChecks, Calendar, MessageCircle, BookText, ClipboardList, Drama, FileSignature, MessagesSquare, GraduationCap, Megaphone, Award, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INITIAL_BADGES } from '@/lib/grading-defaults';


const ModuleCard = ({ title, icon, href, isPublished }: { title: string, icon: React.ReactNode, href: string, isPublished?: boolean }) => {
    if (!isPublished) return null;
    return (
        <Link href={href} passHref>
            <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground">Görüntülemek için tıkla</p>
                </CardContent>
            </Card>
        </Link>
    );
};

export default function StudentPortalPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

    const handleDismiss = (notificationId: string) => {
        setDismissedNotifications(prev => [...prev, notificationId]);
    };

    // Initial load from sessionStorage
    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) {
                router.replace(`/giris/${classCode}`);
                return;
            }
            const { student: storedStudent, classCode: storedClassCode } = JSON.parse(authData);
            if (storedClassCode !== classCode || !storedStudent) {
                router.replace(`/giris/${classCode}`);
                return;
            }
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);
    
    // Real-time listener for student data
    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;

        const studentRef = doc(db, 'students', student.id);
        const unsubscribe = onSnapshot(studentRef, (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);

    const classDocRef = useMemoFirebase(() => (student ? doc(db, 'classes', student.classId) : null), [db, student?.classId]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);
    
    const teacherDocRef = useMemoFirebase(() => (student ? doc(db, 'teachers', student.teacherId) : null), [db, student?.teacherId]);
    const { data: teacherProfile } = useDoc<TeacherProfile>(teacherDocRef);
    
    const homeworksQuery = useMemoFirebase(() => {
        if (!db || !student?.id || !currentClass?.id) return null;
        return query(
            collection(db, 'classes', currentClass.id, 'homeworks'),
            where('assignedStudents', 'array-contains', student.id)
        );
    }, [db, currentClass?.id, student?.id]);
    const { data: allHomeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

    const recentHomeworks = useMemo(() => {
        if (!allHomeworks) return [];
        return [...allHomeworks].sort((a,b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime()).slice(0, 3);
    }, [allHomeworks]);


    const latestBehaviorLog = useMemo(() => {
        if (!student?.behaviorLogs || student.behaviorLogs.length === 0) return null;
        return [...student.behaviorLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    }, [student?.behaviorLogs]);

    const availableBadges = teacherProfile?.badgeCriteria || INITIAL_BADGES;

    useEffect(() => {
        if (!isUserLoading && student && !classLoading && !homeworksLoading) {
            setLoading(false);
        }
    }, [isUserLoading, student, classLoading, homeworksLoading]);


    const handleLogout = () => {
        sessionStorage.removeItem('student_portal_auth');
        router.replace(`/giris/${classCode}`);
    };

    if (loading || !student || !currentClass) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    const noNotifications = !(currentClass.isAnnouncementsPublished && currentClass.announcements && currentClass.announcements.length > 0 && !dismissedNotifications.includes(`announcement_${currentClass.announcements[0].id}`)) &&
                         !(currentClass.isProjectHomeworkPublished && student.hasProject && student.assignedLesson && !dismissedNotifications.includes('project_hw_assigned')) &&
                         !(!dismissedNotifications.includes('sociogram_active') && currentClass.isSociogramActive) &&
                         !(!dismissedNotifications.includes(`behavior_${latestBehaviorLog?.id}`) && latestBehaviorLog) &&
                         (!recentHomeworks || recentHomeworks.filter(hw => !dismissedNotifications.includes(`regular_hw_${hw.id}`) || !dismissedNotifications.includes(`performance_hw_${hw.id}`)).length === 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Hoş Geldin, {student.name}</h1>
                        <p className="text-sm text-muted-foreground">{currentClass.name} Sınıf Portalı</p>
                    </div>
                </div>
                 <Button onClick={handleLogout} variant="ghost" className="gap-2">
                    <LogOut size={16} /> Çıkış Yap
                 </Button>
            </header>
            
            <main className="max-w-4xl mx-auto">
                 <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Bildirimler ve Son Etkinlikler</CardTitle>
                        <CardDescription>Sana özel son gelişmeler ve görevler.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {latestBehaviorLog && !dismissedNotifications.includes(`behavior_${latestBehaviorLog.id}`) && (
                             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Link href={`/portal/${classCode}/kahramanlar`} passHref className="flex-grow" onClick={() => handleDismiss(`behavior_${latestBehaviorLog.id}`)}>
                                    <div className="flex items-start gap-4 cursor-pointer">
                                        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full mt-1">
                                            <Award className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Yeni Davranış Notu</p>
                                            <p className="text-xs text-muted-foreground">{latestBehaviorLog.label} ({latestBehaviorLog.points > 0 ? '+' : ''}{latestBehaviorLog.points} Puan)</p>
                                        </div>
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss(`behavior_${latestBehaviorLog.id}`); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {currentClass.isRegularHomeworkPublished && recentHomeworks?.filter(hw => hw.assignmentType === 'regular' || !hw.assignmentType).slice(0, 1).map(hw => (
                            !dismissedNotifications.includes(`regular_hw_${hw.id}`) && (
                                <div key={hw.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <Link href={`/portal/${classCode}/regular-homeworks`} passHref className="flex-grow" onClick={() => handleDismiss(`regular_hw_${hw.id}`)}>
                                        <div className="flex items-start gap-4 cursor-pointer">
                                            <div className="bg-orange-100 text-orange-600 p-2 rounded-full mt-1">
                                                <BookText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Yeni Günlük Ödev</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{hw.text}</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss(`regular_hw_${hw.id}`); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        ))}
                         {currentClass.isPerformanceHomeworkPublished && recentHomeworks?.filter(hw => hw.assignmentType === 'performance').slice(0, 1).map(hw => (
                            !dismissedNotifications.includes(`performance_hw_${hw.id}`) && (
                                <div key={hw.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                    <Link href={`/portal/${classCode}/performance-homeworks`} passHref className="flex-grow" onClick={() => handleDismiss(`performance_hw_${hw.id}`)}>
                                        <div className="flex items-start gap-4 cursor-pointer">
                                            <div className="bg-purple-100 text-purple-600 p-2 rounded-full mt-1">
                                                <Trophy className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">Yeni Performans Ödevi</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{hw.text}</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss(`performance_hw_${hw.id}`); }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        ))}
                        {currentClass.isAnnouncementsPublished && currentClass.announcements && currentClass.announcements.length > 0 && !dismissedNotifications.includes(`announcement_${currentClass.announcements[0].id}`) && (
                             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Link href={`/view/announcements/${classCode}`} passHref className="flex-grow" onClick={() => handleDismiss(`announcement_${currentClass.announcements[0].id}`)}>
                                    <div className="flex items-start gap-4 cursor-pointer">
                                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full mt-1">
                                            <Megaphone className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Yeni Duyuru</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{currentClass.announcements[0].text}</p>
                                        </div>
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss(`announcement_${currentClass.announcements[0].id}`); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {currentClass.isProjectHomeworkPublished && student.hasProject && student.assignedLesson && !dismissedNotifications.includes('project_hw_assigned') && (
                             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Link href={`/portal/${classCode}/project-homework`} passHref className="flex-grow" onClick={() => handleDismiss('project_hw_assigned')}>
                                    <div className="flex items-start gap-4 cursor-pointer">
                                        <div className="bg-purple-100 text-purple-600 p-2 rounded-full mt-1">
                                            <ClipboardList className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Proje Ödevin Atandı</p>
                                            <p className="text-xs text-muted-foreground">Proje ödevi konunu görmek için tıkla.</p>
                                        </div>
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss('project_hw_assigned'); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        {currentClass.isSociogramActive && !dismissedNotifications.includes('sociogram_active') && (
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <Link href={`/sosyogram/${classCode}`} passHref className="flex-grow" onClick={() => handleDismiss('sociogram_active')}>
                                    <div className="flex items-start gap-4 cursor-pointer">
                                        <div className="bg-teal-100 text-teal-600 p-2 rounded-full mt-1">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">Sosyogram Anketi Aktif</p>
                                            <p className="text-xs text-muted-foreground">Sınıf arkadaşlarınla ilgili anket seni bekliyor.</p>
                                        </div>
                                    </div>
                                </Link>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleDismiss('sociogram_active'); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        
                        {noNotifications && (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                                <p>Henüz yeni bir bildirim yok.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ModuleCard title="Notlarım" icon={<GraduationCap className="text-emerald-500" />} href={`/portal/${classCode}/notlarim`} isPublished={currentClass.isGradesPublished} />
                    <ModuleCard title="Öğretmene Mesaj" icon={<MessagesSquare className="text-blue-500" />} href={`/portal/${classCode}/mesajlar`} isPublished={currentClass.isMessagesPublished} />
                    <ModuleCard title="Oturma Planı" icon={<Grid className="text-blue-500" />} href={`/view/seating-plan/${classCode}`} isPublished={currentClass.isSeatingPlanPublished} />
                    <ModuleCard title="Nöbet Listesi" icon={<ListChecks className="text-green-500" />} href={`/view/duty-roster/${classCode}`} isPublished={currentClass.isDutyRosterPublished} />
                    <ModuleCard title="Günlük Ödevler" icon={<BookText className="text-orange-500" />} href={`/portal/${classCode}/regular-homeworks`} isPublished={currentClass.isRegularHomeworkPublished} />
                    <ModuleCard title="Performans Ödevleri" icon={<Trophy className="text-yellow-500" />} href={`/portal/${classCode}/performance-homeworks`} isPublished={currentClass.isPerformanceHomeworkPublished} />
                    <ModuleCard title="Proje Ödevim" icon={<ClipboardList className="text-purple-500" />} href={`/portal/${classCode}/project-homework`} isPublished={currentClass.isProjectHomeworkPublished} />
                    <ModuleCard title="Proje Tercihi" icon={<ListChecks className="text-indigo-500" />} href={`/portal/${classCode}/project-selection`} isPublished={currentClass.isProjectSelectionActive} />
                    <ModuleCard title="Sosyogram Anketi" icon={<Users className="text-teal-500" />} href={`/sosyogram/${classCode}`} isPublished={currentClass.isSociogramActive} />
                    <ModuleCard title="Kulüp Tercihi" icon={<Drama className="text-pink-500" />} href={`/portal/${classCode}/club-selection`} isPublished={currentClass.isClubSelectionActive} />
                    <ModuleCard title="Bilgi Formu" icon={<FileSignature className="text-rose-500" />} href={`/portal/${classCode}/bilgi-formu`} isPublished={currentClass.isInfoFormActive} />
                    <ModuleCard title="Risk Formu" icon={<AlertTriangle className="text-yellow-600" />} href={`/portal/${classCode}/risk-formu`} isPublished={currentClass.isRiskFormActive} />
                    <ModuleCard title="Başarılarım" icon={<Trophy className="text-yellow-500" />} href={`/portal/${classCode}/kahramanlar`} isPublished={currentClass.isGamificationActive} />
                    <ModuleCard title="Seçim Sonuçları" icon={<Users className="text-purple-500" />} href={`/view/election/${classCode}`} isPublished={currentClass.isElectionPublished} />
                    <ModuleCard title="Sınıf Seçimi Oylaması" icon={<Vote className="text-red-500" />} href={`/oylama/${classCode}`} isPublished={currentClass.isElectionActive} />
                    <ModuleCard title="Duyurular" icon={<MessageCircle className="text-cyan-500" />} href={`/view/announcements/${classCode}`} isPublished={currentClass.isAnnouncementsPublished} />
                </div>
            </main>
            <p className="text-center text-xs text-muted-foreground mt-8">
                Sedat İleri tarafından geliştirildi.
            </p>
        </div>
    );
}
