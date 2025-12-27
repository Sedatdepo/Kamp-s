
"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, RiskFactor } from '@/lib/types';
import { collection, query, doc, updateDoc, addDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RiskMapTabProps {
  classId: string;
}

function RiskFactorManager({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const riskFactorsQuery = useMemo(() => query(collection(db, 'riskFactors')), []);
  const { data: riskFactors, loading: riskFactorsLoading } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingWeight, setEditingWeight] = useState<number>(0);
  
  const [newFactorLabel, setNewFactorLabel] = useState('');
  const [newFactorWeight, setNewFactorWeight] = useState<number>(3);

  const handleStartEdit = (factor: RiskFactor) => {
    setIsEditing(factor.id);
    setEditingLabel(factor.label);
    setEditingWeight(factor.weight);
  };

  const handleCancelEdit = () => setIsEditing(null);

  const handleSaveEdit = async (factorId: string) => {
    if (!editingLabel.trim() || editingWeight <= 0) {
      toast({ variant: 'destructive', title: 'Geçersiz giriş', description: 'Faktör adı boş olamaz ve ağırlık 0 dan büyük olmalı.'});
      return;
    }
    const factorRef = doc(db, 'riskFactors', factorId);
    await updateDoc(factorRef, { label: editingLabel, weight: editingWeight });
    setIsEditing(null);
    toast({ title: 'Risk faktörü güncellendi!' });
  };

  const handleDelete = async (factorId: string) => {
    if (window.confirm('Bu faktörü silmek istediğinize emin misiniz?')) {
        await deleteDoc(doc(db, 'riskFactors', factorId));
        toast({ title: 'Risk faktörü silindi', variant: 'destructive' });
    }
  };
  
  const handleAddFactor = async () => {
      if (!newFactorLabel.trim() || newFactorWeight <= 0) {
        toast({ variant: 'destructive', title: 'Geçersiz giriş', description: 'Faktör adı boş olamaz ve ağırlık 0 dan büyük olmalı.'});
        return;
      }
      await addDoc(collection(db, 'riskFactors'), {
          label: newFactorLabel,
          weight: newFactorWeight,
          teacherId: teacherId // Genel faktörler için de bir sahip belirtilebilir.
      });
      setNewFactorLabel('');
      setNewFactorWeight(3);
      toast({ title: 'Yeni risk faktörü eklendi!' });
  }

  if (riskFactorsLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Risk Faktörleri Yönetimi</CardTitle>
        <CardDescription>Öğrenci risklerini belirlemek için kullanılacak faktörleri ve ağırlıklarını yönetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {riskFactors.map(factor => (
            isEditing === factor.id ? (
                <div key={factor.id} className="flex gap-2 items-center p-2 bg-slate-100 rounded-lg">
                    <Input value={editingLabel} onChange={e => setEditingLabel(e.target.value)} className="h-9"/>
                    <Input type="number" value={editingWeight} onChange={e => setEditingWeight(Number(e.target.value))} className="h-9 w-20"/>
                    <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(factor.id)}><Save className="h-5 w-5 text-green-600"/></Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="h-5 w-5 text-red-600"/></Button>
                </div>
            ) : (
                <div key={factor.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                    <span className="font-medium">{factor.label}</span>
                    <div className="flex items-center gap-4">
                        <Badge variant="destructive">Ağırlık: {factor.weight}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(factor)}><Edit className="h-4 w-4"/></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(factor.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                    </div>
                </div>
            )
        ))}
         <div className="flex gap-2 items-center pt-4 border-t">
            <Input value={newFactorLabel} onChange={e => setNewFactorLabel(e.target.value)} placeholder="Yeni Faktör Adı" className="h-9"/>
            <Input type="number" value={newFactorWeight} onChange={e => setNewFactorWeight(Number(e.target.value))} className="h-9 w-24" placeholder="Ağırlık"/>
            <Button onClick={handleAddFactor}><Plus className="mr-2 h-4 w-4"/> Ekle</Button>
        </div>
      </CardContent>
    </Card>
  );
}


export function RiskMapTab({ classId }: RiskMapTabProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();

  const classQuery = useMemo(() => doc(db, 'classes', classId), [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`classes/${classId}`, classQuery);
  const currentClass = classData.length > 0 ? classData[0] : null;

  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const riskFactorsQuery = useMemo(() => query(collection(db, 'riskFactors')), []);
  const { data: riskFactors, loading: factorsLoading } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);

  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', classId);
    try {
      await updateDoc(classRef, { isRiskFormActive: checked });
      toast({
        title: 'Başarılı',
        description: `Risk formu ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Güncelleme sırasında bir sorun oluştu.',
      });
    }
  };

  const getRiskScore = (studentRisks: string[]) => {
    return studentRisks.reduce((total, riskId) => {
      const factor = riskFactors.find(f => f.id === riskId);
      return total + (factor?.weight || 0);
    }, 0);
  };
  
  const getRiskColor = (score: number) => {
    if (score > 10) return 'bg-red-100 text-red-800';
    if (score > 5) return 'bg-yellow-100 text-yellow-800';
    return '';
  };


  const isLoading = classLoading || studentsLoading || factorsLoading;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline">Risk Haritası</CardTitle>
                <CardDescription>Öğrencilerin risk faktörlerini ve toplam risk puanlarını görüntüleyin.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="risk-form-toggle"
                  checked={currentClass?.isRiskFormActive || false}
                  onCheckedChange={handleToggleChange}
                  disabled={classLoading}
                />
                <Label htmlFor="risk-form-toggle">Form Aktif</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
                <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Öğrenci</TableHead>
                    <TableHead>Risk Faktörleri</TableHead>
                    <TableHead className="text-right">Risk Puanı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? students.map(student => {
                    const riskScore = getRiskScore(student.risks);
                    return (
                      <TableRow key={student.id} className={getRiskColor(riskScore)}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {student.risks.length > 0 ? student.risks.map(riskId => {
                              const factor = riskFactors.find(f => f.id === riskId);
                              return factor ? (
                                <Tooltip key={riskId}>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary">{factor.label}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ağırlık: {factor.weight}</p>
                                    </TooltipContent>
                                </Tooltip>
                              ) : null;
                            }) : <span className="text-xs text-muted-foreground">Risk yok</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                            {riskScore > 0 ? (
                                <div className="flex items-center justify-end gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                    <span>{riskScore}</span>
                                </div>
                            ): <span>{riskScore}</span>}
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Bu sınıfta öğrenci bulunmuyor.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>
       <div>
            { appUser?.type === 'teacher' && <RiskFactorManager teacherId={appUser.data.uid} /> }
        </div>
    </div>
  );
}
