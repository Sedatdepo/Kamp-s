
"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectGradingTab } from './ProjectGradingTab';
import { LessonManager } from './LessonManager';
import { DistributionAssignmentTab } from './DistributionAssignmentTab';


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
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="lessons">Proje Konuları</TabsTrigger>
        <TabsTrigger value="distribution">Dağılım & Atama</TabsTrigger>
        <TabsTrigger value="grading">Proje Değerlendirme</TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="mt-4">
        {teacherId && <LessonManager teacherId={teacherId} students={students || []} />}
      </TabsContent>
      <TabsContent value="distribution" className="mt-4">
        <DistributionAssignmentTab classId={classId} teacherProfile={teacherProfile} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="grading" className="mt-4">
        {teacherProfile && <ProjectGradingTab students={students || []} teacherProfile={teacherProfile} />}
      </TabsContent>
    </Tabs>
  );
}
