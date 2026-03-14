

'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Save,
  MoreVertical,
  Share2,
  Trophy,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student, Candidate, ElectionType, Class, TeacherProfile, ElectionDocument } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { exportElectionResultsToRtf } from '@/lib/word-export';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { doc, updateDoc, setDoc, deleteField } from 'firebase/firestore';


interface ElectionTabProps {
  students: Student[];
  currentClass: Class | null;
}

export function ElectionTab({ students, currentClass }: ElectionTabProps) {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const { db: localDb, setDb: setLocalDb, loading } = useDatabase();
  const { electionDocuments = [] } = localDb;
  
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [electionData, setElectionData] = useState(currentClass?.election || {
      type: 'class_president',
      candidates: [],
      votedStudentIds: [],
  });

  const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;
  
  useEffect(() => {
    const classRecords = electionDocuments.filter(d => d.classId === currentClass?.id);
    if(selectedRecordId) {
        const record = classRecords.find(r => r.id === selectedRecordId);
        if (record) {
            setElectionData(record.data);
        }
    } else {
        // Fallback to live data if no record is selected or found
        setElectionData(currentClass?.election || {
            type: 'class_president',
            candidates: [],
            votedStudentIds: [],
        });
    }
  }, [selectedRecordId, electionDocuments, currentClass]);

  const updateLiveElection = async (updates: Partial<Class['election']>) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    const newElectionData = { ...electionData, ...updates };
    await updateDoc(classRef, { election: newElectionData });
    setElectionData(newElectionData); // Update local state as well
  };
  
  const handleToggleActive = async (checked: boolean) => {
    if (!currentClass || !db) return;
    
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

  const handleTogglePublish = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    const publicViewRef = doc(db, 'publicViews', currentClass.id);
    
    try {
        await updateDoc(classRef, { isElectionPublished: checked });
        if (checked) {
            const publicData = {
                className: currentClass.name,
                election: {
                    type: electionData.type,
                    candidates: electionData.candidates.map(c => ({ id: c.id, name: c.name, votes: c.votes })),
                },
            };
            await setDoc(publicViewRef, publicData, { merge: true });
            toast({ title: 'Seçim sonuçları yayınlandı!' });
        } else {
            await updateDoc(publicViewRef, { election: deleteField() });
            toast({ title: 'Seçim sonuçları yayından kaldırıldı.' });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Hata', description: 'Yayın durumu değiştirilemedi.' });
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
    updateLiveElection({ candidates: newCandidates });
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

  const sortedStudents = useMemo(() => {
    return [...students].sort((a,b) => a.number.localeCompare(b.number, 'tr', {numeric: true}));
  }, [students]);

  const resetLiveElection = () => {
    updateLiveElection({ candidates: [], votedStudentIds: [] });
    handleToggleActive(false); // Seçimi de pasif yap
    toast({ title: "Aktif seçim sıfırlandı." });
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

  const handleSaveToArchive = () => {
      if (!currentClass || !winner) {
          toast({ variant: 'destructive', title: 'Arşivlenemiyor', description: 'Arşivlemek için tamamlanmış bir seçim olmalı.'});
          return;
      }
       const newRecord: ElectionDocument = {
        id: `election_${Date.now()}`,
        name: `Seçim - ${electionInfo.title.slice(0, 20)} - ${new Date().toLocaleDateString('tr-TR')}`,
        date: new Date().toISOString(),
        classId: currentClass.id,
        data: electionData,
    };
    
    setLocalDb(prevDb => ({
        ...prevDb,
        electionDocuments: [...(prevDb.electionDocuments || []), newRecord]
    }));
    toast({ title: 'Kaydedildi', description: 'Seçim sonuçları arşive başarıyla kaydedildi.' });
  }
  
  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
    // Resetting to live data
    setElectionData(currentClass?.election || {
        type: 'class_president',
        candidates: [],
        votedStudentIds: [],
    });
  }, [currentClass]);

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
      ...prevDb,
      electionDocuments: prevDb.electionDocuments.filter(d => d.id !== selectedRecordId)
    }));
    handleNewRecord();
    toast({ title: "Silindi", description: "Seçim kaydı arşivden silindi.", variant: "destructive" });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);
  
  const handleWhatsAppShare = () => {
    if (!currentClass?.code) return;
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const link = `${publicUrl}/view/election/${currentClass.code}`;
    const message = encodeURIComponent(`"${currentClass.name}" sınıfı seçim sonuçları: ${link}`);
    window.open(`https://wa.me/?text=${message}`);
  };
  
  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
             <RecordManager
                records={(electionDocuments || []).filter(d => d.classId === currentClass?.id).map(r => ({ id: r.id, name: r.name }))}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Seçim Kaydı"
            />
            <Card>
                <CardHeader>
                    <CardTitle>Canlı Seçim Yönetimi</CardTitle>
                    <CardDescription>Adayları seçin ve oylamayı başlatın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between space-x-2 p-3 bg-muted rounded-lg">
                        <Label htmlFor="election-toggle" className="font-semibold">{currentClass?.isElectionActive ? 'Oylama Aktif' : 'Oylama Pasif'}</Label>
                        <div className="flex items-center gap-2">
                           {currentClass?.isElectionActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if(!currentClass?.code) return;
                                        const publicUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                                        const link = `${publicUrl}/oylama/${currentClass.code}`;
                                        navigator.clipboard.writeText(link);
                                        toast({ title: 'Oylama linki kopyalandı!' });
                                    }}
                                >
                                    <Share2 className="mr-2 h-4 w-4" /> Oylama Linki
                                </Button>
                            )}
                            <Switch 
                                id="election-toggle" 
                                checked={currentClass?.isElectionActive || false}
                                onCheckedChange={handleToggleActive}
                                disabled={!currentClass}
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Aday</TableHead><TableHead>Öğrenci No</TableHead><TableHead>Adı Soyadı</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {sortedStudents.map(student => (
                                <TableRow key={student.id} onClick={() => toggleCandidate(student.id)} className="cursor-pointer">
                                    <TableCell><Checkbox checked={electionData.candidates.some(c => c.id === student.id)} /></TableCell>
                                    <TableCell>{student.number}</TableCell>
                                    <TableCell>{student.name}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                   </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2"/> Aktif Seçimi Sıfırla
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu eylem, mevcut canlı seçimdeki tüm adayları ve kullanılan oyları kalıcı olarak silecektir. Bu işlem geri alınamaz.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={resetLiveElection} className="bg-destructive hover:bg-destructive/90">
                                Sıfırla
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
           <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{selectedRecordId ? 'Arşivlenmiş Seçim Sonuçları' : 'Canlı Seçim Sonuçları'}</CardTitle>
                        <CardDescription>{electionInfo.title}</CardDescription>
                    </div>
                     <div className='flex items-center gap-2'>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="publish-election"
                                checked={currentClass?.isElectionPublished || false}
                                onCheckedChange={handleTogglePublish}
                                disabled={!currentClass || electionData.votedStudentIds.length === 0}
                            />
                            <Label htmlFor="publish-election" className="text-sm font-medium">Yayınla</Label>
                        </div>
                        {currentClass?.isElectionPublished && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    if(!currentClass.code) return;
                                    const publicUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
                                    const link = `${publicUrl}/view/election/${currentClass.code}`;
                                    navigator.clipboard.writeText(link);
                                    toast({ title: 'Paylaşım linki kopyalandı!' });
                                }}>
                                    <Share2 className="mr-2 h-4 w-4" /> Linki Kopyala
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleWhatsAppShare} className="bg-green-50 text-green-700 border-green-200">
                                    <Share2 className="mr-2 h-4 w-4" /> WhatsApp
                                </Button>
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">İşlemler</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {selectedRecordId === null && !currentClass?.isElectionActive && winner && (
                                    <DropdownMenuItem onSelect={handleSaveToArchive}>
                                        <Save className="mr-2 h-4 w-4"/> Arşive Kaydet
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onSelect={handleExport} disabled={!winner}>
                                    <FileText className="mr-2 h-4 w-4"/> Tutanak Oluştur (.rtf)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                </div>
             </CardHeader>
             <CardContent className="space-y-6">
                {(electionData.votedStudentIds || []).length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                       <p>Henüz oy kullanılmadı.</p>
                       <p className="text-xs">Sonuçlar oylama tamamlandıktan sonra burada görünecektir.</p>
                   </div>
                ) : (
                    <>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                            {/* Winner */}
                            {winner && (
                                <Card className="bg-green-100 dark:bg-green-900/50 border-green-500">
                                    <CardHeader>
                                        <Crown className="mx-auto text-yellow-500 w-10 h-10"/>
                                        <CardTitle>{electionInfo.winnerLabel}</CardTitle>
                                        <CardDescription>{winner.name}</CardDescription>
                                        <p className="font-bold text-2xl">{winner.votes} Oy</p>
                                    </CardHeader>
                                </Card>
                            )}
                            {/* Runner Up (only for class president) */}
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
                        </div>

                        <Card>
                            <CardHeader><CardTitle>Tüm Adaylar ve Oy Dağılımı</CardTitle></CardHeader>
                            <CardContent>
                                 <p className="text-sm text-muted-foreground mb-4">Toplam kullanılan oy: {electionData.votedStudentIds.length} / {students.length}</p>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Adı Soyadı</TableHead><TableHead className="text-right">Aldığı Oy</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {sortedCandidates.map(c => (
                                            <TableRow key={c.id}><TableCell>{c.name} ({c.number})</TableCell><TableCell className="text-right font-bold">{c.votes}</TableCell></TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
             </CardContent>
           </Card>
        </div>
    </div>
  );
}
