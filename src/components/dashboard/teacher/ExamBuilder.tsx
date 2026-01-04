
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, Image as ImageIcon, 
  Trash2, Save, FileText, ArrowUp, ArrowDown, Plus, Eye, Printer,
  LayoutTemplate, CheckSquare, Type, CheckCircle, Key, GripVertical, Upload, X,
  Download, FolderOpen, Shuffle, RefreshCw, Palette, Grid3X3, Settings, PieChart, Tag,
  QrCode, FilePlus
} from 'lucide-react';

// --- TİPLER ---
type QuestionType = 'choice' | 'open' | 'truefalse';
type ExamTheme = 'classic' | 'modern' | 'minimal';

interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: string[];
  correctOption: number | null;
  image: string | null;
  span: number;
  filled: boolean;
}

interface ExamSettings {
  fontSize: number;
  lineHeight: number;
  watermark: string;
}

interface ExamInfo {
  title: string;
  logo: string | null;
  group: 'A' | 'B';
  theme: ExamTheme;
  settings: ExamSettings;
}

interface SavedProject {
  examInfo: ExamInfo;
  slots: Question[];
  version: string;
}

// --- BASİT HTML EDİTÖRÜ ---
const SimpleHtmlEditor = ({ value, onChange, addImage }: { value: string, onChange: (val: string) => void, addImage: () => void }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = text;
    newText = text.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + text.substring(end);
    
    onChange(newText);
    setTimeout(() => textarea.focus(), 0);
  };

  return (
    <div className="flex flex-col border border-gray-300 rounded overflow-hidden h-full bg-white shadow-sm">
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <button onClick={() => insertTag('b')} className="p-1.5 rounded hover:bg-gray-200" title="Kalın"><Bold size={16} /></button>
        <button onClick={() => insertTag('i')} className="p-1.5 rounded hover:bg-gray-200" title="İtalik"><Italic size={16} /></button>
        <button onClick={() => insertTag('u')} className="p-1.5 rounded hover:bg-gray-200" title="Altı Çizili"><UnderlineIcon size={16} /></button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button onClick={addImage} className="p-1.5 rounded hover:bg-gray-200 text-gray-700" title="Görsel Ekle"><ImageIcon size={16} /></button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-3 outline-none resize-none text-sm font-sans focus:bg-blue-50/10 transition"
        placeholder="Sorunuzu buraya yazın..."
      />
    </div>
  );
};

// --- ANA BİLEŞEN ---
export default function ExamBuilder() {
  // Varsayılan 10 boş slot
  const [slots, setSlots] = useState<Question[]>(
    Array(10).fill(null).map((_, i) => ({
      id: i,
      text: '',
      type: 'choice',
      options: ['', '', '', ''],
      correctOption: null,
      image: null,
      span: 1,
      filled: false,
    }))
  );

  const [currentSlotId, setCurrentSlotId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'settings'>('editor');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [examInfo, setExamInfo] = useState<ExamInfo>({
    title: 'MATEMATİK SINAVI',
    logo: null,
    group: 'A',
    theme: 'classic',
    settings: {
      fontSize: 11,
      lineHeight: 1.5,
      watermark: ''
    },
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState('');
  
  const activeSlot = slots.find(s => s.id === currentSlotId) || slots[0];

  useEffect(() => {
    setEditorContent(activeSlot.text);
  }, [currentSlotId, activeSlot.text]);

  // --- DRAG & DROP ---
  const handleDragStart = (index: number) => { setDraggedSlotIndex(index); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (targetIndex: number) => {
    if (draggedSlotIndex === null || draggedSlotIndex === targetIndex) return;
    const newSlots = [...slots];
    // Basit swap: Veriyi değiştir, ID'leri koru (konum sabitliği için)
    const draggedItem = { ...newSlots[draggedSlotIndex] };
    const targetItem = { ...newSlots[targetIndex] };
    newSlots[draggedSlotIndex] = { ...targetItem, id: draggedSlotIndex };
    newSlots[targetIndex] = { ...draggedItem, id: targetIndex };
    setSlots(newSlots);
    setDraggedSlotIndex(null);
    setCurrentSlotId(targetIndex); 
  };

  // --- PROJE İŞLEMLERİ ---
  const newProject = () => {
    if(confirm('Mevcut çalışma silinecek ve yeni bir proje başlatılacak. Emin misiniz?')) {
        setSlots(Array(10).fill(null).map((_, i) => ({ id: i, text: '', type: 'choice', options: ['', '', '', ''], correctOption: null, image: null, span: 1, filled: false })));
        setExamInfo({ title: 'YENİ SINAV', logo: null, group: 'A', theme: 'classic', settings: { fontSize: 11, lineHeight: 1.5, watermark: '' } });
        setCurrentSlotId(0);
    }
  };

  // --- KARIŞTIRMA (A/B) ---
  const shuffleQuestions = () => {
    const nextGroup = examInfo.group === 'A' ? 'B' : 'A';
    if (!confirm(`Sorular karıştırılıp ${nextGroup} Grubu yapılacak. Emin misiniz?`)) return;
    
    const filledSlots = slots.filter(s => s.filled);
    const emptySlots = slots.filter(s => !s.filled);
    
    // Fisher-Yates Shuffle
    for (let i = filledSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filledSlots[i], filledSlots[j]] = [filledSlots[j], filledSlots[i]];
    }
    
    const allContent = [...filledSlots, ...emptySlots];
    const newSlots = slots.map((slot, index) => ({ ...allContent[index], id: index }));
    
    setSlots(newSlots);
    setCurrentSlotId(0);
    setExamInfo(prev => ({ ...prev, group: nextGroup }));
  };

  // --- SLOT & EDİTÖR İŞLEMLERİ ---
  const handleSaveSlice = () => {
    setSlots(prev => prev.map(slot => slot.id === currentSlotId ? { ...slot, text: editorContent, filled: true } : slot));
  };
  const handleClearSlice = () => {
    if (confirm('Temizlensin mi?')) {
      setSlots(prev => prev.map(slot => slot.id === currentSlotId ? { ...slot, text: '', image: null, filled: false, options: ['', '', '', ''], correctOption: null, span: 1 } : slot));
      setEditorContent('');
    }
  };
  const updateSlotField = (field: keyof Question, value: any) => {
    setSlots(prev => prev.map(s => s.id === currentSlotId ? { ...s, [field]: value } : s));
  };
  const updateOption = (index: number, value: string) => {
    const newOptions = [...activeSlot.options];
    newOptions[index] = value;
    updateSlotField('options', newOptions);
  };
  
  // Resim & Logo
  const triggerImageUpload = () => imageInputRef.current?.click();
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => { if (evt.target?.result) updateSlotField('image', evt.target.result as string); };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };
  const triggerLogoUpload = () => logoInputRef.current?.click();
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => { if (evt.target?.result) setExamInfo(prev => ({ ...prev, logo: evt.target?.result as string })); };
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  // --- ÇIKTI ÜRETECİLERİ ---
  const generateAnswerKeyHTML = () => {
    const filled = slots.filter(s => s.filled && s.type === 'choice');
    if (filled.length === 0) return '';
    let html = `<br><br><div style="border: 1px solid #000; padding: 10px; font-size: 10pt;"><strong>${examInfo.group} GRUBU CEVAP ANAHTARI:</strong><br><table style="width: 100%; border-collapse: collapse; margin-top: 5px;"><tr>`;
    filled.forEach((q, i) => {
        const char = q.correctOption !== null ? ['A', 'B', 'C', 'D'][q.correctOption] : '-';
        html += `<td style="border: 1px solid #ccc; padding: 2px 5px; text-align: center;"><b>${i + 1}.</b> ${char}</td>`;
        if ((i + 1) % 10 === 0) html += `</tr><tr>`;
    });
    html += `</tr></table></div>`;
    return html;
  };

  const exportToWord = () => {
    let extra = '';
    if (showAnswerKey) extra += generateAnswerKeyHTML();
    
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset="utf-8"><title>${examInfo.title}</title></head>
      <body style="font-family: ${examInfo.theme === 'modern' ? 'Arial' : 'Times New Roman'}; font-size: ${examInfo.settings.fontSize}pt;">
        <table style="width:100%; border-bottom: 2px solid black; margin-bottom: 20px;">
            <tr>
                ${examInfo.logo ? `<td style="width:100px;"><img src="${examInfo.logo}" width="80" height="80"></td>` : ''}
                <td style="text-align:center;"><h1>${examInfo.title}</h1><p>Adı Soyadı: ...........................................</p></td>
                <td style="width:100px; text-align:right;">
                    <div style="width:40px; height:40px; border:2px solid black; border-radius:50%; text-align:center; line-height:40px; font-weight:bold; display:inline-block; margin-top:5px;">${examInfo.group}</div>
                </td>
            </tr>
        </table>
        <p><i>[Sınav İçeriği]</i></p>
        ${extra}
        ${examInfo.settings.watermark ? `<div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-45deg); font-size:80pt; color:#eee; z-index:-1;">${examInfo.settings.watermark}</div>` : ''}
      </body></html>`;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sinav_${examInfo.group}.doc`;
    link.click();
  };

  const getThemeStyles = (theme: ExamTheme) => {
    switch (theme) {
      case 'modern': return { container: 'font-sans', header: 'border-b-4 border-blue-600 pb-4 mb-6', title: 'text-3xl font-extrabold text-blue-800 uppercase', slotBorder: 'border border-blue-100 rounded-lg shadow-sm', slotNumber: 'bg-blue-600 text-white rounded-br-lg', groupCircle: 'border-4 border-blue-600 text-blue-600' };
      case 'minimal': return { container: 'font-sans', header: 'border-b border-gray-300 pb-2 mb-4', title: 'text-xl font-normal text-gray-800 uppercase', slotBorder: 'border-b border-gray-100', slotNumber: 'text-gray-400 font-normal', groupCircle: 'border border-gray-400 text-gray-600' };
      default: return { container: 'font-serif', header: 'border-b-2 border-black pb-4 mb-6', title: 'text-2xl font-bold text-black uppercase', slotBorder: 'border-b border-dashed border-gray-300', slotNumber: 'bg-gray-100 text-gray-500 rounded', groupCircle: 'border-2 border-black text-black' };
    }
  };

  const ExamPaperContent = ({ forPreview = false }) => {
    const styles = getThemeStyles(examInfo.theme);
    const { fontSize, lineHeight, watermark } = examInfo.settings;

    return (
      <div 
        className={`bg-white w-[21cm] min-h-[29.7cm] shadow-2xl p-[1.5cm] flex flex-col relative overflow-hidden ${styles.container} ${forPreview ? 'shadow-none' : ''}`}
        style={{ fontSize: `${fontSize}pt` }}
      >
        {watermark && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-gray-100 font-bold text-[80pt] pointer-events-none select-none z-0 whitespace-nowrap">{watermark}</div>}

        <div className={`flex items-start gap-4 shrink-0 relative z-10 ${styles.header}`}>
            {examInfo.logo && <div className="w-[80px] h-[80px] flex items-center justify-center shrink-0"><img src={examInfo.logo} alt="Logo" className="max-w-full max-h-full object-contain" /></div>}
            
            <div className="flex-1 text-center flex flex-col justify-center">
                <h1 className={styles.title}>{examInfo.title}</h1>
                <div className="flex justify-between text-sm px-4 mt-2">
                    <div className="text-left space-y-1"><div>Adı Soyadı: ..............................</div><div>Sınıfı / No: ..............................</div></div>
                    <div className="text-left space-y-1"><div>Tarih: ...../...../20....</div><div>Notu: .....................</div></div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl bg-white ${styles.groupCircle}`}>{examInfo.group}</div>
            </div>
        </div>

        <div className="flex gap-[1cm] flex-1 z-10">
          {[0, 5].map((startIdx, colIndex) => (
            <div key={colIndex} className={`flex-1 flex flex-col ${forPreview ? '' : 'border border-dashed border-gray-200 p-1'}`}>
              {slots.slice(startIdx, startIdx + 5).map((slot, i) => (
                <SliceItem 
                  key={slot.id} slot={slot} isActive={!forPreview && slot.id === currentSlotId} onClick={() => !forPreview && setCurrentSlotId(slot.id)} 
                  index={i + startIdx} onDragStart={!forPreview ? handleDragStart : undefined} onDragOver={!forPreview ? handleDragOver : undefined} 
                  onDrop={!forPreview ? handleDrop : undefined} draggable={!forPreview} styles={styles} lineHeight={lineHeight}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="z-10">
            {showAnswerKey && (
                <div className="mt-4 pt-4 border-t-2 border-black">
                    <h3 className="text-sm font-bold mb-2">{examInfo.group} GRUBU CEVAP ANAHTARI</h3>
                    <div className="grid grid-cols-10 gap-2 text-xs border border-gray-300 p-2">
                        {slots.map((slot, i) => { if (!slot.filled || slot.type !== 'choice') return null; return <div key={i} className="flex justify-between border-b border-gray-200 pb-1"><span className="font-bold">{i + 1}.</span><span>{slot.correctOption !== null ? ['A','B','C','D'][slot.correctOption] : '-'}</span></div>; })}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2"><LayoutTemplate size={24} /><h1 className="text-xl font-bold hidden md:block">Sınav Editörü Pro</h1></div>
        <div className="flex gap-2 items-center">
           <button onClick={newProject} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-red-600 hover:bg-red-700 transition" title="Yeni Proje"><FilePlus size={16} /><span className="hidden md:inline">Yeni</span></button>
           <button onClick={shuffleQuestions} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium bg-orange-600 hover:bg-orange-700 transition" title="Karıştır"><Shuffle size={16} /><span className="hidden md:inline">Karıştır</span></button>
           <div className="w-px h-6 bg-slate-600 mx-2"></div>
           <button onClick={() => setIsPreviewOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-purple-600 hover:bg-purple-700 transition"><Eye size={16} /><span className="hidden md:inline">Önizle</span></button>
           <button onClick={exportToWord} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium transition"><FileText size={16} /><span className="hidden md:inline">Word</span></button>
        </div>
      </header>

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageFileChange} />
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoFileChange} />
      <input type="file" ref={projectInputRef} className="hidden" accept=".json" />

      <div className="flex flex-1 overflow-hidden">
        {/* SOL PANEL */}
        <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
          
          <div className="flex border-b">
              <button onClick={() => setActiveTab('editor')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'editor' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}><FileText size={16} /> Soru Editörü</button>
              <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}><Settings size={16} /> Ayarlar</button>
          </div>

          {activeTab === 'editor' ? (
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-blue-800">DÜZENLENEN KUTU</span>
                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-mono">#{currentSlotId + 1}</span>
                    </div>
                </div>
                <div className="p-5 flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Soru Tipi</label>
                            <div className="flex border rounded overflow-hidden">
                                <button onClick={() => updateSlotField('type', 'choice')} className={`flex-1 p-2 ${activeSlot.type === 'choice' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><CheckSquare size={16} className="mx-auto"/></button>
                                <button onClick={() => updateSlotField('type', 'open')} className={`flex-1 p-2 ${activeSlot.type === 'open' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><Type size={16} className="mx-auto"/></button>
                                <button onClick={() => updateSlotField('type', 'truefalse')} className={`flex-1 p-2 ${activeSlot.type === 'truefalse' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}><div className="text-xs font-bold">D/Y</div></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Yükseklik</label>
                            <select className="w-full p-2 border rounded bg-white text-sm" value={activeSlot.span} onChange={(e) => updateSlotField('span', parseInt(e.target.value))}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Birim</option>)}</select>
                        </div>
                    </div>
                    <div className="h-[200px]"><SimpleHtmlEditor value={editorContent} onChange={setEditorContent} addImage={triggerImageUpload} /></div>
                    {activeSlot.image && (<div className="relative group border rounded p-2 bg-gray-50 text-center"><img src={activeSlot.image} alt="Soru görseli" className="h-20 mx-auto object-contain" /><button onClick={() => updateSlotField('image', null)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button></div>)}
                    {activeSlot.type === 'choice' && (
                    <div className="space-y-2 bg-gray-50 p-3 rounded border">
                        <div className="text-xs font-bold text-gray-500 mb-1 flex justify-between"><span>SEÇENEKLER</span><span className="text-green-600">DOĞRU CEVAP</span></div>
                        {activeSlot.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <button onClick={() => updateSlotField('correctOption', activeSlot.correctOption === i ? null : i)} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition ${activeSlot.correctOption === i ? 'bg-green-600 text-white ring-2 ring-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{['A','B','C','D'][i]}</button>
                            <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)} className={`flex-1 p-1.5 text-sm border rounded outline-none transition ${activeSlot.correctOption === i ? 'border-green-500 bg-green-50' : 'focus:border-blue-500'}`} placeholder={`Seçenek ${['A','B','C','D'][i]}`} />
                            {activeSlot.correctOption === i && <CheckCircle size={16} className="text-green-600" />}
                        </div>
                        ))}
                    </div>
                    )}
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSaveSlice} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2 transition"><Save size={18} /> Kaydet</button>
                        <button onClick={handleClearSlice} className="bg-red-100 hover:bg-red-200 text-red-600 px-4 rounded transition"><Trash2 size={18} /></button>
                    </div>
                </div>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-6">
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Palette size={16}/> GÖRÜNÜM AYARLARI</h3>
                    <div className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Tema Seçimi</label><div className="flex gap-2">{(['classic', 'modern', 'minimal'] as ExamTheme[]).map(t => (<button key={t} onClick={() => setExamInfo(prev => ({ ...prev, theme: t }))} className={`text-xs px-3 py-2 rounded border flex-1 capitalize transition ${examInfo.theme === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{t}</button>))}</div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Yazı Boyutu: {examInfo.settings.fontSize}pt</label><input type="range" min="9" max="16" step="0.5" value={examInfo.settings.fontSize} onChange={(e) => setExamInfo(prev => ({ ...prev, settings: { ...prev.settings, fontSize: parseFloat(e.target.value) } }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Satır Aralığı: {examInfo.settings.lineHeight}</label><input type="range" min="1" max="2.5" step="0.1" value={examInfo.settings.lineHeight} onChange={(e) => setExamInfo(prev => ({ ...prev, settings: { ...prev.settings, lineHeight: parseFloat(e.target.value) } }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">Arka Plan Filigranı</label><input type="text" placeholder="Örn: TASLAK veya OKUL İSMİ" value={examInfo.settings.watermark} onChange={(e) => setExamInfo(prev => ({ ...prev, settings: { ...prev.settings, watermark: e.target.value } }))} className="w-full p-2 border rounded text-sm bg-gray-50" /></div>
                    </div>
                </div>
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Settings size={16}/> SINAV BİLGİLERİ</h3>
                    <div className="space-y-3">
                        <input type="text" value={examInfo.title} onChange={(e) => setExamInfo({...examInfo, title: e.target.value})} className="w-full p-2 border rounded font-bold text-center text-sm" placeholder="Sınav Başlığı" />
                        <div className="flex gap-2">
                            <button onClick={() => setExamInfo(prev => ({ ...prev, group: prev.group === 'A' ? 'B' : 'A' }))} className="flex-1 border rounded py-2 font-bold bg-gray-50 text-blue-800 text-sm">Grup: {examInfo.group}</button>
                            <button onClick={triggerLogoUpload} className="flex-1 border rounded py-2 bg-gray-50 text-gray-600 text-sm flex items-center justify-center gap-2"><Upload size={14}/> Logo</button>
                        </div>
                        <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="w-full border rounded py-2 bg-gray-50 text-gray-600 text-sm flex items-center justify-center gap-2"><Key size={14}/> Cevap Anahtarı: {showAnswerKey ? 'Açık' : 'Kapalı'}</button>
                    </div>
                </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-600 p-8 overflow-y-auto flex justify-center">
            <ExamPaperContent forPreview={false} />
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center overflow-y-auto py-10">
            <div className="relative">
                <button onClick={() => setIsPreviewOpen(false)} className="fixed top-5 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition"><X size={24} /></button>
                <ExamPaperContent forPreview={true} />
            </div>
        </div>
      )}
    </div>
  );
}

// --- SLICE ITEM ---
const SliceItem = ({ slot, isActive, onClick, index, onDragStart, onDragOver, onDrop, draggable, styles, lineHeight }: { slot: Question, isActive: boolean, onClick: () => void, index: number, onDragStart?: (id: number) => void, onDragOver?: (e: React.DragEvent) => void, onDrop?: (id: number) => void, draggable?: boolean, styles: any, lineHeight: number }) => {
  return (
    <div 
      onClick={onClick} draggable={draggable} onDragStart={draggable && onDragStart ? () => onDragStart(slot.id) : undefined} onDragOver={draggable && onDragOver ? (e) => onDragOver(e) : undefined} onDrop={draggable && onDrop ? () => onDrop(slot.id) : undefined}
      className={`relative p-2 cursor-pointer transition-all flex flex-col group ${styles.slotBorder} ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'} ${!slot.filled ? 'justify-center items-center text-gray-300' : ''}`}
      style={{ flex: slot.span }}
    >
      <span className={`absolute top-0 right-0 text-[10px] px-1.5 py-0.5 ${styles.slotNumber}`}>#{index + 1}</span>
      {draggable && <div className="absolute top-1/2 left-1 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-move" title="Taşı"><GripVertical size={16} /></div>}
      {!slot.filled ? (
        <div className="flex flex-col items-center gap-1"><Plus size={20} /><span className="text-xs">Soru Ekle</span></div>
      ) : (
        <div className="text-sm w-full h-full overflow-hidden pl-4" style={{ lineHeight: lineHeight }}>
          <div className="flex gap-1 mb-1"><span className="font-bold">{index + 1}.</span><div className="prose prose-sm max-w-none m-0 p-0" dangerouslySetInnerHTML={{ __html: slot.text }} /></div>
          {slot.image && <img src={slot.image} alt="Soru görseli" className="max-h-24 my-2 block" />}
          {slot.type === 'choice' && (<div className="mt-2 text-xs space-y-1">{slot.options.map((opt, i) => opt && (<div key={i} className={slot.correctOption === i ? "text-green-700 font-bold bg-green-50 px-1 rounded inline-block" : ""}><span className="font-bold">{['A','B','C','D'][i]})</span> {opt}</div>))}</div>)}
          {slot.type === 'truefalse' && <div className="mt-4 text-xs">( ) Doğru &nbsp;&nbsp;&nbsp; ( ) Yanlış</div>}
          {slot.type === 'open' && <div className="mt-4 space-y-4"><div className="border-b border-gray-300 border-dotted h-4"></div><div className="border-b border-gray-300 border-dotted h-4"></div></div>}
        </div>
      )}
    </div>
  );
};
