
"use client";

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  if (loading || appUser?.type === 'teacher') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f14]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f14] p-4 font-sans">
      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Logo - Kartın tam üstünde */}
        <div className="mb-4 transform scale-110">
          <Logo />
        </div>

        <Card className="w-full shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-center text-white">Öğretmen Girişi</CardTitle>
          </CardHeader>
          <CardContent>
            <TeacherLoginForm />
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-slate-500 mt-8">
          Sedat İleri tarafından geliştirildi.
        </p>
      </div>
    </div>
  );
}
