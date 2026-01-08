
"use client";

import React, { useState, useMemo } from 'react';
import { Student, Class, TeacherProfile } from '@/lib/types';
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
import { UserPlus, Trash2, Edit, Save, X, Upload, QrCode } from 'lucide-react';

interface StudentListTabProps {
  classId: string;
  students: Student[];
  onStudentsChange: (students: Student[]) => void;
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function StudentListTab({ classId, students, onStudentsChange, currentClass, teacherProfile }: StudentListTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const sortedStudents = useMemo(() => {
    if (!students) return [];
    return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
  }, [students]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim() || !db) return;
    try {
      const newStudentData: Omit<Student, 'id'> = {
        name: newStudentName,
        number: newStudentNumber,
        classId: classId,
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        behaviorScore: 100,
        hasProject: false,
      };
      const docRef = await addDoc(collection(db, 'students'), newStudentData);
      onStudentsChange([...students, { id: docRef.id, ...newStudentData }]);
      toast({ title: 'Öğrenci eklendi!' });
      setNewStudentName('');
      setNewStudentNumber('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci eklenemedi.' });
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
      onStudentsChange(students.map(s => s.id === editingStudent.id ? editingStudent : s));
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
        onStudentsChange(students.filter(s => s.id !== studentId));
        toast({ title: 'Öğrenci silindi.', variant: 'destructive' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci silinemedi.' });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !db) return;

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
        const newStudentsForState: Student[] = [];
        studentsToAdd.forEach(student => {
          const newStudentRef = doc(collection(db, 'students'));
          const newStudentData: Omit<Student, 'id'> = { ...student, classId: classId, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100, hasProject: false };
          batch.set(newStudentRef, newStudentData);
          newStudentsForState.push({ id: newStudentRef.id, ...newStudentData });
        });

        await batch.commit();
        onStudentsChange([...students, ...newStudentsForState]);
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
                <TableHead className="w-[120px]">Proje Ödevi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map(student => (
                editingStudent?.id === student.id ? (
                  <TableRow key={student.id}>
                    <TableCell><Input value={editingStudent.number} onChange={(e) => setEditingStudent({ ...editingStudent, number: e.target.value })} /></TableCell>
                    <TableCell><Input value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} /></TableCell>
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
                    <TableCell className="text-center"><Checkbox checked={student.hasProject} disabled /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(student.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                )
              ))}
              <TableRow>
                <TableCell><Input placeholder="Okul No" value={newStudentNumber} onChange={(e) => setNewStudentNumber(e.target.value)} /></TableCell>
                <TableCell><Input placeholder="Adı Soyadı" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} /></TableCell>
                <TableCell></TableCell>
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
