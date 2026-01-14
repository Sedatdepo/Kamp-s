
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const formSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır.'),
  email: z.string().email('Geçersiz e-posta adresi.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
  branch: z.string().min(2, 'Branş gereklidir.'),
  schoolName: z.string().min(3, 'Okul adı gereklidir.'),
  principalName: z.string().min(3, 'Müdür adı gereklidir.'),
  departmentHeadName: z.string().optional(),
  guidanceCounselorName: z.string().optional(),
});

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { auth, db } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      branch: '',
      schoolName: '',
      principalName: '',
      departmentHeadName: '',
      guidanceCounselorName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !db) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Firebase bağlantısı kurulamadı.'});
        return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'teachers', user.uid), {
        id: user.uid,
        name: values.name,
        email: values.email, // store email in teacher profile
        branch: values.branch,
        schoolName: values.schoolName,
        principalName: values.principalName,
        departmentHeadName: values.departmentHeadName,
        guidanceCounselorName: values.guidanceCounselorName,
      });

      toast({
        title: 'Öğretmen Kaydı Başarılı',
        description: 'Hesabınız oluşturuldu. Yönlendiriliyorsunuz...',
      });
      
      // AuthContext will handle the redirection
    } catch (error: any) {
      let description = 'Bilinmeyen bir hata oluştu.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
      }
      toast({
        variant: 'destructive',
        title: 'Kayıt Başarısız',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ad Soyad</FormLabel>
                <FormControl><Input placeholder="Ahmet Yılmaz" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branş/Ders</FormLabel>
                <FormControl><Input placeholder="Matematik" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl><Input placeholder="ogretmen@okul.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre (en az 6 karakter)</FormLabel>
              <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="schoolName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Okul Adı</FormLabel>
                <FormControl><Input placeholder="Merkez Lisesi" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="principalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müdür Adı</FormLabel>
                <FormControl><Input placeholder="Ayşe Kaya" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="departmentHeadName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Zümre Başkanı Adı (İsteğe Bağlı)</FormLabel>
                    <FormControl><Input placeholder="Mehmet Öztürk" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="guidanceCounselorName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Rehber Öğretmen Adı (İsteğe Bağlı)</FormLabel>
                    <FormControl><Input placeholder="Fatma Demir" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Kayıt Ol
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Zaten bir hesabınız var mı?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            Giriş Yap
          </Link>
        </p>
      </form>
    </Form>
  );
}
