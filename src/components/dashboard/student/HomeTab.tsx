"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Lesson, Message } from '@/lib/types';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  orderBy,
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
  const [selected, setSelected] = useState<string[]>(appUser?.type === 'student' ? appUser.data.projectPreferences : []);

  const lessonsQuery = appUser?.type === 'teacher' ? null : query(collection(db, 'lessons'));
  const { data: lessons, loading: lessonsLoading } = useFirestore<Lesson>('lessons', lessonsQuery);
  
  if (appUser?.type !== 'student') return null;

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
    
    // Gerçek bir uygulamada öğretmen ID'si dinamik olmalıdır. Şimdilik bir varsayılan kullanıyoruz.
    const teacherId = appUser?.type === 'student' ? (lessons.find(l => l.id === appUser.data.assignedLesson)?.teacherId || 'default_teacher') : "default_teacher"; 
    const lessonsQuery = query(collection(db, 'lessons'));
    const { data: lessons } = useFirestore<Lesson>('lessons', lessonsQuery);
    
    if (appUser?.type !== 'student') return null;

    const studentId = appUser.data.id;

    // Bu sorgu da basitleştirilmiştir. Gerçek bir sohbet daha karmaşık mantık gerektirebilir.
    const messagesQuery = query(
        collection(db, 'messages'), 
        where('senderId', 'in', [studentId, teacherId]),
        where('receiverId', 'in', [studentId, teacherId]),
        orderBy('timestamp', 'asc')
    );
    const { data: messages, loading: messagesLoading } = useFirestore<Message>('messages', messagesQuery);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        await addDoc(collection(db, 'messages'), {
            senderId: studentId,
            receiverId: teacherId,
            text: newMessage,
            timestamp: Timestamp.now()
        });
        setNewMessage('');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Öğretmenle Sohbet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col h-96">
                    <ScrollArea className="flex-1 p-4 border rounded-md">
                        {messagesLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex my-2 ${msg.senderId === studentId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === studentId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p>{msg.text}</p>
                                        <p className="text-xs opacity-70 text-right mt-1">{format(msg.timestamp.toDate(), 'p')}</p>
                                    </div>
                                </div>
                            ))
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
