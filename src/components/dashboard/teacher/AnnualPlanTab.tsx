'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calendar, Search, BookOpen, Clock, Filter, ArrowRight, Download, CheckCircle, Circle } from 'lucide-react';
import { TeacherProfile, Class } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_PLANS } from '@/lib/plans';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClassGuidanceAssistant } from './ClassGuidanceAssistant';

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


export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  return (
    <Tabs defaultValue="ders-plani">
      <TabsList>
        <TabsTrigger value="ders-plani">Ders Yıllık Planı</TabsTrigger>
        <TabsTrigger value="rehberlik-plani" disabled>Rehberlik Yıllık Planı (Geliştirilecek)</TabsTrigger>
      </TabsList>
      <TabsContent value="ders-plani" className="mt-4">
        <SubjectAnnualPlan teacherProfile={teacherProfile} currentClass={currentClass} />
      </TabsContent>
       <TabsContent value="rehberlik-plani" className="mt-4">
         <div>Ders yıllık planı modülü geliştirme aşamasındadır.</div>
      </TabsContent>
    </Tabs>
  );
}
