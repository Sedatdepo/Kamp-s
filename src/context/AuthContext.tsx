"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import type { Student, TeacherProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';


export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile | null }
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (studentId: string, passwordAsNumber: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register'];
const studentChangePassRoute = '/auth/change-password';

async function seedDatabase(teacherId: string) {
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
  
  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        await seedDatabase(user.uid);
        const profileDoc = await getDoc(doc(db, 'teachers', user.uid));
        const profile = profileDoc.exists() ? { id: profileDoc.id, ...profileDoc.data() } as TeacherProfile : null;
        setAppUser({ type: 'teacher', data: user, profile });
      } else {
        const studentData = localStorage.getItem('studentUser');
        if (studentData) {
          setAppUser({ type: 'student', data: JSON.parse(studentData) });
        } else {
          setAppUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (appUser?.type === 'student') {
      unsubscribe = onSnapshot(doc(db, 'students', appUser.data.id), (doc) => {
        if (doc.exists()) {
          const updatedStudent = { id: doc.id, ...doc.data() } as Student;
          setAppUser({ type: 'student', data: updatedStudent });
          localStorage.setItem('studentUser', JSON.stringify(updatedStudent));
        }
      });
    } else if (appUser?.type === 'teacher') {
      unsubscribe = onSnapshot(doc(db, 'teachers', appUser.data.uid), (doc) => {
        if (doc.exists()) {
          const updatedProfile = { id: doc.id, ...doc.data() } as TeacherProfile;
          setAppUser(prev => prev ? { ...prev, profile: updatedProfile } as AppUser : null);
        }
      });
    }
    return () => unsubscribe();
  }, [appUser?.type, appUser?.type === 'student' ? appUser.data.id : appUser?.type === 'teacher' ? appUser.data.uid : null]);

  useEffect(() => {
    if (loading || !isMounted) {
      return; 
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
      if (!isPublic) {
        router.push('/');
      }
    }
  }, [loading, isMounted, appUser, pathname, router]);

  const signInStudent = async (studentId: string, passwordAsNumber: string) => {
    const studentDocRef = doc(db, 'students', studentId);
    const studentDoc = await getDoc(studentDocRef);

    if (!studentDoc.exists()) {
        throw new Error('Öğrenci bulunamadı.');
    }
    
    const studentDataDb = studentDoc.data();

    if (studentDataDb.password !== passwordAsNumber) {
        throw new Error('Geçersiz şifre.');
    }
  
    const studentData = { id: studentDoc.id, ...studentDataDb } as Student;
    localStorage.setItem('studentUser', JSON.stringify(studentData));
    setAppUser({ type: 'student', data: studentData });
  };
  
  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('studentUser');
    setAppUser(null);
    router.push('/');
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
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
