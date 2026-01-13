
'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { DiscussionTopic, DiscussionPost, Class } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, MessageSquare, MessagesSquare, ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

const TopicList = ({ topics, onSelectTopic, onNewTopic, currentClass, onToggleActive }: { topics: DiscussionTopic[], onSelectTopic: (topic: DiscussionTopic) => void, onNewTopic: () => void, currentClass: Class | null, onToggleActive: (checked: boolean) => void }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><MessagesSquare /> Tartışma Başlıkları</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="discussion-active"
                            checked={currentClass?.isDiscussionBoardActive || false}
                            onCheckedChange={onToggleActive}
                        />
                        <Label htmlFor="discussion-active">Aktif</Label>
                    </div>
                    <Button onClick={onNewTopic}><Plus className="mr-2 h-4 w-4" /> Yeni Başlık</Button>
                </div>
            </div>
            <CardDescription>Sınıfınız için tartışma konuları oluşturun ve yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
            {topics.length > 0 ? (
                <div className="space-y-2">
                    {topics.map(topic => (
                        <div key={topic.id} onClick={() => onSelectTopic(topic)} className="p-3 rounded-lg border hover:bg-muted cursor-pointer">
                            <p className="font-semibold">{topic.title}</p>
                            <p className="text-xs text-muted-foreground">{topic.studentPostCount || 0} yanıt</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-4">Henüz tartışma başlığı oluşturulmadı.</p>
            )}
        </CardContent>
    </Card>
);

const TopicView = ({ topic, onBack, classId }: { topic: DiscussionTopic, onBack: () => void, classId: string }) => {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const [newPost, setNewPost] = useState("");

    const postsQuery = useMemoFirebase(() => (
        query(collection(db, `classes/${classId}/discussionTopics/${topic.id}/posts`), orderBy('createdAt', 'asc'))
    ), [db, classId, topic.id]);

    const { data: posts, isLoading } = useCollection<DiscussionPost>(postsQuery);

    const handleDeletePost = async (postId: string) => {
        try {
            await deleteDoc(doc(db, `classes/${classId}/discussionTopics/${topic.id}/posts`, postId));
            toast({ title: "Yanıt silindi." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Hata", description: "Yanıt silinemedi." });
        }
    };
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-3"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
                        <CardTitle>{topic.title}</CardTitle>
                        <CardDescription>{topic.content}</CardDescription>
                    </div>
                    {/* <AlertDialog> ... </AlertDialog> // Add delete topic functionality if needed */}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col">
                {isLoading ? <Loader2 className="m-auto h-8 w-8 animate-spin" /> : (
                    <ScrollArea className="flex-1 pr-4 -mr-4">
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="flex items-start gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{getInitials(post.studentName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                            <div className="flex justify-between items-center">
                                                 <p className="text-sm font-semibold">{post.studentName} <span className="text-xs text-muted-foreground font-normal">#{post.studentNumber}</span></p>
                                                 <AlertDialog>
                                                     <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                                     <AlertDialogContent>
                                                         <AlertDialogHeader><AlertDialogTitle>Yanıtı Sil</AlertDialogTitle><AlertDialogDescription>Bu yanıtı kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                                         <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePost(post.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                                     </AlertDialogContent>
                                                 </AlertDialog>
                                            </div>
                                            <p className="text-sm mt-1">{post.content}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: tr }) : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};

const NewTopicForm = ({ onBack, classId }: { onBack: () => void, classId: string }) => {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !content.trim() || !appUser || appUser.type !== 'teacher' || !db) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Başlık ve içerik alanları boş bırakılamaz.' });
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, `classes/${classId}/discussionTopics`), {
                classId,
                teacherId: appUser.data.uid,
                title,
                content,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Başlık oluşturuldu!' });
            onBack();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Başlık oluşturulamadı.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-3 w-fit"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
                <CardTitle>Yeni Tartışma Başlığı Oluştur</CardTitle>
                <CardDescription>Öğrencilerinizin fikir alışverişinde bulunması için yeni bir konu başlatın.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Tartışma Başlığı" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Konuyla ilgili açıklama veya başlangıç sorusu..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Başlığı Yayınla
                </Button>
            </CardContent>
        </Card>
    );
};

export const DiscussionBoardTab = ({ classId, currentClass }: { classId: string; currentClass: Class | null; }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'topic' | 'new'>('list');
    const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);

    const topicsQuery = useMemoFirebase(() => (
        query(collection(db, `classes/${classId}/discussionTopics`), orderBy('createdAt', 'desc'))
    ), [db, classId]);

    const { data: topics, isLoading } = useCollection<DiscussionTopic>(topicsQuery);
    
    const handleSelectTopic = (topic: DiscussionTopic) => {
        setSelectedTopic(topic);
        setView('topic');
    }

    const handleToggleActive = async (checked: boolean) => {
        if (!currentClass || !db) return;
        const classRef = doc(db, 'classes', classId);
        try {
            await updateDoc(classRef, { isDiscussionBoardActive: checked });
            toast({ title: 'Başarılı!', description: `Tartışma panosu öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.' });
        }
    };
    
    if(isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (view === 'new') {
        return <NewTopicForm onBack={() => setView('list')} classId={classId} />
    }

    if (view === 'topic' && selectedTopic) {
        return <TopicView topic={selectedTopic} onBack={() => setView('list')} classId={classId} />
    }
    
    return <TopicList topics={topics || []} onSelectTopic={handleSelectTopic} onNewTopic={() => setView('new')} currentClass={currentClass} onToggleActive={handleToggleActive} />
};
