"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Query, DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FirestoreData<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

// Helper function to create a stable key from a query
const getQueryKey = (q: Query<DocumentData> | DocumentReference<DocumentData> | null | undefined): string => {
    if (!q) return 'null';
    if ('path' in q) { // It's a DocumentReference
        return q.path;
    }
    // It's a Query. This is a simplified serialization.
    // For more complex queries, a more robust serialization might be needed.
    // @ts-ignore: _query is a private property but a pragmatic way to get a representation
    return q.converter + q._query.path.canonical + JSON.stringify(q._query.filters) + JSON.stringify(q._query.orderBy);
}


export function useFirestore<T>(
  collectionOrQueryKey: string, 
  firestoreQuery?: Query<DocumentData> | DocumentReference<DocumentData> | null
): FirestoreData<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const queryKey = getQueryKey(firestoreQuery);

  useEffect(() => {
    if (firestoreQuery === null) {
      setData([]);
      setLoading(false);
      return;
    }

    const q = firestoreQuery || query(collection(db, collectionOrQueryKey));

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
        console.error(`Error fetching collection ${collectionOrQueryKey}:`, err);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionOrQueryKey, queryKey]);

  return { data, loading, error };
}
