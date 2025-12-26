"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!appUser || appUser.type !== 'teacher')) {
      router.push('/');
    }
  }, [appUser, loading, router]);

  if (loading || !appUser || appUser.type !== 'teacher') {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <Skeleton className="h-12 w-1/4" />
        <div className="flex gap-4">
            <Skeleton className="h-screen w-64 hidden md:block" />
            <Skeleton className="h-screen flex-1" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
