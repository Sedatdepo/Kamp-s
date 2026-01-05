"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, Grid, ClipboardList, UserPlus, Trash2, Edit, Save, X, Upload, QrCode } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Student, Class, TeacherProfile, RosterItem } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, addDoc, updateDoc, deleteDoc, collection, writeBatch, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudentDetailModal } from './StudentDetailModal';
import { ClassInviteDialog } from './ClassInviteDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// --- STUDENT LIST COMPONENT ---
function StudentList({ classId, students, currentClass, teacherProfile }: { classId: string, students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
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
    return [...students].sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [students]);

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim() || !db) return;
    try {
      await addDoc(collection(db, 'students'), {
        name: newStudentName,
        number: newStudentNumber,
        classId: classId,
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        behaviorScore: 100,
      });
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
            studentsToAdd.forEach(student => {
                const newStudentRef = doc(collection(db, 'students'));
                batch.set(newStudentRef, { ...student, classId: classId, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100 });
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
                    <QrCode className="mr-2 h-4 w-4"/> Davet Et
                </Button>
                <Button variant="outline" asChild>
                    <label htmlFor="student-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4"/> Excel'den Aktar
                    </label>
                </Button>
                <input id="student-upload" type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload}/>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Okul No</TableHead>
                <TableHead>Adı Soyadı</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map(student => (
                editingStudent?.id === student.id ? (
                  <TableRow key={student.id}>
                    <TableCell><Input value={editingStudent.number} onChange={(e) => setEditingStudent({...editingStudent, number: e.target.value})} /></TableCell>
                    <TableCell><Input value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" onClick={handleUpdateStudent} className="mr-2"><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingStudent(null)}><X className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={student.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenDetailModal(student)}>
                    <TableCell>{student.number}</TableCell>
                    <TableCell>{student.name}</TableCell>
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

// --- ATTENDANCE TAB COMPONENT ---
function AttendanceTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const { db } = useAuth();
    const { toast } = useToast();

    const handleStatusChange = async (studentId: string, newStatus: 'present' | 'absent' | 'late' | 'excused') => {
        if (!date || !db) return;
        const studentRef = doc(db, 'students', studentId);
        const dateString = format(date, 'yyyy-MM-dd');
        const student = students.find(s => s.id === studentId);
        const existingAttendance = student?.attendance?.find(a => a.date === dateString);

        try {
            let updatedAttendance = student?.attendance ? [...student.attendance] : [];
            if (existingAttendance) {
                updatedAttendance = updatedAttendance.filter(a => a.date !== dateString);
            }
            updatedAttendance.push({ date: dateString, status: newStatus });
            
            await updateDoc(studentRef, { attendance: updatedAttendance });
            toast({ title: 'Yoklama kaydedildi.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yoklama kaydedilemedi.' });
        }
    };

    const getStudentStatusForDate = (student: Student, selectedDate: Date): 'present' | 'absent' | 'late' | 'excused' => {
        if (!student.attendance) return 'present';
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        return student.attendance.find(a => a.date === dateString)?.status || 'present';
    };

    if (!students || students.length === 0) return <Card><CardHeader><CardTitle>Yoklama</CardTitle><CardDescription>Bu sınıfta öğrenci bulunmuyor.</CardDescription></CardHeader></Card>;

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1"><Card><CardHeader><CardTitle>Tarih Seçimi</CardTitle></CardHeader><CardContent><CalendarPicker mode="single" selected={date} onSelect={setDate} className="rounded-md border" locale={tr} /></CardContent></Card></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Öğrenci Yoklama Listesi</CardTitle><CardDescription>{date ? format(date, 'dd MMMM yyyy, cccc', { locale: tr }) : 'Tarih seçin'}</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Öğrenci Adı</TableHead><TableHead>Durum</TableHead></TableRow></TableHeader><TableBody>{students.map(student => (<TableRow key={student.id}><TableCell>{student.name}</TableCell><TableCell><RadioGroup defaultValue="present" value={date ? getStudentStatusForDate(student, date) : 'present'} onValueChange={(status) => handleStatusChange(student.id, status as any)} className="flex gap-4" disabled={!date}><Label className="flex items-center gap-2 cursor-pointer text-green-600"><RadioGroupItem value="present" />Geldi</Label><Label className="flex items-center gap-2 cursor-pointer text-red-600"><RadioGroupItem value="absent" />Gelmedi</Label><Label className="flex items-center gap-2 cursor-pointer text-orange-600"><RadioGroupItem value="late" />Geç</Label><Label className="flex items-center gap-2 cursor-pointer text-blue-600"><RadioGroupItem value="excused" />İzinli</Label></RadioGroup></TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>
        </div>
    );
}

// --- DUTY ROSTER TAB COMPONENT ---
function DutyRosterTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [numberOfWeeks, setNumberOfWeeks] = useState(4);
    const [studentsPerDuty, setStudentsPerDuty] = useState(2);

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
            <div className="md:col-span-1 space-y-6"><Card><CardHeader><CardTitle>Ayarlar</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Başlangıç Tarihi</Label><CalendarPicker mode="single" selected={startDate} onSelect={setStartDate} className="rounded-md border" locale={tr} /></div><div className="space-y-2"><Label>Hafta Sayısı</Label><Input type="number" value={numberOfWeeks} onChange={e => setNumberOfWeeks(Number(e.target.value))} /></div><div className="space-y-2"><Label>Günlük Öğrenci Sayısı</Label><Select value={String(studentsPerDuty)} onValueChange={v => setStudentsPerDuty(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1</SelectItem><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem></SelectContent></Select></div></CardContent></Card><Card><CardHeader><CardTitle>Öğrenci Seçimi</CardTitle></CardHeader><CardContent className="space-y-2 max-h-60 overflow-y-auto">{students.map(s => (<div key={s.id} className="flex items-center gap-2"><Checkbox id={`roster-${s.id}`} checked={selectedStudents.includes(s.id)} onCheckedChange={(checked) => { setSelectedStudents(prev => checked ? [...prev, s.id] : prev.filter(id => id !== s.id)); }} /><Label htmlFor={`roster-${s.id}`}>{s.name}</Label></div>))}</CardContent></Card><Button onClick={handleGenerateRoster}>Nöbet Listesini Oluştur</Button></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Nöbet Listesi Önizlemesi</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Gün</TableHead><TableHead>Nöbetçi Öğrenciler</TableHead></TableRow></TableHeader><TableBody>{(currentClass.dutyRoster || []).map((item, idx) => (<TableRow key={idx}><TableCell>{item.date}</TableCell><TableCell>{item.day}</TableCell><TableCell>{item.student}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>
        </div>
    );
}

// --- SEATING PLAN TAB COMPONENT ---
function SeatingPlanTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [rowCount, setRowCount] = useState(currentClass?.seatingPlanRows || 4);
    const [colCount, setColCount] = useState(currentClass?.seatingPlanCols || 3);
    const [seatingPlan, setSeatingPlan] = useState<{ [key: string]: string }>(currentClass?.seatingPlan || {});

    const handleSavePlan = async () => {
        if (!db || !currentClass) return;
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { seatingPlan: seatingPlan, seatingPlanRows: rowCount, seatingPlanCols: colCount });
            toast({ title: 'Oturma planı kaydedildi!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Hata', description: 'Plan kaydedilemedi.' }); }
    };
    const handleSeatChange = (key: string, studentId: string) => {
        const newPlan = { ...seatingPlan };
        Object.keys(newPlan).forEach(k => { if (newPlan[k] === studentId) { delete newPlan[k]; } });
        if (studentId === "empty") { delete newPlan[key]; } else { newPlan[key] = studentId; }
        setSeatingPlan(newPlan);
    };

    if (!students) return <p>Öğrenci verisi yükleniyor...</p>;
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6"><Card><CardHeader><CardTitle>Plan Ayarları</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Sıra Sayısı (Dikey)</Label><Input type="number" value={rowCount} onChange={e => setRowCount(Number(e.target.value))} /></div><div className="space-y-2"><Label>Sütun Sayısı (Yatay)</Label><Input type="number" value={colCount} onChange={e => setColCount(Number(e.target.value))} /></div><Button onClick={handleSavePlan} className="w-full">Değişiklikleri Kaydet</Button></CardContent></Card></div>
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Sınıf Oturma Planı</CardTitle></CardHeader><CardContent className="flex flex-col"><div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md"><span className="font-bold tracking-widest text-lg">TAHTA</span></div><div className="flex-1 flex justify-center items-start overflow-x-auto p-4"><div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)` }}>{Array.from({ length: rowCount }).map((_, r) => Array.from({ length: colCount }).map((_, c) => (<div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">{[0, 1].map((side) => { const key = `${r}-${c}-${side}`; const selectedStudentId = seatingPlan[key]; return (<div key={key} className="flex-1"><Select value={selectedStudentId || "empty"} onValueChange={(studentId) => handleSeatChange(key, studentId)}><SelectTrigger className="h-full bg-background border-primary/20 shadow-sm text-xs p-1"><SelectValue placeholder="Boş" /></SelectTrigger><SelectContent><SelectItem value="empty">Boş</SelectItem>{students.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>); })}</div>)))}</div></div></CardContent></Card></div>
        </div>
    );
}


// --- MAIN MANAGEMENT TAB COMPONENT ---
interface StudentManagementTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function StudentManagementTab({ students, currentClass, teacherProfile }: StudentManagementTabProps) {
  return (
    <Tabs defaultValue="student-list">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="student-list"><Users className="mr-2 h-4 w-4" />Öğrenci Listesi</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="mr-2 h-4 w-4" />Yoklama</TabsTrigger>
          <TabsTrigger value="duty-roster"><ClipboardList className="mr-2 h-4 w-4" />Nöbet Listesi</TabsTrigger>
          <TabsTrigger value="seating-plan"><Grid className="mr-2 h-4 w-4" />Oturma Planı</TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="student-list" className="mt-4">
        {currentClass && <StudentList classId={currentClass.id} students={students} currentClass={currentClass} teacherProfile={teacherProfile} />}
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceTab students={students} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="duty-roster" className="mt-4">
        <DutyRosterTab students={students} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="seating-plan" className="mt-4">
        <SeatingPlanTab students={students} currentClass={currentClass} />
      </TabsContent>
    </Tabs>
  );
}