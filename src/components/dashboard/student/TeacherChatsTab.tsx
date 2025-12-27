
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Message, TeacherProfile } from '@/lib/types';
import {
  collection,
  query,
  where,
  doc,
  addDoc,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


function getInitials(name: string = '') {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
}


export function TeacherChatsTab() {
    const { appUser } = useAuth();
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    if (appUser?.type !== 'student') return null;

    const studentId = appUser.data.id;

    // 1. Get all messages where student is a participant
    const studentMessagesQuery = useMemo(() => {
        return query(collection(db, 'messages'), where('participants', 'array-contains', studentId));
    }, [studentId]);

    const { data: allMessages, loading: messagesLoading } = useFirestore<Message>('allStudentMessages', studentMessagesQuery);

    // 2. Group messages by teacher
    const chats = useMemo(() => {
        const groups: { [teacherId: string]: Message[] } = {};
        allMessages.forEach(msg => {
            const teacherId = msg.participants.find(p => p !== studentId);
            if (teacherId) {
                if (!groups[teacherId]) {
                    groups[teacherId] = [];
                }
                groups[teacherId].push(msg);
            }
        });
        // Sort messages within each group
        Object.keys(groups).forEach(teacherId => {
            groups[teacherId].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
        });
        return groups;
    }, [allMessages, studentId]);

    const teacherIds = useMemo(() => Object.keys(chats), [chats]);

    // 3. Fetch teacher profiles for the conversations
    const { data: teacherProfiles, loading: teachersLoading } = useFirestore<TeacherProfile>(
        'teacherProfilesForChats',
        teacherIds.length > 0 ? query(collection(db, 'teachers'), where('id', 'in', teacherIds)) : null
    );

    // Set the first chat as active by default
    useEffect(() => {
        if (!activeChatId && teacherIds.length > 0) {
            setActiveChatId(teacherIds[0]);
        }
    }, [teacherIds, activeChatId]);

    // 4. Get messages for the active chat
    const activeMessages = useMemo(() => {
        if (!activeChatId) return [];
        return chats[activeChatId] || [];
    }, [chats, activeChatId]);

    const activeTeacherProfile = useMemo(() => {
        return teacherProfiles.find(p => p.id === activeChatId);
    }, [teacherProfiles, activeChatId]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('div');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
    }, [activeMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatId) return;
        const participants = [studentId, activeChatId].sort();
        await addDoc(collection(db, 'messages'), {
            senderId: studentId,
            receiverId: activeChatId,
            participants: participants,
            text: newMessage,
            timestamp: Timestamp.now()
        });
        setNewMessage('');
    };

    if (messagesLoading) {
        return <Card><CardContent><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
    }

    if (teacherIds.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Sohbetlerim</CardTitle>
                    <CardDescription>Öğretmenlerinizle buradan iletişim kurabilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground p-8">Henüz hiç sohbet başlatılmamış.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="grid grid-cols-1 md:grid-cols-3 h-[75vh]">
            {/* Teacher List */}
            <div className="col-span-1 border-r">
                <CardHeader>
                    <CardTitle className="font-headline">Sohbetler</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                    <ScrollArea className="h-[65vh]">
                    {teachersLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : teacherIds.map(id => {
                        const teacher = teacherProfiles.find(p => p.id === id);
                        const lastMessage = chats[id][chats[id].length - 1];
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveChatId(id)}
                                className={cn(
                                    "flex items-center gap-3 p-3 text-left w-full rounded-lg hover:bg-muted",
                                    activeChatId === id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarFallback>{teacher ? getInitials(teacher.name) : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <p className="font-semibold">{teacher?.name || 'Bilinmeyen Öğretmen'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{lastMessage?.text}</p>
                                </div>
                            </button>
                        );
                    })}
                    </ScrollArea>
                </CardContent>
            </div>
            
            {/* Chat Window */}
            <div className="col-span-2 flex flex-col">
                {activeChatId && activeTeacherProfile ? (
                    <>
                        <CardHeader className="flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{getInitials(activeTeacherProfile.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="font-headline">{activeTeacherProfile.name}</CardTitle>
                                    <CardDescription>Danışman öğretmeninizle buradan iletişim kurabilirsiniz.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col p-4">
                            <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                                {activeMessages.map(msg => (
                                    <div key={msg.id} className={`flex my-2 ${msg.senderId === studentId ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === studentId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            <p>{msg.text}</p>
                                            <p className="text-xs opacity-70 text-right mt-1">{format(msg.timestamp.toDate(), 'p')}</p>
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                            <div className="flex mt-4 gap-2 pt-4 border-t">
                                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Bir mesaj yazın..." onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                                <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Sohbeti görüntülemek için bir kişi seçin.</p>
                    </div>
                )}
            </div>
        </Card>
    );
}