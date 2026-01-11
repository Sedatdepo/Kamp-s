'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class } from '@/lib/types';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Save, Check, X, PieChart, Users, Printer, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
  onStudentsChange: (students: Student[]) => void;
}


export function AttendanceTab({ students: initialStudents, onStudentsChange }: AttendanceTabProps) {
  const [students, setStudents] = useState(initialStudents.map(s => ({ ...s, present: null as boolean | null })));
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  useEffect(() => {
    // Reset state when initial students change (e.g. class switch)
    setStudents(initialStudents.map(s => ({...s, present: null})));
  }, [initialStudents]);

  const updateStudentStatus = (id: string, status: boolean | null) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: status } : s));
  };
  
  const handleMarkPresent = (id: string) => {
    const studentElement = document.getElementById(`student-${id}`);
    if (studentElement) {
        studentElement.classList.add('fade-out');
        setTimeout(() => {
            updateStudentStatus(id, true);
        }, 300);
    }
  };

  const handleMarkAbsent = (id: string) => {
    updateStudentStatus(id, false);
  };
  
  const handleMarkPresentFromAbsent = (id: string) => {
    updateStudentStatus(id, true);
  };


  const resetAttendance = () => {
    if (confirm('Tüm yoklama verilerini sıfırlamak istediğinizden emin misiniz?')) {
        setStudents(prev => prev.map(s => ({...s, present: null})));
    }
  };

  const stats = useMemo(() => {
    const presentCount = students.filter(s => s.present === true).length;
    const absentCount = students.filter(s => s.present === false).length;
    const remainingCount = students.filter(s => s.present === null).length;
    return { presentCount, absentCount, remainingCount };
  }, [students]);
  
  const absentStudents = useMemo(() => students.filter(s => s.present === false), [students]);
  const remainingStudents = useMemo(() => students.filter(s => s.present === null), [students]);

  const printSummary = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
          <html>
              <head>
                  <title>Yoklama Özeti</title>
                   <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 30px; 
                        }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;}
                        .summary { background: #f5f5f5; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #ddd;}
                        table { width: 100%; border-collapse: collapse; margin: 25px 0; }
                        th, td { border: 1px solid #ccc; padding: 15px; text-align: left; }
                        th { background: #eee; font-weight: bold;}
                        .absent { color: #cc0000; font-weight: bold; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0;}
                        .stat-item { padding: 20px; text-align: center; border-radius: 10px; font-weight: bold;}
                    </style>
              </head>
              <body>
                  <div class="header">
                      <h1 style="font-size: 2.5em;">YOKLAMA ÖZETİ</h1>
                      <p style="font-size: 1.2em;">Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
                  </div>
                  
                  <div class="stats">
                      <div class="stat-item" style="background: #e0ffe0; color: #006400;">
                          <div style="font-size: 2em;">${stats.presentCount}</div>
                          <div>GELEN ÖĞRENCİ</div>
                      </div>
                      <div class="stat-item" style="background: #ffe0e0; color: #cc0000;">
                          <div style="font-size: 2em;">${stats.absentCount}</div>
                          <div>GELMEYEN ÖĞRENCİ</div>
                      </div>
                      <div class="stat-item" style="background: #fff0e0; color: #cc6600;">
                          <div style="font-size: 2em;">${stats.remainingCount}</div>
                          <div>BEKLEYEN ÖĞRENCİ</div>
                      </div>
                  </div>

                  <div class="summary">
                      <h3>Genel Özet</h3>
                      <p>Toplam Öğrenci: <strong>${students.length}</strong></p>
                  </div>

                  ${absentStudents.length > 0 ? `
                  <h3>Gelmeyen Öğrenci Listesi</h3>
                  <table>
                      <thead><tr><th>Öğrenci No</th><th>Ad Soyad</th><th>Durum</th></tr></thead>
                      <tbody>
                          ${absentStudents.map(student => `
                              <tr>
                                  <td>${student.number}</td>
                                  <td>${student.name}</td>
                                  <td class="absent">❌ GELMEDİ</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
                  ` : ''}
                  
                  <script>window.onload = function() { window.print(); }<\/script>
              </body>
          </html>
      `);
      printWindow.document.close();
  };

  return (
    <>
      <style>{`
        .fade-out { animation: fadeOut 0.3s ease forwards; }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100px); }
        }
      `}</style>

      <div className="container mx-auto">
        <Card className="mb-6">
            <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl text-primary">🎓 YOKLAMA SİSTEMİ</CardTitle>
                <CardDescription>Gelen öğrencileri listeden çıkarın, sadece gelmeyenler kalsın.</CardDescription>
            </CardHeader>
        </Card>
        

        <div className="flex justify-center gap-2 mb-6">
            <Button variant="outline" onClick={() => setShowStatsModal(true)}><PieChart className="mr-2 h-4 w-4" /> İstatistikler</Button>
            <Button variant="outline" onClick={() => setShowAbsentModal(true)}><X className="mr-2 h-4 w-4" /> Gelmeyenler</Button>
            <Button variant="outline" onClick={resetAttendance}><RefreshCw className="mr-2 h-4 w-4" /> Sıfırla</Button>
            <Button variant="outline" onClick={printSummary}><Printer className="mr-2 h-4 w-4" /> Özeti Yazdır</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/10 border-primary/20 text-primary-foreground">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-green-600">{stats.presentCount}</CardTitle>
                    <CardDescription className="text-green-700">GELEN ÖĞRENCİ</CardDescription>
                </CardHeader>
            </Card>
            <Card className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-red-600">{stats.absentCount}</CardTitle>
                    <CardDescription className="text-red-700">GELMEYEN ÖĞRENCİ</CardDescription>
                </CardHeader>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
                 <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-amber-600">{stats.remainingCount}</CardTitle>
                    <CardDescription className="text-amber-700">BEKLEYEN ÖĞRENCİ</CardDescription>
                </CardHeader>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {remainingStudents.length > 0 ? remainingStudents.map(student => (
                <div key={student.id} className="student-item" id={`student-${student.id}`}>
                    <Card className="w-full">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <div className="font-semibold text-lg">{student.name}</div>
                                <div className="text-sm text-muted-foreground">No: {student.number}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button className="bg-primary hover:bg-primary/90" onClick={() => handleMarkPresent(student.id)}>
                                    <Check className="mr-2 h-4 w-4" /> Geldi
                                </Button>
                                <Button variant="destructive" onClick={() => handleMarkAbsent(student.id)}>
                                    <X className="mr-2 h-4 w-4" /> Gelmedi
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )) : (
                 <div className="md:col-span-2 text-center py-16 text-green-600 font-semibold text-xl bg-green-50/50 rounded-lg border border-dashed border-green-200">
                    🎉 Tüm öğrencilerin yoklaması tamamlandı!
                </div>
            )}
        </div>
      </div>
      
      <AlertDialog open={showStatsModal} onOpenChange={setShowStatsModal}>
         <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-primary">📊 YOKLAMA İSTATİSTİKLERİ</AlertDialogTitle>
            </AlertDialogHeader>
             <div className="grid grid-cols-3 gap-4">
                 <Card className="text-center"><CardHeader><CardTitle className="text-green-600">{stats.presentCount}</CardTitle><CardDescription>GELEN</CardDescription></CardHeader></Card>
                 <Card className="text-center"><CardHeader><CardTitle className="text-red-600">{stats.absentCount}</CardTitle><CardDescription>GELMEYEN</CardDescription></CardHeader></Card>
                 <Card className="text-center"><CardHeader><CardTitle className="text-amber-600">{stats.remainingCount}</CardTitle><CardDescription>BEKLEYEN</CardDescription></CardHeader></Card>
            </div>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => setShowStatsModal(false)}>Kapat</Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={showAbsentModal} onOpenChange={setShowAbsentModal}>
         <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">❌ GELMEYEN ÖĞRENCİLER</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-64 overflow-y-auto pr-2">
                {absentStudents.length > 0 ? absentStudents.map(student => (
                     <div key={student.id} className="flex justify-between items-center p-3 my-1 rounded-lg border">
                        <div>
                            <div className="font-semibold">{student.name}</div>
                            <div className="text-sm text-muted-foreground">Öğrenci No: {student.number}</div>
                        </div>
                        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleMarkPresentFromAbsent(student.id)}>
                            <Check className="mr-2 h-4 w-4" /> Geldi Yap
                        </Button>
                    </div>
                )) : <div className="text-center p-6 text-green-600">🎉 Tüm öğrenciler geldi!</div>}
            </div>
            <AlertDialogFooter>
                 <Button variant="outline" onClick={() => setShowAbsentModal(false)}>Kapat</Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
