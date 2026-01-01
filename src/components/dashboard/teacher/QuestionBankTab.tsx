'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Question, Kazanım } from '@/lib/types';
import { collection, query, where, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, FileQuestion, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface QuestionBankTabProps {
  teacherId: string;
}

const KazanımManager = ({ teacherId }: { teacherId: string }) => {
  const { db } = useAuth();
  const { toast } = useToast();
  const [newKazanımText, setNewKazanımText] = useState('');
  
  const kazanimsQuery = useMemo(() => (db ? query(collection(db, 'kazanims'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: kazanims, loading } = useFirestore<Kazanım[]>(`kazanims-for-teacher-${teacherId}`, kazanimsQuery);

  const handleAddKazanım = async () => {
    if (!db || !newKazanımText.trim()) return;
    await addDoc(collection(db, 'kazanims'), { text: newKazanımText, teacherId });
    setNewKazanımText('');
    toast({ title: 'Kazanım eklendi.' });
  };

  const handleDeleteKazanım = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'kazanims', id));
    toast({ title: 'Kazanım silindi.', variant: 'destructive' });
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen /> Kazanım Yönetimi</CardTitle>
        <CardDescription>Soru eklemek için önce kazanımlarınızı belirleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input value={newKazanımText} onChange={e => setNewKazanımText(e.target.value)} placeholder="Yeni kazanım ekle..." />
          <Button onClick={handleAddKazanım}>Ekle</Button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {kazanims.map(k => (
            <div key={k.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
              <span className="text-sm">{k.text}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteKazanım(k.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


export function QuestionBankTab({ teacherId }: QuestionBankTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [text, setText] = useState('');
  const [type, setType] = useState<'multiple-choice' | 'true-false' | 'open-ended'>('multiple-choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [kazanimId, setKazanımId] = useState('');
  const [difficulty, setDifficulty] = useState<'kolay' | 'orta' | 'zor'>('orta');
  const [points, setPoints] = useState(10);
  
  const kazanimsQuery = useMemo(() => (db ? query(collection(db, 'kazanims'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: kazanims, loading: kazanimsLoading } = useFirestore<Kazanım[]>(`kazanims-for-teacher-${teacherId}`, kazanimsQuery);

  const questionsQuery = useMemo(() => (db ? query(collection(db, 'questions'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: questions, loading: questionsLoading } = useFirestore<Question[]>(`questions-for-teacher-${teacherId}`, questionsQuery);

  const resetForm = () => {
    setEditingQuestion(null);
    setText('');
    setType('multiple-choice');
    setOptions(['', '', '', '']);
    setCorrectAnswer('');
    setKazanımId('');
    setDifficulty('orta');
    setPoints(10);
  };

  const handleAddOrUpdateQuestion = async () => {
    if (!db || !text.trim() || !kazanimId || !correctAnswer) {
      toast({ title: 'Eksik Bilgi', description: 'Lütfen tüm zorunlu alanları doldurun.', variant: 'destructive' });
      return;
    }
    
    const questionData = {
      text, type, options: type === 'multiple-choice' ? options.filter(o => o.trim() !== '') : [],
      correctAnswer, kazanimId, difficulty, points, teacherId
    };

    if (editingQuestion) {
      await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);
      toast({ title: 'Soru güncellendi.' });
    } else {
      await addDoc(collection(db, 'questions'), questionData);
      toast({ title: 'Soru eklendi.' });
    }
    resetForm();
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setText(q.text);
    setType(q.type);
    setOptions(q.options.length > 0 ? [...q.options, ...Array(4 - q.options.length).fill('')] : ['', '', '', '']);
    setCorrectAnswer(q.correctAnswer);
    setKazanımId(q.kazanimId);
    setDifficulty(q.difficulty);
    setPoints(q.points);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'questions', id));
    toast({ title: 'Soru silindi.', variant: 'destructive' });
  };
  
  const handleOptionChange = (index: number, value: string) => {
      const newOptions = [...options];
      newOptions[index] = value;
      setOptions(newOptions);
  }

  const isLoading = questionsLoading || kazanimsLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <KazanımManager teacherId={teacherId} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileQuestion /> {editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Soru metni..." value={text} onChange={e => setText(e.target.value)} />
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue placeholder="Soru Tipi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Çoktan Seçmeli</SelectItem>
                <SelectItem value="true-false">Doğru / Yanlış</SelectItem>
                <SelectItem value="open-ended">Açık Uçlu</SelectItem>
              </SelectContent>
            </Select>

            {type === 'multiple-choice' && (
              <div className="space-y-2">
                {options.map((opt, i) => (
                    <Input key={i} placeholder={`Seçenek ${i + 1}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                ))}
              </div>
            )}
             
            {type === 'true-false' ? (
                <Select value={correctAnswer} onValueChange={setCorrectAnswer}>
                     <SelectTrigger><SelectValue placeholder="Doğru Cevap" /></SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Doğru">Doğru</SelectItem>
                        <SelectItem value="Yanlış">Yanlış</SelectItem>
                     </SelectContent>
                </Select>
            ) : (
                <Input placeholder="Doğru Cevap" value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} />
            )}

            <Select value={kazanimId} onValueChange={setKazanımId}>
              <SelectTrigger><SelectValue placeholder="Kazanım Seç" /></SelectTrigger>
              <SelectContent>
                {kazanimsLoading ? <SelectItem value="loading" disabled>Yükleniyor...</SelectItem> : kazanims.map(k => (
                  <SelectItem key={k.id} value={k.id}>{k.text}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger><SelectValue placeholder="Zorluk Derecesi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kolay">Kolay</SelectItem>
                <SelectItem value="orta">Orta</SelectItem>
                <SelectItem value="zor">Zor</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Puan" value={points} onChange={e => setPoints(Number(e.target.value))} />

            <div className="flex gap-2">
                {editingQuestion && <Button variant="ghost" onClick={resetForm}>İptal</Button>}
                <Button onClick={handleAddOrUpdateQuestion} className="w-full">{editingQuestion ? 'Güncelle' : 'Ekle'}</Button>
            </div>

          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Soru Bankası</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin"/> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Soru</TableHead>
                  <TableHead>Kazanım</TableHead>
                  <TableHead>Zorluk</TableHead>
                  <TableHead>Puan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map(q => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-xs truncate">{q.text}</TableCell>
                    <TableCell className="text-xs">{kazanims.find(k => k.id === q.kazanimId)?.text || 'N/A'}</TableCell>
                    <TableCell>{q.difficulty}</TableCell>
                    <TableCell>{q.points}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}><Edit size={16} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(q.id)}><Trash2 size={16} /></Button>
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
