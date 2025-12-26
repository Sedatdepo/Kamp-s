import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';

export default function ChangePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
            Şifrenizi Güncelleyin
          </h1>
          <p className="text-muted-foreground">Güvenlik için varsayılan şifrenizi değiştirmelisiniz.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Yeni Şifre Belirle</CardTitle>
            <CardDescription>Hesabınız için yeni bir şifre seçin.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
