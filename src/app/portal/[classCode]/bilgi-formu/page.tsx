
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Student, InfoForm } from '@/lib/types';
import { Loader2, ArrowLeft, Save, User, Home, Users, Heart, GraduationCap, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from '@/components/dashboard/Header';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';

const siblingSchema = z.object({
    name: z.string().optional(),
    age: z.string().optional(),
    relationship: z.enum(['oz', 'uvey']).optional(),
});

const socialEmotionalTrait = z.enum(['her_zaman', 'genellikle', 'bazen', 'hicbir_zaman'], {
    required_error: "Bu alanı işaretlemeniz zorunludur."
});

const formSchema = z.object({
  // KİŞİSEL BİLGİLER
  birthDate: z.string({ required_error: "Doğum tarihi zorunludur." }).min(1, "Doğum tarihi alanı boş bırakılamaz."),
  birthPlace: z.string({ required_error: "Doğum yeri zorunludur." }).min(1, "Doğum yeri alanı boş bırakılamaz."),
  educationType: z.enum(['tam', 'sabah', 'ogle'], { required_error: "Öğretim şekli seçimi zorunludur." }),
  address: z.string({ required_error: "Adres zorunludur." }).min(1, "Adres alanı boş bırakılamaz."),
  studentPhone: z.string().optional(),
  studentEmail: z.string().email({message: "Geçersiz e-posta adresi."}).optional().or(z.literal('')),
  
  // EV BİLGİLERİ
  oturulanEv: z.enum(['mustakil', 'apartman', 'site', 'toplu_konut'], { required_error: "Bu alan zorunludur." }),
  evSahipligi: z.enum(['kendimize_ait', 'kira'], { required_error: "Bu alan zorunludur." }),
  aylikKira: z.string().optional(),
  evdeKalanlar: z.enum(['cekirdek', 'buyukanne_dede', 'diger'], { required_error: "Bu alan zorunludur." }),
  odaDurumu: z.enum(['tek_basina', 'paylasiyor', 'yok'], { required_error: "Bu alan zorunludur." }),
  dersYardimcisi: z.string().optional(),
  teknolojikImkanlar: z.array(z.string()).refine(value => value.length > 0, { message: "En az bir teknolojik imkan seçilmelidir." }),
  uzaktanEgitim: z.enum(['cep_telefonu', 'bilgisayar', 'tablet', 'katilamiyor'], { required_error: "Bu alan zorunludur." }),

  // VELİ BİLGİLERİ
  fatherName: z.string({ required_error: "Baba adı zorunludur." }).min(1, "Baba adı zorunludur."),
  fatherStatus: z.enum(['alive', 'deceased'], { required_error: "Bu alan zorunludur."}),
  fatherRelationship: z.enum(['oz', 'uvey'], { required_error: "Bu alan zorunludur."}),
  fatherJob: z.string({ required_error: "Baba mesleği zorunludur." }).min(1, "Baba mesleği zorunludur."),
  fatherEducation: z.string({ required_error: "Baba öğrenim düzeyi zorunludur." }).min(1, "Baba öğrenim düzeyi zorunludur."),
  motherName: z.string({ required_error: "Anne adı zorunludur." }).min(1, "Anne adı zorunludur."),
  motherStatus: z.enum(['alive', 'deceased'], { required_error: "Bu alan zorunludur."}),
  motherRelationship: z.enum(['oz', 'uvey'], { required_error: "Bu alan zorunludur."}),
  motherJob: z.string({ required_error: "Anne mesleği zorunludur." }).min(1, "Anne mesleği zorunludur."),
  motherEducation: z.string({ required_error: "Anne öğrenim düzeyi zorunludur." }).min(1, "Anne öğrenim düzeyi zorunludur."),
  
  // KARDEŞ BİLGİLERİ
  siblings: z.array(siblingSchema).optional(),

  // SAĞLIK BİLGİLERİ
  height: z.string({ required_error: "Boy bilgisi zorunludur." }).min(1, "Boy bilgisi zorunludur."),
  weight: z.string({ required_error: "Kilo bilgisi zorunludur." }).min(1, "Kilo bilgisi zorunludur."),
  bloodType: z.string().optional(),
  pastIllnesses: z.string().optional(),
  healthIssues: z.string().optional(),
  medication: z.string().optional(),
  disabilityInfo: z.string().optional(),
  
  // SOSYAL, KÜLTÜREL, SPORTİF
  duzenliSpor: z.string().optional(),
  ilgiAlanlari: z.string().optional(),
  okulDisiKurs: z.string().optional(),

  // SOSYAL VE DUYGUSAL
  iceKapanik: socialEmotionalTrait,
  tekBasina: socialEmotionalTrait,
  sorumluluk: socialEmotionalTrait,
  kaybetme: socialEmotionalTrait,
  anlasma: socialEmotionalTrait,
  yeniSeyler: socialEmotionalTrait,
  buyuklerleArkadaslik: socialEmotionalTrait,
  cabukTepki: socialEmotionalTrait,
  gorevTamamlama: socialEmotionalTrait,
  soruSorar: socialEmotionalTrait,
  
  // BURS
  bursDurumu: z.enum(['aliyor', 'okulda_burslu', 'ihtiyac_yok', 'ihtiyac_var'], { required_error: "Bu alan zorunludur." }),
  
  // EK BİLGİ
  ekstraBilgi: z.string().optional(),
}).refine(data => {
    if (data.evSahipligi === 'kira') {
      return !!data.aylikKira && data.aylikKira.trim().length > 0;
    }
    return true;
}, {
    message: "Kira seçildiğinde aylık kira bedeli zorunludur.",
    path: ["aylikKira"],
});


type FormData = z.infer<typeof formSchema>;

const techItems = [
    { id: 'internet', label: 'İnternet' },
    { id: 'masaustu', label: 'Masaüstü Bilgisayar' },
    { id: 'dizustu', label: 'Dizüstü Bilgisayar' },
    { id: 'tablet', label: 'Tablet' },
    { id: 'sb_yazici', label: 'Siyah-Beyaz Yazıcı' },
    { id: 'renkli_yazici', label: 'Renkli Yazıcı' },
    { id: 'akilli_tv', label: 'Akıllı Televizyon' },
]

const socialEmotionalItems = [
    { name: "iceKapanik", label: "Sosyal ortamlarda içe kapanıktır." },
    { name: "tekBasina", label: "Her şeyi kendi başına yapmak ister." },
    { name: "sorumluluk", label: "Evde, okulda görevlerini ve sorumluluklarını kendisi takip eder." },
    { name: "kaybetme", label: "Herhangi bir oyun oynarken kaybetmeyi anlayışla karşılar." },
    { name: "anlasma", label: "Başkalarıyla anlaşmazlıklarını uygun şekilde çözer." },
    { name: "yeniSeyler", label: "Evde çeşitli malzemeleri kullanarak yeni, farklı şeyler yapar." },
    { name: "buyuklerleArkadaslik", label: "Kendinden büyüklerle veya yetişkinlerle arkadaşlığı tercih eder." },
    { name: "cabukTepki", label: "Sevmediği, istemediği bir şeye çabuk tepki gösterir." },
    { name: "gorevTamamlama", label: "Zorlu bir ödevi, görevi sonuna kadar tamamlamayı sever." },
    { name: "soruSorar", label: "İlgisini çeken konularda sorular sorar, araştırma yapar." },
] as const;


export default function StudentInfoFormPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<FormData>({ resolver: zodResolver(formSchema) });
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "siblings",
    });
    
    const watchEvSahipligi = form.watch("evSahipligi");

    useEffect(() => {
        try {
            const authData = sessionStorage.getItem('student_portal_auth');
            if (!authData) {
                router.replace(`/giris/${classCode}`); return;
            }
            const { student: storedStudent, classCode: storedClassCode } = JSON.parse(authData);
            if (storedClassCode !== classCode || !storedStudent) {
                router.replace(`/giris/${classCode}`); return;
            }
            setStudent(storedStudent);
        } catch (error) {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);

    useEffect(() => {
        if (isUserLoading || !student?.id || !db) return;

        const studentRef = doc(db, 'students', student.id);
        const unsubscribe = onSnapshot(studentRef, (docSnap) => {
            if (docSnap.exists()) {
                const liveStudentData = { id: docSnap.id, ...docSnap.data() } as Student;
                setStudent(liveStudentData);
                try {
                    const authData = JSON.parse(sessionStorage.getItem('student_portal_auth') || '{}');
                    authData.student = liveStudentData;
                    sessionStorage.setItem('student_portal_auth', JSON.stringify(authData));
                } catch (e) {
                    console.error("Could not update session storage on info form page", e);
                }
            }
        });

        return () => unsubscribe();
    }, [student?.id, db, isUserLoading]);

    const infoFormRef = useMemoFirebase(() => (db && student?.id ? doc(db, 'infoForms', student.id) : null), [db, student?.id]);
    const { data: existingForm, isLoading: formLoading } = useDoc<InfoForm>(infoFormRef);

    useEffect(() => {
        if (student && existingForm) {
            form.reset(existingForm as any);
        }
    }, [existingForm, student, form]);

    const onSubmit = async (data: FormData) => {
        if (!db || !student) return;
        setIsSaving(true);
        try {
            const infoFormRef = doc(db, 'infoForms', student.id);
            const infoFormData = { ...data, studentId: student.id, submitted: true, authUid: student.authUid };
            await setDoc(infoFormRef, infoFormData, { merge: true });
            toast({ title: 'Başarıyla Kaydedildi!', description: 'Bilgi formunuz güncellendi.' });
            router.push(`/portal/${classCode}`);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Hata', description: 'Form kaydedilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const loading = !student || formLoading || isUserLoading;

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
         <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={student} />
            <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Öğrenci Bilgi Formu</h1>
                        <p className="text-sm text-muted-foreground">{student?.name}</p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href={`/portal/${classCode}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Portala Geri Dön
                        </Link>
                    </Button>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="multiple" defaultValue={['item-1']} className="w-full space-y-4">
                            
                            <AccordionItem value="item-1" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><User />Öğrenci Kişisel ve Ev Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                        <FormField name="birthDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Tarihi *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        <FormField name="birthPlace" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Yeri *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        <FormField control={form.control} name="educationType" render={({ field }) => (
                                            <FormItem><FormLabel>Öğretim Şekli *</FormLabel><FormControl>
                                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="tam" /></FormControl><FormLabel className="font-normal">Tam Gün</FormLabel></FormItem>
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sabah" /></FormControl><FormLabel className="font-normal">Sabah</FormLabel></FormItem>
                                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="ogle" /></FormControl><FormLabel className="font-normal">Öğle</FormLabel></FormItem>
                                                </RadioGroup></FormControl><FormMessage />
                                            </FormItem>
                                        )} />
                                     </div>
                                     <FormField name="address" control={form.control} render={({ field }) => (<FormItem><FormLabel>Ev Adresi *</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage/></FormItem>)} />
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="studentPhone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cep Telefonu</FormLabel><FormControl><Input type="tel" {...field} /></FormControl></FormItem>)} />
                                        <FormField name="studentEmail" control={form.control} render={({ field }) => (<FormItem><FormLabel>E-Posta</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                        <FormField control={form.control} name="oturulanEv" render={({ field }) => ( <FormItem><FormLabel>Oturduğu Ev *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="mustakil" /></FormControl><FormLabel className="font-normal">Müstakil</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="apartman" /></FormControl><FormLabel className="font-normal">Apartman</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="site" /></FormControl><FormLabel className="font-normal">Site</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="toplu_konut" /></FormControl><FormLabel className="font-normal">Toplu Konut</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="evSahipligi" render={({ field }) => ( <FormItem><FormLabel>Ev Sahipliği *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="kendimize_ait" /></FormControl><FormLabel className="font-normal">Kendimize Ait</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="kira" /></FormControl><FormLabel className="font-normal">Kira</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                     </div>
                                      {watchEvSahipligi === 'kira' && <FormField name="aylikKira" control={form.control} render={({ field }) => (<FormItem><FormLabel>Aylık Kira (TL) *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>)} />}
                                    <FormField control={form.control} name="evdeKalanlar" render={({ field }) => ( <FormItem><FormLabel>Evde Kimler Oturuyor? *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cekirdek" /></FormControl><FormLabel className="font-normal">Çekirdek Aile</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="buyukanne_dede" /></FormControl><FormLabel className="font-normal">Büyükanne-Büyükbaba</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="diger" /></FormControl><FormLabel className="font-normal">Diğer (kuzen, amca, teyze vb.)</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="odaDurumu" render={({ field }) => ( <FormItem><FormLabel>Kendisine Ait Odası Var mı? *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="tek_basina" /></FormControl><FormLabel className="font-normal">Evet, tek başına kalıyor</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="paylasiyor" /></FormControl><FormLabel className="font-normal">Evet, biriyle paylaşıyor</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="yok" /></FormControl><FormLabel className="font-normal">Hayır</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                    <FormField name="dersYardimcisi" control={form.control} render={({ field }) => (<FormItem><FormLabel>Evde Derslere Yardımcı Olan Biri</FormLabel><FormControl><Input {...field} placeholder="Örn: Annem, Ablam, Özel öğretmen..."/></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="teknolojikImkanlar" render={() => (
                                        <FormItem>
                                            <FormLabel>Evdeki Teknolojik İmkanlar *</FormLabel>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                                                {techItems.map((item) => (
                                                    <FormField key={item.id} control={form.control} name="teknolojikImkanlar" render={({ field }) => (
                                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                            <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} /></FormControl>
                                                            <FormLabel className="font-normal">{item.label}</FormLabel>
                                                        </FormItem>
                                                    )}/>
                                                ))}
                                            </div><FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="uzaktanEgitim" render={({ field }) => ( <FormItem><FormLabel>Uzaktan Eğitime Nasıl Katılıyor? *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cep_telefonu" /></FormControl><FormLabel className="font-normal">Cep Telefonu</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="bilgisayar" /></FormControl><FormLabel className="font-normal">Bilgisayar</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="tablet" /></FormControl><FormLabel className="font-normal">Tablet</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="katilamiyor" /></FormControl><FormLabel className="font-normal">Katılamıyor</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                </AccordionContent>
                            </AccordionItem>

                             <AccordionItem value="item-2" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Users />Veli ve Kardeş Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4">
                                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                                            <h3 className="font-bold text-lg">Baba Bilgileri</h3>
                                            <FormField name="fatherName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Adı Soyadı *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <div className="flex gap-4"><FormField control={form.control} name="fatherStatus" render={({ field }) => (<FormItem><FormLabel>Yaşıyor mu? *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="alive" /></FormControl><FormLabel className="font-normal">Evet</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="deceased" /></FormControl><FormLabel className="font-normal">Hayır</FormLabel></FormItem></RadioGroup><FormMessage/></FormItem>)} /><FormField control={form.control} name="fatherRelationship" render={({ field }) => (<FormItem><FormLabel>Öz/Üvey? *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="oz" /></FormControl><FormLabel className="font-normal">Öz</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="uvey" /></FormControl><FormLabel className="font-normal">Üvey</FormLabel></FormItem></RadioGroup><FormMessage/></FormItem>)} /></div>
                                            <FormField name="fatherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Mesleği *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <FormField name="fatherEducation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Öğrenim Düzeyi *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        </div>
                                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                                            <h3 className="font-bold text-lg">Anne Bilgileri</h3>
                                            <FormField name="motherName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Adı Soyadı *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <div className="flex gap-4"><FormField control={form.control} name="motherStatus" render={({ field }) => (<FormItem><FormLabel>Yaşıyor mu? *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="alive" /></FormControl><FormLabel className="font-normal">Evet</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="deceased" /></FormControl><FormLabel className="font-normal">Hayır</FormLabel></FormItem></RadioGroup><FormMessage/></FormItem>)} /><FormField control={form.control} name="motherRelationship" render={({ field }) => (<FormItem><FormLabel>Öz/Üvey? *</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="oz" /></FormControl><FormLabel className="font-normal">Öz</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="uvey" /></FormControl><FormLabel className="font-normal">Üvey</FormLabel></FormItem></RadioGroup><FormMessage/></FormItem>)} /></div>
                                            <FormField name="motherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Mesleği *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <FormField name="motherEducation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Öğrenim Düzeyi *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Heart/>Sağlık ve Sosyal Faaliyetler</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                        <FormField name="height" control={form.control} render={({ field }) => (<FormItem><FormLabel>Boy (cm) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        <FormField name="weight" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kilo (kg) *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                        <FormField name="bloodType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kan Grubu</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                     </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="pastIllnesses" control={form.control} render={({ field }) => (<FormItem><FormLabel>Geçirdiği Hastalık/Kaza</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                        <FormField name="healthIssues" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sürekli Hastalık</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                        <FormField name="medication" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sürekli Kullandığı İlaç</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                        <FormField name="disabilityInfo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Engel Durumu</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                          <FormField name="duzenliSpor" control={form.control} render={({ field }) => (<FormItem><FormLabel>Düzenli Yaptığı Spor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                          <FormField name="ilgiAlanlari" control={form.control} render={({ field }) => (<FormItem><FormLabel>İlgi Alanları ve Hobiler</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                          <FormField name="okulDisiKurs" control={form.control} render={({ field }) => (<FormItem><FormLabel>Okul Dışı Kurs/Faaliyet</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                      </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-4" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><GraduationCap/>Sosyal, Duygusal ve Burs Durumu</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                     <div>
                                        <Label>Sosyal ve Duygusal Özellikler *</Label>
                                        <Card className="mt-2"><CardContent className="p-0">
                                            <Table><TableHeader><TableRow><TableHead>Madde</TableHead><TableHead className="text-center">Her Zaman</TableHead><TableHead className="text-center">Genellikle</TableHead><TableHead className="text-center">Bazen</TableHead><TableHead className="text-center">Hiçbir Zaman</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {socialEmotionalItems.map((item) => (
                                                    <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => (
                                                        <TableRow><TableCell className="font-medium"><FormLabel>{item.label}</FormLabel></TableCell>
                                                        <FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="contents">
                                                            <TableCell className="text-center"><RadioGroupItem value="her_zaman" /></TableCell>
                                                            <TableCell className="text-center"><RadioGroupItem value="genellikle" /></TableCell>
                                                            <TableCell className="text-center"><RadioGroupItem value="bazen" /></TableCell>
                                                            <TableCell className="text-center"><RadioGroupItem value="hicbir_zaman" /></TableCell>
                                                        </RadioGroup></FormControl>
                                                        <FormMessage className="col-span-5" />
                                                        </TableRow>
                                                    )} />
                                                ))}
                                            </TableBody></Table>
                                        </CardContent></Card>
                                    </div>
                                    <FormField control={form.control} name="bursDurumu" render={({ field }) => ( <FormItem><FormLabel>Burs Durumu *</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="aliyor" /></FormControl><FormLabel className="font-normal">Burs Alıyor</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="okulda_burslu" /></FormControl><FormLabel className="font-normal">Okulda Burslu</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="ihtiyac_yok" /></FormControl><FormLabel className="font-normal">Burs İhtiyacı Yok</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="ihtiyac_var" /></FormControl><FormLabel className="font-normal">Burs İhtiyacı Var</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>)} />
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-5" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Info/>Ek Bilgiler</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                    <FormField name="ekstraBilgi" control={form.control} render={({ field }) => (<FormItem><FormLabel>Öğrencinizle İlgili Bilmemiz Gerektiğini Düşündüğünüz Başka Bir Husus</FormLabel><FormControl><Textarea {...field} placeholder="Eklemek istediğiniz diğer notlar..."/></FormControl></FormItem>)} />
                                </AccordionContent>
                             </AccordionItem>
                        </Accordion>
                        <Button type="submit" disabled={isSaving} className="w-full mt-6">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4"/> Bilgilerimi Kaydet
                        </Button>
                    </form>
                </Form>
            </main>
        </div>
    );
}
