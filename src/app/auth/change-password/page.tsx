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
            Update Your Password
          </h1>
          <p className="text-muted-foreground">For security, you must change your default password.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Set New Password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
