
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, ListMusic, Edit3, Trash2, FileText, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import type { RoutineTemplate } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_ROUTINES_KEY } from '@/lib/localStorageKeys';
import { format, isValid, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';

// Initial placeholder data if localStorage is empty
const initialRoutineTemplates: RoutineTemplate[] = [
  { id: 'rt1', templateName: 'Beginner Piano Scales - Week 1', sections: [{id: 's1', name: 'C Major', description: '2 octaves'}, {id: 's2', name: 'G Major', description: '2 octaves'}], lastModified: new Date('2024-07-20').toISOString() },
  { id: 'rt2', templateName: 'Intermediate Guitar Chords', sections: [{id: 's3', name: 'Common Chords', description: 'Practice transitions'}], lastModified: new Date('2024-07-18').toISOString() },
];


export default function ManageRoutineTemplatesPage() {
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslations();
  const { language } = useLanguage();

  useEffect(() => {
    setIsLoading(true);
    const storedTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
    if (storedTemplates.length === 0) {
      // Populate with initial data if localStorage is empty
      saveToLocalStorage(LOCAL_STORAGE_ROUTINES_KEY, initialRoutineTemplates);
      setTemplates(initialRoutineTemplates);
    } else {
      setTemplates(storedTemplates);
    }
    setIsLoading(false);
  }, []);

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (confirm(t('teacher.routines.list.actions.delete.confirm', { templateName }))) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      saveToLocalStorage(LOCAL_STORAGE_ROUTINES_KEY, updatedTemplates);
      setTemplates(updatedTemplates);
      toast({
        title: t('teacher.routines.list.toast.deleted.title'),
        description: t('teacher.routines.list.toast.deleted.description', { templateName }),
      });
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">{t('teacher.routines.list.loading')}</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teacher.routines.page.title')}</h1>
          <p className="text-muted-foreground">{t('teacher.routines.page.description')}</p>
        </div>
        <Button asChild>
          <Link href="/teacher/routines/create">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('teacher.routines.page.createButton')}
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><ListMusic className="mr-2 h-6 w-6 text-primary" /> {t('teacher.routines.list.title')}</CardTitle>
          <CardDescription>
            {templates.length > 0 
              ? t('teacher.routines.list.countDescription', { count: templates.length }) 
              : t('teacher.routines.list.noTemplatesDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">{t('teacher.routines.list.noTemplatesFound')}</h3>
              <p className="mt-1 text-muted-foreground">{t('teacher.routines.list.noTemplatesHint')}</p>
              <Button asChild className="mt-6">
                <Link href="/teacher/routines/create">
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('teacher.routines.page.createButton')}
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher.routines.list.table.name')}</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">{t('teacher.routines.list.table.sections')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('teacher.routines.list.table.lastModified')}</TableHead>
                  <TableHead className="text-right">{t('teacher.routines.list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const lastModifiedDate = parseISO(template.lastModified);
                  return (
                  <TableRow key={template.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{template.templateName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Badge variant="secondary">{template.sections.length}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {isValid(lastModifiedDate) ? format(lastModifiedDate, "PPP", { locale: language === 'fa' ? faIR : undefined }) : 'Invalid Date'}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="outline" size="icon" asChild title={t('teacher.routines.list.actions.edit.title')}>
                        <Link href={`/teacher/routines/${template.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDeleteTemplate(template.id, template.templateName)}
                        title={t('teacher.routines.list.actions.delete.title')}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {templates.length > 0 && (
            <CardFooter className="border-t pt-4">
                <p className="text-sm text-muted-foreground">{t('teacher.routines.list.footer.manageHint')}</p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

