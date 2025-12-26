"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FirestoreData<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestore<T>(collectionName: string, firestoreQuery?: Query<DocumentData>): FirestoreData<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If a query is provided but its parameters aren't ready, don't run.
    // E.g., if a query depends on a selectedClassId which is initially null.
    if (firestoreQuery === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = firestoreQuery || query(collection(db, collectionName));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        console.error(`Error fetching collection ${collectionName}:`, err);
      }
    );

    return () => unsubscribe();
  }, [collectionName, firestoreQuery]);

  return { data, loading, error };
}
