
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, collection, query, where } from 'firebase/firestore';
import { Student } from '@/lib/types';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Share2, Users } from 'lucide-react';

const MAX_SELECTIONS = 3;

export function SociogramTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  const student = appUser?.type === 'student' ? appUser.data : null;
  
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !student) return null;
    return query(collection(db, 'students'), where('classId', '==', student.classId));
  }, [db, student]);

  const { data: classmates, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>(student?.sociogramSelections || []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (student?.sociogramSelections) {
      setSelectedFriends(student.sociogramSelections);
    }
  }, [student]);

  const handleSelection = (studentId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      }
      if (prev.length < MAX_SELECTIONS) {
        return [...prev, studentId];
      }
      toast({
        variant: 'destructive',
        title: 'Seçim Limiti Doldu',
        description: `En fazla ${MAX_SELECTIONS} arkadaş seçebilirsiniz.`,
      });
      return prev;
    });
  };

  const handleSave = async () => {
    if (!db || !student) return;

    setIsLoading(true);
    const studentRef = doc(db, 'students', student.id);

    try {
      await updateDoc(studentRef, { sociogramSelections: selectedFriends });
      toast({
        title: 'Tercihler Kaydedildi',
        description: 'Arkadaşlık seçimleriniz başarıyla güncellendi.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Seçimleriniz kaydedilemedi.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const otherClassmates = classmates?.filter(c => c.id !== student?.id) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Share2 />
          Sosyogram - Arkadaşlık Seçimi
        </CardTitle>
        <CardDescription>
          Sınıfta en iyi anlaştığın <strong>{MAX_SELECTIONS}</strong> arkadaşını seç. Bu bilgiler sadece rehber öğretmen tarafından görülecektir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {studentsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
              {otherClassmates.map(c => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedFriends.includes(c.id)
                      ? 'bg-primary/10 border-primary shadow-sm'
                      : 'bg-background hover:bg-muted/50'
                  }`}
                >
                  <Checkbox
                    id={`friend-${c.id}`}
                    checked={selectedFriends.includes(c.id)}
                    onCheckedChange={() => handleSelection(c.id)}
                  />
                  <span className="font-medium text-sm">{c.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Seçilen: <strong>{selectedFriends.length} / {MAX_SELECTIONS}</strong>
              </div>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Seçimleri Kaydet
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
