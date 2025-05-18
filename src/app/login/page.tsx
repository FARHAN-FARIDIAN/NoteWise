
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {useEffect, useState} from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useTranslations } from '@/hooks/useTranslations';
import { Logo } from '@/components/shared/Logo';


const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, user, userData, loading: authLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslations();

  const { register, handleSubmit, formState: { errors: formErrors } } = useForm<LoginFormInputs>({ 
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user) {
      if (userData?.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else if (userData?.role === 'student') {
        router.replace('/student/practice');
      } else {
        router.replace('/'); 
      }
    }
  }, [user, userData, authLoading, router]);

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setError(null); 
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.message || t('login.error.description'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (user && !authLoading && userData)) { 
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-blue-100 p-4">
       <div className="mb-8">
        <Logo size="lg"/>
       </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-foreground">{t('login.title')}</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {t('login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && ( 
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('login.error.title')}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={formErrors.email ? "true" : "false"}
                className={formErrors.email ? "border-destructive" : ""}
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={formErrors.password ? "true" : "false"}
                 className={formErrors.password ? "border-destructive" : ""}
              />
              {formErrors.password && <p className="text-sm text-destructive">{formErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner size={20} /> : t('login.button')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('login.teacher.signupPrompt')}{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/signup">{t('signup.button')}</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
