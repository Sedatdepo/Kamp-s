'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Printer, Trash2, Plus, Eraser, BookOpen, Clock, ChevronDown, Settings, X, Save, Users, Bell, Timer, MapPin, Calendar, FolderOpen, Upload, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TimetableCell, Class, Lesson } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const DEFAULT_SUBJECTS = [
  { id: 1, name: 'Matematik', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 2, name: 'Türkçe', color: 'bg-red-100 text-red-800 border-red-200' },
  { id: 3, name: 'Fen Bilimleri', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 4, name: 'Sosyal Bilgiler', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 5, name: 'İngilizce', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 6, name: 'Beden Eğitimi', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 7, name: 'Görsel Sanatlar', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { id: 8, name: 'Müzik', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
];

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

const timeToMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function TimetableTab({ classes, lessons }: { classes: Class[], lessons: Lesson[] }) {
  const { db, setDb, loading } = useDatabase();
  const { dersProgrami, schoolInfo } = db;
  const { schedule, timeSlots: periods } = dersProgrami;
  const { toast } = useToast();
  
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [tempPeriods, setTempPeriods] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archives, setArchives] = useState<any[]>([]);
  const [archiveNameInput, setArchiveNameInput] = useState('');
  
  const [isCellEditModalOpen, setIsCellEditModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dayIndex: number, periodIndex: number } | null>(null);
  const [cellSubject, setCellSubject] = useState<Partial<TimetableCell>>({});


  useEffect(() => {
    setCurrentTime(new Date());
    const savedArchives = localStorage.getItem('scheduleArchives');

    if (savedArchives) {
      try {
        setArchives(JSON.parse(savedArchives));
      } catch (e) {
        console.error("Arşivler yüklenemedi", e);
      }
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  const handlePrint = () => window.print();

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

  const getLiveStatus = () => {
    if (!currentTime) return { message: "Saat durumu yükleniyor...", type: "loading", color: "bg-gray-400 text-white" };

    const now = currentTime;
    const currentDayIndex = now.getDay() - 1; 
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (currentDayIndex < 0 || currentDayIndex > 4) return { message: "Hafta sonu! İyi tatiller.", type: "weekend", color: "bg-gray-800 text-white" };

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const startMin = timeToMinutes(period.start);
      const endMin = timeToMinutes(period.end);
      const cellKey = `${currentDayIndex}-${i}`;
      const lessonData = schedule[cellKey];

      if (currentMinutes >= startMin && currentMinutes < endMin) {
        const remaining = endMin - currentMinutes;
        if (lessonData) return { message: `DERS: ${lessonData.ders} (${lessonData.sinif || 'Sınıf Yok'}). Bitişine ${remaining} dk var.`, type: "lesson", color: "bg-green-600 text-white" };
        else return { message: `${i+1}. Ders saati (Program Boş). Bitişine ${remaining} dk var.`, type: "free", color: "bg-gray-500 text-white" };
      }

      if (i < periods.length - 1) {
        const nextPeriod = periods[i+1];
        const nextStartMin = timeToMinutes(nextPeriod.start);
        const nextCellKey = `${currentDayIndex}-${i+1}`;
        const nextLessonData = schedule[nextCellKey];
        if (currentMinutes >= endMin && currentMinutes < nextStartMin) {
            const remaining = nextStartMin - currentMinutes;
            if (nextLessonData) return { message: `TENEFÜS. Sıradaki: ${nextLessonData.ders}. Başlamasına ${remaining} dk var.`, type: "break", color: "bg-orange-600 text-white" };
            else return { message: `TENEFÜS. Sıradaki ders boş. Başlamasına ${remaining} dk var.`, type: "break", color: "bg-yellow-600 text-white" };
        }
      }
    }

    return { message: "Günlük program tamamlandı. İyi dinlenmeler!", type: "finished", color: "bg-indigo-900 text-white" };
  };

  const status = getLiveStatus();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }
  
  const teacherName = schoolInfo?.classTeacherName || 'Öğretmen';
  const dutyDay = schoolInfo?.dutyDay || '';
  const dutyPlace = schoolInfo?.dutyPlace || '';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 p-4 md:p-8 relative">
      
      {showTimeSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
            <DialogContent className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="font-bold text-lg text-gray-900 flex items-center gap-2"> <Clock size={20} className="text-blue-600" />Ders Saatlerini Düzenle</DialogTitle>
                </DialogHeader>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-6 gap-4 text-sm font-bold text-gray-500 mb-2">
                        <div className="col-span-1">Ders</div><div className="col-span-2">Başlangıç</div><div className="col-span-1 text-center">-</div><div className="col-span-2">Bitiş</div>
                    </div>
                    {tempPeriods.map((period, index) => (
                    <div key={period.id} className="grid grid-cols-6 gap-4 items-center mb-3">
                        <div className="font-medium text-gray-900 bg-gray-100 py-2 px-3 rounded text-center">{index+1}</div>
                        <div className="col-span-2"><input type="time" value={period.start} onChange={(e) => handleTimeChange(index, 'start', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500" /></div>
                        <div className="text-center text-gray-400 font-bold">-</div>
                        <div className="col-span-2"><input type="time" value={period.end} onChange={(e) => handleTimeChange(index, 'end', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500" /></div>
                    </div>
                    ))}
                </div>
                <DialogFooter><Button onClick={() => setShowTimeSettings(false)} variant="outline">İptal</Button><Button onClick={saveTimeSettings}><Save size={18} /> Kaydet</Button></DialogFooter>
            </DialogContent>
        </div>
      )}
      
      {isCellEditModalOpen && editingCell && (
        <Dialog open={isCellEditModalOpen} onOpenChange={setIsCellEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ders Ata</DialogTitle>
                    <DialogDescription>{DAYS[editingCell.dayIndex]}, {periods[editingCell.periodIndex].start} - {periods[editingCell.periodIndex].end}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Select value={cellSubject.ders || ''} onValueChange={(val) => setCellSubject(prev => ({...prev, ders: val}))}>
                        <SelectTrigger><SelectValue placeholder="Ders seçin..." /></SelectTrigger>
                        <SelectContent>{lessons.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
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


      <header className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><BookOpen className="w-8 h-8 text-blue-600" />Ders Programı Hazırlayıcı</h1>
          <p className="text-gray-500 mt-1">Ders ve Sınıf seçip tabloya tıklayarak yerleştirin.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
           <Button onClick={openTimeSettings} variant="outline" className="flex items-center gap-2"><Settings size={18} />Saatleri Düzenle</Button>
           <Button onClick={handleClearAll} variant="outline" className="flex items-center gap-2"><Trash2 size={18} />Temizle</Button>
           <Button onClick={handlePrint} className="flex items-center gap-2"><Printer size={18} />Yazdır / PDF</Button>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto mb-8 p-4 rounded-xl shadow-md flex items-center justify-between transition-colors duration-500 print:hidden ${status.color}`}>
        <div className="flex items-center gap-3">
          {status.type === 'lesson' ? <Clock className="animate-pulse" /> : <Bell className={status.type === 'break' ? 'animate-bounce' : ''} />}
          <div>
            <div className="text-lg font-bold">{status.message}</div>
             {currentTime && (<div className="text-xs opacity-90 font-medium">Şu anki saat: {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>)}
          </div>
        </div>
        {status.type !== 'weekend' && status.type !== 'finished' && (<Timer size={32} className="opacity-50" />)}
      </div>

      <main className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
            <div className="hidden print:block p-8 text-center border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Haftalık Ders Programı</h2><div className="text-gray-800 mt-2 font-medium text-xl">{teacherName}</div>
              {(dutyDay || dutyPlace) && (<div className="flex justify-center gap-6 mt-4 text-sm text-gray-700 border-t border-gray-100 pt-4 w-3/4 mx-auto">{dutyDay && (<div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded"><Calendar size={16}/> <strong>Nöbet Günü:</strong> {dutyDay}</div>)}{dutyPlace && (<div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded"><MapPin size={16}/> <strong>Nöbet Yeri:</strong> {dutyPlace}</div>)}</div>)}
            </div>
            {(dutyDay || dutyPlace) && (<div className="print:hidden p-4 bg-gray-50 border-b border-gray-200 flex justify-end gap-3 text-sm text-gray-600">{dutyDay && <span className="flex items-center gap-1"><Calendar size={14}/> {dutyDay}</span>}{dutyPlace && <span className="flex items-center gap-1"><MapPin size={14}/> {dutyPlace}</span>}</div>)}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse table-fixed">
                <thead><tr><th className="w-24 p-4 bg-gray-50 border-b border-r border-gray-200 text-gray-500 font-medium"><div className="flex flex-col items-center"><Clock size={20} className="mb-1" /><span className="text-xs">Saatler</span></div></th>{DAYS.map((day, i) => (<th key={i} className="p-4 bg-gray-50 border-b border-gray-200 text-gray-900 font-bold text-center w-1/5">{day}</th>))}</tr></thead>
                <tbody>
                  {periods.map((period, pIndex) => (
                    <tr key={pIndex} className="group hover:bg-gray-50/50">
                      <td className="p-2 border-r border-b border-gray-200 text-center bg-gray-50/30 align-middle"><div className="font-bold text-gray-600 text-lg">{pIndex+1}</div><div className="text-xs text-gray-400 mt-1 flex flex-col items-center gap-0.5"><span>{period.start}</span><span className="text-[10px] text-gray-300">|</span><span>{period.end}</span></div></td>
                      {DAYS.map((_, dIndex) => {
                        const cellKey = `${dIndex}-${pIndex}`;
                        const cellData = schedule[cellKey];
                        return (
                          <td key={dIndex} onClick={() => handleCellClick(dIndex, pIndex)} className={`border-b border-r border-gray-200 p-1 h-24 cursor-pointer transition-colors relative align-middle ${isEraserActive ? 'hover:bg-red-50 cursor-alias' : 'hover:bg-blue-50'}`}>
                            {cellData ? (<div className={`w-full h-full rounded-lg flex flex-col items-center justify-center p-1 text-center border bg-blue-50 text-blue-800 border-blue-200 shadow-sm group-hover:shadow-md transition-shadow`}><div className="font-bold text-sm leading-tight">{cellData.ders}</div>{cellData.sinif && (<div className="text-xs mt-1 font-medium bg-white/40 px-2 py-0.5 rounded">{cellData.sinif}</div>)}</div>) : (<div className="w-full h-full flex items-center justify-center">{!cellData && !isEraserActive && (<span className="text-gray-300 opacity-0 hover:opacity-100 transition-opacity"><Plus size={16} /></span>)}</div>)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 print:hidden flex justify-between items-center">
                 <button onClick={() => setIsEraserActive(!isEraserActive)} className={`flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${isEraserActive ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 hover:border-gray-400 text-gray-600 hover:bg-gray-50'}`}><Eraser size={16} /><span className="font-medium">{isEraserActive ? 'Silgi Açık (Kapatmak için tıkla)' : 'Silgi Moduna Geç'}</span></button>
                 <span>Ders eklemek veya düzenlemek için bir hücreye tıklayın.</span>
                 <span></span>
            </div>
          </div>
      </main>
      <style>{` @media print { body { background: white; -webkit-print-color-adjust: exact; } .no-print { display: none; } } `}</style>
    </div>
  );
}
