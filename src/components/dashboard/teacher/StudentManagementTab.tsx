

"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar as CalendarIconLucide, Grid, ClipboardList, UserPlus, Trash2, Edit, Save, X, Upload, QrCode, Gauge, Loader2, ClipboardPaste } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Student, Class, TeacherProfile, RosterItem, GradingScores } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, addDoc, updateDoc, deleteDoc, collection, writeBatch, query, where, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { useCollection, useMemoFirebase } from '@/firebase';


type GradeField = 'exam1' | 'exam2' | 'perf1' | 'perf2' | 'projectGrade';
type TermKey = 'term1Grades' | 'term2Grades';

function StudentList({ students, onStudentsChange, currentClass, teacherProfile }: { students: Student[], onStudentsChange: (students: Student[]) => void, currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
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
    if (!newStudentName.trim() || !newStudentNumber.trim() || !db || !currentClass) return;
    try {
      const newStudentData: Omit<Student, 'id'> = {
        name: newStudentName,
        number: newStudentNumber,
        classId: currentClass.id,
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        behaviorScore: 100,
        hasProject: false,
      };
      const docRef = await addDoc(collection(db, 'students'), newStudentData);
      onStudentsChange([...students, {id: docRef.id, ...newStudentData}]);
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
    if (!file || !db || !currentClass) return;

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
                const newStudentData = { ...student, classId: currentClass.id, risks: [], projectPreferences: [], assignedLesson: null, term1Grades: {}, term2Grades: {}, behaviorScore: 100, hasProject: false };
                batch.set(newStudentRef, newStudentData);
                newStudentsForState.push({ id: newStudentRef.id, ...newStudentData});
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
                <TableHead className="w-[120px]">Proje Ödevi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map(student => (
                editingStudent?.id === student.id ? (
                  <TableRow key={student.id}>
                    <TableCell><Input value={editingStudent.number} onChange={(e) => setEditingStudent({...editingStudent, number: e.target.value})} /></TableCell>
                    <TableCell><Input value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={editingStudent.hasProject} onCheckedChange={(checked) => setEditingStudent({...editingStudent, hasProject: !!checked})}/></TableCell>
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

function AttendanceTab({ students, onStudentsChange }: { students: Student[], onStudentsChange: (students: Student[]) => void }) {
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
            <div className="md:col-span-1"><Card><CardHeader><CardTitle>Tarih Seçimi</CardTitle></CardHeader><CardContent><Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" locale={tr} /></CardContent></Card></div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Öğrenci Yoklama Listesi</CardTitle>
                                <CardDescription>{date ? format(date, 'dd MMMM yyyy, cccc', { locale: tr }) : 'Tarih seçin'}</CardDescription>
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
                            <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Öğrenci Adı</TableHead><TableHead className="text-center">Durum</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {sortedStudents.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.number}</TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>
                                            <RadioGroup value={attendanceStatus[student.id] || 'present'} onValueChange={(status) => handleStatusChange(student.id, status as any)} className="flex justify-center gap-4" disabled={!date}>
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

function DutyRosterTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { db } = useAuth();
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
                                    className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIconLucide className="mr-2 h-4 w-4" />
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
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Nöbet Listesi Önizlemesi</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Gün</TableHead><TableHead>Nöbetçi Öğrenciler</TableHead></TableRow></TableHeader><TableBody>{(currentClass.dutyRoster || []).map((item, idx) => (<TableRow key={idx}><TableCell>{item.date}</TableCell><TableCell>{item.day}</TableCell><TableCell>{item.student}</TableCell></TableRow>))}</TableBody></Table></CardContent></Card></div>
        </div>
    );
}

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
            <div className="md:col-span-2"><Card><CardHeader><CardTitle>Sınıf Oturma Planı</CardTitle></CardHeader><CardContent className="flex flex-col"><div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md"><span className="font-bold tracking-widest text-lg">TAHTA</span></div><div className="flex-1 flex justify-center items-start overflow-x-auto p-4"><div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)` }}>{Array.from({ length: rowCount }).map((_, r) => Array.from({ length: colCount }).map((_, c) => (<div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">{[0, 1].map((side) => { const key = `${r}-${c}-${side}`; const selectedStudentId = seatingPlan[key]; return (<div key={key} className="flex-1"><Select value={selectedStudentId || "empty"} onValueChange={(studentId) => handleSeatChange(key, studentId)}><SelectTrigger className="h-full bg-background border-primary/20 shadow-sm text-xs p-1"><SelectValue placeholder="Boş" /></SelectTrigger><SelectContent><SelectItem value="empty">Boş</SelectItem>{students.map(s => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.number})</SelectItem>))}</SelectContent></Select></div>); })}</div>)))}</div></div></CardContent></Card></div>
        </div>
    );
}

// --- MAIN MANAGEMENT TAB COMPONENT ---
interface StudentManagementTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function StudentManagementTab({ currentClass, teacherProfile, ...props }: StudentManagementTabProps) {
  const [localStudents, setLocalStudents] = useState<Student[]>(props.students);
  const studentsLoading = !localStudents;

  useEffect(() => {
    setLocalStudents(props.students);
  }, [props.students]);
  
  if (studentsLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }
  
  if (!currentClass) {
    return <Card><CardHeader><CardTitle>Lütfen bir sınıf seçin.</CardTitle></CardHeader></Card>;
  }

  return (
    <Tabs defaultValue="student-list">
      <ScrollArea className="w-full whitespace-nowrap rounded-lg">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="student-list"><Users className="mr-2 h-4 w-4" />Öğrenci Listesi</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarIconLucide className="mr-2 h-4 w-4" />Yoklama</TabsTrigger>
          <TabsTrigger value="duty-roster"><ClipboardList className="mr-2 h-4 w-4" />Nöbet Listesi</TabsTrigger>
          <TabsTrigger value="seating-plan"><Grid className="mr-2 h-4 w-4" />Oturma Planı</TabsTrigger>
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <TabsContent value="student-list" className="mt-4">
        <StudentList students={localStudents} onStudentsChange={setLocalStudents} currentClass={currentClass} teacherProfile={teacherProfile} />
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceTab students={localStudents} onStudentsChange={setLocalStudents} />
      </TabsContent>
      <TabsContent value="duty-roster" className="mt-4">
        <DutyRosterTab students={localStudents} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="seating-plan" className="mt-4">
        <SeatingPlanTab students={localStudents} currentClass={currentClass} />
      </TabsContent>
    </Tabs>
  );
}
