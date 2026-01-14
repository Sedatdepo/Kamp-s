
'use client';

import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentPage() {
    const { appUser, loading } = useAuth();

    // The layout handles the initial loading and redirection.
    // This page component will only render when the user is confirmed to be a student.
    // We add a final check here to ensure appUser.data is fully available before rendering the dashboard
    // which triggers data fetching hooks.
    if (loading || !appUser || appUser.type !== 'student' || !appUser.data.classId) {
        // This skeleton will be shown if for any reason the page is rendered before appUser is fully populated.
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
    
    return <StudentDashboard />;
}
