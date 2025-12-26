"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import type { Student, TeacherProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile | null }
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classId: string, studentNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Teacher auth functions could be added here if not handled by a dedicated form
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register'];
const studentOnlyRoutes = ['/dashboard/student', '/auth/change-password'];
const teacherOnlyRoutes = ['/dashboard/teacher'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Teacher is logged in via Firebase Auth
        const profileDoc = await getDoc(doc(db, 'teachers', user.uid));
        if (profileDoc.exists()) {
          setAppUser({ type: 'teacher', data: user, profile: { id: profileDoc.id, ...profileDoc.data() } as TeacherProfile });
        } else {
           setAppUser({ type: 'teacher', data: user, profile: null });
        }
      } else {
        // Check for student session in localStorage
        const studentData = localStorage.getItem('studentUser');
        if (studentData) {
          const student = JSON.parse(studentData);
          setAppUser({ type: 'student', data: student });
        } else {
          setAppUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time updates for student data
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
    }
    return () => unsubscribe();
  }, [appUser?.type]);
  
    // Real-time updates for teacher profile
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (appUser?.type === 'teacher') {
      unsubscribe = onSnapshot(doc(db, 'teachers', appUser.data.uid), (doc) => {
        if (doc.exists()) {
          const updatedProfile = { id: doc.id, ...doc.data() } as TeacherProfile;
          setAppUser(prev => prev ? { ...prev, profile: updatedProfile } as AppUser : null);
        }
      });
    }
    return () => unsubscribe();
  }, [appUser?.type]);

  useEffect(() => {
    if (loading) return;

    const isPublic = publicRoutes.includes(pathname);
    if (isPublic) return;

    if (!appUser) {
      router.push('/');
      return;
    }

    if (appUser.type === 'teacher' && !teacherOnlyRoutes.some(p => pathname.startsWith(p))) {
      router.push('/dashboard/teacher');
    } else if (appUser.type === 'student') {
        if (appUser.data.needsPasswordChange && pathname !== '/auth/change-password') {
            router.push('/auth/change-password');
        } else if (!appUser.data.needsPasswordChange && !studentOnlyRoutes.some(p => pathname.startsWith(p))) {
            router.push('/dashboard/student');
        }
    }
  }, [appUser, loading, pathname, router]);


  const signInStudent = async (classId: string, studentNumber: string, password: string) => {
    // This is a simplified, insecure student login. In a real app, use a server-side function.
    const studentRef = doc(db, 'students', `${classId}_${studentNumber}`);
    const studentDoc = await getDoc(studentRef);

    if (studentDoc.exists() && studentDoc.data().password === password) {
      const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
      localStorage.setItem('studentUser', JSON.stringify(studentData));
      setAppUser({ type: 'student', data: studentData });
      if (studentData.needsPasswordChange) {
        router.push('/auth/change-password');
      } else {
        router.push('/dashboard/student');
      }
    } else {
      throw new Error('Invalid student details or password.');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('studentUser');
    setAppUser(null);
    router.push('/');
  };

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
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
