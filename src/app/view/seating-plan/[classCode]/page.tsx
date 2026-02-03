
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Student } from '@/lib/types';

interface PublicPlanData {
    className: string;
    seatingPlan: {
        rowCount: number;
        colCount: number;
        plan: { [key: string]: string };
        students: { id: string; name: string; number: string }[];
    }
}

const PublicSeatingPlan = ({ planData }: { planData: PublicPlanData }) => {
    const { className, seatingPlan } = planData;
    if (!seatingPlan) return <div className="text-center">Bu sınıf için oturma planı yayınlanmamış.</div>;

    const { rowCount, colCount, plan, students } = seatingPlan;

    return (
        <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-xl shadow-lg">
            <div className="text-center mb-10">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{className} Sınıfı Oturma Planı</h1>
            </div>
             <div className="flex flex-col">
                <div className="w-full bg-slate-800 text-white text-center py-3 rounded-lg mb-8 shadow-md">
                    <span className="font-bold tracking-widest text-lg">TAHTA</span>
                </div>
                <div className="flex-1 flex justify-center items-start overflow-x-auto p-4">
                    <div className="grid gap-2 sm:gap-4 mx-auto" style={{ gridTemplateColumns: `repeat(${colCount}, minmax(140px, 1fr))` }}>
                        {Array.from({ length: rowCount }).map((_, r) =>
                            Array.from({ length: colCount }).map((_, c) => (
                                <div key={`${r}-${c}`} className="relative bg-amber-100/70 rounded-lg border-2 border-amber-200 p-1 flex gap-1 shadow-inner aspect-[2/1]">
                                    {[0, 1].map((side) => {
                                        const key = `${r}-${c}-${side}`;
                                        const studentId = plan[key];
                                        const student = students.find(s => s.id === studentId);
                                        return (
                                            <div key={key} className="flex-1 bg-white rounded-md flex items-center justify-center text-center p-1 text-xs font-semibold shadow-sm">
                                                {student ? `${student.name} (${student.number})` : 'Boş'}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function PublicSeatingPlanPage({ params }: { params: { classCode: string } }) {
    const { firestore } = useFirebase();
    const [planData, setPlanData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            if (!firestore) {
                // This can happen on initial render before firebase is initialized
                return;
            }
            setLoading(true);
            try {
                const classCodesCol = collection(firestore, 'classCodes');
                const q = query(classCodesCol, where('code', '==', params.classCode));
                const classCodeSnap = await getDocs(q);

                if (classCodeSnap.empty) {
                    setError("Geçersiz veya bulunamayan sınıf kodu.");
                    setLoading(false);
                    return;
                }

                const classId = classCodeSnap.docs[0].id; // The document ID is the class code
                const classDoc = classCodeSnap.docs[0].data();
                
                // Now use the classId from the document data to get the public view
                const publicViewRef = doc(firestore, 'publicViews', classDoc.classId);
                const docSnap = await getDoc(publicViewRef);

                if (docSnap.exists() && docSnap.data().seatingPlan) {
                    setPlanData(docSnap.data());
                } else {
                    setError("Bu oturma planı yayınlanmamış veya bulunamadı.");
                }
            } catch (e) {
                console.error(e);
                setError("Veri alınırken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [firestore, params.classCode]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-semibold p-8 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            {planData ? <PublicSeatingPlan planData={planData} /> : <div className="text-center">Plan verisi bulunamadı.</div>}
        </div>
    );
}
