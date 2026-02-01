'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { FirebaseClientProvider } from '@/firebase';
import { DatabaseContext, DB_KEY, initialDb, type Database } from '@/hooks/use-database';

function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Database>(initialDb);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    setLoading(true);
    try {
      const storedDb = localStorage.getItem(DB_KEY);
      if (storedDb && storedDb.trim().length > 2) {
        const parsedDb = JSON.parse(storedDb);
        // Merge with initialDb to ensure all keys are present and the app doesn't crash on new fields
        setDb({ ...initialDb, ...parsedDb });
      } else {
        localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
        setDb(initialDb);
      }
    } catch (error) {
      console.error("Failed to load or parse database from localStorage, resetting:", error);
      localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
      setDb(initialDb);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      } catch (error) {
        console.error("Failed to save database to localStorage:", error);
      }
    }
  }, [db, loading]);

  const memoizedSetDb = useCallback((value: React.SetStateAction<Database>) => {
    setDb(value);
  }, []);

  const value = { db, setDb: memoizedSetDb, loading };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <DatabaseProvider>
              <AuthProvider>{children}</AuthProvider>
            </DatabaseProvider>
        </FirebaseClientProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>{children}</ClientProviders>
  );
}
