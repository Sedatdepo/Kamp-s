

"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RiskFactor, Class } from '@/lib/types';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';

export function RiskFormTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: studentClass, isLoading: classLoading } = useDoc<Class>(classQuery);

  const riskFactorsQuery = useMemoFirebase(() => {
    if (!studentClass?.teacherId || !db) return null;
    // GÜVENLİK DÜZELTMESİ: Sorgu, tüm risk faktörlerini çekmek yerine,
    // sadece o öğrencinin öğretmenine ait olanları getirecek şekilde filtrelendi.
    return query(collection(db, 'riskFactors'), where('teacherId', '==', studentClass.teacherId));
  }, [studentClass?.teacherId, db]);
  const { data: riskFactors, isLoading: riskFactorsLoading } = useCollection<RiskFactor>(riskFactorsQuery);

  const studentRisks = appUser.data.risks || [];

  const handleRiskChange = async (riskId: string, isChecked: boolean) => {
    if (!db || !appUser || appUser.type !== 'student') return;
    const currentRisks = appUser.data.risks || [];
    const newRisks = isChecked ? [...currentRisks, riskId] : currentRisks.filter(r => r !== riskId);
    const studentRef = doc(db, 'students', appUser.data.id);
    try {
        await updateDoc(studentRef, { risks: newRisks });
        toast({ title: 'Güncelleme başarılı' });
    } catch {
        toast({ variant: 'destructive', title: 'Güncelleme başarısız' });
    }
  };

  if (classLoading || !studentClass?.isRiskFormActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Kişisel Risk Faktörleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Risk faktörleri formu şu anda aktif değil. Lütfen öğretmeninizden bilgi alın.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Kişisel Risk Faktörleri</CardTitle>
        <CardDescription>
          Lütfen aşağıdaki durumlardan size uygun olanları işaretleyin. Bu bilgiler gizli tutulacak ve size daha iyi destek olabilmemiz için kullanılacaktır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {riskFactorsLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
          <div className="space-y-4">
            {riskFactors.map(risk => (
              <div key={risk.id} className="flex items-center space-x-3 rounded-md border p-4">
                <Checkbox
                  id={risk.id}
                  checked={studentRisks.includes(risk.id)}
                  onCheckedChange={(checked) => handleRiskChange(risk.id, !!checked)}
                />
                <label htmlFor={risk.id} className="text-sm font-medium leading-none">
                  {risk.label}
                </label>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
