

"use client";

import { useState, useEffect, useMemo, useContext } from 'react';
import { Header } from '@/components/dashboard/Header';
import { HomeTab } from './HomeTab';
import { RiskFormTab } from './RiskFormTab';
import { InfoFormTab } from './InfoFormTab';
import { StudentCommunicationTab } from './StudentCommunicationTab';
import { TeacherChatsTab } from './TeacherChatsTab';
import { HomeworkTab } from './HomeworkTab';
import { ElectionVoteTab } from './ElectionVoteTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { StudentSurveyTab } from './StudentSurveyTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { useNotification } from '@/hooks/useNotification';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Bell, FileText, Home, MessageSquare, ShieldAlert, BookText, Vote, Users, Grid, ClipboardCheck, Settings, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthContext } from '@/context/AuthContext';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../../ui/skeleton';
import { cn } from '@/lib/utils';

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
    else if (activeTab === 'homeworks') markAsSeen('homeworks');
    else if (activeTab === 'election') markAsSeen('election');
    else if (activeTab === 'surveys') markAsSeen('surveys');
  }, [activeTab, markAsSeen]);
  
  const renderContent = () => {
      switch(activeTab) {
          case 'home-details': return <HomeTab />;
          case 'announcements': return <StudentCommunicationTab />;
          case 'teacher-chats': return <TeacherChatsTab />;
          case 'homeworks': return <HomeworkTab />;
          case 'risks': return <RiskFormTab />;
          case 'info': return <InfoFormTab />;
          case 'election': return <ElectionVoteTab />;
          case 'dutyRoster': return <DutyRosterTab />;
          case 'seatingPlan': return <SeatingPlanTab />;
          case 'surveys': return <StudentSurveyTab />;
          case 'account': return <AccountSettingsTab />;
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
  
  const behaviorScore = appUser?.type === 'student' ? (appUser.data.behaviorScore ?? 100) : 100;

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
                        <Card className="p-4 bg-background text-center">
                            <CardDescription className="flex items-center gap-2"><UserCheck /> Davranış Puanı</CardDescription>
                            <p className="text-4xl font-bold text-primary mt-1">{behaviorScore}</p>
                        </Card>
                    </CardHeader>
                </Card>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MenuCard icon={<Home />} title="Proje ve Notlar" description="Proje seçimi ve ders notlarını gör." onClick={() => setActiveTab('home-details')} />
                    <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                    <MenuCard icon={<BookText />} title="Ödevlerim" description="Sana atanan ödevleri gör." onClick={() => setActiveTab('homeworks')} hasNotification={notifications.homeworks} />
                    
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

                    <MenuCard icon={<MessageSquare />} title="Sohbetlerim" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} />
                    
                    <MenuCard icon={<Settings />} title="Hesap Ayarları" description="Şifreni oluştur veya değiştir." onClick={() => setActiveTab('account')} />

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
