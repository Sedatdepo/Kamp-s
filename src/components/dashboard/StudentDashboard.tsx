// StudentDashboard.tsx
"use client";

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Header } from './Header';
import { StudentSidebar } from './student/StudentSidebar';
import { HomeTab } from './student/HomeTab';
import { RiskFormTab } from './student/RiskFormTab';
import { InfoFormTab } from './student/InfoFormTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="home">Anasayfa</TabsTrigger>
                <TabsTrigger value="risks">Risk Formu</TabsTrigger>
                <TabsTrigger value="info">Bilgi Formu</TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="mt-4">
                <HomeTab />
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
