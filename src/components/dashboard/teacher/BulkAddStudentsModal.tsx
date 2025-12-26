"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface BulkAddStudentsModalProps {
  classId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkAddStudentsModal({ classId, isOpen, onOpenChange }: BulkAddStudentsModalProps) {
  const [studentList, setStudentList] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBulkAdd = async () => {
    if (!studentList.trim()) {
      toast({ variant: 'destructive', title: 'Giriş alanı boş' });
      return;
    }
    setIsLoading(true);

    const lines = studentList.trim().split('\n');
    const studentsToAdd: { number: string; name: string }[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const firstSpaceIndex = trimmedLine.indexOf(' ');
      if (firstSpaceIndex === -1) {
        toast({ variant: 'destructive', title: 'Geçersiz Format', description: `Satır "${trimmedLine}" "Numara Ad Soyad" formatında değil.` });
        setIsLoading(false);
        return;
      }

      const number = trimmedLine.substring(0, firstSpaceIndex);
      const name = trimmedLine.substring(firstSpaceIndex + 1);

      if (!/^\d+$/.test(number) || !name) {
         toast({ variant: 'destructive', title: 'Geçersiz Format', description: `Satır "${trimmedLine}" "Numara Ad Soyad" formatında değil.` });
        setIsLoading(false);
        return;
      }
      
      studentsToAdd.push({ number, name });
    }

    if (studentsToAdd.length === 0) {
      toast({ variant: 'destructive', title: 'Öğrenci bulunamadı', description: 'Lütfen "Numara Ad Soyad" formatını kullanın.' });
      setIsLoading(false);
      return;
    }

    try {
      const batch = writeBatch(db);

      for (const student of studentsToAdd) {
        const studentId = `${classId}_${student.number}`;
        const studentRef = doc(db, 'students', studentId);
        
        batch.set(studentRef, {
          name: student.name,
          number: student.number,
          classId: classId,
          password: student.number, // Password is the student number
          needsPasswordChange: true,
          behaviorScore: 100,
          assignedLesson: null,
          grades: { term1: null, term2: null },
          projectPreferences: [],
          referrals: [],
          risks: [],
        });
      }

      await batch.commit();
      toast({ title: 'Başarılı', description: `${studentsToAdd.length} öğrenci eklendi.` });
      setStudentList('');
      onOpenChange(false);
    } catch (error) {
      console.error("Bulk add error:", error);
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenciler eklenemedi.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Toplu Öğrenci Ekle</DialogTitle>
          <DialogDescription>
            Aşağıya bir öğrenci listesi yapıştırın. Her satır "Numara Ad Soyad" formatında olmalıdır.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="101 Ahmet Yılmaz
102 Ayşe Kaya
103 Mehmet Demir"
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">İptal</Button>
          </DialogClose>
          <Button onClick={handleBulkAdd} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Öğrencileri Ekle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
