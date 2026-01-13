'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherProfile, Class } from '@/lib/types';
import { SubjectAnnualPlan } from './SubjectAnnualPlan';
import { ClassGuidanceAssistant } from './ClassGuidanceAssistant';


export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  return (
    <Tabs defaultValue="ders-plani">
      <TabsList>
        <TabsTrigger value="ders-plani">Ders Yıllık Planı</TabsTrigger>
        <TabsTrigger value="rehberlik-plani">Rehberlik Yıllık Planı</TabsTrigger>
      </TabsList>
      <TabsContent value="ders-plani" className="mt-4">
        <SubjectAnnualPlan teacherProfile={teacherProfile} currentClass={currentClass} />
      </TabsContent>
       <TabsContent value="rehberlik-plani" className="mt-4">
         <ClassGuidanceAssistant />
      </TabsContent>
    </Tabs>
  );
}