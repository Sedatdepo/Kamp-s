
'use client';

import React, { useMemo } from 'react';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { collection, query, where } from 'firebase/firestore';
import { LiveHomeworkManagement } from './homework/LiveHomeworkManagement';
import { HomeworkEvaluationTab } from './homework/HomeworkEvaluationTab';
import { HomeworkLibrary } from './homework/HomeworkLibrary';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


// --- MAIN EXPORTED COMPONENT ---
export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[], classes: Class[] }) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemo(() => {
        if (!teacherProfile?.id || !db) return null;
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useFirestore<Student[]>(
        `all-students-for-teacher-${teacherProfile?.id}`,
        allStudentsForTeacherQuery
    );

    return (
        <Tabs defaultValue="live">
            <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                    <TabsTrigger value="evaluation">Ödev Değerlendirme</TabsTrigger>
                    <TabsTrigger value="library">Hazır Ödev Kütüphanesi</TabsTrigger>
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
        </Tabs>
    );
}
