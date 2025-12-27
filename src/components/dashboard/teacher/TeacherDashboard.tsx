"use client";

import { useState, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TeacherSidebar } from '@/components/dashboard/teacher/TeacherSidebar';
import { Header } from '@/components/dashboard/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentListTab } from '@/components/dashboard/teacher/StudentListTab';
import { ProjectDistributionTab } from '@/components/dashboard/teacher/ProjectDistributionTab';
import { RiskMapTab } from '@/components/dashboard/teacher/RiskMapTab';
import { InfoFormsTab } from '@/components/dashboard/teacher/InfoFormsTab';
import { GradingToolTab } from '@/components/dashboard/teacher/GradingToolTab';
import { ReportTab } from '@/components/dashboard/teacher/ReportTab';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { doc, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function TeacherDashboard() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const { appUser } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  // Prefetch all necessary data here to pass down as props
  // This avoids each tab component fetching the same data repeatedly

  const teacherQuery = useMemo(() => teacherId ? doc(db, 'teachers', teacherId) : null, [teacherId]);
  const { data: teacherData, loading: teacherLoading } = useFirestore<TeacherProfile>(`teachers/${teacherId}`, teacherQuery);
  const teacherProfile = teacherData.length > 0 ? teacherData[0] : null;

  const classQuery = useMemo(() => selectedClassId ? doc(db, 'classes', selectedClassId) : null, [selectedClassId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${selectedClassId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => selectedClassId ? query(collection(db, 'students'), where('classId', '==', selectedClassId)) : null, [selectedClassId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${selectedClassId}`, studentsQuery);

  const isLoading = teacherLoading || (selectedClassId && (classLoading || studentsLoading));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <TeacherSidebar selectedClassId={selectedClassId} onSelectClass={setSelectedClassId} />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            {selectedClassId ? (
              isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="students">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                    <TabsTrigger value="students">Öğrenci Listesi</TabsTrigger>
                    <TabsTrigger value="grading">Değerlendirme</TabsTrigger>
                    <TabsTrigger value="projects">Proje Dağılımı</TabsTrigger>
                    <TabsTrigger value="risks">Risk Haritası</TabsTrigger>
                    <TabsTrigger value="forms">Bilgi Formları</TabsTrigger>
                    <TabsTrigger value="report">Rapor</TabsTrigger>
                  </TabsList>
                  <TabsContent value="students" className="mt-4">
                    <StudentListTab 
                      classId={selectedClassId} 
                      teacherProfile={teacherProfile}
                      currentClass={currentClass}
                    />
                  </TabsContent>
                  <TabsContent value="grading" className="mt-4">
                    <GradingToolTab 
                      classId={selectedClassId}
                      teacherProfile={teacherProfile}
                      students={students}
                      currentClass={currentClass}
                    />
                  </TabsContent>
                  <TabsContent value="projects" className="mt-4">
                    <ProjectDistributionTab 
                      classId={selectedClassId}
                      teacherProfile={teacherProfile}
                      currentClass={currentClass}
                    />
                  </TabsContent>
                  <TabsContent value="risks" className="mt-4">
                    <RiskMapTab 
                      classId={selectedClassId}
                      teacherProfile={teacherProfile}
                      currentClass={currentClass}
                    />
                  </TabsContent>
                  <TabsContent value="forms" className="mt-4">
                    <InfoFormsTab 
                      classId={selectedClassId}
                      teacherProfile={teacherProfile}
                      currentClass={currentClass}
                    />
                  </TabsContent>
                  <TabsContent value="report" className="mt-4">
                    <ReportTab />
                  </TabsContent>
                </Tabs>
              )
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
