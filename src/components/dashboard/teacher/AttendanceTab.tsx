
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
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Save } from 'lucide-react';

interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
  onStudentsChange: (students: Student[]) => void;
}

export function AttendanceTab({ students, onStudentsChange }: AttendanceTabProps) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [attendanceStatus, setAttendanceStatus] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
    const [showOnlyAbsentees, setShowOnlyAbsentees] = useState(false);

    useEffect(() => {
        const newStatus: { [studentId: string]: 'present' | 'absent' | 'late' } = {};
        const dateString = date ? format(date, 'yyyy-MM-dd') : null;
        if(dateString) {
            students.forEach(student => {
                const record = student.attendance?.find(a => a.date === dateString);
                newStatus[student.id] = record?.status as 'absent' | 'late' | 'present' || 'present';
            });
        }
        setAttendanceStatus(newStatus);
        setShowOnlyAbsentees(false); // Reset filter when date changes
    }, [date, students]);

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendanceStatus(prev => ({
            ...prev,
            [studentId]: status
        }));
    };
    
    const handleSaveAttendance = async () => {
        if (!date || !db) return;
        const dateString = format(date, 'yyyy-MM-dd');
        const batch = writeBatch(db);
        const updatedStudents = students.map(student => {
            const studentRef = doc(db, 'students', student.id);
            const newStatus = attendanceStatus[student.id];
            const existingAttendance = student.attendance || [];
            
            let updatedAttendance = existingAttendance.filter(a => a.date !== dateString);
            
            if (newStatus && newStatus !== 'present') {
                updatedAttendance.push({ date: dateString, status: newStatus as 'absent' | 'late' | 'excused' });
            }

            batch.update(studentRef, { attendance: updatedAttendance });
            return {...student, attendance: updatedAttendance};
        });
        
        try {
            await batch.commit();
            onStudentsChange(updatedStudents); // Update local state
            toast({ title: 'Yoklama kaydedildi.' });
            setShowOnlyAbsentees(true);
        } catch(error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yoklama kaydedilemedi.' });
        }
    };

    const sortedStudents = useMemo(() => {
        const list = [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
        if (showOnlyAbsentees) {
            return list.filter(student => attendanceStatus[student.id] && attendanceStatus[student.id] !== 'present');
        }
        return list;
    }, [students, showOnlyAbsentees, attendanceStatus]);

    if (!students || students.length === 0) return <Card><CardHeader><CardTitle>Yoklama</CardTitle><CardDescription>Bu sınıfta öğrenci bulunmuyor.</CardDescription></CardHeader></Card>;

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
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                       <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Öğrenci Yoklama Listesi</CardTitle>
                                <CardDescription>
                                    {date ? format(date, 'dd MMMM yyyy, cccc', { locale: tr }) : 'Lütfen bir tarih seçin'}
                                </CardDescription>
                            </div>
                             {showOnlyAbsentees ? (
                                <Button variant="outline" onClick={() => setShowOnlyAbsentees(false)}>Tüm Listeyi Göster</Button>
                            ) : (
                                <Button onClick={handleSaveAttendance}><Save className="mr-2 h-4 w-4"/>Yoklamayı Kaydet</Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>Öğrenci Adı</TableHead>
                                    <TableHead className="text-center">Durum</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.number}</TableCell>
                                        <TableCell>{student.name}</TableCell>
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
