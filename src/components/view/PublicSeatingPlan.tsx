
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, getDoc, getDocs } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Student, Class } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PublicSeatingPlan({ classCode }: { classCode: string }) {
  const { db } = useAuth();
  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !classCode) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // 1. Get classId from classCode
        const classCodeRef = doc(db, 'classCodes', classCode);
        const classCodeSnap = await getDoc(classCodeRef);

        if (!classCodeSnap.exists()) {
          throw new Error('Geçersiz veya süresi dolmuş bir davet kodu girdiniz.');
        }
        const classId = classCodeSnap.data().classId;

        // 2. Get Class Data
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists() || !classSnap.data().isSeatingPlanPublished) {
          throw new Error('Bu oturma planı şu anda paylaşıma açık değil.');
        }
        const fetchedClassData = { id: classSnap.id, ...classSnap.data() } as Class;
        setClassData(fetchedClassData);

        // 3. Get Students for that class
        const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
        const studentsSnapshot = await getDocs(studentsQuery);
        const fetchedStudents: Student[] = [];
        studentsSnapshot.forEach(doc => {
          fetchedStudents.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(fetchedStudents);

      } catch (err: any) {
        setError(err.message || 'Veri alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db, classCode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardHeader className="flex-row items-center gap-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <CardTitle className="text-destructive">Paylaşım Hatası</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!classData) {
    return <p className="text-center text-muted-foreground">Oturma planı bulunamadı.</p>;
  }

  const { seatingPlan = {}, seatingPlanRows: rowCount = 4, seatingPlanCols: colCount = 3 } = classData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-2xl">{classData.name} Sınıfı Oturma Planı</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col">
          <div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md">
              <span className="font-bold tracking-widest text-lg">TAHTA</span>
          </div>
          <div className="flex-1 flex justify-center items-start overflow-x-auto p-4">
              <div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)` }}>
                  {Array.from({ length: rowCount }).map((_, r) =>
                      Array.from({ length: colCount }).map((_, c) => (
                          <div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">
                              {[0, 1].map((side) => {
                                  const key = `${r}-${c}-${side}`;
                                  const studentId = seatingPlan[key];
                                  const student = students.find(s => s.id === studentId);
                                  return (
                                      <div key={key} className="flex-1 flex items-center justify-center bg-white rounded-md shadow-sm">
                                         <span className="text-sm font-medium text-center p-1">{student ? student.name : 'Boş'}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      ))
                  )}
              </div>
          </div>
      </CardContent>
    </Card>
  );
}
