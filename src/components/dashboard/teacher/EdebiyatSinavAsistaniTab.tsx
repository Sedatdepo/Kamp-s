'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, FileText, Download, Save, PenTool, GraduationCap, AlertCircle, CheckSquare, Edit, ListFilter, Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import { EdebiyatAsistanDocument } from '@/lib/types';
import { generateEdebiyatMateryal } from '@/ai/flows/generate-edebiyat-materyal-flow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { KAZANIMLAR } from '@/lib/kazanimlar';


const App = () => {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { toast } = useToast();

  const { edebiyatAsistanArsivi: archives = [] } = localDb;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [dualColumnMode, setDualColumnMode] = useState(false); // Çift Sütun Modu
  const [lessonPlanMode, setLessonPlanMode] = useState(true); // Ders Planı Modu (Varsayılan Açık)
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');

  const curriculum = useMemo(() => KAZANIMLAR.Edebiyat || [], []);

  useEffect(() => {
    setSelectedOutcome('');
  }, [selectedClass]);

  const kazanimOptions = useMemo(() => {
    if (!selectedClass) return [];
    const classData = curriculum.find((c: any) => c.unite === selectedClass);
    return classData ? classData.kazanimlar : [];
  }, [curriculum, selectedClass]);
  
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
            <h1 className="text-2xl font-bold tracking-tight">Edebiyat Sınav Asistanı v3.2</h1>
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-green-700 flex items-center gap-2">
                        <ListFilter size={18} /> Müfredat Seçimi
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 mb-1">Sınıf Seviyesi</Label>
                        <select className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-orange-500 bg-orange-50 outline-none font-medium" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {(curriculum || []).map((cls: any, index: number) => <option key={index} value={cls.unite}>{cls.unite}</option>)}
                        </select>
                    </div>
                     <div>
                        <Label className="block text-xs font-semibold text-gray-500 mb-1">Hedef Kazanım</Label>
                         <select className="w-full p-2 text-xs border rounded-lg focus:ring-1 focus:ring-orange-500 bg-white outline-none disabled:bg-gray-100 h-24" value={selectedOutcome} onChange={e => setSelectedOutcome(e.target.value)} disabled={!selectedClass} multiple={false} size={5}>
                            <option value="">Önce sınıf seçin...</option>
                            {kazanimOptions.map((kazanim: string, index: number) => <option key={index} value={kazanim}>{kazanim.substring(0, 100)}...</option>)}
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <ListFilter size={18} /> Metin Kriterleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>

            <Button onClick={handleGenerate} disabled={loading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <><Loader2 className="animate-spin" size={18} /> Oluşturuluyor...</> : <><PenTool size={18} /> Metin ve Analiz Oluştur</>}
            </Button>
        </aside>

        {/* SAĞ PANEL: Sonuç */}
        <section className="flex-1 space-y-6">
           {!editableResult && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl min-h-[500px]">
              <Library size={64} className="mb-4 opacity-50" />
              <p className="text-lg text-center px-4">Lütfen sol panelden <b>Sınıf Seviyesi</b> seçerek başlayın.</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center min-h-[500px]">
              <div className="animate-pulse flex flex-col items-center max-w-lg text-center">
                <div className="h-4 w-48 bg-indigo-200 rounded mb-4"></div>
                <p className="text-lg font-medium text-gray-700 mb-2">Yapay Zeka İçerik Üretiyor...</p>
                <p className="text-sm text-gray-500">
                  Seçilen kriterlere uygun metin taranıyor...
                  <br/>Rubrikler ve ders planı hazırlanıyor.
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
                  <Button onClick={() => exportToWord('student')} size="sm" className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors">
                    <Download size={14} /> Word (Öğrenci)
                  </Button>
                  <Button onClick={() => exportToWord('teacher')} size="sm" className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors">
                    <Download size={14} /> Word (Öğretmen)
                  </Button>
                </div>
              </div>

               <div className="p-8">
                  {/* ... OMITTED FOR BREVITY, content is the same as before ... */}
              </div>
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
                  <Label htmlFor="save-name">Kayıt Adı</Label>
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

export default App;
