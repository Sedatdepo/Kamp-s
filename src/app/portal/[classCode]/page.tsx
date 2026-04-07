'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Student, Class, TeacherProfile, Homework } from '@/lib/types';
// EKSİK OLAN TÜM İKONLAR EKLENDİ (Users, AlertTriangle dahil)
import { Loader2, BookText, ClipboardList, Drama, FileSignature, MessagesSquare, GraduationCap, Megaphone, Award, X, Star, Grid, ListChecks, MessageCircle, Trophy, Vote, Users, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/dashboard/Header';
import Link from 'next/link';

const ModuleCard = ({ title, icon, href, isPublished }: { title: string, icon: React.ReactNode, href: string, isPublished?: boolean }) => {
    if (!isPublished) return null;
    return (
        <Link href={href} passHref>
            <Card className="hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-900/10 transition-all cursor-pointer h-full group bg-white border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium group-hover:text-cyan-600 transition-colors text-slate-700">{title}</CardTitle>
                    {icon}
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-slate-500">Görüntülemek için tıkla</p>
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
        const authData = sessionStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setStudent(storedStudent);
            } catch (e) {
                console.error("Failed to parse student auth data from sessionStorage", e);
                router.replace(`/giris/${classCode}`);
            }
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
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);

    const classDocRef = useMemoFirebase(() => (student ? doc(db, 'classes', student.classId) : null), [db, student?.classId]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);
    
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

    useEffect(() => {
        if (!isUserLoading && student && !classLoading && !homeworksLoading) {
            setLoading(false);
        }
    }, [isUserLoading, student, classLoading, homeworksLoading]);

    if (loading || !student || !currentClass) {
        return <div className="flex h-screen items-center justify-center bg-[#0a0f14] text-white"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
    }
    
    const hasAssignedProjects = (student.assignedLessonIds && student.assignedLessonIds.length > 0) || student.assignedLesson;

    const noNotifications = !(currentClass.isAnnouncementsPublished && currentClass.announcements && currentClass.announcements.length > 0 && !dismissedNotifications.includes(`announcement_${currentClass.announcements[0].id}`)) &&
                         !(currentClass.isProjectHomeworkPublished && hasAssignedProjects && !dismissedNotifications.includes('project_hw_assigned')) &&
                         !(!dismissedNotifications.includes('sociogram_active') && currentClass.isSociogramActive) &&
                         !(!dismissedNotifications.includes(`behavior_${latestBehaviorLog?.id}`) && latestBehaviorLog) &&
                         (!recentHomeworks || recentHomeworks.filter(hw => !dismissedNotifications.includes(`regular_hw_${hw.id}`) || !dismissedNotifications.includes(`performance_hw_${hw.id}`)).length === 0);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-cyan-500 rounded-full"></span>
                        Öğrenci Paneli
                    </h1>
                    <p className="text-slate-500 mt-1">{currentClass.name} • {student.number}</p>
                </div>

                 <Card className="mb-10 border-none shadow-xl bg-white overflow-hidden">
                    <div className="bg-slate-900 px-6 py-3 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <Megaphone size={18} className="text-cyan-400" />
                            Son Bildirimler
                        </h3>
                    </div>
                    <CardContent className="p-4 space-y-3">
                        {latestBehaviorLog && !dismissedNotifications.includes(`behavior_${latestBehaviorLog.id}`) && (
                             <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border-l-4 border-l-yellow-400 bg-yellow-50/30">
                                <Link href={`/portal/${classCode}/kahramanlar`} passHref className="flex-grow" onClick={() => handleDismiss(`behavior_${latestBehaviorLog.id}`)}>
                                    <div className="flex items-start gap-4 cursor-pointer">
                                        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                                            <Award className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">Yeni Davranış Notu</p>
                                            <p className="text-sm text-slate-600">{latestBehaviorLog.label} ({latestBehaviorLog.points > 0 ? '+' : ''}{latestBehaviorLog.points} Puan)</p>
                                        </div>
                                    </div>
                                </Link>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400" onClick={(e) => { e.stopPropagation(); handleDismiss(`behavior_${latestBehaviorLog.id}`); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        
                        {noNotifications && (
                            <div className="text-center py-8 text-slate-400 italic">
                                <p>Şu an için yeni bir bildirim bulunmuyor.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 mt-10">
                Luminodo &copy; 2024 - Sedat İleri tarafından geliştirildi.
            </footer>
        </div>
    );
}
