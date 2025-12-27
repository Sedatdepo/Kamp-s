
"use client";

import React, { useState, useMemo } from 'react';
import { Student, Class, TeacherProfile, RosterItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Download, Users, RotateCcw } from 'lucide-react';
import { exportDutyRosterToRtf } from '@/lib/word-export';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DutyRosterTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function DutyRosterTab({ students, currentClass, teacherProfile }: DutyRosterTabProps) {
  const { toast } = useToast();

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [startIndex, setStartIndex] = useState(1);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [nextStartInfo, setNextStartInfo] = useState<{ index: number; name: string } | null>(null);

  const daysMap = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  const generateRoster = async () => {
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
    
    // Save the generated roster to Firestore
    const classRef = doc(db, 'classes', currentClass.id);
    await updateDoc(classRef, { dutyRoster: tempRoster });

    setRoster(tempRoster);
    
    const nextStudent = sortedStudents[currentStudentIndex % sortedStudents.length];
    if(nextStudent) {
        setNextStartInfo({
          index: parseInt(nextStudent.number, 10),
          name: nextStudent.name
        });
    }

    toast({ title: "Başarılı", description: "Nöbet listesi oluşturuldu ve öğrencilerin paneline gönderildi." });
  };

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* --- SOL PANEL: AYARLAR --- */}
      <div className="md:col-span-1 space-y-6">
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

            <Button onClick={generateRoster} className="w-full">
              <CalendarIcon size={20} className="mr-2"/>
              Listeyi Oluştur ve Kaydet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* --- SAĞ PANEL: ÖNİZLEME VE ÇIKTI --- */}
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-center">
                 <div>
                    <CardTitle className="font-headline">Nöbet Listesi Önizleme</CardTitle>
                    <CardDescription>Oluşturulan liste aşağıdadır. Word olarak indirebilirsiniz.</CardDescription>
                 </div>
                 <Button onClick={handleExport} disabled={roster.length === 0}>
                    <Download size={18} className="mr-2"/>
                    Word Olarak İndir
                </Button>
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
                                Liste oluşturmak için lütfen yandaki formu doldurun.
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
