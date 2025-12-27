
"use client";

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Class, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Clock, Trash2 } from 'lucide-react';

interface CommunicationTabProps {
  classId: string;
  currentClass: Class | null;
}

export function CommunicationTab({ classId, currentClass }: CommunicationTabProps) {
  const [announcementText, setAnnouncementText] = useState('');
  const { toast } = useToast();

  const handleAddAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast({ variant: 'destructive', title: 'Duyuru metni boş olamaz.' });
      return;
    }
    if (!currentClass) return;

    const newAnnouncement: Announcement = {
      id: Date.now(),
      text: announcementText,
      date: new Date().toLocaleDateString('tr-TR'),
    };

    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = [newAnnouncement, ...(currentClass.announcements || [])];

    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
      setAnnouncementText('');
      toast({ title: 'Duyuru yayınlandı!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru yayınlanamadı.' });
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!currentClass) return;
    if (!window.confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;

    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = (currentClass.announcements || []).filter(
      (ann) => ann.id !== announcementId
    );

    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
      toast({ title: 'Duyuru silindi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru silinemedi.' });
    }
  };
  
  const announcements = currentClass?.announcements || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Yeni Duyuru Yayınla
          </CardTitle>
          <CardDescription>Bu sınıftaki tüm öğrencilere gönderilecek bir duyuru yazın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Duyuru metnini buraya yazın..."
            rows={5}
          />
          <Button onClick={handleAddAnnouncement}>Yayınla</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Geçmiş Duyurular</CardTitle>
          <CardDescription>Bu sınıfa daha önce gönderilmiş duyurular.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="border p-4 rounded-lg bg-muted/50 flex justify-between items-start">
                  <div>
                    <p className="text-sm">{ann.text}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{ann.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500" onClick={() => handleDeleteAnnouncement(ann.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">Henüz yayınlanmış bir duyuru yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
