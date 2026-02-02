'use client';

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseClientProvider, useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { DatabaseContext, initialDb, type Database } from '@/hooks/use-database';

function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { appUser, loading: authLoading } = useAuth();
  const dbInstance = useFirestore();

  const [db, setDb] = useState<Database>(initialDb);
  const [loading, setLoading] = useState(true);

  // Real-time listener for teacher's data document
  useEffect(() => {
    if (authLoading || !dbInstance) {
        setLoading(true);
        return;
    }

    if (appUser?.type !== 'teacher') {
        // Not a teacher or not logged in, use local initial state and stop loading.
        setDb(initialDb); 
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const teacherDataRef = doc(dbInstance, 'teacherData', appUser.data.uid);
    
    const unsubscribe = onSnapshot(teacherDataRef, (docSnap) => {
        if (docSnap.exists()) {
            const remoteData = docSnap.data() as Database;
            // Merge with initialDb to prevent crashes if new fields are added to the type
            setDb({ ...initialDb, ...remoteData });
        } else {
            // Document doesn't exist, create it with initialDb
            setDoc(teacherDataRef, initialDb);
            setDb(initialDb);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching teacher data:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [appUser, authLoading, dbInstance]);


  const updateDatabase = useCallback(async (newDbState: Database) => {
      if (appUser?.type !== 'teacher' || !dbInstance) {
          console.warn("Attempted to save data without a logged-in teacher.");
          return;
      }
      
      const teacherDataRef = doc(dbInstance, 'teacherData', appUser.data.uid);
      try {
          // Use setDoc with merge to only update fields, not overwrite the whole doc
          await setDoc(teacherDataRef, newDbState, { merge: true });
      } catch (error) {
          console.error("Failed to save database to Firestore:", error);
      }
  }, [appUser, dbInstance]);

  const memoizedSetDb = useCallback((value: React.SetStateAction<Database>) => {
    setDb(prevState => {
        const newState = typeof value === 'function' ? value(prevState) : value;
        // After updating local state, push to Firestore
        updateDatabase(newState);
        return newState;
    });
  }, [updateDatabase]);

  const value = { db, setDb: memoizedSetDb, loading: loading || authLoading };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <FirebaseClientProvider>
            <AuthProvider>
              <DatabaseProvider>{children}</DatabaseProvider>
            </AuthProvider>
        </FirebaseClientProvider>
    );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>{children}</ClientProviders>
  );
}
