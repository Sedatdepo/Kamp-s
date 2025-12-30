
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  newPassword: z.string().min(1, 'Şifre boş olamaz.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ['confirmPassword'],
});

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { appUser, db } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!db || appUser?.type !== 'student' || !appUser.data.authUid) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci olarak giriş yapmadınız veya veritabanı bağlantısı kurulamadı.' });
      return;
    }

    setIsLoading(true);
    try {
      const studentRef = doc(db, 'students', appUser.data.id);
      
      // Update password, set needsPasswordChange to false, and store the authUid
      await updateDoc(studentRef, {
        password: values.newPassword,
        needsPasswordChange: false,
        authUid: appUser.data.authUid,
      });

      toast({
        title: 'Şifre Güncellendi',
        description: 'Artık panonuza erişebilirsiniz.',
      });
      // The redirection will be handled by AuthContext
      // router.push('/dashboard/student');
    } catch (error: any) {
        console.error("Şifre güncelleme hatası:", error);
      toast({
        variant: 'destructive',
        title: 'Güncelleme Başarısız',
        description: error.message || 'Bilinmeyen bir hata oluştu.',
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
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni Şifre</FormLabel>
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
          Şifreyi Güncelle
        </Button>
      </form>
    </Form>
  );
}
