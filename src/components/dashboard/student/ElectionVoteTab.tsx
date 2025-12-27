
"use client";

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Candidate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Vote, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const getInitials = (name: string = '') => name.split(' ').map(n => n[0]).slice(0, 2).join('');

export function ElectionVoteTab() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  
  if (appUser?.type !== 'student') return null;

  const studentId = appUser.data.id;
  const classId = appUser.data.classId;

  const classQuery = useMemo(() => classId ? doc(db, 'classes', classId) : null, [classId]);
  const { data: classData, loading: classLoading } = useFirestore<Class>(`class-${classId}`, classQuery);
  const currentClass = useMemo(() => classData.length > 0 ? classData[0] : null, [classData]);

  const hasVoted = useMemo(() => {
    return currentClass?.election?.votedStudentIds.includes(studentId) ?? false;
  }, [currentClass, studentId]);

  const handleVote = async (candidateId: string) => {
    if (!currentClass || !currentClass.election) return;
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
     return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Sınıf Seçimi</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Şu anda aktif bir seçim bulunmuyor.</p>
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
                <CardDescription className="text-green-600">Seçim sonuçları öğretmeniniz tarafından açıklanacaktır.</CardDescription>
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
