
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { StudentData } from '@/types';
import { generateId, getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';

export default function AddNewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { userData: teacherData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslations();

  const addStudentSchema = z.object({
    fullName: z.string().min(2, { message: t('teacher.students.addPage.validation.fullNameMin') }),
    email: z.string().trim().toLowerCase().email({ message: t('teacher.students.addPage.validation.emailInvalid') }),
    initialPassword: z.string().min(6, { message: t('teacher.students.addPage.validation.passwordMin') }).default("password"),
  });

  type AddStudentFormInputs = z.infer<typeof addStudentSchema>;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddStudentFormInputs>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      initialPassword: "password",
    }
  });

  const onSubmit: SubmitHandler<AddStudentFormInputs> = async (data) => {
    setIsSubmitting(true);
    
    const newStudentId = generateId();
    const initials = data.fullName.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A';
    const newStudent: StudentData = {
      id: newStudentId,
      uid: newStudentId, 
      displayName: data.fullName,
      email: data.email,
      avatar: `https://placehold.co/40x40.png?text=${initials}`,
      routinesAssigned: 0,
      status: 'Active',
      role: 'student',
      joinedDate: new Date().toISOString(),
      teacherId: teacherData?.uid,
    };

    try {
      const existingStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
      
      if (existingStudents.some(student => student.email === newStudent.email)) {
        toast({
          title: t('teacher.students.addPage.toast.addError.title'),
          description: t('teacher.students.addPage.toast.addError.emailExists'),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      existingStudents.push(newStudent);
      saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, existingStudents);

      toast({
        title: t('teacher.students.addPage.toast.added.title'),
        description: t('teacher.students.addPage.toast.added.description', { fullName: data.fullName }),
      });
      reset(); 
      router.push('/teacher/students');
    } catch (error) {
      console.error("Failed to add student to localStorage:", error);
      toast({
        title: t('teacher.students.addPage.toast.addError.title'),
        description: t('teacher.students.addPage.toast.addError.general'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/teacher/students">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('teacher.students.addPage.backLink')}
            </Link>
        </Button>
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <UserPlus className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-2xl">{t('teacher.students.addPage.title')}</CardTitle>
                <CardDescription>{t('teacher.students.addPage.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('teacher.students.addPage.form.fullName.label')}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t('teacher.students.addPage.form.fullName.placeholder')}
                {...register("fullName")}
                aria-invalid={errors.fullName ? "true" : "false"}
                className={errors.fullName ? "border-destructive" : ""}
              />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('teacher.students.addPage.form.email.label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('teacher.students.addPage.form.email.placeholder')}
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialPassword">{t('teacher.students.addPage.form.password.label')}</Label>
              <Input
                id="initialPassword"
                type="password"
                {...register("initialPassword")}
                aria-invalid={errors.initialPassword ? "true" : "false"}
                className={errors.initialPassword ? "border-destructive" : ""}
              />
              {errors.initialPassword && <p className="text-sm text-destructive">{errors.initialPassword.message}</p>}
              <p className="text-xs text-muted-foreground">{t('teacher.students.addPage.form.password.helpText')}</p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('teacher.students.addPage.form.submitButtonLoading')}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('teacher.students.addPage.form.submitButton')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

