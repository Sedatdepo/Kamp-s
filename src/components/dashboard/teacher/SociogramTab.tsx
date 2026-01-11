
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { Student, Class } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Share2, Users, User, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SociogramTabProps {
  students: Student[];
  currentClass: Class | null;
}

export function SociogramTab({ students, currentClass }: SociogramTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();

  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    try {
      await updateDoc(classRef, { isSociogramActive: checked });
      toast({
        title: 'Başarılı',
        description: `Sosyogram seçimi öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme sırasında bir sorun oluştu.',
      });
    }
  };

  const analysis = useMemo(() => {
    const whoChoseWhom: Record<string, string[]> = {};
    const timesChosen: Record<string, number> = {};

    students.forEach(student => {
      timesChosen[student.id] = 0;
      whoChoseWhom[student.id] = [];
    });

    students.forEach(student => {
      student.sociogramSelections?.forEach(selectedId => {
        if (timesChosen.hasOwnProperty(selectedId)) {
          timesChosen[selectedId]++;
          whoChoseWhom[selectedId].push(student.name);
        }
      });
    });

    const popular = Object.entries(timesChosen)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ student: students.find(s => s.id === id), count, chosenBy: whoChoseWhom[id] }));

    const isolated = students.filter(s => (timesChosen[s.id] || 0) === 0);

    const reciprocal: { student1: Student; student2: Student }[] = [];
    const processedPairs = new Set<string>();

    students.forEach(student1 => {
      student1.sociogramSelections?.forEach(id2 => {
        const student2 = students.find(s => s.id === id2);
        if (student2?.sociogramSelections?.includes(student1.id)) {
          const pairKey = [student1.id, student2.id].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            reciprocal.push({ student1, student2 });
            processedPairs.add(pairKey);
          }
        }
      });
    });

    return { popular, isolated, reciprocal };
  }, [students]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Yönetim Paneli</CardTitle>
            <CardDescription>Öğrencilerin arkadaş seçimi yapabilmesi için özelliği aktif edin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-2 p-3 bg-muted rounded-lg">
              <Label htmlFor="sociogram-toggle" className="font-semibold">
                Sosyogram Seçimi {currentClass?.isSociogramActive ? 'Aktif' : 'Pasif'}
              </Label>
              <Switch 
                  id="sociogram-toggle" 
                  checked={currentClass?.isSociogramActive || false}
                  onCheckedChange={handleToggleChange}
                  disabled={!currentClass}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserX /> Yalnız Öğrenciler</CardTitle>
                <CardDescription>Sınıfta hiç kimse tarafından seçilmeyen öğrenciler.</CardDescription>
            </CardHeader>
            <CardContent>
                {analysis.isolated.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {analysis.isolated.map(s => <Badge key={s.id} variant="destructive">{s.name}</Badge>)}
                    </div>
                ) : <p className="text-sm text-muted-foreground">Yalnız öğrenci bulunmuyor.</p>}
            </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCheck /> En Çok Seçilenler</CardTitle>
            <CardDescription>Sınıfın popüler öğrencileri ve onları seçenler.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Öğrenci</TableHead><TableHead>Seçilme Sayısı</TableHead><TableHead>Seçenler</TableHead></TableRow></TableHeader>
                <TableBody>
                    {analysis.popular.filter(p => p.count > 0).map(({student, count, chosenBy}) => (
                        <TableRow key={student?.id}>
                            <TableCell className="font-medium">{student?.name}</TableCell>
                            <TableCell><Badge>{count}</Badge></TableCell>
                            <TableCell className="text-xs">{chosenBy.join(', ')}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             {analysis.popular.filter(p => p.count > 0).length === 0 && <p className="text-sm text-center text-muted-foreground p-4">Henüz kimse seçilmedi.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Karşılıklı Seçimler</CardTitle>
            <CardDescription>Birbirini arkadaş olarak seçen öğrenci çiftleri.</CardDescription>
          </CardHeader>
          <CardContent>
             {analysis.reciprocal.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analysis.reciprocal.map((pair, index) => (
                        <div key={index} className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm font-medium">
                            <span>{pair.student1.name}</span>
                            <span>↔️</span>
                            <span>{pair.student2.name}</span>
                        </div>
                    ))}
                 </div>
             ) : <p className="text-sm text-center text-muted-foreground">Karşılıklı seçim bulunmuyor.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
