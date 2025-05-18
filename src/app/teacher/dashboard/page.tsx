
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Users, ListMusic, Settings, Edit3, Eye, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { StudentData } from '@/types'; 
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';

const defaultTeacherUid = 'default-teacher-uid'; 
const initialStudents: StudentData[] = [
  { id: '1', uid: '1', displayName: 'Alice Wonderland', email: 'alice@example.com', avatar: 'https://placehold.co/100x100.png?text=AW', routinesAssigned: 0, status: 'Active', role: 'student', currentRoutine: 'Piano Basics Week 3', joinedDate: new Date().toISOString(), teacherId: defaultTeacherUid },
  { id: '2', uid: '2', displayName: 'Bob The Builder', email: 'bob@example.com', avatar: 'https://placehold.co/100x100.png?text=BB', routinesAssigned: 0, status: 'Active', role: 'student', currentRoutine: 'Guitar Chords Level 1', joinedDate: new Date().toISOString(), teacherId: defaultTeacherUid },
  { id: '3', uid: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', avatar: 'https://placehold.co/100x100.png?text=CB', routinesAssigned: 0, status: 'Inactive', role: 'student', currentRoutine: 'Vocal Warmups Intermediate', joinedDate: new Date().toISOString(), teacherId: defaultTeacherUid },
];


export default function TeacherDashboardPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userData: teacherData } = useAuth();
  const { t } = useTranslations();

  useEffect(() => {
    setIsLoading(true);
    const allStoredStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    
    let studentsToDisplay: StudentData[] = [];

    if (allStoredStudents.length === 0 && teacherData?.uid === defaultTeacherUid) {
        const demoTeacherInitialStudents = initialStudents.filter(s => s.teacherId === defaultTeacherUid);
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, demoTeacherInitialStudents); 
        studentsToDisplay = demoTeacherInitialStudents;
    } else {
        studentsToDisplay = allStoredStudents.filter(student => student.teacherId === teacherData?.uid);
    }
    
    setStudents(studentsToDisplay);
    setIsLoading(false);
  }, [teacherData]);


  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teacherDashboard.title')}</h1>
          <p className="text-muted-foreground">{t('teacherDashboard.description')}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/students/add">
              <PlusCircle className="mr-2 h-4 w-4" /> {t('teacherDashboard.addStudent')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/teacher/routines">
              <ListMusic className="mr-2 h-4 w-4" /> {t('teacherDashboard.manageRoutines')}
            </Link>
          </Button>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">{t('teacherDashboard.myStudents')} ({students.length})</h2>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="ml-3 text-muted-foreground">{t('teacherDashboard.loadingStudents')}</p>
          </div>
        ) : students.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle className="mt-4">{t('teacherDashboard.noStudents.title')}</CardTitle>
              <CardDescription>
                {t('teacherDashboard.noStudents.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/teacher/students/add">
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('teacherDashboard.addStudent')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {students.map((student) => (
              <Card key={student.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 p-4 bg-card">
                   <Image 
                      src={student.avatar} 
                      alt={student.displayName || 'Student Avatar'} 
                      width={64} 
                      height={64} 
                      className="rounded-full border-2 border-primary"
                      data-ai-hint="avatar person"
                    />
                  <div>
                    <CardTitle className="text-lg">{student.displayName}</CardTitle>
                    <CardDescription className="text-xs">{student.currentRoutine || "No routine assigned"}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Status: <span className={`font-medium ${student.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{student.status}</span>
                  </p>
                  <div className="flex items-center gap-2">
                     <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-accent h-2.5 rounded-full" style={{width: `${Math.min(100, (student.routinesAssigned || 0) * 15 + 10)}%`}}></div>
                    </div>
                    <span className="text-xs text-accent-foreground">{Math.min(100, (student.routinesAssigned || 0) * 15 + 10)}%</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 border-t">
                  <Button variant="default" size="sm" asChild className="w-full">
                    <Link href={`/teacher/students/${student.id}`}>
                      <Settings className="mr-2 h-4 w-4" /> Manage Student
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{t('teacherDashboard.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Button variant="outline" className="w-full justify-start text-left h-auto py-3" asChild>
                    <Link href="/teacher/routines/create">
                        <Edit3 className="mr-3 h-5 w-5 text-primary"/>
                        <div>
                            <p className="font-semibold">{t('teacherDashboard.quickActions.createRoutine')}</p>
                            <p className="text-xs text-muted-foreground">{t('teacherDashboard.quickActions.createRoutine.description')}</p>
                        </div>
                    </Link>
                </Button>
                 <Button variant="outline" className="w-full justify-start text-left h-auto py-3" disabled>
                        <Eye className="mr-3 h-5 w-5 text-primary"/>
                         <div>
                            <p className="font-semibold">{t('teacherDashboard.quickActions.viewProgress')}</p>
                            <p className="text-xs text-muted-foreground">{t('teacherDashboard.quickActions.viewProgress.description')}</p>
                        </div>
                </Button>
                 <Button variant="outline" className="w-full justify-start text-left h-auto py-3" disabled>
                        <Settings className="mr-3 h-5 w-5 text-primary"/>
                         <div>
                            <p className="font-semibold">{t('teacherDashboard.quickActions.accountSettings')}</p>
                            <p className="text-xs text-muted-foreground">{t('teacherDashboard.quickActions.accountSettings.description')}</p>
                        </div>
                </Button>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
