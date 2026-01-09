'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Student, Club, Class } from '@/lib/types';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit, Save, X, ChevronsUpDown, Check, Drama, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { exportClubDistributionToRtf, exportClubPetitionsToRtf } from '@/lib/word-export';


const MEB_CLUBS = [
    "Kültür ve Edebiyat Kulübü", "Kütüphanecilik Kulübü", "Sivil Savunma Kulübü",
    "Gezi, Tanıtma ve Turizm Kulübü", "Spor Kulübü", "Müzik Kulübü",
    "Görsel Sanatlar Kulübü", "Bilişim ve İnternet Kulübü", "Bilim-Fen ve Teknoloji Kulübü",
    "Satranç Kulübü", "Tiyatro Kulübü", "Yeşilay Kulübü", "Sağlık, Temizlik ve Beslenme Kulübü",
    "Meslek Tanıtma Kulübü", "Sosyal Dayanışma ve Yardımlaşma Kulübü"
];


function ClubManager({ teacherId }: { teacherId: string }) {
    const { toast } = useToast();
    const { db } = useAuth();
    const clubsQuery = useMemoFirebase(() => (db ? query(collection(db, 'clubs'), where('teacherId', '==', teacherId)) : null), [teacherId, db]);
    const { data: clubs, isLoading: clubsLoading } = useCollection<Club>(clubsQuery);

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    
    const [newClubName, setNewClubName] = useState('');
    const [popoverOpen, setPopoverOpen] = useState(false);

    const handleStartEdit = (club: Club) => {
        setIsEditing(club.id);
        setEditingName(club.name);
    };

    const handleCancelEdit = () => setIsEditing(null);

    const handleSaveEdit = async (clubId: string) => {
        if (!db || !editingName.trim()) {
            toast({ variant: 'destructive', title: 'Kulüp adı boş olamaz.' });
            return;
        }
        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, { name: editingName });
        setIsEditing(null);
        toast({ title: 'Kulüp güncellendi!' });
    };

    const handleDelete = async (clubId: string) => {
        if (!db) return;
        await deleteDoc(doc(db, 'clubs', clubId));
        toast({ title: 'Kulüp silindi.', variant: 'destructive' });
    };
    
    const handleAddClub = async () => {
        if (!db || !newClubName.trim()) {
            toast({ variant: 'destructive', title: 'Kulüp adı boş olamaz.' });
            return;
        }
        await addDoc(collection(db, 'clubs'), {
            name: newClubName,
            teacherId: teacherId
        });
        setNewClubName('');
        toast({ title: 'Yeni kulüp eklendi!' });
    }

    if (clubsLoading) return <Loader2 className="h-6 w-6 animate-spin" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Kulüp Yönetimi</CardTitle>
                <CardDescription>Sosyal etkinlikler için kulüpleri yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {clubs && clubs.map(club => (
                    isEditing === club.id ? (
                        <div key={club.id} className="flex gap-2 items-center p-2 bg-slate-100 rounded-lg">
                            <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-9"/>
                            <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(club.id)}><Save className="h-5 w-5 text-green-600"/></Button>
                            <Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="h-5 w-5 text-red-600"/></Button>
                        </div>
                    ) : (
                        <div key={club.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                            <span className="font-medium">{club.name}</span>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleStartEdit(club)}><Edit className="h-4 w-4"/></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu kulübü silerseniz, bu kulübe atanmış tüm öğrencilerin ataması kalkacaktır.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(club.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )
                ))}
                <div className="flex gap-2 items-center pt-4 border-t">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-[250px] justify-between">
                                {newClubName || "Kulüp seçin veya yazın..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                            <Command>
                                <CommandInput placeholder="Kulüp ara..." onValueChange={setNewClubName} />
                                <CommandList>
                                <CommandEmpty>Kulüp bulunamadı.</CommandEmpty>
                                <CommandGroup>
                                    {MEB_CLUBS.map((club) => (
                                    <CommandItem key={club} value={club} onSelect={(currentValue) => { setNewClubName(currentValue === newClubName ? "" : currentValue); setPopoverOpen(false); }}>
                                        <Check className={cn("mr-2 h-4 w-4", newClubName === club ? "opacity-100" : "opacity-0")} />
                                        {club}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button onClick={handleAddClub}><Plus className="mr-2 h-4 w-4"/> Ekle</Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function SocialClubTab({ students, teacherId, currentClass }: { students: Student[], teacherId: string, currentClass: Class | null }) {
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

    const handleExportPetitions = () => {
        if (!currentClass || !teacherProfile || !students || !clubs) return;
        exportClubPetitionsToRtf({ students, clubs, currentClass, teacherProfile });
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
                            <CardTitle className="font-headline flex items-center gap-2"><Drama/> Öğrenci Kulüp Atama</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button onClick={handleExportPetitions} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Dilekçeleri İndir</Button>
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