'use client';

import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { AgendaEvent } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
      // Bu Tailwind JIT derleyicisinin renkleri yakalamasına yardımcı olur
      // bg-blue-500 border-blue-500
      // bg-green-500 border-green-500
      // bg-red-500 border-red-500
      // bg-yellow-500 border-yellow-500
      // bg-purple-500 border-purple-500
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
    
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const eventsForSelectedDate = useMemo(() => {
        return agendaEvents
            .filter(event => event.date === selectedDateStr)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [agendaEvents, selectedDateStr]);
    
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

    const handleDeleteEvent = (eventId: string) => {
        setDb(prevDb => ({
            ...prevDb,
            agendaEvents: (prevDb.agendaEvents || []).filter(e => e.id !== eventId)
        }));
        toast({ title: 'Silindi', variant: 'destructive' });
    };
    
    const handleToggleComplete = (eventId: string) => {
        setDb(prevDb => ({
            ...prevDb,
            agendaEvents: (prevDb.agendaEvents || []).map(e => e.id === eventId ? { ...e, isCompleted: !e.isCompleted } : e)
        }));
    };

    const handleOpenForm = (event: AgendaEvent | null = null) => {
        setEditingEvent(event);
        setIsFormOpen(true);
    };

    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <Card>
                    <CardContent className="p-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="w-full"
                            locale={tr}
                            components={{
                                DayContent: ({ date, ...props }) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const eventsOnDate = agendaEvents.filter(e => e.date === dateStr);
                                    return (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <p>{date.getDate()}</p>
                                            {eventsOnDate.length > 0 && (
                                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                    {eventsOnDate.slice(0, 3).map(e => (
                                                        <div key={e.id} className={`w-1 h-1 rounded-full ${getColorClass(e.color)}`}></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="font-headline">{format(selectedDate, 'd MMMM yyyy, cccc', { locale: tr })}</CardTitle>
                                <CardDescription>Bugünün planı ve notları.</CardDescription>
                            </div>
                             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                <DialogTrigger asChild>
                                    <Button onClick={() => handleOpenForm(null)}><Plus className="mr-2"/>Yeni Ekle</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{editingEvent ? 'Görevi Düzenle' : 'Yeni Görev/Not Ekle'}</DialogTitle>
                                        <DialogDescription>{format(selectedDate, 'd MMMM yyyy', { locale: tr })}</DialogDescription>
                                    </DialogHeader>
                                    <EventForm 
                                        event={editingEvent || { date: selectedDateStr }}
                                        onSave={handleSaveEvent}
                                        onCancel={() => setIsFormOpen(false)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh] pr-4">
                            {eventsForSelectedDate.length > 0 ? (
                                <div className="space-y-4">
                                    {eventsForSelectedDate.map(event => (
                                        <div key={event.id} className={cn("p-4 rounded-lg border-l-4", `border-${event.color}-500`, event.isCompleted ? 'bg-gray-100 text-gray-500' : 'bg-white')}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <input type="checkbox" checked={event.isCompleted} onChange={() => handleToggleComplete(event.id)} className="w-4 h-4 accent-primary"/>
                                                        <p className={cn("font-semibold", event.isCompleted && 'line-through')}>{event.title}</p>
                                                    </div>
                                                    {event.startTime && <p className="text-xs text-muted-foreground mt-1 ml-6">{event.startTime}</p>}
                                                    {event.description && <p className={cn("text-sm mt-2 ml-6", event.isCompleted && 'line-through')}>{event.description}</p>}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(event)}><Edit size={16}/></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 size={16}/></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>Bu tarih için kayıtlı bir görev veya not yok.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
