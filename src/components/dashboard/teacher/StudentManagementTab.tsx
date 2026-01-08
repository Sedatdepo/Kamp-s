
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar as CalendarIconLucide, Grid, ClipboardList } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { StudentListTab } from './StudentListTab';
import { AttendanceTab } from './AttendanceTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { useAuth } from '@/hooks/useAuth';

interface StudentManagementTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function StudentManagementTab({ students, currentClass, teacherProfile }: StudentManagementTabProps) {
    const { db } = useAuth();
    const [localStudents, setLocalStudents] = React.useState<Student[]>(students);

    React.useEffect(() => {
        setLocalStudents(students);
    }, [students]);

    if (!currentClass) {
        return <p>Lütfen bir sınıf seçin.</p>;
    }

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
                    students={localStudents}
                    onStudentsChange={setLocalStudents}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                />
            </TabsContent>
            <TabsContent value="attendance" className="mt-4">
                <AttendanceTab students={localStudents} currentClass={currentClass} onStudentsChange={setLocalStudents} />
            </TabsContent>
            <TabsContent value="duty-roster" className="mt-4">
                <DutyRosterTab students={localStudents} currentClass={currentClass} teacherProfile={teacherProfile} db={db!} />
            </TabsContent>
            <TabsContent value="seating-plan" className="mt-4">
                <SeatingPlanTab students={localStudents} currentClass={currentClass} />
            </TabsContent>
        </Tabs>
    );
}
