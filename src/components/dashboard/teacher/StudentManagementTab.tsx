
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { StudentListTab } from './StudentListTab';
import { AttendanceTab } from './AttendanceTab';
import { DutyRosterTab } from './DutyRosterTab';
import { SeatingPlanTab } from './SeatingPlanTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Users, Calendar, Grid, ClipboardList } from 'lucide-react';

interface StudentManagementTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

export function StudentManagementTab({ classId, teacherProfile, currentClass }: StudentManagementTabProps) {
  const { db } = useAuth();

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${classId}`, studentsQuery);

  return (
    <Tabs defaultValue="student-list">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="student-list">
          <Users className="mr-2 h-4 w-4" />
          Öğrenci Listesi
        </TabsTrigger>
        <TabsTrigger value="attendance">
          <Calendar className="mr-2 h-4 w-4" />
          Yoklama
        </TabsTrigger>
        <TabsTrigger value="duty-roster">
          <ClipboardList className="mr-2 h-4 w-4" />
          Nöbet Listesi
        </TabsTrigger>
        <TabsTrigger value="seating-plan">
          <Grid className="mr-2 h-4 w-4" />
          Oturma Planı
        </TabsTrigger>
      </TabsList>
      <TabsContent value="student-list" className="mt-4">
        <StudentListTab classId={classId} teacherProfile={teacherProfile} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceTab students={students} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="duty-roster" className="mt-4">
        <DutyRosterTab students={students} currentClass={currentClass} teacherProfile={teacherProfile} />
      </TabsContent>
      <TabsContent value="seating-plan" className="mt-4">
        <SeatingPlanTab students={students} currentClass={currentClass} teacherProfile={teacherProfile} />
      </TabsContent>
    </Tabs>
  );
}
