
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calendar, Search, BookOpen, Clock, Filter, ArrowRight, Download, CheckCircle, Circle, FolderHeart, FileText, Users, ClipboardCheck, Check, X, Wand2, Save, Settings, Plus, Trash2, Home, List, Mic, Paperclip, Pencil, Video, LayoutTemplate, CaseUpper, KeySquare, FileQuestion, Sparkles, Binary, Shuffle, AlignLeft, ChevronDown, Star, GripVertical, Archive, BookmarkPlus, Library, AlertCircle } from 'lucide-react';
import { TeacherProfile, Class } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_PLANS } from '@/lib/plans';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateMeetingAgendaItem } from '@/ai/flows/generate-meeting-agenda-item-flow';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';


// --- YARDIMCI FONKSİYONLAR ---

const turkishToRTF = (text: any) => {
  if (!text) return "";
  return text.toString()
    .replace(/ğ/g, "\\'f0")
    .replace(/Ğ/g, "\\'d0")
    .replace(/ü/g, "\\'fc")
    .replace(/Ü/g, "\\'dc")
    .replace(/ş/g, "\\'fe")
    .replace(/Ş/g, "\\'de")
    .replace(/ı/g, "\\'fd")
    .replace(/İ/g, "\\'dd")
    .replace(/ö/g, "\\'f6")
    .replace(/Ö/g, "\\'d6")
    .replace(/ç/g, "\\'e7")
    .replace(/Ç/g, "\\'c7")
    .replace(/<br>/g, "\\par ")
    .replace(/\n/g, "\\par ");
};


// --- BİLEŞENLER ---

function SubjectAnnualPlan({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const [activeSubject, setActiveSubject] = useState(Object.keys(ALL_PLANS)[0]);
  const initialGrade = useMemo(() => {
    return currentClass?.name?.match(/\d+/)?.[0] || ALL_PLANS[activeSubject]?.grades[0] || '9';
  }, [currentClass, activeSubject]);
  
  const [activeGrade, setActiveGrade] = useState<string>(initialGrade);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [completedWeeks, setCompletedWeeks] = useState<string[]>([]);

  const subjectData = ALL_PLANS[activeSubject];

  const downloadDailyPlan = (weekData: any, grade: string, subject: string) => {
    let lessonName = "DERS";
    let processTextContent = "Konu ile ilgili temel kavramlar a\\'e7\\'fdklan\\'fdr. \\'d6rnek soru \\'e7\\'f6z\\'fcmleri yap\\'fdl\\'fdr.";

    if(subject === 'Fizik') {
        lessonName = "F\\'ddZ\\'ddK";
        processTextContent = weekData.processComponents 
            ? turkishToRTF(weekData.processComponents) 
            : processTextContent;
    } else if (subject === 'Edebiyat') {
        lessonName = "T\\'dcRK D\\'ddL\\'dd VE EDEB\\'ddYATI";
        processTextContent = weekData.processComponents 
            ? turkishToRTF(weekData.processComponents) 
            : "Metin tahlili ve edebiyat at\\'f6lyesi \\'e7al\\'fd\\'femalar\\'fd yap\\'fdl\\'fdr.";
    }

    const rtfContent = `{\\rtf1\\ansi\\ansicpg1254\\deff0\\nouicompat\\deflang1055
{\\fonttbl{\\f0\\fnil\\fcharset162 Times New Roman;}{\\f1\\fnil\\fcharset162 Arial;}{\\f2\\fnil\\fcharset162 Calibri;}}
{\\colortbl ;\\red0\\green0\\blue0;\\red255\\green0\\blue0;}
\\viewkind4\\uc1 
\\pard\\sa200\\sl276\\slmult1\\qc\\b\\f0\\fs24 T.C.\\par
M\\'ddLL\\'ce E\\'d0\\'ddT\\'ddM BAKANLI\\'d0I\\par
........................................... L\\'ddSES\\'dd\\par
2025-2026 E\\'d0\\'ddT\\'ddM \\'d6\\'d0RET\\'ddM YILI\\par
G\\'dcNL\\'dcK DERS PLANI\\par
\\pard\\sa200\\sl276\\slmult1\\b0\\fs22\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b\\f1\\fs20 B\\'d6L\\'dcM I: DERS K\\'dcML\\'dd\\'d0\\'dd\\b0\\f0\\fs22\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Dersin Ad\\'fd\\cell ${lessonName}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl S\\'fdn\\'fdf / \\'deube\\cell ${grade === '0' ? 'HAZIRLIK' : grade + '. SINIF'}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Tarih / Hafta\\cell ${turkishToRTF(weekData.dates)} / ${turkishToRTF(weekData.week)}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\'dcni\\'fete Ad\\'fd\\cell ${turkishToRTF(weekData.unit || "Genel Tekrar")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Konu\\cell ${turkishToRTF(weekData.topic || "Belirtilmemis")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\'d6nerilen S\\'fcre\\cell ${weekData.hours} Ders Saati\\cell\\row
\\pard\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b\\f1\\fs20 B\\'d6L\\'dcM II: E\\'d0\\'ddT\\'ddM - \\'d6\\'d0RET\\'ddM S\\'dcREC\\'dd\\b0\\f0\\fs22\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Kazan\\'fdm (\\'d6\\'f0renme \\'c7\\'fdkt\\'fds\\'fd)\\cell ${turkishToRTF(weekData.learningOutcome || "Belirtilmemis")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Y\\'f6ntem ve Teknikler\\cell Anlat\\'fdm, Soru-Cevap, Tart\\'fd\\'fea, G\\'f6sterip Yapt\\'fdrma, Problem \\'c7\\'f6zme\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Ara\\'e7, Gere\\'e7 ve Materyaller\\cell Ders Kitab\\'fd, Etkile\\'feimli Tahta, EBA, OGM Materyal\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b DERSE HAZIRLIK VE G\\'ddR\\'dd\\'de\\b0\\par
\\pard\\li100 1. S\\'fdn\\'fdfa selam verilerek girilir, yoklama al\\'fdn\\'fdr.\\par
2. \\'d6nceki derste i\\'felenen konular k\\'fdsaca hat\\'fdrlat\\'fdl\\'fdr.\\par
3. G\\'fcnl\\'fck hayattan konuyla ilgili bir \\'f6rnekle \\'f6\\'f0rencilerin dikkati \\'e7ekilir.\\par
\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b GEL\\'dd\\'deME (KONU \\'dd\\'deLEN\\'dd\\'de\\'dd)\\b0\\par
\\pard\\li100 Bu b\\'f6l\\'fcmde T\\'fcrkiye Y\\'fczy\\'fdl\\'fd Maarif Modeli \\'e7er\\'e7evesinde a\\'fea\\'f0\\'fddaki s\\'fcre\\'e7 bile\\'feenleri takip edilecektir:\\par
\\par
${processTextContent}\\par
\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b SONU\\'c7 VE DE\\'d0ERLEND\\'ddRME\\b0\\par
\\pard\\li100 1. Dersin sonunda konu k\\'fdsaca \\'f6zetlenir.\\par
2. Kazan\\'fdm\\'fdn ger\\'e7ekle\\'feip ger\\'e7ekle\\'femedi\\'f0ini anlamak i\\'e7in sorular sorulur.\\par
3. Gelecek derse haz\\'fdrl\\'fdkl\\'fd gelmeleri istenir.\\cell\\row
\\pard\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx4750
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\qc DERS \\'d6\\'d0RETMEN\\'dd\\par
\\par
\\par
(\\'ddmza)\\cell OKUL M\\'dcD\\'dcR\\'dc\\par
\\par
\\par
(\\'ddmza)\\cell\\row
\\pard\\par
}`;

  const blob = new Blob([rtfContent], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${subject}_${grade === '0' ? 'Hazirlik' : grade}_Sinif_Gunluk_Plan_${weekData.week.replace(/\s/g, "_")}.rtf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  useEffect(() => {
    const gradeFromClass = currentClass?.name?.match(/\d+/)?.[0];
    if (gradeFromClass && subjectData?.grades.includes(gradeFromClass)) {
      setActiveGrade(gradeFromClass);
    } else if (subjectData?.grades) {
      setActiveGrade(subjectData.grades[0]);
    }
  }, [currentClass, activeSubject, subjectData?.grades]);
  
  useEffect(() => {
    const saved = localStorage.getItem(`planCompleted_${activeSubject}_${activeGrade}`);
    if (saved) {
      setCompletedWeeks(JSON.parse(saved));
    } else {
      setCompletedWeeks([]);
    }
  }, [activeSubject, activeGrade]);

  const toggleCompletion = (weekId: string) => {
    const newCompleted = completedWeeks.includes(weekId)
      ? completedWeeks.filter(id => id !== weekId)
      : [...completedWeeks, weekId];
    
    setCompletedWeeks(newCompleted);
    localStorage.setItem(`planCompleted_${activeSubject}_${activeGrade}`, JSON.stringify(newCompleted));
  };

  const calculateProgress = () => {
    const currentData = subjectData?.data[activeGrade]?.data || [];
    const totalWeeks = currentData.filter((w: any) => !w.isBreak).length;
    const completedCount = currentData.filter((w: any) => !w.isBreak && completedWeeks.includes(w.id)).length;
    if (totalWeeks === 0) return 0;
    return Math.round((completedCount / totalWeeks) * 100);
  };
  const progress = calculateProgress();

  const gradeConfig = subjectData?.data[activeGrade];

  const filteredWeeks = useMemo(() => {
    if (!gradeConfig || !gradeConfig.data) return [];
    const currentData = gradeConfig?.data || [];
    return currentData.filter((week: any) => {
      if (activeMonth !== 'all' && week.monthId !== activeMonth) return false;
      if (activeFilter !== 'all' && week.unitType !== activeFilter && !['break', 'okul-temelli', 'sosyal'].includes(week.unitType)) return false;
      if (searchTerm) {
        const text = `${week.unit || ''} ${week.topic || ''} ${week.learningOutcome || ''} ${week.processComponents || ''} ${week.specialDays || ''} ${week.week || ''}`.toLowerCase();
        if (!text.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  }, [gradeConfig, activeFilter, activeMonth, searchTerm]);

  const getAccentColor = (unitType: string) => {
    switch(unitType) {
      case 'fizik-bilimi': return 'border-amber-500';
      case 'kuvvet-hareket': return 'border-red-500';
      case 'akiskanlar': return 'border-sky-500';
      case 'enerji': return 'border-emerald-500';
      case 'elektrik': return 'border-blue-500';
      case 'dalgalar': return 'border-purple-500';
      case 'okul-temelli': return 'border-violet-500';
      case 'sosyal': return 'border-pink-500';
      case 'break': return 'border-yellow-400';
      case 'tema1': return 'border-amber-500';
      case 'tema2': return 'border-red-500';
      case 'tema3': return 'border-sky-500';
      case 'tema4': return 'border-emerald-500';
      default: return 'border-slate-300';
    }
  };

  const getBadgeColor = (unitType: string, subject: string) => {
    if(subject === 'Fizik') {
        switch(unitType) {
          case 'fizik-bilimi': return 'bg-amber-500';
          case 'kuvvet-hareket': return 'bg-red-500';
          case 'akiskanlar': return 'bg-sky-500';
          case 'enerji': return 'bg-emerald-500';
          case 'elektrik': return 'bg-blue-500';
          case 'dalgalar': return 'bg-purple-500';
          case 'okul-temelli': return 'bg-violet-500';
          case 'sosyal': return 'bg-pink-500';
          default: return 'bg-slate-500';
        }
    } else { // Edebiyat
        switch(unitType) {
          case 'tema1': return 'bg-amber-500';
          case 'tema2': return 'bg-red-500';
          case 'tema3': return 'bg-sky-500';
          case 'tema4': return 'bg-emerald-500';
          case 'okul-temelli': return 'bg-violet-500';
          default: return 'bg-slate-500';
        }
    }
  };

  const getBackgroundColor = (unitType: string, isBreak?: boolean) => {
    if (isBreak) return 'bg-yellow-50';
    if (unitType === 'okul-temelli') return 'bg-violet-50';
    if (unitType === 'sosyal') return 'bg-pink-50';
    return 'bg-white';
  };

  if(!subjectData) {
    return <div>Ders verisi yüklenemedi. Lütfen bir ders seçin.</div>
  }

  const subjectHeaderClass = activeSubject === 'Fizik' ? 'text-indigo-950' : 'text-red-900';
  const gradeButtonClass = (grade: string) => activeGrade === grade 
    ? (activeSubject === 'Fizik' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-red-700 text-white border-red-700')
    : (activeSubject === 'Fizik' ? 'bg-white text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50' : 'bg-white text-slate-500 border-transparent hover:text-red-700 hover:bg-red-50');
  const filterButtonClass = (filterId: string) => activeFilter === filterId
    ? (activeSubject === 'Fizik' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-red-700 text-white border-red-700')
    : (activeSubject === 'Fizik' ? 'bg-transparent text-slate-500 border-slate-200 hover:border-indigo-500 hover:text-indigo-600' : 'bg-transparent text-slate-500 border-slate-200 hover:border-red-500 hover:text-red-600');
  const progressBgClass = activeSubject === 'Fizik' ? 'bg-indigo-600' : 'bg-red-600';
  const progressTextClass = activeSubject === 'Fizik' ? 'text-indigo-600' : 'text-red-600';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-full mx-auto">
        <header className="text-center mb-8">
          <h1 className={`text-3xl md:text-4xl font-extrabold mb-2 tracking-tight ${subjectHeaderClass}`}>{activeSubject} Dersi Yıllık Planı</h1>
          <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium">2025-2026 Eğitim-Öğretim Yılı</div>
        </header>

         <div className="flex justify-center gap-4 mb-8">
            <Select value={activeSubject} onValueChange={setActiveSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ders Seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ALL_PLANS).map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          {subjectData.grades.map((grade: string) => (
            <button key={grade} onClick={() => setActiveGrade(grade)} className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${gradeButtonClass(grade)}`}>{grade === '0' ? 'Hazırlık' : `${grade}. Sınıf`}</button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2"><span className="text-sm font-bold text-slate-600">Yıllık İlerleme Durumu</span><span className={`text-sm font-bold ${progressTextClass}`}>%{progress} Tamamlandı</span></div>
          <div className="w-full bg-slate-100 rounded-full h-2.5"><div className={`h-2.5 rounded-full transition-all duration-500 ease-out ${progressBgClass}`} style={{ width: `${progress}%` }}></div></div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {gradeConfig?.filters?.map((filter: any) => (
                <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${filterButtonClass(filter.id)}`}>{filter.label}</button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <select value={activeMonth} onChange={(e) => setActiveMonth(e.target.value)} className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium">
                  <option value="all">Tüm Aylar</option>
                  <option value="eylul">Eylül</option><option value="ekim">Ekim</option><option value="kasim">Kasım</option><option value="aralik">Aralık</option><option value="ocak">Ocak</option><option value="subat">Şubat</option><option value="mart">Mart</option><option value="nisan">Nisan</option><option value="mayis">Mayıs</option><option value="haziran">Haziran</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><Filter size={16} /></div>
              </div>
              <div className="relative">
                <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ara..." className="w-full sm:w-48 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400" />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-400"><Search size={18} /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory">
          {filteredWeeks.length > 0 ? (
            filteredWeeks.map((week: any, index: number) => {
              const isCompleted = completedWeeks.includes(week.id);
              return (
              <div key={index} className={`flex-none w-[90vw] md:w-[400px] snap-center relative rounded-xl p-6 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 ${getAccentColor(week.unitType)} ${isCompleted ? 'bg-slate-50 opacity-75' : getBackgroundColor(week.unitType, week.isBreak)} ${isCompleted ? 'border-slate-300' : 'border-slate-200'}`}>
                {!week.isBreak && (<button onClick={(e) => { e.stopPropagation(); toggleCompletion(week.id); }} className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isCompleted ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-50'}`} title={isCompleted ? "Tamamlandı olarak işaretlendi" : "Tamamlandı olarak işaretle"}>{isCompleted ? <CheckCircle size={24} fill="currentColor" className="text-emerald-500" /> : <Circle size={24} />}</button>)}
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded mb-3 border border-slate-200">{week.month}</span>
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div><h3 className={`text-xl font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{week.week}</h3><div className="flex items-center gap-2 text-slate-500 mt-1 font-medium text-sm"><Calendar size={14} />{week.dates}</div></div>
                  {week.hours > 0 && (<span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide flex items-center gap-1 ${activeSubject === 'Fizik' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'}`}><Clock size={12} />{week.hours} Saat</span>)}
                </div>
                <div className="space-y-4">
                  {(week.unit || week.topic) && (<div>{week.unit && (<span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide text-white mb-2 ${getBadgeColor(week.unitType, activeSubject)}`}>{week.unit}</span>)}{week.topic && (<div className={`text-lg font-semibold leading-tight ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>{week.topic}</div>)}</div>)}
                  {week.learningOutcome && (<div className="bg-white/50 border border-slate-200 p-4 rounded-lg"><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Kazanım</span><p className="text-slate-700 text-sm leading-relaxed">{week.learningOutcome}</p></div>)}
                  {week.processComponents && (<div className="pt-2 border-t border-dashed border-slate-200"><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Süreç Bileşenleri</span><div className="text-slate-600 text-sm leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: week.processComponents }} /></div>)}
                  {week.specialDays && (<div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 mt-2"><BookOpen size={12} />{week.specialDays}</div>)}
                  <button onClick={() => downloadDailyPlan(week, activeGrade, activeSubject)} className={`w-full mt-4 pt-4 border-t border-slate-100 text-center ${activeSubject === 'Fizik' ? 'text-indigo-600 hover:text-indigo-800' : 'text-red-600 hover:text-red-800'} text-sm font-semibold transition-colors flex items-center justify-center gap-2 group`}><Download size={16} className="group-hover:scale-110 transition-transform" /> Günlük Planı İndir (.rtf)</button>
                </div>
              </div>
            )})
          ) : (<div className="flex-1 text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400"><p className="text-lg font-medium">Aradığınız kriterlere uygun sonuç bulunamadı.</p></div>)}
        </div>
        <div className="text-center text-slate-400 text-xs font-medium mt-2 flex items-center justify-center gap-2 md:hidden animate-pulse">Kaydır <ArrowRight size={12} /></div>
      </div>
    </div>
  );
}

const ClassGuidanceAssistant = () => {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState({ type: '', id: '' });

  // Okul ve Öğretmen Bilgileri State'i
  const [schoolDetails, setSchoolDetails] = useState({
    schoolName: '',
    classBranch: 'A', // Şube (A, B, C...)
    teacherName: '',
    counselorName: '',
    principalName: '',
    city: '', // İlçe/İl bilgisi başlık için
    year: '2025-2026'
  });

  // UYGULAMA AÇILDIĞINDA KAYITLI BİLGİLERİ ÇEK
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('rehberlikAsistaniAyarlar');
      if (savedData) {
        setSchoolDetails(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Ayarlar yüklenirken hata oluştu", error);
    }
  }, []);

  // AYARLARI TARAYICIYA KAYDETME FONKSİYONU
  const saveSettingsToBrowser = () => {
    localStorage.setItem('rehberlikAsistaniAyarlar', JSON.stringify(schoolDetails));
    const btn = document.getElementById('saveButton');
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "Kaydedildi! ✓";
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        }, 2000);
    }
  };

  // Rapor İçerikleri State
  const [termReportContent, setTermReportContent] = useState<any>({
    summary: '',
    generalStatus: 'Sınıf içi iletişim ve arkadaşlık ilişkileri olumlu düzeydedir. Akademik başarı takibi düzenli olarak yapılmıştır.',
    referredStudents: '',
    parentMeetings: '',
    customItems: [] 
  });

  const [endYearReportContent, setEndYearReportContent] = useState<any>({
    summary: '',
    generalStatus: 'Yıl boyunca sınıfın genel uyumu, arkadaşlık ilişkileri ve derse katılım düzeyleri olumlu seyretmiştir.',
    referredStudents: '',
    parentMeetings: '',
    customItems: []
  });

  // Veri Tabanı
  const plans: Record<string, any[]> = {
    '9': [
      { month: 'Eylül', week: '1', kazanim: 'Okulunun ve sınıfının bir üyesi olduğunu fark eder. (Çimento Duygular)', tur: 'Oryantasyon' },
      { month: 'Eylül', week: '2', kazanim: 'Okulun yakın çevresini, bölümlerini ve çalışanları tanır. (Hoş Geldin Dostum)', tur: 'Oryantasyon' },
      { month: 'Eylül', week: '3', kazanim: 'Okulun eğitsel imkânları hakkında bilgi edinir. (Neler Oluyor Hayatta)', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Yönetmeliklerin kendisini ilgilendiren kısımlarını öğrenir. (Bilmekte Fayda Var)', tur: 'Oryantasyon' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Okul hazırlığına ilişkin sorumluluklarını üstlenir. (Keşke\'lerin Değil İyi ki\'lerin Olsun)', tur: 'Akademik' },
      { month: 'Ekim', week: '3', kazanim: 'Kendi mesleki değerlerinin farkına varır. (Mesleki Değerlerim Ne Durumda)', tur: 'Kariyer' },
      { month: 'Ekim', week: '4', kazanim: 'Yaşam değerlerinin farkına varır. (Değerlerimle Değerliyim)', tur: 'Kişisel' },
      { month: 'Kasım', week: '1', kazanim: 'Kişisel güvenliği için “Hayır!” demeyi alışkanlık hâline getirir. (Güvenlik Duvarım)', tur: 'Kişisel Güvenlik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'İhmal ve istismar türlerini ayırt eder. (Kırmızı Işık Yak)', tur: 'Kişisel Güvenlik' },
      { month: 'Kasım', week: '4', kazanim: 'Akran zorbalığı ile baş etme yöntemlerini kullanır. (Zorbalığa Dur De)', tur: 'Sosyal' },
      { month: 'Aralık', week: '1', kazanim: 'Etkili iletişim becerilerini kullanır. (İletişim Engelleri)', tur: 'Sosyal' },
      { month: 'Aralık', week: '2', kazanim: 'Çatışma çözme becerilerini günlük hayatta kullanır. (Çatışmayı Çözüyorum)', tur: 'Sosyal' },
      { month: 'Aralık', week: '3', kazanim: 'Sanal arkadaşlığı arkadaşlık ilişkileri kapsamında sorgular. (Sanal Kanka)', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '4', kazanim: 'Öfke yönetimi becerilerini geliştirir. (Öfkem Kontrolümde)', tur: 'Duygusal' },
      { month: 'Ocak', week: '1', kazanim: 'Verimli ders çalışma tekniklerini uygular. (Zamanı Yönetiyorum)', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Dönem sonu değerlendirmesi yapar.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Kısa ve uzun vadeli hedefler belirler. (Hedefime Yürüyorum)', tur: 'Akademik' },
      { month: 'Şubat', week: '2', kazanim: 'Alan/bölüm/dal seçiminde ilgi ve yeteneklerini dikkate alır. (Yetenek, İlgi ve Değerler)', tur: 'Kariyer' },
      { month: 'Şubat', week: '3', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi) Uygulaması', tur: 'Tanıma' },
      { month: 'Şubat', week: '4', kazanim: 'Kariyer hazırlığı sürecinde amaçlarına uygun karar verir. (Adım Adım Alanım)', tur: 'Kariyer' },
      { month: 'Mart', week: '1', kazanim: 'Bağımlılık yapıcı maddelerden uzak durur. (Hayır Diyebilmek)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '2', kazanim: 'Teknoloji bağımlılığının etkilerini fark eder. (Ekranı Yönet)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '3', kazanim: 'Sağlıklı yaşam bilinci geliştirir. (Sağlığım Geleceğim)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '4', kazanim: 'Toplumsal rollerinin gerektirdiği sorumlulukları değerlendirir. (Rolden Role)', tur: 'Sosyal' },
      { month: 'Nisan', week: '1', kazanim: 'Sahip olduğu karakter güçlerini fark eder. (Güç Bende Artık)', tur: 'Kişisel' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Karakter güçlerini zorluklar karşısında kullanmayı bilir. (Çözüm Karakterimde)', tur: 'Kişisel' },
      { month: 'Nisan', week: '4', kazanim: 'Meslekleri tanır ve araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '1', kazanim: 'İş birliği içinde çalışmanın önemini kavrar.', tur: 'Sosyal' },
      { month: 'Mayıs', week: '2', kazanim: 'Zaman yönetimi konusunda kendini değerlendirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '3', kazanim: 'Sınav kaygısı ile baş etme yollarını öğrenir.', tur: 'Duygusal' },
      { month: 'Mayıs', week: '4', kazanim: 'Akran baskısıyla baş etme becerisi geliştirir.', tur: 'Sosyal' },
      { month: 'Haziran', week: '1', kazanim: 'Kimden, nereden ve ne zaman yardım isteyebileceğini bilir. (İhtiyaç Duyduğumda...)', tur: 'Kişisel Güvenlik' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu değerlendirmesi ve kapanış.', tur: 'Değerlendirme' }
    ],
    '10': [
      { month: 'Eylül', week: '1', kazanim: 'Yaşamındaki karar verme sürecini etkileyen faktörleri açıklar. (Son Kararım)', tur: 'Kariyer' },
      { month: 'Eylül', week: '2', kazanim: 'Okul içi/dışı etkinliklerin katkılarını değerlendirir. (Şefim! Bize Bir Faaliyet!)', tur: 'Sosyal' },
      { month: 'Eylül', week: '3', kazanim: 'Etkinliklere katılırken ilgi ve yeteneklerini dikkate alır. (Hangi İstasyon)', tur: 'Kişisel' },
      { month: 'Eylül', week: '4', kazanim: 'Alan/ders seçiminde ilgi ve yetenekleri dikkate alır. (Seçim Pusulası)', tur: 'Kariyer' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Karar verme basamaklarını kullanır. (Eksik Parçalar)', tur: 'Kariyer' },
      { month: 'Ekim', week: '3', kazanim: 'Öğrenme ve verimli çalışma stratejilerini açıklar. (Aklımdan Uçurma)', tur: 'Akademik' },
      { month: 'Ekim', week: '4', kazanim: 'Verimli çalışma stratejilerini kullanma açısından kendini değerlendirir. (Stratejik Miyim?)', tur: 'Akademik' },
      { month: 'Kasım', week: '1', kazanim: 'Ben bunu nasıl öğrendim? (Öğrenme Stilleri)', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'Zorlukların çaba ile üstesinden gelinebileceğini fark eder. (Zorluklarımın Farkındayım)', tur: 'Kişisel' },
      { month: 'Kasım', week: '4', kazanim: 'Fiziksel iyilik halini yaşamında uygular. (İyilik Hali Yolculuğu)', tur: 'Sağlıklı Yaşam' },
      { month: 'Aralık', week: '1', kazanim: 'Siber zorbalık kavramını açıklar.', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '2', kazanim: 'Siber zorbalıkla baş etme yöntemlerini kullanır.', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '3', kazanim: 'İletişimde ben dilini kullanır.', tur: 'Sosyal' },
      { month: 'Aralık', week: '4', kazanim: 'Empati kurma becerisini geliştirir.', tur: 'Sosyal' },
      { month: 'Ocak', week: '1', kazanim: 'Dönem sonu değerlendirmesi.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '2', kazanim: 'Karne görüşmeleri ve motivasyon.', tur: 'Akademik' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Bilişim teknolojileri kullanımında kendini yönetir. (Yönetim Bende Mi?)', tur: 'Teknoloji' },
      { month: 'Şubat', week: '2', kazanim: 'Gerektiğinde arkadaşlığını sonlandırır. (Şiddet Varsa Ben Yokum)', tur: 'Sosyal' },
      { month: 'Şubat', week: '3', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi)', tur: 'Tanıma' },
      { month: 'Şubat', week: '4', kazanim: 'Zorluklar karşısında umut etme ve çabalama becerisi. (Vazgeçme, Umut Et)', tur: 'Kişisel' },
      { month: 'Mart', week: '1', kazanim: 'Yerel ve küresel sorunları fark eder. (Dünyada Neler Oluyor?)', tur: 'Sosyal' },
      { month: 'Mart', week: '2', kazanim: 'Kişisel sınırlarını korur.', tur: 'Kişisel' },
      { month: 'Mart', week: '3', kazanim: 'Bağımlılıkla mücadele yöntemlerini bilir.', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '4', kazanim: 'Stresle baş etme yöntemlerini kullanır.', tur: 'Duygusal' },
      { month: 'Nisan', week: '1', kazanim: 'Öğrenme ortamlarındaki duygularını düzenler. (Duygumu Düzenledim)', tur: 'Duygusal' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Mesleki değerlerini fark eder.', tur: 'Kariyer' },
      { month: 'Nisan', week: '4', kazanim: 'Meslekleri araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '1', kazanim: 'Toplumsal cinsiyet rollerine ilişkin farkındalık kazanır.', tur: 'Sosyal' },
      { month: 'Mayıs', week: '2', kazanim: 'Geleceği planlama becerisi geliştirir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Zaman yönetimi becerilerini gözden geçirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '4', kazanim: 'Duygularını ifade etme becerilerini geliştirir.', tur: 'Duygusal' },
      { month: 'Haziran', week: '1', kazanim: 'Takım çalışmalarının kişisel gelişimine etkisini fark eder. (Takımımla Gelişiyorum)', tur: 'Sosyal' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu genel değerlendirmesi.', tur: 'Değerlendirme' }
    ],
    '11': [
      { month: 'Eylül', week: '1', kazanim: 'Kişilik özelliklerine ilişkin farkındalık geliştirir. (Kişilik Yapbozum)', tur: 'Kişisel' },
      { month: 'Eylül', week: '2', kazanim: 'Başarılı olduğu durumlarda kendini takdir eder. (Yaşam Karnem)', tur: 'Duygusal' },
      { month: 'Eylül', week: '3', kazanim: 'Akademik konulardaki güçlü yönlerini fark eder. (Güçlü Yönlerim)', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Başarmak için çalışmanın gerekliliğine inanır. (Çalış ve Başar)', tur: 'Akademik' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Ergen-ebeveyn ilişkilerini değerlendirir. (Aile Halkası)', tur: 'Sosyal' },
      { month: 'Ekim', week: '3', kazanim: 'Akademik başarının önündeki engelleri fark eder. (Başarımın Önündeki Engeller)', tur: 'Akademik' },
      { month: 'Ekim', week: '4', kazanim: 'Akademik sorumlulukları ertelemenin sonuçlarını fark eder. (Erteleme Bingosu)', tur: 'Akademik' },
      { month: 'Kasım', week: '1', kazanim: 'Eğitsel etkinliklerdeki başarısızlıkların öğrenme parçası olduğunu kavrar.', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'İlgi, yetenek ve mesleki değerlerini ilişkilendirir. (Başarısızlık mı Veri mi?)', tur: 'Kariyer' },
      { month: 'Kasım', week: '4', kazanim: 'Meslek seçiminde karar verme becerisini kullanır. (Benim Kararım)', tur: 'Kariyer' },
      { month: 'Aralık', week: '1', kazanim: 'Sınavlara hazırlanmayı etkileyen faktörleri açıklar. (Bugün Çok İyi Çalışacağım)', tur: 'Akademik' },
      { month: 'Aralık', week: '2', kazanim: 'Kişisel seçimleri ile toplumsal roller arasında denge kurar. (Seçimler ve Denge)', tur: 'Sosyal' },
      { month: 'Aralık', week: '3', kazanim: 'Öfke ile baş etme yollarını kullanır.', tur: 'Duygusal' },
      { month: 'Aralık', week: '4', kazanim: 'Stres yönetimi tekniklerini uygular.', tur: 'Duygusal' },
      { month: 'Ocak', week: '1', kazanim: 'Verimli ders çalışma planı hazırlar.', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Dönem değerlendirmesi.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Mesleki bilgi kaynaklarını kullanır. (Güvenilir mi?)', tur: 'Kariyer' },
      { month: 'Şubat', week: '2', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi)', tur: 'Tanıma' },
      { month: 'Şubat', week: '3', kazanim: 'Akademik amaçlarıyla kariyer seçenekleri arasındaki ilişkiyi açıklar. (Amaçlarım ve Seçeneklerim)', tur: 'Kariyer' },
      { month: 'Şubat', week: '4', kazanim: 'Akran grubunun yaşamındaki yerini açıklar. (Benim İçin Arkadaşlık)', tur: 'Sosyal' },
      { month: 'Mart', week: '1', kazanim: 'Mesleki bilgi kaynaklarını kullanır (İncele/Araştır).', tur: 'Kariyer' },
      { month: 'Mart', week: '2', kazanim: 'Seçmeyi düşündüğü mesleklerle ilgili kariyer planlaması yapar. (Kariyerimi Planlıyorum)', tur: 'Kariyer' },
      { month: 'Mart', week: '3', kazanim: 'Yükseköğretim programlarını tanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '4', kazanim: 'Sınav sistemini (YKS) tanır.', tur: 'Kariyer' },
      { month: 'Nisan', week: '1', kazanim: 'Yükseköğretim kurumlarını ziyaret eder.', tur: 'Kariyer' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Motivasyonunu artırıcı stratejiler geliştirir.', tur: 'Akademik' },
      { month: 'Nisan', week: '4', kazanim: 'Zaman yönetimi becerilerini geliştirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '1', kazanim: 'Staj ve iş imkanlarını araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '2', kazanim: 'CV hazırlama tekniklerini öğrenir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Mülakat teknikleri hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '4', kazanim: 'İş dünyasında gerekli becerileri fark eder.', tur: 'Kariyer' },
      { month: 'Haziran', week: '1', kazanim: 'Kimlik gelişimi ile sosyal bağlamları ilişkilendirir. (Sosyal Bağlamda Kimliğim)', tur: 'Kişisel' },
      { month: 'Haziran', week: '2', kazanim: 'Ortaöğretim sonrası kariyer tercihleri ile ilgili yardım kaynaklarına başvurur.', tur: 'Kariyer' }
    ],
    '12': [
      { month: 'Eylül', week: '1', kazanim: 'Zamanını, ihtiyaçları ve sorumlulukları çerçevesinde planlar.', tur: 'Akademik' },
      { month: 'Eylül', week: '2', kazanim: 'Sahip olduğu karakter güçlerini zorluklar karşısında kullanır.', tur: 'Kişisel' },
      { month: 'Eylül', week: '3', kazanim: 'Okula hazırlıklı gelme ile akademik gelişimi arasında bağ kurar.', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Zamanını planlama ve yönetme becerilerini geliştirir.', tur: 'Akademik' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Bilişim teknolojileri kullanımı konusunda kendini değerlendirir.', tur: 'Teknoloji' },
      { month: 'Ekim', week: '3', kazanim: 'Kendi bedenine ilişkin olumlu tutum geliştirir.', tur: 'Kişisel' },
      { month: 'Ekim', week: '4', kazanim: 'Üst öğretim kurumlarına geçiş sınavlarına hazırlanmak için strateji geliştirir.', tur: 'Kariyer' },
      { month: 'Kasım', week: '1', kazanim: 'Akademik çalışmalarını zamanında bitirmede kararlı olur.', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'Kariyer planlama sürecinde kişisel özelliklerini kullanır.', tur: 'Kariyer' },
      { month: 'Kasım', week: '4', kazanim: 'Ortaöğretim sonrası kariyer tercihleri için kaynaklara başvurur.', tur: 'Kariyer' },
      { month: 'Aralık', week: '1', kazanim: 'Kültürel farklılıklara saygı duyar.', tur: 'Sosyal' },
      { month: 'Aralık', week: '2', kazanim: 'Sınav kaygısı ile baş etme yöntemlerini kullanır.', tur: 'Duygusal' },
      { month: 'Aralık', week: '3', kazanim: 'Motivasyonunu artırma yollarını bilir.', tur: 'Akademik' },
      { month: 'Aralık', week: '4', kazanim: 'YKS başvuru süreci hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Ocak', week: '1', kazanim: 'Dönem sonu değerlendirmesi ve hedef güncelleme.', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Karne ve tatil planı.', tur: 'Sosyal' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Karakter güçleri ile iyi oluş arasında bağ kurar.', tur: 'Kişisel' },
      { month: 'Şubat', week: '2', kazanim: 'Yaşadığı yoğun duyguları yönetir.', tur: 'Duygusal' },
      { month: 'Şubat', week: '3', kazanim: 'İyi oluşunu destekleyen duyguları yaşamında sıklıkla deneyimler.', tur: 'Duygusal' },
      { month: 'Şubat', week: '4', kazanim: 'Meslek seçiminde karar verme becerisini kullanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '1', kazanim: 'Mesleki bilgi kaynaklarını aktif kullanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '2', kazanim: 'Değişim ve belirsizlikle baş eder.', tur: 'Kişisel' },
      { month: 'Mart', week: '3', kazanim: 'Seçmeyi düşündüğü mesleklerle ilgili kariyer planlaması yapar. (Kariyerimi Planlıyorum)', tur: 'Kariyer' },
      { month: 'Mart', week: '4', kazanim: 'Sınavlara ilişkin yoğun duygularını yönetir (Sınav Kaygısı).', tur: 'Duygusal' },
      { month: 'Nisan', week: '1', kazanim: 'Üst öğretim kurumuna ya da iş yaşamına ilişkin kariyer kararını verir.', tur: 'Kariyer' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Üst öğretim kurumlarına geçiş sınavlarıyla ilgili detaylı bilgi edinir.', tur: 'Kariyer' },
      { month: 'Nisan', week: '4', kazanim: 'Sınav öncesi son stratejileri belirler.', tur: 'Akademik' },
      { month: 'Mayıs', week: '1', kazanim: 'Öğrenmenin hayat boyu devam ettiğine inanır.', tur: 'Akademik' },
      { month: 'Mayıs', week: '2', kazanim: 'Mezuniyet sonrası için planlar yapar.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Tercih süreci hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '4', kazanim: 'Üniversite yaşamına uyum.', tur: 'Oryantasyon' },
      { month: 'Haziran', week: '1', kazanim: 'Bir üst öğretim kurumuna ilişkin ön bilgiler edinir.', tur: 'Kariyer' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu değerlendirmesi ve mezuniyet.', tur: 'Değerlendirme' }
    ]
  };

  // Madde Ekleme/Çıkarma/Güncelleme Fonksiyonları
  const addCustomItem = (reportType) => {
    const newItem = { id: Date.now(), title: '', content: '' };
    if (reportType === 'term') setTermReportContent(prev => ({ ...prev, customItems: [...prev.customItems, newItem] }));
    else setEndYearReportContent(prev => ({ ...prev, customItems: [...prev.customItems, newItem] }));
  };

  const removeCustomItem = (reportType, id) => {
    if (reportType === 'term') setTermReportContent(prev => ({ ...prev, customItems: prev.customItems.filter(i => i.id !== id) }));
    else setEndYearReportContent(prev => ({ ...prev, customItems: prev.customItems.filter(i => i.id !== id) }));
  };

  const updateCustomItem = (reportType, id, field, value) => {
    const updater = reportType === 'term' ? setTermReportContent : setEndYearReportContent;
    updater(prev => ({
      ...prev,
      customItems: prev.customItems.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  // AI İçerik Üretme
  const generateAIContent = (field, reportType, customTitle = '') => {
    setIsGenerating({ type: field, id: customTitle || 'main' });
    
    setTimeout(() => {
      let content = '';
      if (field === 'referredStudents') content = "Sınıf rehber öğretmeni ve branş öğretmenlerinin gözlemleri neticesinde; akademik başarısızlık, devam devamsızlık ve uyum sorunları yaşayan toplam ... öğrenci ile ön görüşme yapılmış, detaylı inceleme ve destek için Okul Rehberlik Servisine yönlendirilmiştir.";
      else if (field === 'parentMeetings') content = "Dönem boyunca genel veli toplantısının yanı sıra, risk grubunda bulunan ve akademik takibi gereken öğrencilerin velileriyle bireysel görüşmeler gerçekleştirilmiştir. Bu görüşmelerde iş birliğinin önemi vurgulanmış ve öğrenci gelişimleri hakkında düzenli bilgilendirme yapılmıştır.";
      else if (field === 'custom') content = `${customTitle} konusunda sınıf genelinde bilgilendirme çalışmaları yapılmış, öğrencilerin farkındalık kazanmaları hedeflenmiştir. Süreç titizlikle takip edilmiştir.`;
      else if (field === 'summary') {
         if (selectedGrade === '9') content = "2025-2026 eğitim yılında 9. sınıflar için uyum çalışmaları ve risk analizleri ön planda tutulmuştur. Oryantasyon süreci başarıyla tamamlanmıştır.";
         else if (selectedGrade === '12') content = "YKS hazırlık süreci, hedef belirleme ve motivasyon çalışmaları yoğun bir şekilde sürdürülmüştür. Sınav kaygısı ile baş etme seminerleri verilmiştir.";
         else content = "Dönem boyunca planlanan rehberlik etkinlikleri, öğrencilerin yaş gelişim özellikleri dikkate alınarak uygulanmıştır. Akademik ve sosyal gelişimleri takip edilmiştir.";
      }
      else if (field === 'generalStatus') content = "Sınıfın genel başarı grafiği ve disiplin durumu olumlu seyretmektedir. Öğrenciler arası iletişim sağlıklı bir düzeydedir.";

      const updater = reportType === 'term' ? setTermReportContent : setEndYearReportContent;
      if (field === 'custom') {
         const currentReport = reportType === 'term' ? termReportContent : endYearReportContent;
         const targetItem = currentReport.customItems.find(i => i.id === customTitle); 
         if(targetItem) updateCustomItem(reportType, customTitle, 'content', content);
      } else {
         updater(prev => ({ ...prev, [field]: content }));
      }
      setIsGenerating({ type: '', id: '' });
    }, 1000);
  };

  const downloadWord = (content, filename) => {
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Doc</title><style>body{font-family: 'Times New Roman', serif; font-size:12pt;} table{border-collapse: collapse; width: 100%;} td, th{border: 1px solid #000; padding: 5px; text-align: left;} .header{text-align:center; font-weight:bold; margin-bottom:20px;} .footer{margin-top:50px; display:flex; justify-content:space-between;} .signature-block{text-align:center; width: 30%;}</style></head><body>`;
    const postHtml = "</body></html>";
    const blob = new Blob(['\ufeff', preHtml + content + postHtml], { type: 'application/msword' });
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename + ".doc";
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Dinamik Başlık ve İmza Bloğu
  const getDocumentHeader = (title) => `
    <div class="header">
      <p>T.C.<br>${schoolDetails.city ? schoolDetails.city.toUpperCase() + ' KAYMAKAMLIĞI' : '................... KAYMAKAMLIĞI'}<br>${schoolDetails.schoolName ? schoolDetails.schoolName.toUpperCase() : '.........................'} MÜDÜRLÜĞÜ</p>
      <br>
      <p>${schoolDetails.year} EĞİTİM ÖĞRETİM YILI<br>${title}</p>
    </div>
  `;

  const getDocumentFooter = () => `
    <div class="footer">
      <div class="signature-block">
        <p>${schoolDetails.teacherName || '................................'}<br>Sınıf Rehber Öğretmeni</p>
      </div>
      <div class="signature-block">
        <p>${schoolDetails.counselorName || '................................'}<br>Okul Rehber Öğretmeni</p>
      </div>
      <div class="signature-block">
        <p>${schoolDetails.principalName || '................................'}<br>Okul Müdürü</p>
      </div>
    </div>
  `;

  const exportAnnualPlan = () => {
    let tableRows = plans[selectedGrade].map(item => `<tr><td>${item.month}</td><td>${item.week}. Hafta</td><td>${item.kazanim}</td><td>${item.tur}</td></tr>`).join('');
    const content = `
      ${getDocumentHeader(`${selectedGrade}/${schoolDetails.classBranch} SINIFI REHBERLİK YILLIK PLANI`)}
      <table><thead><tr style="background-color:#f0f0f0;"><th>Ay</th><th>Hafta</th><th>Kazanım / Etkinlik</th><th>Alan</th></tr></thead><tbody>${tableRows}</tbody></table>
      ${getDocumentFooter()}
    `;
    downloadWord(content, `${selectedGrade}-${schoolDetails.classBranch}_Yillik_Plan`);
  };

  const exportActivityReport = () => {
    const currentActivity = plans[selectedGrade][selectedActivityIndex];
    const content = `
      ${getDocumentHeader('HAFTALIK SINIF REHBERLİK ETKİNLİK RAPORU')}
      <p><strong>Tarih:</strong> ..............................</p>
      <p><strong>Sınıf:</strong> ${selectedGrade}/${schoolDetails.classBranch}</p>
      <p><strong>Hafta:</strong> ${currentActivity.month} - ${currentActivity.week}. Hafta</p>
      <br>
      <table border="1" cellpadding="10">
        <tr><td width="30%" bgcolor="#f0f0f0"><strong>Kazanım / Etkinlik Adı</strong></td><td>${currentActivity.kazanim}</td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Katılan Öğrenci Sayısı</strong></td><td></td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Katılmayan Öğrenci Sayısı</strong></td><td></td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Değerlendirme</strong></td><td height="100">Etkinlik plana uygun olarak işlenmiş, öğrencilerin derse katılımı sağlanmıştır.</td></tr>
      </table>
      <br>
      <div style="text-align:center; width:200px; margin-left:auto;">
        <p>${schoolDetails.teacherName || '................................'}<br>Sınıf Rehber Öğretmeni</p>
      </div>
    `;
    downloadWord(content, `Etkinlik_Raporu_${currentActivity.month}_${currentActivity.week}`);
  };

  const generateReportHTML = (title, reportContent, isTerm) => {
    const term1Months = ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak'];
    const term2Months = ['Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'];
    const targetMonths = isTerm ? term1Months : [...term1Months, ...term2Months];
    const listTitle = isTerm ? '1. DÖNEM' : 'YIL BOYUNCA';
    const activities = plans[selectedGrade].filter(i => targetMonths.includes(i.month));
    const activitiesTable = activities.map(item => `<tr><td>${item.month}</td><td>${item.week}. Hafta</td><td>${item.kazanim}</td><td>${item.tur}</td></tr>`).join('');
    
    let customItemsHTML = reportContent.customItems.map((item, index) => `<h3>${String.fromCharCode(70 + index)}) ${item.title.toUpperCase()}</h3><p style="text-align: justify;">${item.content || '...'}</p><br>`).join('');

    return `
      ${getDocumentHeader(title)}
      <p><strong>Sınıf:</strong> ${selectedGrade}/${schoolDetails.classBranch}</p>
      <p><strong>Dönem:</strong> ${isTerm ? '1. Dönem' : 'Yıl Sonu'}</p>
      <br>
      <h3>A) YAPILAN ÇALIŞMALARIN ÖZETİ</h3>
      <p style="text-align: justify;">${reportContent.summary || '...'}</p>
      <br>
      <h4>${listTitle} GERÇEKLEŞTİRİLEN ETKİNLİKLER ÇİZELGESİ</h4>
      <table border="1" cellpadding="5" style="font-size: 11px;"><thead><tr bgcolor="#f0f0f0"><th>Ay</th><th>Hafta</th><th>Kazanım</th><th>Alan</th></tr></thead><tbody>${activitiesTable}</tbody></table>
      <br>
      <h3>B) YAPILAMAYAN ETKİNLİKLER VE NEDENLERİ</h3>
      <table border="1" cellpadding="5"><tr><td width="50%" bgcolor="#f0f0f0"><strong>Yapılamayan Etkinlik</strong></td><td width="50%" bgcolor="#f0f0f0"><strong>Nedeni</strong></td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table>
      <br>
      <h3>C) SINIFIN GENEL DURUMU</h3>
      <p style="text-align: justify;">${reportContent.generalStatus || '...'}</p>
      <br>
      <h3>D) REHBERLİK SERVİSİNE YÖNLENDİRİLEN ÖĞRENCİLER</h3>
      <p style="text-align: justify;">${reportContent.referredStudents || '...'}</p>
      <br>
      <h3>E) VELİ GÖRÜŞMELERİ</h3>
      <p style="text-align: justify;">${reportContent.parentMeetings || '...'}</p>
      <br>
      ${customItemsHTML}
      <h3>${String.fromCharCode(70 + reportContent.customItems.length)}) REHBERLİK SERVİSİNDEN BEKLENTİLER</h3>
      <p>..........................................................................................................................................................................</p>
      <br>
      ${getDocumentFooter()}
    `;
  };

  const renderReportUI = (reportType) => {
    const isTerm = reportType === 'term';
    const contentState = isTerm ? termReportContent : endYearReportContent;
    const setContentState = isTerm ? setTermReportContent : setEndYearReportContent;
    const title = isTerm ? '1. Dönem Sonu Faaliyet Raporu' : 'Yıl Sonu Faaliyet Raporu';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500">{isTerm ? 'Ocak ayı' : 'Haziran ayı'} teslim edilir.</p>
              </div>
              <button onClick={() => downloadWord(generateReportHTML(title.toUpperCase(), contentState, isTerm), `${selectedGrade}_Sinif_${isTerm ? 'Donem' : 'Yil'}_Sonu_Raporu`)} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 shadow-sm transition-colors">
                <Download size={18} /> Word İndir
              </button>
            </div>
    
            <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-gray-800">A) Yapılan Çalışmaların Özeti</h3>
                       <button onClick={() => generateAIContent('summary', reportType)} disabled={isGenerating.type === 'summary'} className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 border border-purple-200">
                           {isGenerating.type === 'summary' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {isGenerating.type === 'summary' ? 'Yazılıyor...' : 'Yapay Zeka'}
                       </button>
                    </div>
                    <textarea className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm" 
                        value={contentState.summary} onChange={(e) => setContentState({...contentState, summary: e.target.value})} placeholder="Özet metni..." ></textarea>
                    <div className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1"><CheckCircle size={12}/> {isTerm ? "1. Dönem" : "Tüm yılın"} etkinlik çizelgesi Word'e otomatik eklenir.</div>
                </div>

                <div><label className="block text-sm font-bold text-gray-700 mb-2">B) Yapılamayan Etkinlikler ve Mazeretleri</label><textarea className="w-full p-3 border rounded h-16 focus:ring-2 focus:ring-indigo-200 focus:outline-none" placeholder="Manuel doldurunuz..."></textarea></div>

                <div className="p-4 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-gray-800">C) Sınıfın Genel Durumu</h3>
                       <button onClick={() => generateAIContent('generalStatus', reportType)} disabled={isGenerating.type === 'generalStatus'} className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 border border-purple-200">
                           {isGenerating.type === 'generalStatus' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {isGenerating.type === 'generalStatus' ? 'Yazılıyor...' : 'Yapay Zeka'}
                       </button>
                    </div>
                    <textarea className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm" 
                        value={contentState.generalStatus} onChange={(e) => setContentState({...contentState, generalStatus: e.target.value})}></textarea>
                </div>

                <div className="p-4 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-gray-800">D) Rehberlik Servisine Yönlendirilen Öğrenciler</h3>
                       <button onClick={() => generateAIContent('referredStudents', reportType)} disabled={isGenerating.type === 'referredStudents'} className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 border border-purple-200">
                           {isGenerating.type === 'referredStudents' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {isGenerating.type === 'referredStudents' ? 'Yazılıyor...' : 'Yapay Zeka'}
                       </button>
                    </div>
                    <textarea className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm" 
                        placeholder="Örn: 3 öğrenci devamsızlık, 2 öğrenci akademik başarısızlık nedeniyle..."
                        value={contentState.referredStudents} onChange={(e) => setContentState({...contentState, referredStudents: e.target.value})}></textarea>
                </div>

                <div className="p-4 bg-gray-50 rounded border">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-gray-800">E) Veli Görüşmeleri</h3>
                       <button onClick={() => generateAIContent('parentMeetings', reportType)} disabled={isGenerating.type === 'parentMeetings'} className="flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-200 border border-purple-200">
                           {isGenerating.type === 'parentMeetings' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {isGenerating.type === 'parentMeetings' ? 'Yazılıyor...' : 'Yapay Zeka'}
                       </button>
                    </div>
                    <textarea className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm" 
                        placeholder="Örn: 15 veli ile bireysel görüşme yapılmıştır..."
                        value={contentState.parentMeetings} onChange={(e) => setContentState({...contentState, parentMeetings: e.target.value})}></textarea>
                </div>

                {contentState.customItems.map((item: any, index: any) => (
                    <div key={item.id} className="p-4 bg-blue-50 rounded border border-blue-200 relative group">
                        <button onClick={() => removeCustomItem(reportType, item.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"><Trash2 size={16}/></button>
                        <div className="flex justify-between items-center mb-2 pr-8">
                            <input 
                                type="text" 
                                placeholder="Başlık Giriniz (Örn: Sosyal Etkinlikler)" 
                                className="font-bold text-gray-800 bg-transparent border-b border-blue-300 focus:outline-none focus:border-blue-600 w-2/3"
                                value={item.title}
                                onChange={(e) => updateCustomItem(reportType, item.id, 'title', e.target.value)}
                            />
                             <button onClick={() => generateAIContent('custom', reportType, item.id)} disabled={isGenerating.id === item.id} className="flex items-center gap-1.5 text-xs font-bold bg-white text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-50 border border-purple-200 shadow-sm">
                               {isGenerating.id === item.id ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} {isGenerating.id === item.id ? '...' : 'AI Doldur'}
                           </button>
                        </div>
                        <textarea 
                            className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm bg-white"
                            placeholder="İçerik..."
                            value={item.content}
                            onChange={(e) => updateCustomItem(reportType, item.id, 'content', e.target.value)}
                        />
                    </div>
                ))}

                <button onClick={() => addCustomItem(reportType)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 font-medium transition-colors">
                    <Plus size={20} /> Yeni Rapor Maddesi Ekle
                </button>
            </div>
        </div>
    );
  };

  const renderSettings = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-indigo-600"/>Genel Okul ve Öğretmen Bilgileri</h2>
            <button id="saveButton" onClick={saveSettingsToBrowser} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 shadow-sm transition-all font-bold">
                <Save size={18} /> Ayarları Kaydet
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Okul Adı</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Örn: Atatürk Anadolu Lisesi" value={schoolDetails.schoolName} onChange={(e) => setSchoolDetails({...schoolDetails, schoolName: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">İlçe / Şehir</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Örn: Çankaya / ANKARA" value={schoolDetails.city} onChange={(e) => setSchoolDetails({...schoolDetails, city: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Eğitim Yılı</label>
                <input type="text" className="w-full p-2 border rounded" value={schoolDetails.year} onChange={(e) => setSchoolDetails({...schoolDetails, year: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Seneye burayı değiştirip kaydetmeniz yeterli.</p>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf Şubesi</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Örn: A, B, C..." value={schoolDetails.classBranch} onChange={(e) => setSchoolDetails({...schoolDetails, classBranch: e.target.value})} />
            </div>
            <div className="md:col-span-2 border-t pt-4 mt-2"><h3 className="font-bold text-gray-600 mb-4">İmza Bilgileri</h3></div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf Rehber Öğretmeni</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Ad Soyad" value={schoolDetails.teacherName} onChange={(e) => setSchoolDetails({...schoolDetails, teacherName: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Okul Rehber Öğretmeni</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Ad Soyad" value={schoolDetails.counselorName} onChange={(e) => setSchoolDetails({...schoolDetails, counselorName: e.target.value})} />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Okul Müdürü</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Ad Soyad" value={schoolDetails.principalName} onChange={(e) => setSchoolDetails({...schoolDetails, principalName: e.target.value})} />
            </div>
        </div>
        <div className="mt-6 p-4 bg-green-50 text-green-800 rounded flex items-center gap-2 text-sm border border-green-200">
            <CheckCircle size={16}/> <strong>İpucu:</strong> "Ayarları Kaydet" butonuna bastığınızda bu bilgiler tarayıcınıza kaydedilir ve sayfayı yenileseniz bile silinmez.
        </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <div className="w-full md:w-64 bg-indigo-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={24} className="text-indigo-300" />Rehberlik Asistanı</h1>
          <p className="text-xs text-indigo-300 mt-1">{schoolDetails.year} Eğitim Yılı</p>
        </div>
        <div className="p-4">
            <label className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-2 block">Sınıf Seçimi</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
                {['9', '10', '11', '12'].map(grade => (
                    <button key={grade} onClick={() => { setSelectedGrade(grade); setSelectedActivityIndex(0); }} className={`p-2 rounded text-center font-bold transition-colors ${selectedGrade === grade ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-700'}`}>{grade}</button>
                ))}
            </div>
            <nav className="space-y-2">
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><Settings size={18} /> Ayarlar</button>
                <div className="border-t border-indigo-700 my-2"></div>
                <button onClick={() => setActiveTab('plan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'plan' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><Calendar size={18} /> Yıllık Plan</button>
                <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'activity' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><FileText size={18} /> Etkinlik Raporu</button>
                <button onClick={() => setActiveTab('termReport')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'termReport' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><ClipboardCheck size={18} /> Dönem Sonu Raporu</button>
                <button onClick={() => setActiveTab('endyear')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'endyear' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><CheckCircle size={18} /> Yıl Sonu Raporu</button>
            </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab === 'plan' && 'Sınıf Yıllık Çerçeve Planı'}
                    {activeTab === 'activity' && 'Etkinlik Sonuç Raporu'}
                    {activeTab === 'termReport' && '1. Dönem Sonu Raporu'}
                    {activeTab === 'endyear' && 'Yıl Sonu Faaliyet Raporu'}
                    {activeTab === 'settings' && 'Ayarlar ve Bilgi Girişi'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{selectedGrade}/{schoolDetails.classBranch} Sınıfı • {schoolDetails.teacherName || 'Öğretmen Girilmedi'}</p>
            </div>
        </header>

        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'plan' && (
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div><h3 className="text-xl text-indigo-600">{selectedGrade}. Sınıf Yıllık Planı</h3></div>
                    <button onClick={exportAnnualPlan} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm transition-colors"><Download size={18} /> Word İndir</button>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-10"><tr className="bg-indigo-50 border-b border-indigo-100 shadow-sm"><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Ay</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Hafta</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Kazanım / Etkinlik Adı</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Alan</th></tr></thead>
                    <tbody>{plans[selectedGrade].map((item: any, index: any) => (<tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${item.kazanim.includes('TATİL') ? 'bg-orange-50' : ''}`}><td className="p-3 text-gray-800">{item.month}</td><td className="p-3 text-gray-600">{item.week}. Hafta</td><td className="p-3 text-gray-800 font-medium">{item.kazanim}</td><td className="p-3"><span className={`px-2 py-1 text-xs rounded-full border ${item.tur === 'Tatil' ? 'bg-orange-100 text-orange-700 border-orange-200' : item.tur === 'Risk Belirleme' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{item.tur}</span></td></tr>))}</tbody>
                    </table>
                </div>
             </div>
        )}
        {activeTab === 'activity' && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Haftalık Etkinlik Raporu</h2>
                <button onClick={exportActivityReport} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm transition-colors"><Download size={18} /> Word İndir</button>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label><input type="date" className="w-full p-2 border rounded" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Hafta Seçimi</label><select value={selectedActivityIndex} onChange={(e) => setSelectedActivityIndex(Number(e.target.value))} className="w-full p-2 border rounded">{plans[selectedGrade].map((p: any, index: any) => (<option key={index} value={index}>{p.month} - {p.week}. Hafta - {p.kazanim.length > 50 ? p.kazanim.substring(0,50) + "..." : p.kazanim}</option>))}</select></div>
                </div>
                <div className="space-y-4">
                    <div className={`p-4 rounded border border-gray-200 ${plans[selectedGrade][selectedActivityIndex].kazanim.includes('TATİL') ? 'bg-orange-50' : 'bg-gray-50'}`}><span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Kazanım</span><p className="text-lg font-medium text-gray-900 mt-1">{plans[selectedGrade][selectedActivityIndex].kazanim}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 border rounded"><span className="block text-sm font-bold text-gray-700">Sınıfa Katılan</span><input type="number" className="w-full mt-2 p-1 border-b" placeholder="Örn: 24" /></div><div className="p-4 border rounded"><span className="block text-sm font-bold text-gray-700">Katılmayan</span><input type="number" className="w-full mt-2 p-1 border-b" placeholder="Örn: 2" /></div></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">Değerlendirme</label><textarea className="w-full p-3 border rounded h-24" defaultValue="Etkinlik plana uygun işlenmiştir."></textarea></div>
                </div>
            </div>
        )}
        {activeTab === 'termReport' && renderReportUI('term')}
        {activeTab === 'endyear' && renderReportUI('year')}
      </div>
    </div>
  );
};



export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  return (
    <Tabs defaultValue="ders-plani">
      <TabsList>
        <TabsTrigger value="ders-plani">Ders Yıllık Planı</TabsTrigger>
        <TabsTrigger value="rehberlik-plani">Rehberlik Yıllık Planı</TabsTrigger>
      </TabsList>
      <TabsContent value="ders-plani" className="mt-4">
        <SubjectAnnualPlan teacherProfile={teacherProfile} currentClass={currentClass} />
      </TabsContent>
      <TabsContent value="rehberlik-plani" className="mt-4">
        <ClassGuidanceAssistant />
      </TabsContent>
    </Tabs>
  );
}
