'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, 
  FileText, 
  Save, 
  Trash2, 
  Edit, 
  Download, 
  Plus, 
  CheckSquare, 
  Square,
  School,
  X,
  Calendar,
  Search,
  PlusCircle,
  Eye,
  FileDown,
  ToggleLeft,
  ToggleRight,
  FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/hooks/use-database';
import { TeacherProfile, DilekceDocument } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import { exportDilekceToRtf } from '@/lib/word-export';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const ilgiSchema = z.object({ value: z.string() });
const ekSchema = z.object({ value: z.string() });

const formSchema = z.object({
  id: z.string(),
  kurum: z.string().default('T.C.'),
  kaymakamlik: z.string().default('KAYMAKAMLIĞI'),
  mudurluk: z.string().default('İlçe Milli Eğitim Müdürlüğü'),
  sayi: z.string().optional(),
  konu: z.string().optional(),
  tarih: z.string(),
  muhatap: z.string().min(1, "Makam adı zorunludur."),
  muhatap_detay: z.string().optional(),
  ilgiler: z.array(ilgiSchema),
  metin: z.string().min(1, "Dilekçe metni boş olamaz."),
  kapanis: z.string().default('Gereğini arz ederim.'),
  imza_ad_soyad: z.string(),
  imza_unvan: z.string(),
  ekler: z.array(ekSchema),
  dagitim_geregi: z.string().optional(),
  dagitim_bilgi: z.string().optional(),
});
                                
type FormData = z.infer<typeof formSchema>;

const getDilekceSablonlari = (teacherProfile: TeacherProfile | null) => [
  {
      label: "Mazeret İzni Dilekçesi",
      template: {
          konu: "Mazeret İzni Talebi",
          metin: `Okulunuzda ${teacherProfile?.branch || '_____'} öğretmeni olarak görev yapmaktayım. .../.../.... tarihinde ortaya çıkan özel bir mazeretim (sağlık sorunu, ailevi durum vb.) nedeniyle görevime devam edemeyeceğim. \n\nBelirtilen tarihte bir (1) gün süreyle mazeret izinli sayılmam hususunda gereğini bilgilerinize arz ederim.`,
      },
  },
  {
      label: "Okul Gezisi İzni",
      template: {
          konu: "Sosyal Etkinlik (Gezi) İzni",
          metin: `Okulumuz öğrencileri ile birlikte, ders dışı sosyal etkinlikler çerçevesinde, .../.../.... tarihinde saat ...:...'da .................................. adresinde bulunan ..................................'ne (müze, bilim merkezi, tarihi yer vb.) bir eğitim gezisi düzenlemek istiyoruz. \n\nGezi için gerekli güvenlik tedbirleri alınacak olup, veli izin belgeleri ekte sunulacaktır. Söz konusu gezi için gerekli izinlerin verilmesini arz ederim.`,
          ekler: [{ value: 'Veli İzin Belgeleri Listesi' }],
      },
  },
  {
      label: "Hizmet İçi Eğitim / Seminer Başvurusu",
      template: {
          konu: "Hizmet İçi Eğitim Talebi",
          metin: `Bakanlığımızca/Müdürlüğünüzce .../.../.... tarihinde düzenlenecek olan ".................................." konulu hizmet içi eğitim faaliyetine katılmak istiyorum. \n\nSöz konusu eğitime katılmam için gerekli iznin verilmesi hususunda gereğini arz ederim.`,
      },
  },
  {
      label: "Veli Toplantısı Tarihi Bildirimi",
      template: {
          konu: "Veli Toplantısı Tarihi",
          metin: `${teacherProfile?.reportConfig?.academicYear || '....-....'} Eğitim-Öğretim Yılı 1. Dönem veli toplantısını, aşağıdaki gündem maddelerini görüşmek üzere .../.../.... tarihinde saat ...:...'da okulumuzun ............ numaralı dersliğinde yapmak istiyorum.\n\nGereğini bilgilerinize arz ederim.\n\nGÜNDEM:\n1. Açılış ve yoklama\n2. Öğrenci başarı durumlarının genel değerlendirmesi\n3. Devam-devamsızlık ve kılık-kıyafet durumları\n4. Dilek ve temenniler`,
      },
  },
  {
      label: "Materyal Talebi",
      template: {
          konu: "Ders Materyali Talebi",
          metin: `Sorumlu olduğum sınıflarda yürüttüğüm ...................... dersi kapsamında, öğrencilerin konuyu daha iyi anlamalarını ve somut deneyimler yaşamalarını sağlamak amacıyla aşağıda belirtilen materyallere ihtiyaç duyulmaktadır.\n\n- .........................................\n- .........................................\n\nSöz konusu materyallerin temin edilmesi hususunda gereğini arz ederim.`,
      },
  },
  {
      label: "Arıza Bildirimi",
      template: {
          konu: "Arızalı Donanım Bildirimi",
          metin: `Sorumlu olduğum derslikte/laboratuvarda bulunan akıllı tahtanın/projeksiyon cihazının ............ bölümü .../.../.... tarihinden beri çalışmamaktadır. Derslerin teknoloji destekli olarak daha verimli işlenebilmesi için söz konusu arızanın giderilmesi hususunda gereğini arz ederim.`,
      },
  },
  {
      label: "Rehberliğe Öğrenci Yönlendirme",
      template: {
          konu: "Öğrenci Yönlendirme",
          metin: `Okulumuz ........ sınıfı, ........ numaralı öğrencisi ...............................'nin gözlemlenen akademik/davranışsal sorunları nedeniyle rehberlik servisi tarafından değerlendirilmesine ihtiyaç duyulmaktadır.\n\nÖğrencinin durumunun incelenmesi ve gerekli desteğin sağlanması için gereğini arz ederim.`,
      },
  },
  {
      label: "Egzersiz/Kurs Açma Talebi",
      template: {
          konu: "Egzersiz Çalışması Talebi",
          metin: `${teacherProfile?.reportConfig?.academicYear || '....-....'} Eğitim-Öğretim yılında, öğrencilerimizin sosyal ve zihinsel gelişimlerine katkı sağlamak amacıyla okulumuzda "........................ (örn: Satranç, Robotik Kodlama)" egzersiz çalışması açmak istiyorum.\n\nEgzersiz planı ekte sunulmuştur. Gerekli onayın verilmesini arz ederim.`,
          ekler: [{ value: 'Egzersiz Çalışma Planı' }],
      },
  },
];


const DilekcePreview = ({ data, showOfficialFields }: { data: FormData, showOfficialFields: boolean }) => {
    const ilgiList = data.ilgiler?.filter(i => i.value) || [];
    const eklerList = data.ekler?.filter(e => e.value) || [];

    return (
        <div className="bg-white p-8 md:p-12 shadow-lg aspect-[210/297] w-full h-auto overflow-y-auto font-[Times] text-black">
            <div className="text-center text-xs space-y-0.5">
                <p>{data.kurum || 'T.C.'}</p>
                <p>{data.kaymakamlik || 'KAYMAKAMLIĞI'}</p>
                <p>{data.mudurluk || 'İlçe Milli Eğitim Müdürlüğü'}</p>
            </div>
            
            <div className={cn("flex text-xs mt-5", showOfficialFields ? "justify-between" : "justify-end")}>
                {showOfficialFields && (
                    <div className="space-y-1">
                        <p>Sayı&nbsp;&nbsp;&nbsp;: {data.sayi || '.....................'}</p>
                        <p>Konu&nbsp;&nbsp;: {data.konu || '.....................'}</p>
                    </div>
                )}
                <div className="text-right">
                    <p>{data.tarih || 'dd.mm.yyyy'}</p>
                </div>
            </div>

            <div className="text-center font-bold uppercase mt-10 mb-6 text-sm">
                <p>{data.muhatap || 'İLGİLİ MAKAMA'}</p>
                {data.muhatap_detay && <p className="normal-case text-xs">({data.muhatap_detay})</p>}
            </div>

            {ilgiList.length > 0 && (
                <div className="text-xs mb-4">
                    {ilgiList.map((ilgi, index) => (
                        <p key={index} className="pl-12 -indent-6">İlgi: {String.fromCharCode(97 + index)}) {ilgi.value}</p>
                    ))}
                </div>
            )}
            
            <div 
                className="text-xs text-justify indent-10 leading-relaxed whitespace-pre-wrap"
                style={{ lineHeight: '1.5' }}
            >
                {data.metin || 'Dilekçe metni buraya gelecek...'}
            </div>

            <div className="text-right text-xs mt-6">
                <p>{data.kapanis || 'Gereğini arz ederim.'}</p>
            </div>

            <div className="text-right text-xs mt-10">
                <p className="h-10">(İmza)</p>
                <p className="font-bold">{data.imza_ad_soyad || 'Ad Soyad'}</p>
                <p>{data.imza_unvan || 'Unvan'}</p>
            </div>

            {(eklerList.length > 0 || data.dagitim_geregi || data.dagitim_bilgi) && (
                <div className="text-xs mt-5">
                    {eklerList.length > 0 && (
                        <div className="mb-3">
                            <p className="font-bold">EKLER:</p>
                            {eklerList.map((ek, index) => <p key={index}>{index + 1}. {ek.value}</p>)}
                        </div>
                    )}
                    {(data.dagitim_geregi || data.dagitim_bilgi) && (
                        <div style={{marginTop: '10px'}}>
                            <p className="font-bold">DAĞITIM:</p>
                            {data.dagitim_geregi && <p className="whitespace-pre-wrap">Gereği:<br/>{data.dagitim_geregi}</p>}
                            {data.dagitim_bilgi && <p className="mt-1 whitespace-pre-wrap">Bilgi:<br/>{data.dagitim_bilgi}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export function DilekceTab({ teacherProfile }: { teacherProfile: TeacherProfile | null }) {
  const { db, setDb, loading } = useDatabase();
  const { dilekceDocuments = [] } = db;
  const { toast } = useToast();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showOfficialFields, setShowOfficialFields] = useState(false);

  const defaultFormValues: FormData = useMemo(() => ({
      id: `dilekce_${Date.now()}`,
      tarih: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      kurum: 'T.C.',
      kaymakamlik: teacherProfile?.reportConfig?.schoolName?.split(' ')[0] ? `${teacherProfile.reportConfig.schoolName.split(' ')[0]} KAYMAKAMLIĞI` : '... KAYMAKAMLIĞI',
      mudurluk: 'İlçe Milli Eğitim Müdürlüğü',
      ilgiler: [],
      ekler: [],
      imza_ad_soyad: teacherProfile?.name || '',
      imza_unvan: teacherProfile?.branch ? `${teacherProfile.branch} Öğretmeni` : 'Öğretmen',
      muhatap: `${teacherProfile?.schoolName || 'Okul'} Müdürlüğüne`,
      sayi: '',
      konu: '',
      metin: '',
      kapanis: 'Gereğini arz ederim.',
      muhatap_detay: '',
      dagitim_geregi: '',
      dagitim_bilgi: '',
  }), [teacherProfile]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });
  
  useEffect(() => {
    const recordData = dilekceDocuments.find(r => r.id === selectedRecordId);
    if (recordData) {
      form.reset(recordData.data);
    } else {
      form.reset(defaultFormValues);
    }
  }, [selectedRecordId, dilekceDocuments, form, defaultFormValues]);
  
  const onSubmit = (values: FormData) => {
    setDb(prevDb => {
        const existingRecordIndex = (prevDb.dilekceDocuments || []).findIndex(r => r.id === values.id);
        const updatedRecords = [...(prevDb.dilekceDocuments || [])];

        if (existingRecordIndex > -1) {
          updatedRecords[existingRecordIndex] = { ...updatedRecords[existingRecordIndex], data: values, name: values.konu || 'İsimsiz Dilekçe' };
        } else {
            const newRecord: DilekceDocument = {
                id: values.id,
                name: values.konu || `Dilekçe - ${values.tarih}`,
                date: new Date().toLocaleDateString('tr-TR'),
                data: values,
            };
            updatedRecords.push(newRecord);
        }
        return { ...prevDb, dilekceDocuments: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Dilekçe başarıyla kaydedildi.' });
  };

  const handleNewRecord = useCallback(() => {
    const newId = `dilekce_${Date.now()}`;
    setSelectedRecordId(null);
    form.reset({
      ...defaultFormValues,
      id: newId,
    });
  }, [form, defaultFormValues]);

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setDb(prevDb => ({
        ...prevDb,
        dilekceDocuments: (prevDb.dilekceDocuments || []).filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Dilekçe arşivden silindi.', variant: 'destructive' });
  }, [selectedRecordId, setDb, handleNewRecord, toast]);
  
  const watchedData = form.watch();
  const dilekceSablonlari = useMemo(() => getDilekceSablonlari(teacherProfile), [teacherProfile]);

  const { fields: ilgiFields, append: appendIlgi, remove: removeIlgi } = useFieldArray({ control: form.control, name: "ilgiler" });
  const { fields: ekFields, append: appendEk, remove: removeEk } = useFieldArray({ control: form.control, name: "ekler" });

  const handleExport = (data: FormData) => {
    exportDilekceToRtf(data);
  };
  
  const handleTemplateSelect = (templateValue: string) => {
    if (!templateValue) return;
    const selectedTemplate = dilekceSablonlari.find(t => t.label === templateValue);
    if (selectedTemplate) {
      const currentValues = form.getValues();
      form.reset({
        ...currentValues,
        konu: selectedTemplate.template.konu,
        metin: selectedTemplate.template.metin,
        ekler: selectedTemplate.template.ekler || [],
      });
      toast({ title: "Şablon Uygulandı", description: `"${selectedTemplate.label}" şablonu forma yüklendi.` });
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 sm:p-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-headline flex items-center gap-2"><FileSignature /> Dilekçe Sihirbazı</h1>
            <p className="text-muted-foreground">{teacherProfile?.schoolName || 'Okul Bilgisi Yükleniyor'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={() => handleExport(form.getValues())}><FileDown className="mr-2" /> Word İndir</Button>
            <Button onClick={form.handleSubmit(onSubmit)}><Save className="mr-2"/> Kaydet</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RecordManager
                  records={(dilekceDocuments || []).map(r => ({ id: r.id, name: r.name }))}
                  selectedRecordId={selectedRecordId}
                  onSelectRecord={setSelectedRecordId}
                  onNewRecord={handleNewRecord}
                  onDeleteRecord={handleDeleteRecord}
                  noun="Dilekçe"
              />
              <Card>
                  <CardHeader>
                      <CardTitle>Hızlı Başlangıç</CardTitle>
                      <CardDescription>Sık kullandığınız dilekçe türünü seçerek formu doldurun.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Select onValueChange={handleTemplateSelect}>
                          <SelectTrigger className="w-full">
                              <SelectValue placeholder="Bir dilekçe şablonu seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                              {dilekceSablonlari.map(sablon => (
                                  <SelectItem key={sablon.label} value={sablon.label}>
                                      {sablon.label}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </CardContent>
              </Card>
            </div>

            <Form {...form}>
            <form className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Dilekçe Üst Bilgileri</CardTitle>
                    <CardDescription>Resmi yazılar için "Sayı" ve "Konu" alanlarını aktif edebilirsiniz.</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowOfficialFields(!showOfficialFields)}>
                    {showOfficialFields ? <ToggleRight className="mr-2 text-primary" /> : <ToggleLeft className="mr-2" />}
                    Resmi Alanlar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name="kurum" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kurum</FormLabel><FormControl><Input placeholder="T.C." {...field} /></FormControl></FormItem>)} />
                    <FormField name="kaymakamlik" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kaymakamlık</FormLabel><FormControl><Input placeholder="KAYMAKAMLIĞI" {...field} /></FormControl></FormItem>)} />
                    <FormField name="mudurluk" control={form.control} render={({ field }) => (<FormItem><FormLabel>Müdürlük</FormLabel><FormControl><Input placeholder="İlçe Milli Eğitim Müdürlüğü" {...field} /></FormControl></FormItem>)} />
                  </div>
                  <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-300", showOfficialFields ? "max-h-40 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
                    <FormField name="sayi" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sayı</FormLabel><FormControl><Input placeholder="....................." {...field} /></FormControl></FormItem>)} />
                    <FormField name="konu" control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Konu</FormLabel><FormControl><Input placeholder="....................." {...field} /></FormControl></FormItem>)} />
                  </div>
                  <div className="md:w-1/3">
                    <FormField name="tarih" control={form.control} render={({ field }) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                  </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Muhatap Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="muhatap" control={form.control} render={({ field }) => (<FormItem><FormLabel>Muhatap Makamı</FormLabel><FormControl><Input placeholder="OKUL MÜDÜRLÜĞÜNE" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField name="muhatap_detay" control={form.control} render={({ field }) => (<FormItem><FormLabel>Muhatap Detayı (varsa)</FormLabel><FormControl><Input placeholder="Bölge İşle Birimi vb." {...field} /></FormControl></FormItem>)} />
                    </div>
                    
                    <div>
                        <Label>İlgiler (Gerekiyorsa)</Label>
                        {ilgiFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-center mt-2">
                              <FormField control={form.control} name={`ilgiler.${index}.value`} render={({ field }) => (<FormControl><Input placeholder={`${String.fromCharCode(97 + index)}. İlgi ve ... ile yazı`} {...field} /></FormControl>)} />
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeIlgi(index)}><Trash2 /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendIlgi({ value: '' })} className="mt-2"><PlusCircle className="mr-2"/>İlgi Ekle</Button>
                    </div>

                    <FormField name="metin" control={form.control} render={({ field }) => (<FormItem><FormLabel>Dilekçe Metni</FormLabel><FormControl><Textarea rows={8} placeholder="Okulumuz... " {...field} /></FormControl><FormMessage/></FormItem>)} />
                    
                      <FormField control={form.control} name="kapanis" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kapanış İfadesi</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Gereğini arz ederim." />
                              </SelectTrigger>
                            </FormControl>
                              <SelectContent>
                                  <SelectItem value="Gereğini arz ederim.">Gereğini arz ederim.</SelectItem>
                                  <SelectItem value="Bilgilerinizi arz ederim.">Bilgilerinizi arz ederim.</SelectItem>
                                  <SelectItem value="Gereğini rica ederim.">Gereğini rica ederim.</SelectItem>
                                  <SelectItem value="Bilgilerinizi rica ederim.">Bilgilerinizi rica ederim.</SelectItem>
                                  <SelectItem value="Arz ve rica ederim.">Arz ve rica ederim.</SelectItem>
                              </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                </CardContent>
            </Card>
              
            <Card>
                <CardHeader><CardTitle>İmza ve Ekler</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="imza_ad_soyad" control={form.control} render={({ field }) => (<FormItem><FormLabel>İmza Ad Soyad</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField name="imza_unvan" control={form.control} render={({ field }) => (<FormItem><FormLabel>Unvan</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    </div>
                      <div>
                        <Label>Ekler (Varsa)</Label>
                        {ekFields.map((field, index) => (
                          <div key={field.id} className="flex gap-2 items-center mt-2">
                              <FormField control={form.control} name={`ekler.${index}.value`} render={({ field }) => (<FormControl><Input placeholder={`${index+1}. Belge adı (2 sayfa)`} {...field} /></FormControl>)} />
                              <Button type="button" variant="destructive" size="icon" onClick={() => removeEk(index)}><Trash2 /></Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => appendEk({ value: '' })} className="mt-2"><PlusCircle className="mr-2"/>Ek Ekle</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Dağıtım (Gerekiyorsa)</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="dagitim_geregi" control={form.control} render={({ field }) => (<FormItem><FormLabel>Gereği İçin</FormLabel><FormControl><Textarea placeholder="İlgili birim alt alta yazın..." {...field} /></FormControl></FormItem>)} />
                    <FormField name="dagitim_bilgi" control={form.control} render={({ field }) => (<FormItem><FormLabel>Bilgi İçin</FormLabel><FormControl><Textarea placeholder="İlgili birim alt alta yazın..." {...field} /></FormControl></FormItem>)} />
                </CardContent>
            </Card>
             </form>
            </Form>
        </div>

        <div className="lg:col-span-1 lg:sticky lg:top-24 h-max">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <Eye className="w-6 h-6 text-primary" />
                        <CardTitle>Canlı Önizleme</CardTitle>
                    </div>
                    <CardDescription>Siz formu doldururken dilekçeniz burada görünecektir.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DilekcePreview data={watchedData} showOfficialFields={showOfficialFields} />
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
