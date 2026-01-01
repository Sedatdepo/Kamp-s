'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Question, Kazanım, MatchingPair } from '@/lib/types';
import { collection, query, where, addDoc, deleteDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, FileQuestion, BookOpen, Library, Check, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestionBankTabProps {
  teacherId: string;
}

const KazanımManager = ({ teacherId }: { teacherId: string }) => {
  const { db } = useAuth();
  const { toast } = useToast();
  
  const kazanimsQuery = useMemo(() => (db ? query(collection(db, 'kazanims'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: kazanims, loading } = useFirestore<Kazanım[]>(`kazanims-for-teacher-${teacherId}`, kazanimsQuery);

  const [selectedDers, setSelectedDers] = useState(Object.keys(KAZANIMLAR)[0]);

  const handleAddKazanım = async (kazanimText: string) => {
    if (!db) return;
    // Check if the kazanım already exists
    if (kazanims.some(k => k.text === kazanimText)) {
        toast({ title: 'Bu kazanım zaten ekli.', variant: 'default' });
        return;
    }
    await addDoc(collection(db, 'kazanims'), { text: kazanimText, teacherId });
    toast({ title: 'Kazanım eklendi.' });
  };
  
  const handleBulkAddKazanım = async (kazanimList: { unite: string, konular: { konu: string, kazanimlar: string[] }[] }) => {
    if (!db) return;
    const batch = writeBatch(db);
    let addedCount = 0;
    
    kazanimList.konular.forEach(konu => {
      konu.kazanimlar.forEach(kazanimText => {
        // Check if kazanım already exists before adding to batch
        if (!kazanims.some(k => k.text === kazanimText)) {
          const docRef = doc(collection(db, 'kazanims'));
          batch.set(docRef, { text: kazanimText, teacherId });
          addedCount++;
        }
      });
    });
    
    if (addedCount > 0) {
      await batch.commit();
      toast({ title: `${addedCount} yeni kazanım eklendi.` });
    } else {
      toast({ title: 'Tüm kazanımlar zaten mevcut.' });
    }
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
        <CardDescription>Soru eklemek için önce kazanımlarınızı belirleyin veya ders kitabından ekleyin.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full mb-4">
              <Library className="mr-2" /> Ders Kitabından Kazanım Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Kazanım Kütüphanesi</DialogTitle>
              <DialogDescription>Ders ve sınıf seçerek ilgili kazanımları kendi listenize ekleyebilirsiniz.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              <div className="w-1/4">
                <Select value={selectedDers} onValueChange={setSelectedDers}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {Object.keys(KAZANIMLAR).map(ders => (
                      <SelectItem key={ders} value={ders}>{ders}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <ScrollArea className="h-[60vh] border rounded-md p-4">
                  {(KAZANIMLAR[selectedDers] || []).map((unite:any) => (
                    <div key={unite.unite} className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-primary">{unite.unite}</h3>
                        <Button size="sm" variant="outline" onClick={() => handleBulkAddKazanım(unite)}>Tümünü Ekle</Button>
                      </div>
                      {unite.konular.map((konu: any) => (
                        <div key={konu.konu} className="pl-4 border-l-2 ml-2 mb-2">
                          <h4 className="font-semibold text-sm">{konu.konu}</h4>
                           <ul className="list-none pl-4 text-sm">
                            {konu.kazanimlar.map((kazanim: string) => {
                                const isAdded = kazanims.some(k => k.text === kazanim);
                                return (
                                <li key={kazanim} className="flex items-center gap-2 py-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleAddKazanım(kazanim)} disabled={isAdded}>
                                        {isAdded ? <Check className="text-green-500"/> : <Plus className="text-blue-500" />}
                                    </Button>
                                    <span>{kazanim}</span>
                                </li>
                                )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <h4 className="font-semibold text-sm mb-2">Eklenen Kazanımlar</h4>
        <ScrollArea className="h-48 border rounded-md p-2">
          {kazanims.length > 0 ? kazanims.map(k => (
            <div key={k.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md mb-1">
              <span className="text-sm flex-1">{k.text}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 shrink-0" onClick={() => handleDeleteKazanım(k.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          )) : (
            <p className="text-center text-xs text-muted-foreground p-4">Henüz kazanım eklenmedi.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


export function QuestionBankTab({ teacherId }: QuestionBankTabProps) {
  const { db } = useAuth();
  const { toast } = useToast();
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [text, setText] = useState('');
  const [type, setType] = useState<Question['type']>('multiple-choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([{ id: `pair_${Date.now()}`, question: '', answer: '' }]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [kazanimId, setKazanımId] = useState('');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('orta');
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
    setMatchingPairs([{ id: `pair_${Date.now()}`, question: '', answer: '' }]);
    setCorrectAnswer('');
    setKazanımId('');
    setDifficulty('orta');
    setPoints(10);
  };

  const handleAddOrUpdateQuestion = async () => {
    if (!db || !text.trim() || !kazanimId) {
      toast({ title: 'Eksik Bilgi', description: 'Soru metni ve kazanım alanları zorunludur.', variant: 'destructive' });
      return;
    }
    
    let finalCorrectAnswer = correctAnswer;
    if (type === 'matching') {
        finalCorrectAnswer = JSON.stringify(matchingPairs);
    } else if (type === 'multiple-choice' && !correctAnswer) {
        toast({ title: 'Eksik Bilgi', description: 'Çoktan seçmeli sorularda doğru cevap belirtilmelidir.', variant: 'destructive' });
        return;
    }

    const questionData: Omit<Question, 'id'> = {
      text, type, 
      options: type === 'multiple-choice' ? options.filter(o => o.trim() !== '') : [],
      matchingPairs: type === 'matching' ? matchingPairs.filter(p => p.question.trim() !== '' && p.answer.trim() !== '') : [],
      correctAnswer: finalCorrectAnswer, 
      kazanimId, difficulty, points, teacherId
    };

    if (editingQuestion) {
      await updateDoc(doc(db, 'questions', editingQuestion.id), questionData);
      toast({ title: 'Soru güncellendi.' });
    } else {
      await addDoc(collection(db, 'questions'), { ...questionData, id: `q_${Date.now()}`});
      toast({ title: 'Soru eklendi.' });
    }
    resetForm();
  };

  const handleEdit = (q: Question) => {
    setEditingQuestion(q);
    setText(q.text);
    setType(q.type);
    setOptions(q.options?.length > 0 ? [...q.options, ...Array(4 - q.options.length).fill('')] : ['', '', '', '']);
    setCorrectAnswer(q.type !== 'matching' ? q.correctAnswer : '');
    setKazanımId(q.kazanimId);
    setDifficulty(q.difficulty);
    setPoints(q.points);
    setMatchingPairs(q.matchingPairs?.length ? q.matchingPairs : [{ id: `pair_${Date.now()}`, question: '', answer: '' }]);
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
  
  const handleMatchingPairChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newPairs = [...matchingPairs];
    newPairs[index][field] = value;
    setMatchingPairs(newPairs);
  };
  
  const addMatchingPair = () => {
    setMatchingPairs([...matchingPairs, { id: `pair_${Date.now()}`, question: '', answer: '' }]);
  };
  
  const removeMatchingPair = (index: number) => {
    if (matchingPairs.length > 1) {
        setMatchingPairs(matchingPairs.filter((_, i) => i !== index));
    }
  };


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
            <Textarea placeholder="Soru metni..." value={text} onChange={e => setText(e.target.value)} rows={5} />
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger><SelectValue placeholder="Soru Tipi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">Çoktan Seçmeli</SelectItem>
                <SelectItem value="true-false">Doğru / Yanlış</SelectItem>
                <SelectItem value="open-ended">Açık Uçlu</SelectItem>
                <SelectItem value="short-answer">Kısa Cevaplı</SelectItem>
                <SelectItem value="matching">Eşleştirme</SelectItem>
              </SelectContent>
            </Select>

            {type === 'multiple-choice' && (
              <div className="space-y-2">
                {options.map((opt, i) => (
                    <Input key={i} placeholder={`Seçenek ${String.fromCharCode(65 + i)}`} value={opt} onChange={e => handleOptionChange(i, e.target.value)} />
                ))}
                 <Input placeholder="Doğru Cevap (Örn: A)" value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)} />
              </div>
            )}
            
            {type === 'matching' && (
              <div className="space-y-2">
                {matchingPairs.map((pair, i) => (
                    <div key={pair.id} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Eşleştirilecek" value={pair.question} onChange={e => handleMatchingPairChange(i, 'question', e.target.value)} />
                        <Input placeholder="Cevabı" value={pair.answer} onChange={e => handleMatchingPairChange(i, 'answer', e.target.value)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeMatchingPair(i)}><Trash2 size={16} /></Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addMatchingPair}><Plus className="mr-2 h-4 w-4" /> Eşleştirme Ekle</Button>
              </div>
            )}
             
            {(type === 'true-false' || type === 'open-ended' || type === 'short-answer') && (
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
            <div className="grid grid-cols-2 gap-4">
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger><SelectValue placeholder="Zorluk Derecesi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kolay">Kolay</SelectItem>
                  <SelectItem value="orta">Orta</SelectItem>
                  <SelectItem value="zor">Zor</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Puan" value={points} onChange={e => setPoints(Number(e.target.value))} />
            </div>

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
