
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Student, Class, TeacherProfile, RosterItem, DutyRosterDocument } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Download, Users, RotateCcw, Save } from 'lucide-react';
import { exportDutyRosterToRtf } from '@/lib/word-export';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { doc, updateDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';


interface DutyRosterTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
  db: Firestore;
}

export function DutyRosterTab({ students, currentClass, teacherProfile, db }: DutyRosterTabProps) {
  const { toast } = useToast();
  const { db: localDb, setDb: setLocalDb, loading } = useDatabase();
  const { dutyRosterDocuments = [] } = localDb;
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [startIndex, setStartIndex] = useState(1);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [nextStartInfo, setNextStartInfo] = useState<{ index: number; name: string } | null>(null);

  const daysMap = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  
    useEffect(() => {
        const classRecords = dutyRosterDocuments.filter(d => d.classId === currentClass?.id);
        if (selectedRecordId) {
            const record = classRecords.find(d => d.id === selectedRecordId);
            setRoster(record ? record.data : []);
        } else if (currentClass?.dutyRoster && currentClass.dutyRoster.length > 0) {
            setRoster(currentClass.dutyRoster);
        }
         else {
            setRoster([]);
        }
    }, [selectedRecordId, dutyRosterDocuments, currentClass]);

  const generateRosterPreview = () => {
    if (!currentClass) {
        toast({ title: "Hata", description: "Lütfen önce bir sınıf seçin.", variant: "destructive" });
        return;
    }
    if (students.length === 0) {
      toast({ title: "Hata", description: "Bu sınıfta öğrenci bulunmuyor.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Hata", description: "Lütfen başlangıç ve bitiş tarihlerini seçin.", variant: "destructive" });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    start.setHours(12, 0, 0, 0);
    end.setHours(12, 0, 0, 0);

    if (start > end) {
      toast({ title: "Hata", description: "Bitiş tarihi başlangıç tarihinden önce olamaz.", variant: "destructive" });
      return;
    }

    const sortedStudents = [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));

    let tempRoster: RosterItem[] = [];
    let currentStudentIndex = (startIndex - 1);
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pazar ve Cumartesi hariç
        const student1 = sortedStudents[currentStudentIndex % sortedStudents.length];
        currentStudentIndex++;
        
        const student2 = sortedStudents[currentStudentIndex % sortedStudents.length];
        currentStudentIndex++;
        
        const studentNames = `${student1.name} - ${student2.name}`;
        
        tempRoster.push({
          date: currentDate.toLocaleDateString('tr-TR'),
          day: daysMap[dayOfWeek],
          student: studentNames,
          studentIds: [student1.id, student2.id]
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setRoster(tempRoster);
    
    const nextStudent = sortedStudents[currentStudentIndex % sortedStudents.length];
    if(nextStudent) {
        setNextStartInfo({
          index: parseInt(nextStudent.number, 10),
          name: nextStudent.name
        });
    }

    toast({ title: "Liste Oluşturuldu", description: "Önizlemeyi kontrol edip kaydedebilirsiniz." });
  };
  
    const saveRoster = async () => {
        if (!currentClass || roster.length === 0) {
            toast({ variant: 'destructive', title: "Kayıt Hatası", description: "Kaydedilecek bir liste bulunmuyor." });
            return;
        }

        // Save to Firestore for live student view
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { dutyRoster: roster });
            toast({ title: "Canlı Liste Güncellendi", description: "Nöbet listesi öğrencilerle paylaşıldı." });

            // Also save to local archive
            const newRecord: DutyRosterDocument = {
                id: selectedRecordId || `duty_${Date.now()}`,
                name: `Nöbet Listesi - ${new Date(startDate).toLocaleDateString('tr-TR')}`,
                date: new Date().toISOString(),
                classId: currentClass.id,
                data: roster,
            };
            
            setLocalDb(prevDb => {
                const existingIndex = prevDb.dutyRosterDocuments.findIndex(d => d.id === newRecord.id);
                const updatedDocs = [...prevDb.dutyRosterDocuments];
                if (existingIndex > -1) {
                    updatedDocs[existingIndex] = newRecord;
                } else {
                    updatedDocs.push(newRecord);
                }
                return { ...prevDb, dutyRosterDocuments: updatedDocs };
            });
            
            setSelectedRecordId(newRecord.id);
            toast({ title: "Arşive Kaydedildi", description: "Nöbet listesi ayrıca arşive de kaydedildi." });

        } catch (error) {
            toast({ variant: 'destructive', title: "Canlı Güncelleme Hatası", description: "Nöbet listesi kaydedilemedi." });
        }
  };
  
  const handleNewRecord = useCallback(async () => {
    if (!currentClass) return;

    setSelectedRecordId(null);
    setRoster([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate("");
    setStartIndex(1);
    setNextStartInfo(null);
    
    // Clear the live roster as well
    const classRef = doc(db, 'classes', currentClass.id);
    await updateDoc(classRef, { dutyRoster: [] });
    toast({ title: 'Yeni Liste Oluşturma Modu', description: 'Canlı nöbet listesi temizlendi.'})
  }, [currentClass, db, toast]);

  const handleDeleteRecord = useCallback(async () => {
    if (!selectedRecordId || !currentClass) return;
    
    setLocalDb(prevDb => ({
      ...prevDb,
      dutyRosterDocuments: prevDb.dutyRosterDocuments.filter(d => d.id !== selectedRecordId)
    }));
    
    handleNewRecord();

    toast({ title: "Silindi", description: "Nöbet listesi arşivden silindi.", variant: "destructive" });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast, currentClass]);


  const handleExport = () => {
    if (roster.length === 0) {
      toast({ title: "Hata", description: "Lütfen önce listeyi oluşturun.", variant: "destructive" });
      return;
    }
     if (currentClass) {
      exportDutyRosterToRtf({
        roster,
        currentClass,
        teacherProfile
      });
    } else {
        toast({variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için sınıf bilgisi yüklenemedi.'})
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <RecordManager
          records={(dutyRosterDocuments || []).filter(d => d.classId === currentClass?.id).map(r => ({ id: r.id, name: r.name }))}
          selectedRecordId={selectedRecordId}
          onSelectRecord={setSelectedRecordId}
          onNewRecord={handleNewRecord}
          onDeleteRecord={handleDeleteRecord}
          noun="Nöbet Listesi"
        />
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Users size={20} />
              Liste ve Tarihler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg border">
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <RotateCcw size={14}/>
                Hangi Öğrenciden Başlasın? (Okul No)
              </label>
              <Input 
                type="number" 
                min="1"
                placeholder="Öğrenci okul no"
                value={startIndex}
                onChange={(e) => setStartIndex(parseInt(e.target.value) || 1)}
              />
            </div>

            <Button onClick={generateRosterPreview} className="w-full">
              <CalendarIcon size={20} className="mr-2"/>
              Listeyi Oluştur ve Önizle
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
             <div className="flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <CardTitle className="font-headline">Nöbet Listesi Önizleme</CardTitle>
                    <CardDescription>Oluşturulan listeyi kontrol edip kaydedin.</CardDescription>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={roster.length === 0}>
                        <Download size={18} className="mr-2"/>
                        Word Olarak İndir
                    </Button>
                     <Button onClick={saveRoster} disabled={roster.length === 0}>
                        <Save size={18} className="mr-2"/>
                        Kaydet ve Yayınla
                    </Button>
                 </div>
             </div>
          </CardHeader>
          <CardContent>
             {nextStartInfo && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4 text-sm text-green-800">
                    Bir sonraki liste için <strong>{nextStartInfo.index}</strong> numaralı <strong>{nextStartInfo.name}</strong> adlı öğrenciden başlayabilirsiniz.
                </div>
            )}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Gün</TableHead>
                    <TableHead>Nöbetçi Öğrenciler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roster.length > 0 ? (
                        roster.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.day}</TableCell>
                            <TableCell className="font-medium">{item.student}</TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-48 text-muted-foreground">
                                Canlı bir nöbet listesi bulunmuyor veya arşivden bir kayıt seçmediniz.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
