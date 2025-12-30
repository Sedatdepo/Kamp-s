
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
import { Loader2 } from 'lucide-react';

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
  createStudentAuthAccount: (student: Student, newPassword: string) => Promise<string>;
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

  useEffect(() => {
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
            const q = query(collection(db, "students"), where("authUid", "==", user.uid));
            const studentSnapshot = await getDocs(q);
            if (!studentSnapshot.empty) {
                const studentDoc = studentSnapshot.docs[0];
                const studentData = { id: studentDoc.id, ...studentDoc.data() } as Student;
                const localUser: AppUser = { type: 'student', data: studentData };
                setAppUser(localUser);
            } else {
                 localStorage.removeItem('appUser');
                 setAppUser(null);
            }
        }
      } else {
         const localUserData = localStorage.getItem('appUser');
         if (localUserData) {
            setAppUser(JSON.parse(localUserData));
         } else {
            setAppUser(null);
         }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);
  

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


  const signInStudent = async (classCode: string, studentNumber: string, loginPassword?: string) => {
    if (!db || !auth) throw new Error("Veritabanı veya kimlik doğrulama başlatılamadı.");
    if (!loginPassword) throw new Error("Şifre girilmelidir.");

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

        if (studentData.password !== loginPassword) {
            throw new Error('Geçici şifre hatalı.');
        }

        if (studentData.needsPasswordChange) {
             const user: AppUser = { type: 'student', data: studentData };
             localStorage.setItem('appUser', JSON.stringify(user));
             setAppUser(user);
             router.push('/auth/change-password');
             return;
        }

        if (!studentData.authUid) {
             // This case should ideally not happen if student creation is robust.
             // But as a fallback, we can try to create the auth user now.
             const studentEmail = `${studentNumber}@${classCode.toLowerCase()}.ito-kampus.local`;
             try {
                const cred = await createUserWithEmailAndPassword(auth, studentEmail, loginPassword);
                await updateDoc(studentDoc.ref, { authUid: cred.user.uid });
             } catch(e) {
                // If user already exists, sign them in to get authUid if it's missing in DB
                 if ((e as any).code === 'auth/email-already-exists') {
                    const cred = await signInWithEmailAndPassword(auth, studentEmail, loginPassword);
                    await updateDoc(studentDoc.ref, { authUid: cred.user.uid });
                 } else {
                     throw e;
                 }
             }
        }
        
        const studentEmail = `${studentNumber}@${classCode.toLowerCase()}.ito-kampus.local`;
        await signInWithEmailAndPassword(auth, studentEmail, loginPassword);
        
        // onAuthStateChanged will handle setting the appUser

    } catch (error: any) {
        console.error("Öğrenci girişi hatası:", error);
        localStorage.removeItem('appUser');
        setAppUser(null);
        if (auth.currentUser) await firebaseSignOut(auth);
        throw error;
    } finally {
        setLoading(false);
    }
  };

  const createStudentAuthAccount = async (student: Student, newPassword: string): Promise<string> => {
     if (!auth || !db) {
        throw new Error("Kimlik doğrulama veya veritabanı başlatılamadı.");
     }
     if (!student.classId) {
        throw new Error("Öğrenciye ait sınıf bilgisi bulunamadı.");
     }
     
     const classDoc = await getDoc(doc(db, "classes", student.classId));
     if (!classDoc.exists()) {
        throw new Error("Sınıf bulunamadı.");
     }
     const classCode = classDoc.data().code;

     const studentEmail = `${student.number}@${classCode.toLowerCase()}.ito-kampus.local`;

     try {
        const userCredential = await createUserWithEmailAndPassword(auth, studentEmail, newPassword);
        const authUid = userCredential.user.uid;
        return authUid;
     } catch(error: any) {
        if (error.code === 'auth/email-already-in-use') {
            // This can happen if the process was interrupted before.
            // We can try to sign in to verify password and get the UID.
            try {
                const userCredential = await signInWithEmailAndPassword(auth, studentEmail, newPassword);
                return userCredential.user.uid;
            } catch (signInError) {
                console.error("Existing user sign-in failed:", signInError);
                throw new Error("Bu hesap zaten mevcut ve şifre yanlış. Lütfen öğretmeninizle iletişime geçin.");
            }
        }
        console.error("Firebase hesabı oluşturma hatası:", error);
        throw new Error("Firebase kimlik doğrulama hesabı oluşturulamadı.");
     }
  }
  
  const getStudentAuthUser = async (): Promise<User | null> => {
      // This function might be deprecated if the main auth flow is solid
      return auth?.currentUser || null;
  };


  return (
    <AuthContext.Provider value={{ appUser, loading, signInStudent, signOut, createStudentAuthAccount, getStudentAuthUser, auth, db, storage }}>
      {children}
    </AuthContext.Provider>
  );
}
