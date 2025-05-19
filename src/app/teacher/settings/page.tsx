
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
  currentPassword: z.string().optional(), // Only for demo teacher or if feature is expanded
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

type AccountInfoInputs = z.infer<typeof accountInfoSchema>;
type PasswordInputs = z.infer<typeof passwordSchema>;
type Theme = "light" | "dark" | "system";

export default function TeacherSettingsPage() {
  const { user, userData, updateDisplayName, updateUserPassword, loading: authLoading } = useAuth();
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
    if (userData?.email === 'teacher@example.com') {
        toast({ title: t('settings.password.demo.title'), description: t('settings.password.demo.description'), variant: "default" });
        resetPasswordForm();
        return;
    }
    setIsSubmittingPassword(true);
    try {
      // For now, we directly update. In a real app, currentPassword would be verified.
      await updateUserPassword(data.newPassword);
      toast({ title: t('settings.password.success.title'), description: t('settings.password.success.description') });
      resetPasswordForm();
    } catch (error: any) {
      toast({ title: t('settings.error.title'), description: error.message || t('settings.error.generic'), variant: "destructive" });
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
    } else { // system
      root.classList.remove('dark'); // Remove explicit dark first
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
     // Dispatch a storage event to ensure RootLayout re-evaluates, if it's listening
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
          <CardDescription>{t('settings.password.description.teacher')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
            {/* <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...registerPassword("currentPassword")} />
            </div> */}
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
