'use client';

import { useState, useEffect, useMemo } from 'react';
import { GradesTab } from './GradesTab';
import { ProjectTab } from './ProjectTab';
import { BadgesTab } from './BadgesTab';
import { StudentCommunicationTab } from './StudentCommunicationTab';
import { TeacherChatsTab } from './TeacherChatsTab';
import { PerformanceHomeworkTab } from './PerformanceHomeworkTab';
import { RegularHomeworkTab } from './RegularHomeworkTab';
import { ElectionVoteTab } from './ElectionVoteTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { StudentSurveyTab } from './StudentSurveyTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { RiskFormTab } from './RiskFormTab';
import { InfoFormTab } from './InfoFormTab';
import { StudentClubTab } from './StudentClubTab';
import { SociogramTab as StudentSociogramTab } from './SociogramTab';
import { DiscussionBoardTab as StudentDiscussionBoardTab } from './DiscussionBoardTab';
import { useNotification } from '@/hooks/useNotification';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  Bell,
  FileText,
  Home,
  MessageSquare,
  ShieldAlert,
  BookText,
  Vote,
  Users,
  Grid,
  ClipboardCheck,
  Settings,
  GraduationCap,
  Award,
  Share2,
  MessagesSquare,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
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
  const { appUser, db } = useAuth();
  const { notifications, markAsSeen, hasUnansweredSurvey } = useNotification();
  
  const classId = (appUser?.type === 'student' && appUser.data.classId) ? appUser.data.classId : null;
  
  // KESİN ÇÖZÜM: Sorgu, yalnızca `classId` ve `db` mevcut ve geçerli olduğunda oluşturulur.
  // Bu, kimlik doğrulama tamamlanmadan veya classId bilgisi eksikken sorgu gönderilmesini engeller.
  const classQuery = useMemoFirebase(() => {
    if (!classId || !db) return null;
    return doc(db, 'classes', classId);
  }, [classId, db]);
  
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
          case 'badges': return <BadgesTab />;
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
          case 'sociogram': return <StudentSociogramTab />;
          case 'discussion': return <StudentDiscussionBoardTab />;
          default: return null;
      }
  }

  if (activeTab !== 'home') {
    return (
        <>
            <Button variant="ghost" onClick={() => setActiveTab('home')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri Dön
            </Button>
            {renderContent()}
        </>
    )
  }
  
  return (
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
                
                <MenuCard icon={<Award />} title="Rozetlerim" description="Kazandığın rozetleri ve puanını gör." onClick={() => setActiveTab('badges')} />
                <MenuCard icon={<GraduationCap />} title="Notlarım" description="Ders notlarını ve ortalamanı gör." onClick={() => setActiveTab('grades')} />
                <MenuCard icon={<Home />} title="Proje Ödevim" description="Proje seçimi yap veya atananı gör." onClick={() => setActiveTab('project')} />
                <MenuCard icon={<MessagesSquare />} title="Tartışma Panosu" description="Sınıf tartışmalarına katıl." onClick={() => setActiveTab('discussion')} />
                <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                <MenuCard icon={<BookText />} title="Performans Ödevlerim" description="Kütüphaneden atanan ödevleri gör." onClick={() => setActiveTab('homeworks')} hasNotification={notifications.homeworks} />
                <MenuCard icon={<BookText />} title="Ödevler" description="Öğretmeninin verdiği diğer ödevler." onClick={() => setActiveTab('regular-homeworks')} hasNotification={notifications.homeworks} />
                
                <MenuCard 
                    isLoading={classLoading}
                    icon={<Grid />} 
                    title="Oturma Planım" 
                    description="Sınıftaki yerini gör." 
                    onClick={() => setActiveTab('seatingPlan')} 
                    isDisabled={!currentClass?.isSeatingPlanPublished}
                />
                
                <MenuCard 
                    isLoading={classLoading}
                    icon={<Users />} 
                    title="Nöbetçi Listesi" 
                    description="Sınıf nöbetçi listesini gör." 
                    onClick={() => setActiveTab('dutyRoster')} 
                    isDisabled={!currentClass?.isDutyRosterPublished}
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

                <MenuCard 
                    isLoading={classLoading}
                    icon={<Share2 />}
                    title="Sosyogram"
                    description="Arkadaşlık ilişkilerini belirt."
                    onClick={() => setActiveTab('sociogram')}
                    isDisabled={!currentClass?.isSociogramActive}
                />

                <MenuCard icon={<MessageSquare />} title="Sohbetlerim" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} hasNotification={notifications.messages} />
                
                <MenuCard icon={<Settings />} title="Hesap Ayarları" description="Şifreni oluştur veya değiştir." onClick={() => setActiveTab('account')} />
                
                <MenuCard 
                    isLoading={classLoading}
                    icon={<Trophy />} 
                    title="Kulüp" 
                    description="Kulüp tercihi yap veya atamanı gör." 
                    onClick={() => setActiveTab('club')} 
                    isDisabled={!currentClass?.isClubSelectionActive}
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
  );
}
