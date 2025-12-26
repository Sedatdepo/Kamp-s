"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Student, InfoForm } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { exportStudentInfoToDoc } from '@/lib/word-export';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

const ViewFormModal = ({ student, form }: { student: Student, form?: InfoForm }) => {
    if (!form || !form.submitted) {
        return <p>Bu form henüz doldurulmamış.</p>
    }
    return (
        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-4">
            <h3 className="font-bold font-headline">Kişisel Bilgiler</h3>
            <p><strong>Doğum Tarihi:</strong> {form.birthDate ? format(form.birthDate.toDate(), 'PPP') : 'N/A'}</p>
            <p><strong>Doğum Yeri:</strong> {form.birthPlace || 'N/A'}</p>
            <p><strong>Adres:</strong> {form.address || 'N/A'}</p>
            <p><strong>Sağlık Sorunları:</strong> {form.healthIssues || 'Yok'}</p>
            <p><strong>Hobiler:</strong> {form.hobbies || 'N/A'}</p>
            <p><strong>Teknoloji Kullanımı:</strong> {form.techUsage || 'N/A'}</p>

            <h3 className="font-bold font-headline mt-4">Veli Bilgileri</h3>
            <p><strong>Anne Durumu:</strong> {form.motherStatus || 'N/A'}</p>
            <p><strong>Anne Eğitimi:</strong> {form.motherEducation || 'N/A'}</p>
            <p><strong>Anne Mesleği:</strong> {form.motherJob || 'N/A'}</p>
            <p><strong>Baba Durumu:</strong> {form.fatherStatus || 'N/A'}</p>
            <p><strong>Baba Eğitimi:</strong> {form.fatherEducation || 'N/A'}</p>
            <p><strong>Baba Mesleği:</strong> {form.fatherJob || 'N/A'}</p>

            <h3 className="font-bold font-headline mt-4">Aile Bilgileri</h3>
            <p><strong>Kardeşler:</strong> {form.siblingsInfo || 'N/A'}</p>
            <p><strong>Ekonomik Durum:</strong> {form.economicStatus || 'N/A'}</p>
        </div>
    )
}

export function InfoFormsTab({ classId }: { classId: string }) {
  const { appUser } = useAuth();
  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const studentIds = useMemo(() => students.map(s => s.id), [students]);
  const infoFormsQuery = useMemo(() => studentIds.length > 0 ? query(collection(db, 'infoForms'), where('studentId', 'in', studentIds)) : null, [studentIds]);
  const { data: infoForms, loading: formsLoading } = useFirestore<InfoForm>('infoForms', infoFormsQuery);

  const getFormForStudent = (studentId: string) => infoForms.find(f => f.studentId === studentId);

  const handleExport = (student: Student) => {
    const form = getFormForStudent(student.id);
    if (appUser?.type === 'teacher' && appUser.profile && form) {
      exportStudentInfoToDoc(student, form, appUser.profile);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Bilgi Formları</CardTitle>
        <CardDescription>Öğrenci bilgi formlarını görüntüleyin ve dışa aktarın.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Eylemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading || formsLoading ? (
                 <TableRow><TableCell colSpan={3} className="text-center"><Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /></TableCell></TableRow>
              ) : (
                students.map(student => {
                  const form = getFormForStudent(student.id);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant={form?.submitted ? 'default' : 'secondary'} className={form?.submitted ? 'bg-green-600' : ''}>
                          {form?.submitted ? 'Dolduruldu' : 'Boş'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="font-headline">Bilgi Formu: {student.name}</DialogTitle>
                                </DialogHeader>
                                <ViewFormModal student={student} form={form} />
                            </DialogContent>
                        </Dialog>
                        <Button
                          onClick={() => handleExport(student)}
                          disabled={!form?.submitted}
                          variant="outline"
                          size="icon"
                          title="Word olarak indir"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
