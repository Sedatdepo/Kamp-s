
'use client';

import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPage() {
    const { appUser, loading } = useAuth();

    // Üst layout, kullanıcının 'student' tipinde olduğunu garanti eder, ancak
    // bu sayfa, veri-yoğun dashboard'u render etmeden önce son bir kontrol sağlar.
    // Yüklemenin bitmesini VE appUser nesnesinin ve onun kritik verisi olan classId'nin
    // tamamen hazır olmasını beklemeliyiz. Bu, tüm alt bileşenlerin ve kancaların
    // (useDoc, useCollection, useNotification) güvenli bir şekilde çalışmasını garanti eder.
    if (loading || !appUser || appUser.type !== 'student' || !appUser.data.classId) {
        return (
            <div className="grid gap-6">
                <Skeleton className="h-24 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                    ))}
                </div>
            </div>
        );
    }
    
    // Bu noktada, hem `appUser` hem de `appUser.data.classId`'nin
    // varlığından ve geçerliliğinden kesinlikle eminiz.
    // StudentDashboard artık güvenle render edilebilir.
    return <StudentDashboard />;
}
