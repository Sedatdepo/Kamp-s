'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Club } from '@/lib/types';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit, Save, X, ChevronsUpDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const MEB_CLUBS = [
    "Kültür ve Edebiyat Kulübü", "Kütüphanecilik Kulübü", "Sivil Savunma Kulübü",
    "Gezi, Tanıtma ve Turizm Kulübü", "Spor Kulübü", "Müzik Kulübü",
    "Görsel Sanatlar Kulübü", "Bilişim ve İnternet Kulübü", "Bilim-Fen ve Teknoloji Kulübü",
    "Satranç Kulübü", "Tiyatro Kulübü", "Yeşilay Kulübü", "Sağlık, Temizlik ve Beslenme Kulübü",
    "Meslek Tanıtma Kulübü", "Sosyal Dayanışma ve Yardımlaşma Kulübü"
];

export function ClubManager({ teacherId }: { teacherId: string }) {
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
