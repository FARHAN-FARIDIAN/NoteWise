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
  avatar: string;
  routinesAssigned: number;
  status: 'Active' | 'Inactive';
  role: 'student';
  teacherId?: string; // Added to link student to a teacher
  currentRoutine?: string; // Name of the currently assigned routine
  currentRoutineId?: string; // ID of the assigned routine template
  joinedDate?: string; // ISO date string
}


export interface PracticeSection {
  id: string; // Unique ID for the section within the template
  name: string;
  description?: string;
}

export interface RoutineTemplate {
  id: string; // Unique ID for the template
  // teacherId: string; // Could be added if supporting multiple teachers
  templateName: string;
  sections: PracticeSection[];
  lastModified: string; // ISO date string
}

export interface PracticeAssignment {
  id:string;
  teacherId: string;
  studentId: string;
  routineTemplateId: string;
  weekStartDate: string; // ISO date string
  isActive: boolean;
}

export interface DailyPracticeLogEntry {
  sectionId: string;
  sectionName: string;
  timeSpentMinutes: number;
}

export interface DailyPracticeLog {
  id: string; // Unique ID for the log entry
  studentId: string;
  routineName?: string; 
  routineTemplateId?: string;
  date: string; // Store as ISO date string (YYYY-MM-DD) for easier keying/filtering
  logData: DailyPracticeLogEntry[];
  dailyNotes?: string;
}
