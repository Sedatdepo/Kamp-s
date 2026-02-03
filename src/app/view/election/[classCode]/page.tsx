
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Loader2, Trophy, Crown, UserCheck } from 'lucide-react';
import { Election, Candidate } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'next/navigation';

interface PublicElectionData {
    className: string;
    election: {
        type: Election['type'];
        candidates: Candidate[];
    }
}

const electionInfoMap = {
    class_president: { title: 'Sınıf Başkanlığı Seçim Sonuçları', winnerLabel: 'Sınıf Başkanı', runnerUpLabel: 'Başkan Yardımcısı' },
    school_representative: { title: 'Okul Temsilcisi Seçim Sonuçları', winnerLabel: 'Okul Temsilcisi', runnerUpLabel: null },
    honor_board: { title: 'Onur Kurulu Seçim Sonuçları', winnerLabel: 'Onur Kurulu Üyesi', runnerUpLabel: null },
};

const PublicElectionView = ({ data }: { data: PublicElectionData }) => {
    const { className, election } = data;
    if (!election || !election.candidates || election.candidates.length === 0) {
        return <div className="text-center">Bu sınıf için yayınlanmış bir seçim sonucu bulunmuyor.</div>;
    }

    const info = electionInfoMap[election.type];
    const sortedCandidates = useMemo(() => {
        return [...election.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }, [election.candidates]);
    
    const winner = sortedCandidates[0];
    const runnerUp = election.type === 'class_president' && sortedCandidates.length > 1 ? sortedCandidates[1] : null;

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-10">
                <Trophy className="mx-auto h-12 w-12 text-yellow-500 mb-4"/>
                <h1 className="text-3xl font-bold text-gray-800">{className} Sınıfı</h1>
                <p className="text-muted-foreground">{info.title}</p>
            </div>

            <div className="flex justify-center items-end gap-4 mb-12">
                {runnerUp && (
                    <div className="text-center p-4 rounded-lg bg-gray-100 w-1/3">
                        <UserCheck className="mx-auto h-10 w-10 text-gray-500 mb-2"/>
                        <p className="font-bold text-lg">{runnerUp.name}</p>
                        <p className="text-xl font-semibold text-gray-600">{runnerUp.votes} Oy</p>
                        <p className="text-sm font-bold text-gray-500 mt-1">{info.runnerUpLabel}</p>
                    </div>
                )}
                 {winner && (
                    <div className="text-center p-6 rounded-t-lg bg-yellow-100 border-b-4 border-yellow-400 w-1/3 order-first">
                        <Crown className="mx-auto h-12 w-12 text-yellow-600 mb-2"/>
                        <p className="text-xl font-bold">{winner.name}</p>
                        <p className="text-2xl font-bold text-yellow-600">{winner.votes} Oy</p>
                        <p className="text-md font-bold text-yellow-700 mt-1">{info.winnerLabel}</p>
                    </div>
                )}
            </div>
            
            <h3 className="text-lg font-bold text-center mb-4">Tüm Adaylar ve Oy Dağılımı</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-16">Sıra</TableHead>
                        <TableHead>Aday</TableHead>
                        <TableHead className="text-right">Aldığı Oy</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedCandidates.map((candidate, index) => (
                         <TableRow key={candidate.id}>
                            <TableCell className="font-bold">{index + 1}</TableCell>
                            <TableCell>{candidate.name}</TableCell>
                            <TableCell className="text-right font-semibold"><Badge variant="secondary">{candidate.votes}</Badge></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function PublicElectionPage() {
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

                if (docSnap.exists() && docSnap.data().election) {
                    setData(docSnap.data());
                } else {
                    setError("Bu sınıf için seçim sonuçları yayınlanmamış.");
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
            {data ? <PublicElectionView data={data} /> : <div className="text-center">Veri bulunamadı.</div>}
        </div>
    );
}
