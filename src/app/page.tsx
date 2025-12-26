"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherLoginForm } from '@/components/auth/TeacherLoginForm';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { Logo } from '@/components/icons/Logo';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && appUser) {
      if (appUser.type === 'teacher') {
        router.push('/dashboard/teacher');
      } else if (appUser.type === 'student' && appUser.data.needsPasswordChange) {
        router.push('/auth/change-password');
      } else if (appUser.type === 'student') {
        router.push('/dashboard/student');
      }
    }
  }, [appUser, loading, router]);

  if (loading || (!loading && appUser)) {
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
            CampusConnect
          </h1>
          <p className="text-muted-foreground">Your school assistant starts here.</p>
        </div>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="student">Student</TabsTrigger>
        </TabsList>
        <TabsContent value="teacher">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Teacher Login</CardTitle>
              <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <TeacherLoginForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Student Login</CardTitle>
              <CardDescription>Select your class and enter your details to log in.</CardDescription>
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
