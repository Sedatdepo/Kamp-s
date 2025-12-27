
"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/dashboard/Header';
import { HomeTab } from '@/components/dashboard/student/HomeTab';
import { RiskFormTab } from '@/components/dashboard/student/RiskFormTab';
import { InfoFormTab } from '@/components/dashboard/student/InfoFormTab';
import { StudentCommunicationTab } from '@/components/dashboard/student/StudentCommunicationTab';
import { TeacherChatsTab } from '@/components/dashboard/student/TeacherChatsTab';
import { HomeworkTab } from '@/components/dashboard/student/HomeworkTab';
import { ElectionVoteTab } from '@/components/dashboard/student/ElectionVoteTab'; // Yeni eklendi
import { useNotification } from '@/hooks/useNotification';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Bell, FileText, Home, MessageSquare, ShieldAlert, BookText, Vote } from 'lucide-react'; // Vote eklendi
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const MenuCard = ({ icon, title, description, onClick, hasNotification }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, hasNotification?: boolean }) => (
  <Card onClick={onClick} className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all group relative">
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


export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { notifications, markAsSeen } = useNotification();

  useEffect(() => {
    if (activeTab === 'announcements') markAsSeen('announcements');
    else if (activeTab === 'risks') markAsSeen('riskForm');
    else if (activeTab === 'info') markAsSeen('infoForm');
    else if (activeTab === 'homeworks') markAsSeen('homeworks');
    else if (activeTab === 'election') markAsSeen('election'); // Yeni eklendi
  }, [activeTab, markAsSeen]);
  
  const renderContent = () => {
      switch(activeTab) {
          case 'home-details': return <HomeTab />;
          case 'announcements': return <StudentCommunicationTab />;
          case 'teacher-chats': return <TeacherChatsTab />;
          case 'homeworks': return <HomeworkTab />;
          case 'risks': return <RiskFormTab />;
          case 'info': return <InfoFormTab />;
          case 'election': return <ElectionVoteTab />; // Yeni eklendi
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

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Öğrenci Paneli</CardTitle>
                        <CardDescription>Aşağıdaki menülerden istediğin işleme ulaşabilirsin.</CardDescription>
                    </CardHeader>
                </Card>
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <MenuCard icon={<Home />} title="Proje ve Notlar" description="Proje seçimi ve ders notlarını gör." onClick={() => setActiveTab('home-details')} />
                    <MenuCard icon={<Bell />} title="Duyurular" description="Öğretmeninin duyurularını takip et." onClick={() => setActiveTab('announcements')} hasNotification={notifications.announcements} />
                    <MenuCard icon={<BookText />} title="Ödevlerim" description="Sana atanan ödevleri gör." onClick={() => setActiveTab('homeworks')} hasNotification={notifications.homeworks} />
                    <MenuCard icon={<Vote />} title="Seçim" description="Sınıf seçimleri için oy kullan." onClick={() => setActiveTab('election')} hasNotification={notifications.election} />
                    <MenuCard icon={<MessageSquare />} title="Sohbetlerim" description="Öğretmeninden gelen mesajlar." onClick={() => setActiveTab('teacher-chats')} />
                    <MenuCard icon={<ShieldAlert />} title="Risk Formu" description="Kişisel risk faktörlerini işaretle." onClick={() => setActiveTab('risks')} hasNotification={notifications.riskForm} />
                    <MenuCard icon={<FileText />} title="Bilgi Formu" description="Kişisel ve ailevi bilgilerini doldur." onClick={() => setActiveTab('info')} hasNotification={notifications.infoForm} />
                </div>
            </div>
        </main>
    </div>
  );
}
