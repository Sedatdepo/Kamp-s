"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  classCode: z.string().min(6, 'Sınıf kodu 6 karakter olmalıdır.').max(6, 'Sınıf kodu 6 karakter olmalıdır.'),
  schoolNumber: z.string().min(1, { message: 'Okul numarası gereklidir.' }),
  password: z.string().min(1, { message: 'Şifre gereklidir.' }),
});

export function StudentLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInStudent } = useAuth();
  const searchParams = useSearchParams();
  const classCodeParam = searchParams.get('code');
  const isInvite = searchParams.get('invite');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classCode: classCodeParam || '',
      schoolNumber: '',
      password: '',
    },
  });

  useEffect(() => {
    if(classCodeParam){
        form.setValue('classCode', classCodeParam);
    }
  }, [classCodeParam, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInStudent(values.classCode, values.schoolNumber, values.password);
      // Başarılı giriş sonrası yönlendirme AuthContext tarafından yapılacak.
    } catch (error: any) {
      let description = 'Giriş bilgileri hatalı veya eksik.';
       if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Okul numarası veya şifre yanlış.';
      } else if (error.code === 'student-not-found') {
        description = 'Bu sınıf koduna ait böyle bir öğrenci bulunamadı.';
      } else if (error.code === 'class-not-found') {
        description = 'Geçersiz sınıf kodu. Lütfen kontrol edin.';
      }
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
        {isInvite && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Hoş Geldiniz!</AlertTitle>
                <AlertDescription>
                    Öğretmeniniz sizi sınıfa davet etti. Giriş yapmak için bilgilerinizi doldurun.
                </AlertDescription>
            </Alert>
        )}
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="classCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sınıf Kodu</FormLabel>
                <FormControl>
                    <Input placeholder="Öğretmeninizin verdiği kod" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="schoolNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Okul Numarası</FormLabel>
                <FormControl>
                    <Input placeholder="123" {...field} />
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
                <FormLabel>Şifre</FormLabel>
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
    </div>
  );
}
