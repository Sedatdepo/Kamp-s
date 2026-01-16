'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Printer, Save, Trash2, PlusCircle, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ObservationRecord, TeacherProfile, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';

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


const generateWordContent = (data: ObservationRecord, teacherProfile: TeacherProfile | null, currentClass: Class | null) => {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <title>Öğrenci Gözlem Kaydı</title>
        <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; }
            .container { width: 100%; margin: auto; padding: 1cm; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 14pt; font-weight: bold; }
            .date-field { text-align: right; margin-bottom: 10px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .table td { border: 1px solid black; padding: 8px; }
            .table td:first-child { font-weight: bold; background-color: #f2f2f2; width: 40%; }
            .textarea-content { min-height: 100px; vertical-align: top; }
            .signature-area { margin-top: 50px; text-align: right; }
        </style>
    </head>
    <body>
        <div class="container">
            <p style="text-align:center;">ÖZEL EĞİTİM VE REHBERLİK HİZMETLERİ GENEL MÜDÜRLÜĞÜ</p>
            <div class="header">
                <h1 class="main-title">ÖĞRENCİ GÖZLEM KAYDI</h1>
                <div class="date-field">Tarih: ${new Date(data.recordDate).toLocaleDateString('tr-TR')}</div>
            </div>

            <table class="table">
                <tr><td>Adı Soyadı</td><td>${data.studentName}</td></tr>
                <tr><td>Yaşı/Cinsiyeti</td><td>${data.studentAgeGender}</td></tr>
                <tr><td>Okulu</td><td>${data.studentSchool}</td></tr>
                <tr><td>Sınıfı/Okul Numarası</td><td>${data.studentClassNumber}</td></tr>
                <tr><td>Sınıf/Şube Rehber Öğretmenin Adı Soyadı</td><td>${data.classTeacherName}</td></tr>
                <tr><td>Gözlem Yapılan Yer</td><td>${data.observationPlace}</td></tr>
                <tr><td>Gözlem Yapılan Tarih/Saat</td><td>${data.observationDateTime}</td></tr>
                <tr><td>Gözlem Süresi</td><td>${data.observationDuration}</td></tr>
                <tr><td>Gözlem Yapılacak Davranış</td><td>${data.observationBehavior}</td></tr>
                <tr><td class="textarea-content">Gözlem Sürecinin Planlanması (Davranışın Nerede, Ne Zaman, Ne Sıklıkta vs. Gözlemleneceği)</td><td class="textarea-content">${data.observationPlanning.replace(/\n/g, '<br/>')}</td></tr>
                <tr><td class="textarea-content">Öğretmenin Gözlemleri</td><td class="textarea-content">${data.teacherObservations.replace(/\n/g, '<br/>')}</td></tr>
                <tr><td class="textarea-content">Gözlem Sürecinin Değerlendirilmesi</td><td class="textarea-content">${data.observationEvaluation.replace(/\n/g, '<br/>')}</td></tr>
                <tr><td class="textarea-content">Sonuç ve Öneriler</td><td class="textarea-content">${data.conclusionAndSuggestions.replace(/\n/g, '<br/>')}</td></tr>
            </table>

            <div class="signature-area">
                <p>${data.observerName}</p>
                <p>${data.observerTitle}</p>
                <p>İmza</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

export function StudentObservationFormTab({ classId, teacherProfile, currentClass }: { classId: string; teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { observationDocuments: records = [] } = localDb;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  const handleNewRecord = useCallback(() => {
    const newId = `record-${Date.now()}`;
    setSelectedRecordId(null);
    form.reset({
       ...defaultFormValues,
       id: newId,
       recordDate: new Date().toISOString().split('T')[0],
       studentSchool: teacherProfile?.schoolName || '',
       studentClassNumber: currentClass ? `${currentClass.name} - ` : '',
       classTeacherName: teacherProfile?.name || '',
       observerName: teacherProfile?.name || '',
       observerTitle: 'Sınıf Rehber Öğretmeni',
    });
  }, [form, defaultFormValues, teacherProfile, currentClass]);

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


  const onSubmit = (values: ObservationRecord) => {
    setLocalDb(prevDb => {
        const existingRecords = prevDb.observationDocuments || [];
        const existingRecordIndex = existingRecords.findIndex(r => r.id === values.id);
        let updatedRecords;

        if (existingRecordIndex > -1) {
            updatedRecords = [...existingRecords];
            updatedRecords[existingRecordIndex] = values;
        } else {
            updatedRecords = [...existingRecords, values];
        }
        
        return { ...prevDb, observationDocuments: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Gözlem kaydı başarıyla kaydedildi.' });
  };
  

  const handleDeleteRecord = () => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
        ...prevDb,
        observationDocuments: (prevDb.observationDocuments || []).filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Gözlem kaydı silindi.', variant: 'destructive' });
  };

  const handlePrint = () => {
    const values = form.getValues();
    if (!values.studentName || !teacherProfile || !currentClass) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    const content = generateWordContent(values, teacherProfile, currentClass);
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gozlem-kaydi-${values.studentName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  
  return (
      <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
             <RecordManager
                records={(records || []).map(r => ({ id: r.id, name: `${r.studentName} - ${new Date(r.recordDate).toLocaleDateString('tr-TR')}` }))}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Gözlem Kaydı"
            />
        </div>
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader className='flex-row justify-between items-center'>
                    <CardTitle>Gözlem Kayıt Formu</CardTitle>
                    <div className="flex items-center gap-2">
                         <Button type="button" onClick={handlePrint} variant="outline" disabled={!selectedRecordId}><Printer className="mr-2"/> Kaydı Yazdır</Button>
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
      </div>
  );
}
