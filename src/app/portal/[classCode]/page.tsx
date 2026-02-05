'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Student, Class, TeacherProfile, Badge } from '@/lib/types';
import { Loader2, User, Key, LogOut, Vote, Trophy, Users, Grid, ListChecks, Calendar, MessageCircle, BookText, ClipboardList, Drama, FileSignature, MessagesSquare } from 'lucide-react';
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
    const { firestore } = useFirebase();

    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

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
        if (!student?.id || !firestore) return;

        const studentRef = doc(firestore, 'students', student.id);
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
    }, [student?.id, firestore]);

    const classDocRef = useMemoFirebase(() => (student ? doc(firestore, 'classes', student.classId) : null), [firestore, student]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);
    
    const teacherDocRef = useMemoFirebase(() => (student ? doc(firestore, 'teachers', student.teacherId) : null), [firestore, student]);
    const { data: teacherProfile } = useDoc<TeacherProfile>(teacherDocRef);
    const availableBadges = teacherProfile?.badgeCriteria || INITIAL_BADGES;

    useEffect(() => {
        if (student && !classLoading) {
            setLoading(false);
        }
    }, [student, classLoading]);


    const handleLogout = () => {
        sessionStorage.removeItem('student_portal_auth');
        router.replace(`/giris/${classCode}`);
    };

    if (loading || !student || !currentClass) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

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
                 {currentClass.isGamificationActive && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Sınıf Kahramanları</CardTitle>
                            <CardDescription>Davranış puanın ve kazandığın rozetler.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-6">
                            <div>
                                <p className="text-muted-foreground text-sm">Davranış Puanı</p>
                                <p className="text-5xl font-bold text-primary">{student.behaviorScore || 100}</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-muted-foreground text-sm mb-2">Kazandığın Rozetler</p>
                                <div className="flex flex-wrap gap-4">
                                    {(student.badges && student.badges.length > 0) ? (
                                        <TooltipProvider>
                                            {student.badges.map(badgeId => {
                                                const badge = availableBadges.find(b => b.id === badgeId);
                                                return badge ? (
                                                    <Tooltip key={badge.id}>
                                                        <TooltipTrigger asChild>
                                                            <div className="text-4xl cursor-pointer">{badge.icon}</div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-bold">{badge.name}</p>
                                                            <p>{badge.description}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ) : null;
                                            })}
                                        </TooltipProvider>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Henüz rozet kazanmadın.</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <ModuleCard title="Sınıf Kahramanları" icon={<Trophy className="text-yellow-500" />} href={`/portal/${classCode}/kahramanlar`} isPublished={currentClass.isGamificationActive} />
                    <ModuleCard title="Seçim Sonuçları" icon={<Users className="text-purple-500" />} href={`/view/election/${classCode}`} isPublished={currentClass.isElectionPublished} />
                    <ModuleCard title="Sınıf Seçimi Oylaması" icon={<Vote className="text-red-500" />} href={`/oylama/${classCode}`} isPublished={currentClass.isElectionActive} />
                    <ModuleCard title="Duyurular" icon={<MessageCircle className="text-cyan-500" />} href={`/view/announcements/${classCode}`} isPublished={currentClass.isAnnouncementsPublished} />
                </div>
            </main>
        </div>
    );
}