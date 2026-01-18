

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bold, Italic, Underline as UnderlineIcon, ImageIcon, 
  Trash2, Save, FileText, Plus, Eye, Printer,
  LayoutTemplate, CheckSquare, Type, CheckCircle, GripVertical, Shuffle, RefreshCw, Palette, Settings, Archive, FolderOpen, Send, X, AlignLeft, CaseUpper, KeySquare, Loader2, FileQuestion, Sparkles, Binary, Search, BookOpen
} from 'lucide-react';
import { Exam, ExamInfo, Question as ExamQuestion, QuestionType, ExamTheme, ExamDocument, Class, Student, TeacherProfile, Kazanım, MatchingPair } from '@/lib/types';
import { useDatabase } from '@/hooks/use-database';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { doc, collection, addDoc, writeBatch, deleteDoc, query } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { AssignExamModal } from './AssignExamModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ExamPaper } from './ExamPaper';
import { useCollection, useMemoFirebase } from '@/firebase';
import { generateQuestion } from '@/ai/flows/generate-questions-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KAZANIMLAR } from '@/lib/kazanimlar';

const KazanımSelector = ({ onSelect }: { onSelect: (kazanim: string) => void }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredKazanims = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g');
        if (!normalizedSearch) return KAZANIMLAR;

        const filtered: { [key: string]: any[] } = {};
        for (const ders in KAZANIMLAR) {
            const uniteler = (KAZANIMLAR[ders] as any[]).map(unite => {
                const konular = unite.konular.map((konu: any) => {
                    const kazanimlar = konu.kazanimlar.filter((kazanim: string) => 
                        kazanim.toLowerCase().replace(/ı/g, 'i').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').includes(normalizedSearch)
                    );
                    return kazanimlar.length > 0 ? { ...konu, kazanimlar } : null;
                }).filter(Boolean);
                return konular.length > 0 ? { ...unite, konular } : null;
            }).filter(Boolean);
            if (uniteler.length > 0) {
                filtered[ders] = uniteler;
            }
        }
        return filtered;
    }, [searchTerm]);

    return (
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Kazanım Seç</DialogTitle>
                <DialogDescription>Soru üretmek için bir kazanım seçin veya arayın.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Kazanım metni içinde ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="flex-1 mt-4">
                <div className="p-1">
                    {Object.entries(filteredKazanims).map(([ders, uniteler]) => (
                        <div key={ders} className="mb-4">
                            <h3 className="text-lg font-bold text-primary px-2 py-1 bg-primary/10 rounded-md">{ders}</h3>
                            <div className="pl-2">
                                {(uniteler as any[]).map(unite => (
                                    <Accordion type="single" collapsible key={unite.unite} className="w-full">
                                        <AccordionItem value={unite.unite}>
                                            <AccordionTrigger className="text-md font-semibold text-gray-800">
                                                {unite.unite}
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                {(unite.konular as any[]).map((konu: any) => (
                                                     <div key={konu.konu} className="ml-4 pl-4 border-l-2 my-2">
                                                        <p className="text-sm font-medium text-gray-600">{konu.konu}</p>
                                                        <div className="pl-2">
                                                            {konu.kazanimlar.map((kazanimText: string, i: number) => (
                                                                <DialogClose asChild key={i}>
                                                                    <div onClick={() => onSelect(kazanimText)} className="text-xs text-gray-700 p-2 rounded-md hover:bg-accent cursor-pointer">
                                                                        {kazanimText}
                                                                    </div>
                                                                </DialogClose>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </DialogContent>
    );
};


// --- ANA BİLEŞEN ---
export default function ExamBuilder({ classes, students }: { classes: Class[], students: Student[] }) {
  const { appUser, storage, db } = useAuth();
  const { toast } = useToast();

  const createNewExam = (): Exam => ({
    examInfo: {
      title: 'Yeni Sınav',
      logo: null,
      group: 'A',
      theme: 'classic',
      settings: { fontSize: 11, lineHeight: 1.5, watermark: '' },
    },
    questions: []
  });

  const [currentExam, setCurrentExam] = useState<Exam>(createNewExam());
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | number | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedKazanım, setSelectedKazanım] = useState<string | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
  const teacherProfile = appUser?.type === 'teacher' ? appUser.profile : null;

  const activeQuestion = currentExam.questions.find(q => q.id === selectedQuestionId);

  const updateExamInfo = (field: keyof ExamInfo, value: any) => {
    setCurrentExam(prev => ({ ...prev, examInfo: { ...prev.examInfo, [field]: value }}));
  };

  const addQuestion = (type: QuestionType, questionData?: Partial<ExamQuestion>) => {
    // Sanitize incoming matchingPairs from AI to ensure unique IDs
    if (questionData && questionData.matchingPairs) {
        const seenIds = new Set<string>();
        questionData.matchingPairs.forEach(p => {
            if (!p.id || seenIds.has(p.id)) {
                p.id = uuidv4();
            }
            seenIds.add(p.id);
        });
    }
    
    const newQuestion: ExamQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      options: type === 'multiple-choice' ? Array(4).fill('') : undefined,
      matchingPairs: type === 'matching' ? [{id: uuidv4(), question: '', answer: ''}, {id: uuidv4(), question: '', answer: ''}] : undefined,
      correctAnswer: null,
      points: 10,
      image: null,
      kazanimId: selectedKazanım || undefined,
      ...questionData,
    };
    setCurrentExam(prev => ({...prev, questions: [...prev.questions, newQuestion]}));
    setSelectedQuestionId(newQuestion.id);
  };
  
  const updateQuestion = (id: string|number, field: keyof ExamQuestion, value: any) => {
    setCurrentExam(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)
    }));
  };

  const deleteQuestion = (id: string | number) => {
    if(!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
    setCurrentExam(prev => ({...prev, questions: prev.questions.filter(q => q.id !== id)}));
    if(selectedQuestionId === id) {
        setSelectedQuestionId(null);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !activeQuestion || !storage || !appUser) return;
      const file = e.target.files[0];
      const reader = new FileReader();
      setIsUploading(true);
      reader.onloadend = async () => {
          const dataUrl = reader.result as string;
          const imageRef = storageRef(storage, `exam_images/${appUser.data.uid}/${Date.now()}_${file.name}`);
          try {
            await uploadString(imageRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(imageRef);
            updateQuestion(activeQuestion.id, 'image', downloadUrl);
            toast({title: "Resim Yüklendi", description: "Resim başarıyla yüklendi ve soruya eklendi."});
          } catch(error) {
            console.error("Image upload error:", error);
            toast({variant: "destructive", title: "Yükleme Hatası", description: "Resim yüklenirken bir hata oluştu."});
          } finally {
            setIsUploading(false);
          }
      };
      reader.readAsDataURL(file);
  };
  
  const handleDeleteImage = async () => {
    if (!activeQuestion?.image || !storage) return;
    try {
        const imageRef = storageRef(storage, activeQuestion.image);
        await deleteObject(imageRef);
        updateQuestion(activeQuestion.id, 'image', null);
        toast({title: "Resim Silindi"});
    } catch(error) {
        if ((error as any).code === 'storage/object-not-found') {
             updateQuestion(activeQuestion.id, 'image', null);
        } else {
            console.error("Image delete error:", error);
            toast({variant: "destructive", title: "Hata", description: "Resim silinemedi."});
        }
    }
  };

   const handleAssignConfirm = async (details: { studentIds: string[], date: string }) => {
      if (!db || !currentExam) return;
  
      const { studentIds, date } = details;
  
      try {
          const batch = writeBatch(db);
          const studentsByClass: { [key: string]: string[] } = {};
          
          studentIds.forEach(studentId => {
              const student = students.find(s => s.id === studentId);
              if (student) {
                  if (!studentsByClass[student.classId]) studentsByClass[student.classId] = [];
                  studentsByClass[student.classId].push(studentId);
              }
          });
  
          for (const classId in studentsByClass) {
              const newHomeworkDoc = {
                  classId: classId,
                  text: currentExam.examInfo.title,
                  assignedDate: new Date().toISOString(),
                  dueDate: date ? new Date(date).toISOString() : null,
                  teacherName: teacherProfile?.name,
                  lessonName: teacherProfile?.branch,
                  rubric: null, 
                  assignedStudents: studentsByClass[classId],
                  seenBy: [],
                  questions: currentExam.questions
              };
              
              const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
              const newDocRef = doc(homeworksColRef);
              batch.set(newDocRef, newHomeworkDoc);
          }
  
          await batch.commit();
          toast({ title: "Başarılı!", description: "Sınav, ödev olarak atandı." });
  
      } catch (error) {
          console.error("Assignment error:", error);
          toast({ variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı.' });
      }
  };
  
  const handleGenerateQuestion = async (type: "multiple-choice" | "true-false" | "open-ended" | "matching") => {
    if (!selectedKazanım) {
        toast({ variant: 'destructive', title: "Kazanım Seçilmedi", description: "Lütfen soru üretmek için bir kazanım seçin." });
        return;
    }

    setIsGeneratingQuestion(true);
    try {
        const generatedQuestion = await generateQuestion({ 
            kazanim: selectedKazanım, 
            type
        });
        addQuestion(type, generatedQuestion);
        toast({ title: "Yapay Zeka Soru Üretti!", description: "Yeni soru listenin sonuna eklendi." });
    } catch(err) {
        console.error("AI question generation error:", err);
        toast({ variant: 'destructive', title: "Yapay Zeka Hatası", description: "Soru üretilemedi. Lütfen tekrar deneyin." });
    } finally {
        setIsGeneratingQuestion(false);
    }
  };


  const totalPoints = currentExam.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const MatchingPairEditor = ({ pair, index, onUpdate, onRemove }: { pair: MatchingPair, index: number, onUpdate: (index: number, field: 'question' | 'answer', value: string) => void, onRemove: (index: number) => void }) => (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
        <span className="text-sm font-semibold">{index + 1}.</span>
        <Input placeholder="Kavram" value={pair.question} onChange={(e) => onUpdate(index, 'question', e.target.value)} />
        <Input placeholder="Açıklama" value={pair.answer} onChange={(e) => onUpdate(index, 'answer', e.target.value)} />
        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => onRemove(index)}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );

  const handleUpdateMatchingPair = (index: number, field: 'question' | 'answer', value: string) => {
    if (!activeQuestion || activeQuestion.type !== 'matching') return;
    const newPairs = [...(activeQuestion.matchingPairs || [])];
    newPairs[index] = { ...newPairs[index], [field]: value };
    updateQuestion(activeQuestion.id, 'matchingPairs', newPairs);
  };

  const handleAddMatchingPair = () => {
    if (!activeQuestion || activeQuestion.type !== 'matching') return;
    const newPairs = [...(activeQuestion.matchingPairs || []), { id: uuidv4(), question: '', answer: '' }];
    updateQuestion(activeQuestion.id, 'matchingPairs', newPairs);
  };

  const handleRemoveMatchingPair = (index: number) => {
    if (!activeQuestion || activeQuestion.type !== 'matching') return;
    const newPairs = (activeQuestion.matchingPairs || []).filter((_, i) => i !== index);
    updateQuestion(activeQuestion.id, 'matchingPairs', newPairs);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-gray-50 gap-4">
      
      {/* SOL PANEL - Ayarlar ve Soru Listesi */}
      <div className="w-full md:w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
            <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>Kazanım ve Yapay Zeka</CardTitle>
                <CardDescription>Soru üretmek için bir kazanım seçin.</CardDescription>
            </CardHeader>
            <CardContent className='flex-1 flex flex-col space-y-3'>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal truncate">
                            <BookOpen className="mr-2 h-4 w-4 flex-shrink-0"/>
                            <span className="truncate">
                                {selectedKazanım || "Kazanım seçmek için tıklayın..."}
                            </span>
                        </Button>
                    </DialogTrigger>
                    <KazanımSelector onSelect={setSelectedKazanım} />
                </Dialog>
                
                 <div className="flex flex-wrap gap-2 border-t pt-3">
                    <Button onClick={() => handleGenerateQuestion('multiple-choice')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Çoktan Seçmeli</Button>
                    <Button onClick={() => handleGenerateQuestion('open-ended')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Açık Uçlu</Button>
                    <Button onClick={() => handleGenerateQuestion('matching')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Eşleştirme</Button>
                    {isGeneratingQuestion && <Loader2 className="h-4 w-4 animate-spin"/>}
                </div>
            </CardContent>
        </Card>
        <Card className="flex-1 flex flex-col">
            <CardHeader className='pb-2 flex-row justify-between items-center'>
                <CardTitle className='text-lg'>Sınav Bilgileri</CardTitle>
                 <div className='text-sm font-bold text-center p-2 bg-slate-100 rounded-md'>Puan: {totalPoints}</div>
            </CardHeader>
            <CardContent className='space-y-2 flex-1 flex flex-col'>
                <Input placeholder="Sınav Başlığı" value={currentExam.examInfo.title} onChange={e => updateExamInfo('title', e.target.value)} />
                 <div className='flex-1 space-y-2 overflow-y-auto pr-2 mt-2'>
                    {currentExam.questions.map((q, index) => (
                        <div key={q.id} onClick={() => setSelectedQuestionId(q.id)} className={`p-2 border rounded-md cursor-pointer ${selectedQuestionId === q.id ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-slate-50'}`}>
                            <div className='flex justify-between items-center'>
                                <span className='text-sm font-semibold'>Soru {index + 1} ({q.points || 0} Puan)</span>
                                <Trash2 className='h-4 w-4 text-red-500 hover:text-red-700' onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id)}}/>
                            </div>
                            <p className='text-xs text-gray-500 truncate'>{q.image ? "[Resimli Soru]" : (q.text || "Boş soru...")}</p>
                        </div>
                    ))}
                </div>
                <div className='grid grid-cols-2 gap-2 pt-2 border-t'>
                    <Button variant="outline" onClick={() => addQuestion('multiple-choice')}><CheckSquare className='mr-2'/>Test</Button>
                    <Button variant="outline" onClick={() => addQuestion('open-ended')}><AlignLeft className='mr-2'/>Açık Uçlu</Button>
                    <Button variant="outline" onClick={() => addQuestion('true-false')}><Binary className='mr-2'/>D/Y</Button>
                    <Button variant="outline" onClick={() => addQuestion('matching')}><Shuffle className='mr-2'/>Eşleştirme</Button>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="flex-1"><Eye className='mr-2'/>Önizleme</Button>
                    <Button onClick={() => setIsAssignModalOpen(true)} className="flex-1"><Send className='mr-2'/>Ata & Yayınla</Button>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* SAĞ PANEL - Soru Editörü */}
      <div className="flex-1 p-0 overflow-y-auto">
        {activeQuestion ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6 h-full">
            <div>
              <Label htmlFor="questionText" className="text-lg font-semibold">Soru Metni</Label>
              <div className="flex gap-2 items-center mt-2 mb-4">
                  <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <><Loader2 className="animate-spin mr-2"/> Yükleniyor...</> : <><ImageIcon className="mr-2"/> Resim Ekle</>}
                  </Button>
                  {activeQuestion.image && (
                     <Button variant="destructive" size="sm" onClick={handleDeleteImage}><Trash2 className="mr-2"/> Resmi Sil</Button>
                  )}
              </div>
              {activeQuestion.image && (
                <div className="mb-4 p-2 border rounded-md flex justify-center bg-gray-50">
                    <img src={activeQuestion.image} alt="Soru görseli" className="max-w-full max-h-80 object-contain rounded" />
                </div>
              )}
              <Textarea id="questionText" value={activeQuestion.text} onChange={e => updateQuestion(activeQuestion.id, 'text', e.target.value)} rows={5} className="mt-2" placeholder='Sorunuzu buraya yazın ya da bir resim ekleyin...'/>
            </div>
            
            {activeQuestion.type === 'multiple-choice' && (
                <div>
                    <Label className="text-lg font-semibold">Seçenekler</Label>
                    <div className='mt-2 space-y-3'>
                        {(activeQuestion.options || []).map((opt, i) => (
                             <div key={i} className="flex items-center gap-2">
                                <Label htmlFor={`option-${i}`} className='p-2 bg-slate-100 rounded-md'>{String.fromCharCode(65 + i)})</Label>
                                <Input id={`option-${i}`} value={opt} onChange={e => {
                                    const newOptions = [...(activeQuestion.options || [])];
                                    newOptions[i] = e.target.value;
                                    updateQuestion(activeQuestion.id, 'options', newOptions);
                                }}/>
                                <RadioGroup value={activeQuestion.correctAnswer === opt ? 'correct' : ''} onValueChange={() => updateQuestion(activeQuestion.id, 'correctAnswer', opt)}>
                                    <RadioGroupItem value="correct" id={`correct-${i}`}/>
                                </RadioGroup>
                             </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeQuestion.type === 'true-false' && (
                <div>
                    <Label className="text-lg font-semibold">Doğru Cevap</Label>
                    <RadioGroup value={activeQuestion.correctAnswer === true ? 'true' : activeQuestion.correctAnswer === false ? 'false' : ''} onValueChange={(val) => updateQuestion(activeQuestion.id, 'correctAnswer', val === 'true')}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="true" id="true-opt" /><Label htmlFor="true-opt">Doğru</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="false" id="false-opt" /><Label htmlFor="false-opt">Yanlış</Label></div>
                    </RadioGroup>
                </div>
            )}

            {activeQuestion.type === 'matching' && (
                <div>
                    <Label className="text-lg font-semibold">Eşleştirme Çiftleri</Label>
                    <div className='mt-2 space-y-2'>
                        {(activeQuestion.matchingPairs || []).map((pair, i) => (
                           <MatchingPairEditor key={`${pair.id || 'pair'}-${i}`} pair={pair} index={i} onUpdate={handleUpdateMatchingPair} onRemove={handleRemoveMatchingPair} />
                        ))}
                         <Button variant="outline" size="sm" onClick={handleAddMatchingPair} className="mt-2"><Plus className="mr-2 h-4 w-4"/>Çift Ekle</Button>
                    </div>
                </div>
            )}

            {(activeQuestion.type === 'short-answer' || activeQuestion.type === 'open-ended') && (
                <div>
                    <Label className="text-lg font-semibold">Cevap Anahtarı (Opsiyonel)</Label>
                    <Textarea value={activeQuestion.correctAnswer as string || ''} onChange={e => updateQuestion(activeQuestion.id, 'correctAnswer', e.target.value)} rows={2} className="mt-2" placeholder='İdeal cevabı veya anahtar kelimeleri yazın...'/>
                </div>
            )}

             <div>
              <Label htmlFor="questionPoints" className="text-lg font-semibold">Puan</Label>
              <Input id="questionPoints" type="number" value={activeQuestion.points} onChange={e => updateQuestion(activeQuestion.id, 'points', parseInt(e.target.value) || 0)} className="mt-2 w-24"/>
            </div>

          </div>
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <Card className='p-8 text-center border-dashed'>
                <CardHeader>
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <FileQuestion className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Soru Bankası ve Sınav Oluşturucu</CardTitle>
                    <CardDescription>
                        Soldaki menüden kazanım seçip soru üretin veya manuel olarak yeni soru ekleyin.
                    </CardDescription>
                </CardHeader>
            </Card>
          </div>
        )}
      </div>

      <AssignExamModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        exam={currentExam}
        onConfirm={handleAssignConfirm}
        classes={classes}
        students={students}
      />

      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center overflow-y-auto py-10">
            <div className="relative">
                <button onClick={() => setIsPreviewOpen(false)} className="fixed top-5 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition"><X size={24} /></button>
                <button onClick={() => setShowAnswerKey(!showAnswerKey)} className="fixed top-20 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition">
                    <KeySquare size={24} className={showAnswerKey ? 'text-blue-600' : ''}/>
                </button>
                <ExamPaper exam={currentExam} showAnswerKey={showAnswerKey} />
            </div>
        </div>
      )}
    </div>
  );
}
