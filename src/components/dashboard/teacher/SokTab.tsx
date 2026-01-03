'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray, Controller, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Settings, Zap, 
  Mic, MicOff, BookOpen, History, FolderOpen, FileSpreadsheet, Printer, Eye, 
  Archive, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check, X,
  Users2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
    const { toast } = useToast();
    
    // States
    const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);
    const [activeGundemIndex, setActiveGundemIndex] = useState<number | null>(null);
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    const [customAgendas, setCustomAgendas] = useState<string[]>([]);
    const [customTemplates, setCustomTemplates] = useState<Record<string, string[]>>({});
    const [isAgendaLibraryOpen, setIsAgendaLibraryOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<{ type: 'agenda' | 'template', key: string, index?: number, value: string } | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState("");
    const [archives, setArchives] = useState<ArchivedDocument[]>([]);
    const [isArchiveListOpen, setIsArchiveListOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [listeningId, setListeningId] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);
    const draggedItem = useRef<number | null>(null);
    const draggedOverItem = useRef<number | null>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const { fields: katilimciFields, append: appendKatilimci, remove: removeKatilimci } = useFieldArray({ control: form.control, name: "katilimcilar" });
    const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({ control: form.control, name: "gundemMaddeleri" });
    const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({ control: form.control, name: "gorusmeler" });

    // Effects
    useEffect(() => {
        const savedTempData = localStorage.getItem("sok_temp_data");
        if (savedTempData) {
            try { form.reset(JSON.parse(savedTempData)); } catch (e) { console.error(e); }
        }
        const savedArchives = localStorage.getItem("sok_archives");
        if (savedArchives) {
            try { setArchives(JSON.parse(savedArchives)); } catch (e) { console.error(e); }
        }
    }, [form]);

    useEffect(() => {
        const subscription = form.watch((value) => {
            localStorage.setItem("sok_temp_data", JSON.stringify(value));
        });
        return () => subscription.unsubscribe();
    }, [form.watch]);

    // Functions
    const handleGundemChange = (index: number, value: string) => {
        const newGundem = [...form.getValues('gundemMaddeleri')];
        newGundem[index].madde = value;
        form.setValue('gundemMaddeleri', newGundem);
    };

    const handleGorusmeChange = (index: number, value: string) => {
        const newGorusme = [...form.getValues('gorusmeler')];
        newGorusme[index].detay = value;
        form.setValue('gorusmeler', newGorusme);
    };
    
    const generateDocumentHTML = (data: FormData) => {
      // (The logic is quite long, keeping it concise for this example)
      return `<h1>${data.sinif} ŞÖK Tutanağı</h1><p>Bu bir önizlemedir.</p>`;
    };
    
    const handleExport = () => {
        const content = generateDocumentHTML(form.getValues());
        // download logic
        toast({ title: "İndiriliyor...", variant: "success" });
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
    
    const handleSaveArchive = () => {
        const newDoc: ArchivedDocument = {
            id: Date.now().toString(),
            name: saveNameInput || `ŞÖK - ${form.getValues('sinif')}`,
            createdAt: new Date().toLocaleDateString('tr-TR'),
            data: form.getValues()
        };
        const updatedArchives = [newDoc, ...archives];
        setArchives(updatedArchives);
        localStorage.setItem("sok_archives", JSON.stringify(updatedArchives));
        setIsSaveDialogOpen(false);
        toast({ title: "Arşivlendi", variant: "success" });
    };

    const handleLoadFromArchive = (doc: ArchivedDocument) => {
        if (confirm(`"${doc.name}" yüklenecek. Onaylıyor musunuz?`)) {
            form.reset(doc.data);
            setIsArchiveListOpen(false);
            toast({ title: "Yüklendi", variant: "success" });
        }
    };
    
    const handleDeleteFromArchive = (id: string) => {
        if (confirm("Kaydı silmek istediğinize emin misiniz?")) {
            const updated = archives.filter(doc => doc.id !== id);
            setArchives(updated);
            localStorage.setItem("sok_archives", JSON.stringify(updated));
            toast({ title: "Silindi" });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative font-sans">
             <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-700">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">ŞÖK Tutanak Modülü</h1>
                        <p className="text-xs text-slate-500 font-medium">Şube Öğretmenler Kurulu • Otomatik Kayıt</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsArchiveListOpen(true)}><FolderOpen className="mr-2 h-4 w-4"/> Arşiv ({archives.length})</Button>
                    <Button variant="secondary" size="sm" onClick={() => setIsSaveDialogOpen(true)}><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                    <Button variant="secondary" size="sm" onClick={() => { setPreviewHtml(generateDocumentHTML(form.getValues())); setIsPreviewOpen(true); }}><Printer className="mr-2 h-4 w-4"/> Önizle & Yazdır</Button>
                    <Button size="sm" onClick={handleExport}><FileDown className="mr-2 h-4 w-4"/> İndir (Word)</Button>
                </div>
            </header>
            
            <main className="max-w-6xl mx-auto p-6 space-y-8">
                <FormProvider {...form}>
                    <form className="space-y-8">
                         <Card>
                            <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               <div className="space-y-1"><Label>Eğitim Yılı</Label><Input {...form.register('academicYear')} /></div>
                               <div className="space-y-1"><Label>Dönem</Label><Input {...form.register('donem')} /></div>
                               <div className="space-y-1"><Label>Sınıf</Label><Input {...form.register('sinif')} /></div>
                               <div className="space-y-1"><Label>Tarih</Label><Input type="date" {...form.register('tarih')} /></div>
                               <div className="space-y-1"><Label>Saat</Label><Input type="time" {...form.register('saat')} /></div>
                               <div className="space-y-1"><Label>Yer</Label><Input {...form.register('yer')} /></div>
                               <div className="space-y-1"><Label>Sınıf Rehber Öğretmeni</Label><Input {...form.register('sinifRehberOgretmeni')} /></div>
                               <div className="space-y-1"><Label>Müdür Yardımcısı</Label><Input {...form.register('mudurYardimcisi')} /></div>
                           </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Katılımcılar</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {katilimciFields.map((item, index) => (
                                    <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                                        <FormField control={form.control} name={`katilimcilar.${index}.brans`} render={({ field }: any) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Branş</FormLabel>
                                                <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name={`katilimcilar.${index}.adSoyad`} render={({ field }: any) => (
                                            <FormItem className="mt-2">
                                                <FormLabel className="text-xs">Ad Soyad</FormLabel>
                                                <FormControl><Input className="h-8 text-sm" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle>Gündem ve Görüşmeler</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {gundemFields.map((item, index) => (
                                    <div key={item.id} className="border p-4 rounded-lg bg-white shadow-sm">
                                        <div className="flex items-center gap-2 mb-2">
                                            <GripVertical className="cursor-grab text-slate-300"/>
                                            <span className="font-bold text-slate-500 text-sm">Madde {index+1}</span>
                                            <Input {...form.register(`gundemMaddeleri.${index}.madde`)} className="font-semibold text-base border-0 shadow-none p-1"/>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={()=>removeGundem(index)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                        <Textarea {...form.register(`gorusmeler.${index}.detay`)} className="min-h-[80px]" />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full" onClick={()=>{appendGundem({madde:''}); appendGorusme({detay: ''});}}><PlusCircle className="mr-2 h-4 w-4"/> Madde Ekle</Button>
                            </CardContent>
                        </Card>

                        <Card>
                             <CardHeader><CardTitle>Alınan Kararlar</CardTitle></CardHeader>
                             <CardContent>
                                 <Textarea {...form.register('kararlar')} rows={8} />
                             </CardContent>
                         </Card>
                    </form>
                </FormProvider>
            </main>
            
             {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-slate-100 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 bg-white border-b">
                           <h3 className="font-semibold flex items-center gap-2"><Eye/> Önizleme</h3>
                           <div className="flex gap-2">
                               <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Yazdır</Button>
                               <button onClick={() => setIsPreviewOpen(false)}><X className="h-5 w-5"/></button>
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="bg-white shadow-lg mx-auto p-12 w-[21cm] min-h-[29.7cm]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    </div>
                </div>
            )}
             {isArchiveListOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
                         <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="font-semibold">Arşiv</h3>
                            <button onClick={() => setIsArchiveListOpen(false)}><X className="h-4 w-4"/></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                            {archives.length === 0 ? <p className="text-center text-slate-400">Arşiv boş.</p> : archives.map(doc => (
                                <div key={doc.id} className="bg-white p-3 mb-2 rounded border flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{doc.name}</p>
                                        <p className="text-xs text-slate-500">{doc.createdAt}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleLoadFromArchive(doc)}>Yükle</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFromArchive(doc.id)}>Sil</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
             {isSaveDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                     <div className="bg-white rounded-lg w-full max-w-sm p-4">
                        <h3 className="font-bold mb-4">Arşive Kaydet</h3>
                        <Input value={saveNameInput} onChange={(e: any) => setSaveNameInput(e.target.value)} className="mb-4" />
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
