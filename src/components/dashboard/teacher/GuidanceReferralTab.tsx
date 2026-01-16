'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Save, Trash2, PlusCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GuidanceReferralRecord, TeacherProfile, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabase } from '@/hooks/use-database';
import { exportGuidanceReferralToRtf } from '@/lib/word-export';
import { RecordManager } from './RecordManager';


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


export function GuidanceReferralTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { guidanceReferralRecords: records } = localDb;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultFormValues: GuidanceReferralRecord = {
      id: `record-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
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
  }, [selectedRecordId, records]);

  useEffect(() => {
    if(teacherProfile && !selectedRecordId) {
        form.reset({
            ...defaultFormValues,
            id: `record-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            referrerName: teacherProfile.name,
            className: currentClass?.name || '',
        });
    }
  }, [teacherProfile, currentClass, selectedRecordId]);


  const onSubmit = (values: GuidanceReferralRecord) => {
    setLocalDb(prevDb => {
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
       className: currentClass?.name || '',
       referrerName: teacherProfile?.name || '',
    });
  }

  const handleDeleteRecord = () => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
        ...prevDb,
        guidanceReferralRecords: prevDb.guidanceReferralRecords.filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Yönlendirme formu silindi.', variant: 'destructive' });
  };

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
                records={records}
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