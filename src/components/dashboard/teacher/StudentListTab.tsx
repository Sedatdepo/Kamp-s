
'use client';

import React, { useState, useMemo } from 'react';
import { Student, Class, TeacherProfile, GradingScores, Criterion } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, addDoc, updateDoc, deleteDoc, collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentDetailModal } from './StudentDetailModal';
import { ClassInviteDialog } from './ClassInviteDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Trash2, Edit, Save, X, Upload, QrCode, ClipboardPaste } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { cn } from '@/lib/utils';


interface StudentListTabProps {
  classId: string;
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

const calculateAverageForCriteria = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
    if (!scores || !criteria || criteria.length === 0 || Object.keys(scores).length === 0) return null;
    const totalMax = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0);
    if (totalMax === 0) return 0;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    return (totalScore / totalMax) * 100;
};


export function StudentListTab({ classId, students, currentClass, teacherProfile }: StudentListTabProps) {
  const { db, appUser } = useAuth();
  const { toast } = useToast();
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [bulkStudentData, setBulkStudentData] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

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
      const finalAverage = (term1Avg > 0 && term2Avg > 0) ? (term1Avg + term2Avg) / 2 : (term1Avg > 0 ? term1Avg : term2Avg);
      return {
        studentId: student.id,
        term1Avg,
        term2Avg,
        finalAverage,
      };
    });
  }, [students, teacherProfile]);

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
  }, [students]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim() || !db || !teacherId) return;
    try {
      const newStudentData: Omit<Student, 'id'> = {
        name: newStudentName,
        number: newStudentNumber,
        classId: classId,
        teacherId: teacherId,
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        behaviorScore: 100,
        hasProject: false,
      };
      await addDoc(collection(db, 'students'), newStudentData);
      toast({ title: 'Öğrenci eklendi!' });
      setNewStudentName('');
      setNewStudentNumber('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci eklenemedi.' });
    }
  };
  
  const handleBulkAddStudents = async () => {
    if (!bulkStudentData.trim() || !db || !teacherId) return;
    try {
        const lines = bulkStudentData.split('\n').filter(line => line.trim() !== '');
        const studentsToAdd = lines.map(line => {
            const parts = line.split(/\s+/);
            const number = parts[0];
            const name = parts.slice(1).join(' ');
            return { number, name };
        }).filter(s => s.number && s.name);

        const batch = writeBatch(db);
        studentsToAdd.forEach(student => {
            const newStudentRef = doc(collection(db, 'students'));
            const newStudentData: Omit<Student, 'id'> = { ...student, classId: classId, teacherId: teacherId, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100, hasProject: false };
            batch.set(newStudentRef, newStudentData);
        });

        await batch.commit();
        toast({ title: `${studentsToAdd.length} öğrenci başarıyla eklendi!` });
        setBulkStudentData('');
        setIsBulkAddModalOpen(false);

    } catch (error) {
        console.error("Error importing students:", error);
        toast({ variant: 'destructive', title: 'Veri Hatası', description: 'Öğrenciler içe aktarılamadı. Formatı kontrol edin (Numara Ad Soyad).' });
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.name.trim() || !editingStudent.number.trim() || !db) return;
    try {
      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        number: editingStudent.number,
        hasProject: editingStudent.hasProject,
      });
      toast({ title: 'Öğrenci güncellendi.' });
      setEditingStudent(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci güncellenemedi.' });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!db) return;
    if (confirm("Bu öğrenciyi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        toast({ title: 'Öğrenci silindi.', variant: 'destructive' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci silinemedi.' });
      }
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !db || !teacherId) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const studentsToAdd = json.slice(1).map(row => ({
          number: String(row[0] || ''),
          name: String(row[1] || ''),
        })).filter(s => s.number && s.name);

        const batch = writeBatch(db);
        studentsToAdd.forEach(student => {
          const newStudentRef = doc(collection(db, 'students'));
          const newStudentData: Omit<Student, 'id'> = { ...student, classId: classId, teacherId: teacherId, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100, hasProject: false };
          batch.set(newStudentRef, newStudentData);
        });

        await batch.commit();
        toast({ title: `${studentsToAdd.length} öğrenci başarıyla eklendi!` });

      } catch (error) {
        console.error("Error importing students:", error);
        toast({ variant: 'destructive', title: 'Dosya Okuma Hatası', description: 'Öğrenci listesi içe aktarılamadı.' });
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  const handleOpenDetailModal = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 85) return 'text-green-600';
    if (grade >= 70) return 'text-blue-600';
    if (grade >= 50) return 'text-orange-600';
    if (grade > 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Öğrenci Listesi</CardTitle>
              <CardDescription>{currentClass?.name} sınıfındaki öğrencilerin listesi.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" /> Davet Et
              </Button>
              <Dialog open={isBulkAddModalOpen} onOpenChange={setIsBulkAddModalOpen}>
                  <DialogTrigger asChild>
                     <Button variant="outline"><ClipboardPaste className="mr-2 h-4 w-4" /> Toplu Ekle</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Toplu Öğrenci Ekle</DialogTitle>
                          <DialogDescription>
                              Öğrenci listesini (Numara Ad Soyad formatında) aşağıdaki alana yapıştırın. Her öğrenci yeni bir satırda olmalıdır.
                          </DialogDescription>
                      </DialogHeader>
                      <Textarea 
                          placeholder="101 Ali Yılmaz\n102 Ayşe Kaya\n103 Fatma Öztürk"
                          value={bulkStudentData}
                          onChange={(e) => setBulkStudentData(e.target.value)}
                          rows={10}
                      />
                      <DialogFooter>
                          <Button onClick={handleBulkAddStudents}>Öğrencileri Ekle</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
              <Button variant="outline" asChild>
                <label htmlFor="student-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" /> Excel'den Aktar
                </label>
              </Button>
              <input id="student-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Okul No</TableHead>
                <TableHead>Adı Soyadı</TableHead>
                <TableHead className="text-center">1. Dönem Ort.</TableHead>
                <TableHead className="text-center">2. Dönem Ort.</TableHead>
                <TableHead className="text-center">Yıl Sonu Ort.</TableHead>
                <TableHead className="w-[120px] text-center">Proje Ödevi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map(student => {
                const averages = studentAverages.find(avg => avg.studentId === student.id);
                return editingStudent?.id === student.id ? (
                  <TableRow key={student.id}>
                    <TableCell><Input value={editingStudent.number} onChange={(e) => setEditingStudent({ ...editingStudent, number: e.target.value })} /></TableCell>
                    <TableCell><Input value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} /></TableCell>
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="text-center"><Checkbox checked={editingStudent.hasProject} onCheckedChange={(checked) => setEditingStudent({ ...editingStudent, hasProject: !!checked })} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" onClick={handleUpdateStudent} className="mr-2"><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingStudent(null)}><X className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={student.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDetailModal(student)}>
                    <TableCell>{student.number}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell className={cn("text-center font-bold", getGradeColor(averages?.term1Avg || 0))}>
                        {averages?.term1Avg.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn("text-center font-bold", getGradeColor(averages?.term2Avg || 0))}>
                        {averages?.term2Avg.toFixed(2)}
                    </TableCell>
                    <TableCell className={cn("text-center font-bold text-lg", getGradeColor(averages?.finalAverage || 0))}>
                        {averages?.finalAverage.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center"><Checkbox checked={student.hasProject} disabled /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              <TableRow>
                <TableCell><Input placeholder="Okul No" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)} /></TableCell>
                <TableCell><Input placeholder="Adı Soyadı" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} /></TableCell>
                <TableCell colSpan={4}></TableCell>
                <TableCell className="text-right">
                  <Button onClick={handleAddStudent}><UserPlus className="mr-2 h-4 w-4" /> Ekle</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedStudent && teacherProfile && currentClass && (
        <StudentDetailModal
          student={selectedStudent}
          teacherProfile={teacherProfile}
          currentClass={currentClass}
          isOpen={isDetailModalOpen}
          setIsOpen={setIsDetailModalOpen}
        />
      )}
      {currentClass && (
        <ClassInviteDialog
          isOpen={isInviteModalOpen}
          setIsOpen={setIsInviteModalOpen}
          classCode={currentClass.code}
          className={currentClass.name}
        />
      )}
    </div>
  );
}
