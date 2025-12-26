import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/Logo';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo className="h-12 w-12 text-primary" />
          <h1 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground">
            Create a Teacher Account
          </h1>
          <p className="text-muted-foreground">Join CampusConnect and manage your classes with ease.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Register</CardTitle>
            <CardDescription>Fill in the details below to create your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
