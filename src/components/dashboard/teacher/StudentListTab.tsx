
"use client";

import { useState, useMemo, useRef } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Student, Message, Class, TeacherProfile, InfoForm, RiskFactor } from '@/lib/types';
import { collection, query, where, doc, updateDoc, deleteDoc, addDoc, Timestamp, writeBatch, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Trash2, MessageSquare, KeyRound, Send, FileText, ClipboardCopy, Link as LinkIcon, FileDown, Paperclip, Download, ClipboardPaste } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { exportStudentListToRtf, exportStudentDevelopmentReportToRtf } from '@/lib/word-export';
import { Badge } from '@/components/ui/badge';
import { StudentDetailModal } from './StudentDetailModal';
import { BulkGradeEntryDialog } from './BulkGradeEntryDialog';
import { ClassInviteDialog } from './ClassInviteDialog';

interface StudentListTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

function ChatModal({ student, teacherId }: { student: Student; teacherId: string }) {
    const { db, storage } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const messagesQuery = useMemo(() => {
        if (!db) return null;
        return query(
            collection(db, 'messages'),
            where('participants', 'array-contains', student.id)
        );
    }, [student.id, db]);

    const { data: messages, loading: messagesLoading } = useFirestore<Message>(`messages-for-student-${student.id}`, messagesQuery);

    const sortedMessages = useMemo(() => {
        if (!messages) return [];
        return [...messages].sort((a, b) => (a.timestamp?.toMillis() ?? 0) - (b.timestamp?.toMillis() ?? 0));
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !file) return;
        if (!db || !storage) {
            toast({ variant: "destructive", title: "Hata", description: "Mesaj gönderilemedi. Veritabanı bağlantısı kurulamadı." });
            return;
        }

        setIsUploading(true);
        let fileData: Message['file'] | undefined = undefined;

        if (file) {
            try {
                const storageRef = ref(storage, `chat_files/${teacherId}/${student.id}/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);
                fileData = { url: downloadURL, name: file.name, type: file.type };
            } catch (error) {
                console.error("File upload error: ", error);
                toast({ variant: "destructive", title: "Dosya Yükleme Hatası", description: (error as Error).message });
                setIsUploading(false);
                return;
            }
        }

        await addDoc(collection(db, 'messages'), {
            senderId: teacherId,
            receiverId: student.id,
            participants: [student.id, teacherId],
            text: newMessage,
            timestamp: Timestamp.now(),
            isRead: false,
            ...(fileData && { file: fileData }),
        });

        setNewMessage('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsUploading(false);
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
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
                                <div className={`p-3 rounded-lg max-w-xs text-sm ${msg.senderId === teacherId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {msg.text && <p>{msg.text}</p>}
                                    {msg.file && (
                                        <a href={msg.file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 bg-background/20 p-2 rounded-md hover:bg-background/40">
                                            <Paperclip className="h-4 w-4" />
                                            <span className="truncate">{msg.file.name}</span>
                                            <Download className="h-4 w-4" />
                                        </a>
                                    )}
                                    <p className="text-xs opacity-70 text-right mt-1">{msg.timestamp ? format(msg.timestamp.toDate(), 'p') : ''}</p>
                                </div>
                            </div>
                        ))
                    )}
                     {sortedMessages.length === 0 && !messagesLoading && (
                        <p className="text-center text-muted-foreground text-sm">Henüz mesaj yok.</p>
                    )}
                </ScrollArea>
                {file && (
                    <div className="p-2 border-t text-sm text-muted-foreground flex justify-between items-center">
                        <span>Ekli dosya: {file.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="flex mt-4 gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." onKeyDown={e => e.key === 'Enter' && !isUploading && handleSendMessage()} disabled={isUploading} />
                     <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleSendMessage} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </DialogContent>
    );
}

export function StudentListTab({ classId, teacherProfile, currentClass }: StudentListTabProps) {
  const { toast } = useToast();
  const { appUser, db } = useAuth();
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [bulkStudents, setBulkStudents] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isBulkGradeOpen, setIsBulkGradeOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const studentsQuery = useMemo(() => db ? query(collection(db, 'students'), where('classId', '==', classId)) : null, [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${classId}`, studentsQuery);
  
  const riskFactorsQuery = useMemo(() => (db ? query(collection(db, 'riskFactors')) : null), [db]);
  const { data: riskFactors } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);

  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const unreadMessagesQuery = useMemo(() => {
    if (!teacherId || !db) return null;
    return query(
        collection(db, 'messages'),
        where('receiverId', '==', teacherId),
        where('isRead', '==', false)
    );
  }, [teacherId, db]);

  const { data: unreadMessages } = useFirestore<Message>(`unread-messages-for-teacher-${teacherId}`, unreadMessagesQuery);

  const unreadMessagesByStudent = useMemo(() => {
    const map = new Map<string, number>();
    unreadMessages.forEach(msg => {
        map.set(msg.senderId, (map.get(msg.senderId) || 0) + 1);
    });
    return map;
  }, [unreadMessages]);
  
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

  const handleExportStudentReport = async (student: Student) => {
    if (!db || !teacherProfile || !currentClass) {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için gerekli bilgiler yüklenemedi.'});
        return;
    }
    try {
        const infoFormSnap = await getDocs(query(collection(db, 'infoForms'), where('studentId', '==', student.id)));
        
        let infoForm: InfoForm | null = null;
        if (!infoFormSnap.empty) {
            const doc = infoFormSnap.docs[0];
            infoForm = { id: doc.id, ...doc.data() } as InfoForm;
        }

        exportStudentDevelopmentReportToRtf({
            student,
            infoForm,
            riskFactors,
            teacherProfile,
            currentClass
        });
    } catch (error) {
        console.error("Rapor oluşturma hatası:", error);
        toast({variant: 'destructive', title: 'Hata', description: 'Öğrenci gelişim raporu oluşturulamadı.'});
    }
  };

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

  const addStudent = async (name: string, number: string) => {
    if (!db || !currentClass?.code) {
        throw new Error("Gerekli yapılandırma eksik.");
    }
    
    await addDoc(collection(db, 'students'), {
        classId,
        name: name,
        number: number,
        needsPasswordChange: true, // New students must change password
        risks: [],
        projectPreferences: [],
        assignedLesson: null,
        term1Grades: {},
        term2Grades: {},
        hasProject: false,
    });
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !newStudentNumber.trim()) {
      toast({ variant: 'destructive', title: 'Tüm alanlar zorunludur.' });
      return;
    }

    try {
        await addStudent(newStudentName, newStudentNumber);
        setNewStudentName('');
        setNewStudentNumber('');
        toast({ title: 'Öğrenci eklendi!' });
    } catch (error: any) {
        console.error("Öğrenci ekleme hatası:", error);
        toast({ variant: 'destructive', title: 'Hata', description: error.message });
    }
  };
  
  const handleBulkAdd = async () => {
    if (!db || !currentClass?.code) return;
    const lines = bulkStudents.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    const studentsToAdd = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const number = parts[0];
        const name = parts.slice(1).join(' ');
        return { number, name };
    }).filter(s => s.number && s.name);

    toast({ title: `${studentsToAdd.length} öğrenci ekleniyor...`, description: 'Bu işlem biraz zaman alabilir.' });

    for (const { name, number } of studentsToAdd) {
        try {
            await addStudent(name, number);
        } catch (error: any) {
             toast({ variant: 'destructive', title: `${name} eklenemedi`, description: error.message });
        }
    }

    setBulkStudents('');
    toast({ title: 'Toplu ekleme tamamlandı!'});
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'students', studentId));
    toast({ title: 'Öğrenci silindi', variant: 'destructive' });
  };
  
  const handleClearClass = async () => {
    if (!db || students.length === 0) return;
    const batch = writeBatch(db);
    students.forEach(student => {
        batch.delete(doc(db, 'students', student.id));
    });
    try {
        await batch.commit();
        toast({ title: 'Sınıf temizlendi', description: 'Tüm öğrenciler bu sınıftan silindi.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Öğrenciler silinemedi.' });
    }
  };

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
                  {currentClass?.code && (
                    <Badge variant="secondary" className="text-base font-mono tracking-widest cursor-pointer" onClick={copyClassCode}>
                      {currentClass.code}
                      <ClipboardCopy className="ml-2 h-3 w-3" />
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Sınıfa Davet Et
                  </Button>
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
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={students.length === 0}>
                            <Trash2 className="mr-2 h-4 w-4" /> Sınıfı Temizle
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu sınıftaki TÜM öğrencileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearClass} className="bg-destructive hover:bg-destructive/90">
                                Tümünü Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2 h-4 w-4" />Toplu Öğrenci Ekle</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Öğrencileri Toplu Ekle</DialogTitle>
                            <DialogDescription>
                                Her satıra bir öğrenci gelecek şekilde yapıştırın. Format: OkulNo Ad Soyad.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea value={bulkStudents} onChange={e => setBulkStudents(e.target.value)} placeholder="123 Ahmet Yılmaz
456 Ayşe Kaya" className="h-48" />
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
                <TableRow key={student.id} >
                  <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedStudent(student)}>{student.number}</TableCell>
                  <TableCell className="cursor-pointer" onClick={() => setSelectedStudent(student)}>{student.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex relative z-10" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleExportStudentReport(student)}>
                           <FileDown className="h-4 w-4"/>
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <MessageSquare className="h-4 w-4"/>
                                        {unreadMessagesByStudent.has(student.id) && (
                                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                                        )}
                                    </Button>
                                </div>
                            </DialogTrigger>
                             {appUser?.type === 'teacher' && <ChatModal student={student} teacherId={appUser.data.uid} />}
                        </Dialog>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Button type="button" variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu eylem, {student.name} adlı öğrenciyi kalıcı olarak silecektir. Bu işlem geri alınamaz.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStudent(student.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
     {currentClass?.code && (
      <ClassInviteDialog
        isOpen={isInviteOpen}
        setIsOpen={setIsInviteOpen}
        classCode={currentClass.code}
        className={currentClass.name}
      />
    )}
    </>
  );
}
