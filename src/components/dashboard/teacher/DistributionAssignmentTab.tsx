
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


interface DistributionAssignmentTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

export function DistributionAssignmentTab({ classId, teacherProfile, currentClass }: DistributionAssignmentTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student[]>(`students-in-class-for-projects-${classId}`, studentsQuery);

  const [localStudents, setLocalStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (students) {
      setLocalStudents(students);
    }
  }, [students]);

  const handleFieldChange = (studentId: string, field: keyof Student, value: string | boolean) => {
    setLocalStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, [field]: value } : s)
    );
  };
  
  const handleSaveChanges = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    localStudents.forEach(student => {
      const originalStudent = students.find(s => s.id === student.id);
      if (JSON.stringify(student) !== JSON.stringify(originalStudent)) {
        const studentRef = doc(db, 'students', student.id);
        batch.update(studentRef, {
          projectCode: student.projectCode || null,
          projectDueDate: student.projectDueDate || null,
          projectSubmitted: student.projectSubmitted || false,
        });
      }
    });

    try {
      await batch.commit();
      toast({ title: 'Başarılı', description: 'Tüm proje bilgileri güncellendi.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Değişiklikler kaydedilemedi.' });
    }
  };


  const isLoading = studentsLoading;

  return (
    <Card>
      <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle className="font-headline">Proje Dağılımı ve Takip</CardTitle>
                  <CardDescription>Öğrencilere proje atayın ve teslim durumlarını takip edin.</CardDescription>
              </div>
              <Button onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" /> Değişiklikleri Kaydet
              </Button>
          </div>
      </CardHeader>
      <CardContent>
          {isLoading ? (
          <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          ) : (
          <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="w-[150px]">Öğrenci</TableHead>
                    <TableHead>Proje Kodu</TableHead>
                    <TableHead className="w-[200px]">Teslim Tarihi</TableHead>
                    <TableHead className="text-center w-[120px]">Teslim Durumu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {localStudents && localStudents.length > 0 ? localStudents.map(student => (
                  <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                       <TableCell>
                          <Input 
                            value={student.projectCode || ''}
                            onChange={(e) => handleFieldChange(student.id, 'projectCode', e.target.value)}
                            placeholder="Örn: FIZ-01"
                            className="h-8"
                          />
                       </TableCell>
                       <TableCell>
                          <Input 
                            type="date"
                            value={student.projectDueDate || ''}
                            onChange={(e) => handleFieldChange(student.id, 'projectDueDate', e.target.value)}
                            className="h-8"
                          />
                       </TableCell>
                       <TableCell className="text-center">
                          <Checkbox
                            checked={student.projectSubmitted || false}
                            onCheckedChange={(checked) => handleFieldChange(student.id, 'projectSubmitted', !!checked)}
                          />
                       </TableCell>
                  </TableRow>
                  )) : (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                          Bu sınıfta öğrenci bulunmuyor.
                      </TableCell>
                  </TableRow>
              )}
              </TableBody>
          </Table>
          )}
      </CardContent>
    </Card>
  );
}
