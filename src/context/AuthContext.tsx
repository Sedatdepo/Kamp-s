
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, Firestore, updateDoc, Unsubscribe } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { useFirebase } from '@/firebase';

export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile | null }
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string, password?: string) => Promise<boolean>;
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

  // Keep track of student snapshot listener
  const studentUnsubscribeRef = React.useRef<Unsubscribe | null>(null);

  const signOut = useCallback(async () => {
    // Unsubscribe from any active student listener
    if (studentUnsubscribeRef.current) {
        studentUnsubscribeRef.current();
        studentUnsubscribeRef.current = null;
    }
    if (auth) {
        await firebaseSignOut(auth);
    }
    localStorage.removeItem('appUser');
    setAppUser(null);
    router.push('/');
  }, [auth, router]);

  useEffect(() => {
    if (!auth || !db) {
        setLoading(false);
        const storedUser = localStorage.getItem('appUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.type === 'student') {
                    setAppUser(parsedUser);
                }
            } catch (e) {
                localStorage.removeItem('appUser');
            }
        }
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      // Clean up previous student listener if it exists
      if (studentUnsubscribeRef.current) {
          studentUnsubscribeRef.current();
          studentUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        const teacherRef = doc(db, 'teachers', firebaseUser.uid);
        const studentQuery = query(collection(db, 'students'), where('authUid', '==', firebaseUser.uid));
        
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          await seedDatabase(db, firebaseUser.uid);
          const profile = { id: teacherSnap.id, ...teacherSnap.data() } as TeacherProfile;
          setAppUser({ type: 'teacher', data: firebaseUser, profile });
        } else {
            const studentSnapshot = await getDocs(studentQuery);
            if (!studentSnapshot.empty) {
                const studentDoc = studentSnapshot.docs[0];
                
                // Set up a real-time listener for the student document
                studentUnsubscribeRef.current = onSnapshot(doc(db, 'students', studentDoc.id), (docSnap) => {
                    if (docSnap.exists()) {
                        const studentData = { id: docSnap.id, ...docSnap.data() } as Student;
                        const userPayload = { type: 'student' as 'student', data: studentData };
                        setAppUser(userPayload);
                        localStorage.setItem('appUser', JSON.stringify(userPayload)); // Keep local storage in sync
                    } else {
                        // Student document was deleted, sign out
                        signOut();
                    }
                });
            } else {
                await signOut();
            }
        }
      } else {
        setAppUser(null);
        localStorage.removeItem('appUser');
      }
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (studentUnsubscribeRef.current) {
            studentUnsubscribeRef.current();
        }
    };
  }, [auth, db, signOut]);

    useEffect(() => {
        if (loading) return;

        const isPublic = publicRoutes.includes(pathname);
        const isAuthRoute = pathname.startsWith('/dashboard');

        if (appUser) {
            const targetDashboard = `/dashboard/${appUser.type}`;
            if (!pathname.startsWith(targetDashboard)) {
                 router.push(targetDashboard);
            }
        } else {
            if (isAuthRoute) {
                router.push('/');
            }
        }
    }, [loading, appUser, pathname, router]);

    const signInTeacher = async (email: string, password: string) => {
        if (!auth || !db) throw new Error("Kimlik doğrulama başlatılamadı.");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
            const profile = { id: teacherSnap.id, ...teacherSnap.data() } as TeacherProfile;
            setAppUser({ type: 'teacher', data: user, profile });
            router.push('/dashboard/teacher');
        } else {
            await firebaseSignOut(auth);
            throw new Error("Öğretmen profili bulunamadı.");
        }
    };

    const signInStudent = async (classCode: string, studentNumber: string, password?: string): Promise<boolean> => {
        if (!db || !auth) throw new Error("Veritabanı veya kimlik doğrulama başlatılamadı.");
        
        const classesQuery = query(collection(db, "classes"), where("code", "==", classCode.toUpperCase()));
        const classesSnapshot = await getDocs(classesQuery);
    
        if (classesSnapshot.empty) {
            throw new Error("Sınıf kodu bulunamadı.");
        }
    
        const classDoc = classesSnapshot.docs[0];
        const classId = classDoc.id;

        const q = query(collection(db, "students"), where("classId", "==", classId), where("number", "==", studentNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("Sınıf kodu veya öğrenci numarası hatalı.");
        }

        const studentDoc = querySnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;

        if (studentData.authUid) {
            if (!password) {
                 throw new Error("Bu öğrenci hesabı için şifre gereklidir. Şifrenizi unuttuysanız öğretmeninizle görüşün.");
            }
             const email = `s${studentData.number}@${studentData.classId.toLowerCase()}.ito-kampus.com`;
             const userCredential = await signInWithEmailAndPassword(auth, email, password);
             
             // The onAuthStateChanged listener will handle setting the appUser.
             router.push('/dashboard/student');
             return true; 
        } else {
            const studentUser: AppUser = { type: 'student', data: studentData };
            setAppUser(studentUser);
            localStorage.setItem('appUser', JSON.stringify(studentUser));
            router.push('/dashboard/student');
            return true;
        }
    };
  
  const contextValue = useMemo(() => ({ 
      appUser, 
      loading, 
      signInStudent, 
      signInTeacher,
      signOut, 
      auth, 
      db, 
      storage 
  }), [appUser, loading, auth, db, storage, signOut, signInStudent, signInTeacher]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
