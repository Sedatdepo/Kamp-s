
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Grid, Shuffle, Trash2, Download, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Student, Class, TeacherProfile, SeatingPlanDocument } from '@/lib/types';
import { exportSeatingPlanToRtf } from '@/lib/word-export';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { doc, updateDoc, Firestore } from 'firebase/firestore';


interface SeatingPlanTabProps {
    students: Student[];
    currentClass: Class | null;
    teacherProfile: TeacherProfile | null;
    db: Firestore;
}

export function SeatingPlanTab({ students, currentClass, teacherProfile, db }: SeatingPlanTabProps) {
  const { toast } = useToast();
  const { db: localDb, setDb: setLocalDb, loading } = useDatabase();
  const { seatingPlanDocuments = [] } = localDb;
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(currentClass?.seatingPlanRows || 5);
  const [colCount, setColCount] = useState(currentClass?.seatingPlanCols || 3);
  const [seatingPlan, setSeatingPlan] = useState<{ [key: string]: Student }>({});
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [dragSource, setDragSource] = useState<string | null>(null);

  useEffect(() => {
    const plan: { [key: string]: Student } = {};
    if (currentClass?.seatingPlan) {
        for (const key in currentClass.seatingPlan) {
            const studentId = currentClass.seatingPlan[key];
            const student = students.find(s => s.id === studentId);
            if (student) {
                plan[key] = student;
            }
        }
    }
    setSeatingPlan(plan);
    setRowCount(currentClass?.seatingPlanRows || 5);
    setColCount(currentClass?.seatingPlanCols || 3);
  }, [currentClass, students]);


  useEffect(() => {
    const classRecords = seatingPlanDocuments.filter(d => d.classId === currentClass?.id);
    if (selectedRecordId) {
        const record = classRecords.find(r => r.id === selectedRecordId);
        if (record) {
            const loadedPlan: { [key: string]: Student } = {};
            for (const key in record.data.plan) {
                const studentId = record.data.plan[key];
                const student = students.find(s => s.id === studentId);
                if (student) {
                    loadedPlan[key] = student;
                }
            }
            setSeatingPlan(loadedPlan);
            setRowCount(record.data.rows || 5);
            setColCount(record.data.cols || 3);
        } else {
            // If the selected record is not found (e.g. deleted), revert to live view
            handleNewRecord();
        }
    } else {
        handleNewRecord(); // Revert to live data if no record is selected
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecordId, seatingPlanDocuments, students, currentClass]);

  const handleRandomize = useCallback(() => {
    if (students.length === 0) {
      toast({ variant: "destructive", title: "Bu sınıfta öğrenci yok." });
      return;
    }

    const newPlan: { [key: string]: Student } = {};
    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    let studentIndex = 0;

    for (let r = 0; r < rowCount; r++) {
      for (let c = 0; c < colCount; c++) {
        if (studentIndex < shuffledStudents.length) newPlan[`${r}-${c}-0`] = shuffledStudents[studentIndex++];
        if (studentIndex < shuffledStudents.length) newPlan[`${r}-${c}-1`] = shuffledStudents[studentIndex++];
      }
    }
    setSeatingPlan(newPlan);
    toast({ title: "Öğrenciler rastgele yerleştirildi." });
  }, [students, rowCount, colCount, toast]);

  const handleClearSeating = useCallback(async () => {
    setSeatingPlan({});
    if (currentClass) {
        const classRef = doc(db, 'classes', currentClass.id);
        await updateDoc(classRef, {
            seatingPlan: {},
            seatingPlanRows: 5,
            seatingPlanCols: 3,
        });
    }
    toast({ title: "Oturma planı temizlendi." });
  }, [toast, currentClass, db]);

  const handleSavePlan = async () => {
    if (!currentClass) return;

    const planToSave: { [key: string]: string } = {};
    for (const key in seatingPlan) {
      planToSave[key] = seatingPlan[key].id;
    }

    // Save to Firestore for live student view
    const classRef = doc(db, 'classes', currentClass.id);
    try {
        await updateDoc(classRef, {
            seatingPlan: planToSave,
            seatingPlanRows: rowCount,
            seatingPlanCols: colCount,
        });
        toast({ title: "Canlı Oturma Planı Güncellendi", description: "Plan öğrencilerle paylaşıldı." });

        // Also save to local archive
        const newRecord: SeatingPlanDocument = {
            id: selectedRecordId || `seat_${Date.now()}`,
            name: `Oturma Planı - ${new Date().toLocaleDateString('tr-TR')}`,
            date: new Date().toISOString(),
            classId: currentClass.id,
            data: {
                plan: planToSave,
                rows: rowCount,
                cols: colCount,
            }
        };
        
        setLocalDb(prevDb => {
            const existingIndex = (prevDb.seatingPlanDocuments || []).findIndex(d => d.id === newRecord.id);
            const updatedDocs = [...(prevDb.seatingPlanDocuments || [])];
            if (existingIndex > -1) {
                updatedDocs[existingIndex] = newRecord;
            } else {
                updatedDocs.push(newRecord);
            }
            return { ...prevDb, seatingPlanDocuments: updatedDocs };
        });
        
        setSelectedRecordId(newRecord.id);
        toast({ title: "Arşive Kaydedildi", description: "Oturma planı ayrıca arşive de kaydedildi." });

    } catch (error) {
        toast({ variant: 'destructive', title: "Canlı Güncelleme Hatası", description: "Oturma planı kaydedilemedi." });
    }
  };

  const handleExportWord = useCallback(() => {
    if (Object.keys(seatingPlan).length === 0) {
      toast({ variant: "destructive", title: "Dışa aktarmak için bir oturma planı oluşturmalısınız." });
      return;
    }
    if (currentClass) {
        exportSeatingPlanToRtf({ seatingPlan, rowCount, colCount, currentClass, teacherProfile });
    } else {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için sınıf bilgisi yüklenemedi.'})
    }
  }, [seatingPlan, rowCount, colCount, currentClass, teacherProfile, toast]);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, student: Student, source: string) => {
    setDraggedStudent(student);
    setDragSource(source);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), []);

  const onDropSeat = useCallback((e: React.DragEvent<HTMLDivElement>, row: number, col: number, side: number) => {
    e.preventDefault();
    if (!draggedStudent) return;

    const targetKey = `${row}-${col}-${side}`;
    const existingStudent = seatingPlan[targetKey];
    const newPlan = { ...seatingPlan };

    if (dragSource && dragSource !== 'list') delete newPlan[dragSource];
    if (existingStudent && dragSource) {
        if (dragSource === 'list') {
            // Already handled by unseatedStudents logic
        } else {
            newPlan[dragSource] = existingStudent;
        }
    }
    
    newPlan[targetKey] = draggedStudent;
    
    setSeatingPlan(newPlan);
    setDraggedStudent(null);
    setDragSource(null);
  }, [draggedStudent, dragSource, seatingPlan]);

  const onDropList = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragSource && dragSource !== 'list') {
      const newPlan = { ...seatingPlan };
      delete newPlan[dragSource];
      setSeatingPlan(newPlan);
    }
    setDraggedStudent(null);
    setDragSource(null);
  }, [dragSource, seatingPlan]);

  const unseatedStudents = useMemo(() => {
    const seatedIds = new Set(Object.values(seatingPlan).map((s: Student) => s.id));
    return students.filter(s => !seatedIds.has(s.id));
  }, [students, seatingPlan]);
  
  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    const plan: { [key: string]: Student } = {};
    if (currentClass?.seatingPlan) {
        for (const key in currentClass.seatingPlan) {
            const studentId = currentClass.seatingPlan[key];
            const student = students.find(s => s.id === studentId);
            if (student) {
                plan[key] = student;
            }
        }
    }
    setSeatingPlan(plan);
    setRowCount(currentClass?.seatingPlanRows || 5);
    setColCount(currentClass?.seatingPlanCols || 3);
  }, [currentClass, students]);

  const handleDeleteRecord = useCallback(async () => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
      ...prevDb,
      seatingPlanDocuments: (prevDb.seatingPlanDocuments || []).filter(d => d.id !== selectedRecordId)
    }));
    
    // Check if the deleted record was the live one, if so clear live
    if (currentClass && currentClass.seatingPlan && seatingPlanDocuments.find(d => d.id === selectedRecordId)?.data.plan === currentClass.seatingPlan){
        await handleClearSeating();
    }

    handleNewRecord();
    toast({ title: "Silindi", description: "Oturma planı arşivden silindi.", variant: "destructive" });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast, currentClass, seatingPlanDocuments, handleClearSeating]);

  if (loading) return <div>Yükleniyor...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 space-y-6">
         <RecordManager
            records={(seatingPlanDocuments || []).filter(d => d.classId === currentClass?.id).map(r => ({ id: r.id, name: r.name }))}
            selectedRecordId={selectedRecordId}
            onSelectRecord={setSelectedRecordId}
            onNewRecord={handleNewRecord}
            noun="Oturma Planı"
        />
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Grid size={20} /> Düzen ve Eylemler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="row-count">Sıra Sayısı</Label>
                <Input id="row-count" type="number" min="1" max="12" value={rowCount} onChange={(e) => setRowCount(parseInt(e.target.value) || 1)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="col-count">Sütun Sayısı</Label>
                <Input id="col-count" type="number" min="1" max="10" value={colCount} onChange={(e) => setColCount(parseInt(e.target.value) || 1)} className="mt-1" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t">
              <Button onClick={handleRandomize} disabled={students.length === 0} className="w-full"><Shuffle size={18} className="mr-2" /> Dağıt</Button>
              <Button onClick={handleSavePlan} disabled={Object.keys(seatingPlan).length === 0} className="w-full bg-green-600 hover:bg-green-700"><Save size={18} className="mr-2" /> Planı Kaydet & Yayınla</Button>
              <Button onClick={handleClearSeating} variant="destructive" className="w-full"><Trash2 size={18} className="mr-2" /> Planı Temizle</Button>
              <Button onClick={handleExportWord} disabled={Object.keys(seatingPlan).length === 0} className="w-full"><Download size={18} className="mr-2" /> Word Olarak İndir</Button>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-headline flex items-center gap-2"><Users size={20} /> Bekleyen Öğrenciler</CardTitle>
                <Badge variant="secondary">{unseatedStudents.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-2 rounded-lg min-h-[100px] max-h-[40vh] overflow-y-auto space-y-2 border border-dashed" onDragOver={onDragOver} onDrop={onDropList}>
                {unseatedStudents.length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Tüm öğrenciler yerleştirildi.</div>}
                {unseatedStudents.map((student) => (
                  <div key={student.id} draggable onDragStart={(e) => onDragStart(e, student, 'list')} className="bg-background p-2 rounded-md shadow-sm border flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-primary/5 transition-colors">
                    <GripVertical size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{student.name} ({student.number})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-9">
        <Card className="min-h-[70vh]">
          <CardHeader>
            <CardTitle className="font-headline">Sınıf Oturma Planı Önizlemesi</CardTitle>
            <CardDescription>Öğrencileri listeden veya sıralardan sürükleyerek yerlerini değiştirin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md"><span className="font-bold tracking-widest text-lg">TAHTA</span></div>
            <div className="flex-1 flex justify-center items-start overflow-x-auto p-4">
              <div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)`, }}>
                {Array.from({ length: rowCount }).map((_, r) =>
                  Array.from({ length: colCount }).map((_, c) => (
                    <div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">
                      {[0, 1].map((side) => {
                        const key = `${r}-${c}-${side}`;
                        const student = seatingPlan[key];
                        return (
                          <div key={key} onDragOver={onDragOver} onDrop={(e) => onDropSeat(e, r, c, side)} className={`flex-1 rounded-md flex flex-col items-center justify-center text-center transition-all duration-200 ${student ? 'bg-background border-2 border-primary/20 shadow-sm' : 'bg-white/50 border-2 border-dashed border-amber-400/50 hover:border-amber-500 hover:bg-amber-50/50'}`}>
                            {student ? (
                              <div draggable onDragStart={(e) => onDragStart(e, student, key)} className="relative group/student w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing p-1">
                                <span className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">{student.name}</span>
                                <span className="text-[9px] text-muted-foreground">{student.number}</span>
                                <div className="absolute -top-1 -right-1 opacity-0 group-hover/student:opacity-100 transition-opacity">
                                  <button onClick={() => { const newPlan = { ...seatingPlan }; delete newPlan[key]; setSeatingPlan(newPlan); }} className="bg-red-100 text-red-600 p-0.5 rounded-full hover:bg-red-200" title="Kaldır">
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            ) : (<span className="text-amber-500/50 text-xs select-none pointer-events-none">Boş</span>)}
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
      </div>
    </div>
  );
}
