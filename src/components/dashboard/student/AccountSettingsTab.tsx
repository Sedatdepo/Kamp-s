
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
import { Loader2, KeyRound, BellOff, Bell } from 'lucide-react';
import { createUserWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Şifreler uyuşmuyor.',
  path: ['confirmPassword'],
});

const NotificationSettings = () => {
    const { 
        isNotificationPermissionGranted, 
        requestNotificationPermission, 
        isSubscribing,
        unsubscribeFromNotifications,
        error
    } = usePushNotifications();

    if (error) {
        return <p className="text-sm text-destructive">Bildirim hatası: {error.message}</p>
    }

    if (isNotificationPermissionGranted === null) {
        return <div className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Durum kontrol ediliyor...</div>;
    }

    if (isNotificationPermissionGranted) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Bu cihazda anlık bildirimlere izin verilmiş.</p>
                <Button onClick={unsubscribeFromNotifications} variant="outline" disabled={isSubscribing}>
                    {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
                    Bildirimleri Devre Dışı Bırak
                </Button>
                 <p className="text-xs text-muted-foreground">Bu cihaz için bildirimleri kapatır. Bildirimleri tamamen engellemek için tarayıcı ayarlarını kullanın.</p>
            </div>
        )
    }
    
    if (Notification.permission === 'denied') {
        return <p className="text-sm text-red-600 font-medium">Bildirimler tarayıcı ayarlarından engellenmiş. Lütfen tarayıcı ayarlarından izin verin.</p>
    }

    return (
        <Button onClick={requestNotificationPermission} disabled={isSubscribing}>
            {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            Anlık Bildirimleri Etkinleştir
        </Button>
    )
}

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
    <div className="grid gap-6">
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
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Bell />
                    Bildirim Ayarları
                </CardTitle>
                <CardDescription>
                    Ödevler, duyurular ve diğer önemli güncellemelerden anında haberdar olmak için bildirimlere izin verin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <NotificationSettings />
            </CardContent>
        </Card>
    </div>
  );
}
