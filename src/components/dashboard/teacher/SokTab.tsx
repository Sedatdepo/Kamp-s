'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Settings, Zap, 
  Mic, MicOff, BookOpen, History, FolderOpen, FileText, FileSignature, Upload, FileSpreadsheet, Printer, Eye, 
  Archive, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';

// --- MOCK DATA & CONSTANTS (ŞÖK İÇİN) ---
const SOK_GUNDEM_MADDELERI = [
  "Açılış ve yoklama",
  "Bir önceki toplantı tutanaklarının okunması",
  "Öğrencilerin başarı durumlarının değerlendirilmesi",
  "Öğrencilerin davranış durumlarının değerlendirilmesi",
  "Sosyal etkinliklerin planlanması",
  "Dilek ve temenniler",
  "Kapanış"
];

const SOK_VARSAYILAN_KARARLAR = [
  "1. Toplantı Kurul Başkanı tarafından iyi dileklerle açıldı.",
  "2. Bir önceki toplantıda alınan kararların uygulandığı görüldü.",
  "3. Başarısı düşük öğrencilerin velileriyle görüşülmesi kararlaştırıldı.",
  "4. Sınıf içi olumlu davranışların ödüllendirilmesine devam edileceği belirtildi."
];

const SOK_SENARYOLARI = [
  {
    agenda: "Açılış ve yoklama",
    scenarios: [
      { description: "Standart Açılış", content: "Toplantı, Müdür Yardımcısı {mudurYardimcisi} başkanlığında, Sınıf Rehber Öğretmeni {sinifRehberOgretmeni} ve ders öğretmenlerinin katılımıyla açıldı." },
      { description: "Eksiksiz Katılım", content: "Toplantı belirtilen saatte başladı. Yapılan yoklamada tüm ders öğretmenlerinin hazır bulunduğu görüldü." }
    ]
  },
  {
    agenda: "Öğrencilerin başarı durumlarının değerlendirilmesi",
    scenarios: [
      { description: "Genel Başarı İyi", content: "Sınıfın genel başarı durumunun iyi olduğu, derslere katılımın yüksek olduğu branş öğretmenleri tarafından belirtildi." },
      { description: "Desteğe İhtiyaç Var", content: "Bazı öğrencilerin temel eksiklikleri olduğu, bu öğrencilerle birebir ilgilenilmesi gerektiği vurgulandı." }
    ]
  }
];

const SMART_CONTENT_POOL: Record<string, string[]> = {
  "açılış": ["Toplantı iyi dileklerle açıldı.", "Yoklama yapıldı, eksik bulunmadığı görüldü."],
  "başarı": ["Genel not ortalamasının sınıf seviyesine uygun olduğu görüldü.", "Sayısal derslerde başarının artırılması için ek çalışmalar yapılması önerildi."],
  "davranış": ["Sınıf genelinde disiplin sorunu yaşanmadığı belirtildi.", "Derse geç kalma alışkanlığı olan öğrencilerle görüşülmesi kararlaştırıldı."],
  "sosyal": ["Sınıfça müze gezisi düzenlenmesi önerildi.", "Okul içi turnuvalara katılım sağlanması kararlaştırıldı."],
  "default": ["Gündem maddesi üzerinde görüşüldü ve oy birliği ile karara bağlandı.", "İlgili yönetmelik maddeleri okundu."]
};

const VARSAYILAN_BRANSLAR = [
    "Sınıf Rehber Öğretmeni", "Okul Rehber Öğretmeni", "Türk Dili ve Edebiyatı",
    "Din Kültürü ve Ahlak Bilgisi", "Tarih", "Coğrafya", "Matematik", "Fizik",
    "Kimya", "Biyoloji", "Felsefe", "Beden Eğitimi", "Görsel / Müzik",
    "İngilizce", "Müdür Yardımcısı"
];

// --- FORM SCHEMAS & TYPES ---
const formSchema = z.object({
    academicYear: z.string().min(1, "Eğitim yılı gerekli"),
    donem: z.string().min(1, "Dönem gerekli"),
    sinif: z.string().min(1, "Sınıf gerekli"),
    tarih: z.string(),
    saat: z.string(),
    yer: z.string(),
    mudurYardimcisi: z.string(),
    sinifRehberOgretmeni: z.string(),
    katilimcilar: z.array(z.object({
        brans: z.string(),
        adSoyad: z.string()
    })),
    gundemMaddeleri: z.array(z.object({ madde: z.string() })),
    gorusmeler: z.array(z.object({ detay: z.string() })),
    kararlar: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface ArchivedDocument {
    id: string;
    name: string;
    createdAt: string;
    data: FormData;
}

const defaultValues: FormData = {
    academicYear: '2025-2026',
    donem: "1. Dönem",
    sinif: "",
    tarih: new Date().toISOString().split('T')[0],
    saat: "16:00",
    yer: "Öğretmenler Odası",
    mudurYardimcisi: "",
    sinifRehberOgretmeni: "",
    katilimcilar: VARSAYILAN_BRANSLAR.map(b => ({ brans: b, adSoyad: '' })),
    gundemMaddeleri: SOK_GUNDEM_MADDELERI.map(m => ({ madde: m })),
    gorusmeler: SOK_GUNDEM_MADDELERI.map(() => ({ detay: '' })),
    kararlar: SOK_VARSAYILAN_KARARLAR.join('\n'),
};

export default function SokTab() {
    // --- STATE MANAGEMENT ---
    const [uiToasts, setUiToasts] = useState<{id: number, title: string, description: string, variant: string}[]>([]);
    
    // Helper function for toast notifications
    const toast = ({ title, description, variant = "default" }: any) => {
        const id = Date.now();
        setUiToasts(prev => [...prev, { id, title, description, variant }]);
        setTimeout(() => setUiToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);
    const [activeGundemIndex, setActiveGundemIndex] = useState<number | null>(null);
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    
    // Custom Library States
    const [customAgendas, setCustomAgendas] = useState<string[]>([]);
    const [customTemplates, setCustomTemplates] = useState<Record<string, string[]>>({});
    const [isAgendaLibraryOpen, setIsAgendaLibraryOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ type: 'agenda' | 'template', key: string, index?: number, value: string } | null>(null);

    // Preview & Archive States
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const [archives, setArchives] = useState<ArchivedDocument[]>([]);
    const [isArchiveListOpen, setIsArchiveListOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");

    // Voice Dictation
    const [listeningId, setListeningId] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    // Drag & Drop Refs
    const draggedItem = useRef<number | null>(null);
    const draggedOverItem = useRef<number | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const { fields: katilimciFields, append: appendKatilimci, remove: removeKatilimci } = useFieldArray({ control: form.control, name: "katilimcilar" });
    const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({ control: form.control, name: "gundemMaddeleri" });
    const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({ control: form.control, name: "gorusmeler" });

    // --- EFFECTS: LOCAL STORAGE HANDLING ---
    useEffect(() => {
        // Load Temp Data
        const savedTempData = localStorage.getItem("sok_temp_data");
        if (savedTempData) {
            try { form.reset(JSON.parse(savedTempData)); } catch (e) { console.error(e); }
        }
        // Load Archives
        const savedArchives = localStorage.getItem("sok_archives");
        if (savedArchives) {
            try { setArchives(JSON.parse(savedArchives)); } catch (e) { console.error(e); }
        }
        // Load Libraries
        const savedAgendas = localStorage.getItem("sok_custom_agendas");
        if (savedAgendas) setCustomAgendas(JSON.parse(savedAgendas));
        const savedTemplates = localStorage.getItem("sok_custom_templates");
        if (savedTemplates) setCustomTemplates(JSON.parse(savedTemplates));
    }, [form]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            localStorage.setItem("sok_temp_data", JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [form]);

    // --- BUSINESS LOGIC ---

    const formatContent = (content: string) => {
        const formData = form.getValues();
        let text = content
            .replace(/{sinifRehberOgretmeni}/g, formData.sinifRehberOgretmeni || 'Sınıf Rehber Öğretmeni')
            .replace(/{mudurYardimcisi}/g, formData.mudurYardimcisi || 'Müdür Yardımcısı');
        return text;
    };

    // AKILLI OTOMATİK DOLDURMA
    const handleAutoFill = (index: number) => {
        const currentAgenda = form.getValues(`gundemMaddeleri.${index}.madde`).trim();
        
        // 1. Kullanıcı Şablonları (Tam Eşleşme)
        if (customTemplates[currentAgenda] && customTemplates[currentAgenda].length > 0) {
            const myPool = customTemplates[currentAgenda];
            const randomSentence = myPool[Math.floor(Math.random() * myPool.length)];
            form.setValue(`gorusmeler.${index}.detay`, randomSentence, { shouldDirty: true });
            toast({ title: "Şablon Kullanıldı", description: "Kişisel kütüphanenizden dolduruldu.", variant: "success" });
            return;
        }

        // 2. Sistem Havuzu (Kelime Eşleşmesi)
        const currentAgendaLower = currentAgenda.toLowerCase();
        let matchedKey = "default";
        for (const key of Object.keys(SMART_CONTENT_POOL)) {
            if (currentAgendaLower.includes(key)) {
                matchedKey = key;
                break;
            }
        }
        const pool = SMART_CONTENT_POOL[matchedKey];
        const randomSentence = pool[Math.floor(Math.random() * pool.length)];
        
        form.setValue(`gorusmeler.${index}.detay`, randomSentence, { shouldDirty: true });
        toast({ title: "Otomatik Dolduruldu", description: "Varsayılan içerik eklendi." });
    };

    // KÜTÜPHANE YÖNETİMİ
    const saveAgendaToLibrary = (index: number) => {
        const agendaTitle = form.getValues(`gundemMaddeleri.${index}.madde`).trim();
        const agendaContent = form.getValues(`gorusmeler.${index}.detay`).trim();

        if (!agendaTitle) return;

        let isTitleNew = false;
        let isContentNew = false;

        // Başlığı Kaydet
        if (![...SOK_GUNDEM_MADDELERI, ...customAgendas].some(a => a.toLowerCase() === agendaTitle.toLowerCase())) {
            const newAgendas = [...customAgendas, agendaTitle];
            setCustomAgendas(newAgendas);
            localStorage.setItem("sok_custom_agendas", JSON.stringify(newAgendas));
            isTitleNew = true;
        }

        // İçeriği Kaydet
        if (agendaContent.length > 5) {
            const currentTemplates = customTemplates[agendaTitle] || [];
            if (!currentTemplates.includes(agendaContent)) {
                const updatedTemplates = { ...customTemplates, [agendaTitle]: [...currentTemplates, agendaContent] };
                setCustomTemplates(updatedTemplates);
                localStorage.setItem("sok_custom_templates", JSON.stringify(updatedTemplates));
                isContentNew = true;
            }
        }

        if (isTitleNew || isContentNew) {
            toast({ title: "Kaydedildi", description: "Kütüphaneye eklendi.", variant: "success" });
        } else {
            toast({ title: "Mevcut", description: "Bu içerik zaten kütüphanede var." });
        }
    };

    // DELETE & UPDATE HANDLERS FOR LIBRARY
    const handleDeleteAgenda = (key: string) => {
        if (!confirm("Başlığı ve tüm şablonlarını silmek istiyor musunuz?")) return;
        const newAgendas = customAgendas.filter(a => a !== key);
        setCustomAgendas(newAgendas);
        localStorage.setItem("sok_custom_agendas", JSON.stringify(newAgendas));
        
        const newTemplates = { ...customTemplates };
        delete newTemplates[key];
        setCustomTemplates(newTemplates);
        localStorage.setItem("sok_custom_templates", JSON.stringify(newTemplates));
        toast({ title: "Silindi", description: "Başlık silindi." });
    };

    const handleUpdateAgenda = (oldKey: string) => {
        if (!editingItem || !editingItem.value.trim()) return;
        const newKey = editingItem.value.trim();
        if (oldKey === newKey) { setEditingItem(null); return; }

        const newAgendas = customAgendas.map(a => a === oldKey ? newKey : a);
        setCustomAgendas(newAgendas);
        localStorage.setItem("sok_custom_agendas", JSON.stringify(newAgendas));

        if (customTemplates[oldKey]) {
            const newTemplates = { ...customTemplates };
            newTemplates[newKey] = newTemplates[oldKey];
            delete newTemplates[oldKey];
            setCustomTemplates(newTemplates);
            localStorage.setItem("sok_custom_templates", JSON.stringify(newTemplates));
        }
        setEditingItem(null);
        toast({ title: "Güncellendi", variant: "success" });
    };

    const handleDeleteTemplate = (key: string, index: number) => {
        if (!confirm("Şablonu silmek istiyor musunuz?")) return;
        const updatedTemplates = {
            ...customTemplates,
            [key]: customTemplates[key].filter((_, i) => i !== index)
        };
        setCustomTemplates(updatedTemplates);
        localStorage.setItem("sok_custom_templates", JSON.stringify(updatedTemplates));
        toast({ title: "Silindi", description: "Şablon silindi." });
    };

    const handleUpdateTemplate = (key: string, index: number) => {
        if (!editingItem || !editingItem.value.trim()) return;
        const updatedTemplates = {
            ...customTemplates,
            [key]: customTemplates[key].map((t, i) => i === index ? editingItem.value.trim() : t)
        };
        setCustomTemplates(updatedTemplates);
        localStorage.setItem("sok_custom_templates", JSON.stringify(updatedTemplates));
        setEditingItem(null);
        toast({ title: "Güncellendi", variant: "success" });
    };

    // DOCUMENT GENERATION
    const generateDocumentHTML = (data: FormData) => {
        const formattedDate = new Date(data.tarih).toLocaleDateString('tr-TR');
        const gundemHtml = data.gundemMaddeleri.map((item, index) => `<p style="margin: 0; padding: 2px 0;">${index + 1}. ${item.madde}</p>`).join('');
        const gorusmelerHtml = data.gundemMaddeleri.map((item, index) => `
            <div style="margin-top: 15px;">
                <p style="margin:0; font-weight: bold;">${index + 1}. ${item.madde}</p>
                <div style="text-indent: 0; margin-top: 5px;">${(data.gorusmeler[index]?.detay || 'Görüşülmedi.').replace(/\n/g, '<br/>')}</div>
            </div>
        `).join('');
        const kararlarHtml = data.kararlar.split('\n').map(karar => `<p style="margin: 0; padding: 2px 0;">${karar}</p>`).join('');
        
        return `
          <!DOCTYPE html><html><head><meta charset="UTF-8"><title>ŞÖK Tutanağı</title>
          <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; } .container { width: 90%; margin: auto; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 5px; }</style>
          </head><body><div class="container">
              <h3 style="text-align: center;">T.C.<br/>${data.academicYear} EĞİTİM-ÖĞRETİM YILI ${data.sinif} ŞUBESİ<br/>${data.donem.toUpperCase()} ŞUBE ÖĞRETMENLER KURULU TOPLANTI TUTANAĞI</h3>
              <br/>
              <p><strong>Toplantı Tarihi:</strong> ${formattedDate} &nbsp;&nbsp; <strong>Saat:</strong> ${data.saat} &nbsp;&nbsp; <strong>Yer:</strong> ${data.yer}</p>
              <br/>
              <h4 style="text-decoration: underline;">GÜNDEM MADDELERİ</h4>${gundemHtml}
              <h4 style="text-decoration: underline; margin-top: 20px;">GÜNDEMİN GÖRÜŞÜLMESİ</h4>${gorusmelerHtml}
              <h4 style="text-decoration: underline; margin-top: 20px;">ALINAN KARARLAR</h4>${kararlarHtml}
              <br/><br/>
              <table style="page-break-inside: avoid;">
                <tr style="background-color: #f0f0f0;"><th colspan="3">TOPLANTIYA KATILANLAR</th></tr>
                <tr><th>Sıra</th><th>Branş / Adı Soyadı</th><th>İmza</th></tr>
                ${data.katilimcilar.filter(k => k.brans).map((k, i) => `<tr><td style="text-align:center; width:50px;">${i + 1}</td><td><b>${k.brans}</b><br/>${k.adSoyad}</td><td></td></tr>`).join('')}
              </table>
              <br/><br/>
              <div style="text-align: center; margin-left: 50%;">
                  <p>${data.mudurYardimcisi}<br/>Müdür Yardımcısı</p>
                  <br/><br/>
                  <p>UYGUNDUR<br/>${formattedDate}<br/>Okul Müdürü</p>
              </div>
          </div></body></html>
        `;
    };

    const handleExport = () => {
        const content = generateDocumentHTML(form.getValues());
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SOK_Tutanagi_${form.getValues('sinif')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "İndiriliyor", description: "Word dosyası oluşturuldu.", variant: "success" });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(previewHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        } else { alert("Pop-up engelleyiciyi kapatın."); }
    };

    // ARCHIVE HANDLERS
    const handleSaveArchive = () => {
        const newDoc: ArchivedDocument = {
            id: Date.now().toString(),
            name: saveNameInput || `ŞÖK - ${form.getValues('sinif')}`,
            createdAt: new Date().toLocaleDateString('tr-TR'),
            data: form.getValues()
        };
        const updated = [newDoc, ...archives];
        setArchives(updated);
        localStorage.setItem("sok_archives", JSON.stringify(updated));
        setIsSaveDialogOpen(false);
        toast({ title: "Arşivlendi", description: "Tutanak saklandı.", variant: "success" });
    };

    // VOICE
    const toggleListening = (index: number, fieldType: 'madde' | 'detay') => {
        const currentId = `${fieldType}-${index}`;
        if (listeningId === currentId) { recognitionRef.current?.stop(); setListeningId(null); return; }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Tarayıcınız desteklemiyor."); return; }

        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR';
        recognition.onstart = () => setListeningId(currentId);
        recognition.onresult = (e: any) => {
            const txt = e.results[0][0].transcript;
            const path = fieldType === 'madde' ? `gundemMaddeleri.${index}.madde` : `gorusmeler.${index}.detay`;
            // @ts-ignore
            const current = form.getValues(path) || "";
            // @ts-ignore
            form.setValue(path, current ? `${current} ${txt}` : txt, { shouldDirty: true });
        };
        recognition.onend = () => setListeningId(null);
        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSortEnd = () => {
        if(draggedItem.current !== null && draggedOverItem.current !== null) {
             moveGundem(draggedItem.current, draggedOverItem.current);
             moveGorusme(draggedItem.current, draggedOverItem.current);
        }
        draggedItem.current = null; draggedOverItem.current = null;
    };

    // Helper for Scenarios
    const getScenarios = () => {
        if (activeGundemIndex === null) return [];
        const currentAgenda = form.getValues(`gundemMaddeleri.${activeGundemIndex}.madde`).trim();
        
        const systemScenarios = SOK_SENARYOLARI.find(s => s.agenda.toLowerCase() === currentAgenda.toLowerCase())?.scenarios || [];
        const userTemplates = customTemplates[currentAgenda] || [];
        
        return [
            ...userTemplates.map((c, i) => ({ description: `Özel Şablon ${i + 1}`, content: c })),
            ...systemScenarios.map(s => ({ description: s.description, content: formatContent(s.content) }))
        ];
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 relative font-sans">
            
            {/* TOASTS */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {uiToasts.map(t => (
                    <div key={t.id} className={`p-4 rounded-lg shadow-lg text-sm flex items-center gap-3 min-w-[300px] border bg-white ${t.variant === 'success' ? 'border-green-200 text-green-800' : 'border-slate-200'}`}>
                        {t.variant === 'success' ? <CheckCircle className="h-5 w-5"/> : <AlertCircle className="h-5 w-5"/>}
                        <div><div className="font-bold">{t.title}</div><div className="text-xs opacity-80">{t.description}</div></div>
                    </div>
                ))}
            </div>

            {/* HEADER */}
            <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-700"><Users className="h-6 w-6" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">ŞÖK Tutanak Modülü</h1>
                        <p className="text-xs text-slate-500">Şube Öğretmenler Kurulu • Otomatik Kayıt</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center rounded-md border border-slate-300 bg-white mr-2">
                        <Button onClick={() => setIsSaveDialogOpen(true)} variant="ghost" className="rounded-r-none border-r"><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                        <Button onClick={() => setIsArchiveListOpen(true)} variant="ghost" className="rounded-l-none"><Archive className="mr-2 h-4 w-4"/> Arşiv ({archives.length})</Button>
                    </div>
                    <div className="flex items-center rounded-md border border-slate-300 bg-white">
                        <Button onClick={() => { setPreviewHtml(generateDocumentHTML(form.getValues())); setIsPreviewOpen(true); }} variant="ghost" className="rounded-r-none border-r"><Eye className="mr-2 h-4 w-4"/> Önizle</Button>
                        <Button onClick={() => handleExport(form.getValues())} className="rounded-l-none bg-orange-600 hover:bg-orange-700 text-white"><FileDown className="mr-2 h-4 w-4"/> Word</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 space-y-8">
                <Form {...form}>
                    <form className="space-y-8">
                        {/* 1. TOPLANTI KÜNYESİ */}
                        <Card>
                            <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="academicYear" render={({ field }: any) => (<FormItem><FormLabel>Eğitim Yılı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="donem" render={({ field }: any) => (
                                    <FormItem>
                                        <FormLabel>Dönem</FormLabel>
                                        <FormControl>
                                            <select 
                                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                                {...field}
                                            >
                                                <option value="1. Dönem">1. Dönem</option>
                                                <option value="2. Dönem">2. Dönem</option>
                                            </select>
                                        </FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="sinif" render={({ field }: any) => (<FormItem><FormLabel>Sınıf</FormLabel><FormControl><Input {...field} placeholder="Örn: 9-A" /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="tarih" render={({ field }: any) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="saat" render={({ field }: any) => (<FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="yer" render={({ field }: any) => (<FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="sinifRehberOgretmeni" render={({ field }: any) => (<FormItem><FormLabel>Sınıf Rehber Öğretmeni</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="mudurYardimcisi" render={({ field }: any) => (<FormItem><FormLabel>Müdür Yardımcısı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>

                        {/* 2. KATILIMCILAR */}
                        <Card>
                            <CardHeader><CardTitle>Toplantı Katılımcıları (Öğretmenler)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {katilimciFields.map((item, index) => (
                                        <div key={item.id} className="flex gap-2 items-end border p-3 rounded bg-slate-50">
                                            <div className="w-full grid grid-cols-2 gap-2">
                                                <FormField control={form.control} name={`katilimcilar.${index}.brans`} render={({ field }: any) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Branş</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>)} />
                                                <FormField control={form.control} name={`katilimcilar.${index}.adSoyad`} render={({ field }: any) => (<FormItem><FormLabel className="text-xs text-muted-foreground">Ad Soyad</FormLabel><FormControl><Input className="h-8 text-sm" {...field} /></FormControl></FormItem>)} />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => removeKatilimci(index)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="secondary" className="mt-4 w-full border-dashed border-2" onClick={() => appendKatilimci({ brans: '', adSoyad: '' })}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Öğretmen Ekle</Button>
                            </CardContent>
                        </Card>
                        
                         {/* GÜNDEM */}
                         <Card>
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle>Gündem ve Görüşmeler</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAgendaLibraryOpen(true)}><Library className="mr-2 h-4 w-4"/> Kütüphane</Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {gundemFields.map((item, index) => (
                                     <div key={item.id} className={`space-y-4 border p-4 rounded-lg bg-white transition-all ${draggedItem.current === index ? 'opacity-50 ring-2 ring-orange-200' : ''}`} draggable onDragStart={() => (draggedItem.current = index)} onDragEnter={() => (draggedOverItem.current = index)} onDragEnd={handleSortEnd} onDragOver={(e) => e.preventDefault()}>
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="cursor-grab text-slate-300" />
                                            <Input {...form.register(`gundemMaddeleri.${index}.madde`)} className="font-semibold text-lg border-transparent focus:border-slate-300 px-0 shadow-none" placeholder="Gündem Maddesi..." />
                                            <Button type="button" variant="ghost" size="icon" className="text-red-400" onClick={() => { removeGundem(index); removeGorusme(index); }}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                        <div className="pl-8 relative">
                                            <Textarea {...form.register(`gorusmeler.${index}.detay`)} className="min-h-[100px] pr-8" placeholder="Görüşme detayları..." />
                                            <div className="absolute bottom-2 right-2 flex gap-1">
                                                <Button type="button" variant="ghost" size="icon" className={`h-6 w-6 ${listeningId === `detay-${index}` ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} onClick={() => toggleListening(index, 'detay')}><Mic className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2 pl-8">
                                            <Button type="button" variant="outline" size="sm" onClick={() => { setActiveGundemIndex(index); setIsScenarioModalOpen(true); }}><BookOpen className="mr-2 h-3 w-3"/> Hazır Şablon</Button>
                                            <Button type="button" variant="secondary" size="sm" onClick={() => handleAutoFill(index)}><Zap className="mr-2 h-3 w-3"/> Otomatik Doldur</Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full py-4 border-dashed" onClick={() => { appendGundem({ madde: '' }); appendGorusme({ detay: '' }); }}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Madde Ekle</Button>
                            </CardContent>
                        </Card>


                        {/* 4. KARARLAR */}
                        <Card>
                            <CardHeader className="flex flex-row justify-between">
                                <CardTitle>Alınan Kararlar</CardTitle>
                                <Button type="button" variant="secondary" size="sm" onClick={() => { setIsGeneratingDecisions(true); setTimeout(() => { form.setValue('kararlar', SOK_VARSAYILAN_KARARLAR.join('\n')); setIsGeneratingDecisions(false); }, 500); }} disabled={isGeneratingDecisions}>{isGeneratingDecisions ? <Zap className="animate-spin mr-2 h-3 w-3"/> : <Zap className="mr-2 h-3 w-3"/>} Örnek Kararlar</Button>
                            </CardHeader>
                            <CardContent>
                                <Textarea {...form.register('kararlar')} rows={6} className="font-mono text-sm" />
                            </CardContent>
                        </Card>

                    </form>
                </Form>
            </main>
            
            {/* --- MODALLAR --- */}

            {/* Arşiv Listesi */}
            {isArchiveListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold">Arşiv</h3><button onClick={() => setIsArchiveListOpen(false)}><X className="h-4 w-4"/></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                            {archives.length === 0 ? <p className="text-center text-slate-400">Arşiv boş.</p> : archives.map(doc => (
                                <div key={doc.id} className="bg-white p-3 mb-2 rounded border flex justify-between items-center">
                                    <div><p className="font-bold">{doc.name}</p><p className="text-xs text-slate-500">{doc.createdAt}</p></div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => { if(confirm("Yüklensin mi?")) { form.reset(doc.data); setIsArchiveListOpen(false); toast({title:"Yüklendi", variant:"success"}); } }}>Yükle</Button>
                                        <Button size="sm" variant="destructive" onClick={() => { if(confirm("Sil?")) { setArchives(prev => { const n = prev.filter(a => a.id !== doc.id); localStorage.setItem("sok_archives", JSON.stringify(n)); return n; }); } }}>Sil</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Önizleme */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-slate-100 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="p-4 bg-white border-b flex justify-between items-center">
                           <h3>Önizleme</h3>
                           <div className="flex gap-2">
                               <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Yazdır</Button>
                               <button onClick={() => setIsPreviewOpen(false)}><X className="h-5 w-5"/></button>
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8"><div className="bg-white shadow-lg mx-auto p-12 w-[21cm] min-h-[29.7cm]" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
                    </div>
                </div>
            )}

            {/* Kaydet */}
            {isSaveDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                     <div className="bg-white rounded-lg w-full max-w-sm p-4">
                        <h3 className="font-bold mb-4">Arşive Kaydet</h3>
                        <Input value={saveNameInput} onChange={(e:any) => setSaveNameInput(e.target.value)} className="mb-4" />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>İptal</Button>
                            <Button onClick={handleSaveArchive}>Kaydet</Button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
}
