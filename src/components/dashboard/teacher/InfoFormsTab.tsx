'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuidanceReferralTab } from './GuidanceReferralTab';
import { StudentInfoFormTab } from './StudentInfoFormTab';
import { Class, TeacherProfile, Student } from '@/lib/types';

interface InfoFormsTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
  students: Student[];
}

export function InfoFormsTab({ classId, teacherProfile, currentClass, students }: InfoFormsTabProps) {
    return (
        <Tabs defaultValue="guidance-referral">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="guidance-referral">Rehberliğe Yönlendirme</TabsTrigger>
                <TabsTrigger value="student-info-forms">Öğrenci Bilgi Formları</TabsTrigger>
            </TabsList>
            <TabsContent value="guidance-referral" className="mt-4">
                 <GuidanceReferralTab teacherProfile={teacherProfile} currentClass={currentClass} />
            </TabsContent>
            <TabsContent value="student-info-forms" className="mt-4">
                <StudentInfoFormTab 
                    students={students}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                />
            </TabsContent>
        </Tabs>
    );
}
