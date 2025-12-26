
"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Student, Message } from '@/lib/types';
import { collection, query, where, doc, updateDoc, deleteDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Trash2, MessageSquare, KeyRound, Plus, Minus, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';

interface StudentListTabProps {
  classId: string;
}

function ChatModal({ student, teacherId }: { student: Student; teacherId: string }) {
    const [newMessage, setNewMessage] = useState('');
    
    const messagesQuery = useMemo(() => {
        const participants = [student.id, teacherId].sort();
        return query(
            collection(db, 'messages'), 
            where('participants', '==', participants),
            orderBy('timestamp', 'asc')
        );
    }, [student.id, teacherId]);

    const { data: messages, loading: messagesLoading } = useFirestore<Message>('messages', messagesQuery);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        const participants = [student.id, teacherId].sort();
        await addDoc(collection(db, 'messages'), {
            senderId: teacherId,
            receiverId: student.id,
            participants: participants,
            text: newMessage,
            timestamp: Timestamp.now()
        });
        setNewMessage('');
    };

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Sohbet: {student.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-96">
                <div className="flex-1 p-4 border rounded-md overflow-y-auto">
                    {messagesLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex my-2 ${msg.senderId === teacherId ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === teacherId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="flex mt-4 gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                    <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                </div>
            </div>
        </DialogContent>
    );
}

export function StudentListTab({ classId }: StudentListTabProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [bulkStudents, setBulkStudents] = useState('');

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim()) {
      toast({ variant: 'destructive', title: 'Ad ve numara boş olamaz.' });
      return;
    }
    await addDoc(collection(db, 'students'), {
      classId,
      name: newStudentName,
      number: newStudentNumber,
      behaviorScore: 100,
      needsPasswordChange: true,
      password: newStudentNumber, // Initial password is the student number
      risks: [],
      projectPreferences: [],
      assignedLesson: null,
      grades: { term1: null, term2: null },
      referrals: [],
    });
    setNewStudentName('');
    setNewStudentNumber('');
    toast({ title: 'Öğrenci eklendi!' });
  };
  
  const handleBulkAdd = async () => {
    const lines = bulkStudents.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    for (const line of lines) {
        const [number, ...nameParts] = line.split(/\s+/);
        const name = nameParts.join(' ');
        if(number && name) {
            await addDoc(collection(db, 'students'), {
                classId, name, number,
                behaviorScore: 100, needsPasswordChange: true, password: number,
                risks: [], projectPreferences: [], assignedLesson: null, grades: { term1: null, term2: null }, referrals: [],
            });
        }
    }
    setBulkStudents('');
    toast({ title: `${lines.length} öğrenci eklendi!`});
  };

  const handleDeleteStudent = async (studentId: string) => {
    if(window.confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) {
        await deleteDoc(doc(db, 'students', studentId));
        toast({ title: 'Öğrenci silindi', variant: 'destructive' });
    }
  };
  
  const handleScoreChange = async (studentId: string, amount: number) => {
    const student = students.find(s => s.id === studentId);
    if(!student) return;
    const newScore = student.behaviorScore + amount;
    await updateDoc(doc(db, 'students', studentId), { behaviorScore: newScore });
  };

  const resetPassword = async (student: Student) => {
    if(window.confirm(`${student.name} adlı öğrencinin şifresini okul numarası (${student.number}) olarak sıfırlamak istediğinize emin misiniz?`)) {
        await updateDoc(doc(db, 'students', student.id), {
            password: student.number,
            needsPasswordChange: true
        });
        toast({title: 'Şifre sıfırlandı!'})
    }
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">Öğrenci Listesi</CardTitle>
                <CardDescription>Sınıftaki öğrencileri yönetin, puanlarını takip edin ve onlarla iletişim kurun.</CardDescription>
            </div>
            <Dialog>
                <DialogTrigger asChild>
                    <Button><UserPlus className="mr-2 h-4 w-4" />Toplu Ekle</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader><DialogTitle>Öğrencileri Toplu Ekle</DialogTitle></DialogHeader>
                    <Textarea value={bulkStudents} onChange={e => setBulkStudents(e.target.value)} placeholder="Her satıra bir öğrenci gelecek şekilde yapıştırın. Örn:&#10;123 Ahmet Yılmaz&#10;456 Ayşe Kaya" className="h-48" />
                    <DialogClose asChild><Button onClick={handleBulkAdd}>Öğrencileri Ekle</Button></DialogClose>
                </DialogContent>
            </Dialog>
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
                <TableHead>Davranış P.</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell><Input value={newStudentNumber} onChange={e => setNewStudentNumber(e.target.value)} placeholder="No" className="h-8 w-20"/></TableCell>
                <TableCell><Input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="Yeni Öğrenci Adı" className="h-8" /></TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right"><Button size="sm" onClick={handleAddStudent}>Ekle</Button></TableCell>
              </TableRow>
              {students.length > 0 ? students.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.number}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScoreChange(student.id, -5)}><Minus className="h-4 w-4"/></Button>
                        <span className="font-bold text-lg">{student.behaviorScore}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleScoreChange(student.id, 5)}><Plus className="h-4 w-4"/></Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                        {appUser?.type === 'teacher' && <ChatModal student={student} teacherId={appUser.data.uid} />}
                        <DialogTrigger asChild><Button variant="ghost" size="icon"><MessageSquare className="h-4 w-4"/></Button></DialogTrigger>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => resetPassword(student)}><KeyRound className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteStudent(student.id)}><Trash2 className="h-4 w-4"/></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">Bu sınıfta henüz öğrenci yok.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
