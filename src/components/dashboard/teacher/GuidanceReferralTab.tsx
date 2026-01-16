'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, FileDown, Save, Trash2, PlusCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GuidanceReferralRecord, SchoolInfo } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useDatabase } from '@/hooks/use-database';

const formSchema = z.object({
  id: z.string(),
  studentName: z.string().min(1, "Öğrenci adı gerekli"),
  className: z.string(),
  date: z.string(),
  studentNumber: z.string(),
  reason: z.string(),
  observations: z.string(),
  otherInfo: z.string(),
  studiesDone: z.string(),
  referrerName: z.string(),
  referrerTitle: z.string(),
  referrerSignature: z.string().optional(),
});


const generatePdfContent = (data: GuidanceReferralRecord, schoolInfo: SchoolInfo, doc: jsPDF) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REHBERLİK SERVİSİNE ÖĞRENCİ YÖNLENDİRME FORMU', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${schoolInfo.schoolName} OKULU`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

    (doc as any).autoTable({
        startY: 40,
        body: [
            ['Öğrencinin Adı Soyadı', data.studentName, 'Tarih', new Date(data.date).toLocaleDateString('tr-TR')],
            ['Sınıfı', data.className, 'Numarası', data.studentNumber],
        ],
        theme: 'grid'
    });

    const sections = [
        { title: "Öğrencinin rehberlik servisine yönlendirilme nedeni", content: data.reason },
        { title: "Öğrenciyle ilgili gözlem ve düşünceler", content: data.observations },
        { title: "Öğrenciyle ilgili edinilen diğer bilgiler", content: data.otherInfo },
        { title: "Yönlendirmeye neden olan durumla ilgili yapılan çalışmalar", content: data.studiesDone },
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
    doc.text('Yönlendiren', doc.internal.pageSize.getWidth() - 20, finalY + 20, { align: 'right' });
    doc.text(`Ad-Soyad: ${data.referrerName}`, doc.internal.pageSize.getWidth() - 20, finalY + 25, { align: 'right' });
    doc.text(`Unvan: ${data.referrerTitle}`, doc.internal.pageSize.getWidth() - 20, finalY + 30, { align: 'right' });
    doc.text(`İmza: ${data.referrerSignature || ''}`, doc.internal.pageSize.getWidth() - 20, finalY + 35, { align: 'right' });
};


export function GuidanceReferralTab() {
  const { db, setDb } = useDatabase();
  const { schoolInfo, guidanceReferralRecords: records } = db;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const defaultFormValues: GuidanceReferralRecord = {
      id: `record-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      studentName: '',
      className: '',
      studentNumber: '',
      reason: '',
      observations: '',
      otherInfo: '',
      studiesDone: '',
      referrerName: '',
      referrerTitle: 'Sınıf Rehber Öğretmeni',
      referrerSignature: '',
  };

  const form = useForm<GuidanceReferralRecord>({
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
  }, [selectedRecordId, records, form.reset]);

  const onSubmit = (values: GuidanceReferralRecord) => {
    setDb(prevDb => {
        let updatedRecords;
        const existingRecordIndex = prevDb.guidanceReferralRecords.findIndex(r => r.id === values.id);

        if (existingRecordIndex > -1) {
          updatedRecords = [...prevDb.guidanceReferralRecords];
          updatedRecords[existingRecordIndex] = values;
        } else {
          updatedRecords = [...prevDb.guidanceReferralRecords, values];
        }
        return { ...prevDb, guidanceReferralRecords: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Yönlendirme formu başarıyla kaydedildi.' });
  };
  
  const handleNewRecord = () => {
    const newId = `record-${Date.now()}`;
    setSelectedRecordId(null);
    form.reset({
       ...defaultFormValues,
       id: newId,
       date: new Date().toISOString().split('T')[0],
       className: schoolInfo?.className || '',
       referrerName: schoolInfo?.classTeacherName || '',
    });
  }

  const handleDeleteRecord = () => {
    if (!selectedRecordId) return;
    setDb(prevDb => ({
        ...prevDb,
        guidanceReferralRecords: prevDb.guidanceReferralRecords.filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Yönlendirme formu silindi.', variant: 'destructive' });
  };

  const handlePrint = () => {
    const values = form.getValues();
    if (!values.studentName || !schoolInfo) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    const doc = new jsPDF();
    generatePdfContent(values, schoolInfo, doc);
    doc.save(`yonlendirme-formu-${values.studentName}.pdf`);
  };
  
  const renderField = (name: keyof GuidanceReferralRecord, label: string, isTextArea = false) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {isTextArea ? <Textarea {...field} rows={6} value={field.value || ''} /> : <Input {...field} value={field.value || ''} />}
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
                <CardHeader><CardTitle>Yönlendirme Kayıtları</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                     <Button onClick={handleNewRecord} className="w-full"><PlusCircle className="mr-2"/> Yeni Form</Button>
                    <Select onValueChange={setSelectedRecordId} value={selectedRecordId || ''}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kayıtlı formu seç..." />
                      </SelectTrigger>
                      <SelectContent>
                        {records && records.length === 0 && <p className='text-sm text-muted-foreground text-center p-2'>Kayıtlı form yok.</p>}
                        {records && records.map(r => <SelectItem key={r.id} value={r.id}>{r.studentName} - {new Date(r.date).toLocaleDateString('tr-TR')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedRecordId && <Button onClick={handleDeleteRecord} variant="destructive" className="w-full mt-2"><Trash2 className="mr-2"/> Seçili Kaydı Sil</Button>}
                </CardContent>
             </Card>
              <Card>
                 <CardHeader><CardTitle>Genel Ayarlar</CardTitle></CardHeader>
                 <CardContent className="space-y-2">
                    <div className="space-y-2">
                        <Label>Okul Adı</Label>
                        <Input value={schoolInfo?.schoolName || ''} onChange={(e) => setDb({...db, schoolInfo: {...db.schoolInfo, schoolName: e.target.value}})} />
                    </div>
                     <div className="space-y-2">
                        <Label>Sınıfınız</Label>
                        <Input value={schoolInfo?.className || ''} onChange={(e) => setDb({...db, schoolInfo: {...db.schoolInfo, className: e.target.value}})} />
                    </div>
                     <div className="space-y-2">
                        <Label>Adınız Soyadınız</Label>
                        <Input value={schoolInfo?.classTeacherName || ''} onChange={(e) => setDb({...db, schoolInfo: {...db.schoolInfo, classTeacherName: e.target.value}})} />
                    </div>
                 </CardContent>
             </Card>
        </div>
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Yönlendirme Formu</CardTitle>
                        <Button onClick={handlePrint} variant="outline" disabled={!selectedRecordId}><FileDown className="mr-2"/> PDF Çıktı Al</Button>
                    </div>
                    <CardDescription>
                      {schoolInfo?.schoolName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField('studentName', 'Öğrencinin Adı Soyadı')}
                      <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderField('className', 'Sınıfı')}
                        {renderField('studentNumber', 'Numarası')}
                     </div>
                      
                      {renderField('reason', 'Öğrencinin rehberlik servisine yönlendirilme nedeni', true)}
                      {renderField('observations', 'Öğrenciyle ilgili gözlem ve düşünceler', true)}
                      {renderField('otherInfo', 'Öğrenciyle ilgili edinilen diğer bilgiler', true)}
                      {renderField('studiesDone', 'Yönlendirmeye neden olan durumla ilgili yapılan çalışmalar', true)}

                     <p className="font-bold text-lg border-b pb-2 pt-6">Yönlendiren</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {renderField('referrerName', 'Adı Soyadı')}
                        {renderField('referrerTitle', 'Unvanı')}
                     </div>
                      {renderField('referrerSignature', 'İmza')}
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
