'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Settings, Zap, 
  Mic, MicOff, BookOpen, History, FolderOpen, FileText, FileSignature, Upload, FileSpreadsheet, Printer, Eye, 
  Archive, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check, Wand2, ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { generateMeetingAgendaItem } from '@/ai/flows/generate-meeting-agenda-item-flow';
import { Loader2 } from 'lucide-react';


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
    const [isGenerating, setIsGenerating] = useState<number | null>(null);


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

    const handleAutoFill = async (index: number) => {
        const agendaTitle = form.getValues(`gundemMaddeleri.${index}.madde`).trim();
        if (!agendaTitle) {
          toast({ title: 'Hata', description: 'Lütfen önce gündem maddesi başlığını girin.', variant: 'destructive' });
          return;
        }
        setIsGenerating(index);
        try {
          const response = await generateMeetingAgendaItem({
            meetingType: 'ŞÖK',
            agendaTitle,
            classInfo: form.getValues('sinif'),
            teacherInfo: form.getValues('sinifRehberOgretmeni'),
          });
          if (response.generatedText) {
            form.setValue(`gorusmeler.${index}.detay`, response.generatedText, { shouldDirty: true });
            toast({ title: 'Metin Oluşturuldu', description: `'${agendaTitle}' maddesi için içerik başarıyla oluşturuldu.`, variant: 'success' });
          }
        } catch (error) {
          console.error("AI Error:", error);
          toast({ title: 'Yapay Zeka Hatası', description: 'İçerik oluşturulurken bir hata oluştu.', variant: 'destructive' });
        } finally {
          setIsGenerating(null);
        }
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
    const addAgendaFromLibrary = (text: string) => {
        appendGundem({ madde: text });
        appendGorusme({ detay: '' });
        setIsAgendaLibraryOpen(false);
        toast({ title: "Eklendi", description: "Madde listeye eklendi." });
    };

    // ARCHIVE HANDLERS
    const openSaveDialog = () => {
        const vals = form.getValues();
        setSaveNameInput(`${vals.academicYear} - ${vals.sinif} Toplantısı`);
        setIsSaveDialogOpen(true);
    };

    const handleSaveToArchive = () => {
        if (!saveNameInput.trim()) return;

        const newDoc: ArchivedDocument = {
            id: Date.now().toString(),
            name: saveNameInput,
            createdAt: new Date().toLocaleDateString('tr-TR'),
            data: form.getValues()
        };

        const updatedArchives = [newDoc, ...archives];
        setArchives(updatedArchives);
        localStorage.setItem("sok_archives", JSON.stringify(updatedArchives));
        
        setIsSaveDialogOpen(false);
        toast({ title: "Arşivlendi", description: "Tutanak başarıyla kaydedildi.", variant: "success" });
    };

    const handleLoadFromArchive = (doc: ArchivedDocument) => {
        if (confirm(`"${doc.name}" adlı kayıt yüklenecek. Mevcut verileriniz değişecek. Onaylıyor musunuz?`)) {
            form.reset(doc.data);
            setIsArchiveListOpen(false);
            toast({ title: "Yüklendi", description: "Arşivden başarıyla yüklendi.", variant: "success" });
        }
    };

    const handleDeleteFromArchive = (id: string) => {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            const updatedArchives = archives.filter(doc => doc.id !== id);
            setArchives(updatedArchives);
            localStorage.setItem("sok_archives", JSON.stringify(updatedArchives));
            toast({ title: "Silindi", description: "Kayıt arşivden silindi." });
        }
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

    const generateDecisionsWithAI = async () => {
        setIsGeneratingDecisions(true);
        setTimeout(() => {
            form.setValue('kararlar', SOK_VARSAYILAN_KARARLAR.join('\n'), { shouldDirty: true });
            setIsGeneratingDecisions(false);
            toast({ title: "Tamamlandı", description: "Kararlar listeye eklendi.", variant: "success" });
        }, 500);
    };

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
        downloadDoc(content, `SOK_Tutanagi_${form.getValues('sinif')}.doc`);
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
    
    const handlePreview = () => {
        const content = generateDocumentHTML(form.getValues());
        setPreviewHtml(content);
        setIsPreviewOpen(true);
    };

    const downloadDoc = (content: string, filename: string) => {
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <Button onClick={openSaveDialog} variant="ghost" className="rounded-r-none border-r"><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                        <Button onClick={() => setIsArchiveListOpen(true)} variant="ghost" className="rounded-l-none"><Archive className="mr-2 h-4 w-4"/> Arşiv ({archives.length})</Button>
                    </div>
                    <div className="flex items-center rounded-md border border-slate-300 bg-white">
                        <Button onClick={handlePreview} variant="ghost" className="rounded-r-none border-r"><Eye className="mr-2 h-4 w-4"/> Önizle</Button>
                        <Button onClick={handleExport} className="rounded-l-none bg-orange-600 hover:bg-orange-700 text-white"><FileDown className="mr-2 h-4 w-4"/> Word</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-6 space-y-8">
                <Form {...form}>
                    <form className="space-y-8">
                        <Card>
                            <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="academicYear" render={({ field }: any) => (<FormItem><FormLabel>Eğitim Yılı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="donem" render={({ field }: any) => (<FormItem><FormLabel>Dönem</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="sinif" render={({ field }: any) => (<FormItem><FormLabel>Sınıf</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="tarih" render={({ field }: any) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="saat" render={({ field }: any) => (<FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="yer" render={({ field }: any) => (<FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="sinifRehberOgretmeni" render={({ field }: any) => (<FormItem><FormLabel>Sınıf Rehber Öğretmeni</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="mudurYardimcisi" render={({ field }: any) => (<FormItem><FormLabel>Müdür Yardımcısı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Gündem ve Görüşmeler</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                {gundemFields.map((item, index) => (
                                     <div key={item.id} className={`space-y-4 border p-4 rounded-lg bg-white transition-all ${draggedItem.current === index ? 'opacity-50' : ''}`} draggable onDragStart={() => (draggedItem.current = index)} onDragEnter={() => (draggedOverItem.current = index)} onDragEnd={handleSortEnd} onDragOver={(e) => e.preventDefault()}>
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="cursor-grab text-slate-300" />
                                            <Input {...form.register(`gundemMaddeleri.${index}.madde`)} className="font-semibold" />
                                            <Button type="button" variant="ghost" size="icon" className="text-red-400" onClick={() => { removeGundem(index); removeGorusme(index); }}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                        <div className="pl-8 relative">
                                            <Textarea {...form.register(`gorusmeler.${index}.detay`)} className="min-h-[100px] pr-8" placeholder="Görüşme detayları..." />
                                        </div>
                                        <div className="flex justify-end gap-2 pl-8">
                                            <Button type="button" variant="secondary" size="sm" onClick={() => handleAutoFill(index)} disabled={isGenerating === index}>
                                                {isGenerating === index ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Wand2 className="mr-2 h-3 w-3"/>}
                                                Yapay Zeka ile Doldur
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full" onClick={() => { appendGundem({ madde: '' }); appendGorusme({ detay: '' }); }}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Madde Ekle</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row justify-between">
                                <CardTitle>Alınan Kararlar</CardTitle>
                                <Button type="button" variant="secondary" size="sm" onClick={generateDecisionsWithAI} disabled={isGeneratingDecisions}>{isGeneratingDecisions ? <Zap className="animate-spin mr-2 h-3 w-3"/> : <ListChecks className="mr-2 h-3 w-3"/>} Örnek Kararlar</Button>
                            </CardHeader>
                            <CardContent>
                                <Textarea {...form.register('kararlar')} rows={6} className="font-mono text-sm" />
                            </CardContent>
                        </Card>
                    </form>
                </Form>
            </main>
             {/* PREVIEW DIALOG */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-[200] bg-black/70 p-8 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-full max-w-4xl h-full flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Önizleme</h3>
                            <div>
                                <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Yazdır</Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)}><X/></Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-200">
                           <div className="bg-white shadow-lg p-12 mx-auto" style={{width: '21cm', minHeight: '29.7cm'}} dangerouslySetInnerHTML={{ __html: previewHtml }}></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

