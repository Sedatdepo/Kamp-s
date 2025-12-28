
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, writeBatch, setDoc, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
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
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string) => Promise<void>;
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
        console.log("Seeding teacher profile with default grading data...");
        await setDoc(teacherRef, updates, { merge: true });
        console.log("Seeding complete.");
    }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { auth, db, storage } = useMemo(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    return { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  }, []);
  
  useEffect(() => {
    setIsMounted(true);
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
             // This case might happen if a user is authenticated but has no teacher profile.
             // We can sign them out or handle as an error state. For now, we treat as no user.
             await firebaseSignOut(auth);
             setAppUser(null);
        }
      } else {
        const studentData = localStorage.getItem('studentUser');
        if (studentData) {
          try {
            setAppUser({ type: 'student', data: JSON.parse(studentData) });
          } catch(e) {
             console.error("Failed to parse student data from localStorage", e);
             localStorage.removeItem('studentUser');
             setAppUser(null);
          }
        } else {
          setAppUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    localStorage.removeItem('studentUser');
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
                setAppUser({ type: 'student', data: updatedStudent });
                localStorage.setItem('studentUser', JSON.stringify(updatedStudent));
            } else {
                // Student document was deleted, sign out
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
    if (loading || !isMounted) {
      return; 
    }

    const isInviteLink = searchParams.get('invite') === 'true';
    if (isInviteLink) {
        return; // Don't redirect if it's an invite link, let the page handle it.
    }

    const isPublic = publicRoutes.includes(pathname);
    const isChangePass = pathname === studentChangePassRoute;

    if (appUser) {
      if (appUser.type === 'student') {
        if (appUser.data.needsPasswordChange) {
          if (!isChangePass) {
            router.push(studentChangePassRoute);
          }
        } else if (isPublic || isChangePass) {
          router.push('/dashboard/student');
        }
      } else if (appUser.type === 'teacher') {
        if (isPublic) {
          router.push('/dashboard/teacher');
        }
      }
    } else {
      if (!isPublic && pathname !== '/auth/change-password') {
        router.push('/');
      }
    }
  }, [loading, isMounted, appUser, pathname, router, searchParams]);

  const signInStudent = async (classCode: string, studentNumber: string) => {
    if (!db) throw new Error("Veritabanı başlatılamadı.");
    
    // 1. Find the class with the given code
    const classQuery = query(collection(db, 'classes'), where('code', '==', classCode));
    const classSnapshot = await getDocs(classQuery);

    if (classSnapshot.empty) {
        throw new Error('Bu koda sahip bir sınıf bulunamadı.');
    }
    const classDoc = classSnapshot.docs[0];
    const classId = classDoc.id;

    // 2. Find the student in that class with the given number
    const studentQuery = query(
        collection(db, 'students'), 
        where('classId', '==', classId),
        where('number', '==', studentNumber)
    );
    const studentSnapshot = await getDocs(studentQuery);

    if (studentSnapshot.empty) {
        throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');
    }
    
    const studentDoc = studentSnapshot.docs[0];
    const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;

    if (studentData.password !== studentNumber) {
        throw new Error('Geçersiz şifre.');
    }
    
    localStorage.setItem('studentUser', JSON.stringify(studentData));
    setAppUser({ type: 'student', data: studentData });
  };
  

  if (!isMounted || loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="mt-4 h-8 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut, auth, db, storage }}>
      {children}
    </AuthContext.Provider>
  );
}
