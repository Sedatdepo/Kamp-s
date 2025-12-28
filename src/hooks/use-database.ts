'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnnualPlan, DilekceDocument } from '@/lib/types';

// localStorage anahtarı
const DB_KEY = 'ito_kampus_database';

// Veritabanı yapısı
interface Database {
  annualPlans: AnnualPlan[];
  dilekceDocuments: DilekceDocument[];
}

// Varsayılan boş veritabanı
const initialDb: Database = {
  annualPlans: [],
  dilekceDocuments: [],
};

export const useDatabase = () => {
  const [db, setDb] = useState<Database>(initialDb);
  const [loading, setLoading] = useState(true);

  // Component mount olduğunda localStorage'dan veriyi yükle
  useEffect(() => {
    try {
      const storedDb = localStorage.getItem(DB_KEY);
      if (storedDb) {
        const parsedDb = JSON.parse(storedDb);
        // Ensure all parts of the initialDb are present in the loaded data
        setDb({ ...initialDb, ...parsedDb });
      } else {
        // Eğer localStorage boşsa, başlangıç verisiyle doldur
        localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
        setDb(initialDb);
      }
    } catch (error) {
      console.error("Failed to load database from localStorage:", error);
      // Hata durumunda varsayılan DB'yi kullan
      setDb(initialDb);
    } finally {
      setLoading(false);
    }
  }, []);

  // `db` state'i her değiştiğinde localStorage'ı güncelle
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

  return { db, setDb: memoizedSetDb, loading };
};
