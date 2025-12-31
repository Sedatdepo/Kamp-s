

"use client";

import { useState, useEffect, useMemo, useContext } from 'react';
import { onSnapshot, doc, collection, query, getDoc, getDocs, Firestore, DocumentData, DocumentReference, CollectionReference, Query, DocumentSnapshot, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { AuthContext } from '@/context/AuthContext';

// Cache to store Firestore data
const cache = new Map<string, any>();

interface UseFirestoreResult<T> {
  data: T; // Artık null değil, başlangıçta boş dizi veya nesne olacak
  loading: boolean;
  error: Error | null;
}

// Overload for collections
export function useFirestore<T extends any[]>(
  key: string,
  ref: CollectionReference | Query | null,
  options?: { subscribe?: boolean, dependencies?: any[] }
): UseFirestoreResult<T>;

// Overload for documents
export function useFirestore<T extends object>(
  key: string,
  ref: DocumentReference | null,
  options?: { subscribe?: boolean, dependencies?: any[] }
): UseFirestoreResult<T | null>;


export function useFirestore<T>(
  key: string,
  ref: DocumentReference | CollectionReference | Query | null,
  options: { subscribe?: boolean, dependencies?: any[] } = { subscribe: true, dependencies: [] }
): UseFirestoreResult<T> {
    
  const isDoc = ref && (ref as DocumentReference).type === "document";
  const initialValue = isDoc ? null : [];
    
  const [data, setData] = useState<T>((cache.get(key) || initialValue));
  const [loading, setLoading] = useState<boolean>(!cache.has(key));
  const [error, setError] = useState<Error | null>(null);

  const deps = [key, options.subscribe, ...(options.dependencies || [])];

  useEffect(() => {
    if (!ref) {
      setData(initialValue as T);
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
        let result: any;
        if ('docs' in snapshot) { // QuerySnapshot
          result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else { // DocumentSnapshot
          result = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
        }
        cache.set(key, result);
        setData(result as T);
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
          let result: any;
          if (isDoc) {
              const snapshot = await getDoc(ref as DocumentReference);
              result = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
          } else {
              const snapshot = await getDocs(ref as Query);
              result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
          cache.set(key, result);
          setData(result as T);
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