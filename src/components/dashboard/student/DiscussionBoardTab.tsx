
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { DiscussionTopic, DiscussionPost } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

const TopicList = ({ topics, onSelectTopic }: { topics: DiscussionTopic[], onSelectTopic: (topic: DiscussionTopic) => void }) => (
    <Card>
        <CardHeader>
            <CardTitle>Tartışma Panosu</CardTitle>
            <CardDescription>Sınıf arkadaşlarınla fikir alışverişi yapabileceğin konular.</CardDescription>
        </CardHeader>
        <CardContent>
            {topics.length > 0 ? (
                <div className="space-y-2">
                    {topics.map(topic => (
                        <div key={topic.id} onClick={() => onSelectTopic(topic)} className="p-4 rounded-lg border hover:bg-muted cursor-pointer">
                            <p className="font-semibold">{topic.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{topic.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">{formatDistanceToNow(topic.createdAt.toDate(), { addSuffix: true, locale: tr })}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground py-6">Henüz tartışma konusu açılmamış.</p>
            )}
        </CardContent>
    </Card>
);

const TopicView = ({ topic, onBack }: { topic: DiscussionTopic, onBack: () => void }) => {
    const { appUser, db } = useAuth();
    const { toast } = useToast();
    const [newPost, setNewPost] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const classId = appUser?.type === 'student' ? appUser.data.classId : null;

    const postsQuery = useMemoFirebase(() => {
        if (!classId) return null;
        return query(collection(db, `classes/${classId}/discussionTopics/${topic.id}/posts`), orderBy('createdAt', 'asc'))
    }, [db, classId, topic.id]);

    const { data: posts, isLoading } = useCollection<DiscussionPost>(postsQuery);

    const handleAddPost = async () => {
        if (!newPost.trim() || !appUser || appUser.type !== 'student' || !classId) return;

        setIsSaving(true);
        try {
            await addDoc(collection(db, `classes/${classId}/discussionTopics/${topic.id}/posts`), {
                topicId: topic.id,
                parentId: null,
                studentId: appUser.data.id,
                studentName: appUser.data.name,
                studentNumber: appUser.data.number,
                content: newPost,
                createdAt: serverTimestamp(),
            });
            setNewPost('');
            toast({ title: 'Yanıtın gönderildi!' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Yanıt gönderilemedi.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Card className="h-[75vh] flex flex-col">
            <CardHeader>
                <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-3 w-fit"><ArrowLeft className="mr-2 h-4 w-4" /> Geri</Button>
                <CardTitle>{topic.title}</CardTitle>
                <CardDescription>{topic.content}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
                <ScrollArea className="flex-1 pr-4 -mr-4">
                    {isLoading ? <Loader2 className="m-auto h-8 w-8 animate-spin" /> : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="flex items-start gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{getInitials(post.studentName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                            <p className="text-sm font-semibold">{post.studentName}</p>
                                            <p className="text-sm mt-1">{post.content}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: tr })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                 <div className="flex gap-2 pt-4 border-t">
                    <Textarea placeholder="Fikrini yaz..." value={newPost} onChange={(e) => setNewPost(e.target.value)} rows={1} />
                    <Button onClick={handleAddPost} disabled={isSaving || !newPost.trim()}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export const DiscussionBoardTab = () => {
    const { appUser, db } = useAuth();
    const classId = appUser?.type === 'student' ? appUser.data.classId : null;
    const [selectedTopic, setSelectedTopic] = useState<DiscussionTopic | null>(null);

    const topicsQuery = useMemoFirebase(() => {
        if (!db || !classId) return null;
        return query(collection(db, `classes/${classId}/discussionTopics`), orderBy('createdAt', 'desc'));
    }, [db, classId]);

    const { data: topics, isLoading } = useCollection<DiscussionTopic>(topicsQuery);
    
    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    if (selectedTopic) {
        return <TopicView topic={selectedTopic} onBack={() => setSelectedTopic(null)} />
    }
    
    return <TopicList topics={topics || []} onSelectTopic={setSelectedTopic} />
};

