
"use client";

import { useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function HomeworkTab() {
  const { appUser } = useAuth();
  
  if (appUser?.type !== 'student') return null;
  const studentId = appUser.data.id;

  const { data: classes, loading: classLoading } = useFirestore<Class>('classes');
  const studentClass = useMemo(() => classes.find(c => c.id === appUser.data.classId), [classes, appUser.data.classId]);

  useEffect(() => {
    // Mark homeworks as seen when the component mounts
    if (studentClass && studentClass.homeworks && studentId) {
      const unseenHomeworks = studentClass.homeworks.filter(
        (hw) => !hw.seenBy?.includes(studentId)
      );

      if (unseenHomeworks.length > 0) {
        const classRef = doc(db, 'classes', studentClass.id);
        const updatedHomeworks = studentClass.homeworks.map((hw) => {
          if (!hw.seenBy?.includes(studentId)) {
            return {
              ...hw,
              seenBy: [...(hw.seenBy || []), studentId],
            };
          }
          return hw;
        });
        updateDoc(classRef, { homeworks: updatedHomeworks });
      }
    }
  }, [studentClass, studentId]);

  if (classLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  const homeworks = studentClass?.homeworks || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <BookText className="h-6 w-6"/>
            Ödevlerim
        </CardTitle>
        <CardDescription>Öğretmeninizin verdiği ödevleri buradan takip edebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {homeworks.length > 0 ? (
            homeworks.map((hw) => (
              <div key={hw.id} className="border p-4 rounded-lg bg-background shadow-sm">
                <p className="text-sm leading-relaxed">{hw.text}</p>
                 <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-3 pt-2 border-t">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Veriliş: {format(new Date(hw.assignedDate), 'd MMMM yyyy', { locale: tr })}</span>
                    </div>
                    {hw.dueDate && (
                        <div className="flex items-center gap-2 font-medium text-red-600">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Teslim: {format(new Date(hw.dueDate), 'd MMMM yyyy', { locale: tr })}</span>
                        </div>
                    )}
                 </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Henüz verilmiş bir ödev yok.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
