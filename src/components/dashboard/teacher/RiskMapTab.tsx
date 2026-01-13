
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, RiskFactor, TeacherProfile, RiskMapDocument } from '@/lib/types';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { exportRiskMapToRtf } from '@/lib/word-export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, X, AlertTriangle, ChevronsUpDown, Check, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { useDoc, useCollection, useMemoFirebase } from '@/firebase';

const commonRiskFactors = [
    "Parçalanmış Aile",
    "Ekonomik Zorluklar",
    "Akran Zorbalığı",
    "Devamsızlık Sorunu",
    "Öğrenme Güçlüğü",
    "Kaygı Bozukluğu",
    "Dikkat Eksikliği ve Hiperaktivite",
    "Okul Fobisi",
    "Teknoloji Bağımlılığı",
    "Aile İçi Şiddet",
    "Sosyal İzolasyon",
    "Düşük Akademik Başarı",
    "Olumsuz Arkadaş Çevresi",
    "Sağlık Sorunları (Kronik)",
    "Göçmenlik/Kültürel Uyum Sorunları"
];


interface RiskMapTabProps {
  classId: string;
  teacherProfile?: TeacherProfile | null;
  currentClass?: Class | null;
}

function RiskFactorManager({ teacherId }: { teacherId: string }) {
  const { toast } = useToast();
  const { db } = useAuth();
  const riskFactorsQuery = useMemoFirebase(() => (db && teacherId ? query(collection(db, 'riskFactors'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: riskFactors, isLoading: riskFactorsLoading } = useCollection<RiskFactor>(riskFactorsQuery);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [editingWeight, setEditingWeight] = useState<number>(0);
  
  const [newFactorLabel, setNewFactorLabel] = useState('');
  const [newFactorWeight, setNewFactorWeight] = useState<number>(3);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleStartEdit = (factor: RiskFactor) => {
    setIsEditing(factor.id);
    setEditingLabel(factor.label);
    setEditingWeight(factor.weight);
  };

  const handleCancelEdit = () => setIsEditing(null);

  const handleSaveEdit = async (factorId: string) => {
    if (!db) return;
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
    if (!db) return;
    await deleteDoc(doc(db, 'riskFactors', factorId));
    toast({ title: 'Risk faktörü silindi', variant: 'destructive' });
  };
  
  const handleAddFactor = async () => {
      if (!db) return;
      if (!newFactorLabel.trim() || newFactorWeight <= 0) {
        toast({ variant: 'destructive', title: 'Geçersiz giriş', description: 'Faktör adı boş olamaz ve ağırlık 0 dan büyük olmalı.'});
        return;
      }
      await addDoc(collection(db, 'riskFactors'), {
          label: newFactorLabel,
          weight: newFactorWeight,
          teacherId: teacherId
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
        {riskFactors && riskFactors.map(factor => (
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
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-red-500"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu faktörü silmek istediğinize emin misiniz? Bu faktörü seçen öğrencilerin risk puanları etkilenecektir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(factor.id)} className="bg-destructive hover:bg-destructive/90">
                                        Sil
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )
        ))}
         <div className="flex gap-2 items-center pt-4 border-t">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-[200px] justify-between"
                >
                  {newFactorLabel || "Faktör seçin/yazın..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Faktör ara veya yaz..." 
                    onValueChange={setNewFactorLabel}
                  />
                  <CommandList>
                    <CommandEmpty>Faktör bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      {commonRiskFactors.map((factor) => (
                        <CommandItem
                          key={factor}
                          value={factor}
                          onSelect={(currentValue) => {
                            setNewFactorLabel(currentValue === newFactorLabel ? "" : currentValue);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              newFactorLabel === factor ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {factor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Input type="number" value={newFactorWeight} onChange={e => setNewFactorWeight(Number(e.target.value))} className="h-9 w-24" placeholder="Ağırlık"/>
            <Button onClick={handleAddFactor}><Plus className="mr-2 h-4 w-4"/> Ekle</Button>
        </div>
      </CardContent>
    </Card>
  );
}


export function RiskMapTab({ classId, teacherProfile, currentClass }: RiskMapTabProps) {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const { db: localDb, setDb: setLocalDb, loading: localDbLoading } = useDatabase();
  const { riskMapDocuments = [] } = localDb;
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: liveStudents, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  const riskFactorsQuery = useMemoFirebase(() => (db && teacherProfile?.id ? query(collection(db, 'riskFactors'), where('teacherId', '==', teacherProfile.id)) : null), [db, teacherProfile?.id]);
  const { data: riskFactors, isLoading: factorsLoading } = useCollection<RiskFactor>(riskFactorsQuery);

  const displayedStudents = useMemo(() => {
    if (!liveStudents) return [];
    if (selectedRecordId) {
      const record = riskMapDocuments.find(d => d.id === selectedRecordId);
      if (record) {
        return liveStudents.map(student => {
          const archivedData = record.data.studentRisks.find(sr => sr.studentId === student.id);
          return {
            ...student,
            risks: archivedData ? archivedData.risks : [],
          };
        });
      }
    }
    return liveStudents;
  }, [selectedRecordId, riskMapDocuments, liveStudents]);
  
  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass || !db) return;
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

  const handleExport = () => {
    if(currentClass && riskFactors) {
        exportRiskMapToRtf({
            students: displayedStudents,
            riskFactors,
            currentClass,
            teacherProfile
        })
    } else {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için sınıf bilgisi yüklenemedi.'})
    }
  };

  const getRiskScore = (studentRisks: string[]) => {
    if (!riskFactors) return 0;
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
  
  const handleSaveToArchive = () => {
    if (!currentClass || !liveStudents) return;

    const studentRisks = liveStudents.map(student => ({
      studentId: student.id,
      risks: student.risks,
    }));

    const newRecord: RiskMapDocument = {
      id: `riskmap_${Date.now()}`,
      name: `Risk Haritası - ${new Date().toLocaleDateString('tr-TR')}`,
      date: new Date().toISOString(),
      classId: currentClass.id,
      data: { studentRisks },
    };

    setLocalDb(prev => ({
      ...prev,
      riskMapDocuments: [...(prev.riskMapDocuments || []), newRecord],
    }));

    toast({ title: 'Başarılı', description: 'Risk haritası arşive kaydedildi.' });
  };
  
  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
  }, []);

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prev => ({
      ...prev,
      riskMapDocuments: (prev.riskMapDocuments || []).filter(d => d.id !== selectedRecordId),
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Kayıt arşivden silindi.', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);


  const isLoading = studentsLoading || factorsLoading || localDbLoading;
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-headline">
                    {selectedRecordId ? 'Arşivlenmiş Risk Haritası' : 'Canlı Risk Haritası'}
                </CardTitle>
                <CardDescription>Öğrencilerin risk faktörlerini ve toplam risk puanlarını görüntüleyin.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedRecordId === null && (
                    <div className="flex items-center space-x-2">
                        <Switch
                        id="risk-form-toggle"
                        checked={currentClass?.isRiskFormActive || false}
                        onCheckedChange={handleToggleChange}
                        disabled={!currentClass}
                        />
                        <Label htmlFor="risk-form-toggle">Form Aktif</Label>
                    </div>
                )}
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
                  {displayedStudents && displayedStudents.length > 0 ? displayedStudents.map(student => {
                    const riskScore = getRiskScore(student.risks);
                    return (
                      <TableRow key={student.id} className={getRiskColor(riskScore)}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {student.risks && student.risks.length > 0 ? student.risks.map(riskId => {
                              const factor = riskFactors?.find(f => f.id === riskId);
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
            <div className="space-y-4">
                 <RecordManager
                    records={(riskMapDocuments || []).filter(d => d.classId === classId)}
                    selectedRecordId={selectedRecordId}
                    onSelectRecord={setSelectedRecordId}
                    onNewRecord={handleNewRecord}
                    onDeleteRecord={handleDeleteRecord}
                    noun="Risk Haritası"
                />
                <div className="flex items-center gap-2">
                    <Button onClick={handleSaveToArchive} className="w-full bg-green-600 hover:bg-green-700">
                        <Save className="mr-2 h-4 w-4" /> Arşive Kaydet
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="w-full">
                        <FileText className="mr-2 h-4 w-4" /> Raporu İndir
                    </Button>
                </div>
            </div>
            { teacherId && <div className="mt-4"><RiskFactorManager teacherId={teacherId} /></div> }
        </div>
    </div>
  );
}
