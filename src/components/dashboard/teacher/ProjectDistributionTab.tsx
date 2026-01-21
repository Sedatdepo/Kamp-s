'use client';

import React, { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Class, TeacherProfile, Lesson } from '@/lib/types';
import { ProjectAssignmentView } from './DistributionAssignmentTab';
import { ProjectPetitionsTab } from './ProjectPetitionsTab';
import { ProjectLibrary } from './project-pool/ProjectLibrary';
import { ProjectGradingTab } from './ProjectGradingTab';

interface ProjectDistributionTabProps {
  classId: string;
  teacherId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
  classes: Class[];
  students: Student[]; // Receives ALL students for the teacher
  lessons: Lesson[];
}

export function ProjectDistributionTab(props: ProjectDistributionTabProps) {
  // Filter students for the current class. This is crucial for class-specific tabs.
  const studentsForCurrentClass = useMemo(() => {
    if (!props.currentClass) return [];
    return props.students.filter(s => s.classId === props.currentClass!.id);
  }, [props.students, props.currentClass]);

  return (
    <Tabs defaultValue="library">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="assignment">Proje Tercihleri</TabsTrigger>
        <TabsTrigger value="library">Proje Havuzu</TabsTrigger>
        <TabsTrigger value="petitions">Proje Dilekçeleri</TabsTrigger>
        <TabsTrigger value="grading">Proje Değerlendirme</TabsTrigger>
      </TabsList>
      <TabsContent value="assignment" className="mt-4">
        <ProjectAssignmentView
          classId={props.classId}
          teacherId={props.teacherId}
          teacherProfile={props.teacherProfile}
          currentClass={props.currentClass}
          students={studentsForCurrentClass} // Pass filtered students
          lessons={props.lessons}
        />
      </TabsContent>
      <TabsContent value="library" className="mt-4">
        <ProjectLibrary 
           classId={props.classId}
           teacherProfile={props.teacherProfile}
           classes={props.classes}
           students={props.students} // The library needs all students to assign across classes
        />
      </TabsContent>
      <TabsContent value="petitions" className="mt-4">
        <ProjectPetitionsTab
          classId={props.classId}
          teacherProfile={props.teacherProfile}
          currentClass={props.currentClass}
          lessons={props.lessons || []}
          students={studentsForCurrentClass} // Pass filtered students
        />
      </TabsContent>
       <TabsContent value="grading" className="mt-4">
        <ProjectGradingTab
          students={studentsForCurrentClass} // Pass filtered students
          teacherProfile={props.teacherProfile!}
          currentClass={props.currentClass}
        />
      </TabsContent>
    </Tabs>
  );
}
