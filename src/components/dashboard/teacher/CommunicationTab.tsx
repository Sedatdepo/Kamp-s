
"use client";

import { useState, useMemo, useCallback, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Class, Announcement, CommunicationDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, Clock, Trash2, Eye, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';

interface CommunicationTabProps {
  classId: string;
  currentClass: Class | null;
}

export function CommunicationTab({ classId, currentClass }: CommunicationTabProps) {
  const [announcementText, setAnnouncementText] = useState('');
  const { toast } = useToast();
  const { db } = useAuth();
  const { db: localDb, setDb: setLocalDb, loading } = useDatabase();
  const { communicationDocuments = [] } = localDb;

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const displayedAnnouncements = useMemo(() => {
    if (selectedRecordId) {
      const record = communicationDocuments.find(d => d.id === selectedRecordId);
      return record ? record.data.announcements : [];
    }
    return currentClass?.announcements || [];
  }, [selectedRecordId, communicationDocuments, currentClass]);

  const handleAddAnnouncement = async () => {
    if (!db) return;
    if (!announcementText.trim()) {
      toast({ variant: 'destructive', title: 'Duyuru metni boş olamaz.' });
      return;
    }
    if (!currentClass) return;

    const newAnnouncement: Announcement = {
      id: Date.now(),
      text: announcementText,
      date: new Date().toISOString(),
      seenBy: [],
    };

    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = [newAnnouncement, ...(currentClass.announcements || [])];

    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
      setAnnouncementText('');
      toast({ title: 'Duyuru yayınlandı!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru yayınlanamadı.' });
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    if (!db || !currentClass) return;

    const classRef = doc(db, 'classes', classId);
    const updatedAnnouncements = (currentClass.announcements || []).filter(
      (ann) => ann.id !== announcementId
    );

    try {
      await updateDoc(classRef, { announcements: updatedAnnouncements });
      toast({ title: 'Duyuru silindi.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Duyuru silinemedi.' });
    }
  };

  const handleSaveToArchive = () => {
    if (!currentClass || !currentClass.announcements) {
      toast({ variant: 'destructive', title: 'Arşivlenemiyor', description: 'Arşivlenecek duyuru yok.' });
      return;
    }
    const newRecord: CommunicationDocument = {
      id: `comm_${Date.now()}`,
      name: `Duyurular - ${new Date().toLocaleDateString('tr-TR')}`,
      date: new Date().toISOString(),
      classId: currentClass.id,
      data: {
        announcements: currentClass.announcements,
      },
    };

    setLocalDb(prevDb => ({
      ...prevDb,
      communicationDocuments: [...(prevDb.communicationDocuments || []), newRecord],
    }));
    toast({ title: 'Kaydedildi', description: 'Mevcut duyurular arşive başarıyla kaydedildi.' });
  };

  const handleNewRecord = useCallback(() => {
    setSelectedRecordId(null);
  }, []);

  const handleDeleteRecord = useCallback(() => {
    if (!selectedRecordId) return;
    setLocalDb(prevDb => ({
      ...prevDb,
      communicationDocuments: (prevDb.communicationDocuments || []).filter(d => d.id !== selectedRecordId),
    }));
    handleNewRecord();
    toast({ title: "Silindi", description: "Kayıt arşivden silindi.", variant: "destructive" });
  }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Megaphone className="h-6 w-6" />
                {selectedRecordId ? 'Arşivlenmiş Duyurular' : 'Canlı Duyurular'}
              </CardTitle>
              <CardDescription>
                {selectedRecordId ? 'Seçili kayda ait duyuruları görüntülüyorsunuz.' : 'Bu sınıftaki tüm öğrencilere gönderilecek bir duyuru yazın.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRecordId && (
                <>
                  <Textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Duyuru metnini buraya yazın..."
                    rows={5}
                  />
                  <Button onClick={handleAddAnnouncement}>Yayınla</Button>
                </>
              )}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mt-4">
                {displayedAnnouncements.length > 0 ? (
                  displayedAnnouncements.map((ann) => (
                    <div key={ann.id} className="border p-4 rounded-lg bg-muted/50 flex justify-between items-start">
                      <div>
                        <p className="text-sm">{ann.text}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(ann.date).toLocaleDateString('tr-TR')}</span>
                          </div>
                          {!selectedRecordId && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-default">
                                  <Eye className="h-3 w-3" />
                                  <span>{ann.seenBy?.length || 0} Görüldü</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {ann.seenBy && ann.seenBy.length > 0
                                  ? <p>{ann.seenBy.join(', ')}</p>
                                  : <p>Henüz kimse görmedi.</p>
                                }
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      {!selectedRecordId && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu duyuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteAnnouncement(ann.id)} className="bg-destructive hover:bg-destructive/90">
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">Görüntülenecek duyuru yok.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
            <RecordManager
                records={(communicationDocuments || []).filter(d => d.classId === classId).map(r => ({ id: r.id, name: r.name }))}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Duyuru Kaydı"
            />
            <Button onClick={handleSaveToArchive} className="w-full bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" /> Canlı Duyuruları Arşive Kaydet
            </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
