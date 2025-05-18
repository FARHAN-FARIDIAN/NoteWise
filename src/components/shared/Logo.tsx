
"use client";
import { Music2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { t } = useTranslations();
  const textSizeClass = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-xl';
  const iconSize = size === 'lg' ? 30 : size === 'md' ? 24 : 20;

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Music2 
        className={`text-primary group-hover:text-accent transition-colors duration-300`} 
        size={iconSize} 
        aria-hidden="true"
      />
      <h1 className={`font-bold ${textSizeClass} text-foreground group-hover:text-accent transition-colors duration-300`}>
        {t('app.name')}
      </h1>
    </Link>
  );
}
