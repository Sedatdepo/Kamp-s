'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Student, TeacherProfile, Class, Criterion, ActiveTerm } from '@/lib/types';
import { INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Trash2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { exportGradingToRtf } from '@/lib/word-export'; // Corrected import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ProjectGradingTabProps {
  students: Student[];
  teacherProfile: TeacherProfile;
  currentClass: Class | null;
}

export function ProjectGradingTab({ students, teacherProfile, currentClass }: ProjectGradingTabProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;

  const [activeTerm, setActiveTerm] = useState<ActiveTerm>(1);
  const [scores, setScores] = useState<{ [studentId: string]: { [criteriaId: string]: number } }>({});

  const projectStudents = useMemo(() => {
    return students.filter(s => s.hasProject);
  }, [students]);

  // Load existing scores when component mounts or students/term change
  useEffect(() => {
    const initialScores: { [studentId: string]: { [criteriaId: string]: number } } = {};
    const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
    projectStudents.forEach(student => {
      const termGrades = student[termKey];
      if (termGrades && termGrades.projectScores) {
        initialScores[student.id] = termGrades.projectScores;
      }
    });
    setScores(initialScores);
  }, [projectStudents, activeTerm]);

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
    const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
    const batch = writeBatch(db);
    projectStudents.forEach(student => {
      const studentScores = scores[student.id];
      if (studentScores) {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, {
          [`${termKey}.projectScores`]: studentScores
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

  const handleDeleteAssignment = async (studentId: string) => {
    if (!db) return;
    const studentRef = doc(db, 'students', studentId);
    try {
        await writeBatch(db)
            .update(studentRef, {
                assignedLesson: null,
                hasProject: false,
                'term1Grades.projectScores': {},
                'term2Grades.projectScores': {}
            })
            .commit();
        toast({ title: 'Atama İptal Edildi', description: 'Öğrencinin proje ataması kaldırıldı.' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Atama iptal edilemedi.' });
    }
  };
  
  const handleExport = () => {
    if (!currentClass || !teacherProfile || projectStudents.length === 0) {
        toast({ title: 'Hata', description: 'Rapor oluşturmak için gerekli veriler eksik.', variant: 'destructive' });
        return;
    }
    const termKey = activeTerm === 1 ? 'term1Grades' : 'term2Grades';
    const studentsWithScores = projectStudents.map(student => {
        const studentScores = scores[student.id];
        if (studentScores) {
            return {
                ...student,
                [termKey]: {
                    ...(student[termKey] || {}),
                    projectScores: studentScores
                }
            };
        }
        return student;
    });

    exportGradingToRtf({
        activeTab: 3, // 3 for project
        activeTerm,
        students: studentsWithScores,
        currentCriteria: projCriteria,
        currentClass,
        teacherProfile,
    });
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
           <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Label>Dönem:</Label>
                    <Select value={String(activeTerm)} onValueChange={(val) => setActiveTerm(Number(val) as 1 | 2)}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1. Dönem</SelectItem>
                            <SelectItem value="2">2. Dönem</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              <Button onClick={handleExport} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Değerlendirme Çıktısı</Button>
              <Button onClick={handleSaveAll}>
                <Save className="mr-2 h-4 w-4" /> Tümünü Kaydet
              </Button>
          </div>
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
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectStudents.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium sticky left-0 bg-background group-hover:bg-muted z-10">
                    ({student.number}) {student.name}
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
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {student.name} adlı öğrencinin proje atamasını iptal etmek istediğinizden emin misiniz? Girilen tüm notlar silinecektir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAssignment(student.id)} className="bg-destructive hover:bg-destructive/90">
                            Atamayı İptal Et
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
