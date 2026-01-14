
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const formSchema = z.object({
  classCode: z.string().min(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }).max(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }),
  studentNumber: z.string().min(1, { message: 'Lütfen öğrenci numaranızı girin.' }),
});

export function StudentLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInStudent } = useAuth();
  const searchParams = useSearchParams();
  const classCodeFromUrl = searchParams.get('code');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCode: '',
      studentNumber: '',
    },
  });

  useEffect(() => {
    if (classCodeFromUrl) {
      form.setValue('classCode', classCodeFromUrl.trim().toUpperCase());
    }
  }, [classCodeFromUrl, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      // Sanitize input before sending to the auth function
      const cleanClassCode = values.classCode.trim().toUpperCase();
      const cleanStudentNumber = values.studentNumber.trim();
      
      console.log('Attempting login with Class Code:', cleanClassCode, 'and Student Number:', cleanStudentNumber);
      
      await signInStudent(cleanClassCode, cleanStudentNumber);
      // On success, AuthContext will handle navigation.
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description: error.message || 'Girdiğiniz bilgiler hatalı veya sınıf kodu bulunamadı.',
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
              <FormLabel>Öğrenci Numarası (Bu sizin şifrenizdir)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Okul Numaranız" {...field} />
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
