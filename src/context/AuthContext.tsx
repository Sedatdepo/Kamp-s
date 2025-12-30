"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
  | { type: 'student'; data: Student }; // Removed authUser from here

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string) => Promise<void>;
  signOut: () => Promise<void>;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  getStudentAuthUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register'];
const studentChangePassRoute = '/auth/change-password';
const STUDENT_STORAGE_KEY = 'ito_kampus_student';

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
  
  useEffect(() => {
    if (!auth || !db) return;

    // Separate listener for TEACHER auth
    const unsubscribeTeacher = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        const teacherProfileRef = doc(db, 'teachers', user.uid);
        const teacherProfileSnap = await getDoc(teacherProfileRef);

        if (teacherProfileSnap.exists()) {
            await seedDatabase(db, user.uid);
            const profile = { id: teacherProfileSnap.id, ...teacherProfileSnap.data() } as TeacherProfile;
            setAppUser({ type: 'teacher', data: user, profile });
        } else {
            await firebaseSignOut(auth);
            setAppUser(null);
        }
      } else if (appUser?.type === 'teacher' && !user) {
        // Teacher logged out, but student might be in localStorage
        const studentData = localStorage.getItem(STUDENT_STORAGE_KEY);
        if (!studentData) {
            setAppUser(null);
        }
      }
      setLoading(false);
    });

    // Student session check from localStorage
    try {
        const studentDataStr = localStorage.getItem(STUDENT_STORAGE_KEY);
        if (studentDataStr) {
            const studentData = JSON.parse(atob(studentDataStr));
            setAppUser({ type: 'student', data: studentData });
        }
    } catch (e) {
        console.error("Failed to parse student data from storage", e);
        localStorage.removeItem(STUDENT_STORAGE_KEY);
    }
    setLoading(false);

    return () => unsubscribeTeacher();
  }, [auth, db]);

  const signOut = useCallback(async () => {
    localStorage.removeItem(STUDENT_STORAGE_KEY);
    if(auth) {
        await firebaseSignOut(auth);
    }
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  const studentId = useMemo(() => appUser?.type === 'student' ? appUser.data.id : null, [appUser]);
  const teacherUid = useMemo(() => appUser?.type === 'teacher' ? appUser.data.uid : null, [appUser]);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (studentId && db) {
        const studentDocRef = doc(db, 'students', studentId);
        unsubscribe = onSnapshot(studentDocRef, (doc) => {
            if (doc.exists()) {
                const updatedStudent = { id: doc.id, ...doc.data() } as Student;
                 setAppUser(prev => prev?.type === 'student' ? { ...prev, data: updatedStudent } : prev);
                 // Update localStorage as well
                 localStorage.setItem(STUDENT_STORAGE_KEY, btoa(JSON.stringify(updatedStudent)));
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
    const isChangePass = pathname === studentChangePassRoute;

    if (appUser) {
      if (appUser.type === 'student') {
        if (appUser.data.needsPasswordChange) {
          if (!isChangePass) router.push(studentChangePassRoute);
        } else if (isPublic || isChangePass) {
          router.push('/dashboard/student');
        }
      } else if (appUser.type === 'teacher') {
        if (isPublic) router.push('/dashboard/teacher');
      }
    } else {
      if (!isPublic && !isChangePass) {
        router.push('/');
      }
    }
  }, [loading, appUser, pathname, router]);

  const signInStudent = async (classCode: string, studentNumber: string) => {
    if (!db) throw new Error("Veritabanı başlatılamadı.");

    const classQuery = query(collection(db, 'classes'), where('code', '==', classCode.toUpperCase()));
    const classSnapshot = await getDocs(classQuery);
    if (classSnapshot.empty) throw new Error('Bu koda sahip bir sınıf bulunamadı.');
    
    const classId = classSnapshot.docs[0].id;
    
    const studentQuery = query(
        collection(db, 'students'), 
        where('classId', '==', classId),
        where('number', '==', studentNumber)
    );
    const studentSnapshot = await getDocs(studentQuery);
    
    if (studentSnapshot.empty) throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');

    const studentDoc = studentSnapshot.docs[0];
    const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
    
    if (studentData.password !== studentNumber) {
        throw new Error('Şifre (öğrenci numarası) hatalı.');
    }
    
    // Store student data in local storage instead of logging in with Firebase
    localStorage.setItem(STUDENT_STORAGE_KEY, btoa(JSON.stringify(studentData)));
    setAppUser({ type: 'student', data: studentData });
  };
  
  const getStudentAuthUser = useCallback(async (): Promise<User | null> => {
      if (!auth) return null;
      if (auth.currentUser && auth.currentUser.isAnonymous) {
          return auth.currentUser;
      }
      try {
          const userCredential = await signInAnonymously(auth);
          return userCredential.user;
      } catch (error) {
          console.error("Anonymous sign-in failed", error);
          return null;
      }
  }, [auth]);

  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut, auth, db, storage, getStudentAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}
