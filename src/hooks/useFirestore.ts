"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Query, DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FirestoreData<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useFirestore<T>(
  collectionName: string, 
  firestoreQuery?: Query<DocumentData> | DocumentReference<DocumentData> | null
): FirestoreData<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (firestoreQuery === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = firestoreQuery || query(collection(db, collectionName));

    const unsubscribe = onSnapshot(q as any, // Cast to any to handle both signatures
      (snapshot) => {
        const items: T[] = [];
        if ('docs' in snapshot) { // This is a QuerySnapshot
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as T);
          });
        } else if (snapshot.exists()) { // This is a DocumentSnapshot
          items.push({ id: snapshot.id, ...snapshot.data() } as T);
        }
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
