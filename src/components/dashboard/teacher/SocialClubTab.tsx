
'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Class, TeacherProfile, Club } from '@/lib/types';
import { ClubAssignmentTab } from './club/ClubAssignmentTab';
import { ClubPetitionsTab } from './club/ClubPetitionsTab';
import { useAuth } from '@/hooks/useAuth';

interface SocialClubTabProps {
  students: Student[];
  teacherId: string;
  currentClass: Class | null;
  clubs: Club[];
}

export function SocialClubTab({ students, teacherId, currentClass, clubs }: SocialClubTabProps) {
    const { appUser } = useAuth();
    const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;

    return (
        <Tabs defaultValue="assignment">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assignment">Kulüp Atama</TabsTrigger>
                <TabsTrigger value="petitions">Kulüp Dilekçeleri</TabsTrigger>
            </TabsList>
            <TabsContent value="assignment" className="mt-4">
                <ClubAssignmentTab 
                    students={students} 
                    teacherId={teacherId} 
                    currentClass={currentClass} 
                    clubs={clubs}
                />
            </TabsContent>
            <TabsContent value="petitions" className="mt-4">
                <ClubPetitionsTab 
                    classId={currentClass?.id || ''}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    clubs={clubs}
                    students={students}
                />
            </TabsContent>
        </Tabs>
    );
}

    
