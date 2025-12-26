"use client";

import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { RiskFactor } from '@/lib/types';
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
  
  const riskFactorsQuery = query(collection(db, 'riskFactors'));
  const { data: riskFactors, loading: riskFactorsLoading } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);

  if (appUser?.type !== 'student') return null;
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
