
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { TeacherProfile } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, "Öğretmen adı zorunludur."),
  email: z.string().email("Geçersiz e-posta adresi."),
  branch: z.string().min(1, "Branş zorunludur."),
  schoolName: z.string().min(1, "Okul adı zorunludur."),
  principalName: z.string().min(1, "Okul müdürü adı zorunludur."),
});

type FormData = z.infer<typeof formSchema>;

export function KullaniciBilgileri({ teacherProfile }: { teacherProfile: TeacherProfile | null }) {
  const { setDb } = useDatabase();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: teacherProfile?.name || '',
      email: teacherProfile?.email || '',
      branch: teacherProfile?.branch || '',
      schoolName: teacherProfile?.schoolName || '',
      principalName: teacherProfile?.principalName || '',
    },
  });

  const onSubmit = (values: FormData) => {
    if (!teacherProfile) return;

    const updatedProfile: TeacherProfile = {
      ...teacherProfile,
      ...values,
    };

    setDb(prevDb => ({
      ...prevDb,
      teacherProfile: updatedProfile,
    }));

    toast({ title: 'Başarılı', description: 'Kullanıcı bilgileri güncellendi.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kullanıcı Bilgileri</CardTitle>
        <CardDescription>Kişisel bilgilerinizi buradan güncelleyebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branş</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okul Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="principalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Okul Müdürü</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
