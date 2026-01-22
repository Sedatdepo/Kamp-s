'use client';

import React, { useMemo } from 'react';
import { Class, Student, TeacherProfile, Lesson } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { LiveHomeworkManagement } from './homework/LiveHomeworkManagement';
import { HomeworkEvaluationTab } from './homework/HomeworkEvaluationTab';
import { HomeworkLibrary } from './homework/HomeworkLibrary';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ProjectAssignmentView } from './DistributionAssignmentTab';
import { ProjectPetitionsTab } from './ProjectPetitionsTab';


interface HomeworkTabProps {
  classId: string;
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  students: Student[];
  classes: Class[];
  lessons: Lesson[];
}

export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes, lessons }: HomeworkTabProps) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemoFirebase(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useCollection<Student>(allStudentsForTeacherQuery);

    return (
        <Tabs defaultValue="live">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                    <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                    <TabsTrigger value="library">Performans Ödevleri</TabsTrigger>
                    <TabsTrigger value="project-assignment">Proje Tercihleri</TabsTrigger>
                    <TabsTrigger value="project-petitions">Proje Dilekçeleri</TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <TabsContent value="live" className="mt-4">
                <LiveHomeworkManagement
                    classId={classId}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                    students={students}
                />
            </TabsContent>
            <TabsContent value="evaluation" className="mt-4">
                <HomeworkEvaluationTab
                    classId={classId}
                    students={students}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                />
            </TabsContent>
            <TabsContent value="library" className="mt-4">
                <HomeworkLibrary 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    classes={classes}
                    students={allStudents || []}
                />
            </TabsContent>
            <TabsContent value="project-assignment" className="mt-4">
                <ProjectAssignmentView
                    classId={classId}
                    teacherId={teacherProfile!.id}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    students={students}
                    lessons={lessons}
                />
            </TabsContent>
            <TabsContent value="project-petitions" className="mt-4">
                 <ProjectPetitionsTab 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    clubs={[]} // This should be lessons, fixing based on component
                    lessons={lessons}
                    students={students}
                 />
            </TabsContent>
        </Tabs>
    );
}
