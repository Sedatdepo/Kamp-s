'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceHomeworkEvaluationTab } from './PerformanceHomeworkEvaluationTab';
import { ProjectHomeworkEvaluationTab } from './ProjectHomeworkEvaluationTab';
import { RegularHomeworkEvaluationTab } from './RegularHomeworkEvaluationTab';
import { Student, Class, TeacherProfile } from '@/lib/types';

interface HomeworkEvaluationTabProps {
  classId: string;
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function HomeworkEvaluationTab({
  classId,
  students,
  currentClass,
  teacherProfile,
}: HomeworkEvaluationTabProps) {
  return (
    <Tabs defaultValue="performance" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="performance">Performans Ödevleri</TabsTrigger>
        <TabsTrigger value="project">Proje Ödevleri</TabsTrigger>
        <TabsTrigger value="regular">Diğer Ödevler</TabsTrigger>
      </TabsList>
      <TabsContent value="performance" className="mt-4">
        <PerformanceHomeworkEvaluationTab
          classId={classId}
          students={students}
          teacherProfile={teacherProfile}
          currentClass={currentClass}
        />
      </TabsContent>
      <TabsContent value="project" className="mt-4">
         <ProjectHomeworkEvaluationTab
            classId={classId}
            students={students}
            teacherProfile={teacherProfile}
            currentClass={currentClass}
         />
      </TabsContent>
       <TabsContent value="regular" className="mt-4">
        <RegularHomeworkEvaluationTab
          classId={classId}
          students={students}
        />
      </TabsContent>
    </Tabs>
  );
}
