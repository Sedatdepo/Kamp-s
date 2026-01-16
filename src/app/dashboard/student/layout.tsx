
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
    // Bu effect, yalnızca oturum açmış ve "student" tipindeki kullanıcıların
    // bu yola erişebilmesini sağlar. Aksi takdirde ana sayfaya yönlendirir.
    if (!loading && (!appUser || appUser.type !== 'student')) {
      router.push('/');
    }
  }, [appUser, loading, router]);

  // Kimlik doğrulama durumu yüklenirken veya kullanıcı geçerli bir öğrenci değilse,
  // herhangi bir alt bileşenin (ve onların veri sorgularının) render edilmesini engellemek için
  // tam sayfa bir iskelet arayüz göster.
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
  
  // Kimlik doğrulama başarılı ve kullanıcı bir öğrenci ise,
  // asıl sayfa içeriğini (`children`, yani page.tsx) render et.
  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
    </div>
  );
}
