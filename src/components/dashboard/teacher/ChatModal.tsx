"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { Student, Message } from '@/lib/types';
import { useFirestore } from '@/hooks/useFirestore';
import { collection, query, where, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface ChatModalProps {
  student: Student;
  teacherId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatModal({ student, teacherId, isOpen, onOpenChange }: ChatModalProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemo(() => query(
    collection(db, 'messages'),
    where('participants', 'array-contains', student.id),
    orderBy('timestamp', 'asc')
  ), [student.id]);
  
  const { data: messages, loading: messagesLoading } = useFirestore<Message>('messages', messagesQuery);
  const filteredMessages = useMemo(() => messages.filter(m => m.participants.includes(teacherId)), [messages, teacherId]);


  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollable = scrollAreaRef.current.querySelector('div');
        if(scrollable) {
            scrollable.scrollTop = scrollable.scrollHeight;
        }
    }
  }, [filteredMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      senderId: teacherId,
      receiverId: student.id,
      participants: [teacherId, student.id],
      text: newMessage,
      timestamp: Timestamp.now(),
    });
    setNewMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{student.name} ile Sohbet</DialogTitle>
          <DialogDescription>Bu öğrenciye bir mesaj gönderin.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-96">
          <ScrollArea className="flex-1 p-4 border rounded-md" ref={scrollAreaRef}>
            {messagesLoading ? (
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            ) : (
                filteredMessages.map(msg => (
                <div key={msg.id} className={`flex my-2 ${msg.senderId === teacherId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2 rounded-lg max-w-xs ${msg.senderId === teacherId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 text-right mt-1">{format(msg.timestamp.toDate(), 'p')}</p>
                  </div>
                </div>
              ))
            )}
            {filteredMessages.length === 0 && !messagesLoading && (
                <p className="text-center text-muted-foreground text-sm">Henüz mesaj yok.</p>
            )}
          </ScrollArea>
          <div className="flex mt-4 gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Bir mesaj yazın..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
