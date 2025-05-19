export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'teacher' | 'student';
}

export interface Teacher extends User {
  role: 'teacher';
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
  currentRoutine?: string; 
  currentRoutineId?: string; 
  currentRoutineAssignmentDate?: string; // Date routine was assigned
  joinedDate?: string; 
}


export interface PracticeSection {
  id: string; 
  name: string;
  description?: string;
}

export interface RoutineTemplate {
  id: string; 
  templateName: string;
  sections: PracticeSection[];
  lastModified: string; 
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
