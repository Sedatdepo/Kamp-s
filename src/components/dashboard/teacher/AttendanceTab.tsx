'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class } from '@/lib/types';
import { doc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Save, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
  onStudentsChange: (students: Student[]) => void;
}

export function AttendanceTab({ students: initialStudents, onStudentsChange, currentClass }: AttendanceTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const [attendance, setAttendance] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' | 'excused' }>();
  const [isSaving, setIsSaving] = useState(false);

  const formattedDate = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);

  useEffect(() => {
    const newAttendance: { [studentId: string]: 'present' | 'absent' | 'late' | 'excused' } = {};
    initialStudents.forEach(student => {
      const record = student.attendance?.find(a => a.date === formattedDate);
      if (record) {
        newAttendance[student.id] = record.status;
      }
    });
    setAttendance(newAttendance);
  }, [selectedDate, initialStudents, formattedDate]);

  const sortedStudents = useMemo(() => 
    [...initialStudents].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true })), 
    [initialStudents]
  );
  
  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => {
      if (!prev) return { [studentId]: status };
      const currentStatus = prev[studentId];
      const newStatus = currentStatus === status ? undefined : status;
      const newAttendance = { ...prev };
      if (newStatus === undefined) {
        delete newAttendance[studentId];
      } else {
        newAttendance[studentId] = newStatus;
      }
      return newAttendance;
    });
  };

  const handleSave = async () => {
    if (!db) return;
    setIsSaving(true);
    const batch = writeBatch(db);

    sortedStudents.forEach(student => {
      const studentRef = doc(db, 'students', student.id);
      const newStatus = attendance?.[student.id];
      const existingAttendance = student.attendance || [];
      
      const otherDaysAttendance = existingAttendance.filter(a => a.date !== formattedDate);
      
      let finalAttendance = otherDaysAttendance;
      if (newStatus) {
        finalAttendance.push({ date: formattedDate, status: newStatus });
      }

      if (JSON.stringify(finalAttendance) !== JSON.stringify(existingAttendance)) {
        batch.update(studentRef, { attendance: finalAttendance });
      }
    });
    
    try {
      await batch.commit();
      toast({ title: 'Başarılı!', description: 'Yoklama durumu kaydedildi.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata!', description: `Kaydedilemedi: ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (!attendance) return { present: 0, absent: 0, late: 0, excused: 0, unmarked: sortedStudents.length, total: sortedStudents.length };
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    const excused = Object.values(attendance).filter(s => s === 'excused').length;
    const marked = present + absent + late + excused;
    return { present, absent, late, excused, unmarked: sortedStudents.length - marked, total: sortedStudents.length };
  }, [attendance, sortedStudents]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tarih Seçimi</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={tr}
              className="p-0"
              disabled={(date) => date > new Date()}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>İstatistikler</CardTitle>
            <CardDescription>{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Var:</span><span className="font-bold">{stats.present}</span></div>
            <div className="flex justify-between"><span>Yok:</span><span className="font-bold text-destructive">{stats.absent}</span></div>
            <div className="flex justify-between"><span>Geç:</span><span className="font-bold text-orange-500">{stats.late}</span></div>
            <div className="flex justify-between"><span>İzinli:</span><span className="font-bold text-blue-500">{stats.excused}</span></div>
            <div className="flex justify-between"><span>İşaretlenmedi:</span><span className="font-bold text-muted-foreground">{stats.unmarked}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2"><b>Toplam:</b><b>{stats.total}</b></div>
          </CardContent>
        </Card>
         <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Yoklamayı Kaydet
        </Button>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Yoklama Listesi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Ad Soyad</TableHead>
                      <TableHead className="text-center">Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStudents.map(student => {
                      const status = attendance?.[student.id];
                      return (
                        <TableRow key={student.id}>
                          <TableCell>{student.number}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="text-center">
                            {status === 'present' && <Badge variant="default" className="bg-green-500">Var</Badge>}
                            {status === 'absent' && <Badge variant="destructive">Yok</Badge>}
                            {status === 'late' && <Badge variant="default" className="bg-orange-500">Geç</Badge>}
                            {status === 'excused' && <Badge variant="secondary">İzinli</Badge>}
                            {!status && <Badge variant="outline">N/A</Badge>}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant={status === 'present' ? 'default' : 'outline'} size="sm" className="bg-green-500 hover:bg-green-600 text-white data-[state=checked]:bg-green-700" onClick={() => handleStatusChange(student.id, 'present')}>Geldi</Button>
                            <Button variant={status === 'late' ? 'default' : 'outline'} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white data-[state=checked]:bg-orange-700" onClick={() => handleStatusChange(student.id, 'late')}>Geç</Button>
                            <Button variant={status === 'absent' ? 'destructive' : 'outline'} size="sm" onClick={() => handleStatusChange(student.id, 'absent')}>Gelmedi</Button>
                            <Button variant={status === 'excused' ? 'secondary' : 'outline'} size="sm" onClick={() => handleStatusChange(student.id, 'excused')}>İzinli</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
