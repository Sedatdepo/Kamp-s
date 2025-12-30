'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  Class,
  TeacherProfile,
  GradingScores,
} from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Users, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface ExamAnalysisTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

type ExamKey = 'exam1' | 'exam2';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export function ExamAnalysisTab({
  students,
  currentClass,
  teacherProfile,
}: ExamAnalysisTabProps) {
  const [selectedTerm, setSelectedTerm] = useState<'term1' | 'term2'>('term1');
  const [selectedExam, setSelectedExam] = useState<ExamKey>('exam1');

  const examData = useMemo(() => {
    return students
      .map((student) => {
        const termGrades = student[selectedTerm === 'term1' ? 'term1Grades' : 'term2Grades'];
        const grade = termGrades?.[selectedExam];
        return { student, grade };
      })
      .filter((item): item is { student: Student; grade: number } => 
        item.grade !== undefined && item.grade !== null
      );
  }, [students, selectedTerm, selectedExam]);

  const stats = useMemo(() => {
    if (examData.length === 0) {
      return { average: 0, successRate: 0, highest: 0, lowest: 0 };
    }
    const grades = examData.map(d => d.grade);
    const sum = grades.reduce((a, b) => a + b, 0);
    const average = sum / grades.length;
    const successCount = grades.filter(g => g >= 50).length;
    const successRate = (successCount / examData.length) * 100;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);

    return {
      average: average,
      successRate: successRate,
      highest: highest,
      lowest: lowest,
    };
  }, [examData]);

  const sortedStudents = useMemo(() => {
    return [...examData].sort((a,b) => b.grade - a.grade);
  }, [examData]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sınav Analizi ve Telafi Planı</CardTitle>
          <CardDescription>
            Sınav sonuçlarını analiz edin, sınıfın genel durumunu görün ve
            telafi çalışmaları planlayın.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select
            value={selectedTerm}
            onValueChange={(v) => setSelectedTerm(v as 'term1' | 'term2')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Dönem Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="term1">1. Dönem</SelectItem>
              <SelectItem value="term2">2. Dönem</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedExam}
            onValueChange={(v) => setSelectedExam(v as ExamKey)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sınav Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exam1">1. Yazılı</SelectItem>
              <SelectItem value="exam2">2. Yazılı</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Sınıf Ortalaması" value={stats.average.toFixed(2)} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Başarı Oranı (50+)" value={`%${stats.successRate.toFixed(2)}`} icon={<Target className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="En Yüksek Not" value={stats.highest.toString()} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="En Düşük Not" value={stats.lowest.toString()} icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Öğrenci Performans Sıralaması</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead className="text-right">Not</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStudents.map(({ student, grade }) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell className="text-right font-bold">{grade}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
             <CardHeader>
                <CardTitle>Kazanım Analizi ve Telafi Planı</CardTitle>
                <CardDescription>Bu özellik yakında eklenecektir. Sınavdaki soruların kazanımlarını girerek analiz yapabileceksiniz.</CardDescription>
            </CardHeader>
            <CardContent className='flex items-center justify-center h-48 bg-muted/50 rounded-lg'>
                <p className='text-muted-foreground'>Yakında...</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
