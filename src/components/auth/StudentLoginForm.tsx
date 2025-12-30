
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';


const formSchema = z.object({
  classCode: z.string().min(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }).max(6, { message: 'Sınıf kodu 6 karakter olmalıdır.' }),
  studentNumber: z.string().min(1, { message: 'Lütfen öğrenci numaranızı girin.' }),
  password: z.string().min(1, { message: 'Lütfen şifrenizi girin.' }),
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
      password: '',
    },
  });

  useEffect(() => {
    if (classCodeFromUrl) {
      form.setValue('classCode', classCodeFromUrl.toUpperCase());
    }
  }, [classCodeFromUrl, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInStudent(values.classCode.toUpperCase(), values.studentNumber, values.password);
      // No toast on success, redirection is handled by AuthContext
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
              <FormLabel>Öğrenci Numarası</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Okul Numaranız" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geçici Şifre</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
               <FormDescription className="text-xs">
                İlk girişiniz için geçici şifreniz: <strong>123456</strong>
              </FormDescription>
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
