
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Student, InfoForm, RiskFactor, Class } from '@/lib/types';
import { Loader2, ArrowLeft, Save, FileText, User, Heart, Home, School, CheckCircle, Users, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from '@/components/dashboard/Header';
import { Label } from '@/components/ui/label';


const siblingSchema = z.object({
    name: z.string().optional(),
    age: z.string().optional(),
    relationship: z.enum(['oz', 'uvey']).optional(),
});

const formSchema = z.object({
  // Öğrenci
  tcKimlikNo: z.string().optional(),
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  talentArea: z.array(z.string()).optional(),
  program: z.array(z.string()).optional(),
  educationType: z.enum(['tam', 'sabah', 'ogle']).optional(),
  address: z.string().optional(),
  studentPhone: z.string().optional(),
  studentEmail: z.string().email({message: "Geçersiz e-posta."}).optional().or(z.literal('')),
  
  // Baba
  fatherName: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased']).optional(),
  fatherRelationship: z.enum(['oz', 'uvey']).optional(),
  fatherFamilyStatus: z.enum(['birlikte', 'ayri', 'bosanmis']).optional(),
  fatherJob: z.string().optional(),
  fatherEducation: z.string().optional(),
  fatherWorkplace: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherIncome: z.string().optional(),
  fatherEmail: z.string().email({message: "Geçersiz e-posta."}).optional().or(z.literal('')),
  
  // Anne
  motherName: z.string().optional(),
  motherStatus: z.enum(['alive', 'deceased']).optional(),
  motherRelationship: z.enum(['oz', 'uvey']).optional(),
  motherFamilyStatus: z.enum(['birlikte', 'ayri', 'bosanmis']).optional(),
  motherJob: z.string().optional(),
  motherEducation: z.string().optional(),
  motherWorkplace: z.string().optional(),
  motherPhone: z.string().optional(),
  motherIncome: z.string().optional(),
  motherEmail: z.string().email({message: "Geçersiz e-posta."}).optional().or(z.literal('')),

  // Kardeş
  siblings: z.array(siblingSchema).optional(),
  hasDeceasedSibling: z.enum(['yes', 'no']).optional(),

  // Sağlık
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  pastIllnesses: z.string().optional(),
  healthIssues: z.string().optional(),
  medication: z.string().optional(),
  disabilityInfo: z.string().optional(),
});


type FormData = z.infer<typeof formSchema>;

export default function StudentInfoFormPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: { siblings: [{name: '', age: '', relationship: 'oz'}]} });
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "siblings",
    });

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
            form.reset({
                ...existingForm,
            });
        }
    }, [existingForm, student, form]);

    const onSubmit = async (data: FormData) => {
        if (!db || !student) return;
        setIsSaving(true);
        try {
            const infoFormRef = doc(db, 'infoForms', student.id);
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined)
            );
            const infoFormData = { ...cleanData, studentId: student.id, submitted: true, authUid: student.authUid };
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
    
    const TALENT_AREAS = [{id: "genel", label: "Genel Yetenek"}, {id: "resim", label: "Resim"}, {id: "muzik", label: "Müzik"}];
    const PROGRAMS = [{id: "destek1", label: "Destek 1"}, {id: "destek2", label: "Destek 2"}, {id: "destek3", label: "Destek 3"}, {id: "byf1", label: "BYF 1"}, {id: "byf2", label: "BYF 2"}, {id: "oyg", label: "ÖYG"}, {id: "proje", label: "PROJE"}];


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
                        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']} className="w-full space-y-4">
                            
                            <AccordionItem value="item-1" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><User />Öğrenci Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-4">
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField name="tcKimlikNo" control={form.control} render={({ field }) => (<FormItem><FormLabel>TC Kimlik No</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="birthDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="birthPlace" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Yeri</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                     </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="talentArea" render={({ field }) => (
                                          <FormItem><FormLabel>Yetenek Alanı</FormLabel>
                                            <div className="flex flex-wrap gap-4 pt-2">
                                              {TALENT_AREAS.map((item) => (
                                                <FormField key={item.id} control={form.control} name="talentArea" render={({ field }) => (
                                                    <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                      <FormControl>
                                                        <Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                                            return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                                        }} />
                                                      </FormControl>
                                                      <FormLabel className="font-normal">{item.label}</FormLabel>
                                                    </FormItem>
                                                )}/>
                                              ))}
                                            </div><FormMessage />
                                          </FormItem>
                                        )} />
                                        <FormField control={form.control} name="educationType" render={({ field }) => (
                                            <FormItem><FormLabel>Öğretim Şekli</FormLabel>
                                                <FormControl>
                                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2">
                                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="tam" /></FormControl><FormLabel className="font-normal">Tam Gün</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="sabah" /></FormControl><FormLabel className="font-normal">Sabah</FormLabel></FormItem>
                                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="ogle" /></FormControl><FormLabel className="font-normal">Öğle</FormLabel></FormItem>
                                                    </RadioGroup>
                                                </FormControl><FormMessage />
                                            </FormItem>
                                        )} />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField name="address" control={form.control} render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Ev Adresi</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="studentPhone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Cep Telefonu</FormLabel><FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="studentEmail" control={form.control} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>E-Posta</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)} />
                                     </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            <AccordionItem value="item-2" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Users />Veli Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        {/* Baba */}
                                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                                            <h3 className="font-bold text-lg">Baba Bilgileri</h3>
                                            <FormField name="fatherName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Adı Soyadı</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <div className="flex gap-4">
                                               <FormField control={form.control} name="fatherStatus" render={({ field }) => (<FormItem><FormLabel>Yaşıyor mu?</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="alive" /></FormControl><FormLabel className="font-normal">Evet</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="deceased" /></FormControl><FormLabel className="font-normal">Hayır</FormLabel></FormItem></RadioGroup></FormItem>)} />
                                               <FormField control={form.control} name="fatherRelationship" render={({ field }) => (<FormItem><FormLabel>Öz/Üvey?</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="oz" /></FormControl><FormLabel className="font-normal">Öz</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="uvey" /></FormControl><FormLabel className="font-normal">Üvey</FormLabel></FormItem></RadioGroup></FormItem>)} />
                                            </div>
                                            <FormField name="fatherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Mesleği</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <FormField name="fatherEducation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Öğrenim Düzeyi</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        </div>
                                         {/* Anne */}
                                        <div className="space-y-4 p-4 border rounded-lg bg-slate-50/50">
                                            <h3 className="font-bold text-lg">Anne Bilgileri</h3>
                                            <FormField name="motherName" control={form.control} render={({ field }) => (<FormItem><FormLabel>Adı Soyadı</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <div className="flex gap-4">
                                               <FormField control={form.control} name="motherStatus" render={({ field }) => (<FormItem><FormLabel>Yaşıyor mu?</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="alive" /></FormControl><FormLabel className="font-normal">Evet</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="deceased" /></FormControl><FormLabel className="font-normal">Hayır</FormLabel></FormItem></RadioGroup></FormItem>)} />
                                               <FormField control={form.control} name="motherRelationship" render={({ field }) => (<FormItem><FormLabel>Öz/Üvey?</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2"><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="oz" /></FormControl><FormLabel className="font-normal">Öz</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="uvey" /></FormControl><FormLabel className="font-normal">Üvey</FormLabel></FormItem></RadioGroup></FormItem>)} />
                                            </div>
                                            <FormField name="motherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Mesleği</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                            <FormField name="motherEducation" control={form.control} render={({ field }) => (<FormItem><FormLabel>Öğrenim Düzeyi</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                             <AccordionItem value="item-3" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Home/>Kardeş ve Sağlık Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0 space-y-6">
                                     <div>
                                        <Label>Kardeş Bilgileri</Label>
                                        <div className="mt-2 space-y-2">
                                            {fields.map((item, index) => (
                                                <div key={item.id} className="flex gap-2 items-center p-2 rounded-lg bg-gray-50 border">
                                                    <Input placeholder="Adı Soyadı" {...form.register(`siblings.${index}.name`)} />
                                                    <Input placeholder="Yaşı" {...form.register(`siblings.${index}.age`)} className="w-20" />
                                                    <Controller control={form.control} name={`siblings.${index}.relationship`} render={({ field }) => (
                                                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-2">
                                                            <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="oz" /></FormControl><FormLabel className="text-xs">Öz</FormLabel></FormItem>
                                                            <FormItem className="flex items-center space-x-1"><FormControl><RadioGroupItem value="uvey" /></FormControl><FormLabel className="text-xs">Üvey</FormLabel></FormItem>
                                                        </RadioGroup>
                                                    )} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', age: '', relationship: 'oz' })}><PlusCircle className="mr-2 h-4 w-4" />Kardeş Ekle</Button>
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="height" control={form.control} render={({ field }) => (<FormItem><FormLabel>Boy (cm)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="weight" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kilo (kg)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="bloodType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kan Grubu</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="pastIllnesses" control={form.control} render={({ field }) => (<FormItem><FormLabel>Geçirdiği Hastalık/Kaza</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="healthIssues" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sürekli Hastalık</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="medication" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sürekli Kullandığı İlaç</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="disabilityInfo" control={form.control} render={({ field }) => (<FormItem><FormLabel>Engel Durumu</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                     </div>
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
