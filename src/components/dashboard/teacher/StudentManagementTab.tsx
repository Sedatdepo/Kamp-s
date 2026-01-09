'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar as CalendarIconLucide, Grid, ClipboardList } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { StudentListTab } from './StudentListTab';
import { AttendanceTab } from './AttendanceTab';
import NobetciListesi from './DutyRosterTab'; // Corrected import
import { SeatingPlanTab } from './SeatingPlanTab';
import { useAuth } from '@/hooks/useAuth';

interface StudentManagementTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  classes: Class[];
  onStudentsChange: (students: Student[]) => void; // Add this prop
}

export function StudentManagementTab({ students, currentClass, teacherProfile, classes, onStudentsChange }: StudentManagementTabProps) {
    if (!currentClass) {
        return <p>Lütfen bir sınıf seçin.</p>;
    }

    const DutyRosterTab = NobetciListesi;


    return (
        <Tabs defaultValue="student-list">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="student-list"><Users className="mr-2 h-4 w-4" />Öğrenci Listesi</TabsTrigger>
                    <TabsTrigger value="attendance"><CalendarIconLucide className="mr-2 h-4 w-4" />Yoklama</TabsTrigger>
                    <TabsTrigger value="duty-roster"><ClipboardList className="mr-2 h-4 w-4" />Nöbet Listesi</TabsTrigger>
                    <TabsTrigger value="seating-plan"><Grid className="mr-2 h-4 w-4" />Oturma Planı</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="student-list" className="mt-4">
                <StudentListTab
                    classId={currentClass.id}
                    students={students}
                    onStudentsChange={onStudentsChange} // Pass it down
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                />
            </TabsContent>
            <TabsContent value="attendance" className="mt-4">
                <AttendanceTab students={students} currentClass={currentClass} onStudentsChange={onStudentsChange} />
            </TabsContent>
            <TabsContent value="duty-roster" className="mt-4">
                <DutyRosterTab classes={classes} students={students} teacherProfile={teacherProfile} />
            </TabsContent>
            <TabsContent value="seating-plan" className="mt-4">
                <SeatingPlanTab students={students} currentClass={currentClass} />
            </TabsContent>
        </Tabs>
    );
}
