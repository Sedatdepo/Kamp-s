'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, FileText, Save, Trash2, PlusCircle, Copy, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { StudentInfoFormData, SchoolInfo, GuidanceReferralRecord } from '@/lib/types';
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


const formSchema = z.object({
  id: z.string(),
  studentName: z.string().min(1, "Öğrenci adı gerekli"),
  className: z.string().optional(),
  date: z.string(),
  studentNumber: z.string().optional(),
  reason: z.string().optional(),
  observations: z.string().optional(),
  otherInfo: z.string().optional(),
  studiesDone: z.string().optional(),
  referrerName: z.string().optional(),
  referrerTitle: z.string().optional(),
  referrerSignature: z.string().optional(),
});


const generatePdfContent = (data: GuidanceReferralRecord, schoolInfo: SchoolInfo | undefined, doc: any) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('REHBERLİK SERVİSİNE ÖĞRENCİ YÖNLENDİRME FORMU', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`${schoolInfo?.schoolName || '...'} OKULU`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });

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
            body: [[section.content || ' ']],
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
             bodyStyles: { minCellHeight: 30 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 5;
    });


    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.text('Yönlendiren', doc.internal.pageSize.getWidth() - 20, finalY + 20, { align: 'right' });
    doc.text(`Ad-Soyad: ${data.referrerName || ''}`, doc.internal.pageSize.getWidth() - 20, finalY + 25, { align: 'right' });
    doc.text(`Unvan: ${data.referrerTitle || ''}`, doc.internal.pageSize.getWidth() - 20, finalY + 30, { align: 'right' });
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

  const handleNewRecord = useCallback(() => {
    const newId = `record-${Date.now()}`;
    setSelectedRecordId(null);
    form.reset({
       ...defaultFormValues,
       id: newId,
       date: new Date().toISOString().split('T')[0],
       className: schoolInfo?.className || '',
       referrerName: schoolInfo?.classTeacherName || '',
    });
  }, [form, defaultFormValues, schoolInfo]);

  useEffect(() => {
    if (selectedRecordId) {
      const recordData = records.find(r => r.id === selectedRecordId); 
      if (recordData) {
        form.reset(recordData);
      }
    } else {
        handleNewRecord();
    }
  }, [selectedRecordId, records, form, handleNewRecord]);


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
    // Dynamically import jspdf and jspdf-autotable to avoid server-side errors
    Promise.all([import('jspdf'), import('jspdf-autotable')]).then(([jspdfModule, autoTableModule]) => {
        const jsPDF = jspdfModule.default;
        // The default export might be nested under `default` in some bundlers
        const autoTable = (autoTableModule as any).default || autoTableModule;
        const doc = new jsPDF();
        generatePdfContent(values, schoolInfo, doc);
        doc.save(`yonlendirme-formu-${values.studentName}.pdf`);
    }).catch(error => {
        console.error("Failed to load PDF libraries", error);
        toast({ title: "PDF Oluşturma Hatası", description: "Gerekli kütüphaneler yüklenemedi.", variant: "destructive" });
    });
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
                <CardHeader>
                    <CardTitle>İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={handlePrint} variant="outline" disabled={!selectedRecordId} className="w-full"><FileDown className="mr-2"/> PDF Çıktı Al</Button>
                </CardContent>
             </Card>
        </div>
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle>Yönlendirme Formu</CardTitle>
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
