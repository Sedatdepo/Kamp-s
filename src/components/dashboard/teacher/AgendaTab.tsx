'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { AgendaEvent } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DayProps } from 'react-day-picker';

const EVENT_COLORS = [
  { name: 'Mavi', value: 'blue', class: 'bg-blue-500' },
  { name: 'Yeşil', value: 'green', class: 'bg-green-500' },
  { name: 'Kırmızı', value: 'red', class: 'bg-red-500' },
  { name: 'Sarı', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Mor', value: 'purple', class: 'bg-purple-500' },
];

const getColorClass = (colorName: string) => {
    const color = EVENT_COLORS.find(c => c.value === colorName);
    if (color) {
      // bg-blue-500 border-blue-500 ...
      return color.class;
    }
    return 'bg-gray-500';
};

const EventForm = ({ event, onSave, onCancel }: { event: Partial<AgendaEvent> | null, onSave: (event: AgendaEvent) => void, onCancel: () => void }) => {
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [startTime, setStartTime] = useState(event?.startTime || '');
    const [color, setColor] = useState(event?.color || 'blue');
    const { toast } = useToast();

    const handleSave = () => {
        if (!title.trim()) {
            toast({ title: "Başlık boş olamaz", variant: "destructive" });
            return;
        }
        const newEvent: AgendaEvent = {
            id: event?.id || `evt_${Date.now()}`,
            date: event?.date || format(new Date(), 'yyyy-MM-dd'),
            title,
            description,
            startTime,
            color,
            isCompleted: event?.isCompleted || false,
        };
        onSave(newEvent);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="title">Başlık</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
                <Label htmlFor="description">Açıklama / Notlar</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
             <div>
                <Label htmlFor="startTime">Saat (İsteğe Bağlı)</Label>
                <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
                <Label>Renk</Label>
                <div className="flex gap-2 mt-2">
                    {EVENT_COLORS.map(c => (
                        <button key={c.value} onClick={() => setColor(c.value)} className={cn("w-8 h-8 rounded-full border-2", color === c.value ? 'border-primary' : 'border-transparent')}>
                           <div className={cn("w-full h-full rounded-full", c.class)}></div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onCancel}>İptal</Button>
                <Button onClick={handleSave}>Kaydet</Button>
            </div>
        </div>
    );
};

export default function AgendaTab() {
    const { db, setDb } = useDatabase();
    const { agendaEvents = [] } = db;
    const { toast } = useToast();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Partial<AgendaEvent> | null>(null);

    const handleSaveEvent = (eventData: AgendaEvent) => {
        setDb(prevDb => {
            const existingIndex = (prevDb.agendaEvents || []).findIndex(e => e.id === eventData.id);
            let newEvents;
            if (existingIndex > -1) {
                newEvents = [...(prevDb.agendaEvents || [])];
                newEvents[existingIndex] = eventData;
            } else {
                newEvents = [...(prevDb.agendaEvents || []), eventData];
            }
            return { ...prevDb, agendaEvents: newEvents };
        });
        toast({ title: 'Kaydedildi!' });
        setIsFormOpen(false);
        setEditingEvent(null);
    };

    const handleOpenForm = (event: AgendaEvent | null, date: Date) => {
        if (event) {
            setEditingEvent(event);
        } else {
            setEditingEvent({ date: format(date, 'yyyy-MM-dd') });
        }
        setIsFormOpen(true);
    };

    const DayContent = ({ date, ...props }: DayProps) => {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
          return null;
        }
        const dateStr = format(date, 'yyyy-MM-dd');
        const eventsOnDate = agendaEvents
            .filter(event => event.date === dateStr)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        return (
            <div 
                className="h-full w-full p-2 flex flex-col cursor-pointer"
                onClick={() => handleOpenForm(null, date)}
            >
                <div className="flex justify-between items-start">
                    <p className={cn("text-sm font-semibold", props.today ? "text-primary" : "")}>{date.getDate()}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => {e.stopPropagation(); handleOpenForm(null, date)}}>
                        <Plus size={14}/>
                    </Button>
                </div>
                <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                    {eventsOnDate.slice(0, 3).map(event => (
                        <div 
                           key={event.id}
                           onClick={(e) => { e.stopPropagation(); handleOpenForm(event, date); }}
                           className={cn("p-1 rounded-md text-xs truncate text-white", getColorClass(event.color))}
                           title={event.title}
                        >
                           {event.startTime && <span className="font-bold">{event.startTime}</span>} {event.title}
                        </div>
                    ))}
                    {eventsOnDate.length > 3 && <p className="text-xs text-muted-foreground mt-1">+ {eventsOnDate.length - 3} daha</p>}
                </div>
            </div>
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Ajanda</CardTitle>
                    <CardDescription>Görevlerinizi, notlarınızı ve planlarınızı takvim üzerinde yönetin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Calendar
                        className="w-full"
                        classNames={{
                          table: 'border-collapse w-full',
                          head_row: 'border-b',
                          head_cell: 'text-sm font-semibold p-2 text-muted-foreground text-center',
                          row: '',
                          cell: 'h-36 text-left align-top p-0 relative border group',
                          day: 'h-full w-full',
                        }}
                        components={{
                            Day: DayContent,
                        }}
                        locale={tr}
                    />
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingEvent?.id ? 'Görevi Düzenle' : 'Yeni Görev/Not Ekle'}</DialogTitle>
                        <DialogDescription>{editingEvent?.date ? format(parseISO(editingEvent.date), 'd MMMM yyyy, cccc', { locale: tr }) : ''}</DialogDescription>
                    </DialogHeader>
                    <EventForm 
                        event={editingEvent}
                        onSave={handleSaveEvent}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}