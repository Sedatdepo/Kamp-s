'use client';

import { useMemo, useState } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Loader2, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectGradingTab } from './ProjectGradingTab';
import { DistributionAssignmentTab } from './DistributionAssignmentTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { Button } from '@/components/ui/button';
import { ProjectLibrary } from './project-pool/ProjectLibrary';


interface ProjectDistributionTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
  classes: Class[];
}

export function ProjectDistributionTab({ classId, teacherProfile, currentClass, classes }: ProjectDistributionTabProps) {
  const { appUser, db } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student[]>(`students-in-class-${classId}`, studentsQuery);
  
  const allStudentsForTeacherQuery = useMemo(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useFirestore<Student[]>(
        `all-students-for-teacher-${teacherProfile?.id}`,
        allStudentsForTeacherQuery
    );

  const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
    if (!teacherId || !db) return;
    const teacherRef = doc(db, 'teachers', teacherId);
    await updateDoc(teacherRef, data);
  };


  if (studentsLoading) {
      return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="mr-2 h-4 w-4" />
          Proje Değerlendirme Ayarları
        </Button>
      </div>
      <Tabs defaultValue="distribution">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="distribution">1. Tercih & Atama</TabsTrigger>
            <TabsTrigger value="grading">2. Proje Değerlendirme</TabsTrigger>
            <TabsTrigger value="pool">Proje Havuzu</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="distribution" className="mt-4">
          <DistributionAssignmentTab classId={classId} teacherId={teacherId} teacherProfile={teacherProfile} currentClass={currentClass} students={students || []} />
        </TabsContent>
        <TabsContent value="grading" className="mt-4">
          {teacherProfile && <ProjectGradingTab students={students || []} teacherProfile={teacherProfile} currentClass={currentClass} />}
        </TabsContent>
         <TabsContent value="pool" className="mt-4">
          <ProjectLibrary 
            classId={classId}
            teacherProfile={teacherProfile}
            classes={classes}
            students={allStudents || []}
          />
        </TabsContent>
      </Tabs>
      {teacherProfile && (
        <GradingSettingsDialog 
            isOpen={isSettingsOpen}
            setIsOpen={setIsSettingsOpen}
            teacherProfile={teacherProfile}
            updateTeacherProfile={updateTeacherProfile}
        />
      )}
    </>
  );
}
