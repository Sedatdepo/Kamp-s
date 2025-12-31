"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student } from '@/lib/types';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Grid } from 'lucide-react';

export function SeatingPlanTab() {
  const { appUser, db } = useAuth();
  if (appUser?.type !== 'student') return null;

  const studentId = appUser.data.id;
  const classId = appUser.data.classId;

  const classQuery = useMemo(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, loading: classLoading } = useFirestore<Class>(`class-seating-plan-${classId}`, classQuery);

  const studentsQuery = useMemo(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, loading: studentsLoading } = useFirestore<Student[]>(`students-in-class-for-plan-${classId}`, studentsQuery);

  const { seatingPlan, rowCount, colCount } = useMemo(() => {
    if (!currentClass?.seatingPlan || !students) {
      return { seatingPlan: {}, rowCount: 0, colCount: 0 };
    }
    const plan: { [key: string]: Student } = {};
    for (const key in currentClass.seatingPlan) {
      const studentId = currentClass.seatingPlan[key];
      const student = students.find(s => s.id === studentId);
      if (student) {
        plan[key] = student;
      }
    }
    return {
      seatingPlan: plan,
      rowCount: currentClass.seatingPlanRows || 0,
      colCount: currentClass.seatingPlanCols || 0,
    };
  }, [currentClass, students]);

  if (classLoading || studentsLoading) {
    return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  if (!seatingPlan || Object.keys(seatingPlan).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Grid /> Oturma Planı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Henüz bir oturma planı oluşturulmadı.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><Grid /> Sınıf Oturma Planı</CardTitle>
        <CardDescription>Sınıftaki yerini ve arkadaşlarının yerlerini aşağıda görebilirsin. Kendi sıran vurgulanmıştır.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md">
          <span className="font-bold tracking-widest text-lg">TAHTA</span>
        </div>
        <div className="flex-1 flex justify-center items-start overflow-x-auto p-4">
          <div
            className="grid gap-4 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`,
              gridTemplateRows: `repeat(${rowCount}, 1fr)`,
            }}
          >
            {Array.from({ length: rowCount }).map((_, r) =>
              Array.from({ length: colCount }).map((_, c) => (
                <div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">
                  {[0, 1].map((side) => {
                    const key = `${r}-${c}-${side}`;
                    const student = seatingPlan[key];
                    const isMySeat = student?.id === studentId;
                    return (
                      <div
                        key={key}
                        className={`flex-1 rounded-md flex flex-col items-center justify-center text-center transition-all duration-200 ${
                          student
                            ? 'bg-background border-2 shadow-sm'
                            : 'bg-white/50 border-2 border-dashed border-amber-400/50'
                        } ${isMySeat ? 'border-primary ring-2 ring-primary' : 'border-primary/20'}`}
                      >
                        {student ? (
                          <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
                            <span className={`text-[11px] font-bold line-clamp-2 leading-tight ${isMySeat ? 'text-primary' : 'text-slate-800'}`}>
                              {student.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                                {student.number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-500/50 text-xs select-none pointer-events-none">
                            Boş
                          </span>
                        )}
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
