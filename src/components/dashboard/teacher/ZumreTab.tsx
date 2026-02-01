'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Settings, Zap, Mic, MicOff, BookOpen, History, FolderOpen, FileText, FileSignature, Upload, FileSpreadsheet, Printer, Eye, Archive, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check, Wand2, ListChecks, X, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { generateMeetingAgendaItem } from '@/ai/flows/generate-meeting-agenda-item-flow';
import { generateMeetingDecisions } from '@/ai/flows/generate-meeting-decisions-flow';
import { Loader2 } from 'lucide-react';
import { SENARYOLAR, SABLONLAR, KARAR_HAVUZU, GUNDEM_MADDELERI_DEFAULT } from '@/lib/zumre-senaryolari';
import { TeacherProfile, ZumreDocument } from '@/lib/types';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// --- FORM SCHEMAS & TYPES ---
const formSchema = z.object({
    id: z.string(),
    okulAdi: z.string().optional(),
    academicYear: z.string().min(1, "Eğitim yılı gerekli"),
    donem: z.string().min(1, "Dönem gerekli"),
    sinif: z.string().min(1, "Zümre adı gerekli"), 
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

const VARSAYILAN_BRANSLAR = [
    "Zümre Başkanı", "Fizik Öğretmeni", "Kimya Öğretmeni", "Biyoloji Öğretmeni",
    "Matematik Öğretmeni", "Türk Dili ve Edebiyatı Öğretmeni", "Tarih Öğretmeni"
];
  
const tr = (text: string) => {
    if (!text) return '';
    let escapedText = text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
    const replacements: { [key: string]: string } = {
        'ı': "\\'fd", 'İ': "\\'dd", 'ş': "\\'fe", 'Ş': "\\'de",
        'ğ': "\\'f0", 'Ğ': "\\'d0", 'ü': "\\'fc", 'Ü': "\\'dc",
        'ö': "\\'f6", 'Ö': "\\'d6", 'ç': "\\'e7", 'Ç': "\\'c7",
    };

    for (const char in replacements) {
        escapedText = escapedText.replace(new RegExp(char, 'g'), replacements[char]);
    }
    return escapedText;
};

export default function ZumreTab({ teacherProfile }: { teacherProfile: TeacherProfile | null }) {
    const { db: localDb, setDb: setLocalDb } = useDatabase();
    const { zumreDocuments: archives = [] } = localDb;
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const [uiToasts, setUiToasts] = useState<{id: number, title: string, description: string, variant: string}[]>([]);
    
    const toast = ({ title, description, variant = "default" }: any) => {
        const id = Date.now();
        setUiToasts(prev => [...prev, { id, title, description, variant }]);
        setTimeout(() => setUiToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };

    const [isGenerating, setIsGenerating] = useState<number | null>(null);
    const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState("");

    const defaultValues = useMemo<FormData>(() => ({
        id: `zumre_${Date.now()}`,
        academicYear: '2025-2026',
        donem: "Sene Başı", 
        sinif: "", 
        tarih: new Date().toISOString().split('T')[0],
        saat: "15:00",
        yer: "Zümre Odası",
        mudurYardimcisi: teacherProfile?.principalName || "",
        sinifRehberOgretmeni: teacherProfile?.name || "",
        katilimcilar: VARSAYILAN_BRANSLAR.map(b => ({ brans: b, adSoyad: (b === "Zümre Başkanı" ? teacherProfile?.name : "") || '' })),
        gundemMaddeleri: GUNDEM_MADDELERI_DEFAULT.map(m => ({ madde: m })),
        gorusmeler: GUNDEM_MADDELERI_DEFAULT.map(() => ({ detay: '' })),
        kararlar: Object.values(KARAR_HAVUZU).slice(0,4).join('\n'),
        okulAdi: teacherProfile?.schoolName || "",
    }), [teacherProfile]);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({ control: form.control, name: "gundemMaddeleri" });
    const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({ control: form.control, name: "gorusmeler" });

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
        form.reset({
          ...defaultValues,
          id: `zumre_${Date.now()}`,
        });
    }, [form, defaultValues]);
    
    useEffect(() => {
        if (selectedRecordId) {
            const record = archives.find(r => r.id === selectedRecordId);
            if (record) {
                form.reset(record.data);
            }
        } else {
            handleNewRecord();
        }
    }, [selectedRecordId, archives, form, handleNewRecord]);
    
    const handleAutoFill = async (index: number) => {
        const agendaTitle = form.getValues(`gundemMaddeleri.${index}.madde`).trim();
        if (!agendaTitle) {
          toast({ title: 'Hata', description: 'Lütfen önce gündem maddesi başlığını girin.', variant: 'destructive' });
          return;
        }
        setIsGenerating(index);
        try {
          const response = await generateMeetingAgendaItem({
            meetingType: 'Zümre',
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
    
    const handleGenerateDecisions = async () => {
        const agendaItems = form.getValues('gundemMaddeleri').map(item => item.madde);
        if (agendaItems.length === 0 || agendaItems.every(item => !item.trim())) {
            toast({ title: 'Hata', description: 'Lütfen önce gündem maddelerini girin.', variant: 'destructive' });
            return;
        }
        setIsGeneratingDecisions(true);
        try {
            const response = await generateMeetingDecisions({
                meetingType: 'Zümre',
                agendaItems,
            });
            if (response.generatedDecisions) {
                form.setValue('kararlar', response.generatedDecisions, { shouldDirty: true });
                toast({ title: 'Kararlar Oluşturuldu', description: 'Alınan kararlar metni yapay zeka ile dolduruldu.', variant: 'success' });
            }
        } catch (error) {
            console.error("AI Decisions Error:", error);
            toast({ title: 'Yapay Zeka Hatası', description: 'Kararlar oluşturulurken bir hata oluştu.', variant: 'destructive' });
        } finally {
            setIsGeneratingDecisions(false);
        }
    };
    
    const openSaveDialog = () => {
        const vals = form.getValues();
        setSaveNameInput(selectedRecordId ? archives.find(r => r.id === selectedRecordId)?.name || `${vals.academicYear} - ${vals.sinif} Zümresi` : `${vals.academicYear} - ${vals.sinif} Zümresi`);
        setIsSaveDialogOpen(true);
    };

    const handleSaveToArchive = () => {
        if (!saveNameInput.trim()) return;
        const currentData = form.getValues();
        const docId = currentData.id || `zumre_${Date.now()}`;
        form.setValue('id', docId);

        const newDoc: ZumreDocument = {
            id: docId,
            name: saveNameInput,
            date: new Date().toLocaleDateString('tr-TR'),
            data: form.getValues(),
        };
        
        setLocalDb(prev => {
            const existingIndex = (prev.zumreDocuments || []).findIndex(r => r.id === newDoc.id);
            const newArchives = [...(prev.zumreDocuments || [])];
            if (existingIndex > -1) {
                newArchives[existingIndex] = newDoc;
            } else {
                newArchives.unshift(newDoc);
            }
            return { ...prev, zumreDocuments: newArchives };
        });
        
        setIsSaveDialogOpen(false);
        setSelectedRecordId(newDoc.id);
        toast({ title: "Arşivlendi", description: "Tutanak başarıyla kaydedildi.", variant: "success" });
    };

    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({
            ...prev,
            zumreDocuments: (prev.zumreDocuments || []).filter(r => r.id !== selectedRecordId)
        }));
        handleNewRecord();
        toast({ title: 'Silindi', description: 'Tutanak arşivden silindi.', variant: 'destructive' });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);
    
    const draggedItem = useRef<number | null>(null);
    const draggedOverItem = useRef<number | null>(null);
    
    const handleSortEnd = () => {
        if(draggedItem.current !== null && draggedOverItem.current !== null) {
             moveGundem(draggedItem.current, draggedOverItem.current);
             moveGorusme(draggedItem.current, draggedOverItem.current);
        }
        draggedItem.current = null; draggedOverItem.current = null;
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
          <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Zümre Tutanağı</title>
          <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; } .container { width: 90%; margin: auto; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 5px; }</style>
          </head><body><div class="container">
              <h3 style="text-align: center;">T.C.<br/>${data.okulAdi ? tr(data.okulAdi.toLocaleUpperCase('tr-TR')) : '...................... MÜDÜRLÜĞÜ'}<br/>${tr(data.academicYear)} EĞİTİM-ÖĞRETİM YILI ${tr(data.sinif.toLocaleUpperCase('tr-TR'))} ZÜMRESİ<br/>${tr(data.donem.toLocaleUpperCase('tr-TR'))} ZÜMRE ÖĞRETMENLER KURULU TOPLANTI TUTANAĞI</h3>
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
                  <p>UYGUNDUR<br/>${formattedDate}<br/>Okul Müdürü</p>
              </div>
          </div></body></html>
        `;
    };

    const handleExport = () => {
        const content = generateDocumentHTML(form.getValues());
        const filename = `Zumre_Tutanagi_${form.getValues('sinif')}.doc`;
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "İndiriliyor", description: "Word dosyası oluşturuldu.", variant: "success" });
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 relative font-sans">
             <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur-sm px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-700"><Users2 className="h-6 w-6" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Zümre Tutanak Modülü</h1>
                        <p className="text-xs text-slate-500">Zümre Öğretmenler Kurulu Tutanakları</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={openSaveDialog} variant="outline"><Save className="mr-2 h-4 w-4"/> Arşive Kaydet</Button>
                    <Button onClick={handleExport} className="bg-purple-600 hover:bg-purple-700 text-white"><FileDown className="mr-2 h-4 w-4"/> Word</Button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-6 grid md:grid-cols-4 gap-8">
                 <div className="md:col-span-1 space-y-4">
                    <RecordManager
                        records={(archives || []).map(r => ({ id: r.id, name: r.name }))}
                        selectedRecordId={selectedRecordId}
                        onSelectRecord={setSelectedRecordId}
                        onNewRecord={handleNewRecord}
                        onDeleteRecord={handleDeleteRecord}
                        noun="Zümre Tutanağı"
                    />
                </div>
                <div className="md:col-span-3">
                    <Form {...form}>
                        <form className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="okulAdi" render={({ field }: any) => (<FormItem><FormLabel>Okul Adı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="academicYear" render={({ field }: any) => (<FormItem><FormLabel>Eğitim Yılı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="donem" render={({ field }: any) => (<FormItem><FormLabel>Dönem</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="sinif" render={({ field }: any) => (<FormItem><FormLabel>Zümre Adı</FormLabel><FormControl><Input placeholder="örn: Fizik Zümresi" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="tarih" render={({ field }: any) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="saat" render={({ field }: any) => (<FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="yer" render={({ field }: any) => (<FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="sinifRehberOgretmeni" render={({ field }: any) => (<FormItem><FormLabel>Zümre Başkanı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="mudurYardimcisi" render={({ field }: any) => (<FormItem><FormLabel>Onaylayan</FormLabel><FormControl><Input placeholder="Okul Müdürü / Müdür Yrd." {...field} /></FormControl></FormItem>)} />
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
                                                <Textarea {...form.register(`gorusmeler.${index}.detay`)} className="min-h-[100px]" placeholder="Görüşme detayları..." />
                                                <Button type="button" variant="secondary" size="sm" onClick={() => handleAutoFill(index)} disabled={isGenerating === index} className="absolute bottom-2 right-2">
                                                    {isGenerating === index ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Wand2 className="mr-2 h-3 w-3"/>}
                                                    Doldur
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" className="w-full" onClick={() => { appendGundem({ madde: '' }); appendGorusme({ detay: '' }); }}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Madde Ekle</Button>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Alınan Kararlar</CardTitle>
                                        <Button type="button" variant="secondary" size="sm" onClick={handleGenerateDecisions} disabled={isGeneratingDecisions}>
                                            {isGeneratingDecisions ? <Loader2 className="mr-2 h-3 w-3 animate-spin"/> : <Wand2 className="mr-2 h-3 w-3"/>}
                                            AI ile Doldur
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea {...form.register('kararlar')} rows={6} className="font-mono text-sm" />
                                </CardContent>
                            </Card>
                        </form>
                    </Form>
                </div>
            </main>
        </div>
    );
}