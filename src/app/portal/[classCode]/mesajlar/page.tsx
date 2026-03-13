'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, collection, addDoc, query, where, Timestamp, orderBy, onSnapshot, writeBatch } from 'firebase/firestore';
import { Student, TeacherProfile, Message, Class } from '@/lib/types';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

const Linkify = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!text) return null;
    const parts = text.split(urlRegex);
    return (
        <>
            {parts.map((part, i) =>
                part.match(urlRegex) ? (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-400" onClick={(e) => e.stopPropagation()}>
                        {part}
                    </a>
                ) : (
                    part
                )
            )}
        </>
    );
};

export default function StudentMessagingPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, user: authUser, isUserLoading: authLoading } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) throw new Error();
            const { student: storedStudent } = JSON.parse(authData);
            if (!storedStudent) throw new Error();
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);
    
    const teacherDocRef = useMemoFirebase(
        () => (db && student?.teacherId ? doc(db, 'teachers', student.teacherId) : null),
        [db, student?.teacherId]
    );
    const { data: teacherProfile } = useDoc<TeacherProfile>(teacherDocRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!db || !authUser?.uid) return null;
        return query(
            collection(db, 'messages'),
            where('participants', 'array-contains', authUser.uid),
            orderBy('timestamp')
        );
    }, [db, authUser?.uid]);

    const { data: unsortedMessages } = useCollection<Message>(messagesQuery);

    const messages = useMemo(() => {
        if (!unsortedMessages) return [];
        return [...unsortedMessages].sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || 0;
            return timeA - timeB;
        });
    }, [unsortedMessages]);
    
    // Mark messages as read
    useEffect(() => {
        if (db && messages && messages.length > 0 && authUser?.uid) {
            const unread = messages.filter(msg => msg.receiverId === authUser.uid && !msg.isRead);
            if (unread.length > 0) {
                const batch = writeBatch(db);
                unread.forEach(msg => {
                    batch.update(doc(db, 'messages', msg.id), { isRead: true });
                });
                batch.commit().catch(console.error);
            }
        }
    }, [db, messages, authUser?.uid]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !student || !authUser || !db) return;
        setIsSending(true);
        try {
            await addDoc(collection(db, 'messages'), {
                senderId: authUser.uid,
                receiverId: student.teacherId,
                participants: [authUser.uid, student.teacherId],
                text: newMessage,
                timestamp: Timestamp.now(),
                isRead: false,
            });
            setNewMessage('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Mesaj gönderilemedi: ' + error.message });
        } finally {
            setIsSending(false);
        }
    };
    
    const loading = authLoading || !student;

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Öğretmene Mesaj</h1>
                        <p className="text-sm text-muted-foreground">{student?.name}</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/portal/${classCode}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Portala Geri Dön
                    </Link>
                </Button>
            </header>
            <main className="max-w-2xl mx-auto">
                <Card className="flex flex-col h-[70vh]">
                    <CardHeader className="flex-row items-center gap-3">
                        <Avatar><AvatarFallback>{teacherProfile ? getInitials(teacherProfile.name) : 'Ö'}</AvatarFallback></Avatar>
                        <div>
                             <CardTitle>{teacherProfile?.name || 'Öğretmen'}</CardTitle>
                             <CardDescription>{teacherProfile?.branch}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-2 sm:p-4">
                        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                            {messages?.map((msg) => (
                                <div key={msg.id} className={`flex my-2 ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-xs text-sm ${msg.senderId === authUser?.uid ? 'bg-primary text-primary-foreground' : 'bg-white border'}`}>
                                        <p className="whitespace-pre-wrap"><Linkify text={msg.text} /></p>
                                        <p className="text-xs opacity-70 text-right mt-1">{msg.timestamp ? format(msg.timestamp.toDate(), 'p', { locale: tr }) : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                        <div className="flex gap-2 p-2">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Mesajınızı yazın..."
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                disabled={isSending}
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
