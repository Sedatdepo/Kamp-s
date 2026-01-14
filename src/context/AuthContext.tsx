
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
  | { type: 'teacher'; data: User; profile: TeacherProfile }
  | { type: 'student'; data: Student };

interface AuthContextType {
  appUser: AppUser | null;
  loading: boolean;
  signInStudent: (classCode: string, studentNumber: string) => Promise<boolean>;
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
  const teacherUnsubscribeRef = React.useRef<Unsubscribe | null>(null);

  const signOut = useCallback(async () => {
    // Unsubscribe from any active listener
    if (studentUnsubscribeRef.current) {
        studentUnsubscribeRef.current();
        studentUnsubscribeRef.current = null;
    }
     if (teacherUnsubscribeRef.current) {
        teacherUnsubscribeRef.current();
        teacherUnsubscribeRef.current = null;
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
      
      // Clean up previous listeners
      if (studentUnsubscribeRef.current) studentUnsubscribeRef.current();
      if (teacherUnsubscribeRef.current) teacherUnsubscribeRef.current();
      studentUnsubscribeRef.current = null;
      teacherUnsubscribeRef.current = null;

      if (firebaseUser) {
        const teacherRef = doc(db, 'teachers', firebaseUser.uid);
        
        // Check if the user is a teacher first
        const teacherSnap = await getDoc(teacherRef);
        
        if (teacherSnap.exists()) {
          // It's a teacher. Seed the database and set up a listener.
          await seedDatabase(db, firebaseUser.uid);
          
          teacherUnsubscribeRef.current = onSnapshot(teacherRef, (docSnap) => {
            if (docSnap.exists()) {
                const profile = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() } as TeacherProfile;
                if (profile.name && profile.schoolName) { // Ensure profile is fully loaded
                    setAppUser({ type: 'teacher', data: firebaseUser, profile });
                }
            } else {
                 signOut(); // Teacher doc deleted, sign out.
            }
          });

        } else {
            // Not a teacher, check if it's a student with authUid
            const studentQuery = query(collection(db, 'students'), where('authUid', '==', firebaseUser.uid));
            const studentSnapshot = await getDocs(studentQuery);

            if (!studentSnapshot.empty) {
                const studentDoc = studentSnapshot.docs[0];
                
                studentUnsubscribeRef.current = onSnapshot(doc(db, 'students', studentDoc.id), (docSnap) => {
                    if (docSnap.exists()) {
                        const studentData = { id: docSnap.id, ...docSnap.data() } as Student;
                        const userPayload = { type: 'student' as 'student', data: studentData };
                        setAppUser(userPayload);
                        localStorage.setItem('appUser', JSON.stringify(userPayload));
                    } else {
                        signOut(); // Student doc deleted, sign out.
                    }
                });
            } else {
                // Not a recognized teacher or student, sign out.
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
        if (studentUnsubscribeRef.current) studentUnsubscribeRef.current();
        if (teacherUnsubscribeRef.current) teacherUnsubscribeRef.current();
    };
  }, [auth, db, signOut]);

    useEffect(() => {
        if (loading) return;

        const isPublic = publicRoutes.includes(pathname);
        const isAuthRoute = pathname.startsWith('/dashboard');

        if (appUser) {
            const targetDashboard = `/dashboard/${appUser.type}`;
            if (appUser.type === 'teacher' && !appUser.profile?.id) {
                // Teacher profile is still loading, don't redirect yet
                return;
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
        // onAuthStateChanged will handle the rest
    };

    const signInStudent = async (classCode: string, studentNumber: string): Promise<boolean> => {
        if (!db || !auth) throw new Error("Veritabanı veya kimlik doğrulama başlatılamadı.");
        
        console.log(`Checking class code: ${classCode}`);
        const classCodeRef = doc(db, 'classCodes', classCode);
        const classCodeSnap = await getDoc(classCodeRef);

        if (!classCodeSnap.exists()) {
            throw new Error("Sınıf kodu bulunamadı.");
        }
        
        const classId = classCodeSnap.data().classId;
        console.log(`Class ID found: ${classId}`);

        const q = query(collection(db, "students"), where("classId", "==", classId), where("number", "==", studentNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("No student found with that number in this class.");
            throw new Error("Sınıf kodu veya öğrenci numarası hatalı.");
        }

        const studentDoc = querySnapshot.docs[0];
        const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
        
        const studentEmail = `s${studentData.number}@${studentData.classId.toLowerCase()}.ito-kampus.com`;
        const password = `${studentData.number}-ito`;

        try {
            await signInWithEmailAndPassword(auth, studentEmail, password);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, password);
                    await updateDoc(doc(db, 'students', studentData.id), { authUid: userCredential.user.uid });
                } catch (creationError: any) {
                    console.error("Student account creation failed:", creationError);
                    if (creationError.code === 'auth/weak-password') {
                        throw new Error("Şifre çok zayıf. Lütfen daha karmaşık bir öğrenci numarası/şifre sistemi kullanın.");
                    }
                    throw new Error("Öğrenci hesabı oluşturulurken bir hata oluştu.");
                }
            } else if (error.code === 'auth/wrong-password') {
                 throw new Error('Okul numaranız şifrenizdir. Eğer daha önce değiştirdiyseniz lütfen doğru şifreyi girin veya şifre sıfırlama isteyin.');
            } else {
                console.error("Student sign-in error:", error);
                throw new Error("Giriş yapılırken beklenmedik bir hata oluştu.");
            }
        }
        
        return true;
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
