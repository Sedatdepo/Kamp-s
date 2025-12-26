// StudentDashboard.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Lesson, Message } from '@/lib/types';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

function ProjectSelection() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const [selected, setSelected] = useState<string[]>(appUser.data.projectPreferences || []);

  const lessonsQuery = useMemo(() => query(collection(db, 'lessons')), []);
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery);

  const handleCheckboxChange = (lessonId: string) => {
    setSelected(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      }
      if (prev.length < 5) {
        return [...prev, lessonId];
      }
      toast({ variant: 'destructive', title: 'En fazla 5 tercih yapabilirsiniz.' });
      return prev;
    });
  };

  const handleSavePreferences = async () => {
    const studentRef = doc(db, 'students', appUser.data.id);
    await updateDoc(studentRef, { projectPreferences: selected });
    toast({ title: 'Tercihleriniz kaydedildi!' });
  };

  const assignedLesson = lessons.find(l => l.id === appUser.data.assignedLesson);

  if (assignedLesson) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Atanan Projeniz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/10 p-6 rounded-lg text-center">
            <p className="text-muted-foreground">Size atanan proje:</p>
            <p className="text-2xl font-bold text-primary mt-2">{assignedLesson.name}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Proje Tercih Seçimi</CardTitle>
        <CardDescription>Tercih sırasına göre en fazla 5 ders seçin. İlk seçtiğiniz ders 1. tercihiniz olacaktır.</CardDescription>
      </CardHeader>
      <CardContent>
        {lessonsLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
          <div className="space-y-4">
            <div className='space-y-2'>
              {lessons.map(lesson => (
                <div key={lesson.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={lesson.id}
                    checked={selected.includes(lesson.id)}
                    onCheckedChange={() => handleCheckboxChange(lesson.id)}
                  />
                  <label htmlFor={lesson.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {lesson.name}
                  </label>
                  {selected.includes(lesson.id) && <span className="text-xs font-bold text-primary">({selected.indexOf(lesson.id) + 1})</span>}
                </div>
              ))}
            </div>
            <Button onClick={handleSavePreferences}>Tercihleri Kaydet</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Chat() {
    const { appUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    if (appUser?.type !== 'student') return null;

    const { data: classes, loading: classLoading } = useFirestore<Class>('classes');
    
    const currentClass = useMemo(() => classes.find(c => c.id === appUser.data.classId), [classes, appUser.data.classId]);
    const teacherId = currentClass?.teacherId;
    const studentId = appUser.data.id;
    
    const messagesQuery = useMemo(() => {
        if (!teacherId || !studentId) return null;
        const participants = [studentId, teacherId].sort();
        return query(
            collection(db, 'messages'), 
            where('participants', '==', participants)
        );
    }, [teacherId, studentId]);
    
    const { data: messages, loading: messagesLoading } = useFirestore<Message>('messages', messagesQuery);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    }, [messages]);

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('div');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
      }, [sortedMessages]);


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !teacherId) return;
        const participants = [studentId, teacherId].sort();
        await addDoc(collection(db, 'messages'), {
            senderId: studentId,
            receiverId: teacherId,
            participants: participants,
            text: newMessage,
            timestamp: Timestamp.now()
        });
        setNewMessage('');
    }

    if (classLoading || !teacherId) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Öğretmenle Sohbet</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Öğretmenle Sohbet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-96">
                    <ScrollArea className="flex-1 p-4 border rounded-md" ref={scrollAreaRef}>
                        {messagesLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                            sortedMessages.map(msg => (
                                <div key={msg.id} className={`flex my-2 ${msg.senderId === studentId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === studentId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-70 text-right mt-1">{format(msg.timestamp.toDate(), 'p')}</p>
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
            </CardContent>
        </Card>
    )
}

export function HomeTab() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProjectSelection />
      <Chat />
    </div>
  );
}
