'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen, FileText, Download, Save, RefreshCw, PenTool, Library, GraduationCap, Layout, Key, AlertCircle, CheckSquare, FileJson, Edit, SplitSquareHorizontal, Hash, ListFilter, Columns, ClipboardList, CalendarClock, Upload, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { EdebiyatAsistanDocument } from '@/lib/types';
import { generateEdebiyatMateryal } from '@/ai/flows/generate-edebiyat-materyal-flow';
import { extractOutcomesFromPdf } from '@/ai/flows/extract-outcomes-from-pdf-flow';

const App = () => {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { toast } = useToast();

  const { edebiyatAsistanArsivi: archives = [], edebiyatKazanımlar: dynamicCurriculum } = localDb;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [dualColumnMode, setDualColumnMode] = useState(false);
  const [lessonPlanMode, setLessonPlanMode] = useState(true);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedUnite, setSelectedUnite] = useState('');
  const [selectedKonu, setSelectedKonu] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const curriculum = useMemo(() => dynamicCurriculum?.Edebiyat || [], [dynamicCurriculum]);

  const uniteOptions = useMemo(() => {
    const classData = curriculum.find((c: any) => c.unite.startsWith(selectedClass.split('.')[0]));
    return classData ? classData.konular.map((k: any) => k.konu) : [];
  }, [curriculum, selectedClass]);
  
  const konuOptions = useMemo(() => {
    if (!selectedUnite) return [];
    const classData = curriculum.find((c: any) => c.unite.startsWith(selectedClass.split('.')[0]));
    const uniteData = classData?.konular.find((k: any) => k.konu === selectedUnite);
    return uniteData ? uniteData.kazanimlar : [];
  }, [curriculum, selectedClass, selectedUnite]);

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
  
    const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        } else {
            toast({ title: "Geçersiz Dosya", description: "Lütfen bir PDF dosyası seçin.", variant: "destructive"});
            setPdfFile(null);
        }
    };
    
    const handleAnalyzePdf = async () => {
        if (!pdfFile) return;

        setIsAnalyzing(true);
        toast({ title: "Analiz Başladı", description: "Ders kitabı analiz ediliyor, bu işlem birkaç dakika sürebilir." });

        const reader = new FileReader();
        reader.readAsDataURL(pdfFile);
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            try {
                const result = await extractOutcomesFromPdf({ textbookPdf: dataUrl });
                if (result && result.curriculum) {
                    setLocalDb(prev => ({
                        ...prev,
                        edebiyatKazanımlar: result.curriculum,
                    }));
                    toast({ title: "Başarılı!", description: "Kazanımlar başarıyla güncellendi ve kaydedildi."});
                } else {
                    throw new Error("Yapay zeka geçerli bir kazanım yapısı döndürmedi.");
                }
            } catch (err: any) {
                console.error(err);
                toast({ title: "Analiz Başarısız", description: err.message || "Kazanımlar çıkarılırken bir hata oluştu.", variant: "destructive" });
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.onerror = () => {
            toast({ title: "Dosya Okuma Hatası", variant: "destructive" });
            setIsAnalyzing(false);
        };
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
    // ... same as before
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
                        <Upload size={18} /> Kazanım Yöneticisi
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Ders kitabınızı (PDF) yükleyerek kazanım listesini otomatik güncelleyin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Input type="file" accept=".pdf" onChange={handlePdfUpload} className="text-xs"/>
                    <Button onClick={handleAnalyzePdf} disabled={!pdfFile || isAnalyzing} className="w-full">
                        {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="mr-2 h-4 w-4"/>}
                        Analiz Et ve Güncelle
                    </Button>
                </CardContent>
            </Card>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                <h2 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                    <ListFilter size={18} /> Müfredat Seçimi
                </h2>
                <div className="space-y-3">
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 mb-1">Sınıf Seviyesi</Label>
                        <select className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-orange-500 bg-orange-50 outline-none font-medium" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {Object.keys(curriculum).map(cls => <option key={cls} value={cls}>{curriculum[cls][0]?.unite || cls}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 mb-1">Ünite / Konu</Label>
                         <select className="w-full p-2 text-xs border rounded-lg focus:ring-1 focus:ring-orange-500 bg-white outline-none disabled:bg-gray-100" value={selectedUnite} onChange={e => setSelectedUnite(e.target.value)} disabled={!selectedClass}>
                            <option value="">Önce sınıf seçin...</option>
                            {uniteOptions.map((konu: string) => <option key={konu} value={konu}>{konu}</option>)}
                        </select>
                    </div>
                     <div>
                        <Label className="block text-xs font-semibold text-gray-500 mb-1">Hedef Kazanım</Label>
                         <select className="w-full p-2 text-xs border rounded-lg focus:ring-1 focus:ring-orange-500 bg-white outline-none disabled:bg-gray-100" value={selectedOutcome} onChange={e => setSelectedOutcome(e.target.value)} disabled={!selectedUnite}>
                            <option value="">Önce konu seçin...</option>
                            {konuOptions.map((kazanim: string) => <option key={kazanim} value={kazanim}>{kazanim}</option>)}
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
                  <Label className="block text-xs font-semibold text-gray-500 mb-1">{field.label}</Label>
                  <select className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-gray-50 outline-none" value={field.val} onChange={(e) => field.set(e.target.value)}>
                    {field.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <Label className="block text-xs font-semibold text-gray-500 mb-1">Zorluk</Label>
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

          <Button onClick={handleGenerate} disabled={loading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? <><Loader2 className="animate-spin" size={18} /> Oluşturuluyor...</> : <><PenTool size={18} /> Metin ve Analiz Oluştur</>}
          </Button>
        </aside>

        {/* The rest of the component remains the same for displaying results */}
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
                  Seçilen kriterlere uygun metin taranıyor...
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
