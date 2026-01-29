'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, FileText, Download, Save, RefreshCw, PenTool, Library, GraduationCap, Layout, Key, AlertCircle, CheckSquare, FileJson, Edit, SplitSquareHorizontal, Hash, ListFilter, Columns, ClipboardList, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { EdebiyatAsistanDocument } from '@/lib/types';
import { generateEdebiyatMateryal } from '@/ai/flows/generate-edebiyat-materyal-flow';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';

// MÜFREDAT VERİ TABANI
const curriculumData = {
  "Hazırlık Sınıfı": [
    "1. TEMA: SANATIN DİLİ - Okuma (Şiir/Anı) - TDE2.1. Okumayı yönetebilme",
    "1. TEMA: SANATIN DİLİ - TDE2.2. Metindeki anlamı çözümleyebilme",
    "2. TEMA: KÜLTÜRÜN DİLİ - Okuma (Hikaye/Masal)",
    "3. TEMA: TOPLUMUN DİLİ - Okuma (Roman/Tiyatro)",
    "4. TEMA: BİREYİN DİLİ - Okuma (Biyografi/Mektup)",
    "TDE4.3. Yazma sürecini yönetebilme (Hikaye/Masal)",
    "TDE4.3.5. Türkçe dil yapılarını işlevine uygun kullanır.",
    "Genel: Millî ve manevi değerler ile kültürel unsurları yorumlama"
  ],
  "9. Sınıf": [
    "1. TEMA: SÖZÜN İNCELİĞİ - Okuma (Şiir/Deneme) - TDE2.1",
    "1. TEMA: SÖZÜN İNCELİĞİ - TDE2.3. Metindeki bakış açısını belirler.",
    "2. TEMA: HAYATIN ANLAMI - Okuma (Hikaye/Masal)",
    "3. TEMA: DÜNYANIN AYNASI - Okuma (Roman/Tiyatro)",
    "4. TEMA: DİLİN ZENGİNLİĞİ - Okuma (Biyografi/Mektup/Günlük)",
    "TDE4.4. Otobiyografi yazabilme (Üslup Değerlendirmesi)",
    "TDE4.3.5. Türkçe dil yapılarını uygular ve yabancı kelime kullanımından kaçınır."
  ],
  "10. Sınıf": [
    "1. TEMA: SÖZÜN EZGİSİ - Okuma (Şiir: Koşuk/Türkü/Gazel/Şarkı/Mani)",
    "2. TEMA: TARİHİN İZLERİ - Okuma (Destan/Efsane/Roman)",
    "3. TEMA: HAYATIN YANKISI - Okuma (Hikaye/Tiyatro)",
    "4. TEMA: NESİLLERİN MİRASI - Okuma (Anı/Gezi Yazısı/Haber Metni)",
    "TDE2.1. Metindeki anlamı çözümleyebilme (Koşma/Ninni)",
    "TDE4.4. Dinlediği hikâyeyi şiire dönüştürme",
    "TDE4.4.1. Yazma sürecindeki davranış, duygu ve düşüncelerini değerlendirir."
  ],
  "11. Sınıf": [
    "1. ÜNİTE: GİRİŞ - Edebiyat ve Toplum / Sanat Akımları",
    "2. ÜNİTE: HİKAYE - Cumhuriyet Dönemi (1923-1940 / 1940-1960)",
    "3. ÜNİTE: ŞİİR - Tanzimat / Servetifünun / Fecriati / Milli Ed. / Cumhuriyet İlk Dönem",
    "4. ÜNİTE: MAKALE - Bilimsel ve Edebi Makale",
    "5. ÜNİTE: SOHBET / FIKRA - Cumhuriyet Öncesi ve Sonrası",
    "6. ÜNİTE: ROMAN - Cumhuriyet Dönemi (1923-1950 / 1950-1980)",
    "7. ÜNİTE: TİYATRO - Cumhuriyet Dönemi (1923-1950 / 1950-1980)",
    "8. ÜNİTE: ELEŞTİRİ - Cumhuriyet Öncesi ve Sonrası",
    "9. ÜNİTE: MÜLAKAT / RÖPORTAJ",
    "A.4.15. Metinlerden hareketle dil bilgisi çalışmaları yapar (Yazım/Noktalama/Öge)"
  ],
  "12. Sınıf": [
    "1. ÜNİTE: GİRİŞ - Felsefe, Psikoloji ve Dil İlişkisi",
    "2. ÜNİTE: HİKAYE - 1960 Sonrası Cumhuriyet Dönemi",
    "3. ÜNİTE: ŞİİR - Saf Şiir / Toplumcu / Garip / İkinci Yeni / Dini / 1980 Sonrası",
    "4. ÜNİTE: ROMAN - 1960-1980 Arası ve 1980 Sonrası (Çeviri Roman)",
    "5. ÜNİTE: TİYATRO - 1950 Sonrası",
    "6. ÜNİTE: DENEME - Cumhuriyet Dönemi",
    "7. ÜNİTE: SÖYLEV (NUTUK) - Cumhuriyet Dönemi ve İslamiyet Öncesi",
    "A.4.15. Metinlerden hareketle dil bilgisi çalışması yapar.",
    "B.1-B.12. Güncel bir konudan yola çıkarak söylev metni yazma"
  ]
};

export default function EdebiyatSinavAsistaniTab() {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { edebiyatAsistanArsivi: archives = [] } = localDb;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [dualColumnMode, setDualColumnMode] = useState(false);
  const [lessonPlanMode, setLessonPlanMode] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');

  useEffect(() => {
    setSelectedOutcome('');
  }, [selectedClass]);

  const [qSettings, setQSettings] = useState({
    multipleChoice: { id: 'multipleChoice', label: 'Çoktan Seçmeli', active: true, count: 5 },
    classic: { id: 'classic', label: 'Klasik', active: true, count: 5 },
    fillInBlank: { id: 'fillInBlank', label: 'Boşluk Doldurma', active: false, count: 4 }
  });

  const updateQSetting = (id: string, field: string, value: boolean | number) => {
    setQSettings(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const [filters, setFilters] = useState({
    type: 'Roman Alıntısı',
    scope: 'Dünya Edebiyatı',
    period: 'Modernizm',
    theme: 'Yabancılaşma',
    difficulty: 'Orta'
  });

  const types = ['Şiir', 'Hikaye', 'Roman Alıntısı', 'Deneme', 'Tiyatro', 'Makale', 'Söylev (Nutuk)', 'Mülakat', 'Röportaj', 'Gezi Yazısı', 'Anı', 'Günlük'];
  const scopes = ['Türk Edebiyatı', 'Dünya Edebiyatı'];
  const periods = ['Tanzimat Dönemi', 'Servet-i Fünun', 'Milli Edebiyat', 'Cumhuriyet Dönemi', 'Divan Edebiyatı', 'Modernizm', 'Romantizm', 'Realizm', 'İslamiyet Öncesi', '1960 Sonrası', '1980 Sonrası'];
  const themes = ['Yalnızlık', 'Aşk', 'Ölüm', 'Doğa', 'Savaş', 'Toplum Eleştirisi', 'Kahramanlık', 'Yabancılaşma', 'Adalet', 'Dilin Zenginliği', 'Sanatın Dili', 'Tarihin İzleri', 'Hayatın Yankısı'];
  const difficulties = ['Temel', 'Orta', 'İleri'];

  const [editableResult, setEditableResult] = useState<any>(null);

  useEffect(() => {
    if (result) {
      setEditableResult(result);
    }
  }, [result]);

  const handleEditChange = (section: string, key: string, value: string, index: number | null = null) => {
    const newResult = { ...editableResult };
    if (section === 'meta' || section === 'analysis' || section === 'lesson_plan') {
      newResult[section][key] = value;
    } else if (section === 'text_content') {
       if (index !== null) newResult.text_content[index][key] = value;
    } else if (section === 'questions') {
      newResult.questions[index][key] = value;
    } else if (section === 'glossary') {
      newResult.glossary[index][key] = value;
    }
    setEditableResult(newResult);
  };

  const handleGenerate = async () => {
    if (!selectedClass) {
      setError("Lütfen bir sınıf seviyesi seçiniz.");
      return;
    }

    setLoading(true);
    setResult(null);
    setEditableResult(null);
    setError('');
    setIsEditing(false);

    const questionRequest = Object.values(qSettings)
      .filter(q => q.active)
      .map(q => `${q.count} adet ${q.label}`)
      .join(', ');
    
    const input = {
      selectedClass,
      selectedOutcome,
      dualColumnMode,
      lessonPlanMode,
      comparisonMode,
      filters,
      questionRequest,
    };

    try {
      const response = await generateEdebiyatMateryal(input);
      setResult(response);
      setError('');
    } catch (err: any) {
      setError("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToWord = (mode: 'student' | 'teacher') => {
    if (!editableResult) return;
    const isTeacher = mode === 'teacher';
    
    let contentHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>${editableResult.meta.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; }
          h1 { font-size: 16pt; font-weight: bold; text-align: center; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ccc; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 5px; }
          .meta { text-align: center; font-style: italic; color: #555; margin-bottom: 20px; }
          .info-box { border: 1px solid #ddd; padding: 5px; margin-bottom: 10px; font-size: 10pt; color: #444; text-align: center; background: #fafafa; }
          .text-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .text-table td { border: 1px solid #ccc; padding: 10px; vertical-align: top; width: 50%; }
          .text-box { background-color: #fdfdfd; padding: 10px; border: 1px solid #eee; margin-bottom: 15px; }
          .question { margin-bottom: 15px; }
          .answer { color: green; font-style: italic; margin-left: 20px; display: ${isTeacher ? 'block' : 'none'}; }
          .rubric { color: #d97706; font-size: 10pt; margin-left: 20px; border: 1px dashed #d97706; padding: 5px; display: ${isTeacher ? 'block' : 'none'}; margin-top: 5px; }
          .glossary { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
          .analysis-box { background-color: #f0f4f8; padding: 10px; border: 1px solid #ccc; margin-top: 20px; display: ${isTeacher ? 'block' : 'none'}; }
          .lesson-plan { background-color: #fff7ed; padding: 15px; border: 2px double #f97316; margin-top: 30px; page-break-before: always; display: ${isTeacher && lessonPlanMode ? 'block' : 'none'}; }
        </style>
      </head>
      <body>
        <h1>${editableResult.meta.title}</h1>
        <p class="meta">${editableResult.meta.author} - ${editableResult.meta.period}</p>
        
        <div class="info-box">
           Sınıf: ${selectedClass} | Kazanım: ${selectedOutcome || 'Genel'}
        </div>

        <!-- Metinler: Çift Sütun Kontrolü -->
        ${editableResult.text_content.map((txt: any) => {
          if (dualColumnMode && txt.body_modern) {
             return `
               <h3>${txt.title} (${txt.author})</h3>
               <table class="text-table">
                 <tr>
                   <td><b>Orijinal Metin</b><br/><br/>${txt.body_original.replace(/\n/g, '<br/>')}</td>
                   <td><b>Günümüz Türkçesi</b><br/><br/>${txt.body_modern.replace(/\n/g, '<br/>')}</td>
                 </tr>
               </table>
             `;
          } else {
             return `
               <div class="text-box">
                 <h3>${txt.title} (${txt.author})</h3>
                 <p>${txt.body_original.replace(/\n/g, '<br/>')}</p>
               </div>
             `;
          }
        }).join('')}

        ${editableResult.glossary && editableResult.glossary.length > 0 ? `
          <div class="glossary">
            <h3>Bilinmeyen Kelimeler</h3>
            <ul>
              ${editableResult.glossary.map((g: any) => `<li><b>${g.word}:</b> ${g.mean}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${isTeacher ? `
          <div class="analysis-box">
            <h2>Edebi Analiz</h2>
            <p><b>Özet:</b> ${editableResult.analysis.summary}</p>
            <p><b>Tema:</b> ${editableResult.analysis.theme}</p>
            <p><b>Anlatıcı:</b> ${editableResult.analysis.narrator}</p>
            <p><b>Dil ve Üslup:</b> ${editableResult.analysis.style}</p>
            <p><b>Yapı:</b> ${editableResult.analysis.structure}</p>
            <p><b>Dönem İlişkisi:</b> ${editableResult.analysis.context}</p>
            <p><b>Kazanım Yorumu:</b> ${editableResult.analysis.inference}</p>
          </div>
        ` : ''}

        <h2>Sınav Soruları</h2>
        <ol>
          ${editableResult.questions.map((q: any) => `
            <li class="question">
              ${q.q}
              ${isTeacher ? `
                <br/><span class="answer"><b>Cevap:</b> ${q.a}</span>
                <div class="rubric"><b>Puanlama Anahtarı (Rubrik):</b> ${q.rubric}</div>
              ` : '<br/><br/><br/>'}
            </li>
          `).join('')}
        </ol>
        
        ${isTeacher && lessonPlanMode && editableResult.lesson_plan ? `
          <div class="lesson-plan">
            <h2>40 Dakikalık Ders Akış Planı</h2>
            <p><b>1. Giriş (5 dk):</b> ${editableResult.lesson_plan.intro}</p>
            <p><b>2. Gelişme (25 dk):</b> ${editableResult.lesson_plan.development}</p>
            <p><b>3. Etkinlik:</b> ${editableResult.lesson_plan.activity}</p>
            <p><b>4. Kapanış (10 dk):</b> ${editableResult.lesson_plan.conclusion}</p>
          </div>
        ` : ''}

        <br/>
        <p style="text-align: center; font-size: 10pt; color: #888;">Bu sınav materyali Yapay Zeka desteğiyle hazırlanmıştır.</p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', contentHTML], { type: 'application/msword' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${editableResult.meta.title}_${mode === 'student' ? 'Ogrenci' : 'Ogretmen'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const openSaveDialog = () => {
        if (!editableResult) {
            toast({ title: "Arşivlenemiyor", description: "Lütfen önce bir içerik oluşturun.", variant: "destructive"});
            return;
        }
        const defaultName = editableResult?.meta?.title || `${selectedClass} Materyali`;
        setSaveNameInput(defaultName);
        setIsSaveDialogOpen(true);
    };

    const handleSaveToArchive = () => {
        if (!saveNameInput.trim() || !editableResult) return;
        
        const dataToSave = {
            result: editableResult,
            filters,
            selectedClass,
            selectedOutcome,
            qSettings,
            dualColumnMode,
            lessonPlanMode,
            comparisonMode,
        };

        const newDoc: EdebiyatAsistanDocument = {
            id: `edebiyat_${Date.now()}`,
            name: saveNameInput,
            date: new Date().toLocaleDateString('tr-TR'),
            data: dataToSave,
        };
        
        setLocalDb(prev => ({
            ...prev,
            edebiyatAsistanArsivi: [newDoc, ...(prev.edebiyatAsistanArsivi || [])]
        }));
        
        setIsSaveDialogOpen(false);
        toast({ title: "Arşivlendi", description: "Materyal başarıyla kaydedildi."});
    };

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
        setResult(null);
        setEditableResult(null);
    }, []);

    const handleDeleteFromArchive = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({
            ...prev,
            edebiyatAsistanArsivi: (prev.edebiyatAsistanArsivi || []).filter(r => r.id !== selectedRecordId)
        }));
        handleNewRecord();
        toast({ title: "Silindi", description: "Kayıt arşivden silindi.", variant: "destructive" });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);
    
    useEffect(() => {
        if (selectedRecordId) {
            const record = archives.find(r => r.id === selectedRecordId);
            if (record?.data) {
                const data = record.data;
                setResult(data.result);
                setEditableResult(data.result);
                setFilters(data.filters);
                setSelectedClass(data.selectedClass);
                setSelectedOutcome(data.selectedOutcome);
                setQSettings(data.qSettings);
                setDualColumnMode(data.dualColumnMode);
                setLessonPlanMode(data.lessonPlanMode);
                setComparisonMode(data.comparisonMode);
                setIsEditing(false); // Start in view mode
            }
        } else {
            handleNewRecord();
        }
    }, [selectedRecordId, archives, handleNewRecord]);


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-indigo-700 text-white shadow-lg p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={28} />
            <h1 className="text-2xl font-bold tracking-tight">Edebiyat Sınav Asistanı v3.1</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        
        <aside className="w-full lg:w-1/4 space-y-4">
          <RecordManager
            records={archives.map(r => ({ id: r.id, name: r.name }))}
            selectedRecordId={selectedRecordId}
            onSelectRecord={setSelectedRecordId}
            onNewRecord={handleNewRecord}
            onDeleteRecord={handleDeleteFromArchive}
            noun="Materyal"
          />

          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
            <h2 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
              <ListFilter size={18} />
              Sınıf & Müfredat
            </h2>
            <div className="space-y-3">
               <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Sınıf Seviyesi</label>
                <select 
                  className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-orange-500 bg-orange-50 outline-none font-medium"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {Object.keys(curriculumData).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Hedef Kazanım</label>
                <select 
                  className="w-full p-2 text-xs border rounded-lg focus:ring-1 focus:ring-orange-500 bg-white outline-none disabled:bg-gray-100"
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  disabled={!selectedClass}
                >
                  <option value="">{selectedClass ? 'Kazanım Seçiniz...' : 'Önce Sınıf Seçin'}</option>
                  {selectedClass && (curriculumData as any)[selectedClass].map((outcome: any, idx: any) => (
                    <option key={idx} value={outcome}>{outcome}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
              <ClipboardList size={18} />
              Gelişmiş Seçenekler
            </h2>
            <div className="space-y-2">
              <button 
                onClick={() => setDualColumnMode(!dualColumnMode)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all ${dualColumnMode ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                <span className="flex items-center gap-2"><Columns size={14}/> Çift Sütun / Sadeleştirme</span>
                <span className={`w-2 h-2 rounded-full ${dualColumnMode ? 'bg-indigo-600' : 'bg-gray-300'}`}></span>
              </button>

              <button 
                onClick={() => setLessonPlanMode(!lessonPlanMode)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all ${lessonPlanMode ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                <span className="flex items-center gap-2"><CalendarClock size={14}/> Ders Akış Planı Oluştur</span>
                <span className={`w-2 h-2 rounded-full ${lessonPlanMode ? 'bg-indigo-600' : 'bg-gray-300'}`}></span>
              </button>

              <button 
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium border transition-all ${comparisonMode ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
              >
                <span className="flex items-center gap-2"><SplitSquareHorizontal size={14}/> Mukayese (Karşılaştırma)</span>
                <span className={`w-2 h-2 rounded-full ${comparisonMode ? 'bg-indigo-600' : 'bg-gray-300'}`}></span>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2">
              <Layout size={18} />
              Metin Kriterleri
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Edebiyat Alanı', val: filters.scope, set: (v: string) => setFilters({...filters, scope: v}), opts: scopes },
                { label: 'Metin Türü', val: filters.type, set: (v: string) => setFilters({...filters, type: v}), opts: types },
                { label: 'Dönem / Akım', val: filters.period, set: (v: string) => setFilters({...filters, period: v}), opts: periods },
                { label: 'Tema', val: filters.theme, set: (v: string) => setFilters({...filters, theme: v}), opts: themes },
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</label>
                  <select className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-gray-50 outline-none" value={field.val} onChange={(e) => field.set(e.target.value)}>
                    {field.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Zorluk</label>
                <div className="flex gap-1">
                  {difficulties.map(d => (
                    <button key={d} onClick={() => setFilters({...filters, difficulty: d})} className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${filters.difficulty === d ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-500 border-gray-200'}`}>{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-3">
               <h2 className="text-sm font-bold text-indigo-700 flex items-center gap-2"><CheckSquare size={18} /> Soru Ayarları</h2>
             </div>
            <div className="space-y-3">
              {Object.values(qSettings).map((type) => (
                <div key={type.id} className="flex items-center justify-between group">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer flex-1">
                    <input type="checkbox" checked={type.active} onChange={(e) => updateQSetting(type.id, 'active', e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"/>
                    <span className={type.active ? 'text-gray-900 font-medium' : 'text-gray-400'}>{type.label}</span>
                  </label>
                  {type.active && (
                    <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 px-2 py-1">
                      <Hash size={12} className="text-gray-400"/>
                      <input type="number" min="1" max="20" value={type.count} onChange={(e) => updateQSetting(type.id, 'count', Number(e.target.value))} className="w-8 text-center bg-transparent text-xs font-bold text-indigo-700 focus:outline-none"/>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-right text-gray-400">
              Toplam Soru: <span className="font-bold text-indigo-600">{Object.values(qSettings).filter(q => q.active).reduce((sum, q) => sum + Number(q.count), 0)}</span>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-start gap-2"><AlertCircle size={14} className="mt-0.5 shrink-0" /><span className="flex-1">{error}</span></div>}

          <button onClick={handleGenerate} disabled={loading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <><RefreshCw className="animate-spin" size={18} /> 'Oluşturuluyor...'</> : <><PenTool size={18} /> Metin ve Analiz Oluştur</>}
          </button>
        </aside>

        <section className="flex-1 space-y-6">
          {!editableResult && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl min-h-[500px]">
              <Library size={64} className="mb-4 opacity-50" />
              <p className="text-lg text-center px-4">Lütfen sol panelden <b>Sınıf Seviyesi</b> seçerek başlayın.</p>
              <div className="flex gap-2 mt-4 text-xs">
                {dualColumnMode && <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">Çift Sütun Aktif</span>}
                {lessonPlanMode && <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-100">Ders Planı Aktif</span>}
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
              <div className="animate-pulse flex flex-col items-center max-w-lg text-center">
                <div className="h-4 w-48 bg-indigo-200 rounded mb-4"></div>
                <p className="text-lg font-medium text-gray-700 mb-2">Yapay Zeka İçerik Üretiyor...</p>
                <p className="text-sm text-gray-500">
                  {selectedClass} müfredatına uygun gerçek metin taranıyor...
                  <br/>Rubrikler ve {lessonPlanMode ? 'ders planı' : ''} hazırlanıyor.
                </p>
              </div>
            </div>
          )}

          {editableResult && !loading && (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
              
              <div className="bg-gray-50 p-3 border-b flex flex-wrap gap-2 justify-between items-center">
                <div className="flex items-center gap-2">
                   <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${isEditing ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {isEditing ? <><Save size={14}/> Kaydet</> : <><Edit size={14}/> Düzenle</>}
                  </button>
                  {isEditing && <span className="text-xs text-amber-600 animate-pulse">Düzenleme Modu Aktif</span>}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openSaveDialog}><Save className="mr-2 h-4 w-4"/> Arşive Kaydet</Button>
                  <Button onClick={() => exportToWord('student')} size="sm" className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">
                    <Download size={14} /> Word (Öğrenci)
                  </Button>
                  <Button onClick={() => exportToWord('teacher')} size="sm" className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
                    <Download size={14} /> Word (Öğretmen)
                  </Button>
                </div>
              </div>

              <div className="p-8">
                
                <div className="mb-6 border-b pb-4 text-center">
                  {isEditing ? (
                    <input className="text-2xl font-serif font-bold text-gray-900 text-center w-full border-b border-dashed border-gray-300 focus:outline-none focus:border-indigo-500 mb-2" value={editableResult.meta.title} onChange={(e) => handleEditChange('meta', 'title', e.target.value)} />
                  ) : (
                    <h2 className="text-2xl font-serif font-bold text-gray-900">{editableResult.meta.title}</h2>
                  )}
                  <div className="text-sm text-gray-600 italic flex justify-center gap-4 mt-2">
                     <span>{editableResult.meta.author}</span>
                     <span className="w-px h-4 bg-gray-300"></span>
                     <span>{editableResult.meta.period}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 border px-2 py-1 inline-block rounded-full">
                     {selectedClass} - {selectedOutcome ? 'Kazanım Odaklı' : 'Genel'}
                  </div>
                </div>

                <div className={`mb-8 ${editableResult.text_content.length > 1 && !dualColumnMode ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
                  {editableResult.text_content.map((txt: any, idx: any) => (
                    <div key={idx} className="bg-yellow-50/30 p-5 rounded-lg border border-yellow-100">
                      <h3 className="font-bold text-gray-800 mb-2 text-center">{txt.title} <span className="text-xs font-normal text-gray-500">({txt.author})</span></h3>
                      
                      {dualColumnMode && txt.body_modern ? (
                        <div className="grid grid-cols-2 gap-4">
                           <div className="font-serif text-sm leading-relaxed whitespace-pre-line text-gray-900 border-r pr-2 border-yellow-200">
                             <div className="text-xs font-bold text-gray-500 mb-1">ORİJİNAL</div>
                             {txt.body_original}
                           </div>
                           <div className="font-serif text-sm leading-relaxed whitespace-pre-line text-gray-800">
                             <div className="text-xs font-bold text-gray-500 mb-1">GÜNÜMÜZ TÜRKÇESİ</div>
                             {txt.body_modern}
                           </div>
                        </div>
                      ) : (
                        <div className="font-serif text-lg leading-relaxed whitespace-pre-line text-gray-900 text-justify">
                          {txt.body_original}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editableResult.glossary && editableResult.glossary.length > 0 && (
                  <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-2"><BookOpen size={16} /> BİLİNMEYEN KELİMELER (LÜGATÇE)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
                      {editableResult.glossary.map((item: any, idx: any) => (
                        <div key={idx} className="text-sm">
                           <span className="font-bold text-gray-800">{item.word}:</span> <span className="text-gray-600">{item.mean}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><GraduationCap className="text-indigo-600" /> Detaylı Edebi Analiz</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['summary', 'theme', 'narrator', 'style', 'structure', 'context', 'inference'].map((key) => (
                      <div key={key} className="bg-gray-50 p-3 rounded border border-gray-100">
                        <h4 className="font-bold text-gray-700 text-xs uppercase mb-1">{key}</h4>
                        <p className="text-gray-700 text-sm">{editableResult.analysis[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2"><FileJson className="text-indigo-600" /> Sınav Soruları ve Rubrik</h3>
                  <div className="space-y-6">
                    {editableResult.questions.map((q: any, idx: any) => (
                      <div key={idx} className="break-inside-avoid">
                        <div className="flex gap-2 font-medium text-gray-900">
                          <span className="font-bold text-indigo-700">{idx + 1}.</span>
                          <span>{q.q}</span>
                        </div>
                        <div className="mt-2 pl-6 text-sm">
                          <div className="text-gray-500 italic mb-1"><span className="font-bold text-green-600 not-italic">Cevap:</span> {q.a}</div>
                          <div className="text-amber-700 text-xs border border-amber-200 bg-amber-50 p-2 rounded flex items-start gap-2">
                             <CheckSquare size={14} className="mt-0.5"/>
                             <span><b>Puanlama Anahtarı (Rubrik):</b> {q.rubric}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {lessonPlanMode && editableResult.lesson_plan && (
                  <div className="mt-10 border-t-2 border-dashed border-orange-200 pt-6">
                    <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2"><CalendarClock className="text-orange-600" /> 40 Dakikalık Ders Akış Planı</h3>
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-4">
                       <div><div className="font-bold text-orange-900 text-sm">1. GİRİŞ (5 Dk)</div><p className="text-sm text-gray-700">{editableResult.lesson_plan.intro}</p></div>
                       <div><div className="font-bold text-orange-900 text-sm">2. GELİŞME (25 Dk)</div><p className="text-sm text-gray-700">{editableResult.lesson_plan.development}</p></div>
                       <div><div className="font-bold text-orange-900 text-sm">3. SINIF İÇİ ETKİNLİK</div><p className="text-sm text-gray-700">{editableResult.lesson_plan.activity}</p></div>
                       <div><div className="font-bold text-orange-900 text-sm">4. KAPANIŞ VE DEĞERLENDİRME (10 Dk)</div><p className="text-sm text-gray-700">{editableResult.lesson_plan.conclusion}</p></div>
                    </div>
                  </div>
                )}

              </div>
              <div className="bg-gray-50 p-4 text-center text-xs text-gray-400">Bu materyal Edebiyat Sınav Asistanı v3.0 ile oluşturulmuştur.</div>
            </div>
          )}
        </section>
      </main>
      
       <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Materyali Arşive Kaydet</DialogTitle>
                  <DialogDescription>Bu içeriğe daha sonra erişmek için bir isim verin.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                  <label htmlFor="save-name">Kayıt Adı</label>
                  <Input id="save-name" value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} />
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleSaveToArchive}>Kaydet</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
};
