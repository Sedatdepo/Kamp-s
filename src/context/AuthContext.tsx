
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, Firestore, updateDoc } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { useFirebase, useUser } from '@/firebase';

export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile | null }
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string, password?: string) => Promise<void>;
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
  const { user, isUserLoading } = useUser();

  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();

  const loading = isUserLoading || profileLoading;
  
  const signOut = useCallback(async () => {
    if (auth) {
        await firebaseSignOut(auth);
    }
    localStorage.removeItem('appUser');
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  useEffect(() => {
    setProfileLoading(true);
    if (user && db) {
        const teacherProfileRef = doc(db, 'teachers', user.uid);
        const unsubscribe = onSnapshot(teacherProfileRef, async (teacherProfileSnap) => {
            if (teacherProfileSnap.exists()) {
                await seedDatabase(db, user.uid);
                const profile = { id: teacherProfileSnap.id, ...teacherProfileSnap.data() } as TeacherProfile;
                setAppUser({ type: 'teacher', data: user, profile });
                localStorage.removeItem('appUser');
                setProfileLoading(false);
            } else {
                 const studentQuery = query(collection(db, 'students'), where('authUid', '==', user.uid));
                 const studentSnapshot = await getDocs(studentQuery);
                 if (!studentSnapshot.empty) {
                     const studentDoc = studentSnapshot.docs[0];
                     const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
                     const studentUser = { type: 'student' as const, data: studentData };
                     setAppUser(studentUser);
                     localStorage.setItem('appUser', JSON.stringify(studentUser));
                 } else {
                     await signOut();
                 }
                setProfileLoading(false);
            }
        });
        return () => unsubscribe();
    } else {
        const storedUser = localStorage.getItem('appUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.type === 'student') {
                    setAppUser(parsedUser);
                } else {
                    setAppUser(null);
                }
            } catch (e) {
                setAppUser(null);
                localStorage.removeItem('appUser');
            }
        } else {
            setAppUser(null);
        }
        setProfileLoading(false);
    }
  }, [user, db, signOut]);
  
   const studentId = useMemo(() => appUser?.type === 'student' ? appUser.data.id : null, [appUser]);

    useEffect(() => {
        let unsubscribeStudent: () => void = () => {};
        if (studentId && db && !user) { 
            const studentDocRef = doc(db, 'students', studentId);
            unsubscribeStudent = onSnapshot(studentDocRef, (doc) => {
                if (doc.exists()) {
                    const updatedStudent = { id: doc.id, ...doc.data() } as Student;
                    const newAppUser = { type: 'student' as const, data: updatedStudent };
                    setAppUser(newAppUser);
                    localStorage.setItem('appUser', JSON.stringify(newAppUser));
                } else {
                    signOut();
                }
            });
        }
        return () => unsubscribeStudent();
    }, [studentId, db, signOut, user]);


  useEffect(() => {
    if (loading) return;
    
    const isPublic = publicRoutes.includes(pathname);

    if (appUser) {
        if (appUser.type === 'student') {
            if(pathname.startsWith('/dashboard/teacher') || isPublic) router.push('/dashboard/student');
        } else if (appUser.type === 'teacher') {
            if(pathname.startsWith('/dashboard/student') || isPublic) router.push('/dashboard/teacher');
        }
    } else {
      if (!isPublic) {
        router.push('/');
      }
    }
  }, [loading, appUser, pathname, router]);

  const signInStudent = async (classCode: string, studentNumber: string, password?: string) => {
    if (!db || !auth) throw new Error("Veritabanı veya kimlik doğrulama başlatılamadı.");

    setProfileLoading(true);
    try {
        const classQuery = query(collection(db, 'classes'), where('code', '==', classCode.toUpperCase()));
        const classSnapshot = await getDocs(classQuery);
        if (classSnapshot.empty) throw new Error('Bu koda sahip bir sınıf bulunamadı.');
        const classDoc = classSnapshot.docs[0];
        const classData = { id: classDoc.id, ...classDoc.data() } as Class;

        // Corrected Query: Use the classId to query the subcollection
        const studentQuery = query(
            collection(db, 'classes', classData.id, 'students'),
            where('number', '==', studentNumber)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');

        const studentDoc = studentSnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        
        if (studentData.authUid) {
            if (!password) {
                 const studentUser: AppUser = { type: 'student', data: studentData };
                 setAppUser(studentUser);
                 localStorage.setItem('appUser', JSON.stringify(studentUser));
                 window.dispatchEvent(new CustomEvent('open-student-settings'));
                 throw new Error("Bu öğrenci hesabı için şifre gereklidir. Şifrenizi unuttuysanız öğretmeninizle görüşün.");
            }
             const email = `s${studentData.number}@${studentData.classId.toLowerCase()}.ito-kampus.com`;
             await signInWithEmailAndPassword(auth, email, password);
             // onAuthStateChanged will handle setting the user and navigation.
        } else {
            // No authUid, this is a guest-like session for the student
            const studentUser: AppUser = { type: 'student', data: studentData };
            setAppUser(studentUser);
            localStorage.setItem('appUser', JSON.stringify(studentUser));
            router.push('/dashboard/student');
        }

    } catch (error: any) {
        console.error("Öğrenci girişi hatası:", error);
        localStorage.removeItem('appUser');
        setAppUser(null);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('Girdiğiniz şifre hatalı.');
        }
        throw error;
    } finally {
        setProfileLoading(false);
    }
  };
  
  const contextValue = useMemo(() => ({ 
      appUser, 
      loading, 
      signInStudent, 
      signOut, 
      auth, 
      db, 
      storage 
  }), [appUser, loading, signInStudent, signOut, auth, db, storage]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
