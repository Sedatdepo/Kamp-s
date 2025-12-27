
"use client";

import { useState, useEffect } from 'react';
import { HomeTab } from '@/components/dashboard/student/HomeTab';
import { RiskFormTab } from '@/components/dashboard/student/RiskFormTab';
import { InfoFormTab } from '@/components/dashboard/student/InfoFormTab';
import { StudentCommunicationTab } from '@/components/dashboard/student/StudentCommunicationTab';
import { TeacherChatsTab } from '@/components/dashboard/student/TeacherChatsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotification } from '@/hooks/useNotification';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, Home, MessageSquare, ShieldAlert } from 'lucide-react';

const NotificationBadge = () => (
    <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
        !
    </Badge>
);

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { notifications, markAsSeen } = useNotification();

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
    <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="home" className="relative">
            <Home className="w-4 h-4 mr-2" /> Anasayfa
        </TabsTrigger>
        <TabsTrigger value="announcements" className="relative">
            <Bell className="w-4 h-4 mr-2" /> Duyurular
            {notifications.announcements && <NotificationBadge />}
        </TabsTrigger>
        <TabsTrigger value="teacher-chats" className="relative">
            <MessageSquare className="w-4 h-4 mr-2" /> Sohbetlerim
            {/* TODO: Add notification logic for new messages */}
        </TabsTrigger>
        <TabsTrigger value="risks" className="relative">
            <ShieldAlert className="w-4 h-4 mr-2" /> Risk Formu
            {notifications.riskForm && <NotificationBadge />}
        </TabsTrigger>
        <TabsTrigger value="info" className="relative">
            <FileText className="w-4 h-4 mr-2" /> Bilgi Formu
            {notifications.infoForm && <NotificationBadge />}
        </TabsTrigger>
        </TabsList>
        <TabsContent value="home" className="mt-4">
        <HomeTab />
        </TabsContent>
        <TabsContent value="announcements" className="mt-4">
        <StudentCommunicationTab />
        </TabsContent>
        <TabsContent value="teacher-chats" className="mt-4">
        <TeacherChatsTab />
        </TabsContent>
        <TabsContent value="risks" className="mt-4">
        <RiskFormTab />
        </TabsContent>
        <TabsContent value="info" className="mt-4">
        <InfoFormTab />
        </TabsContent>
    </Tabs>
  );
}
