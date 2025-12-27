
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Message, TeacherProfile } from '@/lib/types';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { tr } from 'date-fns/locale';

function getInitials(name: string = '') {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
}


export function TeacherChatsTab() {
    const { appUser } = useAuth();
    if (appUser?.type !== 'student') return null;

    const studentId = appUser.data.id;

    // 1. Öğrencinin dahil olduğu tüm mesajları, en yeniden en eskiye doğru çek
    const messagesQuery = useMemo(() => {
        return query(
            collection(db, 'messages'), 
            where('participants', 'array-contains', studentId),
            orderBy('timestamp', 'desc')
        );
    }, [studentId]);

    const { data: messages, loading: messagesLoading } = useFirestore<Message>('studentMessages', messagesQuery);

    // 2. Mesajlardaki tüm öğretmen ID'lerini topla
    const teacherIds = useMemo(() => {
        const ids = new Set<string>();
        messages.forEach(msg => {
            const teacherId = msg.participants.find(p => p !== studentId);
            if (teacherId) ids.add(teacherId);
        });
        return Array.from(ids);
    }, [messages, studentId]);

    // 3. Öğretmen profillerini çek
    const { data: teacherProfiles, loading: teachersLoading } = useFirestore<TeacherProfile>(
        'teacherProfilesForChats',
        teacherIds.length > 0 ? query(collection(db, 'teachers'), where('__name__', 'in', teacherIds)) : null
    );

    const isLoading = messagesLoading || teachersLoading;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <MessageSquare className="h-6 w-6"/>
                    Gelen Mesajlar
                </CardTitle>
                <CardDescription>Öğretmenlerinizden gelen mesajları buradan okuyabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {messages.length > 0 ? (
                        messages.map((msg) => {
                            const teacherId = msg.senderId !== studentId ? msg.senderId : msg.receiverId;
                            const teacher = teacherProfiles.find(p => p.id === teacherId);
                            const isMyMessage = msg.senderId === studentId;

                            return (
                                <div key={msg.id} className="border p-4 rounded-lg bg-background shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback>{teacher ? getInitials(teacher.name) : '?'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{teacher?.name || 'Bilinmeyen Öğretmen'}</p>
                                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>{format(msg.timestamp.toDate(), 'd MMMM yyyy, HH:mm', { locale: tr })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm leading-relaxed pl-12">{msg.text}</p>
                                    
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">Henüz gelen bir mesajınız yok.</p>
                        </div>
                    )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
