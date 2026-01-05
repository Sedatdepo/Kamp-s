
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Users, Calendar as CalendarIcon, Shuffle } from 'lucide-react';
import { Student, Class, RosterItem } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function DutyRosterTab({ students: initialStudents, currentClass, db }: { students: Student[], currentClass: Class | null, db: any }) {
    const { toast } = useToast();
    const [students, setStudents] = useState(initialStudents);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [numberOfWeeks, setNumberOfWeeks] = useState(4);
    const [studentsPerDuty, setStudentsPerDuty] = useState(2);
    
    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);

    const handleShuffle = () => {
        setStudents(prev => [...prev].sort(() => Math.random() - 0.5));
        toast({ title: "Liste Karıştırıldı", description: "Öğrenci listesi nöbet için rastgele sıralandı." });
    };

    const handleGenerateRoster = async () => {
        if (!db || !currentClass || !startDate || students.length === 0) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen başlangıç tarihi ve öğrenci listesi olduğundan emin olun.' });
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
                const student = students[studentIndex % students.length];
                if (student) { dutyStudents.push(student); dutyStudentIds.push(student.id); }
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
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!startDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", {locale: tr}) : <span>Tarih seçin</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={tr} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2"><Label>Hafta Sayısı</Label><Input type="number" value={numberOfWeeks} onChange={e => setNumberOfWeeks(Number(e.target.value))} /></div>
                        <div className="space-y-2"><Label>Günlük Öğrenci Sayısı</Label><Select value={String(studentsPerDuty)} onValueChange={v => setStudentsPerDuty(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select></div>
                        <div className="flex gap-2 pt-4 border-t">
                            <Button onClick={handleShuffle} variant="outline" className="w-full"><Shuffle className="mr-2 h-4 w-4"/>Listeyi Karıştır</Button>
                            <Button onClick={handleGenerateRoster} className="w-full">Oluştur</Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Nöbetçi Öğrenci Sırası</CardTitle></CardHeader>
                    <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                        <ol className="list-decimal list-inside">
                           {students.map(s => (<li key={s.id} className="text-sm p-1">{s.name}</li>))}
                        </ol>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader><CardTitle>Nöbet Listesi Önizlemesi</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Gün</TableHead><TableHead>Nöbetçi Öğrenciler</TableHead></TableRow></TableHeader>
                            <TableBody>{(currentClass.dutyRoster || []).map((item, idx) => (<TableRow key={idx}><TableCell>{item.date}</TableCell><TableCell>{item.day}</TableCell><TableCell>{item.student}</TableCell></TableRow>))}</TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
