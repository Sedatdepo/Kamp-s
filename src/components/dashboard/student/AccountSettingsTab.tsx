
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler uyuşmuyor.',
  path: ['confirmPassword'],
});

export function AccountSettingsTab() {
  const { appUser, auth, db } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const hasAuthAccount = !!appUser && appUser.type === 'student' && !!appUser.data.authUid;

  const handleCreateAccount = async (password: string) => {
    if (appUser?.type !== 'student' || !db || !auth) return;
    
    setIsLoading(true);
    const student = appUser.data;
    const email = `s${student.number}@${student.classId.toLowerCase()}.ito-kampus.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "studentCredentials", user.uid), { email, password });
      await updateDoc(doc(db, 'students', student.id), { authUid: user.uid });

      toast({ title: 'Hesap ve Şifre Başarıyla Oluşturuldu!', description: 'Artık hesabınıza bu şifre ile giriş yapabilirsiniz.' });
    } catch (error: any) {
        if(error.code === 'auth/email-already-in-use') {
             toast({ variant: 'default', title: 'Hesap Zaten Mevcut', description: 'Şifrenizi güncelleyebilirsiniz.' });
        } else {
            toast({ variant: 'destructive', title: 'Hesap Oluşturma Hatası', description: error.message });
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdatePassword = async (password: string) => {
      if (appUser?.type !== 'student' || !auth?.currentUser || !db) return;
      
      setIsLoading(true);
      try {
          await updatePassword(auth.currentUser, password);
          await updateDoc(doc(db, "studentCredentials", appUser.data.authUid!), { password });
          toast({ title: 'Şifre Başarıyla Güncellendi!' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Şifre Güncelleme Hatası', description: error.message });
      } finally {
          setIsLoading(false);
      }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (hasAuthAccount) {
      await handleUpdatePassword(values.password);
    } else {
      await handleCreateAccount(values.password);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <KeyRound />
            Hesap ve Şifre Ayarları
        </CardTitle>
        <CardDescription>
            {hasAuthAccount 
                ? 'Mevcut şifrenizi buradan güncelleyebilirsiniz.' 
                : 'Kalıcı bir şifre oluşturarak hesabınızı güvence altına alın ve diğer cihazlardan giriş yapın.'
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasAuthAccount ? 'Şifreyi Güncelle' : 'Şifre Oluştur'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
