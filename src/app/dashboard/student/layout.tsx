"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/dashboard/Header";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!appUser || appUser.type !== 'student') {
        router.push('/');
      } else if (appUser.data.needsPasswordChange) {
        router.push('/auth/change-password');
      }
    }
  }, [appUser, loading, router]);

  if (loading || !appUser || appUser.type !== 'student') {
    return (
      <div className="flex flex-col min-h-screen">
         <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
            <div className="ml-auto">
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>
         </header>
         <main className="flex-1 p-4 sm:p-6">
            <Skeleton className="h-96 w-full" />
         </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
    </div>
  );
}
