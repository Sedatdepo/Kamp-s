import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg text-center">
        <div className="flex flex-col items-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Kayıtlar Kapalı</CardTitle>
            <CardDescription className="text-lg">
              Bu platformda yeni öğretmen kaydı oluşturma işlemi devre dışı bırakılmıştır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Eğer bir hesabınız varsa, giriş sayfasına dönebilirsiniz.
            </p>
            <Button asChild>
              <Link href="/">Giriş Sayfasına Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
