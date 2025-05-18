
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music2, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import Image from 'next/image';
import { useTranslations } from '@/hooks/useTranslations';
import { Logo } from '@/components/shared/Logo';
import image from '@/assets/images/img.png';

export default function HomePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    if (!loading && user) {
      if (userData?.role === 'teacher') {
        router.replace('/teacher/dashboard');
      } else if (userData?.role === 'student') {
        router.replace('/student/practice');
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-blue-100">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-blue-100">
        <LoadingSpinner size={48} />
        <p className="mt-4 text-foreground">{t('page.home.loadingSpace')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex h-20 items-center justify-between py-4">
        <Logo />
        <div className="space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/login">{t('login.button')}</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">{t('page.home.getStartedTeacher')}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto flex flex-col items-center justify-center py-16 text-center md:py-24 lg:py-32">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t('page.home.title')}
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            {t('page.home.description')}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild className="shadow-lg">
              <Link href="/signup">{t('page.home.getStartedTeacher')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg">
              <Link href="/login">{t('page.home.studentLogin')}</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary py-16 md:py-24">
          <div className="container mx-auto grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <Music2 size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t('page.home.feature1.title')}</h3>
              <p className="text-muted-foreground">{t('page.home.feature1.description')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <Users size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t('page.home.feature2.title')}</h3>
              <p className="text-muted-foreground">{t('page.home.feature2.description')}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-primary/20 p-4 text-primary">
                <CheckCircle size={32} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">{t('page.home.feature3.title')}</h3>
              <p className="text-muted-foreground">{t('page.home.feature3.description')}</p>
            </div>
          </div>
        </section>
        
        <section className="container mx-auto py-16 md:py-24">
            <div className="flex flex-col items-center md:flex-row md:gap-12">
                <div className="md:w-1/2 mb-8 md:mb-0">
                    <Image 
                        src="/img1.png" 
                        alt="Music practice illustration"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-xl"
                        data-ai-hint="music lesson"
                    />
                </div>
                <div className="md:w-1/2 text-center md:text-left">
                    <h2 className="text-3xl font-bold text-foreground mb-4">{t('page.home.elevate.title')}</h2>
                    <p className="text-lg text-muted-foreground mb-6">
                        {t('page.home.elevate.description')}
                    </p>
                    <Button size="lg" asChild className="shadow-md">
                        <Link href="/signup">{t('page.home.joinToday')}</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      <footer className="border-t bg-background py-8 text-center">
        <p className="text-sm text-muted-foreground">{t('page.home.footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
