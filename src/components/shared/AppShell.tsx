
import type { ReactNode } from 'react';
import { Header } from '@/components/shared/Header';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Link from 'next/link';
import { Home, Users, ListMusic, BookOpen, Settings, LogOut, UserCircle, Briefcase } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppShellProps {
  children: ReactNode;
  role: 'teacher' | 'student' | null;
}

export function AppShell({ children, role }: AppShellProps) {
  const { logout, userData } = useAuth();
  const router = useRouter();
  const { t } = useTranslations();
  const { dir } = useLanguage();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  if (role === 'teacher') {
    return (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen flex-col w-full">
          <Header />
          <div className="flex flex-1 w-full">
            <Sidebar collapsible="icon" className="border-r" side={dir === 'rtl' ? 'right' : 'left'}>
              <SidebarContent className="p-2">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t('appShell.sidebar.dashboard')}>
                      <Link href="/teacher/dashboard"><Home /><span>{t('appShell.sidebar.dashboard')}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t('appShell.sidebar.students')}>
                      <Link href="/teacher/students"><Users /><span>{t('appShell.sidebar.students')}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t('appShell.sidebar.routines')}>
                      <Link href="/teacher/routines"><ListMusic /><span>{t('appShell.sidebar.routines')}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t('teacher.resume.sidebarLink')}>
                      <Link href="/teacher/resume"><Briefcase /><span>{t('teacher.resume.sidebarLink')}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="p-2 border-t">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip={t('appShell.sidebar.settings')}>
                            <Link href="/teacher/settings"><Settings /><span>{t('appShell.sidebar.settings')}</span></Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip={t('appShell.sidebar.logout')}>
                            <LogOut /><span>{t('appShell.sidebar.logout')}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
              </SidebarFooter>
            </Sidebar>
            <SidebarInset className="flex-1 bg-muted/30 w-full p-4 md:p-6 lg:p-8">
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Student AppShell or default
  return (
    <div className="flex min-h-screen flex-col w-full">
      <Header />
      <main className="flex-1 w-full py-8 px-4">{children}</main>
       <footer className="border-t bg-background py-4 text-center mt-auto w-full">
        <p className="text-sm text-muted-foreground">{t('page.home.student.footer', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  );
}
