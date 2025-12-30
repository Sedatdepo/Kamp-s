
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
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler uyuşmuyor.',
  path: ['confirmPassword'],
});

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { createStudentAuthAccount } = useAuth();
  const router = useRouter();

  const [tempStudent, setTempStudent] = useState<{ studentId: string, classCode: string } | null>(null);

  useEffect(() => {
    const storedStudent = localStorage.getItem('tempStudent');
    if (storedStudent) {
      setTempStudent(JSON.parse(storedStudent));
    } else {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Şifre değiştirme bilgisi bulunamadı. Lütfen tekrar giriş yapın.',
      });
      router.push('/');
    }
  }, [router, toast]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!tempStudent) {
        toast({ variant: 'destructive', title: 'Öğrenci bilgisi bulunamadı.'});
        return;
    }
    
    setIsLoading(true);
    try {
      await createStudentAuthAccount(tempStudent.studentId, tempStudent.classCode, values.password);
      toast({
        title: 'Başarılı!',
        description: 'Şifreniz oluşturuldu. Panele yönlendiriliyorsunuz...',
      });
      // AuthContext will handle redirection
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Şifre Oluşturma Başarısız',
        description: error.message || 'Bilinmeyen bir hata oluştu.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!tempStudent) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni Şifre (en az 6 karakter)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni Şifreyi Onayla</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Şifreyi Kaydet ve Giriş Yap
        </Button>
      </form>
    </Form>
  );
}
