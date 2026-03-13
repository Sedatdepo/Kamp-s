
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, Firestore, Unsubscribe } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BADGES } from '@/lib/grading-defaults';
import { useFirebase } from '@/firebase';

export type AppUser = { type: 'teacher'; data: User; profile: TeacherProfile } | { type: 'student_session'; data: User };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInTeacher: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register'];

async function seedDatabase(db: Firestore, teacherId: string) {
    const teacherRef = doc(db, 'teachers', teacherId);
    const teacherSnap = await getDoc(teacherRef);
    if (!teacherSnap.exists()) return;

    const teacherData = teacherSnap.data();
    const updates: Partial<TeacherProfile> = {};

    if (!teacherData.perfCriteria) updates.perfCriteria = INITIAL_PERF_CRITERIA;
    if (!teacherData.projCriteria) updates.projCriteria = INITIAL_PROJ_CRITERIA;
    if (!teacherData.behaviorCriteria) updates.behaviorCriteria = INITIAL_BEHAVIOR_CRITERIA;
    if (!teacherData.badgeCriteria) updates.badgeCriteria = INITIAL_BADGES;
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
  const { auth, firestore: db, storage } = useFirebase();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const userUnsubscribeRef = React.useRef<Unsubscribe | null>(null);

  const signOut = useCallback(async () => {
     if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
        userUnsubscribeRef.current = null;
    }
    if (auth) {
        await firebaseSignOut(auth);
    }
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
        userUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        setLoading(true); // Start loading when user is found
        const teacherRef = doc(db, 'teachers', firebaseUser.uid);

        userUnsubscribeRef.current = onSnapshot(
          teacherRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              await seedDatabase(db, firebaseUser.uid);
              const profile = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as TeacherProfile;
              setAppUser({ type: 'teacher', data: firebaseUser, profile });
              setLoading(false);
            } else {
              // Not a teacher. Treat as an anonymous/student session.
              // This keeps the user authenticated to satisfy security rules.
              setAppUser({ type: 'student_session', data: firebaseUser });
              setLoading(false);
            }
          },
          (error) => {
            console.error("Error fetching teacher profile:", error);
            setAppUser(null);
            setLoading(false); // Stop loading on error
          }
        );
      } else {
        // No firebaseUser
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
      }
    };
  }, [auth, db, signOut]);

    useEffect(() => {
        if (loading) return;

        const studentRoutes = ['/giris', '/portal', '/oylama', '/sosyogram', '/view'];
        const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));
        const isAuthRoute = pathname.startsWith('/dashboard');

        if (appUser && appUser.type === 'teacher') {
            const targetDashboard = `/dashboard/teacher`;
            if (appUser.profile?.id && !isStudentRoute && !pathname.startsWith(targetDashboard)) {
                 router.push(targetDashboard);
            }
        } else if (!appUser && isAuthRoute) {
             router.push('/');
        }
    }, [loading, appUser, pathname, router]);

    const signInTeacher = async (email: string, password: string) => {
        if (!auth || !db) throw new Error("Kimlik doğrulama başlatılamadı.");
        await signInWithEmailAndPassword(auth, email, password);
    };

  const contextValue = useMemo(() => ({ 
      appUser, 
      loading, 
      signInTeacher,
      signOut, 
      auth, 
      db, 
      storage 
  }), [appUser, loading, auth, db, storage, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
