
"use client";

import { useState, useMemo } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores, Class, Homework } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gauge, BookOpen, UserCheck, GraduationCap, Edit, ClipboardCheck } from 'lucide-react';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';


interface StudentDetailModalProps {
  student: Student;
  teacherProfile: TeacherProfile;
  currentClass: Class | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria.length || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return (totalScore / totalMax) * 100;
};

const GradeCard = ({ title, icon, value }: { title: string, icon: React.ReactNode, value: number | string | null }) => (
    <Card className="flex-1">
        <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">{icon} {title}</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-2xl font-bold">
                {value === null || value === undefined ? 'N/A' : typeof value === 'number' ? value.toFixed(2) : value}
            </p>
        </CardContent>
    </Card>
);

const TermGrades = ({ termGrades, teacherProfile, student }: { termGrades?: GradingScores, teacherProfile: TeacherProfile, student: Student }) => {
    const grades = termGrades || {};
    const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    const behaviorCriteria = teacherProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
    
    const exam1 = grades.exam1;
    const exam2 = grades.exam2;
    const perf1 = calculateAverage(grades.scores1, perfCriteria);
    const perf2 = calculateAverage(grades.scores2, perfCriteria);
    const projAvg = student.hasProject ? calculateAverage(grades.projectScores, projCriteria) : null;
    const behaviorAvg = calculateAverage(grades.behaviorScores, behaviorCriteria);
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <GradeCard title="1. Sınav" icon={<Edit/>} value={exam1 ?? 'Girmedi'} />
            <GradeCard title="2. Sınav" icon={<Edit/>} value={exam2 ?? 'Girmedi'} />
            <GradeCard title="1. Performans" icon={<Gauge/>} value={perf1} />
            <GradeCard title="2. Performans" icon={<Gauge/>} value={perf2} />
            <GradeCard title="Proje Ödevi" icon={<BookOpen/>} value={projAvg} />
            <GradeCard title="Davranış Notu" icon={<UserCheck/>} value={behaviorAvg} />
        </div>
    )
};

const HomeworkStatusTab = ({ student, currentClass }: { student: Student, currentClass: Class | null }) => {
    const { toast } = useToast();
    if (!currentClass) {
        return <p>Sınıf bilgisi yüklenemedi.</p>;
    }
    const homeworks = currentClass.homeworks || [];


    const handleHomeworkStatusChange = async (homework: Homework, isCompleted: boolean) => {
        if (!currentClass) return;

        const classRef = doc(db, 'classes', currentClass.id);
        
        const updatedHomeworks = (currentClass.homeworks || []).map(hw => {
            if (hw.id === homework.id) {
                const currentCompletedBy = hw.completedBy || [];
                const newCompletedBy = isCompleted
                    ? [...currentCompletedBy, student.id]
                    : currentCompletedBy.filter(id => id !== student.id);
                return { ...hw, completedBy: newCompletedBy };
            }
            return hw;
        });

        try {
            await updateDoc(classRef, { homeworks: updatedHomeworks });
            toast({ title: 'Ödev durumu güncellendi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme başarısız oldu.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ödev Durumu</CardTitle>
                <CardDescription>Öğrencinin ödev tamamlama durumunu buradan takip edebilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {homeworks.length > 0 ? (
                    homeworks.map(hw => (
                        <div key={hw.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <p className="text-sm font-medium">{hw.text}</p>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Veriliş: {format(new Date(hw.assignedDate), 'd MMMM yyyy', { locale: tr })}
                                    {hw.dueDate && ` | Teslim: ${format(new Date(hw.dueDate), 'd MMMM yyyy', { locale: tr })}`}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Label htmlFor={`hw-switch-${hw.id}`} className="text-sm font-medium text-muted-foreground">Yapmadı</Label>
                                <Switch
                                    id={`hw-switch-${hw.id}`}
                                    checked={(hw.completedBy || []).includes(student.id)}
                                    onCheckedChange={(checked) => handleHomeworkStatusChange(hw, !!checked)}
                                />
                                <Label htmlFor={`hw-switch-${hw.id}`} className="text-sm font-medium">Yaptı</Label>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Bu sınıfa henüz ödev atanmamış.</p>
                )}
            </CardContent>
        </Card>
    );
};


export function StudentDetailModal({ student, teacherProfile, currentClass, isOpen, setIsOpen }: StudentDetailModalProps) {
    
    const calculateTermAverage = (termGrades?: GradingScores) => {
        if (!termGrades) return 0;
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
        const behaviorCriteria = teacherProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
        
        const exam1 = termGrades.exam1;
        const exam2 = termGrades.exam2;
        const perf1 = calculateAverage(termGrades.scores1, perfCriteria);
        const perf2 = calculateAverage(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? calculateAverage(termGrades.projectScores, projCriteria) : null;
        const behaviorAvg = calculateAverage(termGrades.behaviorScores, behaviorCriteria);

        const averages = [exam1, exam2, perf1, perf2, projAvg, behaviorAvg].filter(
            (avg): avg is number => avg !== undefined && avg !== null && avg > 0
        );

        if (averages.length === 0) return 0;
        return averages.reduce((sum, avg) => sum + avg, 0) / averages.length;
    };
    
    const term1Avg = calculateTermAverage(student.term1Grades);
    const term2Avg = calculateTermAverage(student.term2Grades);
    const finalAverage = (term1Avg > 0 && term2Avg > 0) ? (term1Avg + term2Avg) / 2 : (term1Avg > 0 ? term1Avg : term2Avg);


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
             <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                    <TabsTrigger value="homeworks">Ödevler</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
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
                            <TermGrades termGrades={student.term1Grades} teacherProfile={teacherProfile} student={student} />
                        </TabsContent>
                        <TabsContent value="term2">
                            <TermGrades termGrades={student.term2Grades} teacherProfile={teacherProfile} student={student} />
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="homeworks" className="mt-4">
                   <HomeworkStatusTab student={student} currentClass={currentClass} />
                </TabsContent>
            </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
