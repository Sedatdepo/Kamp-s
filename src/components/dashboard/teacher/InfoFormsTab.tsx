

"use client";

import { useMemo, useState, useEffect } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, InfoForm, TeacherProfile } from '@/lib/types';
import { collection, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { exportStudentInfoToRtf, exportInfoFormsStatusToRtf } from '@/lib/word-export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InfoFormsTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

export function InfoFormsTab({ classId, teacherProfile, currentClass }: InfoFormsTabProps) {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const [infoForms, setInfoForms] = useState<InfoForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student[]>(`students-in-class-${classId}`, studentsQuery);

  useEffect(() => {
    const fetchForms = async () => {
        if (!db || !students || students.length === 0) {
            setInfoForms([]);
            setFormsLoading(false);
            return;
        }
        setFormsLoading(true);
        try {
            const studentIds = students.map(s => s.id);
            const forms: InfoForm[] = [];
            
            // Firestore 'in' query supports up to 30 comparison values.
            // We chunk the studentIds array into subarrays of 30.
            for (let i = 0; i < studentIds.length; i += 30) {
                const chunk = studentIds.slice(i, i + 30);
                if (chunk.length > 0) {
                    const formsQuery = query(collection(db, 'infoForms'), where('studentId', 'in', chunk));
                    const querySnapshot = await getDocs(formsQuery);
                    querySnapshot.forEach((doc) => {
                        forms.push({ id: doc.id, ...doc.data() } as InfoForm);
                    });
                }
            }
            setInfoForms(forms);
        } catch (error) {
            console.error("Error fetching info forms: ", error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Bilgi formları yüklenirken bir sorun oluştu.'});
        } finally {
            setFormsLoading(false);
        }
    };

    if (!studentsLoading && classId) {
        fetchForms();
    }
  }, [students, studentsLoading, classId, toast, db]);
  
  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass || !db) return;
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

  const handleExportList = () => {
    if (currentClass && students) {
        exportInfoFormsStatusToRtf({
            students,
            infoForms,
            currentClass,
            teacherProfile
        })
    } else {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için sınıf bilgisi yüklenemedi.'})
    }
  };

  const handleExportSingle = (student: Student) => {
    const formData = infoForms.find(f => f.studentId === student.id);
    if (appUser?.type === 'teacher' && teacherProfile && formData) {
      exportStudentInfoToRtf(student, formData, teacherProfile);
    } else {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Öğrenci formu bulunamadı veya öğretmen bilgileri eksik.',
      });
    }
  };

  const isLoading = studentsLoading || formsLoading;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle className="font-headline">Öğrenci Bilgi Formları</CardTitle>
                <CardDescription>Öğrencilerin bilgi formu doldurma durumlarını takip edin.</CardDescription>
            </div>
             <div className="flex items-center flex-wrap justify-end gap-4">
                <Button variant="outline" onClick={handleExportList}>
                    <FileText className="mr-2 h-4 w-4" />
                    Listeyi Dışa Aktar
                </Button>
                <div className="flex items-center space-x-2">
                    <Switch 
                        id="info-form-toggle" 
                        checked={currentClass?.isInfoFormActive || false}
                        onCheckedChange={handleToggleChange}
                        disabled={!currentClass}
                    />
                    <Label htmlFor="info-form-toggle">Form Aktif</Label>
                </div>
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
              {students && students.length > 0 ? students.map(student => {
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
                        onClick={() => handleExportSingle(student)}
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Formu İndir (.rtf)
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



