
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, updateDoc, Firestore, writeBatch } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

// Define firebaseConfig directly here
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile | null }
  | { type: 'student'; data: Student; };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string) => Promise<void>;
  createStudentAuthAccount: (student: Student, newPassword: string) => Promise<string>;
  getStudentAuthUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register'];
const studentChangePassRoute = '/auth/change-password';

async function seedDatabase(db: Firestore, teacherId: string) {
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) return;

    const teacherData = teacherSnap.data();
    const updates: Partial<TeacherProfile> = {};

    if (!teacherData.perfCriteria) updates.perfCriteria = INITIAL_PERF_CRITERIA;
    if (!teacherData.projCriteria) updates.projCriteria = INITIAL_PROJ_CRITERIA;
    if (!teacherData.behaviorCriteria) updates.behaviorCriteria = INITIAL_BEHAVIOR_CRITERIA;
    if (!teacherData.reportConfig) {
        updates.reportConfig = {
            schoolName: teacherData.schoolName || "",
            teacherName: teacherData.name || "",
            principalName: teacherData.principalName || "",
            academicYear: "2024-2025",
            semester: "1",
            lessonName: teacherData.branch || "",
            date: new Date().toLocaleDateString('tr-TR')
        };
    }
    
    if (Object.keys(updates).length > 0) {
        await setDoc(teacherRef, updates, { merge: true });
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const { auth, db, storage } = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    return { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  }, []);
  
  const signOut = useCallback(async () => {
    if (auth) {
        await firebaseSignOut(auth);
    }
    localStorage.removeItem('appUser');
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const teacherProfileRef = doc(db, 'teachers', user.uid);
        const teacherProfileSnap = await getDoc(teacherProfileRef);
        if (teacherProfileSnap.exists()) {
          await seedDatabase(db, user.uid);
          const profile = { id: teacherProfileSnap.id, ...teacherProfileSnap.data() } as TeacherProfile;
          setAppUser({ type: 'teacher', data: user, profile });
        } else {
             // This case is for students who might have real accounts, which we are phasing out
             // for the simple login system. We just sign them out.
             await signOut();
        }
      } else {
         const localUserData = localStorage.getItem('appUser');
         if (localUserData) {
            setAppUser(JSON.parse(localUserData));
         } else {
            setAppUser(null);
         }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, signOut]);
  

  const studentId = useMemo(() => appUser?.type === 'student' ? appUser.data.id : null, [appUser]);
  const teacherUid = useMemo(() => appUser?.type === 'teacher' ? appUser.data.uid : null, [appUser]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (studentId && db) {
        const studentDocRef = doc(db, 'students', studentId);
        unsubscribe = onSnapshot(studentDocRef, (doc) => {
            if (doc.exists()) {
                const updatedStudent = { id: doc.id, ...doc.data() } as Student;
                 setAppUser(prev => {
                     const newUser = prev?.type === 'student' ? { ...prev, data: updatedStudent } : prev;
                     if (newUser) localStorage.setItem('appUser', JSON.stringify(newUser));
                     return newUser;
                 });
            } else {
                signOut();
            }
        });
    } else if (teacherUid && db) {
        const teacherDocRef = doc(db, 'teachers', teacherUid);
        unsubscribe = onSnapshot(teacherDocRef, (doc) => {
            if (doc.exists()) {
                const updatedProfile = { id: doc.id, ...doc.data() } as TeacherProfile;
                setAppUser(prev => (prev && prev.type === 'teacher') ? { ...prev, profile: updatedProfile } : prev);
            }
        });
    }
    return () => unsubscribe();
  }, [studentId, teacherUid, db, signOut]);

  useEffect(() => {
    if (loading) return;
    
    const isPublic = publicRoutes.includes(pathname) || pathname.startsWith('/auth/register');
     if (pathname === '/' && typeof window !== 'undefined' && window.location.search.includes('invite=true')) {
        return;
    }

    if (appUser) {
      if (appUser.type === 'student') {
        if (isPublic) {
          router.push('/dashboard/student');
        }
      } else if (appUser.type === 'teacher') {
        if (isPublic) router.push('/dashboard/teacher');
      }
    } else {
      if (!isPublic) {
        router.push('/');
      }
    }
  }, [loading, appUser, pathname, router]);


  const signInStudent = async (classCode: string, studentNumber: string) => {
    if (!db) throw new Error("Veritabanı başlatılamadı.");

    setLoading(true);
    try {
        const classQuery = query(collection(db, 'classes'), where('code', '==', classCode.toUpperCase()));
        const classSnapshot = await getDocs(classQuery);
        if (classSnapshot.empty) throw new Error('Bu koda sahip bir sınıf bulunamadı.');

        const studentQuery = query(
            collection(db, 'students'),
            where('classId', '==', classSnapshot.docs[0].id),
            where('number', '==', studentNumber)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');

        const studentDoc = studentSnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;

        // No password check, no Firebase Auth. Just create a local session.
        const user: AppUser = { type: 'student', data: studentData };
        localStorage.setItem('appUser', JSON.stringify(user));
        setAppUser(user);
        // Redirection is handled by the useEffect above
    } catch (error: any) {
        console.error("Öğrenci girişi hatası:", error);
        localStorage.removeItem('appUser');
        setAppUser(null);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const createStudentAuthAccount = async (student: Student, newPassword: string): Promise<string> => {
     // This function is now deprecated in the simple login model but kept for potential future use.
     throw new Error("Bu fonksiyon artık kullanılmamaktadır.");
  }
  
  const getStudentAuthUser = async (): Promise<User | null> => {
      // This is no longer applicable for students in the simple login model.
      return null;
  };


  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut, createStudentAuthAccount, getStudentAuthUser, auth, db, storage }}>
      {children}
    </AuthContext.Provider>
  );
}
