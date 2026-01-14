'use client';

import { AuthProvider } from '@/context/AuthContext';
import { FirebaseClientProvider } from '@/firebase';

function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>{children}</AuthProvider>
        </FirebaseClientProvider>
    );
}


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>{children}</ClientProviders>
  );
}
