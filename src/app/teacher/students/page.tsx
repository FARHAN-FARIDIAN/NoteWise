
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Users, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import type { StudentData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';

// Initial placeholder data if localStorage is empty
// Assign to default teacher ID
const defaultTeacherUid = 'default-teacher-uid'; // Make sure this matches AuthContext
const initialStudents: StudentData[] = [
  { id: '1', uid: '1', displayName: 'Alice Wonderland', email: 'alice@example.com', avatar: 'https://placehold.co/40x40.png?text=AW', routinesAssigned: 2, status: 'Active', role: 'student', teacherId: defaultTeacherUid },
  { id: '2', uid: '2', displayName: 'Bob The Builder', email: 'bob@example.com', avatar: 'https://placehold.co/40x40.png?text=BB', routinesAssigned: 1, status: 'Active', role: 'student', teacherId: defaultTeacherUid },
  { id: '3', uid: '3', displayName: 'Charlie Brown', email: 'charlie@example.com', avatar: 'https://placehold.co/40x40.png?text=CB', routinesAssigned: 0, status: 'Inactive', role: 'student', teacherId: defaultTeacherUid },
  { id: '4', uid: '4', displayName: 'Diana Prince', email: 'diana@example.com', avatar: 'https://placehold.co/40x40.png?text=DP', routinesAssigned: 3, status: 'Active', role: 'student', teacherId: defaultTeacherUid },
];

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userData: teacherData } = useAuth();
  const { t } = useTranslations();

  useEffect(() => {
    setIsLoading(true);
    try {
      const allStoredStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
      let studentsToDisplay: StudentData[] = [];

      if (allStoredStudents.length === 0) {
        const demoTeacherInitialStudents = initialStudents.filter(s => s.teacherId === defaultTeacherUid);
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, demoTeacherInitialStudents);
        if (teacherData?.uid === defaultTeacherUid) {
            studentsToDisplay = demoTeacherInitialStudents;
        }
      } else {
        studentsToDisplay = allStoredStudents.filter(student => student.teacherId === teacherData?.uid);
      }
      setStudents(studentsToDisplay);
    } catch (error) {
      console.error("Error loading students from localStorage:", error);
      // Fallback if error, show only demo teacher's students if applicable
      if (teacherData?.uid === defaultTeacherUid) {
        setStudents(initialStudents.filter(s => s.teacherId === defaultTeacherUid));
      } else {
        setStudents([]);
      }
    }
    setIsLoading(false);
  }, [teacherData]);

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (confirm(t('teacher.students.list.actions.delete.confirm', { studentName }))) {
      try {
        const allStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
        const updatedAllStudents = allStudents.filter(student => student.id !== studentId);
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, updatedAllStudents);
        // Update local state for the current teacher
        setStudents(prevStudents => prevStudents.filter(student => student.id !== studentId));
        toast({
          title: t('teacher.students.list.toast.deleted.title'),
          description: t('teacher.students.list.toast.deleted.description', { studentName }),
        });
      } catch (error) {
        console.error("Error deleting student from localStorage:", error);
        toast({
          title: t('teacher.students.list.toast.deleteError.title'),
          description: t('teacher.students.list.toast.deleteError.description'),
          variant: "destructive",
        });
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">{t('teacher.students.list.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('teacher.students.page.title')}</h1>
          <p className="text-muted-foreground">{t('teacher.students.page.description')}</p>
        </div>
        <Button asChild>
          <Link href="/teacher/students/add">
            <PlusCircle className="mr-2 h-4 w-4" /> {t('teacher.students.page.addStudentButton')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('teacher.students.list.title')}</CardTitle>
          <CardDescription>{t('teacher.students.list.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-center py-10">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg text-muted-foreground">{t('teacher.students.list.noStudents')}</p>
              <p className="text-sm text-muted-foreground">{t('teacher.students.list.noStudentsHint')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t('teacher.students.list.table.avatar')}</TableHead>
                  <TableHead>{t('teacher.students.list.table.name')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('teacher.students.list.table.email')}</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">{t('teacher.students.list.table.routinesAssigned')}</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">{t('teacher.students.list.table.status')}</TableHead>
                  <TableHead className="text-right">{t('teacher.students.list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Image 
                        src={student.avatar} 
                        alt={student.displayName} 
                        width={40} 
                        height={40} 
                        className="rounded-full"
                        data-ai-hint="person avatar"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.displayName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-muted-foreground">{student.routinesAssigned}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      <Badge variant={student.status === 'Active' ? 'default' : 'secondary'}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title={t('teacher.students.list.actions.manage.title')}>
                        <Link href={`/teacher/students/${student.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title={t('teacher.students.list.actions.delete.title', { studentName: student.displayName })} 
                        onClick={() => handleDeleteStudent(student.id, student.displayName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {students.length > 0 && (
            <CardFooter className="text-sm text-muted-foreground">
                {t('teacher.students.list.footer.showingCount', { count: students.length })}
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

