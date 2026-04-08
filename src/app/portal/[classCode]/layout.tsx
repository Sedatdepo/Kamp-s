'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function StudentPortalLayout({ children }: { children: ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        // localStorage'a geçiyoruz
        const authData = localStorage.getItem('student_portal_auth');
        if (!authData) {
            router.replace(`/giris/${classCode}`);
            return;
        }

        try {
            const { student: storedStudent, classCode: storedClassCode } = JSON.parse(authData);
            if (storedClassCode !== classCode || !storedStudent) {
                router.replace(`/giris/${classCode}`);
                return;
            }
        } catch (error) {
            router.replace(`/giris/${classCode}`);
            return;
        }

        setLoading(false);
    }, [classCode, router]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
