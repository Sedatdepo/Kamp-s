
'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, FileDown, Printer, Save, Trash2, PlusCircle, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ObservationRecord, SchoolInfo, GuidanceReferralRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useDatabase } from '@/hooks/use-database';


const formSchema = z.object({
  id: z.string(),
  recordDate: z.string(),
  studentName: z.string().min(1, "Öğrenci adı gerekli"),
  studentAgeGender: z.string(),
  studentSchool: z.string(),
  studentClassNumber: z.string(),
  classTeacherName: z.string(),
  observationPlace: z.string(),
  observationDateTime: z.string(),
  observationDuration: z.string(),
  observationBehavior: z.string(),
  observationPlanning: z.string(),
  teacherObservations: z.string(),
  observationEvaluation: z.string(),
  conclusionAndSuggestions: z.string(),
  observerName: z.string(),
  observerTitle: z.string(),
  observerSignature: z.string().optional(),
});


const generatePdfContent = (data: ObservationRecord, schoolInfo: SchoolInfo, doc: jsPDF) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ÖĞRENCİ GÖZLEM KAYDI', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${schoolInfo.schoolName} OKULU`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

    (doc as any).autoTable({
        startY: 40,
        body: [
            ['Öğrencinin Adı Soyadı', data.studentName, 'Tarih', new Date(data.recordDate).toLocaleDateString('tr-TR')],
            ['Sınıfı/Numarası', data.studentClassNumber, 'Yaşı/Cinsiyeti', data.studentAgeGender],
        ],
        theme: 'grid'
    });

    const sections = [
        { title: "Gözlem Yapılacak Davranış", content: data.observationBehavior },
        { title: "Gözlem Sürecinin Planlanması (Nerede, Ne Zaman, Ne Sıklıkta vs.)", content: data.observationPlanning },
        { title: "Öğretmenin Gözlemleri", content: data.teacherObservations },
        { title: "Gözlem Sürecinin Değerlendirilmesi", content: data.observationEvaluation },
        { title: "Sonuç ve Öneriler", content: data.conclusionAndSuggestions },
    ];

    let currentY = (doc as any).lastAutoTable.finalY + 5;

    sections.forEach(section => {
        (doc as any).autoTable({
            startY: currentY,
            head: [[section.title]],
            body: [[section.content]],
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
             bodyStyles: { minCellHeight: 30 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 5;
    });


    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.text('Gözlemi Yapan', doc.internal.pageSize.getWidth() - 20, finalY + 20, { align: 'right' });
    doc.text(`Ad-Soyad: ${data.observerName}`, doc.internal.pageSize.getWidth() - 20, finalY + 25, { align: 'right' });
    doc.text(`Unvan: ${data.observerTitle}`, doc.internal.pageSize.getWidth() - 20, finalY + 30, { align: 'right' });
    doc.text(`İmza: ${data.observerSignature || ''}`, doc.internal.pageSize.getWidth() - 20, finalY + 35, { align: 'right' });
};


export function StudentObservationFormTab() {
  const { db, setDb } = useDatabase();
  const { schoolInfo, observationRecords: records } = db;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const defaultFormValues: ObservationRecord = {
      id: `record-${Date.now()}`,
      recordDate: new Date().toISOString().split('T')[0],
      studentName: '', studentAgeGender: '', studentSchool: '', studentClassNumber: '', classTeacherName: '',
      observationPlace: '', observationDateTime: '', observationDuration: '', observationBehavior: '',
      observationPlanning: '', teacherObservations: '', observationEvaluation: '', conclusionAndSuggestions: '',
      observerName: '', observerTitle: '', observerSignature: '',
  };

  const form = useForm<ObservationRecord>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (selectedRecordId) {
      const recordData = records.find(r => r.id === selectedRecordId); 
      if (recordData) {
        form.reset(recordData);
      }
    } else {
      handleNewRecord();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecordId, records]);

  const onSubmit = (values: ObservationRecord) => {
    setDb(prevDb => {
        let updatedRecords;
        const existingRecordIndex = prevDb.observationRecords.findIndex(r => r.id === values.id);

        if (existingRecordIndex > -1) {
            updatedRecords = [...prevDb.observationRecords];
            updatedRecords[existingRecordIndex] = values;
        } else {
            updatedRecords = [...prevDb.observationRecords, values];
        }
        
        return { ...prevDb, observationRecords: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Gözlem kaydı başarıyla kaydedildi.' });
  };
  
  const handleNewRecord = () => {
    const newId = `record-${Date.now()}`;
    setSelectedRecordId(null);
    form.reset({
       ...defaultFormValues,
       id: newId,
       recordDate: new Date().toISOString().split('T')[0],
       studentSchool: schoolInfo?.schoolName || '',
       studentClassNumber: schoolInfo ? `${schoolInfo.className} - ` : '',
       classTeacherName: schoolInfo?.classTeacherName || '',
       observerName: schoolInfo?.classTeacherName || '',
       observerTitle: 'Sınıf Rehber Öğretmeni',
    });
  }

  const handleDeleteRecord = () => {
    if (!selectedRecordId) return;
    setDb(prevDb => ({
        ...prevDb,
        observationRecords: prevDb.observationRecords.filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Gözlem kaydı silindi.', variant: 'destructive' });
  };

  const handlePrint = () => {
    const values = form.getValues();
    if (!values.studentName || !schoolInfo) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF();
    generatePdfContent(values, schoolInfo, doc);
    doc.save(`gozlem-kaydi-${values.studentName}.pdf`);
  };
  
  const renderField = (name: keyof ObservationRecord, label: string, isTextArea = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {isTextArea ? <Textarea {...field} rows={4} value={field.value || ''} /> : <Input {...field} value={field.value || ''} />}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  if (!isClient) {
    return null;
  }
  
  return (
      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
             <Card>
                <CardHeader><CardTitle>Gözlem Kayıtları</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                     <Button onClick={handleNewRecord} className="w-full"><PlusCircle className="mr-2"/> Yeni Kayıt</Button>
                    <Select onValueChange={setSelectedRecordId} value={selectedRecordId || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kayıtlı gözlem seç..." />
                      </SelectTrigger>
                      <SelectContent>
                        {records && records.length === 0 && <p className='text-sm text-muted-foreground text-center p-2'>Kayıtlı gözlem yok.</p>}
                        {records && records.map(r => <SelectItem key={r.id} value={r.id}>{r.studentName} - {new Date(r.recordDate).toLocaleDateString('tr-TR')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedRecordId && <Button onClick={handleDeleteRecord} variant="destructive" className="w-full mt-2"><Trash2 className="mr-2"/> Seçili Kaydı Sil</Button>}
                </CardContent>
             </Card>
        </div>
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader className='flex-row justify-between items-center'>
                    <CardTitle>Gözlem Kayıt Formu</CardTitle>
                    <div className="flex items-center gap-2">
                         <Button onClick={handlePrint} variant="outline" disabled={!selectedRecordId}><Printer className="mr-2"/> Kaydı Yazdır</Button>
                         <Button type="submit" size="lg"><Save className="mr-2"/> Formu Kaydet</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField control={form.control} name="recordDate" render={({ field }) => (
                            <FormItem className="w-1/4"><FormLabel>Tutanak Tarihi</FormLabel><FormControl><Input type="date" placeholder="Tarih" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <p className="font-bold text-lg border-b pb-2">Öğrenci Bilgileri</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {renderField('studentName', 'Adı Soyadı')}
                      {renderField('studentAgeGender', 'Yaşı/Cinsiyeti')}
                    </div>
                     <div className="grid md:grid-cols-2 gap-4">
                        {renderField('studentSchool', 'Okulu')}
                        {renderField('studentClassNumber', 'Sınıfı/Okul Numarası')}
                     </div>
                      {renderField('classTeacherName', 'Sınıf/Şube Rehber Öğretmenin Adı Soyadı')}

                    <p className="font-bold text-lg border-b pb-2 pt-6">Gözlem Bilgileri</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        {renderField('observationPlace', 'Gözlem Yapılan Yer')}
                        {renderField('observationDateTime', 'Gözlem Yapılan Tarih/Saat')}
                      </div>
                       <div className="grid md:grid-cols-2 gap-4">
                         {renderField('observationDuration', 'Gözlem Süresi')}
                         {renderField('observationBehavior', 'Gözlem Yapılacak Davranış')}
                      </div>
                      
                      {renderField('observationPlanning', 'Gözlem Sürecinin Planlanması (Davranışın Nerede, Ne Zaman, Ne Sıklıkta vs. Gözlemleneceği)', true)}
                      {renderField('teacherObservations', 'Öğretmenin Gözlemleri', true)}
                      {renderField('observationEvaluation', 'Gözlem Sürecinin Değerlendirilmesi', true)}
                      {renderField('conclusionAndSuggestions', 'Sonuç ve Öneriler', true)}

                     <p className="font-bold text-lg border-b pb-2 pt-6">Gözlemi Yapan</p>
                     <div className="grid md:grid-cols-2 gap-4">
                        {renderField('observerName', 'Adı Soyadı')}
                        {renderField('observerTitle', 'Unvanı')}
                     </div>
                      {renderField('observerSignature', 'İmza')}
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}
