'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class } from '@/lib/types';

const infoFormSchema = z.object({
  birthDate: z.string().optional(),
  birthPlace: z.string().optional(),
  studentPhone: z.string().min(10, "Lütfen geçerli bir telefon numarası girin."),
  studentEmail: z.string().email("Geçersiz e-posta.").optional().or(z.literal('')),
  address: z.string().optional(),
  healthIssues: z.string().optional(), // SÜREKLİ
  pastIllnesses: z.string().optional(), // GEÇİRİLMİŞ
  healthDevice: z.string().optional(), // CİHAZ
  hobbies: z.string().optional(),
  isWorking: z.enum(['yes', 'no']).optional(),
  commutesToSchoolBy: z.enum(['walking', 'service', 'public', 'private', 'other']).optional(),
  motherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  motherEducation: z.string().optional(),
  motherJob: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  fatherEducation: z.string().optional(),
  fatherJob: z.string().optional(),
  guardianPhone: z.string().min(10, "Lütfen veli telefon numarasını girin."),
  siblingsInfo: z.string().optional(),
  hasStepSibling: z.enum(['yes', 'no']).optional(),
  familyLivesWith: z.string().optional(),
  economicStatus: z.enum(['low', 'middle', 'high']).optional(),
  isHomeRented: z.enum(['yes', 'no']).optional(),
  hasOwnRoom: z.enum(['yes', 'no']).optional(),
  parentalAttitude: z.string().optional(),
  hasDisability: z.enum(['yes', 'no']).optional(),
  isMartyrVeteranChild: z.enum(['yes', 'no']).optional(),
  bloodType: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  foreignLanguage: z.string().optional(),
});

type InfoFormData = z.infer<typeof infoFormSchema>;

export function InfoFormTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setFormLoading] = useState(true);

  const classId = appUser?.type === 'student' ? appUser.data.classId : null;
  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: studentClass, isLoading: classLoading } = useDoc<Class>(classQuery);

  const form = useForm<InfoFormData>({
    resolver: zodResolver(infoFormSchema),
    defaultValues: {},
  });

  useEffect(() => {
    const fetchFormData = async () => {
      if (appUser?.type === 'student' && db) {
        setFormLoading(true);
        const formRef = doc(db, 'infoForms', appUser.data.id);
        const formSnap = await getDoc(formRef);
        if (formSnap.exists()) {
          const data = formSnap.data();
           const defaultValues: any = {};
          for (const key in data) {
            if (data[key] instanceof Timestamp) {
                const date = data[key].toDate();
                defaultValues[key] = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
            } else {
                defaultValues[key] = data[key];
            }
          }
          form.reset(defaultValues);
        }
        setFormLoading(false);
      }
    };
    fetchFormData();
  }, [appUser, form, db]);

  const onSubmit = async (data: InfoFormData) => {
    if (appUser?.type !== 'student' || !db) return;
    setIsLoading(true);
    try {
      const formRef = doc(db, 'infoForms', appUser.data.id);
      const dataToSave = {
        ...data,
        studentId: appUser.data.id,
        submitted: true,
      };
      await setDoc(formRef, dataToSave, { merge: true });
      toast({ title: 'Başarılı', description: 'Bilgileriniz kaydedildi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Bilgiler kaydedilemedi.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFormLoading || classLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }

  if (!studentClass?.isInfoFormActive) {
    return (
      <Card>
        <CardHeader><CardTitle className="font-headline">Öğrenci Bilgi Formu</CardTitle></CardHeader>
        <CardContent><div className="text-center p-6 bg-muted/50 rounded-lg"><p className="text-muted-foreground">Öğrenci bilgi formu şu anda aktif değil.</p></div></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Öğrenci Bilgi Formu</CardTitle>
        <CardDescription>Lütfen aşağıdaki formu eksiksiz doldurun. Tüm bilgiler gizli tutulacaktır.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Kişisel Bilgiler */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2">Kişisel ve İletişim Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="birthDate" render={({ field }) => (<FormItem><FormLabel>Doğum Tarihi (GG.AA.YYYY)</FormLabel><FormControl><Input {...field} placeholder="Örn: 25.04.2008" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="birthPlace" render={({ field }) => (<FormItem><FormLabel>Doğum Yeri</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="studentPhone" render={({ field }) => (<FormItem><FormLabel>Telefon Numaranız</FormLabel><FormControl><Input {...field} placeholder="05..." /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="studentEmail" render={({ field }) => (<FormItem><FormLabel>E-posta (isteğe bağlı)</FormLabel><FormControl><Input {...field} placeholder="ornek@mail.com" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="guardianPhone" render={({ field }) => (<FormItem><FormLabel>Veli Telefon</FormLabel><FormControl><Input {...field} placeholder="05..." /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="foreignLanguage" render={({ field }) => (<FormItem><FormLabel>Bildiğiniz Yabancı Dil</FormLabel><FormControl><Input {...field} placeholder="İngilizce, Almanca..."/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="bloodType" render={({ field }) => (<FormItem><FormLabel>Kan Grubu</FormLabel><FormControl><Input {...field} placeholder="A Rh+" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Boy (cm)</FormLabel><FormControl><Input {...field} placeholder="175" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Kilo (kg)</FormLabel><FormControl><Input {...field} placeholder="65" /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Adres</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            
            {/* Sağlık Bilgileri */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Sağlık Bilgileri</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="healthIssues" render={({ field }) => (<FormItem><FormLabel>Sürekli bir hastalığınız var mı?</FormLabel><FormControl><Input {...field} placeholder="örn. Astım, Alerji"/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="pastIllnesses" render={({ field }) => (<FormItem><FormLabel>Geçirdiğiniz önemli hastalık/ameliyat?</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="healthDevice" render={({ field }) => (<FormItem><FormLabel>Sürekli kullandığınız cihaz/protez?</FormLabel><FormControl><Input {...field} placeholder="Gözlük, işitme cihazı vb."/></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            {/* Veli Bilgileri */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Anne - Baba Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                     <FormField control={form.control} name="motherStatus" render={({ field }) => (<FormItem><FormLabel>Anne Hayatta Mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem><SelectItem value="unknown">Bilinmiyor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="motherEducation" render={({ field }) => (<FormItem><FormLabel>Anne Eğitim Durumu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="motherJob" render={({ field }) => (<FormItem><FormLabel>Anne Mesleği</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <div className="space-y-4">
                    <FormField control={form.control} name="fatherStatus" render={({ field }) => (<FormItem><FormLabel>Baba Hayatta Mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem><SelectItem value="unknown">Bilinmiyor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="fatherEducation" render={({ field }) => (<FormItem><FormLabel>Baba Eğitim Durumu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="fatherJob" render={({ field }) => (<FormItem><FormLabel>Baba Mesleği</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
            </div>

             {/* Sosyo-Ekonomik Durum */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Sosyo-Ekonomik Durum ve Yaşam Alanı</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="familyLivesWith" render={({ field }) => (<FormItem><FormLabel>Kiminle yaşıyorsunuz?</FormLabel><FormControl><Input {...field} placeholder="Ailemle, annemle, akrabamla..."/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hasStepSibling" render={({ field }) => (<FormItem><FormLabel>Üvey kardeşiniz var mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="siblingsInfo" render={({ field }) => (<FormItem><FormLabel>Kardeş Bilgileri</FormLabel><FormControl><Textarea {...field} placeholder="örn. 1 abla (üniv.), 1 erkek kardeş (ilkokul)"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="economicStatus" render={({ field }) => (<FormItem><FormLabel>Ailenin Gelir Düzeyi</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Alt</SelectItem><SelectItem value="middle">Orta</SelectItem><SelectItem value="high">Üst</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="isHomeRented" render={({ field }) => (<FormItem><FormLabel>Oturduğunuz ev kira mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hasOwnRoom" render={({ field }) => (<FormItem><FormLabel>Kendinize ait odanız var mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="isWorking" render={({ field }) => (<FormItem><FormLabel>Herhangi bir işte çalışıyor musunuz?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                 <FormField control={form.control} name="commutesToSchoolBy" render={({ field }) => (<FormItem><FormLabel>Okula ulaşım şekliniz</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="walking">Yürüyerek</SelectItem><SelectItem value="service">Servis</SelectItem><SelectItem value="public">Toplu Taşıma</SelectItem><SelectItem value="private">Özel Araç</SelectItem><SelectItem value="other">Diğer</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
             </div>
             <FormField control={form.control} name="parentalAttitude" render={({ field }) => (<FormItem><FormLabel>Ailenizin Derslerinize Karşı Tutumu</FormLabel><FormControl><Textarea {...field} placeholder="Derslerinizle ilgilenirler mi? Başarınızı/başarısızlığınızı nasıl karşılarlar?"/></FormControl><FormMessage /></FormItem>)} />
            
            {/* Özel Durum Bilgileri */}
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Özel Durum Bilgileri</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="hasDisability" render={({ field }) => (<FormItem><FormLabel>Herhangi bir engel durumunuz var mı?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="isMartyrVeteranChild" render={({ field }) => (<FormItem><FormLabel>Şehit veya Gazi yakını mısınız?</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Evet</SelectItem><SelectItem value="no">Hayır</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bilgileri Kaydet
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
