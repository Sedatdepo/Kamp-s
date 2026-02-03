
'use client';

import { PublicSeatingPlan } from '@/components/view/PublicSeatingPlan';
import { Logo } from '@/components/icons/Logo';

export default function PublicSeatingPlanPage({ params }: { params: { classCode: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 lg:p-12 bg-muted/40">
      <div className="w-full max-w-6xl">
        <header className="flex flex-col items-center text-center mb-8">
            <Logo className="h-14 w-14 text-primary" />
            <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground">
                Sınıf Oturma Planı
            </h1>
        </header>
        <PublicSeatingPlan classCode={params.classCode} />
      </div>
    </main>
  );
}
