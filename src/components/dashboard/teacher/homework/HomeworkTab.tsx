'use client';

import React, { useMemo } from 'react';
import { Class, Student, TeacherProfile, Lesson } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { LiveHomeworkManagement } from './LiveHomeworkManagement';
import { HomeworkEvaluationTab } from './HomeworkEvaluationTab';
import { HomeworkLibrary } from './HomeworkLibrary';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ProjectAssignmentView } from '../HomeworkTab';
import { ProjectPetitionsTab } from '../ProjectPetitionsTab';
import { ProjectLibrary as ProjectPoolLibrary } from '../project-pool/ProjectLibrary';
import { ProjectGradingTab } from '../ProjectGradingTab';

// --- MAIN EXPORTED COMPONENT ---
export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes, lessons }: {
    classId: string;
    currentClass: Class | null;
    teacherProfile: TeacherProfile | null;
    students: Student[];
    classes: Class[];
    lessons: Lesson[];
}) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemoFirebase(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useCollection<Student>(allStudentsForTeacherQuery);

    const studentsForCurrentClass = useMemo(() => {
        if (!currentClass) return [];
        return students.filter(s => s.classId === currentClass!.id);
      }, [students, currentClass]);

    return (
        <Tabs defaultValue="live">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                    <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                    <TabsTrigger value="library">Performans Ödevleri</TabsTrigger>
                    <TabsTrigger value="project-assignment">Proje Tercihleri</TabsTrigger>
                    <TabsTrigger value="project-library">Proje Havuzu</TabsTrigger>
                    <TabsTrigger value="petitions">Proje Dilekçeleri</TabsTrigger>
                    <TabsTrigger value="grading">Proje Değerlendirme</TabsTrigger>
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
                    students={studentsForCurrentClass}
                    lessons={lessons}
                />
            </TabsContent>
            <TabsContent value="project-library" className="mt-4">
                <ProjectPoolLibrary 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    classes={classes}
                    students={allStudents || []}
                />
            </TabsContent>
            <TabsContent value="petitions" className="mt-4">
                 <ProjectPetitionsTab 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    currentClass={currentClass}
                    lessons={lessons || []}
                    students={studentsForCurrentClass}
                 />
            </TabsContent>
             <TabsContent value="grading" className="mt-4">
                <ProjectGradingTab
                  students={studentsForCurrentClass}
                  teacherProfile={teacherProfile!}
                  currentClass={currentClass}
                />
            </TabsContent>
        </Tabs>
    );
}
