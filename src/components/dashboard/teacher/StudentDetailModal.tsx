
"use client";

import { useState, useMemo } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gauge, BookOpen, UserCheck, GraduationCap } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';

interface StudentDetailModalProps {
  student: Student;
  teacherProfile: TeacherProfile;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number => {
    if (!scores || !criteria.length) return 0;
    const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return (totalScore / totalMax) * 100;
};

const GradeCard = ({ title, icon, value }: { title: string, icon: React.ReactNode, value: number }) => (
    <Card className="flex-1">
        <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">{icon} {title}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{value.toFixed(2)}</p>
        </CardContent>
    </Card>
);

const TermGrades = ({ termGrades, teacherProfile }: { termGrades: GradingScores, teacherProfile: TeacherProfile }) => {
    const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    const behaviorCriteria = teacherProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
    
    const perf1Avg = calculateAverage(termGrades.scores1, perfCriteria);
    const perf2Avg = calculateAverage(termGrades.scores2, perfCriteria);
    const projAvg = calculateAverage(termGrades.projectScores, projCriteria);
    const behaviorAvg = calculateAverage(termGrades.behaviorScores, behaviorCriteria);
    
    return (
        <div className="flex gap-4">
            <GradeCard title="1. Performans" icon={<Gauge/>} value={perf1Avg} />
            <GradeCard title="2. Performans" icon={<Gauge/>} value={perf2Avg} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
        </div>
    )
};


export function StudentDetailModal({ student, teacherProfile, isOpen, setIsOpen }: StudentDetailModalProps) {
    
    const calculateTermAverage = (termGrades: GradingScores) => {
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
        const behaviorCriteria = teacherProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
        
        const averages = [
            calculateAverage(termGrades.scores1, perfCriteria),
            calculateAverage(termGrades.scores2, perfCriteria),
            calculateAverage(termGrades.projectScores, projCriteria),
            calculateAverage(termGrades.behaviorScores, behaviorCriteria)
        ].filter(avg => avg > 0); // Only consider grades that have been entered

        if (averages.length === 0) return 0;
        return averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
    };
    
    const term1Avg = calculateTermAverage(student.term1Grades);
    const term2Avg = calculateTermAverage(student.term2Grades);
    const finalAverage = (term1Avg + term2Avg) / ([term1Avg, term2Avg].filter(a => a > 0).length || 1);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-headline">{student.name}</DialogTitle>
              <DialogDescription>Okul No: {student.number}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 pt-0 bg-muted/50">
            <Tabs defaultValue="term1">
                <div className="flex justify-between items-center mb-4">
                     <TabsList>
                        <TabsTrigger value="term1">1. Dönem</TabsTrigger>
                        <TabsTrigger value="term2">2. Dönem</TabsTrigger>
                    </TabsList>
                    <Card className="p-4 bg-background">
                        <CardDescription className="flex items-center gap-2"><GraduationCap/> Yıl Sonu Genel Ortalama</CardDescription>
                        <p className="text-4xl font-bold text-primary text-center mt-1">{finalAverage.toFixed(2)}</p>
                    </Card>
                </div>
                <TabsContent value="term1">
                    <TermGrades termGrades={student.term1Grades} teacherProfile={teacherProfile} />
                </TabsContent>
                <TabsContent value="term2">
                    <TermGrades termGrades={student.term2Grades} teacherProfile={teacherProfile} />
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
