
"use client";

import type { User as FirebaseUser } from 'firebase/auth'; 
import type { ReactNode} from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import type { User, StudentData } from '@/types'; 
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';


interface AuthContextType {
  user: FirebaseUser | null; 
  userData: User | StudentData | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>; 
  logout: () => Promise<void>;
  updateDisplayName: (newDisplayName: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>; // For teacher
  updateStudentPassword: (currentPassword: string, newPassword: string) => Promise<void>; // For student
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface MockFirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface StoredTeacherCredentials {
  uid: string;
  email: string;
  password  : string;
  displayName: string;
}

const SESSION_STORAGE_USER_KEY = 'noteWiseUser';
const SESSION_STORAGE_USER_DATA_KEY = 'noteWiseUserData';
const SESSION_STORAGE_TEACHER_CREDS_KEY = 'noteWiseTeacherCredentials';


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<MockFirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const persistedUserJson = sessionStorage.getItem(SESSION_STORAGE_USER_KEY);
    const persistedUserDataJson = sessionStorage.getItem(SESSION_STORAGE_USER_DATA_KEY);

    if (persistedUserJson && persistedUserDataJson) {
      try {
        const fbUser = JSON.parse(persistedUserJson) as MockFirebaseUser;
        const appUser = JSON.parse(persistedUserDataJson) as User | StudentData;
        
        setUser(fbUser);
        setUserData(appUser);
      } catch (e) {
        console.error("Error parsing persisted auth data from session storage", e);
        sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_USER_DATA_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistAuth = (fbUser: MockFirebaseUser | null, appUser: User | StudentData | null) => {
    if (fbUser && appUser) {
      sessionStorage.setItem(SESSION_STORAGE_USER_KEY, JSON.stringify(fbUser));
      sessionStorage.setItem(SESSION_STORAGE_USER_DATA_KEY, JSON.stringify(appUser));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_USER_DATA_KEY);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 750)); 

    const preparedLoginEmail = email.trim().toLowerCase();

    const allStoredStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    // Normalize all student emails from storage before comparison
    const normalizedStoredStudents = allStoredStudents.map(s => ({
      ...s,
      email: s.email ? s.email.trim().toLowerCase() : "" 
    }));

    const studentAccount = normalizedStoredStudents.find(
      (s) => s.email === preparedLoginEmail
    );

    if (studentAccount && studentAccount.password === pass) {
      const firebaseUser: MockFirebaseUser = {
        uid: studentAccount.uid || studentAccount.id,
        email: studentAccount.email,
        displayName: studentAccount.displayName 
      };
      setUser(firebaseUser);

      const studentSessionData: StudentData = {
        id: studentAccount.id,
        uid: studentAccount.uid || studentAccount.id,
        displayName: studentAccount.displayName,
        email: studentAccount.email!,
        password: studentAccount.password, // Storing it here is fine for mock, but not for prod
        avatar: studentAccount.avatar,
        routinesAssigned: studentAccount.routinesAssigned,
        status: studentAccount.status,
        role: 'student', // Ensure role is student
        teacherId: studentAccount.teacherId,
        currentRoutine: studentAccount.currentRoutine,
        currentRoutineId: studentAccount.currentRoutineId,
        currentRoutineAssignmentDate: studentAccount.currentRoutineAssignmentDate, // Ensure this is copied
        joinedDate: studentAccount.joinedDate,
      };
      setUserData(studentSessionData); 
      persistAuth(firebaseUser, studentSessionData); 
      setLoading(false);
      return;
    }

    const persistedTeacherCredsRaw = sessionStorage.getItem(SESSION_STORAGE_TEACHER_CREDS_KEY);
    if (persistedTeacherCredsRaw) {
      try {
        const teacherCreds = JSON.parse(persistedTeacherCredsRaw) as StoredTeacherCredentials;
        if (teacherCreds.email === preparedLoginEmail && teacherCreds.password === pass) {
          const signedUpTeacherFirebaseUser: MockFirebaseUser = { 
            uid: teacherCreds.uid, 
            email: teacherCreds.email, 
            displayName: teacherCreds.displayName 
          };
          const signedUpTeacherAppUser: User = { 
            uid: teacherCreds.uid, 
            email: teacherCreds.email, 
            displayName: teacherCreds.displayName, 
            role: 'teacher' 
          };

          setUser(signedUpTeacherFirebaseUser);
          setUserData(signedUpTeacherAppUser);
          persistAuth(signedUpTeacherFirebaseUser, signedUpTeacherAppUser);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing teacher credentials from session storage", e);
      }
    }
    
    if (preparedLoginEmail === 'teacher@example.com' && pass === "teacherpass") {
        const teacherFirebaseUser: MockFirebaseUser = { uid: 'default-teacher-uid', email: preparedLoginEmail, displayName: 'Demo Teacher' };
        const teacherAppUser: User = { uid: teacherFirebaseUser.uid, email: preparedLoginEmail, displayName: 'Demo Teacher', role: 'teacher' };
        setUser(teacherFirebaseUser);
        setUserData(teacherAppUser);
        persistAuth(teacherFirebaseUser, teacherAppUser);
        
        // Store demo teacher's "credentials" too so it behaves consistently if they "change" display name
        const demoTeacherCredsForSession: StoredTeacherCredentials = {
          uid: teacherFirebaseUser.uid,
          email: teacherFirebaseUser.email!, 
          password: pass, // Use the actual password for consistency
          displayName: teacherAppUser.displayName!
        };
        sessionStorage.setItem(SESSION_STORAGE_TEACHER_CREDS_KEY, JSON.stringify(demoTeacherCredsForSession));
        setLoading(false);
        return;
    }

    setLoading(false);
    throw new Error("Invalid credentials. Please check your email and password.");
  };

  const signup = async (email: string, pass: string, name: string) => { 
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const processedEmail = email.trim().toLowerCase(); 
    const newTeacherUID = `teacher-${Date.now()}`;
    const newTeacherFirebaseUser: MockFirebaseUser = { uid: newTeacherUID, email: processedEmail, displayName: name };
    const newTeacherData: User = { uid: newTeacherUID, email: processedEmail, displayName: name, role: 'teacher' };
    
    setUser(newTeacherFirebaseUser);
    setUserData(newTeacherData);
    persistAuth(newTeacherFirebaseUser, newTeacherData); 
    
    const teacherCredentialsToStore: StoredTeacherCredentials = {
      uid: newTeacherUID,
      email: processedEmail, 
      password: pass, 
      displayName: name
    };
    sessionStorage.setItem(SESSION_STORAGE_TEACHER_CREDS_KEY, JSON.stringify(teacherCredentialsToStore));
    
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(null);
    setUserData(null);
    sessionStorage.removeItem(SESSION_STORAGE_USER_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_USER_DATA_KEY);
    // Do NOT remove SESSION_STORAGE_TEACHER_CREDS_KEY on logout
    // to allow re-login for a teacher signed up in the same session.
    setLoading(false);
  };

  const updateDisplayName = async (newDisplayName: string) => {
    if (!user || !userData) {
      throw new Error("User not authenticated.");
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); 

    const updatedFirebaseUser = { ...user, displayName: newDisplayName };
    const updatedUserData = { ...userData, displayName: newDisplayName };

    setUser(updatedFirebaseUser);
    setUserData(updatedUserData as User | StudentData); // Cast to ensure type safety
    persistAuth(updatedFirebaseUser, updatedUserData as User | StudentData);

    if (userData.role === 'teacher') {
        const persistedTeacherCredsRaw = sessionStorage.getItem(SESSION_STORAGE_TEACHER_CREDS_KEY);
        if (persistedTeacherCredsRaw) {
            try {
                const teacherCreds = JSON.parse(persistedTeacherCredsRaw) as StoredTeacherCredentials;
                if (teacherCreds.uid === userData.uid) {
                    const updatedTeacherCreds = { ...teacherCreds, displayName: newDisplayName };
                    sessionStorage.setItem(SESSION_STORAGE_TEACHER_CREDS_KEY, JSON.stringify(updatedTeacherCreds));
                }
            } catch (e) { console.error("Error updating teacher creds display name", e); }
        }
    } else if (userData.role === 'student') {
        let students = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
        students = students.map(s => s.id === (userData as StudentData).id ? { ...s, displayName: newDisplayName } : s);
        saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, students);
    }
    setLoading(false);
  };

  const updateUserPassword = async (newPassword: string) => { // For Teacher
    if (!user || !userData || userData.role !== 'teacher') {
      throw new Error("User not authenticated or not a teacher.");
    }
     if (userData.email === 'teacher@example.com') { 
        throw new Error("Demo teacher password cannot be changed via this interface.");
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const persistedTeacherCredsRaw = sessionStorage.getItem(SESSION_STORAGE_TEACHER_CREDS_KEY);
    if (persistedTeacherCredsRaw) {
        try {
            const teacherCreds = JSON.parse(persistedTeacherCredsRaw) as StoredTeacherCredentials;
            if (teacherCreds.uid === userData.uid) { // Match UID
                const updatedTeacherCreds = { ...teacherCreds, password: newPassword };
                sessionStorage.setItem(SESSION_STORAGE_TEACHER_CREDS_KEY, JSON.stringify(updatedTeacherCreds));
                setLoading(false);
                return;
            }
        } catch (e) { console.error("Error updating teacher creds password", e); }
    }
    setLoading(false);
    // This error might occur if trying to change password for a teacher not signed up in this session
    throw new Error("Could not update password. User credentials not found for this session, or mismatch.");
  };

  const updateStudentPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !userData || userData.role !== 'student') {
      throw new Error("User not authenticated or not a student.");
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    let students = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    const studentIndex = students.findIndex(s => s.id === (userData as StudentData).id);

    if (studentIndex === -1) {
      setLoading(false);
      throw new Error("Student record not found in storage.");
    }

    const studentToUpdate = students[studentIndex];
    if (studentToUpdate.password !== currentPassword) {
      setLoading(false);
      throw new Error("Current password incorrect.");
    }

    students[studentIndex] = { ...studentToUpdate, password: newPassword };
    saveToLocalStorage(LOCAL_STORAGE_STUDENTS_KEY, students);
    
    setLoading(false);
  };


  const value = { user, userData, loading, login, signup, logout, updateDisplayName, updateUserPassword, updateStudentPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
