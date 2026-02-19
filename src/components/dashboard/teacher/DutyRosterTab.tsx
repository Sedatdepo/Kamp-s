

'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, Download, Users, RotateCcw, School, Upload, FileText, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Home } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Student as DutyStudent, Class, TeacherProfile, RosterItem } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportDutyRosterToRtf } from '@/lib/word-export';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { doc, updateDoc, setDoc, deleteField } from 'firebase/firestore';


export function DutyRosterTab({ classes, students: allStudents, teacherProfile } : { classes: Class[], students: DutyStudent[], teacherProfile: TeacherProfile | null }) {
  const { toast } = useToast();
  const { db } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState(classes && classes.length > 0 ? classes[0].id : '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [startIndex, setStartIndex] = useState(1);
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [nextStartInfo, setNextStartInfo] = useState<any>(null);

  const students = useMemo(() => {
    if (!selectedClassId) return [];
    return [...allStudents.filter(s => s.classId === selectedClassId)].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true})) || [];
  }, [selectedClassId, allStudents]);

  const currentClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);

  useEffect(() => {
      if(currentClass?.dutyRoster) {
          setRoster(currentClass.dutyRoster);
      } else {
          setRoster([]);
      }
  }, [currentClass]);

  const daysMap = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

  const generateRoster = async () => {
    if (students.length === 0) {
      toast({ title: "Hata", description: "Lütfen önce öğrenci listesi olan bir sınıf seçin.", variant: "destructive" });
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

    let tempRoster: RosterItem[] = [];
    let currentStudentIndex = (startIndex - 1);
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const student1 = students[currentStudentIndex % students.length];
        currentStudentIndex++;
        
        const student2 = students[currentStudentIndex % students.length];
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
    
    if (db && currentClass) {
        const classRef = doc(db, 'classes', currentClass.id);
        await updateDoc(classRef, { dutyRoster: tempRoster });
    }

    setRoster(tempRoster);
    
    const nextIndex = (currentStudentIndex % students.length) + 1;
    setNextStartInfo({
      index: nextIndex,
      name: students[nextIndex - 1]?.name
    });
    toast({ title: "Başarılı", description: "Nöbet listesi oluşturuldu ve kaydedildi." });
  };

  const handleExport = () => {
    if (!roster.length || !currentClass) {
      toast({
        title: 'Hata',
        description: 'Lütfen önce listeyi oluşturun.',
        variant: 'destructive',
      });
      return;
    }
    exportDutyRosterToRtf({
      roster,
      currentClass,
      teacherProfile,
    });
  };
  
  const handleTogglePublish = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    const publicViewRef = doc(db, 'publicViews', currentClass.id);
    
    try {
        await updateDoc(classRef, { isDutyRosterPublished: checked });
        if (checked) {
            const publicData = {
                className: currentClass.name,
                dutyRoster: roster,
            };
            await setDoc(publicViewRef, publicData, { merge: true });
            toast({ title: 'Nöbet listesi yayınlandı!' });
        } else {
            await updateDoc(publicViewRef, { dutyRoster: deleteField() });
            toast({ title: 'Nöbet listesi yayından kaldırıldı.' });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Yayın durumu değiştirilemedi.' });
    }
  };

  const handleWhatsAppShare = () => {
    if (!currentClass) return;
    const link = `${window.location.origin}/view/duty-roster/${currentClass.code}`;
    const message = encodeURIComponent(`"${currentClass.name}" sınıfı nöbet listesi: ${link}`);
    window.open(`https://wa.me/?text=${message}`);
  };

    if (!teacherProfile || !classes) {
        return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>
    }

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-700">
              <School size={20} />
              Okul Bilgileri
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Okul:</strong> {teacherProfile.schoolName}</p>
              <p><strong>Öğretmen:</strong> {teacherProfile.name}</p>
              <p><strong>Müdür:</strong> {teacherProfile.principalName}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-indigo-700">
              <Users size={20} />
              Liste ve Tarihler
            </h2>
            
            <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nöbet Listesi Oluşturulacak Sınıf</label>
                 <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sınıf Seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                        {classes && classes.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
                 <div className="text-xs text-gray-500 mt-1 text-right">
                    {students.length} Öğrenci
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">BAŞLANGIÇ</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">BİTİŞ</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <label className="block text-xs font-bold text-yellow-800 mb-1 flex items-center gap-2">
                <RotateCcw size={14}/>
                KAÇINCIDAN BAŞLASIN?
              </label>
              <input 
                type="number" 
                min="1"
                className="w-full p-2 border border-yellow-300 rounded-lg text-sm"
                value={startIndex}
                onChange={(e) => setStartIndex(parseInt(e.target.value) || 1)}
              />
            </div>

            <button 
              onClick={generateRoster}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar size={20} />
              Listeyi Oluştur ve Kaydet
            </button>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          
          {nextStartInfo && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
              <div>
                <h3 className="font-bold text-green-800">Liste Hazır!</h3>
                <p className="text-sm text-green-700">
                  Gelecek ay <strong>{nextStartInfo.index}</strong> numaralı kişiden (<strong>{nextStartInfo.name}</strong>) başlamalısınız.
                </p>
              </div>
               <Button onClick={handleExport} variant="outline" className="bg-white">
                <FileText className="mr-2 h-4 w-4" /> Word İndir (.rtf)
              </Button>
            </div>
          )}

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 min-h-[600px] relative overflow-x-auto">
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                <Switch
                    id="publish-roster"
                    checked={currentClass?.isDutyRosterPublished || false}
                    onCheckedChange={handleTogglePublish}
                    disabled={!currentClass || roster.length === 0}
                />
                <Label htmlFor="publish-roster" className="text-sm font-medium">Öğrencilerle Paylaş</Label>
                {currentClass?.isDutyRosterPublished && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            if (!currentClass) return;
                            const link = `${window.location.origin}/view/duty-roster/${currentClass.code}`;
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
            </div>
            {roster.length > 0 ? (
              <div className="w-full">
                <div className="text-center mb-8 border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{teacherProfile?.schoolName}</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mt-2 uppercase">{classes.find(c=>c.id === selectedClassId)?.name || ''} SINIFI AYLIK NÖBETÇİ ÖĞRENCİ LİSTESİ</h2>
                </div>
                
                <table id="roster-table" className="w-full border-collapse text-left text-sm mb-12">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="p-3 font-bold border border-gray-300 w-1/4">Tarih</th>
                      <th className="p-3 font-bold border border-gray-300 w-1/4">Gün</th>
                      <th className="p-3 font-bold border border-gray-300 w-1/2">Nöbetçi Öğrenciler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="p-3 border border-gray-300">{item.date}</td>
                        <td className={`p-3 border border-gray-300 font-medium ${item.day === 'Pazartesi' ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {item.day}
                        </td>
                        <td className="p-3 border border-gray-300 font-bold text-gray-800">
                          {item.student}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex flex-col sm:flex-row justify-between items-center px-10 mt-10 space-y-8 sm:space-y-0">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-lg mb-1">{teacherProfile?.name}</p>
                    <p className="text-gray-600">Sınıf Rehber Öğretmeni</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-lg mb-1">{teacherProfile?.principalName}</p>
                    <p className="text-gray-600">Okul Müdürü</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-70 mt-20">
                <School size={64} className="mb-4" />
                <p className="text-lg text-center">
                  Sol taraftan bir sınıf seçin, tarih aralığı belirleyin<br/>
                  ve "Listeyi Oluştur" butonuna basın.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
