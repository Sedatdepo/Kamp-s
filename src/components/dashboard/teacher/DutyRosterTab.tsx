
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Student, Class, RosterItem, TeacherProfile } from '@/lib/types';
import { doc, updateDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DutyRosterTabProps {
    students: Student[];
    currentClass: Class | null;
    teacherProfile: TeacherProfile | null;
    db: any; // Assuming db object is passed from parent
}

export function DutyRosterTab({ students, currentClass, teacherProfile, db }: DutyRosterTabProps) {
    const { toast } = useToast();
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [numberOfWeeks, setNumberOfWeeks] = useState(4);
    const [studentsPerDuty, setStudentsPerDuty] = useState(2);

    const sortedStudents = useMemo(() => {
        if (!students) return [];
        return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
    }, [students]);

    const handleGenerateRoster = async () => {
        if (!db || !currentClass || !startDate || selectedStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen başlangıç tarihi ve en az bir öğrenci seçin.' });
            return;
        }
        const roster: RosterItem[] = [];
        let currentDate = new Date(startDate);
        let studentIndex = 0;
        for (let i = 0; i < numberOfWeeks * 5; i++) {
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) { currentDate = addDays(currentDate, 1); i--; continue; }
            const dutyStudents: Student[] = [];
            const dutyStudentIds: string[] = [];
            for (let j = 0; j < studentsPerDuty; j++) {
                const studentId = selectedStudents[studentIndex % selectedStudents.length];
                const student = students.find(s => s.id === studentId);
                if (student) { dutyStudents.push(student); dutyStudentIds.push(studentId); }
                studentIndex++;
            }
            roster.push({ date: format(currentDate, 'dd.MM.yyyy'), day: format(currentDate, 'cccc', { locale: tr }), student: dutyStudents.map(s => s.name).join(' - '), studentIds: dutyStudentIds });
            currentDate = addDays(currentDate, 1);
        }
        try {
            const classRef = doc(db, 'classes', currentClass.id);
            await updateDoc(classRef, { dutyRoster: roster });
            toast({ title: 'Nöbet Listesi Oluşturuldu!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Hata', description: 'Liste güncellenemedi.' }); }
    };
    
    if (!currentClass) return <p>Sınıf bilgisi yüklenemedi.</p>;
    
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Ayarlar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Başlangıç Tarihi</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "PPP", {locale: tr}) : <span>Tarih seçin</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    locale={tr}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2"><Label>Hafta Sayısı</Label><Input type="number" value={numberOfWeeks} onChange={e => setNumberOfWeeks(Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Günlük Öğrenci Sayısı</Label><Select value={String(studentsPerDuty)} onValueChange={v => setStudentsPerDuty(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Öğrenci Seçimi</CardTitle></CardHeader>
                    <CardContent className="space-y-2 max-h-60 overflow-y-auto">{sortedStudents.map(s => (<div key={s.id} className="flex items-center gap-2"><Checkbox id={`roster-${s.id}`} checked={selectedStudents.includes(s.id)} onCheckedChange={(checked) => { setSelectedStudents(prev => checked ? [...prev, s.id] : prev.filter(id => id !== s.id)); }} /><Label htmlFor={`roster-${s.id}`}>{s.name} ({s.number})</Label></div>))}</CardContent>
                </Card>
                <Button onClick={handleGenerateRoster}>Nöbet Listesini Oluştur</Button>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader><CardTitle>Nöbet Listesi Önizlemesi</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Gün</TableHead><TableHead>Nöbetçi Öğrenciler</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {(currentClass.dutyRoster || []).map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.day}</TableCell>
                                        <TableCell>{item.student}</TableCell>
                                    </TableRow>
                                ))}
                                {(currentClass.dutyRoster || []).length === 0 && (
                                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Liste oluşturulmadı.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

