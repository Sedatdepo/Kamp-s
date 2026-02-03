
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { RosterItem } from '@/lib/types';
import { useParams } from 'next/navigation';

interface PublicRosterData {
    className: string;
    dutyRoster: RosterItem[];
}

const PublicDutyRoster = ({ data }: { data: PublicRosterData }) => {
    const { className, dutyRoster } = data;

    if (!dutyRoster || dutyRoster.length === 0) {
        return <div className="text-center p-8">Bu sınıf için yayınlanmış bir nöbet listesi bulunmuyor.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{className} SINIFI NÖBETÇİ ÖĞRENCİ LİSTESİ</h1>
            </div>
            
            <table className="w-full border-collapse text-left text-sm mb-12">
                <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="p-3 font-bold border border-gray-300 w-1/4">Tarih</th>
                        <th className="p-3 font-bold border border-gray-300 w-1/4">Gün</th>
                        <th className="p-3 font-bold border border-gray-300 w-1/2">Nöbetçi Öğrenciler</th>
                    </tr>
                </thead>
                <tbody>
                    {dutyRoster.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="p-3 border border-gray-300">{item.date}</td>
                            <td className={`p-3 border border-gray-300 font-medium ${item.day === 'Pazartesi' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {item.day}
                            </td>
                            <td className="p-3 border border-gray-300 font-bold text-gray-800">
                                {item.student}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PublicDutyRosterPage() {
    const params = useParams();
    const classCode = params.classCode as string;
    const { firestore } = useFirebase();
    const [rosterData, setRosterData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoster = async () => {
            if (!firestore || !classCode) return;
            setLoading(true);

            try {
                const classCodeRef = doc(firestore, 'classCodes', classCode);
                const classCodeSnap = await getDoc(classCodeRef);

                if (!classCodeSnap.exists()) {
                    setError("Geçersiz veya bulunamayan sınıf kodu.");
                    setLoading(false);
                    return;
                }
                
                const classDocData = classCodeSnap.data();
                
                const publicViewRef = doc(firestore, 'publicViews', classDocData.classId);
                const docSnap = await getDoc(publicViewRef);

                if (docSnap.exists() && docSnap.data().dutyRoster) {
                    setRosterData(docSnap.data());
                } else {
                    setError("Bu nöbet listesi yayınlanmamış veya bulunamadı.");
                }
            } catch (e) {
                console.error(e);
                setError("Veri alınırken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoster();
    }, [firestore, classCode]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-semibold p-8 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            {rosterData ? <PublicDutyRoster data={rosterData} /> : <div className="text-center">Nöbet listesi verisi bulunamadı.</div>}
        </div>
    );
}
