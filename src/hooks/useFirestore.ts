
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

    if ('type' in q && q.type === 'document') { // It's a DocumentReference
        return q.path;
    }
    
    if ('type' in q && q.type === 'query') { // It's a Query
         // @ts-ignore: _query is a private property but a pragmatic way to get a representation
        const path = q._query.path.canonical;
         // @ts-ignore
        const filters = JSON.stringify(q._query.filters.map(f => ({p: f.field.canonical, op: f.op, v: f.value})));
         // @ts-ignore
        const limit = q._query.limit;

        return `${path}|${filters}|${limit}`;
    }

    return 'unknown';
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

    // Since the key is now stable, we can set loading state here.
    setLoading(true);

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
        } else if ('id' in snapshot && !snapshot.exists()) {
           // This handles the case of a document that doesn't exist.
           // We can return an empty array or handle as needed.
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
