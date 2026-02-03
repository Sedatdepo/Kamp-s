
"use client";

import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, setDoc, Firestore, updateDoc, Unsubscribe } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { useRouter, usePathname } from 'next/navigation';
import type { Student, TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export type AppUser = 
  | { type: 'teacher'; data: User; profile: TeacherProfile }
  | { type: 'student'; data: Student; user: User };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInTeacher: (email: string, password: string) => Promise<void>;
  signInStudent: (classCode: string, schoolNumber: string, password: string) => Promise<void>;
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
  const { toast } = useToast();
  
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

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (userUnsubscribeRef.current) userUnsubscribeRef.current();
      userUnsubscribeRef.current = null;

      if (firebaseUser) {
        const teacherRef = doc(db, 'teachers', firebaseUser.uid);
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          await seedDatabase(db, firebaseUser.uid);
          
          userUnsubscribeRef.current = onSnapshot(teacherRef, (docSnap) => {
            if (docSnap.exists()) {
                const profile = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as TeacherProfile;
                 if (profile.name && profile.schoolName) {
                    setAppUser({ type: 'teacher', data: firebaseUser, profile });
                }
            } else {
                 signOut();
            }
          });
        } else {
          // It might be a student
          const studentsQuery = query(collection(db, "students"), where("authUid", "==", firebaseUser.uid));
          const studentSnapshot = await getDocs(studentsQuery);

          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            userUnsubscribeRef.current = onSnapshot(studentDoc.ref, (docSnap) => {
                if(docSnap.exists()){
                     const studentData = { id: docSnap.id, ...docSnap.data() } as Student;
                     setAppUser({ type: 'student', data: studentData, user: firebaseUser });
                } else {
                     signOut();
                }
            });
          } else {
            await signOut();
          }
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (userUnsubscribeRef.current) userUnsubscribeRef.current();
    };
  }, [auth, db, signOut]);

    useEffect(() => {
        if (loading) return;

        const isPublic = publicRoutes.includes(pathname);
        const isAuthRoute = pathname.startsWith('/dashboard');

        if (appUser) {
            const targetDashboard = `/dashboard/${appUser.type}`;
            
            if (appUser.type === 'teacher' && !appUser.profile?.id) return;
            
            if (appUser.type === 'student' && appUser.data.needsPasswordChange === true) {
                 const settingsEvent = new CustomEvent('open-student-settings');
                 window.dispatchEvent(settingsEvent);
            }

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
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signInStudent = async (classCode: string, schoolNumber: string, password: string) => {
        if (!auth || !db) throw new Error("Kimlik doğrulama başlatılamadı.");

        const classCodeRef = doc(db, 'classCodes', classCode.toUpperCase());
        const classCodeSnap = await getDoc(classCodeRef);
        if(!classCodeSnap.exists()) {
            throw { code: 'class-not-found' };
        }
        const { classId } = classCodeSnap.data();
        
        const q = query(collection(db, 'students'), where('classId', '==', classId), where('number', '==', schoolNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw { code: 'student-not-found' };
        }

        const studentDoc = querySnapshot.docs[0];
        const studentData = {id: studentDoc.id, ...studentDoc.data()} as Student;
        const studentEmail = `${studentData.id}@kampus.app`;

        try {
            if (studentData.authUid) {
                await signInWithEmailAndPassword(auth, studentEmail, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, password);
                const user = userCredential.user;
                await updateDoc(studentDoc.ref, { authUid: user.uid, needsPasswordChange: true });
                toast({ title: 'Hesabınız oluşturuldu!', description: 'Güvenliğiniz için lütfen şifrenizi güncelleyin.'});
            }
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
                throw { code: 'auth/wrong-password' };
            }
            throw error;
        }
    };

  const contextValue = useMemo(() => ({ 
      appUser, 
      loading, 
      signInTeacher,
      signInStudent,
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
