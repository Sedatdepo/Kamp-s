

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Question, Kazanım, MatchingPair, TeacherProfile } from '@/lib/types';
import { collection, query, where, addDoc, deleteDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, FileQuestion, BookOpen, Library, Check, GripVertical, Image as ImageIcon, Type, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { exportQuestionToRtf, exportExamToRtf } from '@/lib/word-export';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { QuestionCanvas } from './QuestionCanvas';
import { fabric } from 'fabric';
import { Rnd } from 'react-rnd';

// --- KAZANIM YÖNETİCİSİ ---
const KazanımManager = ({ teacherId }: { teacherId: string }) => {
  const { db } = useAuth();
  const { toast } = useToast();
  
  const kazanimsQuery = useMemo(() => (db ? query(collection(db, 'kazanims'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
  const { data: kazanims, loading } = useFirestore<Kazanım[]>(`kazanims-for-teacher-${teacherId}`, kazanimsQuery);

  const [selectedDers, setSelectedDers] = useState(Object.keys(KAZANIMLAR)[0]);

  const handleAddKazanım = async (kazanimText: string) => {
    if (!db) return;
    if (kazanims.some(k => k.text === kazanimText)) {
        toast({ title: 'Bu kazanım zaten ekli.', variant: 'default' });
        return;
    }
    await addDoc(collection(db, 'kazanims'), { text: kazanimText, teacherId });
    toast({ title: 'Kazanım eklendi.' });
  };
  
  const handleBulkAddKazanım = async (kazanimList: { unite: string, konular: { konu: string, kazanimlar: string[] }[] }) => {
    // This function implementation seems to be missing in the original code,
    // so I will leave it as is.
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


const QuestionBank = ({ teacherId }: { teacherId: string }) => {
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

  const handleTypeChange = (newType: Question['type']) => {
    setType(newType);
    setCorrectAnswer('');
    setOptions(['', '', '', '']);
    setMatchingPairs([{ id: `pair_${Date.now()}`, question: '', answer: '' }]);
  };


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
      const newDocRef = doc(collection(db, "questions"));
      await setDoc(newDocRef, { ...questionData, id: newDocRef.id});
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

  const handleExportQuestion = (question: Question) => {
    const canvas = document.createElement('canvas');
    const fabricCanvas = new (fabric as any).Canvas(canvas, { width: 800, height: 600 });
    try {
        JSON.parse(question.text); 
        fabricCanvas.loadFromJSON(question.text, () => {
            const dataUrl = fabricCanvas.toDataURL({ format: 'png' });
            exportQuestionToRtf(question, dataUrl);
            fabricCanvas.dispose();
        });
    } catch(e) {
        exportQuestionToRtf(question, null);
        fabricCanvas.dispose();
    }
  }

  const isLoading = questionsLoading || kazanimsLoading;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileQuestion /> {editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <QuestionCanvas initialContent={text} onContentChange={setText} />

            <Select value={type} onValueChange={(v: any) => handleTypeChange(v)}>
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
      <div className="lg:col-span-1 space-y-6">
        <KazanımManager teacherId={teacherId} />
        <Card>
          <CardHeader>
            <CardTitle>Soru Bankası</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Loader2 className="animate-spin"/> : (
            <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Soru</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map(q => (
                      <TableRow key={q.id}>
                        <TableCell className="max-w-xs truncate cursor-pointer" onClick={() => handleEdit(q)}>
                            <p className="font-medium">
                                 {(() => {
                                try {
                                  JSON.parse(q.text);
                                  return "[Görsel Soru]";
                                } catch (e) {
                                  return q.text;
                                }
                              })()}
                            </p>
                            <p className="text-xs text-muted-foreground">{kazanims.find(k => k.id === q.kazanimId)?.text || 'N/A'}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(q)}><Edit size={16} /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleExportQuestion(q)}><Download size={16}/></Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(q.id)}><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ExamItem extends Question {
  x: number;
  y: number;
  width: number;
  height: number;
}

const QuestionPreview = ({ content }: { content: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const staticCanvas = new fabric.StaticCanvas(canvas, {
             backgroundColor: 'transparent'
        });

        try {
            const json = JSON.parse(content);
            staticCanvas.loadFromJSON(json, () => {
                const objects = staticCanvas.getObjects();
                if (objects.length > 0) {
                    const boundingBox = staticCanvas.getObjects().reduce((acc, obj) => {
                      const objBounds = obj.getBoundingRect();
                      if (!acc) return objBounds;
                      return {
                        left: Math.min(acc.left, objBounds.left),
                        top: Math.min(acc.top, objBounds.top),
                        width: Math.max(acc.left + acc.width, objBounds.left + objBounds.width) - Math.min(acc.left, objBounds.left),
                        height: Math.max(acc.top + acc.height, objBounds.top + objBounds.height) - Math.min(acc.top, objBounds.top)
                      };
                    }, null as fabric.Rect | null);

                    if (boundingBox) {
                        staticCanvas.setWidth(boundingBox.width);
                        staticCanvas.setHeight(boundingBox.height);
                    }
                }
                staticCanvas.renderAll();
            });
        } catch (e) {
            staticCanvas.clear();
            const text = new fabric.Text(content, {
                fontSize: 12,
                originX: 'left',
                originY: 'top',
                fill: '#333'
            });
            staticCanvas.setWidth(text.width || 200);
            staticCanvas.setHeight(text.height || 50);
            staticCanvas.add(text);
            staticCanvas.renderAll();
        }

        return () => {
            staticCanvas.dispose();
        };

    }, [content]);

    return <canvas ref={canvasRef} />;
}

const ExamCreator = ({ teacherId, teacherProfile }: { teacherId: string, teacherProfile: TeacherProfile | null }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    const questionsQuery = useMemo(() => (db ? query(collection(db, 'questions'), where('teacherId', '==', teacherId)) : null), [db, teacherId]);
    const { data: questions, loading: questionsLoading } = useFirestore<Question[]>(`questions-for-creator-${teacherId}`, questionsQuery);

    const [examItems, setExamItems] = useState<ExamItem[]>([]);
    const [examTitle, setExamTitle] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    
    const [examSettings, setExamSettings] = useState({
        showTeacher: true,
        showDepartmentHead: false,
        showPrincipal: false,
        departmentHeadName: '',
        columns: '1',
    });
    
    useEffect(() => {
        setExamSettings(prev => ({
            ...prev
        }));
    }, [teacherProfile]);
    
    const handleSettingsChange = (field: keyof typeof examSettings, value: string | boolean) => {
        setExamSettings(prev => ({...prev, [field]: value}));
    };

    const handleSelectQuestion = (question: Question, isSelected: boolean) => {
        if (isSelected) {
            const newItem: ExamItem = {
                ...question,
                x: 50,
                y: 50,
                width: 400,
                height: 200,
            };
            setExamItems(prev => [...prev, newItem]);
        } else {
            setExamItems(prev => prev.filter(q => q.id !== question.id));
        }
    }
    
    const handleUpdateItem = (id: string, updates: Partial<ExamItem>) => {
      setExamItems(prev => prev.map(item => item.id === id ? {...item, ...updates} : item));
    }
    
    const handleRemoveItem = (id: string) => {
      setExamItems(prev => prev.filter(item => item.id !== id));
    };

    const totalPoints = useMemo(() => {
        return examItems.reduce((sum, q) => sum + (q.points || 0), 0);
    }, [examItems]);
    
    const getShortText = (text: string) => {
        try {
            JSON.parse(text);
            return "[Görsel Soru]";
        } catch (e) {
            return text.substring(0, 50) + (text.length > 50 ? "..." : "");
        }
    }

    const difficultyBadgeVariant = (difficulty: 'kolay' | 'orta' | 'zor') => {
        switch(difficulty) {
            case 'kolay': return 'default';
            case 'orta': return 'secondary';
            case 'zor': return 'destructive';
            default: return 'outline';
        }
    }

    const handleDownloadExam = async () => {
        if (!teacherProfile) {
            toast({ title: 'Hata', description: 'Öğretmen profili yüklenemedi.', variant: 'destructive' });
            return;
        }

        setIsDownloading(true);
        toast({ title: 'İndirme Başlatıldı', description: 'Sınav belgeniz hazırlanıyor...' });

        const imageDataUrls: { [questionId: string]: string | null } = {};

        for (const item of examItems) {
            try {
                JSON.parse(item.text);
                const tempCanvas = document.createElement('canvas');
                const fabricCanvas = new fabric.StaticCanvas(tempCanvas, {
                    width: item.width,
                    height: item.height,
                });
                
                await new Promise<void>((resolve) => {
                    fabricCanvas.loadFromJSON(item.text, () => {
                        fabricCanvas.renderAll();
                        const dataUrl = fabricCanvas.toDataURL({ format: 'png' });
                        imageDataUrls[item.id] = dataUrl;
                        fabricCanvas.dispose();
                        resolve();
                    });
                });

            } catch (e) {
                imageDataUrls[item.id] = null;
            }
        }
        
        exportExamToRtf({
            questions: examItems,
            imageDataUrls,
            examTitle,
            schoolName: teacherProfile.schoolName,
            academicYear: teacherProfile.reportConfig?.academicYear || '2024-2025',
            lessonName: teacherProfile.branch,
            className: teacherProfile.reportConfig?.className || '',
            teacherName: teacherProfile.name,
            principalName: teacherProfile.principalName,
            ...examSettings,
        });

        setIsDownloading(false);
    };

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Soru Bankası</CardTitle>
                        <CardDescription>Sınava eklemek için soruları seçin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh] border rounded-md p-2">
                             {questionsLoading ? <Loader2 className="animate-spin m-auto"/> : questions.map(q => (
                                <div key={q.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted">
                                    <Checkbox 
                                        id={`q-creator-${q.id}`} 
                                        onCheckedChange={(checked) => handleSelectQuestion(q, !!checked)}
                                        checked={examItems.some(sq => sq.id === q.id)}
                                        className="mt-1"
                                    />
                                    <label htmlFor={`q-creator-${q.id}`} className="text-sm font-medium leading-none flex-1 cursor-pointer">
                                        <p>{getShortText(q.text)}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">{q.type}</Badge>
                                            <Badge variant={difficultyBadgeVariant(q.difficulty)}>{q.difficulty}</Badge>
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-9">
                 <Card>
                    <CardHeader>
                        <CardTitle>Sınav Kağıdı Tasarımı</CardTitle>
                        <CardDescription>Soruları A4 kağıdı üzerinde istediğiniz gibi konumlandırın ve boyutlandırın.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input placeholder="Sınav Başlığı (örn: 1. Dönem 2. Yazılı)" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                             <Card>
                                <CardHeader><CardTitle className="text-base">Sınav Kağıdı Ayarları</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                     <div className="grid grid-cols-2 gap-4">
                                        <div>
                                             <Label>Sütun Sayısı</Label>
                                             <Select value={examSettings.columns} onValueChange={(v) => handleSettingsChange('columns', v)}>
                                                 <SelectTrigger>
                                                     <SelectValue />
                                                 </SelectTrigger>
                                                 <SelectContent>
                                                     <SelectItem value="1">Tek Sütun</SelectItem>
                                                     <SelectItem value="2">İki Sütun</SelectItem>
                                                 </SelectContent>
                                             </Select>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4 space-y-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="showTeacher" checked={examSettings.showTeacher} onCheckedChange={(checked) => handleSettingsChange('showTeacher', !!checked)} />
                                            <Label htmlFor="showTeacher">Öğretmen İmzası</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="showDeptHead" checked={examSettings.showDepartmentHead} onCheckedChange={(checked) => handleSettingsChange('showDepartmentHead', !!checked)} />
                                            <div className='flex-1'><Label htmlFor="showDeptHead">Zümre Başkanı İmzası</Label><Input className='h-7 mt-1 text-xs' placeholder="Zümre Başkanı Adı" value={examSettings.departmentHeadName} onChange={e => handleSettingsChange('departmentHeadName', e.target.value)} disabled={!examSettings.showDepartmentHead}/></div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="showPrincipal" checked={examSettings.showPrincipal} onCheckedChange={(checked) => handleSettingsChange('showPrincipal', !!checked)} />
                                            <Label htmlFor="showPrincipal">Okul Müdürü İmzası</Label>
                                        </div>
                                    </div>
                                </CardContent>
                             </Card>
                            <div className="relative w-full aspect-[1/1.414] bg-white shadow-lg mx-auto border overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
                              {examItems.map((item, index) => (
                                <Rnd
                                  key={item.id}
                                  size={{ width: item.width, height: item.height }}
                                  position={{ x: item.x, y: item.y }}
                                  onDragStop={(e, d) => handleUpdateItem(item.id, { x: d.x, y: d.y })}
                                  onResizeStop={(e, direction, ref, delta, position) => {
                                    handleUpdateItem(item.id, {
                                      width: parseInt(ref.style.width),
                                      height: parseInt(ref.style.height),
                                      ...position,
                                    });
                                  }}
                                  bounds="parent"
                                  className="border border-dashed border-blue-400 bg-white/50 p-2"
                                >
                                  <div className="w-full h-full relative group/item overflow-hidden">
                                     <QuestionPreview content={item.text} />
                                    <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-5 w-5 opacity-0 group-hover/item:opacity-100" onClick={() => handleRemoveItem(item.id)}><Trash2 size={12}/></Button>
                                  </div>
                                </Rnd>
                              ))}
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleDownloadExam} className="w-full" disabled={isDownloading}>
                                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                    Sınavı İndir (Word)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        </div>
        </>
    );
};


export function QuestionBankTab({ teacherId, teacherProfile }: { teacherId: string, teacherProfile: TeacherProfile | null }) {
  return (
    <Tabs defaultValue="bank">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank">Soru Bankası</TabsTrigger>
            <TabsTrigger value="creator">Sınav Oluşturucu</TabsTrigger>
        </TabsList>
        <TabsContent value="bank" className="mt-4">
            <QuestionBank teacherId={teacherId} />
        </TabsContent>
        <TabsContent value="creator" className="mt-4">
            <ExamCreator teacherId={teacherId} teacherProfile={teacherProfile}/>
        </TabsContent>
    </Tabs>
  );
}
