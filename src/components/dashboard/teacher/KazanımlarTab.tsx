'use client';

import React, { useState, useMemo } from 'react';
import { PlusCircle, Trash2, Edit, Save, X, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Kazanım } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { KAZANIMLAR } from '@/lib/kazanimlar'; // Örnek kazanım verisi

export default function KazanımlarTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

    const [newKazanımText, setNewKazanımText] = useState('');
    const [editingKazanım, setEditingKazanım] = useState<Kazanım | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const kazanımlarQuery = useMemoFirebase(() => {
        if (!db || !teacherId) return null;
        return query(collection(db, 'kazanims'));
    }, [db, teacherId]);

    const { data: kazanımlar, isLoading: kazanımlarLoading } = useCollection<Kazanım>(kazanımlarQuery);

    const filteredKazanımlar = useMemo(() => {
        if (!kazanımlar) return [];
        if (!searchTerm) return kazanımlar;
        return kazanımlar.filter(k => k.text.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [kazanımlar, searchTerm]);

    const handleAddKazanım = async () => {
        if (!newKazanımText.trim() || !db || !teacherId) return;
        try {
            await addDoc(collection(db, 'kazanims'), {
                text: newKazanımText,
                teacherId: teacherId
            });
            setNewKazanımText('');
            toast({ title: 'Kazanım eklendi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kazanım eklenemedi.' });
        }
    };

    const handleUpdateKazanım = async () => {
        if (!editingKazanım || !editingKazanım.text.trim() || !db) return;
        try {
            const kazanımRef = doc(db, 'kazanims', editingKazanım.id);
            await updateDoc(kazanımRef, { text: editingKazanım.text });
            setEditingKazanım(null);
            toast({ title: 'Kazanım güncellendi.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kazanım güncellenemedi.' });
        }
    };

    const handleDeleteKazanım = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'kazanims', id));
            toast({ title: 'Kazanım silindi.', variant: 'destructive' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kazanım silinemedi.' });
        }
    };

    const handleImportFromLibrary = async (kazanimText: string) => {
        if (!db || !teacherId) return;
        try {
             await addDoc(collection(db, 'kazanims'), {
                text: kazanimText,
                teacherId: teacherId
            });
            toast({title: "Kazanım başarıyla eklendi!"})
        } catch (e) {
            toast({variant: 'destructive', title: 'Hata', description: 'Bu kazanım zaten mevcut olabilir.'})
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline flex items-center gap-2">
                            <BookOpen />
                            Kazanım Yönetimi
                        </CardTitle>
                        <CardDescription>Dersleriniz için öğrenme kazanımlarını yönetin.</CardDescription>
                    </div>
                    <Button onClick={() => setIsImportModalOpen(true)}>Kütüphaneden Aktar</Button>
                </div>
                 <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Kazanımlar içinde ara..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {filteredKazanımlar.map(kazanım => (
                        <div key={kazanım.id} className="flex items-center gap-2 p-3 border rounded-lg bg-background hover:bg-muted/50">
                            {editingKazanım?.id === kazanım.id ? (
                                <Input
                                    value={editingKazanım.text}
                                    onChange={(e) => setEditingKazanım({ ...editingKazanım, text: e.target.value })}
                                    className="flex-1"
                                />
                            ) : (
                                <p className="flex-1 text-sm">{kazanım.text}</p>
                            )}
                            {editingKazanım?.id === kazanım.id ? (
                                <>
                                    <Button size="icon" variant="ghost" onClick={handleUpdateKazanım} className="text-green-600"><Save className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingKazanım(null)}><X className="h-4 w-4" /></Button>
                                </>
                            ) : (
                                <>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingKazanım(kazanım)}><Edit className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteKazanım(kazanım.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </>
                            )}
                        </div>
                    ))}
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Input
                            placeholder="Yeni kazanım metni..."
                            value={newKazanımText}
                            onChange={(e) => setNewKazanımText(e.target.value)}
                        />
                        <Button onClick={handleAddKazanım}><PlusCircle className="mr-2 h-4 w-4" /> Ekle</Button>
                    </div>
                </div>
            </CardContent>

             {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Kazanım Kütüphanesi</CardTitle>
                                <Button variant="ghost" size="icon" onClick={() => setIsImportModalOpen(false)}><X/></Button>
                            </div>
                            <CardDescription>Müfredattan dersinize uygun kazanımları kendi listenize ekleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            {Object.entries(KAZANIMLAR).map(([ders, uniteler]) => (
                                <div key={ders}>
                                    <h3 className="text-lg font-bold mt-4 mb-2">{ders}</h3>
                                    {(uniteler as any[]).map(unite => (
                                        <div key={unite.unite} className="mb-4">
                                            <h4 className="font-semibold text-md text-primary">{unite.unite}</h4>
                                            {unite.konular.map((konu: any) => (
                                                <div key={konu.konu} className="ml-4 mt-2">
                                                    <h5 className="font-medium">{konu.konu}</h5>
                                                    <ul className="list-disc pl-5 text-sm space-y-1 mt-1">
                                                        {konu.kazanimlar.map((kazanimText: string, i: number) => (
                                                            <li key={i} className="flex justify-between items-center group">
                                                                <span>{kazanimText}</span>
                                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => handleImportFromLibrary(kazanimText)}>
                                                                    <PlusCircle className="h-4 w-4 mr-1"/> Ekle
                                                                </Button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    );
}
