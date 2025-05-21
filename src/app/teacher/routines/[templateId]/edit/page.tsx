
"use client";

import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, PlusCircle, Trash2, Edit3, Save, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useState, useEffect, use } from 'react';
import type { RoutineTemplate, PracticeSection } from '@/types';
import { generateId, getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_ROUTINES_KEY } from '@/lib/localStorageKeys';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';


export default function EditRoutineTemplatePage({ params: paramsProp }: { params: { templateId: string } }) {
  const resolvedParams = use(paramsProp as any); 
  const templateId = resolvedParams.templateId;

  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [templateNotFound, setTemplateNotFound] = useState(false);

  const practiceSectionSchema = z.object({
    id: z.string().default(() => generateId()),
    name: z.string().min(1, { message: t('teacher.routines.validation.sectionNameRequired') }),
    description: z.string().optional(),
    idealDailyTimeMinutes: z.coerce.number().min(0, {message: t('teacher.routines.validation.idealTimeMin')}).optional(),
  });
  
  const routineTemplateSchema = z.object({
    templateName: z.string().min(3, { message: t('teacher.routines.validation.templateNameMin') }),
    sections: z.array(practiceSectionSchema).min(1, { message: t('teacher.routines.validation.sectionsMin') }),
  });
  
  type RoutineTemplateFormInputs = z.infer<typeof routineTemplateSchema>;

  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm<RoutineTemplateFormInputs>({
    resolver: zodResolver(routineTemplateSchema),
    defaultValues: {
      templateName: '',
      sections: [{ id: generateId(), name: '', description: '', idealDailyTimeMinutes: 0 }],
    },
  });

  useEffect(() => {
    if (templateId) {
      setIsLoading(true);
      const storedTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
      const templateToEdit = storedTemplates.find(t => t.id === templateId);
      
      if (templateToEdit) {
        reset({
            templateName: templateToEdit.templateName,
            sections: templateToEdit.sections.map(s => ({
                ...s,
                idealDailyTimeMinutes: s.idealDailyTimeMinutes || 0, // Ensure default
            }))
        });
      } else {
        setTemplateNotFound(true);
        toast({ title: t('teacher.routines.createPage.toast.error.title'), description: t('teacher.routines.editPage.notFound.toast'), variant: "destructive" });
      }
      setIsLoading(false);
    }
  }, [templateId, reset, toast, t]);


  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });

  const watchedSections = watch("sections");
  const totalIdealDailyTime = watchedSections.reduce((sum, section) => sum + (section.idealDailyTimeMinutes || 0), 0);
  const idealWeeklyTime = totalIdealDailyTime * 8;


  const onSubmit: SubmitHandler<RoutineTemplateFormInputs> = async (data) => {
    setIsSubmitting(true);
    
    const totalIdealDaily = data.sections.reduce((sum, s) => sum + (s.idealDailyTimeMinutes || 0), 0);
    const calculatedIdealWeekly = totalIdealDaily * 8;

    const updatedTemplate: RoutineTemplate = {
      id: templateId,
      templateName: data.templateName,
      sections: data.sections.map(s => ({ 
        id: s.id || generateId(),
        name: s.name,
        description: s.description,
        idealDailyTimeMinutes: s.idealDailyTimeMinutes || 0,
      })),
      lastModified: new Date().toISOString(),
      calculatedIdealWeeklyTime: calculatedIdealWeekly,
    };

    try {
      const existingTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
      const templateIndex = existingTemplates.findIndex(t => t.id === templateId);
      if (templateIndex > -1) {
        existingTemplates[templateIndex] = updatedTemplate;
        saveToLocalStorage(LOCAL_STORAGE_ROUTINES_KEY, existingTemplates);
        toast({
            title: t('teacher.routines.editPage.toast.updated.title'),
            description: t('teacher.routines.editPage.toast.updated.description', { templateName: updatedTemplate.templateName }),
        });
        router.push('/teacher/routines');
      } else {
        toast({ title: t('teacher.routines.createPage.toast.error.title'), description: t('teacher.routines.editPage.toast.error.notFoundForUpdate'), variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update template:", error);
      toast({ title: t('teacher.routines.createPage.toast.error.title'), description: t('teacher.routines.editPage.toast.error.updateFailed'), variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (templateNotFound) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/teacher/routines">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('teacher.routines.editPage.backLink')}
            </Link>
        </Button>
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2 h-6 w-6"/>{t('teacher.routines.editPage.notFound.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('teacher.routines.editPage.notFound.description')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/teacher/routines">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('teacher.routines.editPage.backLink')}
            </Link>
        </Button>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
                <Edit3 className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl">{t('teacher.routines.editPage.title')}</CardTitle>
                    <CardDescription>{t('teacher.routines.editPage.description')}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="templateName" className="text-lg font-semibold">{t('teacher.routines.form.templateName.label')}</Label>
              <Input
                id="templateName"
                placeholder={t('teacher.routines.form.templateName.placeholder')}
                {...register("templateName")}
                aria-invalid={errors.templateName ? "true" : "false"}
                className={errors.templateName ? "border-destructive" : ""}
              />
              {errors.templateName && <p className="text-sm text-destructive">{errors.templateName.message}</p>}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">{t('teacher.routines.form.sections.label')}</h3>
               {errors.sections && !errors.sections.root && errors.sections.message && (
                 <p className="text-sm text-destructive mb-2">{errors.sections.message}</p>
              )}
              {fields.map((field, index) => (
                <Card key={field.id} className="mb-4 p-4 border rounded-md shadow-sm bg-muted/30">
                  <div className="space-y-4">
                    <input type="hidden" {...register(`sections.${index}.id`)} />
                     <div className="flex justify-between items-center">
                        <Label htmlFor={`sections.${index}.name`} className="font-medium">{t('teacher.routines.form.sections.sectionLabel', { index: index + 1 })}</Label>
                        {fields.length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-destructive hover:bg-destructive/10"
                            title={t('teacher.routines.form.sections.removeButton.title')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        )}
                    </div>
                    <div>
                      <Label htmlFor={`sections.${index}.name`}>{t('teacher.routines.form.sections.name.label')}</Label>
                      <Input
                        id={`sections.${index}.name`}
                        placeholder={t('teacher.routines.form.sections.name.placeholder')}
                        {...register(`sections.${index}.name` as const)}
                        aria-invalid={errors.sections?.[index]?.name ? "true" : "false"}
                        className={errors.sections?.[index]?.name ? "border-destructive" : ""}
                      />
                       {errors.sections?.[index]?.name && <p className="text-sm text-destructive">{errors.sections[index]?.name?.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor={`sections.${index}.description`}>{t('teacher.routines.form.sections.description.label')}</Label>
                      <Textarea
                        id={`sections.${index}.description`}
                        placeholder={t('teacher.routines.form.sections.description.placeholder')}
                        {...register(`sections.${index}.description` as const)}
                      />
                    </div>
                     <div>
                      <Label htmlFor={`sections.${index}.idealDailyTimeMinutes`}>{t('teacher.routines.form.sections.idealDailyTime.label')}</Label>
                      <Input
                        id={`sections.${index}.idealDailyTimeMinutes`}
                        type="number"
                        min="0"
                        placeholder={t('teacher.routines.form.sections.idealDailyTime.placeholder')}
                        {...register(`sections.${index}.idealDailyTimeMinutes` as const)}
                         aria-invalid={errors.sections?.[index]?.idealDailyTimeMinutes ? "true" : "false"}
                        className={`w-32 ${errors.sections?.[index]?.idealDailyTimeMinutes ? "border-destructive" : ""}`}
                      />
                      {errors.sections?.[index]?.idealDailyTimeMinutes && <p className="text-sm text-destructive">{errors.sections[index]?.idealDailyTimeMinutes?.message}</p>}
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ id: generateId(), name: '', description: '', idealDailyTimeMinutes: 0 })}
                className="mt-2 w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> {t('teacher.routines.form.addSectionButton')}
              </Button>
            </div>
             <div className="mt-4 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/30">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                    <Info className="mr-2 h-5 w-5"/>
                    <p>
                        {t('teacher.routines.form.idealWeeklyTimeInfo', {time: idealWeeklyTime || 0})}
                    </p>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
             {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('teacher.routines.editPage.submitButtonLoading')}
                </>
              ) : (
                <>
                 <Save className="mr-2 h-4 w-4" /> {t('teacher.routines.editPage.submitButton')}
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

