'use client';

import React, { useMemo } from 'react';
import { Student, TeacherProfile, Criterion, GradingScores, Class } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { exportDetailedGradesToRtf } from '@/lib/word-export'; // Yeni import
import { useToast } from '@/hooks/use-toast';

interface StudentGradesDetailTabProps {
  students: Student[];
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null; // currentClass eklendi
}

const calculateAverageForCriteria = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria || criteria.length === 0 || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    return (totalScore / totalMax) * 100;
};

const getGradeColor = (grade: number) => {
    if (grade >= 85) return 'text-green-600';
    if (grade >= 70) return 'text-blue-600';
    if (grade >= 50) return 'text-orange-600';
    if (grade > 0) return 'text-red-600';
    return 'text-muted-foreground';
};

const GradeCell = ({ grade }: { grade: number | undefined | null }) => {
    const displayValue = grade === -1 ? 'G' : (grade ?? '-');
    const colorClass = typeof grade === 'number' && grade !== -1 ? getGradeColor(grade) : 'text-muted-foreground';
    
    return (
        <TableCell className={cn("text-center font-medium", colorClass)}>
            {displayValue}
        </TableCell>
    );
};

export function StudentGradesDetailTab({ students, teacherProfile, currentClass }: StudentGradesDetailTabProps) {
    const { toast } = useToast();

    const calculateTermAverage = (student: Student, termGrades?: GradingScores): number => {
        if (!termGrades || !teacherProfile) return 0;
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;

        const exam1 = termGrades.exam1;
        const exam2 = termGrades.exam2;
        const perf1 = calculateAverageForCriteria(termGrades.scores1, perfCriteria);
        const perf2 = calculateAverageForCriteria(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? calculateAverageForCriteria(termGrades.projectScores, projCriteria) : null;

        const allScores = [exam1, exam2, perf1, perf2, projAvg].filter(
            (score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0
        );

        if (allScores.length === 0) return 0;

        const sum = allScores.reduce((acc, score) => acc + score, 0);
        return sum / allScores.length;
    };

    const studentAverages = useMemo(() => {
        return students.map(student => {
            const term1Avg = calculateTermAverage(student, student.term1Grades);
            const term2Avg = calculateTermAverage(student, student.term2Grades);
            return {
                studentId: student.id,
                term1Avg,
                term2Avg,
            };
        });
    }, [students, teacherProfile]);

    const sortedStudents = useMemo(() => {
        if (!students) return [];
        return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
    }, [students]);

    const handleExport = () => {
        if (!currentClass || !teacherProfile) {
            toast({
                title: "Hata",
                description: "Rapor oluşturmak için gerekli sınıf ve öğretmen bilgileri eksik.",
                variant: "destructive"
            });
            return;
        }
        exportDetailedGradesToRtf({
            students: sortedStudents,
            currentClass,
            teacherProfile,
            studentAverages,
            perfCriteria: teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA,
            projCriteria: teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA,
        });
    };

    if (!teacherProfile) {
        return <p>Öğretmen profili yükleniyor...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Detaylı Not Listesi</CardTitle>
                        <CardDescription>Tüm sınıfın her iki döneme ait sınav, performans ve proje notlarını bir arada görüntüleyin.</CardDescription>
                    </div>
                    <Button onClick={handleExport} variant="outline">
                        <FileDown className="mr-2 h-4 w-4" /> RTF Olarak İndir
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-[70vh] w-full">
                <Table>
                    <TableHeader className="sticky top-0 bg-secondary z-10">
                        <TableRow>
                            <TableHead rowSpan={2} className="text-left align-middle sticky left-0 bg-secondary z-20">Öğrenci</TableHead>
                            <TableHead colSpan={6} className="text-center">1. Dönem</TableHead>
                            <TableHead colSpan={6} className="text-center">2. Dönem</TableHead>
                        </TableRow>
                        <TableRow>
                            <TableHead className="text-center">1. Sınav</TableHead>
                            <TableHead className="text-center">2. Sınav</TableHead>
                            <TableHead className="text-center">1. Perf.</TableHead>
                            <TableHead className="text-center">2. Perf.</TableHead>
                            <TableHead className="text-center">Proje</TableHead>
                            <TableHead className="text-center font-bold">Ort.</TableHead>

                            <TableHead className="text-center">1. Sınav</TableHead>
                            <TableHead className="text-center">2. Sınav</TableHead>
                            <TableHead className="text-center">1. Perf.</TableHead>
                            <TableHead className="text-center">2. Perf.</TableHead>
                            <TableHead className="text-center">Proje</TableHead>
                            <TableHead className="text-center font-bold">Ort.</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStudents.map(student => {
                            const term1 = student.term1Grades || {};
                            const term2 = student.term2Grades || {};
                            const averages = studentAverages.find(a => a.studentId === student.id);
                            const perf1_1 = calculateAverageForCriteria(term1.scores1, teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA);
                            const perf1_2 = calculateAverageForCriteria(term1.scores2, teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA);
                            const proj1 = calculateAverageForCriteria(term1.projectScores, teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA);
                            const perf2_1 = calculateAverageForCriteria(term2.scores1, teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA);
                            const perf2_2 = calculateAverageForCriteria(term2.scores2, teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA);
                            const proj2 = calculateAverageForCriteria(term2.projectScores, teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA);

                            return (
                                <TableRow key={student.id}>
                                    <TableCell className="sticky left-0 bg-background z-20 font-medium">
                                        <div className="flex flex-col">
                                            <span>{student.name}</span>
                                            <span className="text-xs text-muted-foreground">No: {student.number}</span>
                                        </div>
                                    </TableCell>
                                    
                                    {/* Term 1 Grades */}
                                    <GradeCell grade={term1.exam1} />
                                    <GradeCell grade={term1.exam2} />
                                    <GradeCell grade={perf1_1} />
                                    <GradeCell grade={perf1_2} />
                                    <GradeCell grade={student.hasProject ? proj1 : undefined} />
                                    <TableCell className={cn("text-center font-bold", getGradeColor(averages?.term1Avg || 0))}>
                                        {averages?.term1Avg.toFixed(2)}
                                    </TableCell>
                                    
                                    {/* Term 2 Grades */}
                                    <GradeCell grade={term2.exam1} />
                                    <GradeCell grade={term2.exam2} />
                                    <GradeCell grade={perf2_1} />
                                    <GradeCell grade={perf2_2} />
                                    <GradeCell grade={student.hasProject ? proj2 : undefined} />
                                    <TableCell className={cn("text-center font-bold", getGradeColor(averages?.term2Avg || 0))}>
                                        {averages?.term2Avg.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
