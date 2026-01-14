
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuidanceReferralTab } from './GuidanceReferralTab';
import { StudentObservationFormTab } from './StudentObservationFormTab';
import { Class, TeacherProfile } from '@/lib/types';

interface InfoFormsTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function InfoFormsTab({ classId, teacherProfile, currentClass }: InfoFormsTabProps) {
    return (
        <Tabs defaultValue="guidance-referral">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="guidance-referral">Rehberliğe Yönlendirme</TabsTrigger>
                <TabsTrigger value="student-observation-form">Öğrenci Gözlem Formu</TabsTrigger>
                <TabsTrigger value="student-info-forms" disabled>Öğrenci Bilgi Formları</TabsTrigger>
            </TabsList>
            <TabsContent value="guidance-referral" className="mt-4">
                 <GuidanceReferralTab />
            </TabsContent>
            <TabsContent value="student-observation-form" className="mt-4">
                 <StudentObservationFormTab 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                 />
            </TabsContent>
            <TabsContent value="student-info-forms" className="mt-4">
                <p>Bu bölüm geliştirme aşamasındadır.</p>
            </TabsContent>
        </Tabs>
    );
}
