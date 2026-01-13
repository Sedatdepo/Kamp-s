'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface RecordManagerProps {
  records: { id: string; name: string }[];
  selectedRecordId: string | null;
  onSelectRecord: (id: string) => void;
  onNewRecord: () => void;
  onDeleteRecord: () => void;
  noun: string;
}

export function RecordManager({
  records,
  selectedRecordId,
  onSelectRecord,
  onNewRecord,
  onDeleteRecord,
  noun,
}: RecordManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{noun} Arşivi</CardTitle>
        <CardDescription>Kaydedilmiş {noun.toLocaleLowerCase('tr-TR')} belgelerinizi buradan yönetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={onNewRecord} className="w-full">
          <Plus className="mr-2" /> Yeni {noun} Oluştur
        </Button>
        <ScrollArea className="h-48 w-full rounded-md border">
          <div className="p-2 space-y-1">
            {records.length > 0 ? (
              records.map(record => (
                <div
                  key={record.id}
                  onClick={() => onSelectRecord(record.id)}
                  className={cn(
                    'flex items-center justify-between w-full p-2 text-sm font-medium rounded-md cursor-pointer group',
                    selectedRecordId === record.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{record.name || 'İsimsiz'}</span>
                  </div>
                  {selectedRecordId === record.id && (
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-70 hover:opacity-100 group-hover:text-destructive-foreground hover:bg-destructive/50"
                            onClick={(e) => e.stopPropagation()} // Prevent row click
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Bu {noun.toLocaleLowerCase('tr-TR')} belgesini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={onDeleteRecord} className="bg-destructive hover:bg-destructive/90">
                                  Sil
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-xs text-muted-foreground">
                Henüz kaydedilmiş {noun.toLocaleLowerCase('tr-TR')} yok.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
