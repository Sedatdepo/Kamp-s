
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, Save, FileDown, Users2, PlusCircle, Trash2, GripVertical, BookOpen, Settings, Zap, ListChecks, ChevronDown, ChevronRight, Archive, FolderOpen, History, FileText, Mic, MicOff, LoaderCircle, BookmarkPlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabase } from '@/hooks/use-database';
import Link from 'next/link';
import { ZUMRE_SENARYOLARI, GUNDEM_MADDELERI, VARSAYILAN_KARARLAR } from '@/lib/zumre-senaryolari';
import type { SavedDocument as ZumreSavedDocument, Scenario, Student } from '@/lib/types';
import { useCollection, useFirestore, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


// --- TİP TANIMLARI ---
const formSchema = z.object({
    academicYear: z.string().min(1, "Eğitim yılı gerekli"),
    donem: z.string().min(1, "Dönem seçimi gerekli"),
    schoolType: z.string().min(1, "Okul türü gerekli"),
    ders: z.string().min(1, "Ders adı gerekli"),
    tarih: z.string(),
    saat: z.string(),
    yer: z.string().min(1, "Yer gerekli"),
    baskan: z.string().min(1, "Başkan adı gerekli"),
    katilimcilar: z.string().min(1, "Katılımcılar gerekli"),
    gundemMaddeleri: z.array(z.object({ madde: z.string().min(1, "Gündem maddesi boş olamaz") })),
    gorusmeler: z.array(z.object({ detay: z.string() })),
    kararlar: z.string(),
});
type FormData = z.infer<typeof formSchema>;
type SavedDocument = ZumreSavedDocument<FormData>;


const defaultValues: FormData = {
    academicYear: '',
    donem: "1. Dönem Başı (Eylül)",
    schoolType: "Anadolu Lisesi",
    ders: "Fizik",
    tarih: '',
    saat: '',
    yer: "Öğretmenler Odası",
    baskan: '',
    katilimcilar: '',
    gundemMaddeleri: GUNDEM_MADDELERI.map(madde => ({ madde })),
    gorusmeler: GUNDEM_MADDELERI.map(() => ({ detay: '' })),
    kararlar: "",
};

// Bu bileşen artık doğrudan kullanılmayacak, TeacherDashboard içinde render edilecek.
// Ancak ana mantığı koruyoruz.
export function ZumreTab() {
    const { db: coreDb, setDb: setCoreDb } = useDatabase();
    const { schoolInfo } = coreDb;
    
    // Zümre verilerini coreDb'den alıyoruz.
    const zumreDocuments = coreDb.zumreDocuments || [];
    const userScenarios = coreDb.userScenarios;
    const zumreData = coreDb.zumreData; // Bu artık seçili taslak olacak


    const { toast } = useToast();
    const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
    const [activeGundemIndex, setActiveGundemIndex] = useState<number | null>(null);
    const [isListening, setIsListening] = useState<number | null>(null);
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");
    const [isSaveNameDialogOpen, setIsSaveNameDialogOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const draggedItem = useRef<number | null>(null);
    const draggedOverItem = useRef<number | null>(null);

    const firestore = useFirestore();

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues,
    });

    const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({
        control: form.control,
        name: "gundemMaddeleri"
    });
    const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({
        control: form.control,
        name: "gorusmeler"
    });
    
    // --- Firestore'dan paylaşılan senaryoları çek ---
    const sharedScenariosQuery = useMemoFirebase(() => query(collection(firestore, 'sharedScenarios'), where('module', '==', 'zumre')), [firestore]);
    const { data: sharedScenarios, isLoading: isLoadingScenarios } = useCollection(sharedScenariosQuery);

    useEffect(() => {
        let initialData;
        if (zumreData) {
            initialData = zumreData;
        } else {
            const baseData = {
                ...defaultValues,
                academicYear: schoolInfo?.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                tarih: new Date().toISOString().split('T')[0],
                saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                baskan: schoolInfo?.classTeacherName || '',
                katilimcilar: schoolInfo?.classTeacherName || '',
            };
            initialData = {...baseData, kararlar: VARSAYILAN_KARARLAR.map(k => k.replace(/{ders}/g, baseData.ders)).join('\n')};
        }
        form.reset(initialData);
    }, [schoolInfo, zumreData, form]);

    const handleSave = (data: FormData) => {
        setCoreDb(prev => ({...prev, zumreData: data}));
        toast({ title: 'Taslak Kaydedildi', description: 'Mevcut zümre taslağı kaydedildi.' });
    };

    const handleExport = (data: FormData) => {
      if (!schoolInfo || !schoolInfo.schoolName) {
        toast({ title: 'Hata', description: 'Lütfen önce Ayarlar menüsünden okul bilgilerini girin.', variant: 'destructive'});
        return;
      }
      const generateContent = () => {
        const gündemHtml = data.gundemMaddeleri.map((item, index) => `<p style="margin: 0; padding: 2px 0;">${index + 1}) ${item.madde}</p>`).join('');
        const gorusmelerHtml = data.gundemMaddeleri.map((item, index) => `
          <div style="margin-top: 15px;">
            <p style="margin:0; font-weight: bold;">${index + 1}) ${item.madde}</p>
            ${data.gorusmeler[index]?.detay.split('\n').map(p => `<p style="margin: 0; padding: 2px 0;">${p}</p>`).join('') || ''}
          </div>
        `).join('');
        const kararlarHtml = data.kararlar.split('\n').map(karar => {
            const isNumbered = /^\d+\./.test(karar.trim());
            const prefix = isNumbered ? '' : '- ';
            return `<p style="margin: 0; padding: 2px 0;">${prefix}${karar}</p>`;
        }).join('');
        const katilimciListesi = data.katilimcilar.split(',').map(k => k.trim());
        const signaturesHtml = `
            <table style="width: 100%; margin-top: 60px; border: none;">
                <tr>
                    ${katilimciListesi.map(k => `
                        <td style="border: none; text-align: center; vertical-align: top; padding: 20px;">
                            <p style="margin: 0;">${k}</p>
                            <p style="margin: 0; font-size: 10pt;">${k === data.baskan ? 'Zümre Başkanı' : 'Öğretmen'}</p>
                            <br/><br/>
                            <p style="color: #ccc;">(İmza)</p>
                        </td>
                    `).join('')}
                </tr>
            </table>
        `;
        const topMeetingNo = data.donem.includes("Ara") ? "2" : (data.donem.includes("Yıl Sonu") ? "3" : "1");
        const topDonem = data.donem.includes("1. Dönem") ? "1. Dönem" : "2. Dönem";
        return `
          <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Zümre Tutanağı</title>
          <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; } .container { width: 80%; margin: auto; } .header, .footer { text-align: center; }</style>
          </head><body><div class="container">
              <div class="header"><p>T.C.<br/>MİLLİ EĞİTİM BAKANLIĞI<br/>${schoolInfo.schoolName.toUpperCase()} MÜDÜRLÜĞÜ’NE</p></div><br/>
              <p><strong>${data.academicYear}</strong> Eğitim öğretim yılı <strong>${data.ders}</strong> dersi <strong>${data.donem}</strong> zümre toplantısı...</p>
              <div style="text-align: right; line-height: 1;"><p>${data.baskan}<br/>Zümre Başkanı</p></div>
              <h4 style="text-decoration: underline;">GÜNDEM MADDELERİ</h4>${gündemHtml}<br/>
              <div class="header" style="margin-top: 50px;"><p><strong>OLUR</strong><br/>${new Date(data.tarih).toLocaleDateString('tr-TR')}<br/>${schoolInfo.schoolPrincipalName}<br/>Okul Müdürü</p></div>
              <p style="page-break-before: always;"></p>
              <div class="header"><h3>${schoolInfo.schoolName.toUpperCase()}<br/>${data.academicYear} EĞİTİM-ÖĞRETİM YILI<br/>${data.ders.toUpperCase()} DERSİ ${data.donem.toUpperCase()} ZÜMRE TOPLANTI TUTANAĞI</h3></div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border:none;">
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantı No</strong></td><td style="border:none; padding: 2px 8px;">: ${topMeetingNo}</td></tr>
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantının Öğretim Yılı</strong></td><td style="border:none; padding: 2px 8px;">: ${data.academicYear}</td></tr>
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantının Dönem</strong></td><td style="border:none; padding: 2px 8px;">: ${topDonem}</td></tr>
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantının Tarihi ve yeri</strong></td><td style="border:none; padding: 2px 8px;">: ${new Date(data.tarih).toLocaleDateString('tr-TR')} - ${data.saat} - ${data.yer}</td></tr>
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantının Başkanı</strong></td><td style="border:none; padding: 2px 8px;">: ${data.baskan}</td></tr>
                  <tr><td style="border:none; padding: 2px 8px;"><strong>Toplantıya Katılanlar</strong></td><td style="border:none; padding: 2px 8px;">: ${data.katilimcilar}</td></tr>
              </table>
              <h4 style="text-decoration: underline;">GÜNDEM MADDELERİ</h4>${gündemHtml}
              <h4 style="text-decoration: underline; margin-top: 20px;">GÜNDEM MADDELERİNİN GÖRÜŞÜLMESİ</h4>${gorusmelerHtml}
              <h4 style="text-decoration: underline; margin-top: 20px;">ALINAN KARARLAR</h4>${kararlarHtml}
              ${signaturesHtml}<br/><br/>
              <div class="header"><p>${new Date(data.tarih).toLocaleDateString('tr-TR')}<br/>UYGUNDUR<br/>${schoolInfo.schoolPrincipalName}<br/>Okul Müdürü</p></div>
          </div></body></html>
        `;
      };
      const content = generateContent();
      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'zumre-tutanagi.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // --- DİNAMİK İÇERİK FORMATLAMA ---
    const formatContent = (content: string) => {
        const formData = form.getValues();
        let text = content
            .replace(/{baskan}/g, formData.baskan)
            .replace(/{ders}/g, formData.ders)
            .replace(/{academicYear}/g, formData.academicYear)
            .replace(/{donem}/g, formData.donem);

        const katilimcilar = formData.katilimcilar
            .split(',')
            .map(k => k.trim())
            .filter(name => name && name !== formData.baskan);
        
        text = text.replace(/{katilimci(\d+)}/g, (match, index) => {
            const i = parseInt(index) - 1;
            return katilimcilar[i] || `Katılımcı ${index}`;
        });
        return text;
    };

    const handleAutoFill = (index: number) => {
        const agendaItemKey = gundemFields[index].madde;
        const defaultScenarios = ZUMRE_SENARYOLARI.find(item => item.agenda === agendaItemKey)?.scenarios || [];
        const userSavedScenarios = userScenarios?.zumre?.[agendaItemKey] || [];
        const communityScenarios = (sharedScenarios || []).filter(s => s.agendaKey === agendaItemKey).map(s => s.content);

        const allScenarios = [
            ...defaultScenarios.map(s => formatContent(s.content)),
            ...userSavedScenarios,
            ...communityScenarios
        ];
        
        const uniqueScenarios = Array.from(new Set(allScenarios));

        if (uniqueScenarios.length === 0) {
            toast({ title: 'Hata', description: 'Bu madde için senaryo bulunamadı.', variant: 'destructive'});
            return;
        }

        const currentContent = form.getValues(`gorusmeler.${index}.detay`);
        const currentIndex = uniqueScenarios.indexOf(currentContent);
        const nextIndex = (currentIndex + 1) % uniqueScenarios.length;
        const newContent = uniqueScenarios[nextIndex];
        
        form.setValue(`gorusmeler.${index}.detay`, newContent);
        toast({ title: 'Yeni Senaryo Oluşturuldu', description: `Madde ${index + 1} için farklı bir içerik eklendi.` });
    };

    const handleArchiveScenario = (index: number) => {
        const agendaItemKey = form.getValues(`gundemMaddeleri.${index}.madde`);
        const contentToSave = form.getValues(`gorusmeler.${index}.detay`);

        if (!contentToSave.trim()) {
            toast({ title: "Hata", description: "Arşive eklemek için metin boş olamaz.", variant: "destructive" });
            return;
        }

        setCoreDb(prev => {
            const newScenarios = { ...prev.userScenarios };
            if (!newScenarios.zumre) newScenarios.zumre = {};
            if (!newScenarios.zumre[agendaItemKey]) {
                newScenarios.zumre[agendaItemKey] = [];
            }
            if (!newScenarios.zumre[agendaItemKey].includes(contentToSave)) {
                newScenarios.zumre[agendaItemKey].push(contentToSave);
                toast({ title: "Arşive Eklendi", description: "Bu metin kişisel senaryo arşivinize kaydedildi." });
            } else {
                toast({ title: "Zaten Arşivde", description: "Bu metin zaten arşivinizde mevcut.", variant: "default" });
            }
            return { ...prev, userScenarios: newScenarios };
        });
    };
    
    const handleShareScenario = (index: number) => {
        const content = form.getValues(`gorusmeler.${index}.detay`);
        const agendaKey = form.getValues(`gundemMaddeleri.${index}.madde`);

        if (content && content.trim().length > 50) {
            const sharedScenario = {
                module: 'zumre',
                agendaKey: agendaKey,
                content: content,
                createdAt: new Date().toISOString()
            };
            addDocumentNonBlocking(collection(firestore, 'sharedScenarios'), sharedScenario);
        }
    };
    
    const handleSortEnd = () => { if(draggedItem.current !== null && draggedOverItem.current !== null) { moveGundem(draggedItem.current, draggedOverItem.current); moveGorusme(draggedItem.current, draggedOverItem.current); } draggedItem.current = null; draggedOverItem.current = null; };
    const handleScenarioSelect = (scenario: Scenario) => { if (activeGundemIndex !== null) { const formatted = formatContent(scenario.content); form.setValue(`gorusmeler.${activeGundemIndex}.detay`, formatted); } setIsScenarioModalOpen(false); };
    const openSaveArchiveDialog = () => { const data = form.getValues(); setSaveNameInput(`${data.academicYear} ${data.donem} - ${data.ders}`); setIsSaveNameDialogOpen(true); };
    const loadFromArchive = (doc: SavedDocument) => { form.reset(doc.data); setIsArchiveOpen(false); toast({ title: "Evrak Yüklendi" }); };
    const saveToArchive = () => { const newDoc: SavedDocument = { id: crypto.randomUUID(), name: saveNameInput || "İsimsiz Zümre", date: new Date().toLocaleDateString('tr-TR'), data: form.getValues() }; const newDocs = [newDoc, ...(zumreDocuments || [])]; setCoreDb(prev => ({...prev, zumreDocuments: newDocs})); setIsSaveNameDialogOpen(false); toast({ title: "Arşive Eklendi" }); };
    const deleteFromArchive = (e: React.MouseEvent, id: string) => { e.stopPropagation(); if (confirm("Bu evrağı arşivden silmek istediğinize emin misiniz?")) { const newDocs = (zumreDocuments || []).filter(d => d.id !== id); setCoreDb(prev => ({...prev, zumreDocuments: newDocs})); toast({ title: "Silindi" }); } };
    const toggleListening = (index: number) => { if (isListening === index) { setIsListening(null); return; } if (!('webkitSpeechRecognition' in window)) { toast({ title: "Hata", description: "Tarayıcınız sesle yazmayı desteklemiyor.", variant: "destructive" }); return; } setIsListening(index); const SpeechRecognition = (window as any).webkitSpeechRecognition; const recognition = new SpeechRecognition(); recognition.lang = 'tr-TR'; recognition.onresult = (event: any) => { const transcript = event.results[0][0].transcript; const currentText = form.getValues(`gorusmeler.${index}.detay`) || ""; form.setValue(`gorusmeler.${index}.detay`, currentText ? `${currentText} ${transcript}` : transcript, { shouldDirty: true }); toast({ title: "Anlaşıldı" }); }; recognition.onerror = () => toast({ title: "Ses Algılanamadı", variant: "destructive" }); recognition.onend = () => setIsListening(null); recognition.start(); };
    
    const handleAutoFillDecisions = () => {
        const decisions = VARSAYILAN_KARARLAR.map(k => formatContent(k)).join('\n');
        form.setValue('kararlar', decisions);
        toast({ title: 'Kararlar Dolduruldu', description: 'Varsayılan karar maddeleri eklendi.' });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 sm:p-6 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline"><Link href="/dashboard/teacher"><Home className="mr-2" />Evraklar Menüsü</Link></Button>
                    <div>
                        <h1 className="text-2xl font-headline flex items-center gap-2"><Users2 /> Zümre Toplantı Tutanağı</h1>
                        <p className="text-muted-foreground">{schoolInfo?.schoolName || "Okul bilgisi girilmemiş"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsArchiveOpen(true)}><History className="mr-2 h-4 w-4" /> Arşiv</Button>
                    <Button onClick={form.handleSubmit(handleExport)}><FileDown className="mr-2" /> Word İndir</Button>
                    <Button onClick={openSaveArchiveDialog} variant="secondary"> <Archive className="mr-2" /> Arşivle</Button>
                     <Button onClick={form.handleSubmit(handleSave)}> <Save className="mr-2" /> Taslağı Kaydet</Button>
                </div>
            </header>
            <main className="p-4 sm:p-6 md:p-8">
                <Form {...form}>
                    <form className="space-y-8">
                        <Card><CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <FormField control={form.control} name="academicYear" render={({ field }) => (<FormItem><FormLabel>Eğitim Yılı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="donem" render={({ field }) => (<FormItem><FormLabel>Dönem</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="1. Dönem Başı (Eylül)">1. Dönem Başı (Eylül)</SelectItem><SelectItem value="1. Dönem Ara (Kasım)">1. Dönem Ara (Kasım)</SelectItem><SelectItem value="2. Dönem Başı (Şubat)">2. Dönem Başı (Şubat)</SelectItem><SelectItem value="2. Dönem Ara (Nisan)">2. Dönem Ara (Nisan)</SelectItem><SelectItem value="Yıl Sonu (Haziran)">Yıl Sonu (Haziran)</SelectItem></SelectContent></Select></FormItem>)} />
                                <FormField control={form.control} name="schoolType" render={({ field }) => (<FormItem><FormLabel>Okul Türü</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="İlkokul">İlkokul</SelectItem><SelectItem value="Ortaokul">Ortaokul</SelectItem><SelectItem value="Anadolu Lisesi">Anadolu Lisesi</SelectItem><SelectItem value="Fen Lisesi">Fen Lisesi</SelectItem><SelectItem value="Meslek Lisesi">Meslek Lisesi</SelectItem><SelectItem value="İmam Hatip Lisesi">İmam Hatip Lisesi</SelectItem></SelectContent></Select></FormItem>)} />
                                <FormField control={form.control} name="ders" render={({ field }) => (<FormItem><FormLabel>Ders</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="tarih" render={({ field }) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="saat" render={({ field }) => (<FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="yer" render={({ field }) => (<FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="baskan" render={({ field }) => (<FormItem><FormLabel>Zümre Başkanı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="katilimcilar" render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Katılımcılar (Virgülle ayırın)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>
                        <Card><CardHeader><CardTitle>Gündem Maddeleri ve Görüşülmesi</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {gundemFields.map((item, index) => {
                                    const isExpanded = expandedIndex === index;
                                    return (
                                        <div key={item.id} className={cn("border rounded-lg bg-background transition-all duration-200 overflow-hidden")} draggable onDragStart={() => (draggedItem.current = index)} onDragEnter={() => (draggedOverItem.current = index)} onDragEnd={handleSortEnd} onDragOver={(e) => e.preventDefault()}>
                                            <div className={cn("flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50", isExpanded && "bg-accent/30 border-b")} onClick={() => setExpandedIndex(isExpanded ? null : index)}>
                                                <div className='flex items-center gap-3 flex-1 overflow-hidden'><GripVertical className="cursor-grab text-muted-foreground shrink-0" /><div className="flex items-center gap-2 flex-1 min-w-0"><span className="font-bold text-sm bg-muted text-muted-foreground w-6 h-6 flex items-center justify-center rounded-full shrink-0">{index + 1}</span><span className="font-medium truncate">{form.getValues(`gundemMaddeleri.${index}.madde`)}</span></div></div>
                                                <div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => { e.stopPropagation(); removeGundem(index); removeGorusme(index); }}><Trash2 className="h-4 w-4" /></Button>{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</div>
                                            </div>
                                            {isExpanded && (<div className="p-4 space-y-4"><FormField control={form.control} name={`gundemMaddeleri.${index}.madde`} render={({ field }) => (<FormItem><FormLabel>Gündem Maddesi</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name={`gorusmeler.${index}.detay`} render={({ field }) => (<FormItem><div className="flex justify-between items-center mb-2"><FormLabel>Görüşme Detayları</FormLabel><Button type="button" variant="ghost" size="sm" className={cn("h-7 px-2 text-xs", isListening === index && "text-red-600 bg-red-50 animate-pulse")} onClick={() => toggleListening(index)}>{isListening === index ? <MicOff className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}{isListening === index ? "Dinliyorum..." : "Sesle Yaz"}</Button></div><FormControl><Textarea className="min-h-[150px]" {...field} onBlur={() => handleShareScenario(index)} /></FormControl></FormItem>)} /><div className="flex gap-2 flex-wrap justify-end"><Button type="button" variant="outline" size="sm" onClick={() => handleArchiveScenario(index)}><BookmarkPlus className="mr-2 h-4 w-4" /> Kişisel Arşive Ekle</Button><Button type="button" variant="outline" size="sm" onClick={() => { setActiveGundemIndex(index); setIsScenarioModalOpen(true); }}><BookOpen className="mr-2 h-4 w-4" /> Hazır Senaryo</Button><Button type="button" variant="secondary" size="sm" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" onClick={() => handleAutoFill(index)}><Zap className="mr-2 h-4 w-4" /> Otomatik Doldur</Button></div></div>)}
                                        </div>
                                    );
                                })}
                                <Button type="button" variant="outline" className="w-full mt-4 border-dashed" onClick={() => { appendGundem({ madde: '' }); appendGorusme({ detay: '' }); }}><PlusCircle className="mr-2 h-4 w-4" /> Yeni Gündem Maddesi Ekle</Button>
                            </CardContent>
                        </Card>
                        <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Alınan Kararlar</CardTitle></div><Button type="button" variant="secondary" onClick={handleAutoFillDecisions}><ListChecks className="mr-2 h-4 w-4" /> Kararları Otomatik Doldur</Button></CardHeader><CardContent><FormField control={form.control} name="kararlar" render={({ field }) => (<FormItem><FormControl><Textarea rows={10} {...field} /></FormControl></FormItem>)} /></CardContent></Card>
                    </form>
                </Form>
                <Dialog open={isScenarioModalOpen} onOpenChange={setIsScenarioModalOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Hazır Senaryo Seç</DialogTitle><DialogDescription>"{activeGundemIndex !== null && gundemFields[activeGundemIndex]?.madde}" maddesi için bir senaryo seçin.</DialogDescription></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">{activeGundemIndex !== null && ZUMRE_SENARYOLARI.find(item => item.agenda === gundemFields[activeGundemIndex!].madde)?.scenarios.map((scenario, sIndex) => (<Card key={sIndex} className="flex flex-col"><CardHeader><CardTitle className="text-lg">Senaryo {sIndex + 1}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground flex-grow"><p>{scenario.description}</p></CardContent><CardFooter><Button onClick={() => handleScenarioSelect(scenario)} className="w-full">Bu Senaryoyu Kullan</Button></CardFooter></Card>))}</div></DialogContent></Dialog>
                <Dialog open={isSaveNameDialogOpen} onOpenChange={setIsSaveNameDialogOpen}><DialogContent><DialogHeader><DialogTitle>Zümreyi Arşivle</DialogTitle><DialogDescription>Bu evrağı daha sonra tekrar kullanmak için kaydedin.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="saveName">Evrak Adı</Label><Input id="saveName" value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} /></div><DialogFooter><Button onClick={saveToArchive}>Kaydet</Button></DialogFooter></DialogContent></Dialog>
                <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}><DialogContent className="max-w-4xl max-h-[80vh] flex flex-col"><DialogHeader><DialogTitle>Kayıtlı Zümre Arşivi</DialogTitle></DialogHeader><ScrollArea className="flex-1 pr-4">{(zumreDocuments || []).length === 0 ? <div className="text-center py-10"><Archive className="mx-auto h-12 w-12 opacity-20 mb-2" /><p>Arşiv boş.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{ (zumreDocuments || []).map((doc) => (<Card key={doc.id} className="group relative hover:border-primary cursor-pointer" onClick={() => loadFromArchive(doc)}><CardHeader className="pb-2"><CardTitle className="text-base truncate">{doc.name}</CardTitle><CardDescription>{doc.date}</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground pb-2"><div className="flex items-center gap-2"><FileText className="h-4 w-4" />{doc.data.ders} - {doc.data.donem}</div></CardContent><CardFooter className="pt-0 flex justify-between items-center opacity-0 group-hover:opacity-100"><span className="text-xs text-primary font-medium flex items-center gap-1"><FolderOpen className="h-3 w-3" /> Yükle</span><Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={(e) => deleteFromArchive(e, doc.id)}><Trash2 className="h-4 w-4" /></Button></CardFooter></Card>))}</div>}</ScrollArea></DialogContent></Dialog>
            </main>
        </div>
    );
}

// Bu dosyanın varsayılan dışa aktarımı TeacherDashboard içinde kullanılacağı için,
// doğrudan sayfa olarak değil, bir bileşen olarak yeniden düzenlenmesi gerekebilir.
// Şimdilik ana mantık korunmuştur.

    