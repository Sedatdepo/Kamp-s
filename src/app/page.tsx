"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';
import { Logo } from '@/components/icons/Logo';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && appUser?.type === 'teacher') {
      router.push('/dashboard/teacher');
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
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Öğretmen Girişi</CardTitle>
            <CardDescription>Yönetim panelinize erişmek için bilgilerinizi girin.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
