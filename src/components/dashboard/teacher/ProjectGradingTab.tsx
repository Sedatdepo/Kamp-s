'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Student, TeacherProfile, Class, Criterion } from '@/lib/types';
import { INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

interface ProjectGradingTabProps {
  students: Student[];
  teacherProfile: TeacherProfile;
  currentClass: Class | null;
}

export function ProjectGradingTab({ students, teacherProfile, currentClass }: ProjectGradingTabProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;

  const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});

  const projectStudents = useMemo(() => {
    return students.filter(s => s.assignedLesson);
  }, [students]);

  // Load existing scores when component mounts or students change
  useEffect(() => {
    const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
    projectStudents.forEach(student => {
      // Assuming project grades are stored in term1Grades for now. This can be made more dynamic.
      if (student.term1Grades?.projectScores) {
        initialScores[student.id] = student.term1Grades.projectScores;
      }
    });
    setScores(initialScores);
  }, [projectStudents]);

  const handleScoreChange = (studentId: string, criteriaId: string, value: string) => {
    const newScore = parseInt(value, 10);
    if (isNaN(newScore) && value !== '') return; // Allow clearing but not invalid chars

    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criteriaId]: isNaN(newScore) ? 0 : newScore,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Veritabanı bağlantısı yok.' });
      return;
    }

    const batch = writeBatch(db);
    projectStudents.forEach(student => {
      const studentScores = scores[student.id];
      if (studentScores) {
        const studentRef = doc(db, 'students', student.id);
        // This example saves to term1Grades. A term selector could be added for more flexibility.
        batch.update(studentRef, {
          'term1Grades.projectScores': studentScores
        });
      }
    });

    try {
      await batch.commit();
      toast({ title: 'Başarılı!', description: 'Proje notları başarıyla kaydedildi.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Notlar kaydedilemedi.' });
    }
  };

  const calculateTotal = (studentId: string) => {
    const studentScores = scores[studentId];
    if (!studentScores) return 0;
    return projCriteria.reduce((sum, c) => sum + (Number(studentScores[c.id]) || 0), 0);
  };
  
  if (projectStudents.length === 0) {
    return (
        <div className="text-center p-8 bg-muted/50 rounded-lg">
            <p className="font-semibold">Proje Alan Öğrenci Yok</p>
            <p className="text-muted-foreground mt-2">
                Bu sınıfta henüz proje ödevi atanmış bir öğrenci bulunmuyor.
            </p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Proje Ödevi Değerlendirmesi</CardTitle>
            <CardDescription>Atanan projeleri, belirlenen kriterlere göre notlandırın.</CardDescription>
          </div>
          <Button onClick={handleSaveAll}>
            <Save className="mr-2 h-4 w-4" /> Tümünü Kaydet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-secondary z-10">Öğrenci</TableHead>
                {projCriteria.map(c => (
                  <TableHead key={c.id} className="text-center">{c.name} ({c.max} P)</TableHead>
                ))}
                <TableHead className="text-center">Toplam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectStudents.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium sticky left-0 bg-background group-hover:bg-muted z-10">
                    {student.name}
                  </TableCell>
                  {projCriteria.map(c => (
                    <TableCell key={c.id} className="text-center">
                      <Input
                        type="number"
                        max={c.max}
                        min={0}
                        value={scores[student.id]?.[c.id] || ''}
                        onChange={(e) => handleScoreChange(student.id, c.id, e.target.value)}
                        className="w-20 mx-auto text-center h-9"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-bold text-lg">
                    {calculateTotal(student.id)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
