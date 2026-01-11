
"use client";

import { useState, useEffect, useMemo, useContext } from 'react';
import { Header } from '@/components/dashboard/Header';
import { GradesTab } from './GradesTab';
import { RiskFormTab } from './RiskFormTab';
import { InfoFormTab } from './InfoFormTab';
import { StudentCommunicationTab } from './StudentCommunicationTab';
import { TeacherChatsTab } from './TeacherChatsTab';
import { PerformanceHomeworkTab } from './PerformanceHomeworkTab';
import { RegularHomeworkTab } from './RegularHomeworkTab';
import { ElectionVoteTab } from './ElectionVoteTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { StudentSurveyTab } from './StudentSurveyTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { ProjectTab } from './ProjectTab';
import { BadgesTab } from './BadgesTab'; // Import Added
import { useNotification } from '@/hooks/useNotification';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Bell, FileText, Home, MessageSquare, ShieldAlert, BookText, Vote, Users, Grid, ClipboardCheck, Settings, UserCheck, GraduationCap, Trophy, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthContext } from '@/context/AuthContext';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';
import { StudentClubTab } from './StudentClubTab'; 

// Yeni StatusCard Bileşeni
const StatusCard = ({ score, badgeCount, onClick }: { score: number, badgeCount: number, onClick: () => void }) => {
  const level = Math.floor(score / 50) + 1;
  const progress = (score % 50) / 50 * 100;

  return (
    <Card onClick={onClick} className="col-span-full md:col-span-2 lg:col-span-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white cursor-pointer hover:shadow-lg transition-all border-none relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Trophy size={100} />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              Seviye {level}
            </CardTitle>
            <CardDescription className="text-indigo-100">Kahraman Yolculuğu</CardDescription>
          </div>
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Award className="text-yellow-300" size={24} />
          </div>
        </div>
      </CardHeader>
      <div className="px-6 pb-6">
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span>{score} Puan</span>
          <span>{Math.ceil((score + 1) / 50) * 50} Puan (Sonraki Seviye)</span>
        </div>
        <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div className="h-full bg-yellow-400 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
          <Award size={14} className="text-yellow-300" />
          <span>{badgeCount} Rozet Kazanıldı</span>
        </div>
      </div>
    </Card>
  );
};

const MenuCard = ({ icon, title, description, onClick, hasNotification, isLoading, isDisabled }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, hasNotification?: boolean, isLoading?: boolean, isDisabled?: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }
  
  return (
    <Card 
      onClick={!isDisabled ? onClick : undefined} 
      className={cn("cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group relative", isDisabled && "opacity-50 cursor-not-allowed")}
    >
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
          {icon}
        </div>
        <div>
          <CardTitle className="font-headline text-lg group-hover:text-primary">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {hasNotification && (
          <Badge variant="destructive" className="absolute top-2 right-2 h-3 w-3 p-0 flex items-center justify-center text-xs"></Badge>
        )}
      </CardHeader>
    </Card>
  );
};


export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const authContext = useContext(AuthContext);
  const { appUser, db } = authContext || {};
  const { notifications, markAsSeen, hasUnansweredSurvey } = useNotification();
  
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classQuery);

  useEffect(() => {
    const handleOpenSettings = () => setActiveTab('account');
    window.addEventListener('open-student-settings', handleOpenSettings);
    return () => window.removeEventListener('open-student-settings', handleOpenSettings);
  }, []);

  useEffect(() => {
    if (activeTab === 'announcements') markAsSeen('announcements');
    else if (activeTab === 'risks') markAsSeen('riskForm');
    else if (activeTab === 'info') markAsSeen('infoForm');
    else if (activeTab === 'homeworks' || activeTab === 'regular-homeworks') markAsSeen('homeworks');
    else if (activeTab === 'election') markAsSeen('election');
    else if (activeTab === 'surveys') markAsSeen('surveys');
    else if (activeTab === 'teacher-chats') markAsSeen('messages');
  }, [activeTab, markAsSeen]);
  
  const renderContent = () => {
      switch(activeTab) {
          case 'grades': return <GradesTab />;
          case 'project': return <ProjectTab />;
          case 'badges': return <BadgesTab />; // Case Added
          case 'announcements': return <StudentCommunicationTab />;
          case 'teacher-chats': return <TeacherChatsTab />;
          case 'homeworks': return <PerformanceHomeworkTab />;
          case 'regular-homeworks': return <RegularHomeworkTab />;
          case 'risks': return <RiskFormTab />;
          case 'info': return <InfoFormTab />;
          case 'election': return <ElectionVoteTab />;
          case 'dutyRoster': return <DutyRosterTab />;
          case 'seatingPlan': return <SeatingPlanTab />;
          case 'surveys': return <StudentSurveyTab />;
          case 'account': return <AccountSettingsTab />;
          case 'club': return <StudentClubTab />;
          default: return null;
      }
  }

  if (activeTab !== 'home') {
    return (
        <div className="flex flex-col min-h-screen w-full bg-muted/40">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
               <Button variant="ghost" onClick={() => setActiveTab('home')} className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri Dön
              </Button>
              {renderContent()}
          </main>
        </div>
    )
  }
  
  const behaviorScore = appUser?.type === 'student' ? (appUser.data.behaviorScore ?? 0) : 0;
  const badgeCount = appUser?.type === 'student' ? (appUser.data.badges?.length || 0) : 0;

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="font-headline text-2xl">Öğrenci Paneli</CardTitle>
                            <CardDescription>Aşağıdaki menülerden istediğin işleme ulaşabilirsin.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* YENİ STATUS CARD */}
                    <StatusCard score={behaviorScore} badgeCount={badgeCount} onClick={() => setActiveTab('badges')} />

                    <MenuCard icon={<GraduationCap />} title="Notlarım" description="Ders notlarını ve ortalamanı gör." onClick={() => setActiveTab('grades')} />
                    <MenuCard icon={<Home />} title="Proje Ödevim" description="Proje seçimi yap veya atananı gör." onClick={() => setActiveTab('project')} />
                    <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                    <MenuCard icon={<BookText />} title="Performans Ödevlerim" description="Kütüphaneden atanan ödevleri gör." onClick={() => setActiveTab('homeworks')} hasNotification={notifications.homeworks} />
                    <MenuCard icon={<BookText />} title="Ödevler" description="Öğretmeninin verdiği diğer ödevler." onClick={() => setActiveTab('regular-homeworks')} hasNotification={notifications.homeworks} />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Grid />} 
                        title="Oturma Planım" 
                        description="Sınıftaki yerini gör." 
                        onClick={() => setActiveTab('seatingPlan')} 
                        isDisabled={!currentClass?.seatingPlan}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Users />} 
                        title="Nöbetçi Listesi" 
                        description="Sınıf nöbetçi listesini gör." 
                        onClick={() => setActiveTab('dutyRoster')} 
                        isDisabled={!currentClass?.dutyRoster || currentClass.dutyRoster.length === 0}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Vote />} 
                        title="Seçim" 
                        description="Sınıf seçimleri için oy kullan." 
                        onClick={() => setActiveTab('election')} 
                        hasNotification={notifications.election} 
                        isDisabled={!currentClass?.isElectionActive}
                    />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<ClipboardCheck />} 
                        title="Anketlerim" 
                        description="Aktif anketleri cevapla." 
                        onClick={() => setActiveTab('surveys')} 
                        hasNotification={notifications.surveys}
                        isDisabled={!hasUnansweredSurvey}
                    />

                    <MenuCard icon={<MessageSquare />} title="Sohbetlerim" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} hasNotification={notifications.messages} />
                    
                    <MenuCard icon={<Settings />} title="Hesap Ayarları" description="Şifreni oluştur veya değiştir." onClick={() => setActiveTab('account')} />
                    
                    <MenuCard 
                        isLoading={classLoading}
                        icon={<Trophy />} 
                        title="Kulüp" 
                        description="Kulüp tercihi yap veya atamanı gör." 
                        onClick={() => setActiveTab('club')} 
                        isDisabled={false} // isDisabled logic is now inside StudentClubTab
                    />

                    <MenuCard 
                        isLoading={classLoading}
                        icon={<ShieldAlert />} 
                        title="Risk Formu" 
                        description="Kişisel risk faktörlerini işaretle." 
                        onClick={() => setActiveTab('risks')} 
                        hasNotification={notifications.riskForm} 
                        isDisabled={!currentClass?.isRiskFormActive}
                    />

                    <MenuCard 
                        isLoading={classLoading}
                        icon={<FileText />} 
                        title="Bilgi Formu" 
                        description="Kişisel ve ailevi bilgilerini doldur." 
                        onClick={() => setActiveTab('info')} 
                        hasNotification={notifications.infoForm} 
                        isDisabled={!currentClass?.isInfoFormActive}
                    />
                </div>
            </div>
        </main>
    </div>
  );
}
