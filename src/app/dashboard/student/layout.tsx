
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/dashboard/teacher/Header";

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect ensures that only authenticated students can access this route.
    // If not, it redirects them.
    if (!loading && (!appUser || appUser.type !== 'student')) {
      router.push('/');
    }
  }, [appUser, loading, router]);

  // While loading, or if the user is not a valid student, show a skeleton UI.
  // This prevents any child components from rendering and making premature data requests.
  if (loading || !appUser || appUser.type !== 'student') {
    return (
      <div className="flex flex-col min-h-screen">
         <Header />
         <main className="flex-1 p-4 sm:p-6">
            <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
            </div>
         </main>
      </div>
    );
  }
  
  // Once the user is confirmed to be a student, render the page component.
  // The actual data fetching logic is now safely inside the `children` (page.tsx).
  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
    </div>
  );
}
