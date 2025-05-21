
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CalendarIcon, UserCog, BookOpen, ListChecks, Eye, Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, use } from 'react'; 
import { format, startOfWeek, isValid, parseISO, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import { faIR } from 'date-fns/locale/fa-IR';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
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
  ChartStyle,
  type ChartConfig
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { StudentData, RoutineTemplate, DailyPracticeLog, PracticeSection } from '@/types';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY, LOCAL_STORAGE_ROUTINES_KEY, LOCAL_STORAGE_PRACTICE_LOGS_KEY } from '@/lib/localStorageKeys';
import { useTranslations } from '@/hooks/useTranslations';
import { useLanguage } from '@/contexts/LanguageContext';


interface DailyChartData {
  date: string;
  actualPractice: number;
  idealDailyPractice: number;
}

export default function ManageStudentPage({ params: paramsProp }: { params: { studentId: string } }) {
  const resolvedParams = use(paramsProp as any); 
  const studentId = resolvedParams.studentId; 
  const { t } = useTranslations();
  const { toast } = useToast();
  const { language } = useLanguage();

  const [currentStudentDetails, setCurrentStudentDetails] = useState<StudentData | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [availableTemplates, setAvailableTemplates] = useState<RoutineTemplate[]>([]);
  const [studentPracticeLogs, setStudentPracticeLogs] = useState<DailyPracticeLog[]>([]);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [weekStartDate, setWeekStartDate] = useState<Date | undefined>(() => new Date());
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<DailyPracticeLog | null>(null);
  const [isLogDetailsDialogOpen, setIsLogDetailsDialogOpen] = useState(false);

  const [chartData, setChartData] = useState<DailyChartData[]>([]);
  const [totalIdealDailyTimeForAssignedRoutine, setTotalIdealDailyTimeForAssignedRoutine] = useState<number>(0);

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


  useEffect(() => {
    if (studentId) {
      setIsLoadingStudent(true);
      const storedStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
      const foundStudent = storedStudents.find(s => s.id === studentId);
      
      if (foundStudent) {
        setCurrentStudentDetails(foundStudent);
        setSelectedTemplateId(foundStudent.currentRoutineId);
         if (foundStudent.currentRoutineAssignmentDate && isValid(parseISO(foundStudent.currentRoutineAssignmentDate))) {
          setWeekStartDate(parseISO(foundStudent.currentRoutineAssignmentDate));
        } else {
          setWeekStartDate(new Date()); 
        }
      } else {
        setCurrentStudentDetails(null); 
        toast({ title: t('teacher.students.managePage.toast.error.general'), description: t('teacher.students.managePage.toast.error.studentNotFound'), variant: "destructive"});
      }

      const templates = getFromLocalStorage<RoutineTemplate[]>(LOCAL_STORAGE_ROUTINES_KEY, []);
      setAvailableTemplates(templates);
      setIsLoadingStudent(false);
    }
  }, [studentId, toast, t]);

  useEffect(() => {
    if (currentStudentDetails?.currentRoutineId && availableTemplates.length > 0) {
        const assignedTemplate = availableTemplates.find(t => t.id === currentStudentDetails.currentRoutineId);
        if (assignedTemplate && assignedTemplate.sections) {
            const totalIdeal = assignedTemplate.sections.reduce((sum, section) => sum + (section.idealDailyTimeMinutes || 0), 0);
            setTotalIdealDailyTimeForAssignedRoutine(totalIdeal);
        } else {
            setTotalIdealDailyTimeForAssignedRoutine(0);
        }
    } else {
        setTotalIdealDailyTimeForAssignedRoutine(0);
    }
  }, [currentStudentDetails?.currentRoutineId, availableTemplates]);


  useEffect(() => {
    if (studentId && currentStudentDetails?.currentRoutineId && currentStudentDetails?.currentRoutineAssignmentDate) {
        const allLogs = getFromLocalStorage<DailyPracticeLog[]>(LOCAL_STORAGE_PRACTICE_LOGS_KEY, []);
        
        const assignmentStart = startOfDay(parseISO(currentStudentDetails.currentRoutineAssignmentDate));
        const assignmentEnd = endOfDay(addDays(assignmentStart, 7)); 

        const logsForCurrentRoutineAssignment = allLogs.filter(log => 
            log.studentId === studentId &&
            log.routineTemplateId === currentStudentDetails.currentRoutineId &&
            isValid(parseISO(log.date)) &&
            isWithinInterval(parseISO(log.date), { start: assignmentStart, end: assignmentEnd })
        ).sort((a,b) => {
            const dateA = parseISO(a.date); 
            const dateB = parseISO(b.date);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateA.getTime() - dateB.getTime(); // Sort oldest to newest for chart
        });
        setStudentPracticeLogs(logsForCurrentRoutineAssignment);
    } else {
        setStudentPracticeLogs([]); 
    }
  }, [studentId, currentStudentDetails?.currentRoutineId, currentStudentDetails?.currentRoutineAssignmentDate]);


  useEffect(() => {
    if (currentStudentDetails?.currentRoutineAssignmentDate && isValid(parseISO(currentStudentDetails.currentRoutineAssignmentDate))) {
        const assignmentStartDate = startOfDay(parseISO(currentStudentDetails.currentRoutineAssignmentDate));
        const newChartData: DailyChartData[] = [];

        for (let i = 0; i < 8; i++) {
            const day = addDays(assignmentStartDate, i);
            const dayString = format(day, "yyyy-MM-dd");
            
            const logForDay = studentPracticeLogs.find(log => log.date === dayString);
            const actualPracticeTime = logForDay ? logForDay.logData.reduce((sum, entry) => sum + entry.timeSpentMinutes, 0) : 0;
            
            newChartData.push({
                date: format(day, "E, MMM d", { locale: language === 'fa' ? faIR : undefined }),
                actualPractice: actualPracticeTime,
                idealDailyPractice: totalIdealDailyTimeForAssignedRoutine,
            });
        }
        setChartData(newChartData);
    } else {
        setChartData([]);
    }
  }, [studentPracticeLogs, currentStudentDetails?.currentRoutineAssignmentDate, totalIdealDailyTimeForAssignedRoutine, language]);


  const handleAssignRoutine = () => {
    if (!selectedTemplateId || !weekStartDate || !currentStudentDetails) {
      toast({
        title: t('teacher.students.managePage.toast.error.general'),
        description: t('teacher.students.managePage.assignRoutine.toast.error.selectDateAndTemplate'),
        variant: "destructive",
      });
      return;
    }
    setIsAssigning(true);

    try {
      let students = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
      const templateDetails = availableTemplates.find(rt => rt.id === selectedTemplateId);

      if (!templateDetails) {
        toast({ title: t('teacher.students.managePage.toast.error.general'), description: t('teacher.students.managePage.assignRoutine.toast.error.templateNotFound'), variant: "destructive" });
        setIsAssigning(false);
        return;
      }

      let studentUpdated = false;
      const updatedStudents = students.map(student => {
        if (student.id === currentStudentDetails.id) {
          studentUpdated = true;
          return {
            ...student,
            currentRoutine: templateDetails.templateName,
            currentRoutineId: templateDetails.id,
            currentRoutineAssignmentDate: weekStartDate.toISOString(), 
            routinesAssigned: (student.routinesAssigned || 0) + 1,
            currentRoutineProgressPercent: 0, 
            currentRoutineIdealWeeklyTime: templateDetails.calculatedIdealWeeklyTime || 0, 
          };
        }
        return student;
      });

      if (studentUpdated) {
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, updatedStudents);
        const updatedStudentDetails = updatedStudents.find(s => s.id === currentStudentDetails.id);
        if (updatedStudentDetails) {
          setCurrentStudentDetails(updatedStudentDetails); 
        }
        
        toast({
          title: t('teacher.students.managePage.assignRoutine.toast.assigned.title'),
          description: t('teacher.students.managePage.assignRoutine.toast.assigned.description', {
            templateName: templateDetails.templateName,
            displayName: currentStudentDetails.displayName,
            date: format(weekStartDate, "PPP", { locale: language === 'fa' ? faIR : undefined })
          }),
        });
      } else {
         toast({ title: t('teacher.students.managePage.toast.error.general'), description: t('teacher.students.managePage.assignRoutine.toast.error.studentUpdateFailed'), variant: "destructive" });
      }

    } catch (error) {
      console.error("Error assigning routine:", error);
      toast({ title: t('teacher.students.managePage.toast.error.general'), description: t('teacher.students.managePage.assignRoutine.toast.error.assignFailed'), variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleViewLogDetails = (log: DailyPracticeLog) => {
    setSelectedLogForDetails(log);
    setIsLogDetailsDialogOpen(true);
  };

  if (isLoadingStudent) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">{t('teacher.students.managePage.loading')}</p>
      </div>
    );
  }

  if (!currentStudentDetails) {
    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild className="mb-6">
                <Link href="/teacher/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('teacher.students.managePage.backLink')}
                </Link>
            </Button>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center text-destructive">
                        <AlertTriangle className="mr-3 h-8 w-8" /> {t('teacher.students.managePage.notFound.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('teacher.students.managePage.notFound.description', { studentId })}</p>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const displayStudent = currentStudentDetails;

  return (
    <div className="space-y-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/teacher/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('teacher.students.managePage.backLink')}
            </Link>
        </Button>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6 bg-card">
            <Image 
                src={displayStudent.avatar || 'https://placehold.co/100x100.png?text=??'} 
                alt={displayStudent.displayName || "Student"} 
                width={100} 
                height={100} 
                className="rounded-full border-4 border-primary shadow-md"
                data-ai-hint="person avatar"
            />
            <div className="flex-1">
                <CardTitle className="text-3xl font-bold flex items-center">
                    <UserCog className="mr-3 h-8 w-8 text-primary" /> {displayStudent.displayName}
                </CardTitle>
                <CardDescription className="text-md text-muted-foreground">{displayStudent.email}</CardDescription>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('teacher.students.managePage.header.joinedDate', { 
                    date: displayStudent.joinedDate && isValid(parseISO(displayStudent.joinedDate)) 
                          ? format(parseISO(displayStudent.joinedDate), "PPP", { locale: language === 'fa' ? faIR : undefined }) 
                          : t('teacher.students.managePage.practiceProgress.notApplicable') 
                  })}
                </p>
                 <p className="text-sm text-muted-foreground">{t('teacher.students.managePage.header.routinesAssigned', { count: displayStudent.routinesAssigned || 0 })}</p>
                <p className="text-sm text-muted-foreground">{t('teacher.students.managePage.header.currentRoutine', { routineName: displayStudent.currentRoutine || t('teacher.students.managePage.header.noRoutineAssigned') })}</p>
                 {displayStudent.currentRoutineAssignmentDate && isValid(parseISO(displayStudent.currentRoutineAssignmentDate)) && (
                    <p className="text-sm text-muted-foreground italic">
                        {t('teacher.students.managePage.header.currentRoutineAssignedOn', { date: format(parseISO(displayStudent.currentRoutineAssignmentDate), "PPP", { locale: language === 'fa' ? faIR : undefined }) })}
                    </p>
                )}
            </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6 text-primary" /> {t('teacher.students.managePage.assignRoutine.title')}</CardTitle>
            <CardDescription>{t('teacher.students.managePage.assignRoutine.description', { displayName: displayStudent.displayName })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="routineTemplate">{t('teacher.students.managePage.assignRoutine.template.label')}</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger id="routineTemplate">
                  <SelectValue placeholder={t('teacher.students.managePage.assignRoutine.template.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.length === 0 && <SelectItem value="no-templates" disabled>{t('teacher.students.managePage.assignRoutine.template.noTemplates')}</SelectItem>}
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.templateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekStartDate">{t('teacher.students.managePage.assignRoutine.startDate.label')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {weekStartDate && isValid(weekStartDate) ? format(weekStartDate, "PPP", { locale: language === 'fa' ? faIR : undefined }) : <span>{t('teacher.students.managePage.assignRoutine.startDate.placeholder')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={weekStartDate}
                    onSelect={setWeekStartDate}
                    initialFocus
                    locale={language === 'fa' ? faIR : undefined} 
                    dir={language === 'fa' ? 'rtl' : 'ltr'}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAssignRoutine} className="w-full" disabled={isAssigning || availableTemplates.length === 0}>
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('teacher.students.managePage.assignRoutine.submitButtonLoading')}
                </>
              ) : (
                t('teacher.students.managePage.assignRoutine.submitButton')
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-2 h-6 w-6 text-primary" /> {t('teacher.students.managePage.practiceProgress.title')}</CardTitle>
            <CardDescription>{t('teacher.students.managePage.practiceProgress.description', { displayName: displayStudent.displayName })}</CardDescription>
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
      </div>

      {currentStudentDetails.currentRoutineAssignmentDate && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-6 w-6 text-primary" />
                    {t('teacher.students.managePage.chart.title')}
                </CardTitle>
                <CardDescription>
                    {t('teacher.students.managePage.chart.description', { 
                        routineName: currentStudentDetails.currentRoutine || t('teacher.students.managePage.header.noRoutineAssigned'),
                        startDate: format(parseISO(currentStudentDetails.currentRoutineAssignmentDate), "PPP", { locale: language === 'fa' ? faIR : undefined })
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8}
                                tickFormatter={(value) => language === 'fa' ? value.split(',')[0] : value.substring(0,3)} // Shorten date for X-axis
                            />
                            <YAxis 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8}
                                domain={[0, (dataMax: number) => Math.max(dataMax, totalIdealDailyTimeForAssignedRoutine || 60)]} 
                                label={{ value: t('teacher.students.managePage.chart.yAxisLabel'), angle: -90, position: 'insideLeft', offset: 0, style:{textAnchor: 'middle'} }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent 
                                    indicator="dot" 
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload.length) {
                                            return `${payload[0].payload.date}`;
                                        }
                                        return label;
                                    }}
                                />}
                            />
                            <Legend content={<ChartLegendContent />} />
                            <Bar dataKey="actualPractice" fill="var(--color-actualPractice)" radius={4} />
                            <Bar dataKey="idealDailyPractice" fill="var(--color-idealDailyPractice)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <p className="text-muted-foreground text-center py-4">{t('teacher.students.managePage.chart.noData')}</p>
                )}
            </CardContent>
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
    </div>
  );
}

