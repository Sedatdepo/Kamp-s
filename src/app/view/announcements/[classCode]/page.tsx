
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2, Megaphone, Clock, ExternalLink } from 'lucide-react';
import { Announcement } from '@/lib/types';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PublicAnnouncementsData {
    className: string;
    announcements: Announcement[];
}

const PublicAnnouncementsView = ({ data }: { data: PublicAnnouncementsData }) => {
    const { className, announcements } = data;

    if (!announcements || announcements.length === 0) {
        return <div className="text-center p-8">Bu sınıf için yayınlanmış bir duyuru bulunmuyor.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="text-center mb-4 border-b pb-4">
                <Megaphone className="mx-auto h-12 w-12 text-primary mb-2" />
                <h1 className="text-2xl font-bold text-gray-900">{className} SINIFI DUYURU PANOSU</h1>
            </div>
            
            {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-gray-800 mb-2">{ann.text}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(ann.date), 'dd MMMM yyyy', { locale: tr })}</span>
                        </div>
                        {ann.link && (
                            <a href={ann.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                <ExternalLink className="h-3 w-3" />
                                {ann.linkText || 'Detaylar...'}
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function PublicAnnouncementsPage() {
    const params = useParams();
    const classCode = params.classCode as string;
    const { firestore } = useFirebase();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
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

                if (docSnap.exists() && docSnap.data().announcements) {
                    setData(docSnap.data());
                } else {
                    setError("Bu sınıf için duyurular yayınlanmamış veya bulunamadı.");
                }
            } catch (e) {
                console.error(e);
                setError("Veri alınırken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [firestore, classCode]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="flex h-screen items-center justify-center text-red-500 font-semibold p-8 text-center">{error}</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
            {data ? <PublicAnnouncementsView data={data} /> : <div className="text-center">Duyuru verisi bulunamadı.</div>}
        </div>
    );
}
