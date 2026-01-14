
'use client';

import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPage() {
    const { appUser, loading } = useAuth();

    // The layout only ensures the user is a student type.
    // This page component provides the final gate before rendering the data-heavy dashboard.
    // We must wait for loading to be false AND for the appUser object and its critical data (like classId) to be fully available.
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
    
    // By the time we render StudentDashboard, we are certain that appUser and appUser.data.classId exist.
    return <StudentDashboard />;
}
