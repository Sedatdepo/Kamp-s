
"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Student, Message, Class, TeacherProfile } from '@/lib/types';
import { collection, query, where, doc, updateDoc, deleteDoc, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Trash2, MessageSquare, KeyRound, Send, FileText, ClipboardCopy, ClipboardPaste } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { exportStudentListToRtf } from '@/lib/word-export';
import { Badge } from '@/components/ui/badge';
import { StudentDetailModal } from './StudentDetailModal';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';

interface StudentListTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

function ChatModal({ student, teacherId }: { student: Student; teacherId: string }) {
    const [newMessage, setNewMessage] = useState('');
    
    const messagesQuery = useMemo(() => {
        return query(
            collection(db, 'messages'), 
            where('participants', 'array-contains', student.id)
        );
    }, [student.id]);

    const { data: messages, loading: messagesLoading } = useFirestore<Message>('messages', messagesQuery);

    const sortedMessages = useMemo(() => {
        if (!messages) return [];
        // Sort in client-side to avoid complex queries
        return [...messages].sort((a, b) => (a.timestamp?.toMillis() ?? 0) - (b.timestamp?.toMillis() ?? 0));
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        
        await addDoc(collection(db, 'messages'), {
            senderId: teacherId,
            receiverId: student.id,
            participants: [student.id, teacherId],
            text: newMessage,
            timestamp: Timestamp.now(),
            isRead: false,
        });
        setNewMessage('');
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Sohbet: {student.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-96">
                <ScrollArea className="flex-1 p-4 border rounded-md">
                    {messagesLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                        sortedMessages.map(msg => (
                            <div key={msg.id} className={`flex my-2 ${msg.senderId === teacherId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === teacherId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-70 text-right mt-1">{msg.timestamp ? format(msg.timestamp.toDate(), 'p') : ''}</p>
                                </div>
                            </div>
                        ))
                    )}
                     {sortedMessages.length === 0 && !messagesLoading && (
                        <p className="text-center text-muted-foreground text-sm">Henüz mesaj yok.</p>
                    )}
                </ScrollArea>
                <div className="flex mt-4 gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                    <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                </div>
            </div>
        </DialogContent>
    );
}

export function StudentListTab({ classId, teacherProfile, currentClass }: StudentListTabProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [bulkStudents, setBulkStudents] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isBulkGradeOpen, setIsBulkGradeOpen] = useState(false);

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${classId}`, studentsQuery);
  
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
  
  const unreadMessagesByStudent = useMemo(() => new Map<string, number>(), []);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.number.localeCompare(b.number, 'tr');
    });
  }, [students]);

  const handleExport = () => {
    if (currentClass && sortedStudents.length > 0) {
      exportStudentListToRtf({
        students: sortedStudents,
        currentClass,
        teacherProfile,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Dışa aktarılacak öğrenci bulunmuyor.',
      });
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim()) {
      toast({ variant: 'destructive', title: 'Ad ve numara boş olamaz.' });
      return;
    }
    await addDoc(collection(db, 'students'), {
      classId,
      name: newStudentName,
      number: newStudentNumber,
      needsPasswordChange: true,
      password: newStudentNumber, 
      risks: [],
      projectPreferences: [],
      assignedLesson: null,
      term1Grades: {},
      term2Grades: {},
      hasProject: false,
    });
    setNewStudentName('');
    setNewStudentNumber('');
    toast({ title: 'Öğrenci eklendi!' });
  };
  
  const handleBulkAdd = async () => {
    const lines = bulkStudents.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const studentsToAdd = lines.map(line => {
        const [number, ...nameParts] = line.trim().split(/\s+/);
        const name = nameParts.join(' ');
        return { number, name };
    }).filter(s => s.number && s.name);

    const batch = writeBatch(db);
    studentsToAdd.forEach(({name, number}) => {
        const studentRef = doc(collection(db, 'students'));
        batch.set(studentRef, {
            classId, name, number,
            needsPasswordChange: true, password: number,
            risks: [], projectPreferences: [], assignedLesson: null,
            term1Grades: {}, term2Grades: {}, hasProject: false,
        });
    });

    await batch.commit();

    setBulkStudents('');
    toast({ title: `${studentsToAdd.length} öğrenci eklendi!`});
  };

  const handleDeleteStudent = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    if(window.confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, 'students', studentId));
        toast({ title: 'Öğrenci silindi', variant: 'destructive' });
    }
  };
  
  const resetPassword = async (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    if(window.confirm(`${student.name} adlı öğrencinin şifresini okul numarası (${student.number}) olarak sıfırlamak istediğinize emin misiniz?`)) {
        await updateDoc(doc(db, 'students', student.id), {
            password: student.number,
            needsPasswordChange: true
        });
        toast({title: 'Şifre sıfırlandı!'})
    }
  }

  const copyClassCode = () => {
    if(currentClass?.code) {
      navigator.clipboard.writeText(currentClass.code);
      toast({ title: 'Sınıf Kodu Kopyalandı!' });
    }
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">Öğrenci Listesi</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <CardDescription>Sınıf Kodu:</CardDescription>
                  <Badge variant="secondary" className="text-base font-mono tracking-widest cursor-pointer" onClick={copyClassCode}>
                    {currentClass?.code}
                    <ClipboardCopy className="ml-2 h-3 w-3" />
                  </Badge>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                    <FileText className="mr-2 h-4 w-4" />
                    Listeyi Dışa Aktar
                </Button>
                <Button variant="outline" onClick={() => setIsBulkGradeOpen(true)}>
                  <ClipboardPaste className="mr-2 h-4 w-4" />Toplu Not Girişi
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2 h-4 w-4" />Toplu Öğrenci Ekle</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Öğrencileri Toplu Ekle</DialogTitle>
                            <DialogDescription>
                                Her satıra bir öğrenci gelecek şekilde yapıştırın. Format: Okul Numarası Ad Soyad.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea value={bulkStudents} onChange={e => setBulkStudents(e.target.value)} placeholder="123 Ahmet Yılmaz\n456 Ayşe Kaya" className="h-48" />
                        <DialogClose asChild><Button onClick={handleBulkAdd}>Öğrencileri Ekle</Button></DialogClose>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {studentsLoading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Input value={newStudentNumber} onChange={e => setNewStudentNumber(e.target.value)} placeholder="No" className="h-8 w-20"/></TableCell>
                <TableCell><Input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Yeni Öğrenci Adı" className="h-8" /></TableCell>
                <TableCell className="text-right"><Button size="sm" onClick={handleAddStudent}>Ekle</Button></TableCell>
              </TableRow>
              {sortedStudents.length > 0 ? sortedStudents.map(student => (
                <TableRow key={student.id} className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <TableCell className="font-medium">{student.number}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex relative z-10">
                        <Dialog>
                            {appUser?.type === 'teacher' && <ChatModal student={student} teacherId={appUser.data.uid} />}
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative" onClick={(e) => { e.stopPropagation(); }}>
                                    <MessageSquare className="h-4 w-4"/>
                                    {unreadMessagesByStudent.has(student.id) && (
                                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                                    )}
                                </Button>
                            </DialogTrigger>
                        </Dialog>
                        <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); resetPassword(e, student); }}><KeyRound className="h-4 w-4"/></Button>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteStudent(e, student.id); }}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">Bu sınıfta henüz öğrenci yok.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
    {selectedStudent && teacherProfile && (
        <StudentDetailModal 
            student={selectedStudent}
            teacherProfile={teacherProfile}
            currentClass={currentClass}
            isOpen={!!selectedStudent}
            setIsOpen={(isOpen) => !isOpen && setSelectedStudent(null)}
        />
    )}
    <BulkGradeEntryDialog 
        isOpen={isBulkGradeOpen}
        setIsOpen={setIsBulkGradeOpen}
        students={sortedStudents}
    />
    </>
  );
}
