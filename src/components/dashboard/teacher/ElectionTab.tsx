
'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Vote,
  Crown,
  UserCheck,
  Trash2,
  Building,
  ShieldCheck as HonorIcon,
  FileText,
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
import { exportElectionResultsToRtf } from '@/lib/word-export';
import { useAuth } from '@/hooks/useAuth';

interface ElectionTabProps {
  students: Student[];
  currentClass: Class | null;
}

export function ElectionTab({ students, currentClass }: ElectionTabProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  const electionData = useMemo(() => currentClass?.election || {
      type: 'class_president',
      candidates: [],
      votedStudentIds: [],
  }, [currentClass]);

  const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;

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
    
    if (checked && electionData.candidates.length < 2) {
        toast({
            title: "Yetersiz Aday",
            description: "Lütfen oylamayı başlatmak için en az 2 aday seçin.",
            variant: "destructive",
        });
        return;
    }

    const classRef = doc(db, 'classes', currentClass.id);
    try {
        await updateDoc(classRef, { isElectionActive: checked });
        toast({
            title: checked ? 'Oylama Başlatıldı' : 'Oylama Sona Erdi',
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

  const sortedCandidates = useMemo(() => {
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


  const resetElection = () => {
    if (window.confirm("Bu seçimi ve tüm verilerini sıfırlamak istediğinize emin misiniz?")) {
        updateElection({ candidates: [], votedStudentIds: [] });
        handleToggleActive(false); // Seçimi de pasif yap
    }
  };

  const handleExport = () => {
    if (!currentClass || !winner) {
        toast({ title: 'Hata', description: 'Tutanak oluşturmak için tamamlanmış bir seçim olmalıdır.', variant: 'destructive' });
        return;
    }
    exportElectionResultsToRtf({
        electionResult: { winner, runnerUp, allCandidates: sortedCandidates },
        electionType,
        currentClass,
        students,
        teacherProfile
    });
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
            <Vote className="w-7 h-7 text-primary" />
            Seçim Modülü
        </h2>
        <Button onClick={resetElection} variant="destructive">
          <Trash2 className="mr-2"/> Seçimi Sıfırla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Seçim Kurulumu ve Yönetimi</CardTitle>
              <CardDescription>Seçim türünü seçin, adayları belirleyin ve oylamayı başlatın.</CardDescription>
            </div>
             <div className="flex items-center space-x-2">
                <Switch 
                    id="election-toggle" 
                    checked={currentClass?.isElectionActive || false}
                    onCheckedChange={handleToggleActive}
                    disabled={!currentClass}
                />
                <Label htmlFor="election-toggle" className="font-semibold">{currentClass?.isElectionActive ? 'Oylama Aktif' : 'Oylama Pasif'}</Label>
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
            </div>
        </CardContent>
      </Card>

        {(!currentClass?.isElectionActive && electionData.votedStudentIds.length > 0) && winner && (
           <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Seçim Sonuçları</CardTitle>
                        <CardDescription>{electionInfo.title} sonuçları aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="outline" onClick={handleExport}>
                        <FileText className="mr-2 h-4 w-4"/>
                        Tutanak Oluştur (.rtf)
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
                         <p className="text-sm text-muted-foreground mb-4">Toplam kullanılan oy: {electionData.votedStudentIds.length} / {students.length}</p>
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
