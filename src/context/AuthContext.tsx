
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string) => Promise<void>;
  createStudentAuthAccount: (studentId: string, classId: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/', '/auth/register', '/auth/change-password'];

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
    if (auth && auth.currentUser) {
        await firebaseSignOut(auth);
    }
    localStorage.removeItem('appUser');
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  useEffect(() => {
    if (!auth || !db) return;

    const storedUser = localStorage.getItem('appUser');
    if(storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if(user.type === 'student'){
                setAppUser(user);
            }
        } catch {}
    }
    setLoading(false);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
          const teacherProfileRef = doc(db, 'teachers', user.uid);
          const teacherProfileSnap = await getDoc(teacherProfileRef);

          if (teacherProfileSnap.exists()) {
              await seedDatabase(db, user.uid);
              const profile = { id: teacherProfileSnap.id, ...teacherProfileSnap.data() } as TeacherProfile;
              setAppUser({ type: 'teacher', data: user, profile });
              localStorage.removeItem('appUser');
          } else {
             // It might be a student trying to auth, check temp data
             const tempStudentData = localStorage.getItem('tempStudent');
             if(!tempStudentData) {
                await signOut();
             }
          }
      } else {
        const storedUser = localStorage.getItem('appUser');
        if(storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if(user.type === 'student'){
                    setAppUser(user);
                } else {
                    setAppUser(null);
                }
            } catch {
                setAppUser(null);
            }
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
                const newAppUser = { type: 'student' as const, data: updatedStudent };
                setAppUser(newAppUser);
                localStorage.setItem('appUser', JSON.stringify(newAppUser));
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
    
    const isPublic = publicRoutes.includes(pathname);

    if (appUser) {
        if(appUser.type === 'student' && studentNeedsPasswordChange(appUser.data)){
            router.push('/auth/change-password');
        } else if (appUser.type === 'student') {
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

  const studentNeedsPasswordChange = (student: Student) => {
    // If authUid is missing, they need to create an auth account
    return !student.authUid;
  };

  const signInStudent = async (classCode: string, studentNumber: string) => {
    if (!db) throw new Error("Veritabanı başlatılamadı.");

    setLoading(true);
    try {
        const classQuery = query(collection(db, 'classes'), where('code', '==', classCode.toUpperCase()));
        const classSnapshot = await getDocs(classQuery);
        if (classSnapshot.empty) throw new Error('Bu koda sahip bir sınıf bulunamadı.');
        const classData = { id: classSnapshot.docs[0].id, ...classSnapshot.docs[0].data() } as Class;

        const studentQuery = query(
            collection(db, 'students'),
            where('classId', '==', classData.id),
            where('number', '==', studentNumber)
        );
        const studentSnapshot = await getDocs(studentQuery);
        if (studentSnapshot.empty) throw new Error('Bu sınıfta bu numaraya sahip bir öğrenci bulunamadı.');

        const studentDoc = studentSnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        
        if (studentNeedsPasswordChange(studentData)) {
            // Student needs to set a password
            localStorage.setItem('tempStudent', JSON.stringify({ studentId: studentData.id, classCode: classData.code }));
            router.push('/auth/change-password');
            return;
        }
        
        if(auth && studentData.authUid) {
             const tempUser = await signInAnonymously(auth);
             // This is a temporary sign-in to get auth context for a full login
             // We will immediately sign this user out once we have the real account
             const studentCredential = await getDoc(doc(db, "studentCredentials", studentData.authUid));
             if(studentCredential.exists()){
                await firebaseSignOut(auth); // Sign out temp anonymous user
                const { email, password } = studentCredential.data();
                await signInWithEmailAndPassword(auth, email, password);
                // Now onAuthStateChanged will handle setting the AppUser and navigation
             } else {
                 await firebaseSignOut(auth);
                 throw new Error("Öğrenci kimlik bilgileri bulunamadı.");
             }
        } else {
            throw new Error("Öğrenci kimlik doğrulama bilgisi eksik.");
        }


    } catch (error: any) {
        console.error("Öğrenci girişi hatası:", error);
        localStorage.removeItem('appUser');
        setAppUser(null);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const createStudentAuthAccount = async (studentId: string, classId: string, password: string) => {
    if (!db || !auth) throw new Error("Sistem başlatılamadı.");

    const studentRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) throw new Error("Öğrenci bulunamadı.");
    const studentData = studentSnap.data() as Student;
    
    // Create a unique email for the student
    const email = `s${studentData.number}@${classId.toLowerCase()}.ito-kampus.com`;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store the encrypted password in a separate, secure collection
        await setDoc(doc(db, "studentCredentials", user.uid), {
            email: email,
            password: password, // In a real app, this should be encrypted
        });

        // Link the auth UID to the student document
        await updateDoc(studentRef, {
            authUid: user.uid,
        });

        localStorage.removeItem('tempStudent');
        // Let onAuthStateChanged handle the rest
    } catch (error: any) {
        if(error.code === 'auth/email-already-in-use') {
             const user = await signInWithEmailAndPassword(auth, email, password);
             localStorage.removeItem('tempStudent');
        } else {
            console.error("Öğrenci auth hesabı oluşturma hatası:", error);
            throw new Error("Hesap oluşturulamadı: " + error.message);
        }
    }
  };

  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, createStudentAuthAccount, signOut, auth, db, storage }}>
      {children}
    </AuthContext.Provider>
  );
}
