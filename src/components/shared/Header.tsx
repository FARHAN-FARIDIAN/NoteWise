
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, LayoutDashboard, Music, Users, Settings, Languages, Sun, Moon, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslations } from '@/hooks/useTranslations';
import { useEffect, useState } from 'react';
import { LOCAL_STORAGE_THEME_KEY } from '@/lib/localStorageKeys';

type Theme = "light" | "dark";

export function Header() {
  const { user, userData, logout, loading } = useAuth();
  const router = useRouter();
  const { language, setLanguage, dir } = useLanguage();
  const { t } = useTranslations();
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    const root = window.document.documentElement;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme === 'dark' || (!storedTheme && storedTheme !== 'light' && systemPrefersDark)) {
      setCurrentTheme('dark');
      root.classList.add('dark');
    } else {
      setCurrentTheme('light');
      root.classList.remove('dark');
    }
  }, []);


  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
    const root = window.document.documentElement;
    root.classList.remove(currentTheme === "light" ? "light" : "dark");
    root.classList.add(newTheme);
    // Dispatch storage event so RootLayout and Settings page can also react if needed
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_STORAGE_THEME_KEY, newValue: newTheme }));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const settingsPath = userData?.role === 'teacher' ? '/teacher/settings' : '/student/settings';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-1 md:gap-2">
          {loading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user && userData ? (
            <>
              {userData.role === 'teacher' && (
                <div className="hidden md:flex items-center gap-1">
                  <Button variant="ghost" asChild>
                    <Link href="/teacher/dashboard">{t('header.dashboard')}</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/teacher/students">{t('header.students')}</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/teacher/routines">{t('header.routines')}</Link>
                  </Button>
                   <Button variant="ghost" asChild>
                    <Link href="/teacher/resume">{t('teacher.resume.sidebarLink')}</Link>
                  </Button>
                </div>
              )}
               {userData.role === 'student' && (
                <Button variant="ghost" asChild className="hidden md:inline-flex">
                  <Link href="/student/practice">{t('header.myPractice')}</Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={t('header.toggleTheme')}
                className="h-10 w-10"
              >
                {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 px-0">
                     <Languages className="h-5 w-5" />
                     <span className="sr-only">{t('header.language')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'}>
                  <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as 'en' | 'fa')}>
                    <DropdownMenuRadioItem value="en">
                       {t('header.english')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fa">
                       {t('header.farsi')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={undefined} alt={userData.displayName || 'User'} />
                      <AvatarFallback>{getInitials(userData.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align={dir === 'rtl' ? 'start' : 'end'} forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userData.role === 'teacher' && (
                    <DropdownMenuItem onClick={() => router.push('/teacher/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>{t('header.dashboard')}</span>
                    </DropdownMenuItem>
                  )}
                   {userData.role === 'teacher' && ( 
                    <>
                      <DropdownMenuItem onClick={() => router.push('/teacher/students')} className="md:hidden">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{t('header.students')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/teacher/routines')} className="md:hidden">
                        <Music className="mr-2 h-4 w-4" />
                        <span>{t('header.routines')}</span>
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => router.push('/teacher/resume')} className="md:hidden">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>{t('teacher.resume.sidebarLink')}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  {userData.role === 'student' && (
                     <>
                      <DropdownMenuItem onClick={() => router.push('/student/practice')}>
                        <Music className="mr-2 h-4 w-4" />
                        <span>{t('header.myPractice')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/student/teacher-profile')}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>{t('student.teacherProfile.menuLink')}</span>
                      </DropdownMenuItem>
                     </>
                  )}
                  <DropdownMenuItem onClick={() => router.push(settingsPath)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('header.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
             <>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={t('header.toggleTheme')}
                className="h-10 w-10"
              >
                {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 px-0">
                     <Languages className="h-5 w-5" />
                     <span className="sr-only">{t('header.language')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('header.language')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuRadioGroup value={language} onValueChange={(value) => setLanguage(value as 'en' | 'fa')}>
                    <DropdownMenuRadioItem value="en">
                       {t('header.english')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fa">
                       {t('header.farsi')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" asChild>
                <Link href="/login">{t('login.button')}</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">{t('signup.button')}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
