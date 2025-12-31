"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Candidate, Student } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Vote, CheckCircle, Crown, UserCheck, Building, ShieldCheck as HonorIcon } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

export function ElectionVoteTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const studentId = appUser.data.id;
  const classId = appUser.data.classId;

  const classQuery = useMemo(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, loading: classLoading } = useFirestore<Class>(`class-${classId}`, classQuery);
  const studentsQuery = useMemo(() => (classId && db ? doc(db, 'students', classId) : null), [classId, db]);
  const { data: students } = useFirestore<Student[]>(`class-election-students-${classId}`, classQuery);

  const hasVoted = useMemo(() => {
    return currentClass?.election?.votedStudentIds.includes(studentId) ?? false;
  }, [currentClass, studentId]);
  
  const electionData = useMemo(() => currentClass?.election || {
      type: 'class_president',
      candidates: [],
      votedStudentIds: [],
  }, [currentClass]);

  const sortedCandidates = useMemo(() => {
    if (!electionData.candidates) return [];
    return [...electionData.candidates].sort((a, b) => b.votes - a.votes);
  }, [electionData.candidates]);

  const electionType = electionData.type;
  
  const electionInfo = useMemo(() => {
    const infoMap = {
        class_president: {
            title: `SINIF BAŞKANI VE BAŞKAN YARDIMCISI SEÇİMİ`,
            winnerLabel: 'Sınıf Başkanı',
            runnerUpLabel: 'Sınıf Başkan Yardımcısı',
        },
        school_representative: {
            title: `SINIF TEMSİLCİSİ SEÇİMİ`,
            winnerLabel: 'Sınıf Temsilcisi',
            runnerUpLabel: null,
        },
        honor_board: {
            title: `ONUR KURULU TEMSİLCİSİ SEÇİMİ`,
            winnerLabel: 'Onur Kurulu Temsilcisi',
            runnerUpLabel: null,
        }
    };
    return infoMap[electionType];
  }, [electionType]);

  const winner = sortedCandidates[0] || null;
  const runnerUp = electionType === 'class_president' && sortedCandidates.length > 1 ? sortedCandidates[1] : null;

  const handleVote = async (candidateId: string) => {
    if (!currentClass || !currentClass.election || !db) return;
    if (hasVoted) {
        toast({ title: 'Zaten oy kullandınız.', variant: 'destructive'});
        return;
    }

    const newCandidates = currentClass.election.candidates.map(c => 
        c.id === candidateId ? { ...c, votes: c.votes + 1 } : c
    );
    const newVotedStudentIds = [...currentClass.election.votedStudentIds, studentId];

    const classRef = doc(db, 'classes', currentClass.id);
    await updateDoc(classRef, {
        'election.candidates': newCandidates,
        'election.votedStudentIds': newVotedStudentIds
    });

    toast({ title: 'Oyunuz başarıyla kaydedildi!', description: 'Katılımınız için teşekkürler.' });
  }

  if (classLoading) {
    return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  if (!currentClass?.isElectionActive) {
     if (winner) {
        return (
            <Card>
             <CardHeader>
                <div>
                    <CardTitle>Seçim Sonuçları</CardTitle>
                    <CardDescription>{electionInfo.title} sonuçları aşağıdadır.</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                    {electionType === 'class_president' && winner && (
                        <>
                            <Card className="bg-green-100 dark:bg-green-900/50 border-green-500">
                                <CardHeader>
                                    <Crown className="mx-auto text-yellow-500 w-10 h-10"/>
                                    <CardTitle>{electionInfo.winnerLabel}</CardTitle>
                                    <CardDescription>{winner.name}</CardDescription>
                                    <p className="font-bold text-2xl">{winner.votes} Oy</p>
                                </CardHeader>
                            </Card>
                            {runnerUp && (
                                <Card className="bg-blue-100 dark:bg-blue-900/50 border-blue-500">
                                    <CardHeader>
                                        <UserCheck className="mx-auto text-blue-500 w-10 h-10"/>
                                        <CardTitle>{electionInfo.runnerUpLabel}</CardTitle>
                                        <CardDescription>{runnerUp.name}</CardDescription>
                                        <p className="font-bold text-2xl">{runnerUp.votes} Oy</p>
                                    </CardHeader>
                                </Card>
                            )}
                        </>
                    )}
                     {electionType === 'school_representative' && winner && (
                        <Card className="bg-purple-100 dark:bg-purple-900/50 border-purple-500 col-span-full max-w-sm mx-auto">
                            <CardHeader>
                                <Building className="mx-auto text-purple-500 w-10 h-10"/>
                                <CardTitle>{electionInfo.winnerLabel}</CardTitle>
                                <CardDescription>{winner.name}</CardDescription>
                                <p className="font-bold text-2xl">{winner.votes} Oy</p>
                            </CardHeader>
                        </Card>
                    )}
                    {electionType === 'honor_board' && winner && (
                        <Card className="bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 col-span-full max-w-sm mx-auto">
                            <CardHeader>
                                <HonorIcon className="mx-auto text-indigo-500 w-10 h-10"/>
                                <CardTitle>{electionInfo.winnerLabel}</CardTitle>
                                <CardDescription>{winner.name}</CardDescription>
                                <p className="font-bold text-2xl">{winner.votes} Oy</p>
                            </CardHeader>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tüm Adaylar ve Oy Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground mb-4">Toplam kullanılan oy: {electionData.votedStudentIds.length} / {students?.length || electionData.votedStudentIds.length}</p>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Adı Soyadı</TableHead>
                                <TableHead className="text-right">Aldığı Oy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCandidates.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.name}</TableCell>
                                        <TableCell className="text-right font-bold">{c.votes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             </CardContent>
           </Card>
        )
     }
     return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Sınıf Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Şu anda aktif bir seçim bulunmuyor veya seçim sonuçları henüz açıklanmadı.</p>
                </div>
            </CardContent>
        </Card>
     );
  }
  
  if (hasVoted) {
      return (
        <Card className="bg-green-50 dark:bg-green-900/30 border-green-500">
            <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4"/>
                <CardTitle className="font-headline text-2xl text-green-700">Oy kullandığınız için teşekkürler!</CardTitle>
                <CardDescription className="text-green-600">Seçim sonuçları oylama bitince bu ekranda açıklanacaktır.</CardDescription>
            </CardHeader>
        </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Vote className="h-6 w-6" />
            Sınıf Seçimi Oylaması
        </CardTitle>
        <CardDescription>
          Aşağıdaki adaylardan birini seçerek oyunu kullan. Unutma, sadece bir kez oy kullanabilirsin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentClass?.election?.candidates.map((candidate: Candidate) => (
            <Button
                key={candidate.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center justify-center gap-3"
                onClick={() => handleVote(candidate.id)}
            >
                <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-3xl">{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <span className="text-lg font-semibold">{candidate.name}</span>
            </Button>
        ))}
        {(!currentClass?.election?.candidates || currentClass.election.candidates.length === 0) && (
            <p className="text-muted-foreground col-span-full text-center">Henüz aday belirlenmemiş.</p>
        )}
      </CardContent>
    </Card>
  );
}
