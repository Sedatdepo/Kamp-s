'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Save, Trash2, PlusCircle, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ObservationRecord, TeacherProfile, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { exportObservationFormToRtf } from '@/lib/word-export';


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


export function StudentObservationFormTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { observationDocuments: records = [] } = localDb;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  const processedRecords = useMemo(() => {
    return (records || []).map(r => ({ id: r.id, name: `${r.studentName} - ${new Date(r.recordDate).toLocaleDateString('tr-TR')}` }))
  }, [records]);

  const defaultFormValues = useMemo(() => ({
      studentName: '', studentAgeGender: '', 
      studentSchool: teacherProfile?.schoolName || '', 
      studentClassNumber: currentClass ? `${currentClass.name} - ` : '', 
      classTeacherName: teacherProfile?.name || '',
      observationPlace: '', observationDateTime: '', observationDuration: '', observationBehavior: '',
      observationPlanning: '', teacherObservations: '', observationEvaluation: '', conclusionAndSuggestions: '',
      observerName: teacherProfile?.name || '', 
      observerTitle: 'Sınıf Rehber Öğretmeni', 
      observerSignature: '',
  }), [teacherProfile, currentClass]);

  const form = useForm<ObservationRecord>({
    resolver: zodResolver(formSchema),
  });

  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    form.reset({
      ...defaultFormValues,
      id: `record-${Date.now()}`,
      recordDate: new Date().toISOString().split('T')[0],
    });
  }, [form, defaultFormValues]);
  
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

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
      ...prevDb,
      observationDocuments: (prevDb.observationDocuments || []).filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Gözlem kaydı silindi.', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  const handleExport = () => {
    const values = form.getValues();
    if (!values.studentName) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    exportObservationFormToRtf({ record: values, teacherProfile, currentClass });
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
          records={processedRecords}
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
                  <Button type="button" onClick={handleExport} variant="outline" disabled={!selectedRecordId}><FileDown className="mr-2"/> RTF Olarak İndir</Button>
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
