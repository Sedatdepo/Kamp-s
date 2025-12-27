"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Student } from '@/lib/types';

const formSchema = z.object({
  classCode: z.string().min(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }).max(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }),
  studentNumber: z.string().min(1, { message: 'Lütfen öğrenci numaranızı girin.' }),
});

export function StudentLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInStudent } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCode: '',
      studentNumber: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        // 1. Find the class with the given code
        const classQuery = query(collection(db, 'classes'), where('code', '==', values.classCode.toUpperCase()));
        const classSnapshot = await getDocs(classQuery);

        if (classSnapshot.empty) {
            throw new Error('Bu koda sahip bir sınıf bulunamadı.');
        }
        
        const classDoc = classSnapshot.docs[0];
        const classId = classDoc.id;

        // 2. Find the student in that class with the given number
        const studentQuery = query(
            collection(db, 'students'), 
            where('classId', '==', classId),
            where('number', '==', values.studentNumber)
        );
        const studentSnapshot = await getDocs(studentQuery);

        if (studentSnapshot.empty) {
            throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');
        }

        const studentDoc = studentSnapshot.docs[0];
        const studentId = studentDoc.id;
        
      // 3. Attempt to sign in with studentId and the number as password
      await signInStudent(studentId, values.studentNumber);

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
          name="classCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sınıf Kodu</FormLabel>
              <FormControl>
                 <Input 
                    placeholder="Örn: AB12CD" 
                    {...field} 
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    maxLength={6}
                 />
              </FormControl>
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
