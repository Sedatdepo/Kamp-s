"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
  classId: z.string().min(1, { message: 'Lütfen sınıfınızı seçin.' }),
  studentNumber: z.string().min(1, { message: 'Öğrenci numarası gereklidir.' }),
  password: z.string().min(1, { message: 'Şifre gereklidir.' }),
});

export function StudentLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInStudent } = useAuth();
  const { data: classes, loading: classesLoading } = useFirestore<Class>('classes');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      classId: '',
      studentNumber: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInStudent(values.classId, values.studentNumber, values.password);
      toast({
        title: 'Giriş Başarılı',
        description: 'Hoş geldin! Panele yönlendiriliyorsun...',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description: 'Girdiğiniz bilgiler hatalı.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sınıf</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={classesLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sınıfınızı seçin..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {classesLoading ? (
                    <div className='p-2 space-y-2'>
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="studentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Öğrenci Numarası</FormLabel>
              <FormControl>
                <Input placeholder="örn. 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş Yap
        </Button>
      </form>
    </Form>
  );
}
