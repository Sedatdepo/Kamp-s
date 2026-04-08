'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Download, Users, RotateCcw, School, Upload, FileText, Share, Settings, Eraser, Trash2, X, FileDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Home } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Student as DutyStudent, Class, TeacherProfile, RosterItem, TimetableCell } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportTimetableToRtf } from '@/lib/word-export';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { useDatabase } from '@/hooks/use-database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lesson } from '@/lib/types';
import { Input } from '@/components/ui/input';

const highSchoolLessons = [
    "Matematik", "Fizik", "Kimya", "Biyoloji", "Türk Dili ve Edebiyatı",
    "Tarih", "Coğrafya", "Felsefe", "İngilizce", "Almanca", "Fransızca",
    "Beden Eğitimi", "Müzik", "Görsel Sanatlar", "Din Kültürü ve Ahlak Bilgisi",
    "Psikoloji", "Sosyoloji", "Girişimcilik", "Astronomi", "Yazılım", "Robotik Kodlama",
    "Seçmeli Ders 1", "Seçmeli Ders 2", "Rehberlik"
];


export default function TimetableTab({ classes, lessons }: { classes: Class[], lessons: Lesson[] }) {
  const { db, setDb, loading } = useDatabase();
  const { dersProgrami, schoolInfo } = db;
  const { schedule, timeSlots: periods } = dersProgrami;
  const { toast } = useToast();
  
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [tempPeriods, setTempPeriods] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [isCellEditModalOpen, setIsCellEditModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dayIndex: number, periodIndex: number } | null>(null);
  const [cellSubject, setCellSubject] = useState<Partial<TimetableCell>>({});

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const handleCellClick = (dayIndex: number, periodIndex: number) => {
    const key = `${dayIndex}-${periodIndex}`;
    if (isEraserActive) {
      setDb(prev => {
        const newSchedule = { ...prev.dersProgrami.schedule };
        delete newSchedule[key];
        return { ...prev, dersProgrami: { ...prev.dersProgrami, schedule: newSchedule } };
      });
    } else {
      setEditingCell({ dayIndex, periodIndex });
      const currentCell = schedule[key];
      setCellSubject(currentCell || {});
      setIsCellEditModalOpen(true);
    }
  };

  const handleSaveCell = () => {
    if (!editingCell || !cellSubject.ders || !cellSubject.sinif) {
        toast({title: "Eksik Bilgi", description: "Lütfen ders ve sınıf seçimi yapın.", variant: "destructive"});
        return;
    }
    const key = `${editingCell.dayIndex}-${editingCell.periodIndex}`;
    
    setDb(prev => {
        const newSchedule = { ...prev.dersProgrami.schedule, [key]: cellSubject as TimetableCell };
        return { ...prev, dersProgrami: { ...prev.dersProgrami, schedule: newSchedule } };
    });

    setIsCellEditModalOpen(false);
    setEditingCell(null);
  };
  
  const handleClearAll = () => {
    if (window.confirm('Tüm program silinecek. Emin misiniz?')) {
        setDb(prev => ({...prev, dersProgrami: {...prev.dersProgrami, schedule: {}}}));
    }
  };

  const handleExport = () => {
    if (!schoolInfo) {
        toast({ title: "Hata", description: "Okul bilgileri bulunamadı.", variant: "destructive" });
        return;
    }
    exportTimetableToRtf({
      schedule,
      periods,
      days: DAYS,
      teacherName: schoolInfo.classTeacherName || 'Öğretmen',
      schoolName: schoolInfo.schoolName || '',
      dutyDay: schoolInfo.dutyDay || '',
      dutyPlace: schoolInfo.dutyPlace || '',
    });
  };

  const openTimeSettings = () => {
    setTempPeriods(JSON.parse(JSON.stringify(periods)));
    setShowTimeSettings(true);
  };

  const handleTimeChange = (index: number, field: string, value: string) => {
    const updated: any[] = [...tempPeriods];
    updated[index][field] = value;
    setTempPeriods(updated);
  };

  const saveTimeSettings = () => {
    setDb(prev => ({...prev, dersProgrami: {...prev.dersProgrami, timeSlots: tempPeriods}}));
    setShowTimeSettings(false);
  };
  
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];


  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ders Programı</h1>
        <div className="flex gap-2">
            <Button onClick={openTimeSettings} variant="outline"><Settings size={16} /> Saatleri Düzenle</Button>
            <Button onClick={handleClearAll} variant="destructive"><Trash2 size={16} /> Temizle</Button>
            <Button onClick={handleExport}><FileDown size={16} /> RTF İndir</Button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="w-full min-w-[800px] border-collapse table-fixed">
          <thead>
            <tr>
              <th className="w-24 p-2 border-b border-r">Saatler</th>
              {DAYS.map((day, i) => (
                <th key={i} className="p-2 border-b">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period, pIndex) => (
              <tr key={pIndex}>
                <td className="p-2 border-r border-b text-center">
                  <div className="font-bold text-sm">{period.start}</div>
                  <div className="text-xs text-gray-400">{period.end}</div>
                </td>
                {DAYS.map((_, dIndex) => {
                  const cellKey = `${dIndex}-${pIndex}`;
                  const cellData = schedule[cellKey];
                  return (
                    <td key={dIndex} onClick={() => handleCellClick(dIndex, pIndex)} className={`border-b border-r p-1 h-24 cursor-pointer hover:bg-blue-50`}>
                      {cellData ? (
                        <div className="w-full h-full rounded-md flex flex-col items-center justify-center p-1 text-center border bg-blue-100 text-blue-800 border-blue-200">
                          <div className="font-bold text-sm leading-tight">{cellData.ders}</div>
                          {cellData.sinif && (<div className="text-xs mt-1 font-medium">{cellData.sinif}</div>)}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center">
        <Button onClick={() => setIsEraserActive(!isEraserActive)} variant={isEraserActive ? "destructive" : "outline"}><Eraser size={16} /> {isEraserActive ? 'Silgi Aktif' : 'Silgi Modu'}</Button>
      </div>
      
      {isCellEditModalOpen && editingCell && (
        <Dialog open={isCellEditModalOpen} onOpenChange={setIsCellEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ders Ata</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Select value={cellSubject.ders || ''} onValueChange={(val) => setCellSubject(prev => ({...prev, ders: val}))}>
                        <SelectTrigger><SelectValue placeholder="Ders seçin..." /></SelectTrigger>
                        <SelectContent>{highSchoolLessons.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={cellSubject.sinif || ''} onValueChange={(val) => setCellSubject(prev => ({...prev, sinif: val}))}>
                        <SelectTrigger><SelectValue placeholder="Sınıf seçin..." /></SelectTrigger>
                        <SelectContent>{classes.map((c:any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCellEditModalOpen(false)}>İptal</Button>
                    <Button onClick={handleSaveCell}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {showTimeSettings && (
        <Dialog open={showTimeSettings} onOpenChange={setShowTimeSettings}>
            <DialogContent>
                <DialogHeader><DialogTitle>Ders Saatlerini Düzenle</DialogTitle></DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {tempPeriods.map((period, index) => (
                    <div key={period.id} className="grid grid-cols-5 gap-2 items-center mb-2">
                        <Label className="text-right">Ders {index + 1}</Label>
                        <Input type="time" value={period.start} onChange={(e) => handleTimeChange(index, 'start', e.target.value)} className="col-span-2"/>
                        <Input type="time" value={period.end} onChange={(e) => handleTimeChange(index, 'end', e.target.value)} className="col-span-2"/>
                    </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTimeSettings(false)}>İptal</Button>
                    <Button onClick={saveTimeSettings}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
