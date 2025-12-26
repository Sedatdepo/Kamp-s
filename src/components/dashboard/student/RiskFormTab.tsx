"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { RiskFactor, Class } from '@/lib/types';
import { collection, doc, updateDoc, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function RiskFormTab() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const { data: classes, loading: classLoading } = useFirestore<Class>('classes');
  const studentClass = useMemo(() => classes.find(c => c.id === appUser.data.classId), [classes, appUser.data.classId]);

  const riskFactorsQuery = useMemo(() => {
    if (!studentClass?.teacherId) return null;
    return query(collection(db, 'riskFactors'));
  }, [studentClass]);
  const { data: riskFactors, loading: riskFactorsLoading } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);

  const studentRisks = appUser.data.risks || [];

  const handleRiskChange = async (riskId: string, isChecked: boolean) => {
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
