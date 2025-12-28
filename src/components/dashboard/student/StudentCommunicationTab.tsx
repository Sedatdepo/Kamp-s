"use client";

import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Bell, Clock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';

export function StudentCommunicationTab() {
  const { appUser, db } = useAuth();
  
  if (appUser?.type !== 'student') return null;
  const studentId = appUser.data.id;

  const { data: classes, loading: classLoading } = useFirestore<Class>('classes');
  const studentClass = useMemo(() => classes.find(c => c.id === appUser.data.classId), [classes, appUser.data.classId]);

  useEffect(() => {
    if (db && studentClass && studentClass.announcements && studentId) {
      const unseenAnnouncements = studentClass.announcements.filter(
        (ann) => !ann.seenBy?.includes(studentId)
      );

      if (unseenAnnouncements.length > 0) {
        const classRef = doc(db, 'classes', studentClass.id);
        const updatedAnnouncements = studentClass.announcements.map((ann) => {
          if (!ann.seenBy?.includes(studentId)) {
            return {
              ...ann,
              seenBy: [...(ann.seenBy || []), studentId],
            };
          }
          return ann;
        });
        updateDoc(classRef, { announcements: updatedAnnouncements });
      }
    }
  }, [studentClass, studentId, db]);

  if (classLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  const announcements = studentClass?.announcements || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bell className="h-6 w-6"/>
            Sınıf Duyuruları
        </CardTitle>
        <CardDescription>Öğretmeninizin yaptığı duyuruları buradan takip edebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div key={ann.id} className="border p-4 rounded-lg bg-background shadow-sm">
                <p className="text-sm leading-relaxed">{ann.text}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 pt-2 border-t">
                  <Clock className="h-3 w-3" />
                  <span>Yayınlanma Tarihi: {new Date(ann.date).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Henüz yayınlanmış bir duyuru yok.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
