
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, InfoForm, TeacherProfile, InfoFormsStatusDocument } from '@/lib/types';
import { collection, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { exportStudentInfoToRtf, exportInfoFormsStatusToRtf } from '@/lib/word-export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, FileDown, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';

interface InfoFormsTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

export function InfoFormsTab({ classId, teacherProfile, currentClass }: InfoFormsTabProps) {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const { db: localDb, setDb: setLocalDb, loading: localDbLoading } = useDatabase();
  const { infoFormsStatusDocuments = [] } = localDb;

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: liveStudents, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  
  const studentIds = useMemo(() => liveStudents?.map(s => s.id) || [], [liveStudents]);

  const infoFormsQuery = useMemoFirebase(() => {
    if (!db || studentIds.length === 0) return null;
    return query(collection(db, 'infoForms'), where('studentId', 'in', studentIds));
  }, [db, studentIds]);

  const { data: liveInfoForms, isLoading: formsLoading } = useCollection<InfoForm>(infoFormsQuery);

  const { students, infoForms } = useMemo(() => {
    if (selectedRecordId) {
      const record = infoFormsStatusDocuments.find(d => d.id === selectedRecordId);
      if (record) {
        return {
          students: record.data.students.map(s => ({ ...s, id: s.id, name: s.name, number: s.number } as Student)),
          infoForms: record.data.infoForms.map(f => ({ ...f, studentId: f.studentId, submitted: f.submitted } as InfoForm)),
        };
      }
    }
    return { students: liveStudents, infoForms: liveInfoForms };
  }, [selectedRecordId, infoFormsStatusDocuments, liveStudents, liveInfoForms]);
  
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
            infoForms: infoForms || [],
            currentClass,
            teacherProfile
        })
    } else {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için sınıf bilgisi yüklenemedi.'})
    }
  };

  const handleExportSingle = (student: Student) => {
    const formData = infoForms?.find(f => f.studentId === student.id);
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

   const handleSaveToArchive = () => {
    if (!currentClass || !liveStudents || !liveInfoForms) return;

    const newRecord: InfoFormsStatusDocument = {
      id: `info_forms_status_${Date.now()}`,
      name: `Bilgi Formu Durumu - ${new Date().toLocaleDateString('tr-TR')}`,
      date: new Date().toISOString(),
      classId: currentClass.id,
      data: {
        students: liveStudents.map(s => ({ id: s.id, name: s.name, number: s.number })),
        infoForms: liveInfoForms.map(f => ({ studentId: f.studentId, submitted: f.submitted })),
      },
    };
    
    setLocalDb(prev => ({...prev, infoFormsStatusDocuments: [...(prev.infoFormsStatusDocuments || []), newRecord]}));
    toast({ title: 'Arşivlendi' });
  };
  
  const handleNewRecord = useCallback(() => setSelectedRecordId(null), []);
  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prev => ({...prev, infoFormsStatusDocuments: (prev.infoFormsStatusDocuments || []).filter(d => d.id !== selectedRecordId)}));
    handleNewRecord();
    toast({ title: 'Kayıt Silindi', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  const isLoading = studentsLoading || formsLoading || localDbLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
             <RecordManager
                records={(infoFormsStatusDocuments || []).filter(d => d.classId === classId)}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Bilgi Formu Durumu"
            />
            <Button onClick={handleSaveToArchive} className="w-full mt-4" disabled={!!selectedRecordId}>
                <Save className="mr-2 h-4 w-4" /> Mevcut Durumu Arşivle
            </Button>
        </div>
        <div className="lg:col-span-2">
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
                                disabled={!currentClass || !!selectedRecordId}
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
                        const form = infoForms?.find(f => f.studentId === student.id);
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
                                onClick={() => handleExportSingle(student as Student)}
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
        </div>
    </div>
  );
}
