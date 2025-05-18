
import type { Metadata } from 'next';
import { Inter, Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'], // 'arabic' subset often covers Farsi characters
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NoteWise', // This could also be translated if needed, but typically static
  description: 'Music practice tracker for teachers and students',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang and dir will be set by LanguageProvider via useEffect
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${vazirmatn.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
