
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Users, UserX, RotateCcw, Printer, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';


// Bu bileşen, HTML/CSS kodunun React ve ShadCN ile yeniden oluşturulmuş halidir.
export function AttendanceTab({ students: initialStudents }: { students: Student[] }) {
    const { toast } = useToast();
    
    // Öğrenci verilerini ve yoklama durumlarını tutmak için state
    const [students, setStudents] = useState(() => initialStudents.map(s => ({ ...s, status: 'bekliyor' as 'bekliyor' | 'geldi' | 'gelmedi' })));
    const [fadingOut, setFadingOut] = useState<string[]>([]);
    
    // Modallar için stateler
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);

    useEffect(() => {
        setStudents(initialStudents.map(s => ({ ...s, status: 'bekliyor' })));
    }, [initialStudents]);

    // İstatistikleri hesapla
    const stats = useMemo(() => {
        const presentCount = students.filter(s => s.status === 'geldi').length;
        const absentCount = students.filter(s => s.status === 'gelmedi').length;
        const remainingCount = students.filter(s => s.status === 'bekliyor').length;
        return { presentCount, absentCount, remainingCount };
    }, [students]);

    // Öğrenciyi işaretleme fonksiyonları
    const markStatus = (studentId: string, status: 'geldi' | 'gelmedi') => {
        if (status === 'geldi') {
            setFadingOut(prev => [...prev, studentId]);
            setTimeout(() => {
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
                setFadingOut(prev => prev.filter(id => id !== studentId));
            }, 500);
        } else {
            setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s));
        }
    };
    
    const markPresentFromAbsent = (studentId: string) => {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: 'geldi' } : s));
    };

    // Yoklamayı sıfırlama
    const resetAttendance = () => {
        if (confirm('Tüm yoklama verilerini sıfırlamak istediğinizden emin misiniz?')) {
            setStudents(prev => prev.map(s => ({ ...s, status: 'bekliyor' })));
            toast({ title: 'Yoklama Sıfırlandı', description: 'Tüm öğrenciler bekliyor durumuna getirildi.' });
        }
    };
    
    const printSummary = () => {
        const { presentCount, absentCount, remainingCount } = stats;
        const absentStudents = students.filter(s => s.status === 'gelmedi');

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head><title>Yoklama Özeti</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; } 
                    h1 { color: #007bff; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; }
                    th { background-color: #f2f2f2; }
                </style>
                </head>
                <body>
                    <h1>Yoklama Özeti - ${new Date().toLocaleDateString('tr-TR')}</h1>
                    <p><strong>Gelen Öğrenci:</strong> ${presentCount}</p>
                    <p><strong>Gelmeyen Öğrenci:</strong> ${absentCount}</p>
                    <p><strong>Bekleyen Öğrenci:</strong> ${remainingCount}</p>
                    ${absentCount > 0 ? `
                        <h3>Gelmeyen Öğrenciler</h3>
                        <table>
                            <thead><tr><th>No</th><th>Ad Soyad</th></tr></thead>
                            <tbody>
                                ${absentStudents.map(s => `<tr><td>${s.number}</td><td>${s.name}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                    <script>window.onload = () => window.print();</script>
                </body></html>
            `);
            printWindow.document.close();
        }
    };

    const remainingStudents = students.filter(student => student.status === 'bekliyor');

    return (
        <div className="bg-[#121212] text-white min-h-screen p-4 rounded-lg">
            <div className="container mx-auto">
                <header className="text-center py-6 border-b-2 border-slate-700">
                    <h1 className="text-4xl font-bold text-primary mb-2">🎓 YOKLAMA SİSTEMİ</h1>
                    <p className="text-slate-400">Gelen öğrencileri listeden çıkarın, sadece gelmeyenler kalsın.</p>
                </header>

                <div className="py-4 flex flex-wrap justify-center gap-4">
                    <Button onClick={() => setIsStatsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground"><BarChart className="mr-2"/> İstatistikleri Göster</Button>
                    <Button onClick={() => setIsAbsentModalOpen(true)} variant="destructive"><UserX className="mr-2"/> Sadece Gelmediklerim</Button>
                    <Button onClick={resetAttendance} variant="secondary"><RotateCcw className="mr-2"/> Yoklamayı Sıfırla</Button>
                    <Button onClick={printSummary} variant="outline"><Printer className="mr-2"/> Özeti Yazdır</Button>
                </div>

                <Card className="bg-slate-900 border-slate-700 my-4">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500">
                                <div className="text-4xl font-bold text-green-500">{stats.presentCount}</div>
                                <div className="text-sm text-slate-400">GELEN ÖĞRENCİ</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500">
                                <div className="text-4xl font-bold text-red-500">{stats.absentCount}</div>
                                <div className="text-sm text-slate-400">GELMEYEN ÖĞRENCİ</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="text-4xl font-bold text-yellow-500">{stats.remainingCount}</div>
                                <div className="text-sm text-slate-400">BEKLEYEN ÖĞRENCİ</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="student-list-container">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {remainingStudents.length > 0 ? remainingStudents.map(student => (
                            <div 
                                key={student.id} 
                                className={cn(
                                    "bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-500",
                                    fadingOut.includes(student.id) ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'
                                )}
                            >
                                <div className="text-center sm:text-left">
                                    <div className="text-lg font-semibold text-white">{student.name}</div>
                                    <div className="text-xs text-slate-400">No: {student.number}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => markStatus(student.id, 'geldi')}>✅ Geldi</Button>
                                    <Button variant="destructive" onClick={() => markStatus(student.id, 'gelmedi')}>❌ Gelmedi</Button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-16">
                                <p className="text-2xl font-bold text-green-500">🎉 Tüm öğrencilerin yoklaması tamamlandı!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
                    <DialogContent className="bg-slate-900 border-primary text-white">
                        <DialogHeader>
                            <DialogTitle className="text-primary text-2xl">📊 YOKLAMA İSTATİSTİKLERİ</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center py-4">
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500">
                                <div className="text-4xl font-bold text-green-500">{stats.presentCount}</div>
                                <div className="text-sm text-slate-400">GELEN ÖĞRENCİ</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-red-500">
                                <div className="text-4xl font-bold text-red-500">{stats.absentCount}</div>
                                <div className="text-sm text-slate-400">GELMEYEN ÖĞRENCİ</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="text-4xl font-bold text-yellow-500">{stats.remainingCount}</div>
                                <div className="text-sm text-slate-400">BEKLEYEN ÖĞRENCİ</div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isAbsentModalOpen} onOpenChange={setIsAbsentModalOpen}>
                    <DialogContent className="bg-slate-900 border-destructive text-white">
                        <DialogHeader>
                            <DialogTitle className="text-destructive text-2xl">❌ GELMEYEN ÖĞRENCİLER</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto space-y-2 p-1">
                            {students.filter(s => s.status === 'gelmedi').length > 0 ? (
                                students.filter(s => s.status === 'gelmedi').map(student => (
                                    <div key={student.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{student.name}</p>
                                            <p className="text-xs text-slate-400">No: {student.number}</p>
                                        </div>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => markPresentFromAbsent(student.id)}>Geldi Yap</Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-green-500 py-8">Tüm öğrenciler derste!</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

