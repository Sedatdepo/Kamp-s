
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Message, TeacherProfile, Student } from '@/lib/types';
import { collection, query, where, writeBatch, doc, addDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Send, Users, User } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { tr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function getInitials(name: string = '') {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('');
}

export function TeacherChatsTab() {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
    const [newMessage, setNewMessage] = useState('');

    const studentId = appUser?.type === 'student' ? appUser.data.id : null;
    if (!studentId) return null;

    const messagesQuery = useMemo(() => {
        if (!db) return null;
        return query(collection(db, 'messages'), where('participants', 'array-contains', studentId));
    }, [studentId, db]);

    const { data: allMessages, loading: messagesLoading } = useFirestore<Message[]>('studentMessages', messagesQuery);

    const teacherIds = useMemo(() => {
        const ids = new Set<string>();
        allMessages.forEach(msg => {
            const teacherId = msg.participants.find(p => p !== studentId);
            if (teacherId) ids.add(teacherId);
        });
        return Array.from(ids);
    }, [allMessages, studentId]);

    const teachersQuery = useMemo(() => (teacherIds.length > 0 && db) ? query(collection(db, 'teachers'), where('__name__', 'in', teacherIds)) : null, [teacherIds, db]);
    const { data: teacherProfiles, loading: teachersLoading } = useFirestore<TeacherProfile[]>('teacherProfilesForChats', teachersQuery);

    const unreadMessagesCount = useMemo(() => {
        const counts = new Map<string, number>();
        allMessages.forEach(msg => {
            if (msg.receiverId === studentId && !msg.isRead) {
                const teacherId = msg.senderId;
                counts.set(teacherId, (counts.get(teacherId) || 0) + 1);
            }
        });
        return counts;
    }, [allMessages, studentId]);
    
    useEffect(() => {
        if (db && allMessages.length > 0 && selectedTeacher) {
            const unread = allMessages.filter(msg => msg.senderId === selectedTeacher.id && msg.receiverId === studentId && !msg.isRead);
            if (unread.length > 0) {
                const batch = writeBatch(db);
                unread.forEach(msg => {
                    batch.update(doc(db, 'messages', msg.id), { isRead: true });
                });
                batch.commit();
            }
        }
    }, [allMessages, selectedTeacher, studentId, db]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedTeacher || !db || !studentId) return;
        await addDoc(collection(db, 'messages'), {
            senderId: studentId,
            receiverId: selectedTeacher.id,
            participants: [studentId, selectedTeacher.id],
            text: newMessage,
            timestamp: Timestamp.now(),
            isRead: false,
        });
        setNewMessage('');
        toast({ title: "Mesaj gönderildi." });
    };

    const chatMessages = useMemo(() => {
        if (!selectedTeacher) return [];
        return allMessages.filter(m => m.participants.includes(selectedTeacher.id)).sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
    }, [allMessages, selectedTeacher]);

    const isLoading = messagesLoading || teachersLoading;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
            <Card className="md:col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><Users className="h-6 w-6"/> Öğretmenlerim</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> :
                     teacherProfiles.length > 0 ? (
                        teacherProfiles.map(teacher => (
                            <div key={teacher.id} onClick={() => setSelectedTeacher(teacher)}
                                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${selectedTeacher?.id === teacher.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}>
                                <div className="flex items-center gap-3">
                                    <Avatar><AvatarFallback>{getInitials(teacher.name)}</AvatarFallback></Avatar>
                                    <span className="font-medium">{teacher.name}</span>
                                </div>
                                {unreadMessagesCount.has(teacher.id) && (
                                    <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{unreadMessagesCount.get(teacher.id)}</span>
                                )}
                            </div>
                        ))
                     ) : (
                         <p className="text-center text-sm text-muted-foreground p-4">Henüz bir öğretmenle sohbetiniz yok.</p>
                     )
                    }
                </CardContent>
            </Card>
            <Card className="md:col-span-2 flex flex-col">
                {selectedTeacher ? (
                    <>
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-2">
                                <MessageSquare className="h-6 w-6"/> Sohbet: {selectedTeacher.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4 overflow-y-hidden">
                             <ScrollArea className="flex-1 p-4 border rounded-md bg-muted/30">
                                {chatMessages.map(msg => (
                                    <div key={msg.id} className={`flex my-2 ${msg.senderId === studentId ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-xs text-sm ${msg.senderId === studentId ? 'bg-primary text-primary-foreground' : 'bg-white border'}`}>
                                            <p>{msg.text}</p>
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
                        <p>Görüşme başlatmak için bir öğretmen seçin.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
