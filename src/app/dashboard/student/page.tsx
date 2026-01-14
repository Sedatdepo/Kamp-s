
'use client';

import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPage() {
    const { appUser, loading } = useAuth();

    // Üst layout, kullanıcının 'student' tipinde olduğunu garanti eder.
    // Bu sayfa bileşeni ise, veri-yoğun dashboard'u render etmeden önce son bir kontrol sağlar.
    // Yüklemenin bitmesini VE appUser nesnesinin ve onun kritik verisi olan classId'nin
    // tamamen hazır olmasını beklemeliyiz.
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
    
    // StudentDashboard'u render ettiğimizde, hem `appUser` hem de `appUser.data.classId`'nin
    // varlığından ve geçerliliğinden kesinlikle eminiz.
    return <StudentDashboard />;
}
