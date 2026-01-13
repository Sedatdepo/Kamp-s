
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Lütfen geçerli bir e-posta girin.' }),
  password: z.string().min(1, { message: 'Şifre gereklidir.' }),
});

export function TeacherLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signInTeacher } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInTeacher(values.email, values.password);
      // Başarılı giriş sonrası yönlendirme AuthContext tarafından yapılacak.
    } catch (error: any) {
      let description = 'E-posta veya şifre hatalı.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = 'Girdiğiniz e-posta veya şifre yanlış.';
      } else if (error.code === 'auth/too-many-requests') {
        description = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
      }
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description,
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl>
                <Input placeholder="ornek@okul.com" {...field} />
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
         <p className="text-center text-sm text-muted-foreground">
          Hesabınız yok mu?{' '}
          <Link href="/auth/register" className="font-medium text-primary hover:underline">
            Kayıt Olun
          </Link>
        </p>
      </form>
    </Form>
  );
}
