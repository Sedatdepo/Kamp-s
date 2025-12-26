"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, InfoForm, TeacherProfile } from '@/lib/types';
import { collection, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportStudentInfoToDoc } from '@/lib/word-export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InfoFormsTabProps {
  classId: string;
}

export function InfoFormsTab({ classId }: InfoFormsTabProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();

  const classQuery = useMemo(() => query(doc(db, 'classes', classId)), [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const infoFormsQuery = useMemo(() => query(collection(db, 'infoForms'), where('studentId', 'in', students.map(s => s.id).length > 0 ? students.map(s => s.id) : ['dummy'])), [students]);
  const { data: infoForms, loading: formsLoading } = useFirestore<InfoForm>('infoForms', infoFormsQuery);
  
  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', classId);
    try {
      await updateDoc(classRef, { isInfoFormActive: checked });
      toast({
        title: 'Başarılı',
        description: `Bilgi formu ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme sırasında bir sorun oluştu.',
      });
    }
  };

  const handleExport = (student: Student) => {
    const formData = infoForms.find(f => f.studentId === student.id);
    if (appUser?.type === 'teacher' && appUser.profile && formData) {
      exportStudentInfoToDoc(student, formData, appUser.profile);
    } else {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Öğrenci formu bulunamadı veya öğretmen bilgileri eksik.',
      });
    }
  };

  const isLoading = classLoading || studentsLoading || formsLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Öğrenci Bilgi Formları</CardTitle>
                <CardDescription>Öğrencilerin bilgi formu doldurma durumlarını takip edin.</CardDescription>
            </div>
             <div className="flex items-center space-x-2">
                <Switch 
                    id="info-form-toggle" 
                    checked={currentClass?.isInfoFormActive || false}
                    onCheckedChange={handleToggleChange}
                    disabled={classLoading}
                />
                <Label htmlFor="info-form-toggle">Form Aktif</Label>
            </div>
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
                <TableHead>Öğrenci Adı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length > 0 ? students.map(student => {
                const form = infoForms.find(f => f.studentId === student.id);
                const submitted = form?.submitted || false;

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant={submitted ? 'default' : 'secondary'}>
                        {submitted ? 'Dolduruldu' : 'Bekleniyor'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!submitted}
                        onClick={() => handleExport(student)}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        İndir (.doc)
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
