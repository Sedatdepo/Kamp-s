
"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectGradingTab } from './ProjectGradingTab';
import { DistributionAssignmentTab } from './DistributionAssignmentTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


interface ProjectDistributionTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

export function ProjectDistributionTab({ classId, teacherProfile, currentClass }: ProjectDistributionTabProps) {
  const { appUser, db } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student[]>(`students-in-class-${classId}`, studentsQuery);

  if (studentsLoading) {
      return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <Tabs defaultValue="distribution">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="distribution">1. Tercih & Atama</TabsTrigger>
          <TabsTrigger value="grading">2. Proje Değerlendirme</TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="distribution" className="mt-4">
        <DistributionAssignmentTab classId={classId} teacherId={teacherId} teacherProfile={teacherProfile} currentClass={currentClass} students={students || []} />
      </TabsContent>
      <TabsContent value="grading" className="mt-4">
        {teacherProfile && <ProjectGradingTab students={students || []} teacherProfile={teacherProfile} currentClass={currentClass} />}
      </TabsContent>
    </Tabs>
  );
}

