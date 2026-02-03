
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GradesTab } from './GradesTab';
import { BadgesTab } from './BadgesTab';
import { StudentCommunicationTab } from './StudentCommunicationTab';
import { TeacherChatsTab } from './TeacherChatsTab';
import { ElectionVoteTab } from './ElectionVoteTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { AccountSettingsTab } from './AccountSettingsTab';
import { RiskFormTab } from './RiskFormTab';
import { InfoFormTab } from './InfoFormTab';
import { StudentClubTab } from './StudentClubTab';
import { SociogramTab as StudentSociogramTab } from './SociogramTab';
import { AllHomeworksTab } from './AllHomeworksTab';
import { useNotification } from '@/hooks/useNotification';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  Bell,
  FileText,
  MessageSquare,
  ShieldAlert,
  BookText,
  Vote,
  Users,
  Grid,
  Settings,
  GraduationCap,
  Award,
  Share2,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MenuCard = ({ icon, title, description, onClick, hasNotification, isLoading, show = true }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, hasNotification?: boolean, isLoading?: boolean, show?: boolean }) => {
  if (isLoading) {
    return <Skeleton className="h-28 w-full" />;
  }

  if (!show) {
    return null;
  }

  return (
    <Card
      onClick={onClick}
      className={cn("cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group relative")}
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
  const { appUser, db } = useAuth();
  const studentData = useMemo(() => appUser?.type === 'student' ? appUser.data : null, [appUser]);
  
  const [activeTab, setActiveTab] = useState(studentData?.needsPasswordChange ? 'account' : 'home');

  const { notifications, markAsSeen } = useNotification();
  
  const classId = studentData?.classId;
  
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
    else if (activeTab === 'all-homeworks') markAsSeen('homeworks');
    else if (activeTab === 'election') markAsSeen('election');
    else if (activeTab === 'teacher-chats') markAsSeen('messages');
  }, [activeTab, markAsSeen]);
  
  if (studentData?.needsPasswordChange && activeTab !== 'account') {
      setActiveTab('account');
  }

  const renderContent = () => {
      switch(activeTab) {
          case 'grades': return <GradesTab />;
          case 'all-homeworks': return <AllHomeworksTab />;
          case 'badges': return <BadgesTab />;
          case 'announcements': return <StudentCommunicationTab />;
          case 'teacher-chats': return <TeacherChatsTab />;
          case 'risks': return <RiskFormTab />;
          case 'info': return <InfoFormTab />;
          case 'election': return <ElectionVoteTab />;
          case 'dutyRoster': return <DutyRosterTab />;
          case 'seatingPlan': return <SeatingPlanTab />;
          case 'account': return <AccountSettingsTab />;
          case 'club': return <StudentClubTab />;
          case 'sociogram': return <StudentSociogramTab />;
          default: return null;
      }
  }

  if (activeTab !== 'home') {
    return (
        <div className="p-2 sm:p-4">
            <Button variant="ghost" onClick={() => setActiveTab('home')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri Dön
            </Button>
            {renderContent()}
        </div>
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
                
                <MenuCard isLoading={classLoading} show={currentClass?.isGamificationActive} icon={<Award />} title="Rozetlerim" description="Kazandığın rozetleri ve puanını gör." onClick={() => setActiveTab('badges')} />
                <MenuCard icon={<GraduationCap />} title="Notlarım" description="Ders notlarını ve ortalamanı gör." onClick={() => setActiveTab('grades')} />
                <MenuCard icon={<BookText />} title="Ödevlerim" description="Performans, proje ve diğer ödevler." onClick={() => setActiveTab('all-homeworks')} hasNotification={notifications.homeworks} />
                <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                
                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isSeatingPlanPublished}
                    icon={<Grid />} 
                    title="Oturma Planım" 
                    description="Sınıftaki yerini gör." 
                    onClick={() => setActiveTab('seatingPlan')} 
                />
                
                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isDutyRosterPublished}
                    icon={<Users />} 
                    title="Nöbetçi Listesi" 
                    description="Sınıf nöbetçi listesini gör." 
                    onClick={() => setActiveTab('dutyRoster')} 
                />
                
                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isElectionActive || (currentClass?.election && currentClass.election.candidates.length > 0)}
                    icon={<Vote />} 
                    title="Seçim" 
                    description="Sınıf seçimleri için oy kullan." 
                    onClick={() => setActiveTab('election')} 
                    hasNotification={notifications.election} 
                />
                
                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isSociogramActive}
                    icon={<Share2 />}
                    title="Sosyogram"
                    description="Arkadaşlık ilişkilerini belirt."
                    onClick={() => setActiveTab('sociogram')}
                />

                <MenuCard icon={<MessageSquare />} title="Mesajlarım" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} hasNotification={notifications.messages} />
                
                <MenuCard icon={<Settings />} title="Hesap Ayarları" description="Şifreni oluştur veya değiştir." onClick={() => setActiveTab('account')} />
                
                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isClubSelectionActive || (studentData?.assignedClubIds && studentData.assignedClubIds.length > 0)}
                    icon={<Trophy />} 
                    title="Kulüp" 
                    description="Kulüp tercihi yap veya atamanı gör." 
                    onClick={() => setActiveTab('club')} 
                />

                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isRiskFormActive}
                    icon={<ShieldAlert />} 
                    title="Risk Formu" 
                    description="Kişisel risk faktörlerini işaretle." 
                    onClick={() => setActiveTab('risks')} 
                    hasNotification={notifications.riskForm} 
                />

                <MenuCard 
                    isLoading={classLoading}
                    show={currentClass?.isInfoFormActive}
                    icon={<FileText />} 
                    title="Bilgi Formu" 
                    description="Kişisel ve ailevi bilgilerini doldur." 
                    onClick={() => setActiveTab('info')} 
                    hasNotification={notifications.infoForm} 
                />
            </div>
        </div>
  );
}
