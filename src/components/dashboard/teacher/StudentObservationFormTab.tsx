'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileDown, Save, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ObservationRecord, TeacherProfile, Class, Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { exportObservationFormToRtf } from '@/lib/word-export';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  id: z.string(),
  recordDate: z.string().min(1, "Tutanak tarihi gerekli"),
  studentId: z.string().min(1, "Öğrenci seçimi zorunludur."),
  observationPlace: z.string().min(1, "Gözlem yeri belirtilmelidir."),
  observationDateTime: z.string().min(1, "Gözlem zamanı belirtilmelidir."),
  observationDuration: z.string().min(1, "Gözlem süresi belirtilmelidir."),
  observationBehavior: z.string().min(1, "Gözlem yapılacak davranış belirtilmelidir."),
  observationPlanning: z.string(),
  teacherObservations: z.string().min(1, "Öğretmen gözlemleri boş bırakılamaz."),
  observationEvaluation: z.string(),
  conclusionAndSuggestions: z.string(),
  observerName: z.string(),
  observerTitle: z.string(),
});

interface StudentObservationFormTabProps {
  students: Student[];
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function StudentObservationFormTab({ students, teacherProfile, currentClass }: StudentObservationFormTabProps) {
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { observationRecords: records = [] } = localDb;
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  const processedRecords = useMemo(() => {
    return (records || []).map(r => ({
      id: r.id,
      name: `${students.find(s => s.id === r.studentId)?.name || 'Bilinmeyen Öğrenci'} - ${new Date(r.recordDate).toLocaleDateString('tr-TR')}`
    })).filter(r => r.name.includes('Bilinmeyen') === false);
  }, [records, students]);
  
  const defaultFormValues = useMemo(() => ({
    studentId: '',
    observationPlace: 'Sınıf İçi - Ders Esnası',
    observationDateTime: '',
    observationDuration: '40 Dakika',
    observationBehavior: '',
    observationPlanning: 'Ders boyunca öğrencinin akademik ve sosyal davranışları doğal ortamında gözlemlenecektir.',
    teacherObservations: '',
    observationEvaluation: '',
    conclusionAndSuggestions: '',
    observerName: teacherProfile?.name || '',
    observerTitle: 'Sınıf Rehber Öğretmeni',
  }), [teacherProfile]);

  const form = useForm<ObservationRecord>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultFormValues
  });

  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    form.reset({
      ...defaultFormValues,
      id: `observation-${Date.now()}`,
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
        const existingRecords = prevDb.observationRecords || [];
        const existingRecordIndex = existingRecords.findIndex(r => r.id === values.id);
        let updatedRecords;

        if (existingRecordIndex > -1) {
            updatedRecords = [...existingRecords];
            updatedRecords[existingRecordIndex] = values;
        } else {
            updatedRecords = [...existingRecords, values];
        }
      
        return { ...prevDb, observationRecords: updatedRecords };
    });
    setSelectedRecordId(values.id);
    toast({ title: 'Kaydedildi', description: 'Gözlem formu başarıyla kaydedildi.' });
  };

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
      ...prevDb,
      observationRecords: (prevDb.observationRecords || []).filter(r => r.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: 'Silindi', description: 'Gözlem kaydı silindi.', variant: 'destructive' });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  const handleExport = () => {
    const values = form.getValues();
    const student = students.find(s => s.id === values.studentId);
    if (!student || !teacherProfile || !currentClass) {
      toast({ title: 'Eksik Bilgi', description: 'Raporu oluşturmak için gerekli tüm veriler yüklenemedi.', variant: 'destructive' });
      return;
    }
    const recordWithStudentInfo: ObservationRecord = {
        ...values,
        studentName: student.name,
        studentClassNumber: `${currentClass.name} / ${student.number}`,
        studentSchool: teacherProfile.schoolName,
        classTeacherName: teacherProfile.name,
    };
    exportObservationFormToRtf({ record: recordWithStudentInfo, teacherProfile, currentClass });
  };
  
  const renderField = (name: keyof ObservationRecord, label: string, isTextArea = false, placeholder = "") => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {isTextArea ? <Textarea {...field} rows={4} value={field.value || ''} placeholder={placeholder} /> : <Input {...field} value={field.value || ''} placeholder={placeholder} />}
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
                  <CardTitle>Öğrenci Gözlem Formu</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={handleExport} variant="outline" disabled={!selectedRecordId}><FileDown className="mr-2"/> RTF Olarak İndir</Button>
                    <Button type="submit" size="lg"><Save className="mr-2"/> Formu Kaydet</Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="studentId" render={({ field }) => (
                      <FormItem className="md:col-span-2"><FormLabel>Gözlem Yapılan Öğrenci</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Öğrenci seçin..." /></SelectTrigger></FormControl>
                          <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.number})</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="recordDate" render={({ field }) => (
                      <FormItem><FormLabel>Tutanak Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  </div>

                  <p className="font-bold text-lg border-b pb-2 pt-4">Gözlem Bilgileri</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {renderField('observationPlace', 'Gözlem Yapılan Yer')}
                    {renderField('observationDateTime', 'Gözlem Yapılan Tarih/Saat')}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {renderField('observationDuration', 'Gözlem Süresi')}
                    {renderField('observationBehavior', 'Gözlemlenecek Davranış')}
                  </div>
                  {renderField('observationPlanning', 'Gözlem Sürecinin Planlanması', true, "Öğrencinin akademik ve sosyal davranışları ders esnasında gözlemlenecektir.")}
                  {renderField('teacherObservations', 'Öğretmenin Gözlemleri', true, "Öğrencinin ders sırasındaki davranışları, arkadaşlarıyla etkileşimi, derse katılımı...")}
                  {renderField('observationEvaluation', 'Gözlem Sürecinin Değerlendirilmesi', true)}
                  {renderField('conclusionAndSuggestions', 'Sonuç ve Öneriler', true)}

                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
    </div>
  );
}
