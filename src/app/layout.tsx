
"use client"; // Required for useEffect

import type { Metadata } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { useEffect } from 'react';
import { LOCAL_STORAGE_THEME_KEY } from '@/lib/localStorageKeys';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'], 
  variable: '--font-vazirmatn',
  display: 'swap',
});

// Static metadata - cannot use hooks here
// export const metadata: Metadata = {
//   title: 'NoteWise', 
//   description: 'Music practice tracker for teachers and students',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    // Apply theme from localStorage or system preference
    const applyTheme = () => {
      const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
      const root = window.document.documentElement;
      
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (storedTheme === 'dark' || (!storedTheme && storedTheme !== 'light' && systemPrefersDark)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(); // Apply on initial load

    // Watch for changes in localStorage (e.g., from settings page)
    // This is a simple way; a more robust solution might use a global state or custom event.
    window.addEventListener('storage', (e) => {
      if (e.key === LOCAL_STORAGE_THEME_KEY) {
        applyTheme();
      }
    });
    
    // Watch for changes in system theme preference if 'system' is selected or no theme is stored
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
        if (storedTheme === 'system' || !storedTheme) {
            applyTheme();
        }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', applyTheme); // Clean up
    };
  }, []);

  return (
    // lang and dir will be set by LanguageProvider via useEffect
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Title can be set dynamically in child pages/layouts if needed */}
        <title>NoteWise</title>
        <meta name="description" content="Music practice tracker for teachers and students" />
      </head>
      <body className={`${inter.variable} ${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
