"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { RiskFactor, Student, Class } from '@/lib/types';
import { collection, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Settings } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { writeBatch } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function RiskMapTab({ classId }: { classId: string }) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [isRiskFactorDialogOpen, setRiskFactorDialogOpen] = useState(false);
  const [newRiskFactorLabel, setNewRiskFactorLabel] = useState('');
  const [newRiskFactorWeight, setNewRiskFactorWeight] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const studentsQuery = useMemo(() => 
    query(collection(db, 'students'), where('classId', '==', classId)),
    [classId]
  );
  const { data: students, loading: studentsLoading } = useFirestore<Student>('students', studentsQuery);

  const riskFactorsQuery = useMemo(() => 
    appUser?.type === 'teacher' ? query(collection(db, 'riskFactors'), where('teacherId', '==', appUser.data.uid)) : null,
    [appUser]
  );
  const { data: riskFactors, loading: riskFactorsLoading } = useFirestore<RiskFactor>('riskFactors', riskFactorsQuery);
  
  const { data: classes } = useFirestore<Class>('classes');
  const currentClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId]);

  const handleRiskChange = async (studentId: string, riskId: string, isChecked: boolean) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const currentRisks = student.risks || [];
    const newRisks = isChecked ? [...currentRisks, riskId] : currentRisks.filter(r => r !== riskId);
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, { risks: newRisks });
  };
  
  const handleAddRiskFactor = async () => {
    if (!newRiskFactorLabel.trim() || !appUser || appUser.type !== 'teacher') return;
    setIsLoading(true);
    try {
        await addDoc(collection(db, 'riskFactors'), {
            label: newRiskFactorLabel,
            weight: newRiskFactorWeight,
            teacherId: appUser.data.uid
        });
        toast({ title: "Başarılı", description: "Risk faktörü eklendi."});
        setRiskFactorDialogOpen(false);
        setNewRiskFactorLabel('');
        setNewRiskFactorWeight(1);
    } catch (e) {
        toast({ variant: 'destructive', title: "Hata", description: "Risk faktörü eklenemedi."});
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleDeleteRiskFactor = async (riskId: string) => {
    const batch = writeBatch(db);
    const riskFactorRef = doc(db, 'riskFactors', riskId);
    batch.delete(riskFactorRef);
    // Öğrencilerden de bu risk faktörünü kaldır
    students.forEach(student => {
        if (student.risks.includes(riskId)) {
            const studentRef = doc(db, 'students', student.id);
            const newRisks = student.risks.filter(r => r !== riskId);
            batch.update(studentRef, { risks: newRisks });
        }
    });
    await batch.commit();
    toast({ title: "Başarılı", description: "Risk faktörü silindi."});
  }

  const handleToggleRiskForm = async (isActive: boolean) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', currentClass.id);
    await updateDoc(classRef, { isRiskFormActive: isActive });
    toast({ title: 'Başarılı', description: `Risk Formu ${isActive ? 'öğrencilere açıldı' : 'öğrencilere kapatıldı'}.` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline">Risk Formu Dönemi</CardTitle>
              <CardDescription>Öğrenciler için risk formu doldurma dönemini açın veya kapatın.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                  id="risk-form-switch"
                  checked={currentClass?.isRiskFormActive || false}
                  onCheckedChange={handleToggleRiskForm}
              />
              <Label htmlFor="risk-form-switch">
                  {currentClass?.isRiskFormActive ? "Aktif" : "Kapalı"}
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Risk Haritası</CardTitle>
              <CardDescription>Her öğrenci için riskleri işaretleyin.</CardDescription>
            </div>
            <Dialog open={isRiskFactorDialogOpen} onOpenChange={setRiskFactorDialogOpen}>
              <DialogTrigger asChild>
                  <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Faktörleri Yönet</Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle className="font-headline">Risk Faktörlerini Yönet</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                      <div className="flex gap-2">
                          <Input placeholder="Yeni faktör adı" value={newRiskFactorLabel} onChange={e => setNewRiskFactorLabel(e.target.value)} />
                          <Input className="w-24" type="number" placeholder="Ağırlık" value={newRiskFactorWeight} onChange={e => setNewRiskFactorWeight(Number(e.target.value))} />
                          <Button onClick={handleAddRiskFactor} disabled={isLoading}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}</Button>
                      </div>
                      <ul className="space-y-2 max-h-64 overflow-y-auto">
                          {riskFactors.map(rf => (
                              <li key={rf.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                  <span>{rf.label} (Ağırlık: {rf.weight})</span>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRiskFactor(rf.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button>Bitti</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto relative">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Öğrenci</TableHead>
                  {riskFactorsLoading ? (
                    <TableHead><Loader2 className="h-4 w-4 animate-spin"/></TableHead>
                  ) : (
                    riskFactors.map(risk => <TableHead key={risk.id} className="text-center">{risk.label}</TableHead>)
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsLoading ? (
                   <TableRow><TableCell colSpan={riskFactors.length + 1} className="text-center"><Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /></TableCell></TableRow>
                ) : (
                  students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium sticky left-0 bg-background">{student.name}</TableCell>
                      {riskFactors.map(risk => (
                        <TableCell key={risk.id} className="text-center">
                          <Checkbox
                            checked={student.risks?.includes(risk.id)}
                            onCheckedChange={(checked) => handleRiskChange(student.id, risk.id, !!checked)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
