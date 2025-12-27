"use client";

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TeacherSidebar } from './teacher/TeacherSidebar';
import { Header } from './Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentListTab } from './teacher/StudentListTab';
import { ProjectDistributionTab } from './teacher/ProjectDistributionTab';
import { RiskMapTab } from './teacher/RiskMapTab';
import { InfoFormsTab } from './teacher/InfoFormsTab';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School } from 'lucide-react';

export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <TeacherSidebar selectedClassId={selectedClassId} onSelectClass={setSelectedClassId} />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            {selectedClassId ? (
              <Tabs defaultValue="students">
                <TabsList>
                  <TabsTrigger value="students">Öğrenci Listesi</TabsTrigger>
                  <TabsTrigger value="projects">Proje Dağılımı</TabsTrigger>
                  <TabsTrigger value="risks">Risk Haritası</TabsTrigger>
                  <TabsTrigger value="forms">Bilgi Formları</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="mt-4">
                  <StudentListTab classId={selectedClassId} />
                </TabsContent>
                <TabsContent value="projects" className="mt-4">
                  <ProjectDistributionTab classId={selectedClassId} />
                </TabsContent>
                <TabsContent value="risks" className="mt-4">
                  <RiskMapTab classId={selectedClassId} />
                </TabsContent>
                <TabsContent value="forms" className="mt-4">
                  <InfoFormsTab classId={selectedClassId} />
                </TabsContent>
              </Tabs>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <Card className="w-full max-w-lg text-center shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                                <School className="h-10 w-10 text-primary" />
                            </div>
                            <CardTitle className="mt-4 font-headline text-2xl">Yönetim Paneline Hoş Geldiniz</CardTitle>
                            <CardDescription>
                                Öğrencilerinizi ve etkinliklerinizi yönetmeye başlamak için lütfen kenar çubuğundan bir sınıf seçin. Henüz sınıfınız yoksa, kenar çubuğundan bir tane ekleyebilirsiniz.
                            </CardDescription>
                        </CardHeader>
                    </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
