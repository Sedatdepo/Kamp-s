import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
            Öğretmen Kaydı
          </h1>
          <p className="text-muted-foreground">Okul asistanınıza katılmak için bilgilerinizi girin.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Yeni Hesap Oluştur</CardTitle>
            <CardDescription>
              Aşağıdaki formu doldurarak öğretmen hesabınızı oluşturun.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
