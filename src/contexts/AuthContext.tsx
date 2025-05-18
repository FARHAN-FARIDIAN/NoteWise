
"use client";

import type { User as FirebaseUser } from 'firebase/auth'; // Placeholder
import type { ReactNode} from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import type { User, StudentData } from '@/types'; 
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/utils';
import { LOCAL_STORAGE_STUDENTS_KEY } from '@/lib/localStorageKeys';


interface AuthContextType {
  user: FirebaseUser | null; 
  userData: User | StudentData | null; // Can be teacher or student data
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>; // Teacher signup
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock Firebase User structure
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

    // 1. Attempt Student Login
    const storedStudents = getFromLocalStorage<StudentData[]>(LOCAL_STORAGE_STUDENTS_KEY, []);
    // Ensure all student emails from storage are normalized before comparison
    const normalizedStoredStudents = storedStudents.map(s => ({
      ...s,
      email: s.email ? s.email.trim().toLowerCase() : "" 
    }));

    const studentAccount = normalizedStoredStudents.find(
      (s) => s.email === preparedLoginEmail
    );

    if (studentAccount && pass === "password") {
      // If studentAccount is found and password matches, proceed.
      // The StudentData type already enforces role: 'student'.
      const firebaseUser: MockFirebaseUser = {
        uid: studentAccount.uid || studentAccount.id, // Use uid if available, fallback to id
        email: studentAccount.email, // This is the matched, normalized email
        displayName: studentAccount.displayName 
      };
      setUser(firebaseUser);

      // Explicitly reconstruct the StudentData object for the session to ensure all fields are correct
      const studentSessionData: StudentData = {
        id: studentAccount.id,
        uid: studentAccount.uid || studentAccount.id,
        displayName: studentAccount.displayName,
        email: studentAccount.email!, // email is guaranteed by the find condition
        avatar: studentAccount.avatar,
        routinesAssigned: studentAccount.routinesAssigned,
        status: studentAccount.status,
        role: 'student', // Explicitly set role
        teacherId: studentAccount.teacherId,
        currentRoutine: studentAccount.currentRoutine,
        currentRoutineId: studentAccount.currentRoutineId,
        joinedDate: studentAccount.joinedDate,
      };
      setUserData(studentSessionData); 
      persistAuth(firebaseUser, studentSessionData); 
      setLoading(false);
      return;
    }

    // 2. Attempt Signed-up Teacher Login (from current session)
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
          persistAuth(signedUpTeacherFirebaseUser, signedUpTeacherAppUser); // Persist this full user data
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing teacher credentials from session storage", e);
         sessionStorage.removeItem(SESSION_STORAGE_TEACHER_CREDS_KEY);
      }
    }
    
    // 3. Fallback/Default Demo Teacher Login
    if (preparedLoginEmail === 'teacher@example.com' && pass === "teacherpass") {
        const teacherFirebaseUser: MockFirebaseUser = { uid: 'default-teacher-uid', email: preparedLoginEmail, displayName: 'Demo Teacher' };
        const teacherAppUser: User = { uid: teacherFirebaseUser.uid, email: preparedLoginEmail, displayName: 'Demo Teacher', role: 'teacher' };
        setUser(teacherFirebaseUser);
        setUserData(teacherAppUser);
        persistAuth(teacherFirebaseUser, teacherAppUser);
        
        const demoTeacherCredsForSession: StoredTeacherCredentials = {
          uid: teacherFirebaseUser.uid,
          email: teacherFirebaseUser.email!, 
          password: pass, 
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
      displayName: newTeacherFirebaseUser.displayName!
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
    // SESSION_STORAGE_TEACHER_CREDS_KEY is NOT cleared here, 
    // allowing a teacher who signed up in this session to log back in.
    setLoading(false);
  };

  const value = { user, userData, loading, login, signup, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

