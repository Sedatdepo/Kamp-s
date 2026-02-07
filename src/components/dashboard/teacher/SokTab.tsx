'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Wand2, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { generateMeetingAgendaItem } from '@/ai/flows/generate-meeting-agenda-item-flow';
import { generateMeetingDecisions } from '@/ai/flows/generate-meeting-decisions-flow';
import { Loader2 } from 'lucide-react';
import { TeacherProfile, SokDocument } from '@/lib/types';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { useToast } from '@/hooks/use-toast';

// --- FORM SCHEMAS & TYPES ---
const formSchema = z.object({
    id: z.string(),
    okulAdi: z.string().optional(),
    academicYear: z.string().min(1, "Eğitim yılı gerekli"),
    donem: z.string().min(1, "Dönem gerekli"),
    sinif: z.string().min(1, "Sınıf/Şube gerekli"),
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

const SOK_GUNDEM_MADDELERI = [
    "Açılış ve yoklama.",
    "Bir önceki toplantı tutanaklarının okunması ve değerlendirilmesi.",
    "Öğrencilerin başarı durumlarının dersler bazında incelenmesi.",
    "Öğrencilerin devam-devamsızlık, disiplin ve rehberlik ihtiyaçlarının görüşülmesi.",
    "Sosyal, kültürel ve sportif faaliyetlerin planlanması.",
    "Alınan kararların okunması.",
    "Dilek ve temenniler.",
    "Kapanış."
];

const VARSAYILAN_KATILIMCILAR = [
    "Müdür Yardımcısı", "Rehber Öğretmen", "Türk Dili ve Edebiyatı", "Matematik", "Fizik", "Kimya",
    "Biyoloji", "Tarih", "Coğrafya", "Din Kültürü ve Ahlak Bilgisi", "İngilizce"
];

export default function SokTab({ teacherProfile }: { teacherProfile: TeacherProfile | null }) {
    const { db: localDb, setDb: setLocalDb } = useDatabase();
    const { sokDocuments: archives = [] } = localDb;
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const { toast } = useToast();

    const [isGenerating, setIsGenerating] = useState<number | null>(null);
    const [isGeneratingDecisions, setIsGeneratingDecisions] = useState(false);

    const defaultValues = useMemo<FormData>(() => ({
        id: `sok_${Date.now()}`,
        academicYear: '2025-2026',
        donem: "Sene Başı",
        sinif: "",
        tarih: new Date().toISOString().split('T')[0],
        saat: "15:00",
        yer: "Öğretmenler Odası",
        mudurYardimcisi: teacherProfile?.principalName || "",
        sinifRehberOgretmeni: teacherProfile?.name || "",
        katilimcilar: VARSAYILAN_KATILIMCILAR.map(b => ({ brans: b, adSoyad: (b === "Rehber Öğretmen" ? teacherProfile?.guidanceCounselorName : "") || '' })),
        gundemMaddeleri: SOK_GUNDEM_MADDELERI.map(m => ({ madde: m })),
        gorusmeler: SOK_GUNDEM_MADDELERI.map(() => ({ detay: '' })),
        kararlar: "",
        okulAdi: teacherProfile?.schoolName || "",
    }), [teacherProfile]);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });
    
    const { fields: katilimciFields, append: appendKatilimci, remove: removeKatilimci } = useFieldArray({ control: form.control, name: "katilimcilar" });
    const { fields: gundemFields, append: appendGundem, remove: removeGundem, move: moveGundem } = useFieldArray({ control: form.control, name: "gundemMaddeleri" });
    const { fields: gorusmeFields, append: appendGorusme, remove: removeGorusme, move: moveGorusme } = useFieldArray({ control: form.control, name: "gorusmeler" });

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
        form.reset({
          ...defaultValues,
          id: `sok_${Date.now()}`,
        });
    }, [form, defaultValues]);
    
    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({
            ...prev,
            sokDocuments: (prev.sokDocuments || []).filter(r => r.id !== selectedRecordId)
        }));
        handleNewRecord();
        toast({ title: 'Silindi', description: 'Tutanak arşivden silindi.', variant: 'destructive' });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

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
    
    const onSubmit = (values: FormData) => {
        const docId = values.id || `sok_${Date.now()}`;
        if (!values.id) {
            form.setValue('id', docId);
            values.id = docId;
        }

        const newDoc: SokDocument = {
            id: docId,
            name: `${values.academicYear} - ${values.sinif} ŞÖK Toplantısı`,
            date: new Date().toLocaleDateString('tr-TR'),
            data: values,
        };

        setLocalDb(prev => {
            const existingIndex = (prev.sokDocuments || []).findIndex(r => r.id === docId);
            const newArchives = [...(prev.sokDocuments || [])];
            if (existingIndex > -1) {
                newArchives[existingIndex] = newDoc;
            } else {
                newArchives.unshift(newDoc);
            }
            return { ...prev, sokDocuments: newArchives };
        });

        setSelectedRecordId(docId);
        toast({ title: "Kaydedildi", description: "Tutanak başarıyla kaydedildi.", variant: "success" });
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
    
    const handleGenerateDecisions = async () => {
        const agendaItems = form.getValues('gundemMaddeleri').map(item => item.madde);
        if (agendaItems.length === 0 || agendaItems.every(item => !item.trim())) {
            toast({ title: 'Hata', description: 'Lütfen önce gündem maddelerini girin.', variant: 'destructive' });
            return;
        }
        setIsGeneratingDecisions(true);
        try {
            const response = await generateMeetingDecisions({
                meetingType: 'ŞÖK',
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
                <div style="text-indent: 0; margin-top: 5px;">${(data.gorusmeler[index]?.detay || 'Görüşülmedi.')}</div>
            </div>
        `).join('');
        const kararlarHtml = data.kararlar.split('\n').map(karar => `<p style="margin: 0; padding: 2px 0;">${karar}</p>`).join('');
        
        return `
          <!DOCTYPE html><html><head><meta charset="UTF-8"><title>ŞÖK Tutanağı</title>
          <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; } .container { width: 90%; margin: auto; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 5px; }</style>
          </head><body><div class="container">
              <h3 style="text-align: center;">T.C.<br/>${data.okulAdi ? data.okulAdi.toLocaleUpperCase('tr-TR') : '...................... MÜDÜRLÜĞÜ'}<br/>${data.academicYear} EĞİTİM-ÖĞRETİM YILI ${data.sinif} SINIFI<br/>${data.donem.toLocaleUpperCase('tr-TR')} ŞUBE ÖĞRETMENLER KURULU TOPLANTI TUTANAĞI</h3>
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
        const filename = `SOK_Tutanagi_${form.getValues('sinif')}.doc`;
        const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
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
                    <div className="bg-red-100 p-2 rounded-lg text-red-700"><Users className="h-6 w-6" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">ŞÖK Tutanak Modülü</h1>
                        <p className="text-xs text-slate-500">Şube Öğretmenler Kurulu Tutanakları</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" form="sok-form"><Save className="mr-2 h-4 w-4"/> Kaydet</Button>
                    <Button onClick={handleExport} className="bg-red-600 hover:bg-red-700 text-white"><FileDown className="mr-2 h-4 w-4"/> Word</Button>
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
                        noun="ŞÖK Tutanağı"
                    />
                </div>
                <div className="md:col-span-3">
                     <Form {...form}>
                         <form id="sok-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Toplantı Bilgileri</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="okulAdi" render={({ field }: any) => (<FormItem><FormLabel>Okul Adı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="academicYear" render={({ field }: any) => (<FormItem><FormLabel>Eğitim Yılı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="donem" render={({ field }: any) => (<FormItem><FormLabel>Dönem</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="sinif" render={({ field }: any) => (<FormItem><FormLabel>Sınıf/Şube</FormLabel><FormControl><Input placeholder="örn: 9/A" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="tarih" render={({ field }: any) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="saat" render={({ field }: any) => (<FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="yer" render={({ field }: any) => (<FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="sinifRehberOgretmeni" render={({ field }: any) => (<FormItem><FormLabel>Toplantı Başkanı</FormLabel><FormControl><Input placeholder="Sınıf Rehber Öğretmeni" {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="mudurYardimcisi" render={({ field }: any) => (<FormItem><FormLabel>Onaylayan</FormLabel><FormControl><Input placeholder="Okul Müdürü / Müdür Yrd." {...field} /></FormControl></FormItem>)} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Katılımcı Öğretmenler</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {katilimciFields.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <Input {...form.register(`katilimcilar.${index}.brans`)} placeholder="Branş" />
                                            <Input {...form.register(`katilimcilar.${index}.adSoyad`)} placeholder="Ad Soyad" />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeKatilimci(index)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={() => appendKatilimci({ brans: '', adSoyad: ''})}><PlusCircle className="mr-2 h-4 w-4"/> Katılımcı Ekle</Button>
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
