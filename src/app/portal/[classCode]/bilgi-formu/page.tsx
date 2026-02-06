'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Student, InfoForm, RiskFactor, Class } from '@/lib/types';
import { Loader2, ArrowLeft, Save, FileText, User, Heart, Home, School } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const formSchema = z.object({
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  studentPhone: z.string().optional(),
  studentEmail: z.string().email({message: "Geçersiz e-posta."}).optional().or(z.literal('')),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  foreignLanguage: z.string().optional(),
  healthIssues: z.string().optional(),
  pastIllnesses: z.string().optional(),
  healthDevice: z.string().optional(),
  hobbies: z.string().optional(),
  isWorking: z.enum(['yes', 'no']).optional(),
  commutesToSchoolBy: z.enum(['walking', 'service', 'public', 'private', 'other']).optional(),
  isHomeRented: z.enum(['yes', 'no']).optional(),
  hasOwnRoom: z.enum(['yes', 'no']).optional(),
  guardianPhone: z.string().optional(),
  motherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  motherEducation: z.string().optional(),
  motherJob: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  fatherEducation: z.string().optional(),
  fatherJob: z.string().optional(),
  familyLivesWith: z.string().optional(),
  siblingsInfo: z.string().optional(),
  hasStepSibling: z.enum(['yes', 'no']).optional(),
  parentalAttitude: z.string().optional(),
  hasDisability: z.enum(['yes', 'no']).optional(),
  isMartyrVeteranChild: z.enum(['yes', 'no']).optional(),
  selectedRisks: z.array(z.string()).optional(),
  economicStatus: z.enum(['iyi', 'orta', 'kotu']).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function StudentInfoFormPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db } = useFirebase();
    const { toast } = useToast();

    const [student, setStudent] = useState<Student | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<FormData>({ resolver: zodResolver(formSchema), defaultValues: { selectedRisks: [] } });

    // Initial student loading from session
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

    // Real-time listener for student data
    useEffect(() => {
        if (!student?.id || !db) return;

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
    }, [student?.id, db]);


    const { data: existingForm, isLoading: formLoading } = useDoc<InfoForm>(useMemoFirebase(() => student ? doc(db, 'infoForms', student.id) : null, [db, student]));
    const riskFactorsQuery = useMemoFirebase(() => (student ? query(collection(db, 'riskFactors'), where('teacherId', '==', student.teacherId)) : null), [db, student]);
    const { data: riskFactors, isLoading: risksLoading } = useCollection<RiskFactor>(riskFactorsQuery);
    
    const classDocRef = useMemoFirebase(() => (student ? doc(db, 'classes', student.classId) : null), [db, student]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);


    // Populate form with existing data
    useEffect(() => {
        if (student && existingForm) {
            form.reset({
                ...existingForm,
                selectedRisks: student.risks || [],
            });
        } else if (student) {
             form.reset({
                selectedRisks: student.risks || [],
            });
        }
    }, [existingForm, student, form]);

    const onSubmit = async (data: FormData) => {
        if (!db || !student) return;
        setIsSaving(true);
        try {
            const infoFormRef = doc(db, 'infoForms', student.id);
            const studentRef = doc(db, 'students', student.id);

            // Create a clean data object by filtering out undefined values which Firestore doesn't support.
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([, v]) => v !== undefined)
            );

            const infoFormData = {
                ...cleanData,
                studentId: student.id,
                submitted: true,
                authUid: student.authUid,
            };

            const studentUpdateData = { risks: data.selectedRisks || [] };
            
            await setDoc(infoFormRef, infoFormData, { merge: true });
            await updateDoc(studentRef, studentUpdateData);

            toast({ title: 'Başarıyla Kaydedildi!', description: 'Bilgi formunuz güncellendi.' });
            router.push(`/portal/${classCode}`);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Hata', description: 'Form kaydedilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const loading = !student || formLoading || risksLoading || classLoading;

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
         <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Logo className="h-10 w-10 text-primary"/>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Öğrenci Bilgi Formu</h1>
                        <p className="text-sm text-muted-foreground">{student?.name}</p>
                    </div>
                </div>
                 <Button asChild variant="outline">
                    <Link href={`/portal/${classCode}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Portala Geri Dön
                    </Link>
                </Button>
            </header>
            <main className="max-w-4xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3', 'item-4']} className="w-full space-y-4">
                            
                            {/* Kişisel Bilgiler */}
                            <AccordionItem value="item-1" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><User />Kişisel Bilgiler</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="birthDate" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="birthPlace" control={form.control} render={({ field }) => (<FormItem><FormLabel>Doğum Yeri</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="studentPhone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Telefon</FormLabel><FormControl><Input type="tel" {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="studentEmail" control={form.control} render={({ field }) => (<FormItem><FormLabel>E-posta</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage/></FormItem>)} />
                                        <FormField name="address" control={form.control} render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Adres</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* Sağlık Bilgileri */}
                            <AccordionItem value="item-2" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Heart/>Sağlık Bilgileri</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField name="bloodType" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kan Grubu</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                         <FormField name="healthIssues" control={form.control} render={({ field }) => (<FormItem><FormLabel>Sürekli Hastalık/Alerji</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="pastIllnesses" control={form.control} render={({ field }) => (<FormItem><FormLabel>Geçirilmiş Önemli Hastalık/Ameliyat</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="healthDevice" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kullandığı Cihaz/Protez</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            
                            {/* Aile ve Sosyal Durum */}
                             <AccordionItem value="item-3" className="border rounded-xl bg-white shadow-sm">
                                <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Home/>Aile ve Sosyal Durum</div></AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <FormField name="motherStatus" control={form.control} render={({ field }) => (<FormItem><FormLabel>Anne Hayatta mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem></SelectContent></Select></FormItem>)} />
                                        <FormField name="fatherStatus" control={form.control} render={({ field }) => (<FormItem><FormLabel>Baba Hayatta mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem></SelectContent></Select></FormItem>)} />
                                        <FormField name="motherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Annenin Mesleği</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="fatherJob" control={form.control} render={({ field }) => (<FormItem><FormLabel>Babanın Mesleği</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="siblingsInfo" control={form.control} render={({ field }) => (<FormItem className="col-span-full"><FormLabel>Kardeş Bilgileri (Yaş, cinsiyet, okuyor/çalışıyor)</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="familyLivesWith" control={form.control} render={({ field }) => (<FormItem><FormLabel>Kiminle yaşıyor?</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl></FormItem>)} />
                                        <FormField name="economicStatus" control={form.control} render={({ field }) => (<FormItem><FormLabel>Ailenin Gelir Düzeyi</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="iyi">İyi</SelectItem><SelectItem value="orta">Orta</SelectItem><SelectItem value="kotu">Kötü</SelectItem></SelectContent></Select></FormItem>)} />
                                     </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Risk Faktörleri */}
                            {currentClass?.isRiskFormActive && (
                                <AccordionItem value="item-4" className="border rounded-xl bg-white shadow-sm">
                                    <AccordionTrigger className="p-4"><div className="flex items-center gap-2"><Heart/>Özel Durum ve Risk Faktörleri</div></AccordionTrigger>
                                    <AccordionContent className="p-6 pt-0">
                                        <p className="text-sm text-muted-foreground mb-4">Aşağıdaki durumlardan size uygun olanları işaretleyiniz. Bu bilgiler sadece rehber öğretmeniniz tarafından görülecektir.</p>
                                        <FormField
                                            control={form.control}
                                            name="selectedRisks"
                                            render={() => (
                                                <FormItem className="space-y-3">
                                                    {riskFactors?.map((factor) => (
                                                        <FormField
                                                            key={factor.id}
                                                            control={form.control}
                                                            name="selectedRisks"
                                                            render={({ field }) => (
                                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(factor.id)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), factor.id])
                                                                                    : field.onChange(field.value?.filter((value) => value !== factor.id));
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="font-normal">{factor.label}</FormLabel>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </FormItem>
                                            )}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            )}

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
