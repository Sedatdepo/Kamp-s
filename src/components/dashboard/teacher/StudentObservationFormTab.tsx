'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { PlusCircle, Trash2, Loader2, Save } from 'lucide-react';
import { RecordManager } from './RecordManager';

const observationSchema = z.object({
  studentId: z.string().min(1, "Öğrenci seçimi zorunludur."),
  observationDate: z.string().min(1, "Gözlem tarihi zorunludur."),
  academicObservation: z.string().optional(),
  socialObservation: z.string().optional(),
  behavioralObservation: z.string().optional(),
  teacherNotes: z.string().optional(),
  recommendations: z.string().optional(),
});

const formSchema = z.object({
  id: z.string(),
  name: z.string(),
  classId: z.string(),
  observations: z.array(observationSchema),
});

type ObservationFormData = z.infer<typeof formSchema>;

export function StudentObservationFormTab({ classId, teacherProfile, currentClass }: { classId: string; teacherProfile: TeacherProfile | null; currentClass: Class | null; }) {
  const { db } = useAuth();
  const { db: localDb, setDb: setLocalDb } = useDatabase();
  const { toast } = useToast();
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
  const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

  const form = useForm<ObservationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: `obs_${Date.now()}`,
      name: `Gözlem Formu - ${new Date().toLocaleDateString('tr-TR')}`,
      classId: classId,
      observations: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "observations"
  });

  useEffect(() => {
    const record = localDb.observationDocuments?.find(doc => doc.id === selectedRecordId);
    if (record) {
      form.reset(record.data);
    } else {
      const defaultName = `${currentClass?.name || 'Sınıf'} Gözlem Formu - ${new Date().toLocaleDateString('tr-TR')}`;
      form.reset({
        id: `obs_${Date.now()}`,
        name: defaultName,
        classId: classId,
        observations: []
      });
    }
  }, [selectedRecordId, localDb.observationDocuments, form, classId, currentClass]);

  const handleSave = (data: ObservationFormData) => {
    setLocalDb(prev => {
      const existingIndex = (prev.observationDocuments || []).findIndex(doc => doc.id === data.id);
      let newDocs;
      if (existingIndex > -1) {
        newDocs = [...(prev.observationDocuments || [])];
        newDocs[existingIndex] = { ...newDocs[existingIndex], name: data.name, data };
      } else {
        newDocs = [...(prev.observationDocuments || []), { id: data.id, name: data.name, date: new Date().toISOString(), classId, data }];
      }
      return { ...prev, observationDocuments: newDocs };
    });
    setSelectedRecordId(data.id);
    toast({ title: 'Başarılı!', description: 'Gözlem formu kaydedildi.' });
  };
  
  const handleNew = () => setSelectedRecordId(null);
  const handleDelete = () => {
    if (!selectedRecordId) return;
    setLocalDb(prev => ({...prev, observationDocuments: (prev.observationDocuments || []).filter(d => d.id !== selectedRecordId) }));
    handleNew();
    toast({ title: 'Silindi', variant: 'destructive'});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <RecordManager 
          records={localDb.observationDocuments?.filter(d => d.classId === classId) || []}
          selectedRecordId={selectedRecordId}
          onSelectRecord={setSelectedRecordId}
          onNewRecord={handleNew}
          onDeleteRecord={handleDelete}
          noun="Gözlem Formu"
        />
      </div>
      <div className="lg:col-span-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gözlem Formu</CardTitle>
                <CardDescription>Bu formdaki gözlemleriniz, öğrenci gelişim raporlarına otomatik olarak yansıtılacaktır.</CardDescription>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Adı</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )}/>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-slate-50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="grid grid-cols-2 gap-4 w-2/3">
                          <FormField control={form.control} name={`observations.${index}.studentId`} render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Öğrenci</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger>{field.value ? students?.find(s => s.id === field.value)?.name : "Öğrenci Seçin"}</SelectTrigger></FormControl>
                                      <SelectContent>
                                          {studentsLoading ? <Loader2 className="animate-spin m-4"/> : students?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </FormItem>
                          )}/>
                          <FormField control={form.control} name={`observations.${index}.observationDate`} render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Gözlem Tarihi</FormLabel>
                                  <FormControl><Input type="date" {...field} /></FormControl>
                              </FormItem>
                          )}/>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                    <div className="space-y-2">
                       <FormField control={form.control} name={`observations.${index}.academicObservation`} render={({ field }) => ( <Textarea placeholder="Akademik gözlemler (Derse katılım, ödevler, sınav başarısı...)" {...field} /> )}/>
                       <FormField control={form.control} name={`observations.${index}.socialObservation`} render={({ field }) => ( <Textarea placeholder="Sosyal gözlemler (Arkadaşlık ilişkileri, grup çalışması...)" {...field} /> )}/>
                       <FormField control={form.control} name={`observations.${index}.behavioralObservation`} render={({ field }) => ( <Textarea placeholder="Davranışsal gözlemler (Kurallara uyum, tutum...)" {...field} /> )}/>
                       <FormField control={form.control} name={`observations.${index}.teacherNotes`} render={({ field }) => ( <Textarea placeholder="Öğretmenin genel notları ve ek görüşleri..." {...field} /> )}/>
                       <FormField control={form.control} name={`observations.${index}.recommendations`} render={({ field }) => ( <Textarea placeholder="Öğrenciye/veliye yönelik tavsiyeler..." {...field} /> )}/>
                    </div>
                  </Card>
                ))}

                <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => append({ studentId: '', observationDate: new Date().toISOString().split('T')[0] })}>
                  <PlusCircle className="mr-2" /> Yeni Gözlem Ekle
                </Button>
                 <Button type="submit" className="w-full">
                  <Save className="mr-2 h-4 w-4"/> Kaydet
                </Button>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
