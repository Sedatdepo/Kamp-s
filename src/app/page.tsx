
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { Logo } from '@/components/icons/Logo';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'student' ? 'student' : 'teacher';

  useEffect(() => {
    if (!loading && appUser?.type === 'teacher') {
      router.push('/dashboard/teacher');
    } else if (!loading && appUser?.type === 'student') {
        router.push('/dashboard/student');
    }
  }, [appUser, loading, router]);


  if (loading || appUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
            KAMPÜS
          </h1>
          <p className="text-muted-foreground">Okul asistanınız burada başlıyor.</p>
        </div>
        <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teacher">Öğretmen Girişi</TabsTrigger>
                <TabsTrigger value="student">Öğrenci Girişi</TabsTrigger>
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
                    <CardDescription>Size verilen bilgilerle panele giriş yapın.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StudentLoginForm />
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
