"use client";

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const formSchema = z.object({
  teacherId: z.string().min(1, { message: 'Lütfen öğretmeninizi seçin.' }),
  classId: z.string().min(1, { message: 'Lütfen sınıfınızı seçin.' }),
  studentId: z.string().min(1, { message: 'Lütfen adınızı seçin.' }),
  studentNumber: z.string().min(1, { message: 'Şifre olarak öğrenci numarası gereklidir.' }),
});

export function StudentLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInStudent } = useAuth();
  
  const { data: teachers, loading: teachersLoading } = useFirestore<TeacherProfile>('teachers');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacherId: '',
      classId: '',
      studentId: '',
      studentNumber: '',
    },
  });

  const selectedTeacherId = form.watch('teacherId');
  const selectedClassId = form.watch('classId');

  const classesQuery = useMemo(() => {
    if (!selectedTeacherId) return null;
    return query(collection(db, 'classes'), where('teacherId', '==', selectedTeacherId));
  }, [selectedTeacherId]);
  const { data: classes, loading: classesLoading } = useFirestore<Class>(`classes-for-teacher-${selectedTeacherId}`, classesQuery);

  const studentsQuery = useMemo(() => {
    if (!selectedClassId) return null;
    return query(collection(db, 'students'), where('classId', '==', selectedClassId));
  }, [selectedClassId]);
  const { data: studentsInClass, loading: studentsLoading } = useFirestore<Student>(`students-in-class-${selectedClassId}`, studentsQuery);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInStudent(values.studentId, values.studentNumber);
      toast({
        title: 'Giriş Başarılı',
        description: 'Hoş geldin! Panele yönlendiriliyorsun...',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description: error.message || 'Girdiğiniz bilgiler hatalı.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="teacherId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Öğretmen</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); form.setValue('classId', ''); form.setValue('studentId', ''); }} value={field.value} disabled={teachersLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Öğretmeninizi seçin..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachersLoading ? (
                    <div className='p-2 space-y-2'>
                        <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} - ({t.schoolName})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sınıf</FormLabel>
              <Select onValueChange={(value) => { field.onChange(value); form.setValue('studentId', ''); }} value={field.value} disabled={!selectedTeacherId || classesLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedTeacherId ? "Önce öğretmen seçin..." : "Sınıfınızı seçin..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classesLoading ? (
                    <div className='p-2 space-y-2'>
                        <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
               <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClassId || studentsLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedClassId ? "Önce sınıf seçin..." : "Adınızı seçin..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {studentsLoading ? (
                     <div className='p-2 space-y-2'>
                        <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    studentsInClass.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre (Öğrenci Numaranız)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş Yap
        </Button>
      </form>
    </Form>
  );
}
