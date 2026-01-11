'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Student, Club, Class } from '@/lib/types';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Save, FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { ClubManager } from './ClubManager';
import { exportClubDistributionToRtf } from '@/lib/word-export';


interface ClubAssignmentTabProps {
  students: Student[];
  teacherId: string;
  currentClass: Class | null;
}

export function ClubAssignmentTab({ students, teacherId, currentClass }: ClubAssignmentTabProps) {
    const { appUser, db } = useAuth();
    const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;
    const { toast } = useToast();
    const [localStudents, setLocalStudents] = useState<Student[]>(students);
    
    const clubsQuery = useMemoFirebase(() => (db ? query(collection(db, 'clubs'), where('teacherId', '==', teacherId)) : null), [teacherId, db]);
    const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

    useEffect(() => {
        setLocalStudents(students);
    }, [students]);

    const handleAssignmentChange = (studentId: string, clubId: string) => {
        setLocalStudents(prev => 
          prev.map(s => {
            if (s.id === studentId) {
                const newAssignedClubIds = [...(s.assignedClubIds || [])];
                if (newAssignedClubIds.includes(clubId)) {
                    return {...s, assignedClubIds: newAssignedClubIds.filter(id => id !== clubId)}
                } else {
                    return {...s, assignedClubIds: [...newAssignedClubIds, clubId]}
                }
            }
            return s;
          })
        );
    };

    const handleSaveChanges = async () => {
        if (!db) return;
        const batch = writeBatch(db);
        localStudents.forEach(student => {
            const originalStudent = students.find(s => s.id === student.id);
            if (JSON.stringify(student.assignedClubIds) !== JSON.stringify(originalStudent?.assignedClubIds)) {
                const studentRef = doc(db, 'students', student.id);
                batch.update(studentRef, { assignedClubIds: student.assignedClubIds || [] });
            }
        });

        try {
            await batch.commit();
            toast({ title: 'Başarılı', description: 'Tüm kulüp atamaları güncellendi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Değişiklikler kaydedilemedi.' });
        }
    };
    
     const handleToggleChange = async (checked: boolean) => {
        if (!currentClass || !db) return;
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { isClubSelectionActive: checked });
            toast({
                title: 'Başarılı',
                description: `Kulüp seçimi öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Güncelleme sırasında bir sorun oluştu.',
            });
        }
    };

    const handleExportDistribution = () => {
        if (!currentClass || !teacherProfile || !students || !clubs) return;
        exportClubDistributionToRtf({ students, clubs, currentClass, teacherProfile });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                         <CardTitle className="font-headline text-lg">Seçim Yönetimi</CardTitle>
                         <Switch
                            checked={currentClass?.isClubSelectionActive || false}
                            onCheckedChange={handleToggleChange}
                            disabled={!currentClass}
                        />
                    </CardHeader>
                     <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Öğrencilerin kulüp tercihi yapabilmesi için bu ayarı aktif edin.
                        </p>
                    </CardContent>
                </Card>
                <ClubManager teacherId={teacherId} />
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <CardTitle className="font-headline">Öğrenci Kulüp Atama</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleExportDistribution} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Atama Listesini İndir</Button>
                                <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Atamaları Kaydet</Button>
                            </div>
                        </div>
                        <CardDescription>Öğrencilerin tercihlerine göre kulüp atamalarını yapın.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {clubsLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" /> : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Öğrenci</TableHead>
                                        <TableHead>Tercihleri</TableHead>
                                        <TableHead className="w-[250px]">Atanan Kulüpler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localStudents.map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name} ({student.number})</TableCell>
                                            <TableCell>
                                                 <ol className="list-decimal list-inside text-xs">
                                                    {(student.clubPreferences || []).map(prefId => {
                                                        const club = clubs?.find(l => l.id === prefId);
                                                        return <li key={prefId}>{club ? club.name : 'Bilinmeyen Kulüp'}</li>
                                                    })}
                                                </ol>
                                            </TableCell>
                                            <TableCell>
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-start h-8">
                                                            {student.assignedClubIds && student.assignedClubIds.length > 0 
                                                                ? `${student.assignedClubIds.length} kulüp seçildi` 
                                                                : "Kulüp ata..."}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-64">
                                                        <DropdownMenuLabel>Kulüp Seç</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {clubs?.map(club => (
                                                            <DropdownMenuCheckboxItem
                                                                key={club.id}
                                                                checked={(student.assignedClubIds || []).includes(club.id)}
                                                                onCheckedChange={() => handleAssignmentChange(student.id, club.id)}
                                                            >
                                                                {club.name}
                                                            </DropdownMenuCheckboxItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
