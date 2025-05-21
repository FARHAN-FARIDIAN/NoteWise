
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'teacher' | 'student';
}

export interface Teacher extends User {
  role: 'teacher';
}

export interface TeacherResume {
  id: string; // teacherUID, matches User['uid']
  shortBio?: string;
  instrumentsTaught?: string; // Comma-separated or similar
  musicGenres?: string; // Comma-separated or similar
  yearsTeaching?: number;
  formalEducation?: string;
  teachingPhilosophy?: string;
  yearsPerforming?: number;
  bandOrchestraMemberships?: string;
  certifications?: string;
  honorsMemberships?: string;
}

export interface StudentData {
  id: string; 
  uid?: string; 
  displayName: string;
  email: string;
  password?: string;
  avatar: string;
  routinesAssigned: number;
  status: 'Active' | 'Inactive';
  role: 'student';
  teacherId?: string; 
  teacherName?: string; // Added to store the assigned teacher's display name
  currentRoutine?: string; 
  currentRoutineId?: string; 
  currentRoutineAssignmentDate?: string; // Date routine was assigned
  currentRoutineIdealWeeklyTime?: number; // Ideal weekly time for the current routine
  currentRoutineProgressPercent?: number; // Progress for the current routine
  joinedDate?: string; 
}


export interface PracticeSection {
  id: string; 
  name: string;
  description?: string;
  idealDailyTimeMinutes?: number;
}

export interface RoutineTemplate {
  id: string; 
  templateName: string;
  sections: PracticeSection[];
  lastModified: string; 
  calculatedIdealWeeklyTime?: number;
}

export interface PracticeAssignment {
  id:string;
  teacherId: string;
  studentId: string;
  routineTemplateId: string;
  weekStartDate: string; 
  isActive: boolean;
}

export interface DailyPracticeLogEntry {
  sectionId: string;
  sectionName: string;
  timeSpentMinutes: number;
}

export interface DailyPracticeLog {
  id: string; 
  studentId: string;
  routineName?: string; 
  routineTemplateId?: string;
  date: string; 
  logData: DailyPracticeLogEntry[];
  dailyNotes?: string;
}

