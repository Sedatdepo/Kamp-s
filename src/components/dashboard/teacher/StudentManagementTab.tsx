
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Grid, ClipboardList } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { Firestore } from 'firebase/firestore';

interface StudentManagementTabProps {
  classId: string;
  students: Student[];
  db: Firestore;
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  studentList: React.ReactNode;
  attendance: React.ReactNode;
  dutyRoster: React.ReactNode;
  seatingPlan: React.ReactNode;
}

export function StudentManagementTab({
  studentList,
  attendance,
  dutyRoster,
  seatingPlan
}: StudentManagementTabProps) {
  return (
    <Tabs defaultValue="student-list">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <TabsList className="w-full justify-start">
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
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
