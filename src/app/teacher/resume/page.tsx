
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { TeacherResume } from '@/types';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_TEACHER_RESUMES_KEY } from '@/lib/localStorageKeys';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from '@/hooks/useTranslations';

const resumeSchema = z.object({
  shortBio: z.string().optional(),
  instrumentsTaught: z.string().min(1, { message: "Please list at least one instrument."}),
  musicGenres: z.string().min(1, { message: "Please list at least one genre."}),
  yearsTeaching: z.coerce.number().min(0, "Years of teaching must be non-negative.").optional(),
  formalEducation: z.string().optional(),
  teachingPhilosophy: z.string().optional(),
  yearsPerforming: z.coerce.number().min(0, "Years of performing must be non-negative.").optional(),
  bandOrchestraMemberships: z.string().optional(),
  certifications: z.string().optional(),
  honorsMemberships: z.string().optional(),
});

type ResumeFormInputs = z.infer<typeof resumeSchema>;

export default function TeacherResumePage() {
  const { userData: teacherData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ResumeFormInputs>({
    resolver: zodResolver(resumeSchema),
    defaultValues: {
        yearsTeaching: 0,
        yearsPerforming: 0,
    }
  });

  useEffect(() => {
    if (teacherData?.uid) {
      setIsLoadingData(true);
      const allResumes = getFromLocalStorage<Record<string, TeacherResume>>(LOCAL_STORAGE_TEACHER_RESUMES_KEY, {});
      const currentResume = allResumes[teacherData.uid];
      if (currentResume) {
        reset(currentResume);
      }
      setIsLoadingData(false);
    }
  }, [teacherData, reset]);

  const onSubmit: SubmitHandler<ResumeFormInputs> = async (data) => {
    if (!teacherData?.uid) {
      toast({ title: t('settings.error.title'), description: t('settings.error.generic'), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const resumeToSave: TeacherResume = {
      id: teacherData.uid,
      ...data,
      yearsTeaching: data.yearsTeaching || 0,
      yearsPerforming: data.yearsPerforming || 0,
    };

    try {
      const allResumes = getFromLocalStorage<Record<string, TeacherResume>>(LOCAL_STORAGE_TEACHER_RESUMES_KEY, {});
      allResumes[teacherData.uid] = resumeToSave;
      saveToLocalStorage(LOCAL_STORAGE_TEACHER_RESUMES_KEY, allResumes);
      toast({
        title: t('teacher.resume.toast.saved.title'),
        description: t('teacher.resume.toast.saved.description'),
      });
    } catch (error) {
      console.error("Failed to save resume:", error);
      toast({ title: t('settings.error.title'), description: t('teacher.resume.toast.error.description'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading || isLoadingData) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
            <div className="flex items-center space-x-3">
                <Briefcase className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-2xl">{t('teacher.resume.title')}</CardTitle>
                    <CardDescription>{t('teacher.resume.description')}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-6">
            
            {/* Short Bio */}
            <div className="space-y-2">
              <Label htmlFor="shortBio">{t('teacher.resume.form.shortBio.label')}</Label>
              <Textarea id="shortBio" {...register("shortBio")} placeholder={t('teacher.resume.form.shortBio.placeholder')} rows={4} />
              {errors.shortBio && <p className="text-sm text-destructive">{errors.shortBio.message}</p>}
            </div>

            {/* Instruments Taught */}
            <div className="space-y-2">
              <Label htmlFor="instrumentsTaught">{t('teacher.resume.form.instrumentsTaught.label')}</Label>
              <Input id="instrumentsTaught" {...register("instrumentsTaught")} placeholder={t('teacher.resume.form.instrumentsTaught.placeholder')} className={errors.instrumentsTaught ? "border-destructive" : ""} />
              {errors.instrumentsTaught && <p className="text-sm text-destructive">{errors.instrumentsTaught.message}</p>}
            </div>

            {/* Music Genres */}
            <div className="space-y-2">
              <Label htmlFor="musicGenres">{t('teacher.resume.form.musicGenres.label')}</Label>
              <Input id="musicGenres" {...register("musicGenres")} placeholder={t('teacher.resume.form.musicGenres.placeholder')} className={errors.musicGenres ? "border-destructive" : ""} />
              {errors.musicGenres && <p className="text-sm text-destructive">{errors.musicGenres.message}</p>}
            </div>

            {/* Years of Teaching Experience */}
            <div className="space-y-2">
              <Label htmlFor="yearsTeaching">{t('teacher.resume.form.yearsTeaching.label')}</Label>
              <Input id="yearsTeaching" type="number" {...register("yearsTeaching")} placeholder="e.g., 5" className={errors.yearsTeaching ? "border-destructive" : ""} />
              {errors.yearsTeaching && <p className="text-sm text-destructive">{errors.yearsTeaching.message}</p>}
            </div>

            {/* Formal Music Education */}
            <div className="space-y-2">
              <Label htmlFor="formalEducation">{t('teacher.resume.form.formalEducation.label')}</Label>
              <Textarea id="formalEducation" {...register("formalEducation")} placeholder={t('teacher.resume.form.formalEducation.placeholder')} rows={3}/>
              {errors.formalEducation && <p className="text-sm text-destructive">{errors.formalEducation.message}</p>}
            </div>

            {/* Teaching Philosophy */}
            <div className="space-y-2">
              <Label htmlFor="teachingPhilosophy">{t('teacher.resume.form.teachingPhilosophy.label')}</Label>
              <Textarea id="teachingPhilosophy" {...register("teachingPhilosophy")} placeholder={t('teacher.resume.form.teachingPhilosophy.placeholder')} rows={3}/>
              {errors.teachingPhilosophy && <p className="text-sm text-destructive">{errors.teachingPhilosophy.message}</p>}
            </div>

            {/* Performance Experience - Years */}
            <div className="space-y-2">
              <Label htmlFor="yearsPerforming">{t('teacher.resume.form.yearsPerforming.label')}</Label>
              <Input id="yearsPerforming" type="number" {...register("yearsPerforming")} placeholder="e.g., 3" className={errors.yearsPerforming ? "border-destructive" : ""}/>
              {errors.yearsPerforming && <p className="text-sm text-destructive">{errors.yearsPerforming.message}</p>}
            </div>

            {/* Performance Experience - Bands/Orchestras */}
            <div className="space-y-2">
              <Label htmlFor="bandOrchestraMemberships">{t('teacher.resume.form.bandOrchestraMemberships.label')}</Label>
              <Textarea id="bandOrchestraMemberships" {...register("bandOrchestraMemberships")} placeholder={t('teacher.resume.form.bandOrchestraMemberships.placeholder')} rows={2}/>
              {errors.bandOrchestraMemberships && <p className="text-sm text-destructive">{errors.bandOrchestraMemberships.message}</p>}
            </div>
            
            {/* Certifications */}
            <div className="space-y-2">
              <Label htmlFor="certifications">{t('teacher.resume.form.certifications.label')}</Label>
              <Textarea id="certifications" {...register("certifications")} placeholder={t('teacher.resume.form.certifications.placeholder')} rows={2}/>
              {errors.certifications && <p className="text-sm text-destructive">{errors.certifications.message}</p>}
            </div>

            {/* Honors and Memberships */}
            <div className="space-y-2">
              <Label htmlFor="honorsMemberships">{t('teacher.resume.form.honorsMemberships.label')}</Label>
              <Textarea id="honorsMemberships" {...register("honorsMemberships")} placeholder={t('teacher.resume.form.honorsMemberships.placeholder')} rows={2}/>
              {errors.honorsMemberships && <p className="text-sm text-destructive">{errors.honorsMemberships.message}</p>}
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('teacher.resume.form.savingButton')}</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {t('teacher.resume.form.saveButton')}</>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
