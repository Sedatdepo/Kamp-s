

"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { Users, Calendar, Grid, ClipboardList } from 'lucide-react';

interface StudentManagementTabProps {
  studentList: React.ReactNode;
  attendance: React.ReactNode;
  dutyRoster: React.ReactNode;
  seatingPlan: React.ReactNode;
}

export function StudentManagementTab({ studentList, attendance, dutyRoster, seatingPlan }: StudentManagementTabProps) {
  
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
        {studentList}
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        {attendance}
      </TabsContent>
      <TabsContent value="duty-roster" className="mt-4">
        {dutyRoster}
      </TabsContent>
      <TabsContent value="seating-plan" className="mt-4">
        {seatingPlan}
      </TabsContent>
    </Tabs>
  );
}
