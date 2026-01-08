
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class } from '@/lib/types';
import { doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Save } from 'lucide-react';

interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
}

export function AttendanceTab({ students, currentClass }: AttendanceTabProps) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [attendanceStatus, setAttendanceStatus] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' | 'excused' }>({});
    
    useEffect(() => {
        const dateString = date ? format(date, 'yyyy-MM-dd') : null;
        if (!dateString) return;

        const initialStatus: { [studentId: string]: 'present' | 'absent' | 'late' | 'excused' } = {};
        students.forEach(student => {
            const record = student.attendance?.find(a => a.date === dateString);
            initialStatus[student.id] = record?.status || 'present';
        });
        setAttendanceStatus(initialStatus);

    }, [date, students]);

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
        setAttendanceStatus(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveAttendance = async () => {
        if (!date || !db) return;
        const dateString = format(date, 'yyyy-MM-dd');
        const batch = writeBatch(db);

        students.forEach(student => {
            const studentRef = doc(db, 'students', student.id);
            const newStatus = attendanceStatus[student.id];
            const existingAttendance = student.attendance || [];
            
            let updatedAttendance = existingAttendance.filter(a => a.date !== dateString);
            
            if (newStatus && newStatus !== 'present') {
                updatedAttendance.push({ date: dateString, status: newStatus });
            }

            batch.update(studentRef, { attendance: updatedAttendance });
        });
        
        try {
            await batch.commit();
            toast({ title: 'Yoklama kaydedildi.' });
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yoklama kaydedilemedi.' });
        }
    };
    
    const sortedStudents = useMemo(() => {
      if (!students) return [];
      return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
    }, [students]);

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Tarih Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                            locale={tr}
                        />
                         <Button onClick={handleSaveAttendance} className="w-full mt-4"><Save className="mr-2 h-4 w-4"/>Yoklamayı Kaydet</Button>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Öğrenci Yoklama Listesi</CardTitle>
                        <CardDescription>
                            {date ? format(date, 'dd MMMM yyyy, cccc', { locale: tr }) : 'Lütfen bir tarih seçin'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead className="text-center">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                        <TableCell>
                                            <RadioGroup
                                                value={attendanceStatus[student.id] || 'present'}
                                                onValueChange={(status) => handleStatusChange(student.id, status as any)}
                                                className="flex justify-center gap-4"
                                                disabled={!date}
                                            >
                                                <Label className="flex items-center gap-1.5 cursor-pointer text-green-600"><RadioGroupItem value="present" />Geldi</Label>
                                                <Label className="flex items-center gap-1.5 cursor-pointer text-red-600"><RadioGroupItem value="absent" />Gelmedi</Label>
                                                <Label className="flex items-center gap-1.5 cursor-pointer text-orange-600"><RadioGroupItem value="late" />Geç</Label>
                                                <Label className="flex items-center gap-1.5 cursor-pointer text-blue-600"><RadioGroupItem value="excused" />İzinli</Label>
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
