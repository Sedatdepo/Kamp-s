

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, setDoc, deleteField } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { exportSeatingPlanToRtf } from '@/lib/word-export';
import { FileDown, Share2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


interface SeatingPlanTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function SeatingPlanTab({ students, currentClass, teacherProfile }: SeatingPlanTabProps) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [rowCount, setRowCount] = useState(currentClass?.seatingPlanRows || 4);
    const [colCount, setColCount] = useState(currentClass?.seatingPlanCols || 3);
    const [seatingPlan, setSeatingPlan] = useState<{ [key: string]: string }>(currentClass?.seatingPlan || {});
    
    useEffect(() => {
        setRowCount(currentClass?.seatingPlanRows || 4);
        setColCount(currentClass?.seatingPlanCols || 3);
        setSeatingPlan(currentClass?.seatingPlan || {});
    }, [currentClass]);

    const handleSavePlan = async () => {
        if (!db || !currentClass) return;
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { seatingPlan: seatingPlan, seatingPlanRows: rowCount, seatingPlanCols: colCount });
            toast({ title: 'Oturma planı kaydedildi!' });
        } catch (error) { toast({ variant: 'destructive', title: 'Hata', description: 'Plan kaydedilemedi.' }); }
    };
    
    const handleSeatChange = (key: string, studentId: string) => {
        const newPlan = { ...seatingPlan };
        const oldKey = Object.keys(newPlan).find(k => newPlan[k] === studentId);
        if (oldKey) {
            delete newPlan[oldKey];
        }
        if (studentId === "empty") { 
            delete newPlan[key]; 
        } else { 
            newPlan[key] = studentId; 
        }
        setSeatingPlan(newPlan);
    };

    const handlePublishToggle = async (isPublished: boolean) => {
        if (!db || !currentClass) return;
        const classRef = doc(db, 'classes', currentClass.id);
        const publicViewRef = doc(db, 'publicViews', currentClass.id);

        try {
            await updateDoc(classRef, { isSeatingPlanPublished: isPublished });
            if (isPublished) {
                const publicData = {
                    className: currentClass.name,
                    seatingPlan: {
                        rowCount: rowCount,
                        colCount: colCount,
                        plan: seatingPlan,
                        students: students.map(s => ({ id: s.id, name: s.name, number: s.number })),
                    }
                };
                await setDoc(publicViewRef, publicData, { merge: true });
                toast({ title: 'Oturma planı yayınlandı!' });
            } else {
                await updateDoc(publicViewRef, { seatingPlan: deleteField() });
                toast({ title: 'Oturma planı yayından kaldırıldı.' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Hata', description: 'Yayın durumu değiştirilemedi.' });
        }
    };

    const handleExport = () => {
        if (!currentClass || !students) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Veriler olmadan çıktı alınamaz.'});
            return;
        }
        
        const planWithStudentObjects: { [key: string]: Student } = {};
        for (const key in seatingPlan) {
            const studentId = seatingPlan[key];
            const student = students.find(s => s.id === studentId);
            if (student) {
                planWithStudentObjects[key] = student;
            }
        }

        exportSeatingPlanToRtf({
            seatingPlan: planWithStudentObjects,
            rowCount,
            colCount,
            currentClass,
            teacherProfile,
        });
    };

    const handleWhatsAppShare = () => {
        if (!currentClass?.code) return;
        const publicUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const link = `${publicUrl}/view/seating-plan/${currentClass.code}`;
        const message = encodeURIComponent(`"${currentClass.name}" sınıfı oturma planı: ${link}`);
        window.open(`https://wa.me/?text=${message}`);
    };
    
    if (!students) return <p>Öğrenci verisi yükleniyor...</p>;
    
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Plan Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Sıra Sayısı (Dikey)</Label>
                            <Input type="number" value={rowCount} onChange={e => setRowCount(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sütun Sayısı (Yatay)</Label>
                            <Input type="number" value={colCount} onChange={e => setColCount(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center space-x-2 pt-4 border-t">
                            <Switch 
                                id="publish-plan" 
                                checked={currentClass?.isSeatingPlanPublished || false}
                                onCheckedChange={handlePublishToggle}
                            />
                            <Label htmlFor="publish-plan">Öğrencilerle Paylaş</Label>
                        </div>
                        {currentClass?.isSeatingPlanPublished && (
                            <div className="mt-2 flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (!currentClass?.code) return;
                                    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                                    const link = `${publicUrl}/view/seating-plan/${currentClass.code}`;
                                    navigator.clipboard.writeText(link);
                                    toast({ title: 'Paylaşım linki kopyalandı!' });
                                }}>
                                    <Share2 className="mr-2 h-4 w-4" /> Linki Kopyala
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleWhatsAppShare} className="bg-green-50 text-green-700 border-green-200">
                                    <Share2 className="mr-2 h-4 w-4" /> WhatsApp
                                </Button>
                            </div>
                        )}
                        <div className="flex gap-2 pt-4 border-t">
                            <Button onClick={handleSavePlan} className="w-full">Değişiklikleri Kaydet</Button>
                            <Button onClick={handleExport} variant="outline" className="w-full">
                                <FileDown className="mr-2 h-4 w-4"/> Word İndir
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Sınıf Oturma Planı</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col">
                        <div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md">
                            <span className="font-bold tracking-widest text-lg">TAHTA</span>
                        </div>
                        <div className="flex-1 flex justify-center items-start overflow-x-auto p-4">
                            <div className="grid gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))`, gridTemplateRows: `repeat(${rowCount}, 1fr)` }}>
                                {Array.from({ length: rowCount }).map((_, r) =>
                                    Array.from({ length: colCount }).map((_, c) => (
                                        <div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">
                                            {[0, 1].map((side) => {
                                                const key = `${r}-${c}-${side}`;
                                                const selectedStudentId = seatingPlan[key];
                                                return (
                                                    <div key={key} className="flex-1">
                                                        <Select value={selectedStudentId || "empty"} onValueChange={(studentId) => handleSeatChange(key, studentId)}>
                                                            <SelectTrigger className="h-full bg-background border-primary/20 shadow-sm text-xs p-1">
                                                                <SelectValue placeholder="Boş" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="empty">Boş</SelectItem>
                                                                {students.map(s => (
                                                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.number})</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
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
