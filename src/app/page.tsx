"use client";

import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { Logo } from '@/components/icons/Logo';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginPageContent() {
  const { appUser, loading } = useAuth();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'teacher';
  const classCode = searchParams.get('code');

  // AuthProvider yönlendirmeyi halleder. Eğer kullanıcı zaten varsa veya sayfa yükleniyorsa
  // bu bileşen bir "skeleton" göstermemeli, çünkü AuthProvider zaten
  // bir yükleme ekranı gösteriyor ve sonra doğru sayfaya yönlendiriyor.
  // Bu sayfa sadece giriş yapmamış kullanıcılar için render edilmeli.
  if (loading || appUser) {
    return null; // AuthProvider işini yaparken boş bir ekran göster.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Tabs defaultValue={defaultTab} className="w-full max-w-md">
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
              <CardDescription>Öğretmeninizden aldığınız sınıf kodunu ve numaranızı girin.</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentLoginForm defaultClassCode={classCode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
