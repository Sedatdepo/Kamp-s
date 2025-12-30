
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
  signInStudent: (classCode: string, studentNumber: string, password?: string) => Promise<void>;
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

  // Main auth state listener for teachers
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) { // Only handle non-anonymous users here
        const teacherProfileRef = doc(db, 'teachers', user.uid);
        const teacherProfileSnap = await getDoc(teacherProfileRef);

        if (teacherProfileSnap.exists()) {
            await seedDatabase(db, user.uid);
            const profile = { id: teacherProfileSnap.id, ...teacherProfileSnap.data() } as TeacherProfile;
            setAppUser({ type: 'teacher', data: user, profile });
        } else {
             // If a non-anonymous user exists but has no teacher profile, sign out.
            await firebaseSignOut(auth);
            setAppUser(null);
        }
      } else if (!user) { // No user is logged in
        // Check for local student session
        const localUser = localStorage.getItem('appUser');
        if (!localUser) {
            setAppUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);
  
  // Load student from local storage
  useEffect(() => {
      try {
          const localUserStr = localStorage.getItem('appUser');
          if(localUserStr) {
              const localUser = JSON.parse(localUserStr);
              if (localUser && localUser.type === 'student') {
                  setAppUser(localUser);
              }
          }
      } catch (e) {
        console.error("Could not parse student session from localStorage", e);
      }
      setLoading(false);
  }, []);


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


  const signInStudent = async (classCode: string, studentNumber: string, password?: string) => {
    if (!db || !auth) throw new Error("Veritabanı veya kimlik doğrulama başlatılamadı.");

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

        const loginPassword = password || studentNumber;

        if (studentData.password !== loginPassword) {
            throw new Error('Şifre hatalı.');
        }
        
        const user: AppUser = { type: 'student', data: studentData };
        localStorage.setItem('appUser', JSON.stringify(user));
        setAppUser(user);

        // This is a temporary auth for file upload, not for session management.
        if (!studentData.authUid) {
             const studentEmail = `${studentNumber}@${classCode.toLowerCase()}.ito-kampus.local`;
             try {
                const cred = await createUserWithEmailAndPassword(auth, studentEmail, loginPassword);
                await updateDoc(studentDoc.ref, { authUid: cred.user.uid });
             } catch(e) {
                // If user already exists, sign them in to get authUid if it's missing in DB
                 if ((e as any).code === 'auth/email-already-in-use') {
                    const cred = await signInWithEmailAndPassword(auth, studentEmail, loginPassword);
                    await updateDoc(studentDoc.ref, { authUid: cred.user.uid });
                 } else {
                     throw e;
                 }
             }
        }


    } catch (error) {
        console.error("Öğrenci girişi hatası:", error);
        localStorage.removeItem('appUser');
        setAppUser(null);
        if (auth.currentUser) await firebaseSignOut(auth);
        throw error;
    } finally {
        setLoading(false);
    }
  };
  
  const getStudentAuthUser = async (): Promise<User | null> => {
      if (!auth || !db || appUser?.type !== 'student') {
        return null;
      }
      const student = appUser.data;
      if (!student.authUid || !student.password || !student.classId) return null;

      if (auth.currentUser && auth.currentUser.uid === student.authUid) {
        return auth.currentUser;
      }

      // Re-authenticate if not already logged in as the correct user
      try {
          const classRef = doc(db, 'classes', student.classId);
          const classSnap = await getDoc(classRef);
          if (!classSnap.exists()) return null;
          
          const classCode = classSnap.data().code;
          const studentEmail = `${student.number}@${classCode.toLowerCase()}.ito-kampus.local`;

          const userCredential = await signInWithEmailAndPassword(auth, studentEmail, student.password);
          return userCredential.user;
      } catch (error) {
          console.error("Student re-authentication failed", error);
          return null;
      }
  };


  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut, getStudentAuthUser, auth, db, storage }}>
      {children}
    </AuthContext.Provider>
  );
}


    