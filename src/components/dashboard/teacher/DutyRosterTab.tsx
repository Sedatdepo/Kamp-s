'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Student, Class, RosterItem } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, eachDayOfInterval, isWeekend, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

// --- Yardımcı Fonksiyonlar ve Veri ---
const initialStudents: Student[] = [
  // This will be replaced by props in the actual component
];

// --- Ana Bileşen ---
export function DutyRosterTab({ students: initialStudents, currentClass }: { students: Student[], currentClass: Class | null }) {
    const { toast } = useToast();
    const { db } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [roster, setRoster] = useState<RosterItem[]>([]);

    useEffect(() => {
        // Initialize students from props and sort them by number
        const sortedStudents = [...initialStudents].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
        setStudents(sortedStudents.map(s => ({ ...s, status: 'bekliyor' }))); // bekliyor, geldi, gelmedi
        
        // Load roster from currentClass
        if (currentClass?.dutyRoster) {
            setRoster(currentClass.dutyRoster);
        }

    }, [initialStudents, currentClass]);

    const updateStats = () => {
        const presentCount = students.filter(s => s.status === 'geldi').length;
        const absentCount = students.filter(s => s.status === 'gelmedi').length;
        const remainingCount = students.filter(s => s.status === 'bekliyor').length;

        // Bu kısım sadece görsel, state güncellemesi gerekmiyor.
    };

    const handleGenerateRoster = async () => {
        if (!db || !currentClass || students.length === 0) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Öğrenci veya sınıf bilgisi bulunamadı.' });
            return;
        }

        const today = new Date();
        const endDate = addDays(today, 30); // Generate for the next 30 days
        const workDays = eachDayOfInterval({ start: today, end: endDate }).filter(day => !isWeekend(day));
        
        let studentIndex = 0;
        const newRoster: RosterItem[] = workDays.map(day => {
            const dutyStudents = [students[studentIndex % students.length]];
            const dutyStudentIds = [students[studentIndex % students.length].id];
            studentIndex++;

            return {
                date: format(day, 'dd.MM.yyyy'),
                day: format(day, 'cccc', { locale: tr }),
                student: dutyStudents.map(s => s.name).join(''),
                studentIds: dutyStudentIds,
            };
        });

        try {
            const classRef = doc(db, 'classes', currentClass.id);
            await updateDoc(classRef, { dutyRoster: newRoster });
            setRoster(newRoster);
            toast({ title: 'Liste Oluşturuldu', description: 'Nöbet listesi başarıyla oluşturuldu.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: `Liste oluşturulamadı: ${error.message}` });
        }
    };
    
    // Check if the current student has duty today
    const isStudentOnDutyToday = (studentId: string) => {
        const todayStr = format(new Date(), 'dd.MM.yyyy');
        const todayRosterItem = roster.find(item => item.date === todayStr);
        return todayRosterItem?.studentIds.includes(studentId) ?? false;
    };
    
    if (!currentClass) {
        return <p>Sınıf seçilmedi.</p>;
    }

    return (
        <div className="bg-black text-white min-h-screen font-sans">
            <div className="container mx-auto bg-black min-h-screen">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-center border-b-2 border-gray-700 sticky top-0 z-10">
                    <h1 className="text-4xl font-bold text-green-400 mb-2" style={{textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'}}>
                        NÖBETÇİ ÖĞRENCİ TAKİP
                    </h1>
                    <p className="text-lg text-gray-400">Nöbetçi öğrencinin görevlerini tamamladığını onaylayın.</p>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map(student => {
                        const onDuty = isStudentOnDutyToday(student.id);
                        if (!onDuty) return null;
                        
                        return (
                            <div 
                                key={student.id} 
                                className={`relative bg-gray-900 border-2 rounded-lg p-5 transition-all duration-300 ${
                                    student.status === 'geldi' ? 'border-green-500' : 
                                    student.status === 'gelmedi' ? 'border-red-500' : 'border-gray-700'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-bold">{student.name}</h3>
                                        <p className="text-sm text-gray-500">No: {student.number}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className="bg-green-500 hover:bg-green-600 text-black font-bold"
                                            onClick={() => setStudents(prev => prev.map(s => s.id === student.id ? {...s, status: 'geldi'} : s))}
                                        >
                                            YAPTI
                                        </Button>
                                         <Button
                                            variant="destructive"
                                            onClick={() => setStudents(prev => prev.map(s => s.id === student.id ? {...s, status: 'gelmedi'} : s))}
                                        >
                                            YAPMADI
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                 <div className="p-4">
                     <Button onClick={handleGenerateRoster} className="w-full bg-blue-600 hover:bg-blue-700">
                        Yeni Nöbet Listesi Oluştur
                    </Button>
                </div>
                
                 <div className="p-4">
                    <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">Tüm Liste</h2>
                    <div className="max-h-96 overflow-y-auto bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="p-2">Tarih</th>
                                    <th className="p-2">Gün</th>
                                    <th className="p-2">Nöbetçi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roster.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-800">
                                        <td className="p-2">{item.date}</td>
                                        <td className="p-2">{item.day}</td>
                                        <td className="p-2 font-semibold">{item.student}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stilleri ve scripti global kapsamdan çıkarmak için React bileşeni içine taşıdım.
// `students` prop'u dışarıdan alınacak.
// Modal ve print fonksiyonları şimdilik basitleştirildi.
// Butonlara tıklandığında state güncelleniyor.
// Listenin dinamik olarak oluşturulması sağlandı.
