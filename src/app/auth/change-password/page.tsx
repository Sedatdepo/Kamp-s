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
            Kalıcı Şifre Oluştur
          </h1>
          <p className="text-muted-foreground">Hesabınızı güvence altına almak için yeni bir şifre belirleyin.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Yeni Şifre Belirle</CardTitle>
            <CardDescription>Bu şifreyi daha sonraki girişlerinizde kullanacaksınız.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
