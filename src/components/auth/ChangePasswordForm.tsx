"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import bcrypt from 'bcryptjs';

const formSchema = z.object({
  newPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ['confirmPassword'],
});

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { appUser } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (appUser?.type !== 'student') {
      toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci olarak giriş yapmadınız.' });
      return;
    }

    setIsLoading(true);
    try {
      const studentRef = doc(db, 'students', appUser.data.id);
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(values.newPassword, salt);

      await updateDoc(studentRef, {
        password: hashedPassword,
        needsPasswordChange: false,
      });

      toast({
        title: 'Şifre Güncellendi',
        description: 'Artık panonuza erişebilirsiniz.',
      });
      router.push('/dashboard/student');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Güncelleme Başarısız',
        description: 'Bilinmeyen bir hata oluştu.',
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
