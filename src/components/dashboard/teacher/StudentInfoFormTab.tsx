'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Save, Trash2, PlusCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { StudentInfoFormData, TeacherProfile, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDatabase } from '@/hooks/use-database';
import { exportStudentInfoFormToRtf } from '@/lib/word-export';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  id: z.string(),
  formDate: z.string(),
  studentName: z.string().min(2, { message: "Öğrenci adı gereklidir." }),
  studentGender: z.string(),
  studentClassAndNumber: z.string(),
  studentBirthPlaceAndDate: z.string(),
  studentSchool: z.string(),
  studentAddress: z.string(),
  studentPreschool: z.string(),
  studentHealthDevice: z.string(),
  studentHobbies: z.string(),
  studentChronicIllness: z.string(),
  studentRecentMove: z.string(),
  studentExtracurricular: z.string(),
  studentTechUsage: z.string(),
  studentMemorableEvent: z.string(),
  guardianKinship: z.string(),
  guardianPhone: z.string(),
  guardianEducation: z.string(),
  guardianOccupation: z.string(),
  motherName: z.string(),
  motherBirthPlaceAndDate: z.string(),
  motherIsAlive: z.string(),
  motherIsHealthy: z.string(),
  motherHasDisability: z.string(),
  motherEducation: z.string(),
  motherOccupation: z.string(),
  fatherName: z.string(),
  fatherBirthPlaceAndDate: z.string(),
  fatherIsAlive: z.string(),
  fatherIsHealthy: z.string(),
  fatherHasDisability: z.string(),
  fatherEducation: z.string(),
  fatherOccupation: z.string(),
  siblingCount: z.string(),
  birthOrder: z.string(),
  familyLivesWith: z.string(),
  familyMemberWithDisability: z.string(),
  familyFinancialIssues: z.string(),
});

const formQuestions = [
  { section: "ÖĞRENCİ BİLGİSİ", fields: [
    { name: "studentName", label: "Adı Soyadı", type: "text" },
    { name: "studentGender", label: "Cinsiyeti", type: "radio", options: ["Kız", "Erkek"] },
    { name: "studentClassAndNumber", label: "Sınıfı ve Numarası", type: "text" },
    { name: "studentBirthPlaceAndDate", label: "Doğum Yeri ve Tarihi", type: "text" },
    { name: "studentSchool", label: "Okulu", type: "text" },
    { name: "studentAddress", label: "Adresi", type: "textarea" },
    { name: "studentPreschool", label: "Okul öncesi eğitim aldınız mı?", type: "text" },
    { name: "studentHealthDevice", label: "Sürekli kullandığınız ilaç ve/veya tıbbi cihaz var mı? Varsa nedir?", type: "text" },
    { name: "studentHobbies", label: "Ne yapmaktan hoşlanırsınız?", type: "text" },
    { name: "studentChronicIllness", label: "Sürekli bir hastalığınız var mı? Varsa nedir?", type: "text" },
    { name: "studentRecentMove", label: "Yakın zamanda taşındınız mı, okul değiştirdiniz mi?", type: "text" },
    { name: "studentExtracurricular", label: "Ders dışı faaliyetleriniz nelerdir?", type: "text" },
    { name: "studentTechUsage", label: "Kendinize ait teknolojik aletleriniz var mı? Varsa günde/haftada ne kadar süre kullanırsınız?", type: "text" },
    { name: "studentMemorableEvent", label: "Hala etkisi altında olduğunuz bir olay yaşadınız mı? Yaşantınızı açıklayınız.", type: "text" }
  ]},
  { section: "VELİ BİLGİSİ (Öğrenciyle ilgili işlemlerden birinci derecede sorumlu kişi)", fields: [
    { name: "guardianKinship", label: "Yakınlığı", type: "text" },
    { name: "guardianPhone", label: "Telefon Numarası", type: "text" },
    { name: "guardianEducation", label: "Eğitim Durumu", type: "text" },
    { name: "guardianOccupation", label: "Mesleği", type: "text" }
  ]},
  { section: "ANNE BİLGİLERİ", fields: [
    { name: "motherName", label: "Adı Soyadı", type: "text" },
    { name: "motherBirthPlaceAndDate", label: "Doğum Yeri / Doğum Tarihi", type: "text" },
    { name: "motherIsAlive", label: "Öz mü?", type: "radio", options: ["Evet", "Hayır"] },
    { name: "motherIsHealthy", label: "Sağ mı?", type: "radio", options: ["Evet", "Hayır"] },
    { name: "motherHasDisability", label: "Engel durumu var mı?", type: "text" },
    { name: "motherEducation", label: "Eğitim Durumu", type: "text" },
    { name: "motherOccupation", label: "Mesleği", type: "text" }
  ]},
  { section: "BABA BİLGİLERİ", fields: [
    { name: "fatherName", label: "Adı Soyadı", type: "text" },
    { name: "fatherBirthPlaceAndDate", label: "Doğum Yeri / Doğum Tarihi", type: "text" },
    { name: "fatherIsAlive", label: "Öz mü?", type: "radio", options: ["Evet", "Hayır"] },
    { name: "fatherIsHealthy", label: "Sağ mı?", type: "radio", options: ["Evet", "Hayır"] },
    { name: "fatherHasDisability", label: "Engel durumu var mı?", type: "text" },
    { name: "fatherEducation", label: "Eğitim Durumu", type: "text" },
    { name: "fatherOccupation", label: "Mesleği", type: "text" }
  ]},
  { section: "AİLE BİLGİSİ", fields: [
    { name: "siblingCount", label: "Kaç kardeşsiniz?", type: "text" },
    { name: "birthOrder", label: "Ailenizin kaçıncı çocuğusunuz?", type: "text" },
    { name: "familyLivesWith", label: "Evde sizinle birlikte kim/kimler yaşıyor? Yakınlık derecelerini belirtiniz.", type: "text" },
    { name: "familyMemberWithDisability", label: "Aile üyelerinizde sürekli bir hastalığı/engeli olan biri var mı? Varsa yazınız.", type: "text" },
    { name: "familyFinancialIssues", label: "Ailenizde sürekli borçlar ya da farklı nedenlerle yaşanan ekonomik sorunlar yaşanır mı?", type: "text" }
  ]}
];

interface StudentInfoFormTabProps {
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function StudentInfoFormTab({ teacherProfile, currentClass }: StudentInfoFormTabProps) {
  const { db, setDb } = useDatabase();
  const { studentInfoForms: students = [] } = db;
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultFormValues = useMemo(() => ({
      id: '',
      formDate: new Date().toLocaleDateString('tr-TR'),
      studentName: '', studentGender: '', 
      studentClassAndNumber: currentClass?.name ? `${currentClass.name} - ` : '', 
      studentBirthPlaceAndDate: '',
      studentSchool: teacherProfile?.schoolName || '', 
      studentAddress: '', studentPreschool: '', studentHealthDevice: '',
      studentHobbies: '', studentChronicIllness: '', studentRecentMove: '', studentExtracurricular: '',
      studentTechUsage: '', studentMemorableEvent: '', guardianKinship: '', guardianPhone: '',
      guardianEducation: '', guardianOccupation: '', motherName: '', motherBirthPlaceAndDate: '',
      motherIsAlive: '', motherIsHealthy: '', motherHasDisability: '', motherEducation: '',
      motherOccupation: '', fatherName: '', fatherBirthPlaceAndDate: '', fatherIsAlive: '',
      fatherIsHealthy: '', fatherHasDisability: '', fatherEducation: '', fatherOccupation: '',
      siblingCount: '', birthOrder: '', familyLivesWith: '', familyMemberWithDisability: '',
      familyFinancialIssues: '',
  }), [teacherProfile, currentClass]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  const handleNewForm = useCallback(() => {
    setSelectedStudentName(null);
    form.reset({
      ...defaultFormValues,
      id: `form_${Date.now()}`,
    });
  }, [form, defaultFormValues]);

  useEffect(() => {
    if (selectedStudentName) {
      const studentData = students.find(s => s.studentName === selectedStudentName); 
      if (studentData) {
        form.reset(studentData);
      }
    } else {
      handleNewForm();
    }
  }, [selectedStudentName, students, form, handleNewForm]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    let wasStudentAdded = false;
    setDb(prevDb => {
        let updatedStudents;
        const studentIdentifier = selectedStudentName || values.studentName;
        const existingStudentIndex = prevDb.studentInfoForms.findIndex(s => s.studentName === studentIdentifier);

        if (existingStudentIndex > -1) {
            updatedStudents = prevDb.studentInfoForms.map((s, index) => index === existingStudentIndex ? values : s);
        } else {
            if (prevDb.studentInfoForms.some(s => s.studentName.trim().toLowerCase() === values.studentName.trim().toLowerCase())) {
                toast({ title: 'Hata', description: 'Bu isimde bir öğrenci zaten mevcut.', variant: 'destructive' });
                return prevDb;
            }
            wasStudentAdded = true;
            updatedStudents = [...prevDb.studentInfoForms, values];
        }
        
        return { ...prevDb, studentInfoForms: updatedStudents };
    });

    if (wasStudentAdded) {
        setSelectedStudentName(values.studentName);
    }
    
    toast({ title: 'Kaydedildi', description: 'Öğrenci bilgileri başarıyla kaydedildi.' });
  };
  
  const handleDeleteStudent = () => {
    if (!selectedStudentName) return;
    setDb(prevDb => ({
        ...prevDb,
        studentInfoForms: prevDb.studentInfoForms.filter(s => s.studentName !== selectedStudentName)
    }));
    handleNewForm();
    toast({ title: 'Silindi', description: 'Öğrenci kaydı silindi.', variant: 'destructive' });
  };

  const handleExportWord = () => {
    const values = form.getValues();
    if (!values.studentName || !teacherProfile) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    exportStudentInfoFormToRtf({record: values, teacherProfile});
  };
  
  const renderField = (name: keyof StudentInfoFormData, label: string, placeholder?: string, isTextArea = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {isTextArea ? <Textarea placeholder={placeholder} {...field} value={field.value || ''} /> : <Input placeholder={placeholder} {...field} value={field.value || ''} />}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  
  const renderRadioField = (name: keyof StudentInfoFormData, label: string, options: string[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value || ''} className="flex space-x-4">
                {options.map(option => (
                     <FormItem key={option} className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                            <RadioGroupItem value={option} />
                        </FormControl>
                        <FormLabel className="font-normal">{option}</FormLabel>
                    </FormItem>
                ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  
  const copyQuestionsToClipboard = () => {
    const textToCopy = formQuestions.map(section => 
        `Bölüm: ${section.section}\n\n` + 
        section.fields.map(field => {
            let question = field.label;
            if (field.type === 'radio' && field.options) {
                question += ` (${field.options.join(' / ')})`;
            }
            return question;
        }).join('\n')
    ).join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Kopyalandı', description: 'Tüm sorular panoya kopyalandı.' });
  };

  return (
    <div className="grid md:grid-cols-4 gap-8">
      <div className="md:col-span-1 space-y-4">
           <Card>
              <CardHeader><CardTitle>Kayıtlı Formlar</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                   <Button onClick={handleNewForm} className="w-full"><PlusCircle className="mr-2"/> Yeni Form</Button>
                  <Select onValueChange={setSelectedStudentName} value={selectedStudentName || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kayıtlı öğrenci seç..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students && students.length === 0 && <p className='text-sm text-muted-foreground text-center p-2'>Kayıtlı form yok.</p>}
                      {students && students.map(s => <SelectItem key={s.studentName} value={s.studentName}>{s.studentName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedStudentName && <Button onClick={handleDeleteStudent} variant="destructive" className="w-full mt-2"><Trash2 className="mr-2"/> Seçili Kaydı Sil</Button>}
              </CardContent>
           </Card>
      </div>
      <div className="md:col-span-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>Öğrenci Bilgi Formu</CardTitle>
                     <div className="flex items-center gap-2">
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="outline"><Copy className="mr-2"/> Google Form Soruları</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                  <DialogTitle>Google Form İçin Sorular</DialogTitle>
                                  <DialogDescription>
                                      Aşağıdaki soruları kopyalayıp doğrudan yeni bir Google Form'a yapıştırabilirsiniz.
                                  </DialogDescription>
                                  </DialogHeader>
                                  <ScrollArea className="h-96 w-full rounded-md border p-4 bg-muted/30">
                                      <pre className="text-sm whitespace-pre-wrap">
                                          {formQuestions.map(section => 
                                              `Bölüm: ${section.section}\n\n` + 
                                              section.fields.map(field => {
                                                  let question = field.label;
                                                  if (field.type === 'radio' && field.options) {
                                                      question += `\nSeçenekler: ${field.options.join(', ')}`;
                                                  }
                                                  return question;
                                              }).join('\n\n')
                                          ).join('\n\n--------------------------------\n\n')}
                                      </pre>
                                  </ScrollArea>
                                  <Button onClick={copyQuestionsToClipboard} className="mt-4"><Copy className="mr-2"/> Tümünü Kopyala</Button>
                              </DialogContent>
                          </Dialog>
                          <Button type="button" onClick={handleExportWord} variant="outline" disabled={!selectedStudentName}><FileDown className="mr-2"/> RTF Çıktısı Al</Button>
                      </div>
                  </div>
                  <div className="w-1/4 pt-2">
                     <FormField
                      control={form.control}
                      name="formDate"
                      render={({ field }) => (
                          <FormItem>
                          <FormControl>
                              <Input type="text" placeholder="Tarih" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
              </CardHeader>
              <CardContent className="space-y-6">
                  {/* Student Info */}
                  <p className="font-bold text-lg border-b pb-2">ÖĞRENCİ BİLGİSİ</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {renderField('studentName', 'Adı Soyadı')}
                    {renderRadioField('studentGender', 'Cinsiyeti', ['Kız', 'Erkek'])}
                  </div>
                   <div className="grid md:grid-cols-2 gap-4">
                      {renderField('studentClassAndNumber', 'Sınıfı ve Numarası')}
                      {renderField('studentBirthPlaceAndDate', 'Doğum Yeri ve Tarihi')}
                   </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {renderField('studentSchool', 'Okulu')}
                      {renderField('studentAddress', 'Adresi', undefined, true)}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {renderField('studentPreschool', 'Okul öncesi eğitim aldınız mı?')}
                      {renderField('studentHealthDevice', 'Sürekli kullandığınız ilaç ve/veya tıbbi cihaz var mı? Varsa nedir?')}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                       {renderField('studentHobbies', 'Ne yapmaktan hoşlanırsınız?')}
                       {renderField('studentChronicIllness', 'Sürekli bir hastalığınız var mı? Varsa nedir?')}
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                       {renderField('studentRecentMove', 'Yakın zamanda taşındınız mı, okul değiştirdiniz mi?')}
                       {renderField('studentExtracurricular', 'Ders dışı faaliyetleriniz nelerdir?')}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                       {renderField('studentTechUsage', 'Kendinize ait teknolojik aletleriniz var mı? Varsa günde/haftada ne kadar süre kullanırsınız?')}
                       {renderField('studentMemorableEvent', 'Hala etkisi altında olduğunuz bir olay yaşadınız mı? Yaşantınızı açıklayınız.')}
                    </div>

                   {/* Guardian Info */}
                  <p className="font-bold text-lg border-b pb-2 pt-6">VELİ BİLGİSİ (Öğrenciyle ilgili işlemlerden birinci derecede sorumlu kişi)</p>
                   <div className="grid md:grid-cols-2 gap-4">
                      {renderField('guardianKinship', 'Yakınlığı')}
                      {renderField('guardianPhone', 'Telefon Numarası')}
                   </div>
                   <div className="grid md:grid-cols-2 gap-4">
                      {renderField('guardianEducation', 'Eğitim Durumu')}
                      {renderField('guardianOccupation', 'Mesleği')}
                   </div>

                  {/* Parent Info */}
                   <div className="grid md:grid-cols-2 gap-8 pt-6">
                      <div>
                          <p className="font-bold text-lg border-b pb-2 mb-4">ANNE BİLGİLERİ</p>
                          <div className="space-y-4">
                              {renderField('motherName', 'Adı Soyadı')}
                              {renderField('motherBirthPlaceAndDate', 'Doğum Yeri / Doğum Tarihi')}
                              {renderRadioField('motherIsAlive', 'Öz mü?', ['Evet', 'Hayır'])}
                              {renderRadioField('motherIsHealthy', 'Sağ mı?', ['Evet', 'Hayır'])}
                              {renderField('motherHasDisability', 'Engel durumu var mı?')}
                              {renderField('motherEducation', 'Eğitim Durumu')}
                              {renderField('motherOccupation', 'Mesleği')}
                          </div>
                      </div>
                      <div>
                          <p className="font-bold text-lg border-b pb-2 mb-4">BABA BİLGİLERİ</p>
                           <div className="space-y-4">
                              {renderField('fatherName', 'Adı Soyadı')}
                              {renderField('fatherBirthPlaceAndDate', 'Doğum Yeri / Doğum Tarihi')}
                              {renderRadioField('fatherIsAlive', 'Öz mü?', ['Evet', 'Hayır'])}
                              {renderRadioField('fatherIsHealthy', 'Sağ mı?', ['Evet', 'Hayır'])}
                              {renderField('fatherHasDisability', 'Engel durumu var mı?')}
                              {renderField('fatherEducation', 'Eğitim Durumu')}
                              {renderField('fatherOccupation', 'Mesleği')}
                          </div>
                      </div>
                   </div>

                  {/* Family Info */}
                  <p className="font-bold text-lg border-b pb-2 pt-6">AİLE BİLGİSİ</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {renderField('siblingCount', 'Kaç kardeşsiniz?')}
                      {renderField('birthOrder', 'Ailenizin kaçıncı çocuğusunuz?')}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                       {renderField('familyLivesWith', 'Evde sizinle birlikte kim/kimler yaşıyor? Yakınlık derecelerini belirtiniz.')}
                       {renderField('familyMemberWithDisability', 'Aile üyelerinizde sürekli bir hastalığı/engeli olan biri var mı? Varsa yazınız.')}
                    </div>
                    {renderField('familyFinancialIssues', 'Ailenizde sürekli borçlar ya da farklı nedenlerle yaşanan ekonomik sorunlar yaşanır mı?')}

              </CardContent>
              <CardFooter>
                  <Button type="submit" size="lg"><Save className="mr-2"/> Formu Kaydet</Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
);
}
