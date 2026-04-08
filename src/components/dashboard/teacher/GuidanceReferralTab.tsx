'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, FileDown, Save, Trash2, PlusCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GuidanceReferralRecord, SchoolInfo, TeacherProfile, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { exportGuidanceReferralToRtf } from '@/lib/word-export';


const formSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  data: z.any(),
  studentName: z.string().min(1, "Öğrenci adı gerekli"),
  className: z.string().optional(),
  studentNumber: z.string().optional(),
  reason: z.string().optional(),
  observations: z.string().optional(),
  otherInfo: z.string().optional(),
  studiesDone: z.string().optional(),
  referrerName: z.string().optional(),
  referrerTitle: z.string().optional(),
  referrerSignature: z.string().optional(),
});



export function GuidanceReferralTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { guidanceReferralRecords: records = [] } = localDb;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  const processedRecords = useMemo(() => {
    return (records || []).map(r => ({ id: r.id, name: `${r.studentName} - ${new Date(r.date).toLocaleDateString('tr-TR')}` }))
  }, [records]);
  
  const defaultFormValues = useMemo(() => ({
      studentName: '',
      className: currentClass?.name || '',
      studentNumber: '',
      reason: '',
      observations: '',
      otherInfo: '',
      studiesDone: '',
      referrerName: teacherProfile?.name || '',
      referrerTitle: 'Sınıf Rehber Öğretmeni',
      referrerSignature: '',
      name: '',
      data: null,
  }), [currentClass, teacherProfile]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema) as any,
  });

  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    form.reset({
      ...defaultFormValues,
      id: `record-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
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


  const onSubmit = (values: GuidanceReferralRecord) => {
    setLocalDb(prevDb => {
        const existingRecords = prevDb.guidanceReferralRecords || [];
        const existingRecordIndex = existingRecords.findIndex(r => r.id === values.id);
        let updatedRecords;

        if (existingRecordIndex > -1) {
            updatedRecords = [...existingRecords];
            updatedRecords[existingRecordIndex] = values;
        } else {
            updatedRecords = [...existingRecords, values];
        }
        
        return { ...prevDb, guidanceReferralRecords: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Yönlendirme formu başarıyla kaydedildi.' });
  };

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
        ...prevDb,
        guidanceReferralRecords: (prevDb.guidanceReferralRecords || []).filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Yönlendirme formu silindi.', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  const handleExport = () => {
    const values = form.getValues();
    if (!values.studentName || !teacherProfile) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen formu yazdırmak için önce formu kaydedin.', variant: 'destructive' });
      return;
    }
    exportGuidanceReferralToRtf({ record: values, teacherProfile });
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
  
  return (
    <div className="grid md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-4">
             <RecordManager
                records={processedRecords}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Yönlendirme Formu"
            />
        </div>
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Yönlendirme Formu</CardTitle>
                        <Button type="button" onClick={handleExport} variant="outline" disabled={!selectedRecordId}><FileDown className="mr-2"/> RTF Olarak İndir</Button>
                    </div>
                    <CardDescription>
                      {teacherProfile?.schoolName}
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
                      {renderField('observations', 'Öğrenciyle ilgili gözlemler', true)}
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
