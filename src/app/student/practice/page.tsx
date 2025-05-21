
"use client";

import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, ChevronLeft, ChevronRight, Save, BookOpen, Clock, Loader2, AlertCircle, Ban, ListChecks, Info, BarChart3, Eye } from 'lucide-react';
import { format, isValid, parseISO, addDays, startOfDay, endOfDay, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { useState, useEffect } from 'react';
import type { DailyPracticeLog, RoutineTemplate, StudentData, PracticeSection } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { getFromLocalStorage, saveToLocalStorage, generateId } from '@/lib/utils';
import { LOCAL_STORAGE_ROUTINES_KEY, LOCAL_STORAGE_PRACTICE_LOGS_KEY, LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DailyChartData {
  date: string;
  actualPractice: number;
  idealDailyPractice: number;
}

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
  const [displayProgressPercent, setDisplayProgressPercent] = useState<number>(0);

  const [minLogDate, setMinLogDate] = useState<Date | null>(null);
  const [maxLogDate, setMaxLogDate] = useState<Date | null>(null);
  const [isCurrentDateLoggable, setIsCurrentDateLoggable] = useState(true);
  
  const [studentPracticeLogs, setStudentPracticeLogs] = useState<DailyPracticeLog[]>([]); // For table and chart
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<DailyPracticeLog | null>(null);
  const [isLogDetailsDialogOpen, setIsLogDetailsDialogOpen] = useState(false);

  const [chartData, setChartData] = useState<DailyChartData[]>([]);
  const [totalIdealDailyTimeForAssignedRoutine, setTotalIdealDailyTimeForAssignedRoutine] = useState<number>(0);
  const [logSubmissionCounter, setLogSubmissionCounter] = useState(0);

  const chartConfig = {
    actualPractice: {
      label: t('teacher.students.managePage.chart.actualPracticeLabel'), 
      color: "hsl(var(--chart-1))",
    },
    idealDailyPractice: {
      label: t('teacher.students.managePage.chart.idealPracticeLabel'), 
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;


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
      setAssignedRoutineDetails(null);
      setIsCurrentDateLoggable(false); 
      setMinLogDate(null);
      setMaxLogDate(null);
      replace([]); 
      setValue("dailyNotes", '');
      setDisplayProgressPercent(0);
      setIsLoading(false);
      return;
    }

    const allStoredStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    const latestStudentData = allStoredStudents.find(s => s.id === student.id);
    
    if (latestStudentData) {
        setDisplayProgressPercent(latestStudentData.currentRoutineProgressPercent || 0);
    } else {
        setDisplayProgressPercent(student.currentRoutineProgressPercent || 0); 
    }

    const allTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
    const studentRoutine = allTemplates.find(r => r.id === student.currentRoutineId);
    setAssignedRoutineDetails(studentRoutine || null);

    let currentMinLogDate: Date | null = null;
    let currentMaxLogDate: Date | null = null;
    let loggableForCurrentDate = false;

    if (student.currentRoutineAssignmentDate && isValid(parseISO(student.currentRoutineAssignmentDate))) {
      const assignmentStart = startOfDay(parseISO(student.currentRoutineAssignmentDate));
      currentMinLogDate = assignmentStart;
      currentMaxLogDate = endOfDay(addDays(assignmentStart, 7)); 
      
      if (isValid(currentDate) && isValid(currentMinLogDate) && isValid(currentMaxLogDate)) {
        loggableForCurrentDate = isWithinInterval(startOfDay(currentDate), { start: currentMinLogDate, end: currentMaxLogDate });
      }
    } else {
      loggableForCurrentDate = false;
    }
    
    setMinLogDate(currentMinLogDate);
    setMaxLogDate(currentMaxLogDate);
    setIsCurrentDateLoggable(loggableForCurrentDate);

    const allLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
    const dateString = format(currentDate, "yyyy-MM-dd");
    const existingLog = allLogs.find(log => 
        log.studentId === student?.id && 
        log.date === dateString && 
        log.routineTemplateId === student.currentRoutineId
    );

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
    } else {
       replace([]);
       setValue("dailyNotes", '');
    }
    
    replace(initialLogData);
    setValue("date", currentDate);
    setIsLoading(false);

  }, [currentDate, student, replace, setValue, language, t]);

  useEffect(() => {
    if (assignedRoutineDetails && assignedRoutineDetails.sections) {
        const totalIdeal = assignedRoutineDetails.sections.reduce((sum, section) => sum + (section.idealDailyTimeMinutes || 0), 0);
        setTotalIdealDailyTimeForAssignedRoutine(totalIdeal);
    } else {
        setTotalIdealDailyTimeForAssignedRoutine(0);
    }
  }, [assignedRoutineDetails]);

  useEffect(() => {
    if (student?.id && student?.currentRoutineId && student?.currentRoutineAssignmentDate && isValid(parseISO(student.currentRoutineAssignmentDate))) {
        const allLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
        
        const assignmentStartForFiltering = startOfDay(parseISO(student.currentRoutineAssignmentDate));
        const assignmentEndForFiltering = endOfDay(addDays(assignmentStartForFiltering, 7));

        const relevantLogs = allLogs.filter(log =>
            log.studentId === student.id &&
            log.routineTemplateId === student.currentRoutineId &&
            isValid(parseISO(log.date)) &&
            isWithinInterval(parseISO(log.date), { start: assignmentStartForFiltering, end: assignmentEndForFiltering })
        ).sort((a,b) => {
            const dateA = parseISO(a.date); 
            const dateB = parseISO(b.date);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime(); // Sort newest to oldest for table
        });
        setStudentPracticeLogs(relevantLogs); // For table display

        const assignmentStartDateForChart = startOfDay(parseISO(student.currentRoutineAssignmentDate));
        const newChartData: DailyChartData[] = [];
        for (let i = 0; i < 8; i++) {
            const day = addDays(assignmentStartDateForChart, i);
            const dayString = format(day, "yyyy-MM-dd");
            
            const logForDay = relevantLogs.find(log => log.date === dayString);
            const actualPracticeTime = logForDay ? logForDay.logData.reduce((sum, entry) => sum + entry.timeSpentMinutes, 0) : 0;
            
            newChartData.push({
                date: format(day, "E, MMM d", { locale: language === 'fa' ? faIR : undefined }),
                actualPractice: actualPracticeTime,
                idealDailyPractice: totalIdealDailyTimeForAssignedRoutine,
            });
        }
        setChartData(newChartData);
    } else {
        setStudentPracticeLogs([]);
        setChartData([]);
    }
  }, [student?.id, student?.currentRoutineId, student?.currentRoutineAssignmentDate, totalIdealDailyTimeForAssignedRoutine, language, logSubmissionCounter]);


  const updateStudentProgress = () => {
    if (!student || !student.currentRoutineId || !student.currentRoutineAssignmentDate) {
      return 0; 
    }

    let idealTime = student.currentRoutineIdealWeeklyTime;

    if ((!idealTime || idealTime === 0) && student.currentRoutineId) {
        const allTemplates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
        const currentTemplate = allTemplates.find(t => t.id === student.currentRoutineId);
        if (currentTemplate && currentTemplate.calculatedIdealWeeklyTime && currentTemplate.calculatedIdealWeeklyTime > 0) {
            idealTime = currentTemplate.calculatedIdealWeeklyTime;
            
            let studentsToPatch = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
            const studentIndexToPatch = studentsToPatch.findIndex(s => s.id === student.id);
            if (studentIndexToPatch !== -1) {
                studentsToPatch[studentIndexToPatch] = { 
                    ...studentsToPatch[studentIndexToPatch], 
                    currentRoutineIdealWeeklyTime: idealTime 
                };
                saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, studentsToPatch);
            }
        }
    }
    
    if (!idealTime || idealTime === 0) { 
        const allStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
        const updatedStudents = allStudents.map(s => {
          if (s.id === student.id) {
            return { ...s, currentRoutineProgressPercent: 0, currentRoutineIdealWeeklyTime: 0 };
          }
          return s;
        });
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, updatedStudents);
        return 0;
    }

    const allPracticeLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
    const assignmentStartDate = startOfDay(parseISO(student.currentRoutineAssignmentDate));
    const assignmentEndDate = endOfDay(addDays(assignmentStartDate, 7)); 

    const relevantLogs = allPracticeLogs.filter(log =>
      log.studentId === student.id &&
      log.routineTemplateId === student.currentRoutineId &&
      isValid(parseISO(log.date)) &&
      isWithinInterval(parseISO(log.date), { start: assignmentStartDate, end: assignmentEndDate })
    );

    const totalActualPracticeTime = relevantLogs.reduce((totalSum, log) =>
      totalSum + log.logData.reduce((logSum, entry) => logSum + entry.timeSpentMinutes, 0),
      0
    );
    
    const progressPercent = idealTime > 0 ? Math.min(100, Math.round((totalActualPracticeTime / idealTime) * 100)) : 0;

    const allStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    const updatedStudents = allStudents.map(s => {
      if (s.id === student.id) {
        return { ...s, currentRoutineProgressPercent: progressPercent, currentRoutineIdealWeeklyTime: idealTime };
      }
      return s;
    });
    saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, updatedStudents);
    return progressPercent;
  };

  const onSubmit: SubmitHandler<DailyPracticeLogInputs> = async (data) => {
    if (!student) {
        toast({ title: t('student.practice.toast.error.title'), description: t('student.practice.toast.error.studentNotFound'), variant: "destructive" });
        return;
    }
    if (!isCurrentDateLoggable) {
        toast({ title: t('student.practice.toast.error.title'), description: t('student.practice.logDateError.notLoggable'), variant: "destructive" });
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
      allLogs = allLogs.filter(log => !(
          log.studentId === student.id && 
          log.date === dateString && 
          log.routineTemplateId === student.currentRoutineId
      ));
      allLogs.push(newLog);
      saveToLocalStorage(LOCAL_STORAGE_PRACTICE_LOGS_KEY, allLogs);
      
      const newProgress = updateStudentProgress(); 
      setDisplayProgressPercent(newProgress); 
      setLogSubmissionCounter(prev => prev + 1);

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
      if (minLogDate && isBefore(startOfDay(newDate), startOfDay(minLogDate))) {
        return; 
      }
    } else {
      newDate.setDate(currentDate.getDate() + 1);
      if (maxLogDate && isAfter(startOfDay(newDate), startOfDay(maxLogDate))) {
        return;
      }
    }
    setCurrentDate(newDate);
  };
  
  const canNavigatePrev = !minLogDate || !isBefore(startOfDay(currentDate), startOfDay(addDays(minLogDate,1)) );
  const canNavigateNext = !maxLogDate || !isAfter(startOfDay(currentDate), startOfDay(addDays(maxLogDate,-1)) );

  const PrevDayButton = () => (
    <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} title={t('student.practice.previousDay')} disabled={!canNavigatePrev}>
      {language === 'fa' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
    </Button>
  );

  const NextDayButton = () => (
    <Button variant="outline" size="icon" onClick={() => navigateDate('next')} title={t('student.practice.nextDay')} disabled={!canNavigateNext}>
      {language === 'fa' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </Button>
  );

  const handleViewLogDetails = (log: DailyPracticeLog) => {
    setSelectedLogForDetails(log);
    setIsLogDetailsDialogOpen(true);
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
            {language === 'fa' ? <NextDayButton /> : <PrevDayButton />}
            <div className="text-center">
              <h2 className="text-xl font-semibold flex items-center justify-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                {t('student.practice.title')}
              </h2>
              <p className="text-2xl font-bold text-primary">{isValid(currentDate) ? format(currentDate, "EEEE, MMMM d, yyyy", { locale: language === 'fa' ? faIR : undefined }) : "Invalid Date"}</p>
            </div>
            {language === 'fa' ? <PrevDayButton /> : <NextDayButton />}
          </div>
           <CardDescription className="text-center">
            {t('student.practice.routineName', {routineName: assignedRoutineDetails.templateName})}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-background">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <ListChecks className="mr-2 h-5 w-5 text-accent" />
                    {t('student.practice.progress.title')}
                </h3>
                <span className="text-xl font-bold text-accent">{displayProgressPercent}%</span>
            </div>
            <Progress value={displayProgressPercent} className="w-full h-3" />
            {student.currentRoutineIdealWeeklyTime && student.currentRoutineIdealWeeklyTime > 0 && (
                 <p className="text-xs text-muted-foreground mt-2 text-center">
                    {t('student.practice.progress.idealTimeNote', { time: student.currentRoutineIdealWeeklyTime })}
                </p>
            )}
          </div>


        {!isCurrentDateLoggable && student.currentRoutineAssignmentDate && minLogDate && maxLogDate && (
            <Alert variant="destructive" className="my-4">
              <Ban className="h-4 w-4" />
              <AlertTitle>{t('student.practice.logDateError.title')}</AlertTitle>
              <AlertDescription>
                {t('student.practice.logDateError.description', {
                    minDate: format(minLogDate, "PPP", { locale: language === 'fa' ? faIR : undefined }),
                    maxDate: format(maxLogDate, "PPP", { locale: language === 'fa' ? faIR : undefined })
                })}
              </AlertDescription>
            </Alert>
        )}
         {!student.currentRoutineAssignmentDate && student.currentRoutineId && (
             <Alert variant="destructive" className="my-4">
                <Ban className="h-4 w-4" />
                <AlertTitle>{t('student.practice.logDateError.title')}</AlertTitle>
                <AlertDescription>
                    {t('student.practice.logDateError.missingAssignmentDate')}
                </AlertDescription>
            </Alert>
         )}


        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-8">
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
                        <div className="text-xs text-muted-foreground mt-1 sm:mt-0 space-y-1 text-right">
                           {sectionMeta?.description && <p>{sectionMeta.description}</p>}
                           {sectionMeta?.idealDailyTimeMinutes && sectionMeta.idealDailyTimeMinutes > 0 && (
                                <p className="italic text-accent">
                                    <Info className="inline-block mr-1 h-3 w-3" />
                                    {t('student.practice.idealTimePerSection', {time: sectionMeta.idealDailyTimeMinutes})}
                                </p>
                            )}
                        </div>
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
                        disabled={!isCurrentDateLoggable}
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
                disabled={!isCurrentDateLoggable}
              />
            </div>
          </div>
          <CardFooter className="mt-6">
            <Button type="submit" className="w-full" disabled={isSubmitting || fields.length === 0 || !isCurrentDateLoggable}>
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
        </CardContent>
      </Card>

      {student?.currentRoutineAssignmentDate && assignedRoutineDetails && (
        <Card className="shadow-xl mt-8">
           <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary" /> {t('teacher.students.managePage.practiceProgress.title')}</CardTitle>
            <CardDescription>{t('teacher.students.managePage.practiceProgress.description', { displayName: student.displayName })}</CardDescription>
          </CardHeader>
          <CardContent>
            {studentPracticeLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('teacher.students.managePage.practiceProgress.noLogsForCurrent')}</p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher.students.managePage.practiceProgress.table.date')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('teacher.students.managePage.practiceProgress.table.routine')}</TableHead>
                  <TableHead className="text-right">{t('teacher.students.managePage.practiceProgress.table.time')}</TableHead>
                   <TableHead className="text-right">{t('teacher.students.managePage.practiceProgress.table.details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPracticeLogs.slice(0, 5).map((log) => ( 
                  <TableRow key={log.id}>
                    <TableCell>{isValid(parseISO(log.date)) ? format(parseISO(log.date), "MMM d, yyyy", { locale: language === 'fa' ? faIR : undefined }) : t('teacher.students.managePage.practiceProgress.notApplicable')}</TableCell>
                    <TableCell className="truncate max-w-[150px] hidden sm:table-cell">{log.routineName || t('teacher.students.managePage.practiceProgress.notApplicable')}</TableCell>
                    <TableCell className="text-right">{log.logData.reduce((sum, entry) => sum + entry.timeSpentMinutes, 0)}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title={t('teacher.students.managePage.practiceProgress.viewDetailsButton.title')} onClick={() => handleViewLogDetails(log)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </CardContent>
           {studentPracticeLogs.length > 5 && (
            <CardFooter>
                <Button variant="link" className="mx-auto" onClick={() => alert(t('teacher.students.managePage.practiceProgress.viewAllAlert'))}>{t('teacher.students.managePage.practiceProgress.viewAllButton')}</Button>
            </CardFooter>
           )}
        </Card>
      )}

      {selectedLogForDetails && (
        <Dialog open={isLogDetailsDialogOpen} onOpenChange={setIsLogDetailsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('teacher.students.managePage.logDetails.title')}</DialogTitle>
              <DialogDescription>
                {t('teacher.students.managePage.logDetails.description', {
                    date: isValid(parseISO(selectedLogForDetails.date)) ? format(parseISO(selectedLogForDetails.date), "PPP", { locale: language === 'fa' ? faIR : undefined }) : t('teacher.students.managePage.practiceProgress.notApplicable'),
                    routineName: selectedLogForDetails.routineName || t('teacher.students.managePage.practiceProgress.notApplicable')
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {selectedLogForDetails.dailyNotes && (
                    <div>
                        <h4 className="font-semibold">{t('teacher.students.managePage.logDetails.notesLabel')}</h4>
                        <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                            {selectedLogForDetails.dailyNotes}
                        </p>
                    </div>
                )}
                 <div>
                    <h4 className="font-semibold">{t('teacher.students.managePage.logDetails.sectionsLabel')}</h4>
                    {selectedLogForDetails.logData.length > 0 ? (
                        <ul className="space-y-2 mt-2">
                            {selectedLogForDetails.logData.map(entry => (
                                <li key={entry.sectionId} className="text-sm p-2 border rounded-md flex justify-between items-center">
                                    <span>{entry.sectionName}</span>
                                    <span className="font-medium text-primary">{t('teacher.students.managePage.logDetails.timeSpent', { time: entry.timeSpentMinutes })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">{t('teacher.students.managePage.logDetails.noSectionsData')}</p>
                    )}
                </div>
                 <div className="text-right font-semibold pt-2 border-t">
                    {t('teacher.students.managePage.logDetails.totalTime', { time: selectedLogForDetails.logData.reduce((sum, entry) => sum + entry.timeSpentMinutes, 0) })}
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                         {t('teacher.students.managePage.logDetails.closeButton')}
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {student?.currentRoutineAssignmentDate && assignedRoutineDetails && (
        <Card className="shadow-xl mt-8">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-6 w-6 text-primary" />
                    {t('teacher.students.managePage.chart.title')} 
                </CardTitle>
                <CardDescription>
                    {t('teacher.students.managePage.chart.description', { 
                        routineName: assignedRoutineDetails.templateName || t('teacher.students.managePage.header.noRoutineAssigned'),
                        startDate: format(parseISO(student.currentRoutineAssignmentDate), "PPP", { locale: language === 'fa' ? faIR : undefined })
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8}
                                    tickFormatter={(value) => language === 'fa' ? value.split(',')[0] : value.substring(0,3)}
                                />
                                <YAxis 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8}
                                    domain={[0, (dataMax: number) => Math.max(dataMax > 0 ? dataMax + 20 : 60, totalIdealDailyTimeForAssignedRoutine > 0 ? totalIdealDailyTimeForAssignedRoutine + 20 : 60)]}
                                    label={{ value: t('teacher.students.managePage.chart.yAxisLabel'), angle: -90, position: 'insideLeft', offset: 0, style:{textAnchor: 'middle'} }}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent 
                                        indicator="dot" 
                                        labelFormatter={(label, payload) => {
                                            if (payload && payload.length) {
                                                const matchingDataPoint = chartData.find(cd => (language === 'fa' ? cd.date.split(',')[0] : cd.date.substring(0,3)) === label);
                                                return matchingDataPoint ? matchingDataPoint.date : label;
                                            }
                                            return label;
                                        }}
                                    />}
                                />
                                <Legend content={<ChartLegendContent />} />
                                <Bar dataKey="actualPractice" fill="var(--color-actualPractice)" radius={4} />
                                <Bar dataKey="idealDailyPractice" fill="var(--color-idealDailyPractice)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-4">{t('teacher.students.managePage.chart.noData')}</p> 
                )}
            </CardContent>
        </Card>
      )}
    </div>
  );
}

    