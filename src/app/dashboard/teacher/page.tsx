'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const TeacherDashboard = dynamic(
  () => import("@/components/dashboard/teacher/TeacherDashboard").then(mod => mod.TeacherDashboard),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Luminodo Hazırlanıyor...</p>
      </div>
    )
  }
);

export default function TeacherPage() {
  return <TeacherDashboard />;
}
