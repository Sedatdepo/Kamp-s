

"use client";

import { useState, useEffect, useMemo, useContext } from 'react';
import { onSnapshot, doc, collection, query, getDoc, getDocs, Firestore, DocumentData, DocumentReference, CollectionReference, Query, DocumentSnapshot, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { AuthContext } from '@/context/AuthContext';

// Cache to store Firestore data
const cache = new Map<string, any>();

interface UseFirestoreResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFirestore<T>(
  key: string,
  ref: DocumentReference | CollectionReference | Query | null,
  options: { subscribe: boolean, dependencies?: any[] } = { subscribe: true, dependencies: [] }
): UseFirestoreResult<T> {
  const [data, setData] = useState<T | null>(cache.get(key) || null);
  const [loading, setLoading] = useState<boolean>(!cache.has(key));
  const [error, setError] = useState<Error | null>(null);

  const deps = [key, options.subscribe, ...(options.dependencies || [])];

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    if (cache.has(key)) {
        setData(cache.get(key));
        setLoading(false);
    } else {
        setLoading(true);
    }
    
    if (options.subscribe) {
      const unsubscribe = onSnapshot(ref as any, (snapshot: DocumentSnapshot<DocumentData> | QuerySnapshot<DocumentData>) => {
        if ('docs' in snapshot) { // QuerySnapshot
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          cache.set(key, items);
          setData(items as T);
        } else { // DocumentSnapshot
          const item = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
          cache.set(key, item);
          setData(item as T);
        }
        setLoading(false);
      }, (err: FirestoreError) => {
        console.error(`Firestore subscription error for key "${key}":`, err);
        setError(err);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      const getAsync = async () => {
        try {
          if ((ref as DocumentReference).type === "document") {
              const snapshot = await getDoc(ref as DocumentReference);
              const item = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
              cache.set(key, item);
              setData(item as T);
          } else {
              const snapshot = await getDocs(ref as Query);
              const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              cache.set(key, items);
              setData(items as T);
          }
        } catch (err: any) {
          console.error(`Firestore fetch error for key "${key}":`, err);
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      getAsync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}


