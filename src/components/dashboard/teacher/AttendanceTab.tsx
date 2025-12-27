
"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student, Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, UserMinus, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export function AttendanceTab({ students, currentClass }: AttendanceTabProps) {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: AttendanceStatus }>({});
  const [showSummary, setShowSummary] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<Student[]>([]);

  useEffect(() => {
    const todayRecords: { [key: string]: AttendanceStatus } = {};
    students.forEach(student => {
      const attendanceForDate = student.attendance?.find(a => a.date === date);
      if (attendanceForDate) {
        todayRecords[student.id] = attendanceForDate.status;
      }
    });
    setAttendanceRecords(todayRecords);
  }, [date, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
    const allPresent: { [key: string]: AttendanceStatus } = {};
    students.forEach(student => {
      allPresent[student.id] = 'present';
    });
    setAttendanceRecords(allPresent);
    toast({ title: 'Tüm öğrenciler "Var" olarak işaretlendi.' });
  };

  const updateAttendance = async (currentDate: string, records: { [key: string]: AttendanceStatus }) => {
    const batch = writeBatch(db);

    Object.keys(records).forEach(studentId => {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newStatus = records[studentId];
      const studentRef = doc(db, 'students', studentId);
      const currentAttendance = student.attendance || [];
      const entryIndex = currentAttendance.findIndex(a => a.date === currentDate);
      
      let updatedAttendance;
      if (entryIndex > -1) {
        // Update existing entry
        updatedAttendance = [...currentAttendance];
        updatedAttendance[entryIndex] = { date: currentDate, status: newStatus };
      } else {
        // Add new entry
        updatedAttendance = [...currentAttendance, { date: currentDate, status: newStatus }];
      }
      
      batch.update(studentRef, { attendance: updatedAttendance });
    });

    await batch.commit();
  };


  const handleSave = async () => {
    if (Object.keys(attendanceRecords).length === 0) {
      toast({ variant: 'destructive', title: 'Kaydedilecek veri yok.' });
      return;
    }

    try {
      await updateAttendance(date, attendanceRecords);
      toast({ title: 'Yoklama kaydedildi!' });

      const currentlyAbsent = students.filter(s => attendanceRecords[s.id] === 'absent');
      if (currentlyAbsent.length > 0) {
        setAbsentStudents(currentlyAbsent);
        setShowSummary(true);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Yoklama kaydedilemedi.' });
    }
  };
  
  const getStatusButtonClass = (studentId: string, status: AttendanceStatus) => {
    const baseClass = "h-8 w-8";
    const isActive = attendanceRecords[studentId] === status;
    switch(status) {
        case 'present': return isActive ? 'text-white bg-green-500 hover:bg-green-600' : 'text-green-500';
        case 'absent': return isActive ? 'text-white bg-red-500 hover:bg-red-600' : 'text-red-500';
        case 'late': return isActive ? 'text-white bg-yellow-500 hover:bg-yellow-600' : 'text-yellow-500';
        case 'excused': return isActive ? 'text-white bg-blue-500 hover:bg-blue-600' : 'text-blue-500';
        default: return '';
    }
  };

  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Günlük Yoklama</CardTitle>
        <CardDescription>Tarih seçin ve öğrencilerin durumunu işaretleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <label htmlFor="attendance-date" className="font-medium text-sm">Tarih:</label>
            <Input
              id="attendance-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-fit"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllPresent}>Tümünü Var İşaretle</Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead className="text-center">Durum</TableHead>
              <TableHead className="text-right w-[120px]">Toplam Devamsızlık</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((student, index) => {
              const totalAbsence = student.attendance?.filter(a => a.status === 'absent').length || 0;
              return (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className={getStatusButtonClass(student.id, 'present')} onClick={() => handleStatusChange(student.id, 'present')}><CheckCircle /></Button>
                      <Button variant="ghost" size="icon" className={getStatusButtonClass(student.id, 'absent')} onClick={() => handleStatusChange(student.id, 'absent')}><XCircle /></Button>
                      <Button variant="ghost" size="icon" className={getStatusButtonClass(student.id, 'late')} onClick={() => handleStatusChange(student.id, 'late')}><Clock /></Button>
                      <Button variant="ghost" size="icon" className={getStatusButtonClass(student.id, 'excused')} onClick={() => handleStatusChange(student.id, 'excused')}><UserMinus /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">{totalAbsence}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Devamsızlık Özeti - {currentClass?.name} - {format(parseISO(date), 'dd.MM.yyyy')}</DialogTitle>
                    <DialogDescription>
                        Aşağıdaki öğrenciler "Yok" olarak işaretlendi.
                    </DialogDescription>
                </DialogHeader>
                <ul className="space-y-2 mt-4">
                    {absentStudents.map(s => (
                        <li key={s.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                           <XCircle className="h-5 w-5 text-red-500" />
                           <span className="font-medium">{s.name} ({s.number})</span>
                        </li>
                    ))}
                </ul>
            </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
