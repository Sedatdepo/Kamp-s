
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Club, Class, Student } from '@/lib/types';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function StudentClubTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const student = appUser?.type === 'student' ? appUser.data : null;
  const classId = student?.classId;
  
  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classQuery);
  
  const clubsQuery = useMemoFirebase(() => (currentClass?.teacherId && db ? query(collection(db, 'clubs'), where('teacherId', '==', currentClass.teacherId)) : null), [currentClass?.teacherId, db]);
  const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

  const [selected, setSelected] = useState<string[]>(student?.clubPreferences || []);

  useEffect(() => {
    if (student?.clubPreferences) {
      setSelected(student.clubPreferences);
    }
  }, [student]);

  const handleCheckboxChange = (clubId: string) => {
    setSelected(prev => {
      if (prev.includes(clubId)) {
        return prev.filter(id => id !== clubId);
      }
      if (prev.length < 4) {
        return [...prev, clubId];
      }
      toast({ variant: 'destructive', title: 'En fazla 4 tercih yapabilirsiniz.' });
      return prev;
    });
  };

  const handleSavePreferences = async () => {
    if (!db || !student) return;
    setIsLoading(true);
    const studentRef = doc(db, 'students', student.id);
    try {
        await updateDoc(studentRef, { clubPreferences: selected });
        toast({ title: 'Tercihleriniz kaydedildi!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Tercihler kaydedilemedi.' });
    } finally {
        setIsLoading(false);
    }
  };

  const assignedClubs = useMemo(() => {
    if (!student || !student.assignedClubIds || !clubs) return [];
    return clubs.filter(club => student.assignedClubIds?.includes(club.id));
  }, [student, clubs]);

  if (classLoading || clubsLoading) {
    return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }
  
  if (assignedClubs.length > 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Trophy/> Atandığınız Kulüpler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {assignedClubs.map(club => (
                    <Badge key={club.id} className="text-lg p-2">{club.name}</Badge>
                ))}
            </CardContent>
        </Card>
    )
  }

  if (!currentClass?.isClubSelectionActive) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2"><Trophy/> Kulüp Seçimi</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">Kulüp tercih dönemi henüz başlamadı veya sona erdi. Lütfen öğretmeninizden bilgi alın.</p>
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Trophy/> Kulüp Tercih Seçimi</CardTitle>
        <CardDescription>En fazla 4 kulüp seçerek tercihlerinizi belirtin.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className='space-y-2'>
            {(clubs || []).map(club => (
              <div key={club.id} className="flex items-center space-x-3 rounded-md border p-4 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                <Checkbox
                  id={club.id}
                  checked={selected.includes(club.id)}
                  onCheckedChange={() => handleCheckboxChange(club.id)}
                />
                <label htmlFor={club.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {club.name}
                </label>
              </div>
            ))}
          </div>
          <Button onClick={handleSavePreferences} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Tercihleri Kaydet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
