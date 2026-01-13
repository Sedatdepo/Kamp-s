

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, Timestamp, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Class, Student, TeacherProfile } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuidanceReferralTab } from './GuidanceReferralTab';

const infoFormSchema = z.object({
  birthDate: z.date().optional(),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  healthIssues: z.string().optional(),
  hobbies: z.string().optional(),
  techUsage: z.string().optional(),
  motherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  motherEducation: z.string().optional(),
  motherJob: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  fatherEducation: z.string().optional(),
  fatherJob: z.string().optional(),
  siblingsInfo: z.string().optional(),
  economicStatus: z.enum(['low', 'middle', 'high']).optional(),
});

type InfoFormData = z.infer<typeof infoFormSchema>;

interface StudentInfoFormProps {
    students: Student[];
    currentClass: Class | null;
}

const StudentInfoFormList = ({ students, currentClass }: StudentInfoFormProps) => {
    // This component will now list students and their form status.
    // The actual form editing will be in a separate component/dialog.
    // For now, let's just display the status.
    const { db } = useAuth();
    const { toast } = useToast();

    // A state to track which student's form is being viewed/edited
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const [infoForms, setInfoForms] = useState<{[key: string]: any}>({});
    const [loadingForms, setLoadingForms] = useState(false);

    useEffect(() => {
        const fetchForms = async () => {
            if (!students || students.length === 0 || !db) return;
            setLoadingForms(true);
            const formsData: {[key: string]: any} = {};
            for (const student of students) {
                const formRef = doc(db, 'infoForms', student.id);
                const formSnap = await getDoc(formRef);
                if (formSnap.exists()) {
                    formsData[student.id] = formSnap.data();
                }
            }
            setInfoForms(formsData);
            setLoadingForms(false);
        }
        fetchForms();
    }, [students, db]);


    if(selectedStudent) {
        return <InfoFormEditor student={selectedStudent} currentClass={currentClass} onBack={() => setSelectedStudent(null)} />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Öğrenci Bilgi Formu Durumu</CardTitle>
                <CardDescription>Öğrencilerin bilgi formu doldurma durumları.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingForms ? <Loader2 className="animate-spin" /> : (
                    <div className="border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="text-left">
                                <tr className="border-b">
                                    <th className="p-2">Öğrenci</th>
                                    <th className="p-2">Durum</th>
                                    <th className="p-2 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="p-2 font-medium">{student.name}</td>
                                        <td className="p-2">
                                            {infoForms[student.id] ? 
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Dolduruldu</span> : 
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Bekleniyor</span>
                                            }
                                        </td>
                                        <td className="p-2 text-right">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedStudent(student)}>
                                                Görüntüle / Düzenle
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


const InfoFormEditor = ({ student, currentClass, onBack }: { student: Student; currentClass: Class | null, onBack: () => void; }) => {
  const { db } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormLoading, setFormLoading] = useState(true);

  const form = useForm<InfoFormData>({
    resolver: zodResolver(infoFormSchema),
    defaultValues: {
        birthPlace: '', address: '', healthIssues: '', hobbies: '', techUsage: '',
        motherEducation: '', motherJob: '', fatherEducation: '', fatherJob: '', siblingsInfo: '',
    },
  });

  useEffect(() => {
    const fetchFormData = async () => {
      if (db) {
        setFormLoading(true);
        const formRef = doc(db, 'infoForms', student.id);
        const formSnap = await getDoc(formRef);
        if (formSnap.exists()) {
          const data = formSnap.data();
          const defaultValues: any = {};
          for (const key in data) {
            if (data[key] instanceof Timestamp) {
                defaultValues[key] = data[key].toDate();
            } else {
                defaultValues[key] = data[key];
            }
          }
          form.reset(defaultValues);
        } else {
          form.reset(); // Reset to default if no form exists
        }
        setFormLoading(false);
      }
    };
    fetchFormData();
  }, [student, form, db]);

  const onSubmit = async (data: InfoFormData) => {
    if (!db) return;
    setIsLoading(true);
    try {
      const formRef = doc(db, 'infoForms', student.id);
      const dataToSave = {
        ...data,
        studentId: student.id,
        submitted: true,
        birthDate: data.birthDate ? Timestamp.fromDate(data.birthDate) : undefined,
      };
      await setDoc(formRef, dataToSave, { merge: true });
      toast({ title: 'Başarılı', description: 'Bilgiler kaydedildi.' });
      onBack();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Bilgiler kaydedilemedi.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isFormLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CardContent></Card>
  }
  
  return (
    <Card>
       <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="font-headline">Öğrenci Bilgi Formu: {student.name}</CardTitle>
                    <CardDescription>Aşağıdaki formu öğrenci adına doldurun veya güncelleyin.</CardDescription>
                </div>
                 <Button variant="ghost" onClick={onBack}>Geri</Button>
            </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <h3 className="text-lg font-semibold font-headline border-b pb-2">Kişisel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="birthDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Doğum Tarihi</FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus/>
                        </PopoverContent></Popover>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="birthPlace" render={({ field }) => (<FormItem><FormLabel>Doğum Yeri</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Adres</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="healthIssues" render={({ field }) => (<FormItem><FormLabel>Sağlık Sorunları</FormLabel><FormControl><Input {...field} placeholder="örn. Astım, Alerji"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="hobbies" render={({ field }) => (<FormItem><FormLabel>Hobiler</FormLabel><FormControl><Input {...field} placeholder="örn. Kitap okumak, Spor" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="techUsage" render={({ field }) => (<FormItem><FormLabel>Günlük Teknoloji Kullanımı</FormLabel><FormControl><Input {...field} placeholder="örn. 3 saat" /></FormControl><FormMessage /></FormItem>)} />
            </div>
            
            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Veli Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField control={form.control} name="motherStatus" render={({ field }) => (<FormItem><FormLabel>Anne Durumu</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem><SelectItem value="unknown">Bilinmiyor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motherEducation" render={({ field }) => (<FormItem><FormLabel>Anne Eğitim Durumu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motherJob" render={({ field }) => (<FormItem><FormLabel>Anne Mesleği</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherStatus" render={({ field }) => (<FormItem><FormLabel>Baba Durumu</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="alive">Hayatta</SelectItem><SelectItem value="deceased">Vefat Etti</SelectItem><SelectItem value="unknown">Bilinmiyor</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherEducation" render={({ field }) => (<FormItem><FormLabel>Baba Eğitim Durumu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="fatherJob" render={({ field }) => (<FormItem><FormLabel>Baba Mesleği</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <h3 className="text-lg font-semibold font-headline border-b pb-2 mt-8">Aile Bilgileri</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="siblingsInfo" render={({ field }) => (<FormItem><FormLabel>Kardeş Bilgileri</FormLabel><FormControl><Textarea {...field} placeholder="örn. 1 abla, 1 erkek kardeş"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="economicStatus" render={({ field }) => (<FormItem><FormLabel>Ailenin Ekonomik Durumu</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Düşük</SelectItem><SelectItem value="middle">Orta</SelectItem><SelectItem value="high">Yüksek</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            </div>

            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bilgileri Kaydet
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface InfoFormsTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function InfoFormsTab({ classId, teacherProfile, currentClass }: InfoFormsTabProps) {
    const { db } = useAuth();
    const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
    const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

    return (
        <Tabs defaultValue="student-info-forms">
            <TabsList>
                <TabsTrigger value="student-info-forms">Öğrenci Bilgi Formları</TabsTrigger>
                <TabsTrigger value="guidance-referral">Rehberliğe Yönlendirme</TabsTrigger>
            </TabsList>
            <TabsContent value="student-info-forms" className="mt-4">
                 {studentsLoading ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <StudentInfoFormList students={students || []} currentClass={currentClass} />
                )}
            </TabsContent>
            <TabsContent value="guidance-referral" className="mt-4">
                 <GuidanceReferralTab />
            </TabsContent>
        </Tabs>
    );
}
