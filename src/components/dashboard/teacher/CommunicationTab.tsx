

"use client";

import { useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import { doc, updateDoc, collection, addDoc, Timestamp, query, where, writeBatch, setDoc, deleteField } from 'firebase/firestore';
import { Class, Announcement, Message, Student } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Clock, Trash2, Edit, Save, X, MessageSquare, Send, User, Users, Loader2 } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


interface CommunicationTabProps {
  classId: string;
  currentClass: Class | null;
}

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

function AnnouncementsPanel({ classId, currentClass }: CommunicationTabProps) {
  const [announcementText, setAnnouncementText] = useState('');
  const [link, setLink] = useState('');
  const [linkText, setLinkText] = useState('');
  const { toast } = useToast();
  const { db } = useAuth();
  
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState('');
  
  const displayedAnnouncements = useMemo(() => {
    return currentClass?.announcements || [];
  }, [currentClass]);

   const handleTogglePublish = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    const publicViewRef = doc(db, 'publicViews', currentClass.id);
    
    try {
        await updateDoc(classRef, { isAnnouncementsPublished: checked });
        if (checked) {
            const publicData = {
                className: currentClass.name,
                announcements: currentClass.announcements || [],
            };
            await setDoc(publicViewRef, { announcements: publicData.announcements, className: publicData.className }, { merge: true });
            toast({ title: 'Duyurular yayınlandı!' });
        } else {
            await updateDoc(publicViewRef, { announcements: deleteField() });
            toast({ title: 'Duyurular yayından kaldırıldı.' });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Yayın durumu değiştirilemedi.' });
    }
};

  const handleAddAnnouncement = async () => {
    if (!db || !announcementText.trim() || !currentClass) return;

    const newAnnouncement: Announcement = {
      id: Date.now(), 
      text: announcementText, 
      date: new Date().toISOString(), 
      seenBy: [],
    };
    
    const trimmedLink = link.trim();
    const trimmedLinkText = linkText.trim();
    if (trimmedLink) newAnnouncement.link = trimmedLink;
    if (trimmedLinkText) newAnnouncement.linkText = trimmedLinkText;

    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = [newAnnouncement, ...(currentClass.announcements || [])];

    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
      if (currentClass.isAnnouncementsPublished) {
        const publicViewRef = doc(db, 'publicViews', classId);
        await setDoc(publicViewRef, { announcements: updatedAnnouncements }, { merge: true });
      }
      setAnnouncementText('');
      setLink('');
      setLinkText('');
      toast({ title: 'Duyuru yayınlandı!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru yayınlanamadı.' });
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!db || !currentClass) return;
    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = (currentClass.announcements || []).filter((ann) => ann.id !== announcementId);
    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
       if (currentClass.isAnnouncementsPublished) {
        const publicViewRef = doc(db, 'publicViews', classId);
        await setDoc(publicViewRef, { announcements: updatedAnnouncements }, { merge: true });
      }
      toast({ title: 'Duyuru silindi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru silinemedi.' });
    }
  };

  const handleStartEdit = (ann: Announcement) => {
    setEditingAnnouncementId(ann.id);
    setEditingAnnouncementText(ann.text);
    setLink(ann.link || '');
    setLinkText(ann.linkText || '');
  };
  const handleCancelEdit = () => { 
      setEditingAnnouncementId(null); 
      setEditingAnnouncementText('');
      setLink('');
      setLinkText('');
  };

  const handleSaveEdit = async () => {
    if (!db || !currentClass || editingAnnouncementId === null || !editingAnnouncementText.trim()) return;
    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = (currentClass.announcements || []).map(ann => {
        if (ann.id === editingAnnouncementId) {
            const updatedAnn: any = { ...ann, text: editingAnnouncementText };
            const trimmedLink = link.trim();
            const trimmedLinkText = linkText.trim();

            if (trimmedLink) {
                updatedAnn.link = trimmedLink;
            } else {
                delete updatedAnn.link;
            }

            if (trimmedLinkText) {
                updatedAnn.linkText = trimmedLinkText;
            } else {
                delete updatedAnn.linkText;
            }
            return updatedAnn as Announcement;
        }
        return ann;
    });
    try {
        await updateDoc(classRef, { announcements: updatedAnnouncements });
         if (currentClass.isAnnouncementsPublished) {
            const publicViewRef = doc(db, 'publicViews', classId);
            await setDoc(publicViewRef, { announcements: updatedAnnouncements }, { merge: true });
        }
        toast({ title: 'Duyuru güncellendi.' });
        handleCancelEdit();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru güncellenemedi.' });
    }
  };

  return (
    <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline flex items-center gap-2">
                <Megaphone className="h-6 w-6" /> Duyuru Paneli
              </CardTitle>
              <CardDescription>Bu sınıftaki tüm öğrencilere gönderilecek bir duyuru yazın.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="publish-announcements">Yayınla</Label>
                <Switch
                    id="publish-announcements"
                    checked={currentClass?.isAnnouncementsPublished || false}
                    onCheckedChange={handleTogglePublish}
                    disabled={!currentClass}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="Duyuru metnini buraya yazın..." rows={4}/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="İsteğe bağlı link (https://...)" />
                <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link metni (örn: Detaylar için tıkla)" />
            </div>
            <Button onClick={handleAddAnnouncement}>Yayınla</Button>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mt-4">
            {displayedAnnouncements.length > 0 ? (
                [...displayedAnnouncements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((ann) => (
                <div key={ann.id} className="border p-4 rounded-lg bg-muted/50 flex justify-between items-start gap-4">
                    {editingAnnouncementId === ann.id ? (
                        <div className="w-full space-y-2">
                            <Textarea value={editingAnnouncementText} onChange={(e) => setEditingAnnouncementText(e.target.value)} className="bg-white"/>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="İsteğe bağlı link (https://...)" />
                                <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link metni" />
                            </div>
                            <div className="flex gap-2"><Button size="sm" onClick={handleSaveEdit}><Save className="mr-2 h-4 w-4"/>Kaydet</Button><Button size="sm" variant="ghost" onClick={handleCancelEdit}>İptal</Button></div>
                        </div>
                    ) : ( <>
                        <div className="flex-1"><p className="text-sm">{ann.text}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{new Date(ann.date).toLocaleDateString('tr-TR')}</span></div>
                            </div>
                        </div>
                        <div className="flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-blue-600" onClick={() => handleStartEdit(ann)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu duyuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteAnnouncement(ann.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </>)}
                </div>
                ))
            ) : (<p className="text-center text-sm text-muted-foreground py-4">Görüntülenecek duyuru yok.</p>)}
            </div>
        </CardContent>
    </Card>
  )
}

const Linkify = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (!text) return null;
  
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline hover:text-blue-500"
              onClick={(e) => e.stopPropagation()} 
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </>
  );
};


function MessagesPanel({ classId, students }: { classId: string, students: Student[] }) {
    const { appUser, db } = useAuth();
    const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const { toast } = useToast();

    const messagesQuery = useMemoFirebase(() => {
        if (!db || !teacherId) return null;
        return query(collection(db, 'messages'), where('participants', 'array-contains', teacherId));
    }, [db, teacherId]);

    const { data: allMessages } = useCollection<Message>(messagesQuery);
    
    const sortedStudents = useMemo(() => {
        if (!students) return [];
        return [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true}));
    }, [students]);

    const unreadMessagesCount = useMemo(() => {
        const counts = new Map<string, number>();
        if(allMessages) {
            allMessages.forEach(msg => {
                if (msg.receiverId === teacherId && !msg.isRead) {
                    counts.set(msg.senderId, (counts.get(msg.senderId) || 0) + 1);
                }
            });
        }
        return counts;
    }, [allMessages, teacherId]);

    useEffect(() => {
        if (db && allMessages && allMessages.length > 0 && selectedStudent) {
            const unread = allMessages.filter(msg => msg.senderId === selectedStudent.id && msg.receiverId === teacherId && !msg.isRead);
            if (unread.length > 0) {
                const batch = writeBatch(db);
                unread.forEach(msg => {
                    batch.update(doc(db, 'messages', msg.id), { isRead: true });
                });
                batch.commit();
            }
        }
    }, [allMessages, selectedStudent, teacherId, db]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedStudent || !db || !teacherId) return;
        await addDoc(collection(db, 'messages'), {
            senderId: teacherId,
            receiverId: selectedStudent.id,
            participants: [selectedStudent.id, teacherId],
            text: newMessage,
            timestamp: Timestamp.now(),
            isRead: false,
        });
        setNewMessage('');
        toast({ title: "Mesaj gönderildi." });
    };

    const chatMessages = useMemo(() => {
        if (!selectedStudent || !allMessages) return [];
        return allMessages.filter(m => m.participants.includes(selectedStudent.id)).sort((a,b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
    }, [allMessages, selectedStudent]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users className="h-6 w-6"/> Öğrenciler</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {sortedStudents && sortedStudents.map(student => (
                        <div key={student.id} onClick={() => setSelectedStudent(student)}
                            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${selectedStudent?.id === student.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                            <div className="flex items-center gap-3">
                                <Avatar><AvatarFallback>{getInitials(student.name)}</AvatarFallback></Avatar>
                                <span className="font-medium">{student.name}</span>
                            </div>
                            {unreadMessagesCount.has(student.id) && (
                                <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadMessagesCount.get(student.id)}</span>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="md:col-span-2 flex flex-col">
                {selectedStudent ? (
                    <>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <MessageSquare className="h-6 w-6"/> Sohbet: {selectedStudent.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 overflow-y-hidden">
                             <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/30">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex my-2 ${msg.senderId === teacherId ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-xs text-sm ${msg.senderId === teacherId ? 'bg-primary text-primary-foreground' : 'bg-white border'}`}>
                                            <p className="whitespace-pre-wrap"><Linkify text={msg.text} /></p>
                                            <p className="text-xs opacity-70 text-right mt-1">{msg.timestamp ? format(msg.timestamp.toDate(), 'p', { locale: tr }) : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                            <div className="flex gap-2">
                                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <User className="h-16 w-16 mb-4"/>
                        <p>Görüşme başlatmak için bir öğrenci seçin.</p>
                    </div>
                )}
            </Card>
        </div>
    )
}


export function CommunicationTab({ classId, currentClass }: { classId: string; currentClass: Class | null; }) {
    const { db } = useAuth();
    const studentsQuery = useMemoFirebase(() => db ? query(collection(db, 'students'), where('classId', '==', classId)) : null, [db, classId]);
    const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  return (
    <Tabs defaultValue="announcements">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="announcements">Duyurular</TabsTrigger>
        <TabsTrigger value="messages">Öğrenci Mesajları</TabsTrigger>
      </TabsList>
      <TabsContent value="announcements" className="mt-4">
        <AnnouncementsPanel classId={classId} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="messages" className="mt-4">
        {studentsLoading ? <Loader2 className="animate-spin mx-auto mt-10"/> : <MessagesPanel classId={classId} students={students || []} />}
      </TabsContent>
    </Tabs>
  );
}
