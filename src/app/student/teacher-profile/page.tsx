
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { StudentData, TeacherResume } from '@/types';
import { getFromLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_TEACHER_RESUMES_KEY } from '@/lib/localStorageKeys';
import { Loader2, UserCircle, Music, BookOpen, Star, Award, Users as UsersIcon, Info, Building } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function TeacherProfilePage() {
  const { userData: studentData, loading: authLoading } = useAuth();
  const { t } = useTranslations();
  const [teacherResume, setTeacherResume] = useState<TeacherResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentData?.role === 'student' && (studentData as StudentData).teacherId) {
      setIsLoading(true);
      const studentInfo = studentData as StudentData;
      const allResumes = getFromLocalStorage<Record<string, TeacherResume>>(LOCAL_STORAGE_TEACHER_RESUMES_KEY, {});
      const resume = allResumes[studentInfo.teacherId!];
      setTeacherResume(resume || null);
      setIsLoading(false);
    } else if (!authLoading) {
      setIsLoading(false); // Not a student or no teacherId
    }
  }, [studentData, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentData || studentData.role !== 'student' || !(studentData as StudentData).teacherId) {
    return (
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>{t('student.teacherProfile.noTeacher.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('student.teacherProfile.noTeacher.description')}</p>
        </CardContent>
      </Card>
    );
  }
  
  const currentStudentData = studentData as StudentData;

  if (!teacherResume) {
    return (
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>{t('student.teacherProfile.title', { teacherName: currentStudentData.teacherName || t('student.teacherProfile.yourTeacher') })}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('student.teacherProfile.noResume')}</p>
        </CardContent>
      </Card>
    );
  }

  const renderField = (IconComponent: React.ElementType, labelKey: string, value?: string | number | null, isList?: boolean) => {
    if (!value && value !== 0) return null;
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center">
          <IconComponent className="mr-2 h-4 w-4 text-primary" />
          {t(labelKey)}
        </h3>
        {isList && typeof value === 'string' ? (
          <div className="flex flex-wrap gap-2 mt-1">
            {value.split(',').map(item => item.trim()).filter(Boolean).map((item, index) => (
              <Badge key={index} variant="secondary" className="text-sm">{item}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-foreground whitespace-pre-wrap">{value}</p>
        )}
      </div>
    );
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 p-6">
           <div className="flex items-center space-x-4">
            <UserCircle className="h-16 w-16 text-primary" />
            <div>
                <CardTitle className="text-3xl font-bold">
                {currentStudentData.teacherName || t('student.teacherProfile.yourTeacher')}
                </CardTitle>
                {teacherResume.shortBio && (
                    <CardDescription className="text-md mt-1">{teacherResume.shortBio}</CardDescription>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {renderField(Music, 'teacher.resume.form.instrumentsTaught.label', teacherResume.instrumentsTaught, true)}
          {renderField(BookOpen, 'teacher.resume.form.musicGenres.label', teacherResume.musicGenres, true)}
          
          <Separator className="my-6"/>

          {renderField(Info, 'teacher.resume.form.yearsTeaching.label', teacherResume.yearsTeaching ? t('teacher.resume.yearsValue', { count: teacherResume.yearsTeaching }) : null)}
          {renderField(Star, 'teacher.resume.form.formalEducation.label', teacherResume.formalEducation)}
          {renderField(UsersIcon, 'teacher.resume.form.teachingPhilosophy.label', teacherResume.teachingPhilosophy)}
          
          {(teacherResume.yearsPerforming || teacherResume.bandOrchestraMemberships) && <Separator className="my-6"/>}
          
          {renderField(Info, 'teacher.resume.form.yearsPerforming.label', teacherResume.yearsPerforming ? t('teacher.resume.yearsValue', { count: teacherResume.yearsPerforming }) : null)}
          {renderField(Building, 'teacher.resume.form.bandOrchestraMemberships.label', teacherResume.bandOrchestraMemberships)}
          
          {(teacherResume.certifications || teacherResume.honorsMemberships) && <Separator className="my-6"/>}

          {renderField(Award, 'teacher.resume.form.certifications.label', teacherResume.certifications)}
          {renderField(Award, 'teacher.resume.form.honorsMemberships.label', teacherResume.honorsMemberships)}

        </CardContent>
      </Card>
    </div>
  );
}
