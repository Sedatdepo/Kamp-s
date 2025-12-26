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
      toast({ variant: 'destructive', title: 'Input is empty' });
      return;
    }
    setIsLoading(true);

    const lines = studentList.trim().split('\n');
    const studentsToAdd = lines.map(line => {
      const parts = line.trim().split(' ');
      if (parts.length < 2) return null;
      const number = parts[0];
      const name = parts.slice(1).join(' ');
      return { number, name };
    }).filter(Boolean);

    if (studentsToAdd.length === 0) {
      toast({ variant: 'destructive', title: 'Invalid format', description: 'Please use "Number Name Surname" format.' });
      setIsLoading(false);
      return;
    }

    try {
      const batch = writeBatch(db);
      studentsToAdd.forEach(student => {
        if (student) {
          const studentId = `${classId}_${student.number}`;
          const studentRef = doc(db, 'students', studentId);
          batch.set(studentRef, {
            name: student.name,
            number: student.number,
            classId: classId,
            behaviorScore: 100,
            needsPasswordChange: true,
            password: '1234', // Default password
            assignedLesson: null,
            grades: { term1: null, term2: null },
            projectPreferences: [],
            referrals: [],
            risks: [],
          });
        }
      });
      await batch.commit();
      toast({ title: 'Success', description: `${studentsToAdd.length} students added.` });
      setStudentList('');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add students.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Bulk Add Students</DialogTitle>
          <DialogDescription>
            Paste a list of students below. Each line should be in the format: "Number Name Surname".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="101 John Doe
102 Jane Smith
103 Peter Jones"
            value={studentList}
            onChange={(e) => setStudentList(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleBulkAdd} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
