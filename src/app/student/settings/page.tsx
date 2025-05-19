
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';
import { Loader2, User, Palette, Lock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LOCAL_STORAGE_THEME_KEY } from '@/lib/localStorageKeys';

const accountInfoSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, {message: "Current password is required"}),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});


type AccountInfoInputs = z.infer<typeof accountInfoSchema>;
type PasswordInputs = z.infer<typeof passwordSchema>;
type Theme = "light" | "dark" | "system";

export default function StudentSettingsPage() {
  const { userData, updateDisplayName, updateStudentPassword, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const { toast } = useToast();

  const [isSubmittingAccount, setIsSubmittingAccount] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');

  const { register: registerAccount, handleSubmit: handleSubmitAccount, formState: { errors: accountErrors }, reset: resetAccountForm } = useForm<AccountInfoInputs>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: {
      displayName: userData?.displayName || '',
    },
  });
  
  const { register: registerPassword, handleSubmit: handleSubmitPassword, formState: { errors: passwordErrors }, reset: resetPasswordForm } = useForm<PasswordInputs>({
    resolver: zodResolver(passwordSchema),
  });


  useEffect(() => {
    if (userData) {
      resetAccountForm({ displayName: userData.displayName || '' });
    }
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
    setCurrentTheme(storedTheme || 'system');
  }, [userData, resetAccountForm]);

  const onAccountSubmit: SubmitHandler<AccountInfoInputs> = async (data) => {
    setIsSubmittingAccount(true);
    try {
      await updateDisplayName(data.displayName);
      toast({ title: t('settings.account.success.title'), description: t('settings.account.displayName.success.description') });
    } catch (error: any) {
      toast({ title: t('settings.error.title'), description: error.message || t('settings.error.generic'), variant: "destructive" });
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  const onPasswordSubmit: SubmitHandler<PasswordInputs> = async (data) => {
    setIsSubmittingPassword(true);
    try {
      await updateStudentPassword(data.currentPassword, data.newPassword);
      toast({ title: t('settings.password.success.title'), description: t('settings.password.student.success.description')});
      resetPasswordForm();
    } catch (error: any)
     {
      const errorMessage = error.message === "Current password incorrect." 
        ? t('settings.password.student.error.currentPasswordIncorrect')
        : error.message || t('settings.password.student.error.updateFailed');
      toast({ title: t('settings.error.title'), description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
    }
  };
  
  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else { 
      root.classList.remove('dark'); 
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_STORAGE_THEME_KEY }));
    toast({ title: t('settings.theme.changed.title'), description: t('settings.theme.changed.description', {theme: t(`settings.theme.${theme}` )})});
  };

  if (authLoading || !userData) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('settings.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>{t('settings.account.title')}</CardTitle>
          <CardDescription>{t('settings.account.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitAccount(onAccountSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.account.email.label')}</Label>
              <Input id="email" type="email" value={userData.email || ''} readOnly disabled className="bg-muted/50"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('settings.account.displayName.label')}</Label>
              <Input id="displayName" {...registerAccount("displayName")} className={accountErrors.displayName ? "border-destructive" : ""}/>
              {accountErrors.displayName && <p className="text-sm text-destructive">{accountErrors.displayName.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmittingAccount}>
              {isSubmittingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.account.saveButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5 text-primary"/>{t('settings.password.title')}</CardTitle>
          <CardDescription>{t('settings.password.student.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.password.current.label')}</Label>
              <Input id="currentPassword" type="password" {...registerPassword("currentPassword")} className={passwordErrors.currentPassword ? "border-destructive" : ""}/>
              {passwordErrors.currentPassword && <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.password.new.label')}</Label>
              <Input id="newPassword" type="password" {...registerPassword("newPassword")} className={passwordErrors.newPassword ? "border-destructive" : ""}/>
              {passwordErrors.newPassword && <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.password.confirm.label')}</Label>
              <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} className={passwordErrors.confirmPassword ? "border-destructive" : ""}/>
              {passwordErrors.confirmPassword && <p className="text-sm text-destructive">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmittingPassword}>
              {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.password.saveButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary"/>{t('settings.theme.title')}</CardTitle>
          <CardDescription>{t('settings.theme.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={currentTheme} onValueChange={(value: Theme) => handleThemeChange(value)} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light">{t('settings.theme.light')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark">{t('settings.theme.dark')}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system">{t('settings.theme.system')}</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
