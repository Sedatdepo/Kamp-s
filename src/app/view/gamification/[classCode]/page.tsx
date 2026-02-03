
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2, Trophy, Star } from 'lucide-react';
import { Student } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';

interface PublicGamificationData {
    className: string;
    gamification: {
        students: Student[];
    }
}

const AVAILABLE_BADGES = [
  { id: '1', name: 'Katılım Ustası', icon: '⭐', description: 'İstikrarlı derse katılım.', cost: 50 },
  { id: '2', name: 'Ödev Canavarı', icon: '⚡', description: 'Ödevlerini eksiksiz yapar.', cost: 60 },
  { id: '3', name: 'Sınıf Lideri', icon: '👑', description: 'Liderlik vasıfları gösterir.', cost: 100 },
  { id: '4', name: 'Yardımsever', icon: '🛡️', description: 'Arkadaşlarına yardım eder.', cost: 40 },
  { id: '5', name: 'Mükemmel Puan', icon: '🌟', description: 'Sınavlarda üstün başarı.', cost: 80 },
  { id: '6', name: 'Proje Uzmanı', icon: '🚀', description: 'Projeleri başarıyla tamamlar.', cost: 70 },
  { id: '7', name: 'Kitap Kurdu', icon: '📚', description: 'Çok kitap okur.', cost: 30 },
  { id: '8', name: 'Temizlik Elçisi', icon: '♻️', description: 'Çevresini temiz tutar.', cost: 20 },
];


const PublicGamificationView = ({ data }: { data: PublicGamificationData }) => {
    const { className, gamification } = data;
    if (!gamification || !gamification.students) {
        return <div className="text-center">Bu sınıf için oyunlaştırma verisi yayınlanmamış.</div>;
    }

    const sortedStudents = useMemo(() => {
        return [...gamification.students].sort((a, b) => (b.behaviorScore || 0) - (a.behaviorScore || 0));
    }, [gamification.students]);
    
    const topThree = sortedStudents.slice(0, 3);
    const rest = sortedStudents.slice(3);

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-10">
                <Trophy className="mx-auto h-12 w-12 text-yellow-500 mb-4"/>
                <h1 className="text-3xl font-bold text-gray-800">{className} Sınıfı Kahramanları</h1>
                <p className="text-muted-foreground">Puan durumu ve kazanılan rozetler.</p>
            </div>

            <div className="flex justify-center items-end gap-4 mb-12">
                {topThree[1] && (
                    <div className="text-center p-4 rounded-lg bg-gray-100 w-1/4">
                        <p className="text-4xl">🥈</p>
                        <p className="font-bold">{topThree[1].name}</p>
                        <p className="text-lg font-semibold text-gray-600">{topThree[1].behaviorScore} Puan</p>
                    </div>
                )}
                 {topThree[0] && (
                    <div className="text-center p-6 rounded-t-lg bg-yellow-100 border-b-4 border-yellow-400 w-1/3">
                        <p className="text-5xl">🥇</p>
                        <p className="text-xl font-bold">{topThree[0].name}</p>
                        <p className="text-2xl font-bold text-yellow-600">{topThree[0].behaviorScore} Puan</p>
                    </div>
                )}
                 {topThree[2] && (
                    <div className="text-center p-4 rounded-lg bg-orange-100 w-1/4">
                        <p className="text-4xl">🥉</p>
                        <p className="font-bold">{topThree[2].name}</p>
                        <p className="text-lg font-semibold text-orange-700">{topThree[2].behaviorScore} Puan</p>
                    </div>
                )}
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Sıra</TableHead>
                        <TableHead>Öğrenci</TableHead>
                        <TableHead>Rozetler</TableHead>
                        <TableHead className="text-right">Puan</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rest.map((student, index) => (
                         <TableRow key={student.id}>
                            <TableCell className="font-bold">{index + 4}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell className="flex gap-1 flex-wrap">
                                {student.badges?.map(badgeId => (
                                    <span key={badgeId} className="text-lg" title={AVAILABLE_BADGES.find(b => b.id === badgeId)?.name}>
                                    {AVAILABLE_BADGES.find(b => b.id === badgeId)?.icon || '🏅'}
                                    </span>
                                ))}
                            </TableCell>
                            <TableCell className="text-right font-semibold"><Badge variant="secondary">{student.behaviorScore}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function PublicGamificationPage() {
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

                if (docSnap.exists() && docSnap.data().gamification) {
                    setData(docSnap.data());
                } else {
                    setError("Bu sınıf için oyunlaştırma verileri yayınlanmamış.");
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
            {data ? <PublicGamificationView data={data} /> : <div className="text-center">Veri bulunamadı.</div>}
        </div>
    );
}
