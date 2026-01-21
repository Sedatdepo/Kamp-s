'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GradesTab } from './student/GradesTab';
import { BadgesTab } from './student/BadgesTab';
import { StudentCommunicationTab } from './student/StudentCommunicationTab';
import { TeacherChatsTab } from './student/TeacherChatsTab';
import { ElectionVoteTab } from './student/ElectionVoteTab';
import { DutyRosterTab } from './student/DutyRosterTab';
import { SeatingPlanTab } from './student/SeatingPlanTab';
import { AccountSettingsTab } from './student/AccountSettingsTab';
import { RiskFormTab } from './student/RiskFormTab';
import { InfoFormTab } from './student/InfoFormTab';
import { StudentClubTab } from './student/StudentClubTab';
import { SociogramTab as StudentSociogramTab } from './student/SociogramTab';
import { AllHomeworksTab } from './student/AllHomeworksTab';
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
  const { notifications, markAsSeen } = useNotification();
  
  const classId = (appUser?.type === 'student' && appUser.data.classId) ? appUser.data.classId : null;
  
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
                <MenuCard icon={<BookText />} title="Ödevlerim" description="Performans, proje ve diğer ödevler." onClick={() => setActiveTab('all-homeworks')} hasNotification={notifications.homeworks} />
                <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                
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
