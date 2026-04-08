
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, onSnapshot, query, collection, where, updateDoc } from 'firebase/firestore';
import { Student, Class } from '@/lib/types';
import { Loader2, ChevronDown, Activity, ArrowLeft } from 'lucide-react';
import { unitsData } from '@/components/dashboard/teacher/ActivityTrackingTab';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';

export default function StudentActivityTrackingPage() {
    const params = useParams();
    const router = useRouter();
    const classCode = params.classCode as string;
    const { firestore: db, isUserLoading } = useFirebase();
    const { toast } = useToast();

    const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
    const [activeTab, setActiveTab] = useState(unitsData[0].id);

    useEffect(() => {
        const authData = localStorage.getItem('student_portal_auth');
        if (authData) {
            try {
                const { student: storedStudent } = JSON.parse(authData);
                setLoggedInStudent(storedStudent);
            } catch (e) {
                console.error("Failed to parse student auth data", e);
                router.replace(`/giris/${classCode}`);
            }
        } else {
            router.replace(`/giris/${classCode}`);
        }
    }, [classCode, router]);

    // Live student listener to get updates to activityChecks
    useEffect(() => {
        if (!db || !loggedInStudent?.id) return;
        const studentRef = doc(db, 'students', loggedInStudent.id);
        const unsub = onSnapshot(studentRef, (docSnap) => {
            if (docSnap.exists()) {
                setLoggedInStudent({ id: docSnap.id, ...docSnap.data() } as Student);
            }
        });
        return () => unsub();
    }, [db, loggedInStudent?.id]);

    const classDocRef = useMemoFirebase(() => (loggedInStudent ? doc(db, 'classes', loggedInStudent.classId) : null), [db, loggedInStudent?.classId]);
    const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classDocRef);

    const studentsQuery = useMemoFirebase(() => (loggedInStudent ? query(collection(db, 'students'), where('classId', '==', loggedInStudent.classId)) : null), [db, loggedInStudent?.classId]);
    const { data: allStudents, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
    
    const handleStudentToggleCheck = async (unitId: string, colIdx: number) => {
        if (!db || !loggedInStudent || !currentClass?.canStudentEditActivityTracking) {
            if(currentClass && !currentClass.canStudentEditActivityTracking) {
                toast({ title: "Düzenleme İzni Yok", description: "Öğretmeniniz bu alanı düzenlemenize izin vermemiş.", variant: "destructive"});
            }
            return;
        }
        const key = `${unitId}_${colIdx}`;
        const studentRef = doc(db, 'students', loggedInStudent.id);
        const newChecks = { ...(loggedInStudent.activityChecks || {}) };
        newChecks[key] = !newChecks[key];
        
        try {
            await updateDoc(studentRef, { activityChecks: newChecks });
        } catch (error) {
            toast({ title: "Hata", description: "Güncelleme yapılamadı.", variant: "destructive" });
        }
    };

    const activeUnit = unitsData.find(u => u.id === activeTab) || unitsData[0];
    const classStudents = useMemo(() => (allStudents || []).sort((a,b) => a.number.localeCompare(b.number, 'tr', { numeric: true })), [allStudents]);

    const loading = isUserLoading || classLoading || studentsLoading || !loggedInStudent;

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-900"><Loader2 className="h-8 w-8 animate-spin text-cyan-500" /></div>;
    }

    if (!currentClass?.isActivityTrackingPublished) {
        return (
             <div className="flex h-screen items-center justify-center text-center p-4 bg-slate-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
                    <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Etkinlik Takibi Henüz Yayınlanmadı</h1>
                    <p className="text-slate-500 mb-6">Öğretmeniniz bu sayfayı henüz öğrencilerle paylaşmadı.</p>
                    <Button onClick={() => router.back()} variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header studentMode={true} studentData={loggedInStudent} />
            <main className="flex-1 p-4 sm:p-8 w-full">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Etkinlik Takip Çizelgesi</h1>
                            <p className="text-slate-500">{currentClass.name} • Öğrenci Takip Paneli</p>
                        </div>
                        <Button onClick={() => router.back()} variant="outline" size="sm" className="bg-white">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Panele Dön
                        </Button>
                    </div>

                    <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                        <label htmlFor="unit-select" className="font-semibold text-indigo-900 flex items-center gap-2 whitespace-nowrap">
                            <Activity className="w-5 h-5 text-indigo-600" /> Ünite Seçimi:
                        </label>
                        <div className="relative w-full sm:w-auto flex-1">
                            <select id="unit-select" value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="w-full appearance-none p-3 pl-4 pr-10 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 font-medium cursor-pointer">
                                {unitsData.map(unit => <option key={unit.id} value={unit.id}>{unit.grade} - {unit.title}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-indigo-50 p-4 border-b border-gray-200">
                            <h2 className="font-bold text-indigo-900 text-center mb-2">{activeUnit.header}</h2>
                            <p className="text-xs text-center text-indigo-600">{activeUnit.outcomes}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse min-w-max">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-3 border-r w-12 text-center font-semibold text-gray-600">SIRA</th>
                                        <th className="p-3 border-r w-64 font-semibold text-gray-600">ÖĞRENCİ ADI SOYADI</th>
                                        {activeUnit.columns.map((col, colIdx) => (
                                            <th key={colIdx} className="border-r p-2 align-bottom h-48 w-12 bg-gray-50">
                                                <div className="writing-vertical text-xs font-medium text-gray-600 tracking-wider flex items-center justify-start space-x-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                                    <span>{col}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map((student, index) => {
                                        const isCurrentUser = student.id === loggedInStudent.id;
                                        return (
                                            <tr key={student.id} className={`border-b border-gray-100 transition ${isCurrentUser ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-indigo-50/30'}`}>
                                                <td className="p-2 border-r text-center text-gray-500 font-medium">{index + 1}</td>
                                                <td className="p-3 border-r font-medium">
                                                    {student.name}
                                                    {isCurrentUser && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">SİZ</span>}
                                                </td>
                                                {activeUnit.columns.map((_, colIdx) => {
                                                    const activityKey = `${activeUnit.id}_${colIdx}`;
                                                    const isChecked = student.activityChecks?.[activityKey] || false;
                                                    return (
                                                        <td 
                                                            key={`${student.id}-${colIdx}`} 
                                                            className={`p-0 border-r text-center transition-colors ${isCurrentUser && currentClass.canStudentEditActivityTracking ? 'cursor-pointer hover:bg-indigo-100' : 'cursor-default'}`} 
                                                            onClick={() => isCurrentUser && handleStudentToggleCheck(activeUnit.id, colIdx)}
                                                        >
                                                            <div className="flex items-center justify-center w-full h-12">
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-500 border-indigo-500 scale-110 shadow-sm' : 'bg-white border-gray-300'}`}>
                                                                    {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {currentClass.canStudentEditActivityTracking && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                            <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800">Düzenleme Modu Aktif</p>
                                <p className="text-xs text-blue-600">Kendi isminizin hizasındaki kutucuklara tıklayarak tamamladığınız etkinlikleri işaretleyebilirsiniz.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
