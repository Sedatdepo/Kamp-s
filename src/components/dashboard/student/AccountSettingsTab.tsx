
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
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

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
    
    if (typeof window !== 'undefined' && Notification.permission === 'denied') {
        return <p className="text-sm text-red-600 font-medium">Bildirimler tarayıcı ayarlarından engellenmiş. Lütfen bu site için tarayıcı bildirim ayarlarına manuel olarak izin verin.</p>
    }

    if (isNotificationPermissionGranted) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Bu cihazda anlık bildirimler aktif.</p>
                <Button onClick={unsubscribeFromNotifications} variant="destructive" disabled={isSubscribing}>
                    {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
                    Bildirimleri Kapat
                </Button>
            </div>
        )
    }
    
    return (
        <div className="space-y-3">
             <p className="text-sm text-gray-600 font-medium">Bu cihaz için anlık bildirimler kapalı.</p>
            <Button onClick={requestNotificationPermission} disabled={isSubscribing}>
                {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Bildirimlere İzin Ver
            </Button>
        </div>
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
  
  const handleUpdatePassword = async (password: string) => {
      if (!auth?.currentUser || !db || appUser?.type !== 'student') return;
      
      setIsLoading(true);
      try {
          await updatePassword(auth.currentUser, password);
          
          const studentRef = doc(db, 'students', appUser.data.id);
          await updateDoc(studentRef, {
              needsPasswordChange: false
          });

          toast({ title: 'Şifre Başarıyla Güncellendi!', description: 'Artık paneli kullanabilirsiniz.' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Şifre Güncelleme Hatası', description: 'Bu işlem için yakın zamanda giriş yapmış olmanız gerekebilir. Lütfen çıkış yapıp tekrar deneyin.' });
      } finally {
          setIsLoading(false);
      }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await handleUpdatePassword(values.password);
  };

  if (appUser?.type !== 'student') return null;

  const needsPasswordChange = appUser.data.needsPasswordChange;

  return (
    <div className="grid gap-6">
        {needsPasswordChange && (
            <Card className="border-primary bg-primary/5">
                <CardHeader>
                    <CardTitle className="font-headline text-primary">Hoş Geldiniz!</CardTitle>
                    <CardDescription>
                        Güvenliğiniz için, sisteme ilk girişinizde şifrenizi belirlemeniz gerekmektedir. Mevcut şifreniz okul numaranızdır. Lütfen aşağıdan yeni bir şifre oluşturun.
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <KeyRound />
                    Şifre Değiştirme
                </CardTitle>
                <CardDescription>
                    Mevcut şifrenizi (okul numaranızı) daha güvenli yeni bir şifre ile güncelleyebilirsiniz.
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
                    Şifreyi Güncelle
                    </Button>
                </form>
                </Form>
            </CardContent>
        </Card>
        {!needsPasswordChange && (
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
        )}
    </div>
  );
}
