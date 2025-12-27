
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Vote,
  Crown,
  UserCheck,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck as HonorIcon,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student, Candidate, ElectionType, Class } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from '@/components/ui/label';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Switch } from '@/components/ui/switch';

type Stage = 'setup' | 'voting' | 'results';

interface ElectionTabProps {
  students: Student[];
  currentClass: Class | null;
}

export function ElectionTab({ students, currentClass }: ElectionTabProps) {
  const electionData = useMemo(() => currentClass?.election || {
      type: 'class_president',
      candidates: [],
      votedStudentIds: [],
  }, [currentClass]);

  const [stage, setStage] = useState<Stage>('setup');
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [showNextButton, setShowNextButton] = useState(false);

  const { toast } = useToast();

  const voters = useMemo(() => students.filter(s => !electionData.votedStudentIds.includes(s.id)), [students, electionData.votedStudentIds]);
  const votedStudents = useMemo(() => new Set(electionData.votedStudentIds), [electionData.votedStudentIds]);

  const updateElection = async (updates: Partial<Class['election']>) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', currentClass.id);
    await updateDoc(classRef, {
      election: {
        ...electionData,
        ...updates
      }
    });
  };
  
  const handleToggleActive = async (checked: boolean) => {
    if (!currentClass) return;
    const classRef = doc(db, 'classes', currentClass.id);
    try {
        await updateDoc(classRef, { isElectionActive: checked });
        toast({
            title: 'Başarılı',
            description: `Seçim oylaması öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
        });
    } catch {
        toast({
            variant: 'destructive',
            title: 'Hata',
            description: 'Güncelleme sırasında bir sorun oluştu.',
        });
    }
  };

  const toggleCandidate = (studentId: string) => {
    const isCandidate = electionData.candidates.some(c => c.id === studentId);
    let newCandidates;
    if (isCandidate) {
        newCandidates = electionData.candidates.filter(c => c.id !== studentId);
    } else {
        const student = students.find(s => s.id === studentId);
        if (student) {
            newCandidates = [...electionData.candidates, { ...student, votes: 0 }];
        } else {
            newCandidates = electionData.candidates;
        }
    }
    updateElection({ candidates: newCandidates });
  };

  const startVoting = () => {
    if (electionData.candidates.length < 2) {
      toast({
        title: "Yetersiz Aday",
        description: "Lütfen oylamayı başlatmak için en az 2 aday seçin.",
        variant: "destructive",
      });
      return;
    }
    setCurrentVoterIndex(0);
    setShowNextButton(false);
    setStage('voting');
  };
  
  const handleVote = (candidateId: string, studentId: string) => {
    if (votedStudents.has(studentId)) {
        toast({
            title: "Uyarı",
            description: "Bu öğrenci zaten oy kullandı.",
            variant: "destructive"
        })
        return;
    }
    
    const newCandidates = electionData.candidates.map(c => c.id === candidateId ? { ...c, votes: c.votes + 1 } : c);
    const newVotedStudents = [...electionData.votedStudentIds, studentId];
    updateElection({ candidates: newCandidates, votedStudentIds: newVotedStudents });
    setShowNextButton(true);
  }

  const handleNextVoter = () => {
    if (currentVoterIndex < students.length - 1) {
        setCurrentVoterIndex(prevIndex => prevIndex + 1);
        setShowNextButton(false);
    } else {
        finishVoting();
    }
  };


  const finishVoting = () => {
    setStage('results');
  };

  const sortedCandidates = useMemo(() => {
    return [...electionData.candidates].sort((a, b) => b.votes - a.votes);
  }, [electionData.candidates]);
  
  const electionInfo = useMemo(() => {
    const className = currentClass?.name || '';
    const type = electionData.type;

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
    return infoMap[type];
  }, [electionData.type, currentClass?.name]);

  const electionType = electionData.type;
  const winner = sortedCandidates[0] || null;
  const runnerUp = electionType === 'class_president' && sortedCandidates.length > 1 ? sortedCandidates[1] : null;


  const resetElection = () => {
    if (window.confirm("Bu seçimi ve tüm verilerini sıfırlamak istediğinize emin misiniz?")) {
        updateElection({ candidates: [], votedStudentIds: [] });
        handleToggleActive(false); // Seçimi de pasif yap
        setStage('setup');
        setCurrentVoterIndex(0);
        setShowNextButton(false);
    }
  };

  const currentVoter = students[currentVoterIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Vote className="w-7 h-7 text-primary" />
            Seçim Modülü
        </h2>
        {stage !== 'setup' && (
            <Button onClick={resetElection} variant="destructive">
              <Trash2 className="mr-2"/> Seçimi Sıfırla
            </Button>
        )}
      </div>

      {stage === 'setup' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>1. Adım: Kurulum</CardTitle>
                  <CardDescription>Önce seçim türünü seçin, ardından adayları belirleyin ve oylamayı aktif edin.</CardDescription>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch 
                        id="election-toggle" 
                        checked={currentClass?.isElectionActive || false}
                        onCheckedChange={handleToggleActive}
                        disabled={!currentClass}
                    />
                    <Label htmlFor="election-toggle">Seçim Aktif</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="font-semibold">Seçim Türü</Label>
                    <Tabs 
                        defaultValue={electionType} 
                        onValueChange={(value) => updateElection({ type: value as ElectionType })} 
                        className="w-full mt-2"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="class_president">Sınıf Başkanlığı</TabsTrigger>
                            <TabsTrigger value="school_representative">Sınıf Temsilciliği</TabsTrigger>
                            <TabsTrigger value="honor_board">Onur Kurulu Temsilciliği</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Adayları Seçin</h3>
                   <div className="max-h-64 overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-12">Aday</TableHead>
                                <TableHead>Öğrenci No</TableHead>
                                <TableHead>Adı Soyadı</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                <TableRow key={student.id} onClick={() => toggleCandidate(student.id)} className="cursor-pointer">
                                    <TableCell>
                                      <Checkbox checked={electionData.candidates.some(c => c.id === student.id)} />
                                    </TableCell>
                                    <TableCell>{student.number}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                   </div>
                   <Button onClick={startVoting} className="w-full bg-green-600 hover:bg-green-700">Oylamayı Başlat (Tahta)</Button>
                </div>
            </CardContent>
          </Card>
        )}

        {stage === 'voting' && (
          <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>2. Adım: Oylama (Akıllı Tahta)</CardTitle>
                        <CardDescription>{students.length} öğrenci oy kullanacak. {electionData.votedStudentIds.length} / {students.length} oy kullanıldı.</CardDescription>
                    </div>
                    <Button onClick={finishVoting} size="lg" className="bg-blue-600 hover:bg-blue-700">Oylamayı Bitir</Button>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[50vh]">
                {currentVoter ? (
                    <Card key={currentVoter.id} className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl flex justify-between items-center text-center">
                                {currentVoter.name}
                                {votedStudents.has(currentVoter.id) 
                                    ? <CheckSquare className="text-green-500"/>
                                    : <Square className="text-muted-foreground"/>
                                }
                            </CardTitle>
                            <CardDescription>No: {currentVoter.number}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-lg font-semibold text-center">Lütfen Oyunu Kullan</p>
                            <div className="grid grid-cols-1 gap-2">
                            {electionData.candidates.map(candidate => (
                                <Button 
                                    key={candidate.id}
                                    variant="outline"
                                    size="lg"
                                    className="w-full justify-start text-lg py-6"
                                    onClick={() => handleVote(candidate.id, currentVoter.id)}
                                    disabled={votedStudents.has(currentVoter.id)}
                                >
                                    {candidate.name}
                                </Button>
                            ))}
                            </div>
                            {showNextButton && (
                                <Button onClick={handleNextVoter} className="w-full mt-4" size="lg">
                                    Sıradaki Öğrenci <ArrowRight className="ml-2"/>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div>Tüm öğrenciler oyunu kullandı.</div>
                )}
            </CardContent>
          </Card>
        )}


        {stage === 'results' && winner && (
           <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>3. Adım: Seçim Sonuçları</CardTitle>
                        <CardDescription>{electionInfo.title} sonuçları aşağıdadır.</CardDescription>
                    </div>
                    <Button onClick={() => setStage('voting')} variant="outline">
                         Oylamaya Geri Dön
                    </Button>
                </div>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                    {electionType === 'class_president' && (
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
                     {electionType === 'school_representative' && (
                        <Card className="bg-purple-100 dark:bg-purple-900/50 border-purple-500 col-span-full max-w-sm mx-auto">
                            <CardHeader>
                                <Building className="mx-auto text-purple-500 w-10 h-10"/>
                                <CardTitle>{electionInfo.winnerLabel}</CardTitle>
                                <CardDescription>{winner.name}</CardDescription>
                                <p className="font-bold text-2xl">{winner.votes} Oy</p>
                            </CardHeader>
                        </Card>
                    )}
                    {electionType === 'honor_board' && (
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
                                        <TableCell>{c.name} ({c.number})</TableCell>
                                        <TableCell className="text-right font-bold">{c.votes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

             </CardContent>
           </Card>
        )}
    </div>
  );
};
