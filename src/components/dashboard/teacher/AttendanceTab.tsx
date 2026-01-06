
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Student, Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, BarChart, Users, RotateCw } from 'lucide-react';

// Helper component for stat cards
const StatCard = ({ title, count, color, icon }: { title: string, count: number, color: string, icon: React.ReactNode }) => (
  <div className={`bg-gray-800 p-6 rounded-lg border-2 ${color}`}>
    <div className={`text-5xl font-bold ${color.replace('border-', 'text-')}`}>{count}</div>
    <div className="text-gray-400 mt-2">{title}</div>
  </div>
);

// Main Attendance Component
export function AttendanceTab({ students: initialStudents, currentClass }: { students: Student[], currentClass: Class | null }) {
  const [students, setStudents] = useState<any[]>([]);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Initialize students with a 'present' status of null
    setStudents(initialStudents.map(s => ({ ...s, present: null, visible: true })));
  }, [initialStudents]);

  const updateStudentStatus = (studentId: number | string, status: boolean) => {
    const studentElement = document.getElementById(`student-${studentId}`);
    if (studentElement) {
        studentElement.style.animation = 'fadeOut 0.5s ease forwards';
    }

    setTimeout(() => {
        setStudents(prevStudents =>
            prevStudents.map(student =>
                student.id === studentId ? { ...student, present: status, visible: false } : student
            )
        );
    }, 500); // Match animation duration
  };

  const markPresentFromAbsentList = (studentId: number | string) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId ? { ...student, present: true } : student
      )
    );
    // Optionally keep the modal open to mark more as present, or close it.
    // For now, we'll let the user close it manually.
  };

  const resetAttendance = () => {
    if (confirm('Tüm yoklama verilerini sıfırlamak istediğinizden emin misiniz?')) {
      setStudents(initialStudents.map(s => ({ ...s, present: null, visible: true })));
    }
  };

  const printSummary = () => {
    const presentCount = students.filter(s => s.present === true).length;
    const absentCount = students.filter(s => s.present === false).length;
    const remainingCount = students.filter(s => s.present === null).length;
    const absentStudents = students.filter(s => s.present === false);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
            <head>
                <title>Yoklama Özeti</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                    .stat-item { padding: 20px; text-align: center; border-radius: 8px; color: white; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>YOKLAMA ÖZETİ - ${new Date().toLocaleDateString('tr-TR')}</h1>
                <div class="stats">
                  <div class="stat-item" style="background: #28a745;"><h3>${presentCount}</h3><p>GELEN</p></div>
                  <div class="stat-item" style="background: #dc3545;"><h3>${absentCount}</h3><p>GELMEYEN</p></div>
                  <div class="stat-item" style="background: #ffc107; color: black;"><h3>${remainingCount}</h3><p>BEKLEYEN</p></div>
                </div>
                ${absentCount > 0 ? `
                <h3>Gelmeyen Öğrenci Listesi</h3>
                <table>
                    <thead><tr><th>Öğrenci No</th><th>Ad Soyad</th></tr></thead>
                    <tbody>
                        ${absentStudents.map(student => `
                            <tr>
                                <td>${student.number}</td>
                                <td>${student.name}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>` : '<p>Gelmeyen öğrenci bulunmamaktadır.</p>'}
                <script>window.onload = () => window.print();</script>
            </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const visibleStudents = useMemo(() => {
    return students.filter(student => student.present === null);
  }, [students]);

  const presentCount = students.filter(s => s.present === true).length;
  const absentCount = students.filter(s => s.present === false).length;
  const remainingCount = students.filter(s => s.present === null).length;
  const absentStudents = students.filter(s => s.present === false);

  return (
    <div className="bg-black text-white min-h-screen p-4">
        <style>{`
          @keyframes fadeOut {
              from { opacity: 1; transform: translateX(0); }
              to { opacity: 0; transform: translateX(100px); }
          }
          .student-item { transition: all 0.3s ease; }
          .student-item.fade-out { animation: fadeOut 0.5s ease forwards; }
        `}</style>

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-center border-b-2 border-gray-700 sticky top-0 z-10">
            <h1 className="text-4xl font-bold text-green-400 mb-2" style={{textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'}}>
                🎓 YOKLAMA SİSTEMİ
            </h1>
            <p className="text-lg text-gray-400">Gelen öğrencileri listeden çıkarın, sadece gelmeyenler kalsın.</p>
        </div>

        <div className="p-4 bg-gray-900 border-b-2 border-gray-700 flex flex-wrap justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsStatsModalOpen(true)}><BarChart className="mr-2"/> İstatistikler</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => setIsAbsentModalOpen(true)}><X className="mr-2"/> Sadece Gelmeyenler</Button>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-black" onClick={resetAttendance}><RotateCw className="mr-2"/> Yoklamayı Sıfırla</Button>
            <Button className="bg-gray-600 hover:bg-gray-700" onClick={printSummary}>🖨️ Özeti Yazdır</Button>
        </div>

        <Card className="bg-gray-900 border-gray-700 m-4">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="GELEN ÖĞRENCİ" count={presentCount} color="border-green-500" icon={<Check />} />
                    <StatCard title="GELMEYEN ÖĞRENCİ" count={absentCount} color="border-red-500" icon={<X />} />
                    <StatCard title="BEKLEYEN ÖĞRENCİ" count={remainingCount} color="border-yellow-500" icon={<Users />} />
                </div>
            </CardContent>
        </Card>

        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleStudents.map(student => (
                    <div key={student.id} id={`student-${student.id}`} className="student-item bg-gray-900 border-2 border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:border-green-500 hover:shadow-lg transition-all">
                        <div>
                            <div className="text-lg font-bold">{student.name}</div>
                            <div className="text-sm text-gray-500">No: {student.number}</div>
                        </div>
                        <div className="flex gap-2">
                            <Button className="bg-green-500 hover:bg-green-600 text-black" onClick={() => updateStudentStatus(student.id, true)}>✅ GELDİ</Button>
                            <Button variant="destructive" onClick={() => updateStudentStatus(student.id, false)}>❌ GELMEDİ</Button>
                        </div>
                    </div>
                ))}
            </div>
             {remainingCount === 0 && (
                <div className="text-center py-16 text-2xl font-bold text-green-400">
                    🎉 Tüm öğrencilerin yoklaması tamamlandı!
                </div>
            )}
        </div>
        
        {/* Modals */}
        <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
            <DialogContent className="bg-gray-900 border-green-500 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-green-400">📊 YOKLAMA İSTATİSTİKLERİ</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                    <StatCard title="GELEN" count={presentCount} color="border-green-500" icon={<Check />} />
                    <StatCard title="GELMEYEN" count={absentCount} color="border-red-500" icon={<X />} />
                    <StatCard title="BEKLEYEN" count={remainingCount} color="border-yellow-500" icon={<Users />} />
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isAbsentModalOpen} onOpenChange={setIsAbsentModalOpen}>
            <DialogContent className="bg-gray-900 border-red-500 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-red-400">❌ GELMEYEN ÖĞRENCİLER</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-80 my-4">
                    {absentStudents.length > 0 ? (
                        absentStudents.map(student => (
                            <div key={student.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-md mb-2">
                                <span className="font-medium">{student.name}</span>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markPresentFromAbsentList(student.id)}>
                                    Geldi İşaretle
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 py-8">Gelmeyen öğrenci yok.</p>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </div>
  );
}
