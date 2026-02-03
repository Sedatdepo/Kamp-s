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
    if (!loading && (!appUser || appUser.type !== 'student')) {
      router.push('/');
    }
  }, [appUser, loading, router]);

  if (loading || !appUser || appUser.type !== 'student') {
    return (
        <div className="flex flex-col min-h-screen w-full bg-muted/40">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
          </main>
        </div>
    );
  }

  return <>{children}</>;
}
