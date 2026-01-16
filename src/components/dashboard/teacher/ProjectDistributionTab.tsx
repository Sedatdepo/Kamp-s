'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Class, TeacherProfile, Lesson } from '@/lib/types';
import { ProjectAssignmentView } from './DistributionAssignmentTab';
import { ProjectPetitionsTab } from './ProjectPetitionsTab';

interface ProjectDistributionTabProps {
  classId: string;
  teacherId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
  classes: Class[];
  students: Student[];
  lessons: Lesson[];
}

export function ProjectDistributionTab(props: ProjectDistributionTabProps) {
  return (
    <Tabs defaultValue="assignment">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="assignment">Proje Atama</TabsTrigger>
        <TabsTrigger value="petitions">Proje Dilekçeleri</TabsTrigger>
      </TabsList>
      <TabsContent value="assignment" className="mt-4">
        <ProjectAssignmentView
          classId={props.classId}
          teacherId={props.teacherId}
          teacherProfile={props.teacherProfile}
          currentClass={props.currentClass}
          students={props.students}
          lessons={props.lessons}
        />
      </TabsContent>
      <TabsContent value="petitions" className="mt-4">
        <ProjectPetitionsTab
          classId={props.classId}
          teacherProfile={props.teacherProfile}
          currentClass={props.currentClass}
          lessons={props.lessons || []}
          students={props.students || []}
        />
      </TabsContent>
    </Tabs>
  );
}
