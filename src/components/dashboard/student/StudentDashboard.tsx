
"use client";

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/dashboard/Header';
import { StudentSidebar } from '@/components/dashboard/student/StudentSidebar';
import { HomeTab } from '@/components/dashboard/student/HomeTab';
import { RiskFormTab } from '@/components/dashboard/student/RiskFormTab';
import { InfoFormTab } from '@/components/dashboard/student/InfoFormTab';
import { StudentCommunicationTab } from '@/components/dashboard/student/StudentCommunicationTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotification } from '@/hooks/useNotification';

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { markAsSeen } = useNotification();

  useEffect(() => {
    // Sekme değiştiğinde ilgili bildirimi "görüldü" olarak işaretle
    if (activeTab === 'announcements') {
      markAsSeen('announcements');
    } else if (activeTab === 'risks') {
      markAsSeen('riskForm');
    } else if (activeTab === 'info') {
      markAsSeen('infoForm');
    }
  }, [activeTab, markAsSeen]);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              {/* Bu TabsList mobil görünümde gizlenecek, çünkü sidebar zaten navigasyonu sağlıyor */}
              <TabsList className="grid grid-cols-4 w-full md:hidden">
                <TabsTrigger value="home">Anasayfa</TabsTrigger>
                <TabsTrigger value="announcements">Duyurular</TabsTrigger>
                <TabsTrigger value="risks">Risk Formu</TabsTrigger>
                <TabsTrigger value="info">Bilgi Formu</TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="mt-4">
                <HomeTab />
              </TabsContent>
               <TabsContent value="announcements" className="mt-4">
                <StudentCommunicationTab />
              </TabsContent>
              <TabsContent value="risks" className="mt-4">
                <RiskFormTab />
              </TabsContent>
              <TabsContent value="info" className="mt-4">
                <InfoFormTab />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
