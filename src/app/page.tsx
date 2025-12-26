"use client";

import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { Logo } from '@/components/icons/Logo';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { appUser, loading } = useAuth();

  // AuthProvider yönlendirmeyi hallederken, bu sayfa sadece bir yükleme durumu göstermelidir.
  // Kullanıcı zaten doğrulanmışsa, AuthProvider onu zaten yönlendirmiş olacaktır.
  if (loading || appUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="mt-4 h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue="teacher" className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
            İTO KAMPÜS
          </h1>
          <p className="text-muted-foreground">Okul asistanınız burada başlıyor.</p>
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teacher">Öğretmen</TabsTrigger>
          <TabsTrigger value="student">Öğrenci</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Öğretmen Girişi</CardTitle>
              <CardDescription>Yönetim panelinize erişmek için bilgilerinizi girin.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherLoginForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Öğrenci Girişi</CardTitle>
              <CardDescription>Giriş yapmak için sınıfınızı seçin ve bilgilerinizi girin.</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentLoginForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
