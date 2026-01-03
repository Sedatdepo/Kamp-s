
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, 
  Sparkles, Mic, MicOff, ListChecks, BookOpen, History, FolderOpen, 
  FileText, FileSignature, Upload, Zap, X, FileSpreadsheet, Printer, Eye, Archive, Download, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check
} from 'lucide-react';

// --- MOCK DATA & CONSTANTS ---
const VELI_TOPLANTISI_GUNDEM = [
  "Açılış ve yoklama",
  "Öğrenci başarı durumlarının görüşülmesi",
  "Okul kuralları ve disiplin yönetmeliği",
  "Verimli ders çalışma yöntemleri",
  "Dilek ve temenniler",
  "Kapanış"
];

const VELI_TOPLANTISI_KARARLAR = [
  "1. Toplantı iyi dileklerle açıldı.",
  "2. Öğrencilerin genel başarı durumları hakkında velilere bilgi verildi.",
  "3. Okul giriş-çıkış saatlerine riayet edilmesi kararlaştırıldı.",
  "4. Velilerin e-okul sistemini düzenli takip etmeleri gerektiği vurgulandı."
];

// Varsayılan Senaryolar
const VELI_TOPLANTISI_SENARYOLARI = [
  {
    agenda: "Açılış ve yoklama",
    scenarios: [
      { description: "Standart Açılış", content: "Toplantı, Sınıf Rehber Öğretmeni {ogretmen} tarafından iyi dileklerle açıldı. Yapılan yoklamada {katilimci_sayisi} velinin katıldığı görüldü." },
      { description: "Yüksek Katılımlı", content: "Toplantı {ogretmen} tarafından açıldı. Sınıf velilerinin büyük çoğunluğunun katılım gösterdiği görüldü ve teşekkür edildi." }
    ]
  },
  {
    agenda: "Kapanış",
    scenarios: [
      { description: "Standart Kapanış", content: "Toplantı iyi dilek ve temennilerle sonlandırıldı." },
      { description: "Bireysel Görüşmeli", content: "Genel toplantı sonlandırılarak velilerle bireysel görüşmelere geçildi." }
    ]
  }
];

// AKILLI OTOMATİK DOLDURMA İÇİN KELİME HAVUZU
const SMART_CONTENT_POOL: Record<string, string[]> = {
  "açılış": [
    "Toplantı iyi dilek ve temennilerle açıldı.",
    "Velilere katılımlarından dolayı teşekkür edilerek toplantı başlatıldı.",
    "Gündem maddeleri velilere okunarak toplantıya geçildi."
  ],
  "yoklama": [
    "İmza sirküsü dolaştırılarak yoklama alındı.",
    "Katılan velilerin imzaları alındı, gelmeyenlerin notu alındı."
  ],
  "başarı": [
    "Genel başarı durumunun iyi olduğu, ancak kitap okuma alışkanlığının artırılması gerektiği belirtildi.",
    "Öğrencilerin deneme sınavı sonuçları bireysel olarak velilerle paylaşıldı.",
    "Ders içi katılımın artırılması için evde tekrar yapılmasının önemi vurgulandı."
  ],
  "disiplin": [
    "Okul kılık kıyafet yönetmeliğine uyulması konusunda hassasiyet beklendiği iletildi.",
    "Devamsızlık konusunda velilerin daha dikkatli olması, özürsüz devamsızlığın başarısızlığı tetiklediği hatırlatıldı.",
    "Sınıf içi kurallar hatırlatıldı ve velilerden destek istendi."
  ],
  "ders": [
    "Verimli ders çalışma yöntemleri hakkında broşür dağıtıldı.",
    "Günlük planlı çalışmanın başarıyı artıracağı örneklerle anlatıldı.",
    "Teknoloji bağımlılığının ders çalışmayı engellememesi için tedbirler konuşuldu."
  ],
  "dilek": [
    "Veliler söz alarak okulun temizliğinden memnun olduklarını belirttiler.",
    "Bir veli, hafta sonu kurslarının saatlerinin düzenlenmesini talep etti.",
    "Veliler öğretmenlere emekleri için teşekkür ettiler."
  ],
  "kapanış": [
    "Toplantı iyi dileklerle sona erdi.",
    "Bir sonraki toplantıda görüşmek üzere toplantı kapatıldı.",
    "Bireysel görüşmelere geçilerek genel oturum sonlandırıldı."
  ],
  "default": [
    "Bu gündem maddesi üzerinde karşılıklı fikir alışverişinde bulunuldu.",
    "Konuyla ilgili velilerin görüşleri dinlendi ve notlar alındı.",
    "İlgili yönetmelik maddeleri velilere açıklandı."
  ]
};

// --- UI COMPONENTS ---
const Button = ({ children, variant = "primary", size = "default", className = "", ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-slate-200 hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
  };
  const sizes: any = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    icon: "h-10 w-10",
  };
  return <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>;
};

const Input = React.forwardRef(({ className = "", ...props }: any, ref) => (
  <input ref={ref} className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));
Input.displayName = "Input";

const Textarea = React.forwardRef(({ className = "", ...props }: any, ref) => (
  <textarea ref={ref} className={`flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
));
Textarea.displayName = "Textarea";

const Card = ({ className = "", children }: any) => <div className={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>{children}</div>;
const CardHeader = ({ className = "", children }: any) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
const CardTitle = ({ className = "", children }: any) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardContent = ({ className = "", children }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>;
const Label = ({ children, className = "" }: any) => <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;

// --- FORM SCHEMAS & TYPES ---
const formSchema = z.object({
  academicYear: z.string().min(1, "Eğitim yılı gerekli"),
  donem: z.string().min(1, "Dönem gerekli"),
  sinif: z.string().min(1, "Sınıf gerekli"),
  tarih: z.string(),
  saat: z.string(),
  yer: z.string(),
  toplantiNo: z.string(),
  sinifRehberOgretmeni: z.string(),
  katilimcilar: z.array(z.object({ adSoyad: z.string() })),
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
  sinif: "10/A",
  tarih: new Date().toISOString().split('T')[0],
  saat: "10:00",
  yer: "Sınıf",
  toplantiNo: '1',
  sinifRehberOgretmeni: "Ahmet Yılmaz",
  katilimcilar: [{ adSoyad: "Mehmet Demir" }, { adSoyad: "Ayşe Kaya" }],
  gundemMaddeleri: VELI_TOPLANTISI_GUNDEM.map(m => ({ madde: m })),
  gorusmeler: VELI_TOPLANTISI_GUNDEM.map(() => ({ detay: '' })),
  kararlar: VELI_TOPLANTISI_KARARLAR.join('\n'),
};

export default function VeliToplantisiTab() {
  
  // TOAST NOTIFICATION SYSTEM
  const [uiToasts, setUiToasts] = useState<{id: number, title: string, description: string, variant: string}[]>([]);

  const toast = ({ title, description, variant = "default" }: any) => {
    const id = Date.now();
    setUiToasts(prev => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setUiToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  // State
  const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);
  const [activeGundemIndex, setActiveGundemIndex] = useState<number | null>(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [bulkImportData, setBulkImportData] = useState("");
  
  // CUSTOM AGENDA LIBRARY & TEMPLATES STATE
  const [customAgendas, setCustomAgendas] = useState<string[]>([]);
  const [customTemplates, setCustomTemplates] = useState<Record<string, string[]>>({});
  
  const [isAgendaLibraryOpen, setIsAgendaLibraryOpen] = useState(false);

  // EDIT STATE FOR LIBRARY
  const [editingItem, setEditingItem] = useState<{ type: 'agenda' | 'template', key: string, index?: number, value: string } | null>(null);

  // PREVIEW STATES
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  // ARCHIVE STATES
  const [archives, setArchives] = useState<ArchivedDocument[]>([]);
  const [isArchiveListOpen, setIsArchiveListOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");

  // SES KAYIT STATE & REF
  const [listeningId, setListeningId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const draggedItem = useRef<number | null>(null);
  const draggedOverItem = useRef<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  const { fields: katilimciFields, append: appendKatilimci, remove: removeKatilimci } = useFieldArray({ control: form.control, name: "katilimcilar" });
  const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({ control: form.control, name: "gundemMaddeleri" });
  const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({ control: form.control, name: "gorusmeler" });

  useEffect(() => {
    // 1. Otomatik kaydedilen geçici veriyi yükle
    const savedTempData = localStorage.getItem("veli_toplanti_temp_data");
    if (savedTempData) {
      try {
        const parsedData = JSON.parse(savedTempData);
        form.reset(parsedData);
      } catch (e) { console.error("Geçici veri yüklenemedi", e); }
    }

    // 2. Kalıcı Arşiv listesini yükle
    const savedArchives = localStorage.getItem("veli_toplanti_archives");
    if (savedArchives) {
      try {
        setArchives(JSON.parse(savedArchives));
      } catch (e) { console.error("Arşiv yüklenemedi", e); }
    }

    // 3. Özel Gündem Başlıkları
    const savedCustomAgendas = localStorage.getItem("veli_toplanti_custom_agendas");
    if (savedCustomAgendas) {
      try {
        setCustomAgendas(JSON.parse(savedCustomAgendas));
      } catch (e) { console.error("Kütüphane yüklenemedi", e); }
    }

    // 4. Özel İçerik Şablonları
    const savedCustomTemplates = localStorage.getItem("veli_toplanti_custom_templates");
    if (savedCustomTemplates) {
        try {
            setCustomTemplates(JSON.parse(savedCustomTemplates));
        } catch (e) { console.error("Şablonlar yüklenemedi", e); }
    }
  }, []);

  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem("veli_toplanti_temp_data", JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // --- LIBRARY & TEMPLATE HANDLERS (EDIT/DELETE ADDED) ---

  const saveAgendaToLibrary = (index: number) => {
    const agendaTitle = form.getValues(`gundemMaddeleri.${index}.madde`);
    const agendaContent = form.getValues(`gorusmeler.${index}.detay`);

    if (!agendaTitle || !agendaTitle.trim()) {
      toast({ title: "Hata", description: "Başlık olmadan kayıt yapılamaz.", variant: "destructive" });
      return;
    }
    
    const cleanTitle = agendaTitle.trim();
    let isTitleNew = false;
    let isContentNew = false;

    // 1. BAŞLIĞI KAYDET
    const isTitleDuplicate = [...VELI_TOPLANTISI_GUNDEM, ...customAgendas].some(
        a => a.toLowerCase() === cleanTitle.toLowerCase()
    );

    if (!isTitleDuplicate) {
        const newAgendas = [...customAgendas, cleanTitle];
        setCustomAgendas(newAgendas);
        localStorage.setItem("veli_toplanti_custom_agendas", JSON.stringify(newAgendas));
        isTitleNew = true;
    }

    // 2. İÇERİĞİ ŞABLON OLARAK KAYDET
    if (agendaContent && agendaContent.trim().length > 5) {
        const cleanContent = agendaContent.trim();
        const currentTemplates = customTemplates[cleanTitle] || [];
        
        if (!currentTemplates.includes(cleanContent)) {
            const updatedTemplates = {
                ...customTemplates,
                [cleanTitle]: [...currentTemplates, cleanContent]
            };
            setCustomTemplates(updatedTemplates);
            localStorage.setItem("veli_toplanti_custom_templates", JSON.stringify(updatedTemplates));
            isContentNew = true;
        }
    }

    if (isTitleNew || isContentNew) {
        toast({ title: "Kaydedildi", description: isContentNew ? "Başlık ve içerik şablonu kaydedildi." : "Başlık kütüphaneye eklendi.", variant: "success" });
    } else {
        toast({ title: "Zaten Kayıtlı", description: "Bu başlık ve içerik zaten kayıtlı.", variant: "default" });
    }
  };

  // -- EDIT/DELETE LOGIC --

  // Başlık Silme
  const handleDeleteAgenda = (agendaKey: string) => {
    if (confirm(`"${agendaKey}" başlığını ve altındaki tüm şablonları silmek istiyor musunuz?`)) {
      const newAgendas = customAgendas.filter(a => a !== agendaKey);
      setCustomAgendas(newAgendas);
      localStorage.setItem("veli_toplanti_custom_agendas", JSON.stringify(newAgendas));
      
      const newTemplates = {...customTemplates};
      delete newTemplates[agendaKey];
      setCustomTemplates(newTemplates);
      localStorage.setItem("veli_toplanti_custom_templates", JSON.stringify(newTemplates));

      toast({ title: "Silindi", description: "Başlık ve şablonlar silindi." });
    }
  };

  // Başlık Düzenleme
  const handleUpdateAgenda = (oldKey: string) => {
    if (!editingItem || !editingItem.value.trim()) return;
    const newKey = editingItem.value.trim();
    
    if (oldKey === newKey) {
        setEditingItem(null);
        return;
    }

    // Başlık listesini güncelle
    const newAgendas = customAgendas.map(a => a === oldKey ? newKey : a);
    setCustomAgendas(newAgendas);
    localStorage.setItem("veli_toplanti_custom_agendas", JSON.stringify(newAgendas));

    // Varsa şablonları yeni başlığa taşı
    if (customTemplates[oldKey]) {
        const newTemplates = {...customTemplates};
        newTemplates[newKey] = newTemplates[oldKey];
        delete newTemplates[oldKey];
        setCustomTemplates(newTemplates);
        localStorage.setItem("veli_toplanti_custom_templates", JSON.stringify(newTemplates));
    }

    setEditingItem(null);
    toast({ title: "Güncellendi", description: "Başlık düzenlendi.", variant: "success" });
  };

  // Şablon Silme
  const handleDeleteTemplate = (agendaKey: string, index: number) => {
      if (confirm("Bu şablonu silmek istiyor musunuz?")) {
          const currentTemplates = customTemplates[agendaKey] || [];
          const newTemplatesList = currentTemplates.filter((_, i) => i !== index);
          
          const updatedTemplates = {
              ...customTemplates,
              [agendaKey]: newTemplatesList
          };
          
          setCustomTemplates(updatedTemplates);
          localStorage.setItem("veli_toplanti_custom_templates", JSON.stringify(updatedTemplates));
          toast({ title: "Silindi", description: "Şablon silindi." });
      }
  };

  // Şablon Düzenleme
  const handleUpdateTemplate = (agendaKey: string, index: number) => {
      if (!editingItem || !editingItem.value.trim()) return;
      const newValue = editingItem.value.trim();

      const currentTemplates = [...(customTemplates[agendaKey] || [])];
      currentTemplates[index] = newValue;

      const updatedTemplates = {
          ...customTemplates,
          [agendaKey]: currentTemplates
      };

      setCustomTemplates(updatedTemplates);
      localStorage.setItem("veli_toplanti_custom_templates", JSON.stringify(updatedTemplates));
      setEditingItem(null);
      toast({ title: "Güncellendi", description: "Şablon düzenlendi.", variant: "success" });
  };

  const addAgendaFromLibrary = (text: string) => {
    appendGundem({ madde: text });
    appendGorusme({ detay: '' });
    setIsAgendaLibraryOpen(false);
    toast({ title: "Eklendi", description: "Madde listeye eklendi." });
  };

  // AKILLI OTOMATİK DOLDURMA
  const generateLocalContent = (index: number) => {
    const currentAgenda = form.getValues(`gundemMaddeleri.${index}.madde`).trim();
    
    // 1. Önce kullanıcının kendi şablonlarına bak
    if (customTemplates[currentAgenda] && customTemplates[currentAgenda].length > 0) {
        const myPool = customTemplates[currentAgenda];
        const randomSentence = myPool[Math.floor(Math.random() * myPool.length)];
        form.setValue(`gorusmeler.${index}.detay`, randomSentence, { shouldDirty: true });
        toast({ title: "Şablon Bulundu", description: "Kaydettiğiniz şablon kullanıldı.", variant: "success" });
        return;
    }

    // 2. Yoksa sistem havuzuna bak
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
    toast({ title: "Otomatik Dolduruldu", description: matchedKey === "default" ? "Varsayılan metin kullanıldı." : "Konuya uygun metin bulundu." });
  };

  // ARŞİV FONKSİYONLARI
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
    localStorage.setItem("veli_toplanti_archives", JSON.stringify(updatedArchives));
    
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
      localStorage.setItem("veli_toplanti_archives", JSON.stringify(updatedArchives));
      toast({ title: "Silindi", description: "Kayıt arşivden silindi." });
    }
  };

  // SESLİ YAZMA FONKSİYONU
  const toggleListening = (index: number, fieldType: 'madde' | 'detay') => {
    const currentId = `${fieldType}-${index}`;

    if (listeningId === currentId) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListeningId(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız sesli yazmayı desteklemiyor. Lütfen Chrome kullanın.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListeningId(currentId);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const fieldPath = fieldType === 'madde' 
        ? `gundemMaddeleri.${index}.madde` as const
        : `gorusmeler.${index}.detay` as const;

      const currentText = form.getValues(fieldPath) || "";
      const newText = currentText ? `${currentText} ${transcript}` : transcript;
      // @ts-ignore
      form.setValue(fieldPath, newText, { shouldDirty: true });
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setListeningId(null);
    };

    recognition.onend = () => {
      setListeningId(null);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const generateDecisionsWithAI = async () => {
    setIsGeneratingDecisions(true);
    setTimeout(() => {
        form.setValue('kararlar', VELI_TOPLANTISI_KARARLAR.join('\n'), { shouldDirty: true });
        setIsGeneratingDecisions(false);
        toast({ title: "Tamamlandı", description: "Kararlar listeye eklendi.", variant: "success" });
    }, 500);
  };

  const generateDocumentHTML = (data: FormData) => {
    const formattedDate = new Date(data.tarih).toLocaleDateString('tr-TR');
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Tutanak</title></head>
      <body style="font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.5;">
        <h3 style="text-align:center;">${data.academicYear} EĞİTİM ÖĞRETİM YILI<br/>${data.sinif} SINIFI VELİ TOPLANTISI TUTANAĞI</h3>
        <p><strong>Tarih:</strong> ${formattedDate} <strong>Saat:</strong> ${data.saat}</p>
        <p><strong>Gündem:</strong></p>
        <ol>
          ${data.gundemMaddeleri.map(g => `<li>${g.madde}</li>`).join('')}
        </ol>
        <hr/>
        <p><strong>Görüşmeler:</strong></p>
        ${data.gundemMaddeleri.map((g, i) => `
          <div style="margin-bottom: 10px;">
            <p><strong>${i + 1}. ${g.madde}:</strong></p>
            <p>${data.gorusmeler[i]?.detay || 'Görüşülmedi.'}</p>
          </div>
        `).join('')}
        <br/>
        <p><strong>Kararlar:</strong></p>
        <pre style="font-family: 'Times New Roman', serif; white-space: pre-wrap;">${data.kararlar}</pre>
        <br/><br/>
        <table style="width:100%; margin-top: 50px;">
          <tr>
            <td style="text-align:center">${data.sinifRehberOgretmeni}<br/>Sınıf Rehber Öğretmeni</td>
            <td style="text-align:center">..../..../.......<br/>Okul Müdürü</td>
          </tr>
        </table>
      </body></html>
    `;
  };

  const handleExport = (data: FormData) => {
    const content = generateDocumentHTML(data);
    downloadDoc(content, `Toplanti_Tutanagi_${data.sinif}.doc`);
    toast({ title: "İndiriliyor", description: "Word dosyası hazırlanıyor...", variant: "success" });
  };

  const handlePreview = () => {
    const data = form.getValues();
    const content = generateDocumentHTML(data);
    setPreviewHtml(content);
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } else {
        alert("Pop-up engelleyiciyi kapatın.");
    }
  };

  const handleExportSignatureList = () => {
    const data = form.getValues();
    const formattedDate = new Date(data.tarih).toLocaleDateString('tr-TR');
    
    const rows = data.katilimcilar.length > 0 
      ? data.katilimcilar.map((k, i) => `<tr><td style="text-align:center">${i + 1}</td><td></td><td>${k.adSoyad}</td><td></td></tr>`).join('')
      : Array(25).fill(0).map((_, i) => `<tr><td style="text-align:center">${i + 1}</td><td></td><td></td><td></td></tr>`).join('');

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'><title>İmza Sirküsü</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid black; padding: 8px; height: 30px; }
          th { background-color: #f0f0f0; }
        </style>
      </head>
      <body style="font-family: 'Times New Roman', serif;">
        <h3 style="text-align:center;">${data.academicYear} EĞİTİM ÖĞRETİM YILI<br/>${data.sinif} SINIFI VELİ TOPLANTISI İMZA SİRKÜSÜ</h3>
        <p><strong>Tarih:</strong> ${formattedDate} &nbsp;&nbsp;&nbsp; <strong>Saat:</strong> ${data.saat} &nbsp;&nbsp;&nbsp; <strong>Yer:</strong> ${data.yer}</p>
        
        <table>
          <thead>
            <tr>
              <th style="width: 50px;">Sıra</th>
              <th>Öğrenci Adı Soyadı</th>
              <th>Veli Adı Soyadı</th>
              <th style="width: 150px;">İmza</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        
        <br/><br/>
        <div style="text-align: right;">
          <p>${data.sinifRehberOgretmeni}</p>
          <p>Sınıf Rehber Öğretmeni</p>
        </div>
      </body></html>
    `;

    downloadDoc(content, `Imza_Sirkusu_${data.sinif}.doc`);
    toast({ title: "Hazır", description: "İmza sirküsü indiriliyor.", variant: "success" });
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
    if (draggedItem.current !== null && draggedOverItem.current !== null) {
      moveGundem(draggedItem.current, draggedOverItem.current);
      moveGorusme(draggedItem.current, draggedOverItem.current);
    }
    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  const handleBulkImport = () => {
    if (!bulkImportData.trim()) return;
    const names = bulkImportData.split(/\n/).map(line => line.trim()).filter(line => line.length > 0);
    names.forEach(name => appendKatilimci({ adSoyad: name }));
    setBulkImportData("");
    setIsBulkImportOpen(false);
  };

  // FİLTERED SCENARIOS HELPERS
  const getScenariosForActiveIndex = () => {
    if (activeGundemIndex === null) return [];
    
    const currentAgenda = form.getValues(`gundemMaddeleri.${activeGundemIndex}.madde`).trim();
    
    // 1. Sistem senaryolarını bul
    const systemScenarios = VELI_TOPLANTISI_SENARYOLARI.find(
        s => s.agenda.toLowerCase() === currentAgenda.toLowerCase()
    )?.scenarios || [];

    // 2. Kullanıcı şablonlarını bul
    const userTemplates = customTemplates[currentAgenda] || [];
    const formattedUserTemplates = userTemplates.map((content, i) => ({
        description: `Özel Şablon ${i + 1}`,
        content: content
    }));

    return [...formattedUserTemplates, ...systemScenarios];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative">
      
      {/* TOAST CONTAINER */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {uiToasts.map(t => (
          <div key={t.id} className={`p-4 rounded-lg shadow-lg text-sm font-medium animate-in slide-in-from-right-full fade-in duration-300 flex items-center gap-3 min-w-[300px] border ${
              t.variant === 'destructive' ? 'bg-red-50 text-red-900 border-red-200' : 
              t.variant === 'success' ? 'bg-green-50 text-green-900 border-green-200' : 
              'bg-white text-slate-900 border-slate-200'
          }`}>
            {t.variant === 'destructive' ? <AlertCircle className="h-5 w-5 text-red-600" /> : 
             t.variant === 'success' ? <CheckCircle className="h-5 w-5 text-green-600" /> : 
             <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">i</div>}
            <div>
                <div className="font-bold">{t.title}</div>
                <div className="text-xs opacity-80">{t.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Veli Toplantı Tutanağı</h1>
            <p className="text-xs text-slate-500">Tutanak Oluşturucu & Arşiv Sistemi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           {/* ARŞİV BUTONLARI */}
           <div className="flex items-center rounded-md border border-slate-300 bg-white mr-2">
             <Button onClick={openSaveDialog} variant="ghost" className="rounded-r-none border-r border-slate-200 text-slate-700 hover:bg-slate-50" title="Kalıcı Olarak Kaydet">
               <Save className="mr-2 h-4 w-4" /> Kaydet
             </Button>
             <Button onClick={() => setIsArchiveListOpen(true)} variant="ghost" className="rounded-l-none text-slate-700 hover:bg-slate-50" title="Kayıtlı Tutanaklar">
               <Archive className="mr-2 h-4 w-4" /> Arşiv ({archives.length})
             </Button>
           </div>

           <Button onClick={handleExportSignatureList} variant="outline" className="text-slate-700 border-slate-300">
             <FileSpreadsheet className="mr-2 h-4 w-4" /> İmza Sirküsü
           </Button>
           
           <div className="flex items-center rounded-md border border-slate-300 bg-white">
             <Button onClick={handlePreview} variant="ghost" className="rounded-r-none border-r border-slate-200 text-slate-700 hover:bg-slate-50">
               <Eye className="mr-2 h-4 w-4" /> Önizle
             </Button>
             <Button onClick={form.handleSubmit(handleExport)} className="rounded-l-none bg-green-600 hover:bg-green-700 text-white">
               <FileDown className="mr-2 h-4 w-4" /> Word
             </Button>
           </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* FORM START */}
        <div className="space-y-8">
            {/* Toplantı Bilgileri */}
            <Card>
                <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Eğitim Yılı</Label><Input {...form.register('academicYear')} /></div>
                    <div className="space-y-2"><Label>Dönem</Label><Input {...form.register('donem')} /></div>
                    <div className="space-y-2"><Label>Sınıf</Label><Input {...form.register('sinif')} /></div>
                    <div className="space-y-2"><Label>Tarih</Label><Input type="date" {...form.register('tarih')} /></div>
                    <div className="space-y-2"><Label>Saat</Label><Input type="time" {...form.register('saat')} /></div>
                    <div className="space-y-2"><Label>Yer</Label><Input {...form.register('yer')} /></div>
                    <div className="space-y-2 md:col-span-3"><Label>Öğretmen Adı</Label><Input {...form.register('sinifRehberOgretmeni')} /></div>
                </CardContent>
            </Card>

            {/* Katılımcılar */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-base">Katılımcı Listesi ({katilimciFields.length})</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsBulkImportOpen(true)}>
                        <Upload className="mr-2 h-3 w-3" /> Toplu Ekle
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {katilimciFields.map((item, index) => (
                            <div key={item.id} className="flex gap-2">
                                <Input {...form.register(`katilimcilar.${index}.adSoyad`)} placeholder="Veli Adı Soyadı" />
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeKatilimci(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button variant="secondary" className="w-full border-dashed border-2 bg-transparent" onClick={() => appendKatilimci({ adSoyad: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Gündem ve Görüşmeler */}
            <Card>
                <CardHeader><CardTitle>Gündem ve Görüşmeler</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {gundemFields.map((item, index) => (
                        <div 
                            key={item.id} 
                            className={`space-y-3 p-4 rounded-xl border-2 transition-all ${draggedItem.current === index ? 'border-blue-400 bg-blue-50 opacity-60' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                            draggable 
                            onDragStart={() => (draggedItem.current = index)} 
                            onDragEnter={() => (draggedOverItem.current = index)} 
                            onDragEnd={handleSortEnd} 
                            onDragOver={(e) => e.preventDefault()}
                        >
                            {/* Header Row */}
                            <div className="flex justify-between items-center handle cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-1.5 rounded text-slate-400">
                                        <GripVertical className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-sm">Madde {index + 1}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => { removeGundem(index); removeGorusme(index); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Inputs */}
                            <div className="grid gap-3">
                                <div className="flex gap-2 items-center">
                                    <div className="relative flex-grow">
                                        <Input 
                                            {...form.register(`gundemMaddeleri.${index}.madde`)} 
                                            className="font-semibold text-lg border-transparent focus:border-slate-300 px-0 shadow-none pr-8" 
                                            placeholder="Gündem Maddesi..." 
                                        />
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                className={`h-7 w-7 p-0 rounded-full transition-colors ${listeningId === `madde-${index}` ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-300 hover:text-blue-600'}`} 
                                                onClick={() => toggleListening(index, 'madde')}
                                                title="Başlığı Konuşarak Yaz"
                                            >
                                                {listeningId === `madde-${index}` ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* SAVE TO LIBRARY BUTTON */}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      title="İçeriği Şablon Olarak Kaydet"
                                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                      onClick={() => saveAgendaToLibrary(index)}
                                    >
                                      <BookmarkPlus className="h-5 w-5" />
                                    </Button>
                                </div>
                                
                                <div className="relative">
                                    <Textarea 
                                        {...form.register(`gorusmeler.${index}.detay`)} 
                                        className="min-h-[120px] resize-y" 
                                        placeholder="Bu madde hakkında konuşulanlar..." 
                                    />
                                    <div className="absolute bottom-2 right-2 flex gap-1">
                                        {/* SESLİ YAZMA BUTONU (DETAY İÇİN) */}
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className={`h-7 px-2 transition-colors ${listeningId === `detay-${index}` ? 'text-red-600 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-blue-600'}`} 
                                            onClick={() => toggleListening(index, 'detay')}
                                            title="Detayları Konuşarak Yaz"
                                        >
                                            {listeningId === `detay-${index}` ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                            {listeningId === `detay-${index}` && <span className="ml-1 text-xs">Dinliyor...</span>}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                <Button type="button" variant="outline" size="sm" onClick={() => { setActiveGundemIndex(index); setIsScenarioModalOpen(true); }}>
                                    <BookOpen className="mr-2 h-3 w-3" /> Hazır Şablon
                                </Button>
                                <Button type="button" variant="secondary" size="sm" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100" onClick={() => generateLocalContent(index)}>
                                    <Sparkles className="mr-2 h-3 w-3" /> Otomatik Doldur
                                </Button>
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 py-8 border-dashed border-2 hover:bg-slate-50 hover:border-slate-300" onClick={() => { appendGundem({ madde: '' }); appendGorusme({ detay: '' }); }}>
                          <PlusCircle className="mr-2 h-5 w-5" /> Yeni Gündem Maddesi
                      </Button>
                      
                      <Button variant="secondary" className="px-6 py-8 border border-slate-200" onClick={() => setIsAgendaLibraryOpen(true)}>
                          <Library className="mr-2 h-5 w-5" /> Kütüphaneden Seç
                      </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Kararlar */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Alınan Kararlar</CardTitle>
                    <Button type="button" variant="secondary" size="sm" className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100" onClick={generateDecisionsWithAI} disabled={isGeneratingDecisions}>
                        {isGeneratingDecisions ? <Zap className="mr-2 h-3 w-3 animate-spin"/> : <ListChecks className="mr-2 h-3 w-3" />}
                        Önerilen Kararları Yaz
                    </Button>
                </CardHeader>
                <CardContent>
                    <Textarea {...form.register('kararlar')} rows={6} placeholder="Maddeler halinde alınan kararlar..." className="font-mono text-sm leading-relaxed" />
                </CardContent>
            </Card>

        </div>
      </main>

      {/* MODALS */}
      
      {/* 1. GÜNDEM KÜTÜPHANESİ MODALI (DÜZENLEME ÖZELLİĞİ EKLENDİ) */}
      {isAgendaLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2"><Library className="h-4 w-4" /> Gündem Kütüphanesi</h3>
                    <button onClick={() => { setIsAgendaLibraryOpen(false); setEditingItem(null); }}><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50 space-y-4">
                    
                    {/* Kişisel Kütüphane */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Kişisel Maddelerim</h4>
                      {customAgendas.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Henüz kaydedilmiş madde yok.</p>
                      ) : (
                        <div className="grid gap-3">
                          {customAgendas.map((agendaTitle, i) => (
                            <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                {/* Üst Satır: Başlık */}
                                <div className="flex items-center gap-2 mb-2">
                                    {editingItem?.key === agendaTitle && editingItem.type === 'agenda' ? (
                                        <div className="flex-1 flex gap-2">
                                            <Input 
                                                autoFocus
                                                value={editingItem.value} 
                                                onChange={(e: any) => setEditingItem({...editingItem, value: e.target.value})}
                                            />
                                            <Button size="sm" onClick={() => handleUpdateAgenda(agendaTitle)} className="bg-green-600"><Check className="h-4 w-4"/></Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="flex-1 font-semibold text-slate-800">{agendaTitle}</span>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => setEditingItem({ type: 'agenda', key: agendaTitle, value: agendaTitle })}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => addAgendaFromLibrary(agendaTitle)} title="Listeye Ekle">
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50" onClick={() => handleDeleteAgenda(agendaTitle)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Alt Satır: Şablonlar (Varsa) */}
                                {customTemplates[agendaTitle] && customTemplates[agendaTitle].length > 0 && (
                                    <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-2">
                                        {customTemplates[agendaTitle].map((template, tIndex) => (
                                            <div key={tIndex} className="text-sm text-slate-600 bg-slate-50 p-2 rounded flex items-start gap-2">
                                                {editingItem?.key === agendaTitle && editingItem?.index === tIndex && editingItem.type === 'template' ? (
                                                    <div className="flex-1 flex flex-col gap-2">
                                                        <Textarea 
                                                            autoFocus
                                                            value={editingItem.value} 
                                                            onChange={(e: any) => setEditingItem({...editingItem, value: e.target.value})}
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>İptal</Button>
                                                            <Button size="sm" onClick={() => handleUpdateTemplate(agendaTitle, tIndex)}>Kaydet</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="flex-1 text-xs">{template}</span>
                                                        <div className="flex flex-col gap-1">
                                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-400" onClick={() => setEditingItem({ type: 'template', key: agendaTitle, index: tIndex, value: template })}>
                                                                <Pencil className="h-3 w-3" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => handleDeleteTemplate(agendaTitle, tIndex)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4"></div>

                    {/* Varsayılan Maddeler */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Varsayılan Maddeler</h4>
                      <div className="grid gap-2">
                          {VELI_TOPLANTISI_GUNDEM.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm cursor-pointer hover:border-blue-400" onClick={() => addAgendaFromLibrary(item)}>
                              <span className="flex-1 text-sm">{item}</span>
                              <PlusCircle className="h-4 w-4 text-slate-300" />
                            </div>
                          ))}
                      </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. Toplu Ekle Modalı */}
      {isBulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold">Toplu Veli Ekle</h3>
                    <button onClick={() => setIsBulkImportOpen(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4 space-y-2">
                    <p className="text-sm text-slate-500">İsimleri alt alta yapıştırın.</p>
                    <Textarea value={bulkImportData} onChange={(e: any) => setBulkImportData(e.target.value)} className="h-40" placeholder="Ahmet Yılmaz\nAyşe Demir\n..." />
                </div>
                <div className="p-4 bg-slate-50 flex justify-end">
                    <Button onClick={handleBulkImport}>Listeye Ekle</Button>
                </div>
            </div>
        </div>
      )}

      {/* 3. Senaryo Seçim Modalı */}
      {isScenarioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold">Hazır Şablon Seç</h3>
                    <button onClick={() => setIsScenarioModalOpen(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                   {getScenariosForActiveIndex().length === 0 ? (
                       <p className="text-center text-slate-500 py-4">Bu başlık için kayıtlı şablon bulunamadı.</p>
                   ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getScenariosForActiveIndex().map((sc, i) => (
                            <div key={i} className="bg-white p-4 rounded border hover:border-blue-500 cursor-pointer transition-all" onClick={() => {
                                if(activeGundemIndex !== null) {
                                    form.setValue(`gorusmeler.${activeGundemIndex}.detay`, sc.content);
                                    setIsScenarioModalOpen(false);
                                }
                            }}>
                                <h4 className="font-bold text-sm mb-2 text-blue-600">{sc.description}</h4>
                                <p className="text-xs text-slate-600 line-clamp-3">{sc.content}</p>
                            </div>
                          ))}
                       </div>
                   )}
                </div>
            </div>
        </div>
      )}

      {/* 4. ÖNİZLEME MODALI */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-100 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 bg-white border-b shadow-sm">
                    <div className="flex items-center gap-2">
                       <h3 className="font-semibold text-lg flex items-center gap-2"><Eye className="h-5 w-5 text-blue-600" /> Baskı Önizleme</h3>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                          <Printer className="mr-2 h-4 w-4" /> Yazdır
                       </Button>
                       <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-6 w-6 text-slate-500" /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-500/10">
                    <div className="bg-white shadow-xl w-[21cm] min-h-[29.7cm] p-[2.5cm] origin-top transform scale-90 sm:scale-100">
                       <div dangerouslySetInnerHTML={{ __html: previewHtml.replace(/<body.*?>|<\/body>|<html.*?>|<\/html>|<head>.*?<\/head>/gs, "") }} />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 5. ARŞİV KAYDETME MODALI */}
      {isSaveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold">Arşive Kaydet</h3>
                    <button onClick={() => setIsSaveDialogOpen(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Kayıt Adı</Label>
                        <Input 
                            value={saveNameInput} 
                            onChange={(e: any) => setSaveNameInput(e.target.value)} 
                            placeholder="Örn: 10/A 1. Dönem"
                        />
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>İptal</Button>
                    <Button onClick={handleSaveToArchive} className="bg-blue-600">Kaydet</Button>
                </div>
            </div>
        </div>
      )}

      {/* 6. ARŞİV LİSTESİ MODALI */}
      {isArchiveListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-semibold flex items-center gap-2"><Archive className="h-4 w-4" /> Kayıtlı Tutanaklar</h3>
                    <button onClick={() => setIsArchiveListOpen(false)}><X className="h-4 w-4" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                   {archives.length === 0 ? (
                       <div className="text-center py-12 text-slate-400">
                           <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                           <p>Henüz arşivlenmiş bir tutanak yok.</p>
                       </div>
                   ) : (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {archives.map((doc) => (
                              <div key={doc.id} className="bg-white p-4 rounded-lg border shadow-sm hover:border-blue-400 group relative">
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-slate-800">{doc.name}</h4>
                                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{doc.createdAt}</span>
                                  </div>
                                  <div className="text-xs text-slate-500 mb-4 space-y-1">
                                      <p>Sınıf: {doc.data.sinif}</p>
                                      <p>Öğretmen: {doc.data.sinifRehberOgretmeni}</p>
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                      <Button size="sm" variant="secondary" className="w-full" onClick={() => handleLoadFromArchive(doc)}>
                                          <Upload className="mr-2 h-3 w-3" /> Yükle
                                      </Button>
                                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteFromArchive(doc.id)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </div>
                          ))}
                       </div>
                   )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
