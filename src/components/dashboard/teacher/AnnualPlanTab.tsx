import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Calendar, Search, BookOpen, Clock, Filter, ArrowRight, Download, CheckCircle, Circle, FolderHeart, FileText, Users, ClipboardCheck, Check, X, Wand2 } from 'lucide-react';
import { TeacherProfile, Class } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_PLANS } from '@/lib/plans';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { generateMeetingAgendaItem } from '@/ai/flows/generate-meeting-agenda-item-flow';


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

const downloadDailyPlan = (weekData: any, grade: number, subject: string) => {
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
\\pard\\intbl S\\'fdn\\'fdf / \\'deube\\cell ${grade}. SINIF\\cell\\row
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
  link.download = `${subject}_${grade === 0 ? 'Hazirlik' : grade}_Sinif_Gunluk_Plan_${weekData.week.replace(/\s/g, "_")}.rtf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Yıllık Plan Ana Bileşeni ---
function SubjectAnnualPlan({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const [activeSubject, setActiveSubject] = useState(Object.keys(ALL_PLANS)[0]);
  const initialGrade = currentClass?.name?.match(/\d+/)?.[0] || ALL_PLANS[activeSubject]?.grades[0] || '9';
  const [activeGrade, setActiveGrade] = useState<string>(initialGrade);
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [completedWeeks, setCompletedWeeks] = useState<string[]>([]);

  const subjectData = ALL_PLANS[activeSubject];

  useEffect(() => {
    // Sınıf değiştiğinde veya konu seçildiğinde aktif sınıfı güncelle
    const gradeFromClass = currentClass?.name?.match(/\d+/)?.[0];
    if (gradeFromClass && subjectData.grades.includes(gradeFromClass)) {
      setActiveGrade(gradeFromClass);
    } else {
      setActiveGrade(subjectData.grades[0]);
    }
  }, [currentClass, activeSubject, subjectData.grades]);
  
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

  const gradeConfig = subjectData.data[activeGrade];

  const filteredWeeks = useMemo(() => {
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
      default: return 'border-slate-300';
    }
  };

  const getBadgeColor = (unitType: string) => {
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
  };

  const getBackgroundColor = (unitType: string, isBreak?: boolean) => {
    if (isBreak) return 'bg-yellow-50';
    if (unitType === 'okul-temelli') return 'bg-violet-50';
    if (unitType === 'sosyal') return 'bg-pink-50';
    return 'bg-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-full mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 mb-2 tracking-tight">{activeSubject} Dersi Yıllık Planı</h1>
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
            <button key={grade} onClick={() => setActiveGrade(grade)} className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${activeGrade === grade ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform -translate-y-0.5' : 'bg-white text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50'}`}>{grade === '0' ? 'Hazırlık' : `${grade}. Sınıf`}</button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2"><span className="text-sm font-bold text-slate-600">Yıllık İlerleme Durumu</span><span className="text-sm font-bold text-indigo-600">%{progress} Tamamlandı</span></div>
          <div className="w-full bg-slate-100 rounded-full h-2.5"><div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div></div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {gradeConfig?.filters?.map((filter: any) => (
                <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${activeFilter === filter.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-slate-500 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'}`}>{filter.label}</button>
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
                  {week.hours > 0 && (<span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide flex items-center gap-1"><Clock size={12} />{week.hours} Saat</span>)}
                </div>
                <div className="space-y-4">
                  {(week.unit || week.topic) && (<div>{week.unit && (<span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide text-white mb-2 ${getBadgeColor(week.unitType)}`}>{week.unit}</span>)}{week.topic && (<div className={`text-lg font-semibold leading-tight ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>{week.topic}</div>)}</div>)}
                  {week.learningOutcome && (<div className="bg-white/50 border border-slate-200 p-4 rounded-lg"><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Kazanım</span><p className="text-slate-700 text-sm leading-relaxed">{week.learningOutcome}</p></div>)}
                  {week.processComponents && (<div className="pt-2 border-t border-dashed border-slate-200"><span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Süreç Bileşenleri</span><div className="text-slate-600 text-sm leading-relaxed space-y-1" dangerouslySetInnerHTML={{ __html: week.processComponents }} /></div>)}
                  {week.specialDays && (<div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 mt-2"><BookOpen size={12} />{week.specialDays}</div>)}
                  <button onClick={() => downloadDailyPlan(week, parseInt(activeGrade), activeSubject)} className="w-full mt-4 pt-4 border-t border-slate-100 text-center text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 group"><Download size={16} className="group-hover:scale-110 transition-transform" /> Günlük Planı İndir (.rtf)</button>
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

// --- Rehberlik Planı ---
function GuidanceAnnualPlan({ currentClass }: { currentClass: Class | null }) {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [gorusmeText, setGorusmeText] = useState("");
  const [yapilamayanText, setYapilamayanText] = useState("");
  const [genelDurumText, setGenelDurumText] = useState("Sınıf içi iletişim ve arkadaşlık ilişkileri olumlu düzeydedir. Akademik başarı takibi düzenli olarak yapılmıştır.");
  const [yonlendirilenText, setYonlendirilenText] = useState("");
  const [veliGorusmeText, setVeliGorusmeText] = useState("");
  const [beklentiText, setBeklentiText] = useState("");

  const handleGenerateReportContent = async (reportType: 'term' | 'year') => {
    setIsGenerating(true);
    let agendaTitle = "";
    if (reportType === 'term') {
      agendaTitle = `${selectedGrade}. Sınıf 1. Dönem Sonu Sınıf Rehberlik Faaliyet Raporu Değerlendirmesi`;
    } else if (reportType === 'year') {
      agendaTitle = `${selectedGrade}. Sınıf Yıl Sonu Sınıf Rehberlik Faaliyet Raporu Değerlendirmesi`;
    }

    try {
      const response = await generateMeetingAgendaItem({
        meetingType: 'ŞÖK', // Using as a generic report generation context
        agendaTitle: agendaTitle,
        classInfo: `${selectedGrade}. Sınıf`,
      });
      if (reportType === 'term') {
        setGenelDurumText(response.generatedText);
      } else {
        setGenelDurumText(response.generatedText); // Can be different if prompt is adjusted
      }
    } catch (error) {
      console.error("AI Rapor oluşturma hatası:", error);
    } finally {
      setIsGenerating(false);
    }
  };


  // Yüklenen dosyalardan ve MEB çerçeve planından derlenmiş TAM YIL VERİ TABANI (2025-2026)
  const plans = {
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
      { month: 'Mart', week: '3', kazanim: 'Seçmeyi düşündüğü mesleklerle ilgili kariyer planlaması yapar.', tur: 'Kariyer' },
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

  // Word İndirme Fonksiyonu
  const downloadWord = (content, filename) => {
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title><style>body{font-family: Arial, sans-serif;} table{border-collapse: collapse; width: 100%;} td, th{border: 1px solid #000; padding: 8px; text-align: left;} .header{text-align:center; font-weight:bold; margin-bottom:20px;} .footer{margin-top:50px; display:flex; justify-content:space-between;}</style></head><body>`;
    const postHtml = "</body></html>";
    const html = preHtml + content + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    
    // Create a link to the file
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename + ".doc";
    
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const exportAnnualPlan = () => {
    let tableRows = plans[selectedGrade].map(item => 
      `<tr><td>${item.month}</td><td>${item.week}. Hafta</td><td>${item.kazanim}</td><td>${item.tur}</td></tr>`
    ).join('');

    const content = `
      <div class="header">
        <h2>2025-2026 EĞİTİM ÖĞRETİM YILI</h2>
        <h3>${selectedGrade}. SINIF REHBERLİK YILLIK PLANI</h3>
      </div>
      <table>
        <thead>
          <tr style="background-color:#f0f0f0;">
            <th>Ay</th><th>Hafta</th><th>Kazanım / Etkinlik</th><th>Alan</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div style="margin-top:50px;">
        <p style="float:left;">................................<br>Sınıf Rehber Öğretmeni</p>
        <p style="float:right;">................................<br>Okul Müdürü</p>
      </div>
    `;
    downloadWord(content, `${selectedGrade}_Sinif_Yillik_Plan_Tam_Liste`);
  };

  const exportActivityReport = () => {
    const currentActivity = plans[selectedGrade][selectedActivityIndex];
    const content = `
      <div class="header">
        <h2>HAFTALIK SINIF REHBERLİK ETKİNLİK RAPORU</h2>
      </div>
      <p><strong>Tarih:</strong> ..............................</p>
      <p><strong>Sınıf:</strong> ${selectedGrade}. Sınıf</p>
      <p><strong>Hafta:</strong> ${currentActivity.month} - ${currentActivity.week}. Hafta</p>
      <br>
      <table border="1" cellpadding="10">
        <tr>
          <td bgcolor="#f0f0f0"><strong>Kazanım / Etkinlik Adı</strong></td>
          <td>${currentActivity.kazanim}</td>
        </tr>
        <tr>
          <td bgcolor="#f0f0f0"><strong>Katılan Öğrenci Sayısı</strong></td>
          <td></td>
        </tr>
        <tr>
          <td bgcolor="#f0f0f0"><strong>Katılmayan Öğrenci Sayısı</strong></td>
          <td></td>
        </tr>
        <tr>
          <td bgcolor="#f0f0f0"><strong>Değerlendirme</strong></td>
          <td height="100">Etkinlik plana uygun olarak işlenmiş, öğrencilerin derse katılımı sağlanmıştır.</td>
        </tr>
      </table>
      <div style="margin-top:50px;">
        <p style="text-align:center;">................................<br>Sınıf Rehber Öğretmeni</p>
      </div>
    `;
    downloadWord(content, `${selectedGrade}_Sinif_Etkinlik_Raporu_${currentActivity.month}_${currentActivity.week}`);
  };

  const exportTermReport = () => {
    // 1. Dönem ayları
    const term1Months = ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak'];
    const term1Activities = plans[selectedGrade].filter(item => term1Months.includes(item.month));
    
    // Etkinlik listesi tablosu
    const activitiesTableRows = term1Activities.map(item => 
      `<tr>
        <td>${item.month}</td>
        <td>${item.week}. Hafta</td>
        <td>${item.kazanim}</td>
        <td>${item.tur}</td>
      </tr>`
    ).join('');

    const content = `
      <div class="header">
        <h2>2025-2026 EĞİTİM ÖĞRETİM YILI<br>1. DÖNEM SONU SINIF REHBERLİK FAALİYET RAPORU</h2>
      </div>
      <p><strong>Okul Adı:</strong> ...........................................................</p>
      <p><strong>Sınıf:</strong> ${selectedGrade}. Sınıf</p>
      <p><strong>Dönem:</strong> 1. Dönem</p>
      <br>
      <h3>A) YAPILAN ÇALIŞMALAR</h3>
      <p style="text-align: justify;">2025-2026 Eğitim Öğretim Yılı 1. Dönemi süresince sınıf rehberlik programı çerçevesinde planlanan etkinlikler, MEB Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği esas alınarak yürütülmüştür.</p>
      <p style="text-align: justify;">Dönem başında öğrencilerin okula ve çevreye uyumlarını kolaylaştırmak adına oryantasyon çalışmaları yapılmış, Sınıf Risk Haritası oluşturularak öğrencilerin demografik ve sosyal durumları analiz edilmiştir. Akademik başarıyı desteklemek amacıyla verimli ders çalışma teknikleri, zaman yönetimi ve motivasyon çalışmaları gerçekleştirilmiştir.</p>
      <p style="text-align: justify;">Ayrıca öğrencilerin kişisel-sosyal gelişimlerini desteklemek adına ihmal ve istismar, akran zorbalığı, iletişim becerileri ve teknoloji kullanımı konularında farkındalık kazandırıcı etkinlikler uygulanmıştır. Aşağıda dönem boyunca gerçekleştirilen etkinliklerin ayrıntılı dökümü sunulmuştur:</p>
      
      <h4 style="margin-top:20px;">1. DÖNEM GERÇEKLEŞTİRİLEN ETKİNLİKLER ÇİZELGESİ</h4>
      <table border="1" cellpadding="5" style="font-size: 11px;">
        <thead>
            <tr bgcolor="#f0f0f0">
                <th width="10%">Ay</th>
                <th width="10%">Hafta</th>
                <th width="65%">Kazanım / Etkinlik Adı</th>
                <th width="15%">Alan</th>
            </tr>
        </thead>
        <tbody>
            ${activitiesTableRows}
        </tbody>
      </table>

      <br>
      <h3>B) YAPILAMAYAN ETKİNLİKLER VE NEDENLERİ</h3>
      <table border="1" cellpadding="5">
        <tr>
          <td width="50%" bgcolor="#f0f0f0"><strong>Yapılamayan Etkinlik</strong></td>
          <td width="50%" bgcolor="#f0f0f0"><strong>Nedeni</strong></td>
        </tr>
        <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
      </table>
      <br>
      <h3>C) SINIFIN GENEL DURUMU</h3>
      <p style="text-align: justify;">Sınıf içi iletişim, arkadaşlık ilişkileri ve sınıf iklimi genel olarak olumlu düzeydedir. Öğrencilerin derslere katılımı ve akademik sorumluluk bilinçleri takip edilmektedir. Risk grubunda olduğu tespit edilen öğrencilerle ilgili olarak Okul Rehberlik Servisi ve velilerle iş birliği sağlanmıştır.</p>
      <br>
      <h3>D) REHBERLİK SERVİSİNDEN BEKLENTİLER</h3>
      <p>..........................................................................................................................................................................</p>
      <div style="margin-top:50px;">
        <p style="text-align:center;">................................<br>Sınıf Rehber Öğretmeni</p>
      </div>
    `;
    downloadWord(content, `${selectedGrade}_Sinif_1_Donem_Sonu_Raporu`);
  };

  const exportEndYearReport = () => {
    // Tüm yıl (planın tamamı)
    const allActivities = plans[selectedGrade];
    
    // Etkinlik listesi tablosu
    const activitiesTableRows = allActivities.map(item => 
      `<tr>
        <td>${item.month}</td>
        <td>${item.week}. Hafta</td>
        <td>${item.kazanim}</td>
        <td>${item.tur}</td>
      </tr>`
    ).join('');

    const content = `
      <div class="header">
        <h2>2025-2026 EĞİTİM ÖĞRETİM YILI<br>YIL SONU SINIF REHBERLİK FAALİYET RAPORU</h2>
      </div>
      <p><strong>Okul Adı:</strong> ...........................................................</p>
      <p><strong>Sınıf:</strong> ${selectedGrade}. Sınıf</p>
      <p><strong>Tarih:</strong> Haziran 2026</p>
      <br>
      <h3>A) YIL BOYUNCA YAPILAN ÇALIŞMALAR</h3>
      <p style="text-align: justify;">2025-2026 Eğitim Öğretim Yılı boyunca sınıf rehberlik programı çerçevesinde planlanan etkinlikler, MEB Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği esas alınarak titizlikle yürütülmüştür.</p>
      <p style="text-align: justify;"><strong>1. Dönem:</strong> Oryantasyon, risk haritası analizi, verimli ders çalışma teknikleri, akran zorbalığı ve kişisel güvenlik konularına ağırlık verilmiştir.</p>
      <p style="text-align: justify;"><strong>2. Dönem:</strong> Mesleki rehberlik kapsamında; alan seçimi (9. ve 10. sınıflar için), üst öğrenim kurumlarının tanıtımı, sınav sistemleri ve hedef belirleme (11. ve 12. sınıflar için) çalışmaları yapılmıştır. Ayrıca Rehberlik İhtiyaçları Belirleme Anketi (RİBA) uygulanmış, teknoloji bağımlılığı, stresle baş etme ve sağlıklı yaşam becerileri üzerine etkinlikler gerçekleştirilmiştir.</p>
      <p style="text-align: justify;">Aşağıda eğitim öğretim yılı boyunca (Eylül-Haziran) gerçekleştirilen tüm etkinliklerin ayrıntılı dökümü sunulmuştur:</p>
      
      <h4 style="margin-top:20px;">2025-2026 EĞİTİM YILI GERÇEKLEŞTİRİLEN ETKİNLİKLER ÇİZELGESİ</h4>
      <table border="1" cellpadding="5" style="font-size: 11px;">
        <thead>
            <tr bgcolor="#f0f0f0">
                <th width="10%">Ay</th>
                <th width="10%">Hafta</th>
                <th width="65%">Kazanım / Etkinlik Adı</th>
                <th width="15%">Alan</th>
            </tr>
        </thead>
        <tbody>
            ${activitiesTableRows}
        </tbody>
      </table>

      <br>
      <h3>B) YAPILAMAYAN ETKİNLİKLER VE NEDENLERİ</h3>
      <table border="1" cellpadding="5">
        <tr>
          <td width="50%" bgcolor="#f0f0f0"><strong>Yapılamayan Etkinlik</strong></td>
          <td width="50%" bgcolor="#f0f0f0"><strong>Nedeni</strong></td>
        </tr>
        <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
      </table>
      <br>
      <h3>C) SINIFIN GENEL DEĞERLENDİRMESİ</h3>
      <p style="text-align: justify;">Yıl boyunca sınıfın genel uyumu, arkadaşlık ilişkileri ve derse katılım düzeyleri olumlu seyretmiştir. Akademik anlamda desteklenmesi gereken öğrencilerle bireysel görüşmeler yapılmış, veli iş birliği sağlanmıştır. Rehberlik servisi ile koordineli çalışılarak risk durumundaki öğrencilere gerekli yönlendirmeler yapılmıştır.</p>
      <br>
      <h3>D) GELECEK YIL İÇİN ÖNERİLER</h3>
      <p>..........................................................................................................................................................................</p>
      <div style="margin-top:50px;">
        <p style="text-align:center;">................................<br>Sınıf Rehber Öğretmeni</p>
      </div>
    `;
    downloadWord(content, `${selectedGrade}_Sinif_Yil_Sonu_Faaliyet_Raporu`);
  };

  const renderAnnualPlan = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">2025-2026 Eğitim Öğretim Yılı</h2>
          <h3 className="text-xl text-indigo-600">{selectedGrade}. Sınıf Rehberlik Yıllık Planı</h3>
        </div>
        <button onClick={exportAnnualPlan} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm transition-colors">
          <Download size={18} /> Word İndir
        </button>
      </div>

      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse relative">
          <thead className="sticky top-0 z-10">
            <tr className="bg-indigo-50 border-b border-indigo-100 shadow-sm">
              <th className="p-3 font-semibold text-gray-700 bg-indigo-50">Ay</th>
              <th className="p-3 font-semibold text-gray-700 bg-indigo-50">Hafta</th>
              <th className="p-3 font-semibold text-gray-700 bg-indigo-50">Kazanım / Etkinlik Adı</th>
              <th className="p-3 font-semibold text-gray-700 bg-indigo-50">Alan</th>
            </tr>
          </thead>
          <tbody>
            {plans[selectedGrade].map((item, index) => (
              <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${item.kazanim.includes('TATİL') ? 'bg-orange-50' : ''}`}>
                <td className="p-3 text-gray-800">{item.month}</td>
                <td className="p-3 text-gray-600">{item.week}. Hafta</td>
                <td className="p-3 text-gray-800 font-medium">{item.kazanim}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs rounded-full border ${
                      item.tur === 'Tatil' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                      item.tur === 'Risk Belirleme' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {item.tur}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 flex justify-between px-10">
        <div className="text-center">
          <p className="font-semibold">................................</p>
          <p className="text-sm text-gray-500">Sınıf Rehber Öğretmeni</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">................................</p>
          <p className="text-sm text-gray-500">Okul Müdürü</p>
        </div>
      </div>
    </div>
  );

  const renderActivityReport = () => {
    const currentActivity = plans[selectedGrade][selectedActivityIndex];
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">Haftalık Sınıf Rehberlik Etkinlik Raporu</h2>
          <button onClick={exportActivityReport} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm transition-colors">
            <Download size={18} /> Word İndir
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input type="date" className="w-full p-2 border rounded" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hafta Seçimi</label>
                <select 
                    value={selectedActivityIndex} 
                    onChange={(e) => setSelectedActivityIndex(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                >
                    {plans[selectedGrade].map((p, index) => (
                        <option key={index} value={index}>
                           {p.month} - {p.week}. Hafta - {p.kazanim.length > 50 ? p.kazanim.substring(0,50) + "..." : p.kazanim}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        <div className="space-y-4">
            <div className={`p-4 rounded border border-gray-200 ${currentActivity.kazanim.includes('TATİL') ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Kazanım</span>
                <p className="text-lg font-medium text-gray-900 mt-1">{currentActivity.kazanim}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                    <span className="block text-sm font-bold text-gray-700">Sınıfa Katılan Öğrenci Sayısı</span>
                    <input type="number" className="w-full mt-2 p-1 border-b focus:outline-none focus:border-indigo-500" placeholder="Örn: 24" />
                </div>
                <div className="p-4 border rounded">
                     <span className="block text-sm font-bold text-gray-700">Katılmayan Öğrenci Sayısı</span>
                     <input type="number" className="w-full mt-2 p-1 border-b focus:outline-none focus:border-indigo-500" placeholder="Örn: 2" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Değerlendirme / Gözlemler</label>
                <textarea 
                    className="w-full p-3 border rounded h-24 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    defaultValue={currentActivity.kazanim.includes('TATİL') ? "Tatil nedeniyle etkinlik yapılmamıştır." : "Etkinlik plana uygun olarak işlenmiş, öğrencilerin derse katılımı sağlanmıştır."}
                ></textarea>
            </div>
        </div>
      </div>
    );
  };

  const renderTermReport = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">1. Dönem Sonu Faaliyet Raporu</h2>
            <p className="text-sm text-gray-500">Ocak ayı sonunda (Karne haftası) teslim edilir.</p>
          </div>
          <button onClick={exportTermReport} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-sm transition-colors">
            <Download size={18} /> Word İndir
          </button>
        </div>

        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-bold text-gray-800 mb-2">A) Yapılan Çalışmaların Özeti</h3>
                <p className="text-gray-600 text-sm mb-2">
                   Bu bölüm artık <strong>otomatik olarak</strong> seçtiğiniz sınıfın 1. dönem (Eylül-Ocak) boyunca işlediği tüm etkinliklerin detaylı listesini (Ay/Hafta/Kazanım) tablo halinde Word raporuna eklemektedir.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={16} />
                    Word çıktısında "Gerçekleştirilen Etkinlikler Çizelgesi" tablosu otomatik oluşturulacaktır.
                </div>
            </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">B) Yapılamayan Etkinlikler ve Mazeretleri</label>
                <textarea 
                    className="w-full p-3 border rounded h-20 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="Varsa yapılamayan etkinlikleri ve sebeplerini buraya not alabilirsiniz..."
                ></textarea>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">C) Sınıfın Genel Durumu</label>
                <textarea 
                    className="w-full p-3 border rounded h-20 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    defaultValue="Sınıf içi iletişim ve arkadaşlık ilişkileri olumlu düzeydedir. Akademik başarı takibi düzenli olarak yapılmıştır."
                ></textarea>
            </div>
        </div>
    </div>
  );

  const renderEndYearReport = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Yıl Sonu Faaliyet Raporu</h2>
            <p className="text-sm text-gray-500">Haziran ayı sonunda (Seminer dönemi) teslim edilir.</p>
          </div>
          <button onClick={exportEndYearReport} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-600 shadow-sm transition-colors">
            <Download size={18} /> Word İndir
          </button>
        </div>

        <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded border">
                <h3 className="font-bold text-gray-800 mb-2">A) Yıl Boyunca Yapılan Çalışmaların Özeti</h3>
                <p className="text-gray-600 text-sm mb-2">
                   Bu rapor, 1. ve 2. dönem yapılan tüm çalışmaları (Eylül-Haziran) kapsar. Word çıktısında <strong>tüm yılın etkinlik dökümü</strong> otomatik olarak tablo halinde yer alacaktır.
                </p>
                <div className="p-3 bg-green-50 border border-green-100 rounded text-green-800 text-sm font-medium flex items-center gap-2">
                    <CheckCircle size={16} />
                    Word çıktısında "2025-2026 Eğitim Yılı Gerçekleştirilen Etkinlikler Çizelgesi" tablosu hazırdır.
                </div>
            </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">B) Yapılamayan Etkinlikler ve Mazeretleri</label>
                <textarea 
                    className="w-full p-3 border rounded h-20 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="Tüm yıl boyunca yapılamayan etkinlik varsa not ediniz..."
                ></textarea>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">C) Sınıfın Genel Değerlendirmesi</label>
                <textarea 
                    className="w-full p-3 border rounded h-20 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    defaultValue="Yıl boyunca sınıfın genel uyumu, arkadaşlık ilişkileri ve derse katılım düzeyleri olumlu seyretmiştir."
                ></textarea>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-indigo-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-300" />
            Rehberlik Asistanı
          </h1>
          <p className="text-xs text-indigo-300 mt-1">2025-2026 Eğitim Yılı</p>
        </div>
        
        <div className="p-4">
            <label className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-2 block">Sınıf Seçimi</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
                {['9', '10', '11', '12'].map(grade => (
                    <button 
                        key={grade}
                        onClick={() => {
                            setSelectedGrade(grade);
                            setSelectedActivityIndex(0); 
                        }}
                        className={`p-2 rounded text-center font-bold transition-colors ${selectedGrade === grade ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-700'}`}
                    >
                        {grade}
                    </button>
                ))}
            </div>

            <nav className="space-y-2">
                <button onClick={() => setActiveTab('plan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'plan' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}>
                    <Calendar size={18} /> Yıllık Plan
                </button>
                <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'activity' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}>
                    <FileText size={18} /> Etkinlik Raporu
                </button>
                 <button onClick={() => setActiveTab('termReport')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'termReport' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}>
                    <ClipboardCheck size={18} /> Dönem Sonu Raporu
                </button>
                 <button onClick={() => setActiveTab('endyear')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'endyear' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}>
                    <CheckCircle size={18} /> Yıl Sonu Raporu
                </button>
            </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab === 'plan' && 'Sınıf Yıllık Çerçeve Planı'}
                    {activeTab === 'activity' && 'Etkinlik Sonuç Raporu'}
                    {activeTab === 'termReport' && 'Dönem Sonu Faaliyet Raporu'}
                    {activeTab === 'endyear' && 'Yıl Sonu Faaliyet Raporu'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{selectedGrade}. Sınıf Doküman Yönetimi</p>
            </div>
            <div className="text-right">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Tam Yıl Verisi Yüklendi</span>
            </div>
        </header>

        {activeTab === 'plan' && renderAnnualPlan()}
        {activeTab === 'activity' && renderActivityReport()}
        {activeTab === 'termReport' && renderTermReport()}
        {activeTab === 'endyear' && renderEndYearReport()}
      </div>
    </div>
  );
};
