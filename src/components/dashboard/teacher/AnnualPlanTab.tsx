'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherProfile, Class } from '@/lib/types';
import { ClassGuidanceAssistant } from './ClassGuidanceAssistant';


export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  return (
    <Tabs defaultValue="rehberlik-plani">
      <TabsList>
        <TabsTrigger value="rehberlik-plani">Rehberlik Yıllık Planı</TabsTrigger>
      </TabsList>
       <TabsContent value="rehberlik-plani" className="mt-4">
         <ClassGuidanceAssistant />
      </TabsContent>
    </Tabs>
  );
}
