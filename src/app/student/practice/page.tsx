
"use client";

import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronLeft, ChevronRight, Save, BookOpen, Clock, Loader2, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { useState, useEffect } from 'react';
import type { DailyPracticeLog, RoutineTemplate, StudentData, PracticeSection } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getFromLocalStorage, saveToLocalStorage, generateId } from '@/lib/utils';
import { LOCAL_STORAGE_ROUTINES_KEY, LOCAL_STORAGE_PRACTICE_LOGS_KEY } from '@/lib/localStorageKeys';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';


const practiceLogEntrySchema = z.object({
  sectionId: z.string(),
  sectionName: z.string(),
  timeSpentMinutes: z.coerce.number().min(0, "Time must be non-negative").max(300, "Time seems too high"),
});

const dailyPracticeLogSchema = z.object({
  date: z.date(),
  logData: z.array(practiceLogEntrySchema),
  dailyNotes: z.string().optional(),
});

type DailyPracticeLogInputs = z.infer<typeof dailyPracticeLogSchema>;


export default function DailyPracticeLogPage() {
  const { toast } = useToast();
  const { userData } = useAuth();
  const student = userData as StudentData | null;
  const { t } = useTranslations();
  const { language } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedRoutineDetails, setAssignedRoutineDetails] = useState<RoutineTemplate | null>(null);

  const { control, register, handleSubmit, reset, setValue, formState: { errors } } = useForm<DailyPracticeLogInputs>({
    resolver: zodResolver(dailyPracticeLogSchema),
    defaultValues: {
      date: currentDate,
      logData: [],
      dailyNotes: '',
    },
  });

  const { fields, replace } = useFieldArray({
    control,
    name: "logData",
  });

  useEffect(() => {
    setIsLoading(true);
    if (!student || !student.currentRoutineId) {
      setIsLoading(false);
      return;
    }

    const allTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
    const studentRoutine = allTemplates.find(r => r.id === student.currentRoutineId);
    setAssignedRoutineDetails(studentRoutine || null);

    const allLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
    const dateString = format(currentDate, "yyyy-MM-dd");
    const existingLog = allLogs.find(log => log.studentId === student?.id && log.date === dateString);

    let initialLogData: DailyPracticeLogInputs['logData'] = [];
    if (existingLog) {
      initialLogData = existingLog.logData;
      setValue("dailyNotes", existingLog.dailyNotes || '');
    } else if (studentRoutine) {
      initialLogData = studentRoutine.sections.map(section => ({
        sectionId: section.id,
        sectionName: section.name,
        timeSpentMinutes: 0,
      }));
      setValue("dailyNotes", '');
    }
    
    replace(initialLogData);
    setValue("date", currentDate);
    setIsLoading(false);

  }, [currentDate, student, reset, setValue, replace]);

  const onSubmit: SubmitHandler<DailyPracticeLogInputs> = async (data) => {
    if (!student) {
        toast({ title: t('student.practice.toast.error.title'), description: t('student.practice.toast.error.studentNotFound'), variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    const dateString = format(data.date, "yyyy-MM-dd");
    const newLog: DailyPracticeLog = {
      id: generateId(),
      studentId: student.id,
      routineTemplateId: student.currentRoutineId,
      routineName: assignedRoutineDetails?.templateName,
      date: dateString,
      logData: data.logData,
      dailyNotes: data.dailyNotes,
    };

    try {
      let allLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
      allLogs = allLogs.filter(log => !(log.studentId === student.id && log.date === dateString));
      allLogs.push(newLog);
      saveToLocalStorage(LOCAL_STORAGE_PRACTICE_LOGS_KEY, allLogs);
      
      toast({
        title: t('student.practice.toast.saved.title'),
        description: t('student.practice.toast.saved.description', {date: format(data.date, "PPP", { locale: language === 'fa' ? faIR : undefined })}),
      });
    } catch (error) {
      console.error("Failed to save practice log:", error);
      toast({ title: t('student.practice.toast.error.title'), description: t('student.practice.toast.error.description'), variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!student || !student.currentRoutineId || !assignedRoutineDetails) {
     return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center"><AlertCircle className="mr-2 h-6 w-6 text-destructive"/>{t('student.practice.noRoutine.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('student.practice.noRoutine.description')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} title={t('student.practice.previousDay')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-xl font-semibold flex items-center justify-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                {t('student.practice.title')}
              </h2>
              <p className="text-2xl font-bold text-primary">{isValid(currentDate) ? format(currentDate, "EEEE, MMMM d, yyyy", { locale: language === 'fa' ? faIR : undefined }) : "Invalid Date"}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateDate('next')} title={t('student.practice.nextDay')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
           <CardDescription className="text-center">
            {t('student.practice.routineName', {routineName: assignedRoutineDetails.templateName})}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8 pt-6">
            {fields.length === 0 && <p className="text-muted-foreground text-center">{t('student.practice.noSections')}</p>}
            {fields.map((field, index) => {
                const sectionMeta = assignedRoutineDetails.sections.find(s => s.id === field.sectionId);
                return (
                  <div key={field.id} className="p-4 border rounded-lg shadow-sm bg-background hover:shadow-md transition-shadow">
                    <input type="hidden" {...register(`logData.${index}.sectionId`)} />
                    <input type="hidden" {...register(`logData.${index}.sectionName`)} />
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                            <BookOpen className="mr-2 h-5 w-5 text-accent" />
                            {sectionMeta?.name || field.sectionName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                            {sectionMeta?.description}
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Label htmlFor={`logData.${index}.timeSpentMinutes`} className="whitespace-nowrap flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground"/> {t('student.practice.timeSpent.label')}
                      </Label>
                      <Input
                        id={`logData.${index}.timeSpentMinutes`}
                        type="number"
                        min="0"
                        placeholder={t('student.practice.timeSpent.unit')}
                        className={`w-28 ${errors.logData?.[index]?.timeSpentMinutes ? "border-destructive" : ""}`}
                        {...register(`logData.${index}.timeSpentMinutes` as const)}
                      />
                      <span className="text-sm text-muted-foreground">{t('student.practice.timeSpent.unit')}</span>
                    </div>
                    {errors.logData?.[index]?.timeSpentMinutes && (
                      <p className="text-sm text-destructive mt-1">{errors.logData[index]?.timeSpentMinutes?.message}</p>
                    )}
                  </div>
                );
            })}

            <div className="space-y-2">
              <Label htmlFor="dailyNotes" className="text-lg font-semibold">{t('student.practice.notes.label')}</Label>
              <Textarea
                id="dailyNotes"
                placeholder={t('student.practice.notes.placeholder')}
                {...register("dailyNotes")}
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || fields.length === 0}>
              {isSubmitting ? (
                 <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('student.practice.savingButton')}
                </>
              ) : (
                 <>
                  <Save className="mr-2 h-4 w-4" /> {t('student.practice.saveButton')}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

