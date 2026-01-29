'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, PlusCircle, Trash2, FileDown, Loader2, Search, Plus, X, Check, ChevronsUpDown, AlignLeft, CheckSquare, Binary, Shuffle, ImageIcon, Send, Paperclip, Eye, KeySquare, FileQuestion
} from 'lucide-react';
import { TeacherProfile, Class, Student, AssignmentTemplate, Question, QuestionType, MatchingPair } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario, GenerateAssignmentScenarioInput, GenerateAssignmentScenarioOutput } from '@/ai/flows/generate-assignment-scenario-flow';
import { generateMaterial, GenerateMaterialInput, GenerateMaterialOutput } from '@/ai/flows/generate-material-flow';
import { exportGeneratedMaterialToRtf, exportMaterialToRtf } from '@/lib/word-export';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateQuestion } from '@/ai/flows/generate-questions-flow';
import { AssignExamModal } from './AssignExamModal';
import { Exam, ExamInfo, ExamTheme } from '@/lib/types';
import { ExamPaper } from './ExamPaper';
import { useAuth } from '@/hooks/useAuth';
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import EdebiyatSinavAsistaniTab from './EdebiyatSinavAsistaniTab';

// --- SUB-COMPONENTS ---

const MaterialCreator = ({ teacherProfile }: { teacherProfile: TeacherProfile | null }) => {
    const { toast } = useToast();
    
    // Selection States
    const [selectedLesson, setSelectedLesson] = useState("Fizik");
    const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
    const [selectedOutcome, setSelectedOutcome] = useState('');
    
    // Generation Type States
    const [generationType, setGenerationType] = useState<'assignment' | 'material'>('assignment');
    const [selectedTaskType, setSelectedTaskType] = useState<"performance" | "project">("performance");
    const [selectedTaskSubtype, setSelectedTaskSubtype] = useState(TASK_TYPES.performance.subtypes[0]);
    
    // Process States
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any | null>(null);

    const currentGradeData = KAZANIMLAR[selectedLesson][selectedGradeIndex];
    const currentTopic = currentGradeData?.konular[selectedTopicIndex];

    // Reset subordinate selections when a primary selection changes
    useEffect(() => { setSelectedGradeIndex(0); setSelectedTopicIndex(0); }, [selectedLesson]);
    useEffect(() => { setSelectedTopicIndex(0); }, [selectedGradeIndex]);
    useEffect(() => {
        if (currentTopic && currentTopic.kazanimlar.length > 0) {
            setSelectedOutcome(currentTopic.kazanimlar[0]);
        } else {
            setSelectedOutcome('');
        }
    }, [currentTopic]);
    useEffect(() => { setSelectedTaskSubtype(TASK_TYPES[selectedTaskType].subtypes[0]); }, [selectedTaskType]);

    const handleGenerate = async () => {
        if (!currentTopic || !selectedOutcome) {
            toast({ title: "Eksik Seçim", description: "Lütfen bir ders, sınıf, konu ve kazanım seçin.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        setGeneratedContent(null);
        try {
            if (generationType === 'assignment') {
                const input: GenerateAssignmentScenarioInput = {
                    lesson: selectedLesson,
                    grade: currentGradeData.unite,
                    topic: currentTopic.konu,
                    outcome: selectedOutcome,
                    taskType: TASK_TYPES[selectedTaskType].label,
                    taskSubtype: selectedTaskSubtype
                };
                const response = await generateAssignmentScenario(input);
                setGeneratedContent(response);
            } else { // 'material'
                const input: GenerateMaterialInput = {
                    course: selectedLesson,
                    grade: currentGradeData.unite.match(/\d+/)?.[0] || '9',
                    topic: currentTopic.konu
                };
                const response = await generateMaterial(input);
                setGeneratedContent(response);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            toast({ title: "Yapay Zeka Hatası", description: "İçerik oluşturulurken bir hata oluştu.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleExport = () => {
        if (!generatedContent) {
          toast({ title: "İçerik Yok", description: "Lütfen önce bir materyal oluşturun.", variant: "destructive" });
          return;
        }
        if ('taskTitle' in generatedContent) { // This is an Assignment
          exportMaterialToRtf({ task: generatedContent, teacherProfile });
        } else { // This is a full Material set
          exportGeneratedMaterialToRtf({ content: generatedContent, teacherProfile });
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><GraduationCap /> 1. Kaynak Seçimi</CardTitle>
                        <CardDescription>Materyal üretmek için ders, konu ve kazanım seçin.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Ders</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {Object.keys(KAZANIMLAR).map(lesson => (
                                    <Button key={lesson} onClick={() => setSelectedLesson(lesson)} variant={selectedLesson === lesson ? 'default' : 'outline'}>{lesson}</Button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label>Sınıf Seviyesi</Label>
                            <select value={selectedGradeIndex} onChange={(e) => setSelectedGradeIndex(parseInt(e.target.value))} className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                {KAZANIMLAR[selectedLesson].map((gradeData: any, idx: number) => (<option key={idx} value={idx}>{gradeData.unite}</option>))}
                            </select>
                        </div>
                        <div>
                            <Label>Konu</Label>
                            <select value={selectedTopicIndex} onChange={(e) => setSelectedTopicIndex(parseInt(e.target.value))} className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                {currentGradeData?.konular.map((t: any, idx: number) => (<option key={idx} value={idx}>{t.konu}</option>))}
                            </select>
                        </div>
                        <div>
                            <Label>Hedeflenen Kazanım</Label>
                            <select value={selectedOutcome} onChange={(e) => setSelectedOutcome(e.target.value)} className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 h-24" multiple={false} size={5}>
                                {currentTopic?.kazanimlar.map((outcome: string, idx: number) => (
                                    <option key={idx} value={outcome}>{outcome.length > 80 ? outcome.substring(0, 80) + '...' : outcome}</option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Cpu /> 2. Üretim Ayarları</CardTitle>
                        <CardDescription>Ne tür bir materyal oluşturmak istersiniz?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <select value={generationType} onChange={e => setGenerationType(e.target.value as any)} className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg">
                            <option value="assignment">Performans/Proje Görev Senaryosu</option>
                            <option value="material">Ders Materyali (Sunu, Test vb.)</option>
                        </select>
                        
                        {generationType === 'assignment' && (
                            <>
                                <div>
                                    <Label>Ödev Türü</Label>
                                    <select value={selectedTaskType} onChange={e => setSelectedTaskType(e.target.value as any)} className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-lg">
                                        {Object.entries(TASK_TYPES).map(([key, value]) => (<option key={key} value={key}>{value.label}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Ödev Alt Türü</Label>
                                    <select value={selectedTaskSubtype} onChange={e => setSelectedTaskSubtype(e.target.value)} className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-300 rounded-lg">
                                        {TASK_TYPES[selectedTaskType].subtypes.map(subtype => (<option key={subtype} value={subtype}>{subtype}</option>))}
                                    </select>
                                </div>
                            </>
                        )}
                        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            AI ile Oluştur
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-8">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-8">
                         <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                         <h3 className="text-xl font-bold text-slate-600 mb-2">İçerik Üretiliyor...</h3>
                         <p className="text-center max-w-md text-slate-500">Yapay zeka sizin için en uygun materyali hazırlıyor. Bu işlem biraz zaman alabilir.</p>
                    </div>
                ) : generatedContent ? (
                     <div className="space-y-6">
                        <div className="flex justify-end">
                            <Button onClick={handleExport} variant="outline">
                                <FileDown className="mr-2 h-4 w-4" /> RTF Olarak İndir
                            </Button>
                        </div>
                        {generatedContent.taskTitle ? <RenderedAssignment content={generatedContent} /> : <RenderedMaterial content={generatedContent} />}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-8">
                        <div className="bg-slate-100 p-8 rounded-full mb-6 border border-slate-200">
                            <Sparkles className="w-16 h-16 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-600 mb-2">Materyal Oluşturmaya Başlayın</h3>
                        <p className="text-center max-w-md text-slate-500">
                            Sol menüden seçimlerinizi yapın ve "AI ile Oluştur" butonuna tıklayarak dersinize özel materyaller üretin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TASK_TYPES = {
    performance: {
        label: "Performans Görevi",
        subtypes: ["Derse Hazırlık", "Pekiştirici", "Geliştirmeye Yönelik", "Düzeltmeye Yönelik"]
    },
    project: {
        label: "Proje Ödevi",
        subtypes: ["Yapı/Maket Projesi", "Deneysel/Araştırma Projesi"]
    }
};

const RenderedAssignment = ({ content }: { content: GenerateAssignmentScenarioOutput }) => (
    <Card>
        <CardHeader>
            <CardTitle>{content.taskTitle}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-lg whitespace-pre-wrap">{content.taskDescription}</p>
        </CardContent>
    </Card>
);

const RenderedMaterial = ({ content }: { content: GenerateMaterialOutput }) => (
    <div className="space-y-6">
        <Card>
            <CardHeader><CardTitle>Ders Planı</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-bold text-lg">1. Ders Saati</h4>
                    <p className="text-sm text-muted-foreground">{content.lessonPlan.hour1.objective}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        {content.lessonPlan.hour1.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-bold text-lg">2. Ders Saati</h4>
                    <p className="text-sm text-muted-foreground">{content.lessonPlan.hour2.objective}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                        {content.lessonPlan.hour2.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
        <div>
            <h3 className="text-xl font-bold mb-2">Sunum Slaytları</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(content.slides || []).map((slide, i) => (
                    <Card key={i} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-base">{slide.title}</CardTitle>
                            {slide.subtitle && <CardDescription>{slide.subtitle}</CardDescription>}
                        </CardHeader>
                        <CardContent className="flex-grow">
                           {slide.type === 'quiz' && (
                                <div className="space-y-2">
                                    <p className="font-semibold">{slide.question}</p>
                                    <ul className="list-disc pl-5 text-sm">
                                        {(slide.options || []).map((opt, idx) => <li key={idx}>{opt}</li>)}
                                    </ul>
                                </div>
                            )}
                            {slide.content && <p className="text-sm">{slide.content}</p>}
                            {slide.points && (
                                <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                                    {slide.points.map((p, idx) => <li key={idx}>{p}</li>)}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold mb-2">Bilgi Kartları (Flashcards)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(content.flashcardsData || []).map((card, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <p className="font-semibold">{i+1}. Soru: {card.q}</p>
                            <p className="text-sm mt-1">Cevap: {card.a}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
);


const ExamBuilderComponent = ({ classes, students }: { classes: Class[], students: Student[] }) => {
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
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState<string | number | null>(null);
    const [questionIdForImageUpload, setQuestionIdForImageUpload] = useState<string | number | null>(null);
    
    const [selectedKazanım, setSelectedKazanım] = useState<string | null>(null);
    const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

    const activeQuestion = currentExam.questions.find(q => q.id === selectedQuestionId);

    const updateExamInfo = (field: keyof ExamInfo, value: any) => {
        setCurrentExam(prev => ({ ...prev, examInfo: { ...prev.examInfo, [field]: value }}));
    };

    const addQuestion = (type: QuestionType, questionData?: Partial<Question>) => {
        if (questionData && questionData.matchingPairs) {
            const seenIds = new Set<string>();
            questionData.matchingPairs.forEach(p => {
                if (!p.id || seenIds.has(p.id)) {
                    p.id = uuidv4();
                }
                seenIds.add(p.id);
            });
        }
        
        const newQuestion: Question = {
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
  
    const updateQuestion = (id: string|number, field: keyof Question, value: any) => {
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
  
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, qId: string | number) => {
        if (!e.target.files || !storage || !appUser) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        setIsUploading(qId);
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const imageRef = storageRef(storage, `exam_images/${appUser.data.uid}/${Date.now()}_${file.name}`);
            try {
                await uploadString(imageRef, dataUrl, 'data_url');
                const downloadUrl = await getDownloadURL(imageRef);
                updateQuestion(qId, 'image', downloadUrl);
                toast({title: "Resim Yüklendi"});
            } catch(error) {
                toast({variant: "destructive", title: "Yükleme Hatası"});
            } finally {
                setIsUploading(null);
            }
        };
        reader.readAsDataURL(file);
    };
  
    const handleDeleteImage = async (qId: string | number, imageUrl: string) => {
        if (!storage) return;
        try {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
            updateQuestion(qId, 'image', null);
            toast({title: "Resim Silindi"});
        } catch(error) {
           if ((error as any).code !== 'storage/object-not-found') {
                toast({variant: "destructive", title: "Hata", description: "Resim silinemedi."});
           }
            updateQuestion(qId, 'image', null);
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
                    teacherName: appUser?.profile?.name,
                    lessonName: appUser?.profile?.branch,
                    rubric: null, 
                    assignedStudents: studentsByClass[classId],
                    seenBy: [],
                    questions: currentExam.questions
                };
                const cleanDoc = JSON.parse(JSON.stringify(newHomeworkDoc));
                const homeworksColRef = collection(db, 'classes', classId, 'homeworks');
                const newDocRef = doc(homeworksColRef);
                batch.set(newDocRef, cleanDoc);
            }
            await batch.commit();
            toast({ title: "Başarılı!", description: "Sınav, ödev olarak atandı." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı.' });
        }
    };
  
    const handleGenerateQuestion = async (type: "multiple-choice" | "true-false" | "open-ended" | "matching") => {
        if (!selectedKazanım) {
            toast({ variant: 'destructive', title: "Kazanım Seçilmedi"});
            return;
        }
        setIsGeneratingQuestion(true);
        try {
            const generatedQuestion = await generateQuestion({ kazanim: selectedKazanım, type });
            addQuestion(type, generatedQuestion);
            toast({ title: "Yapay Zeka Soru Üretti!" });
        } catch(err) {
            toast({ variant: 'destructive', title: "Yapay Zeka Hatası"});
        } finally {
            setIsGeneratingQuestion(false);
        }
    };

    const totalPoints = currentExam.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    
    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] bg-gray-50 gap-4">
          <div className="w-full md:w-96 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col">
                <CardHeader className='pb-2'><CardTitle className='text-lg'>Kazanım ve Yapay Zeka</CardTitle></CardHeader>
                <CardContent className='flex-1 flex flex-col space-y-3'>
                    <Dialog><DialogTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal truncate"><BookOpen className="mr-2 h-4 w-4 flex-shrink-0"/><span className="truncate">{selectedKazanım || "Kazanım seçmek için tıklayın..."}</span></Button></DialogTrigger><KazanımSelector onSelect={setSelectedKazanım} /></Dialog>
                    <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button onClick={() => handleGenerateQuestion('multiple-choice')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Test</Button>
                        <Button onClick={() => handleGenerateQuestion('open-ended')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Açık Uçlu</Button>
                        <Button onClick={() => handleGenerateQuestion('matching')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>Eşleştirme</Button>
                        <Button onClick={() => handleGenerateQuestion('true-false')} size="sm" variant="outline" className="text-xs" disabled={isGeneratingQuestion || !selectedKazanım}><Sparkles className="h-3 w-3 mr-1"/>D/Y</Button>
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
                                <div className='flex justify-between items-center'><span className='text-sm font-semibold'>Soru {index + 1} ({q.points || 0} Puan)</span><Trash2 className='h-4 w-4 text-red-500 hover:text-red-700' onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id)}}/></div>
                                <p className='text-xs text-gray-500 truncate'>{q.image ? "[Resimli Soru]" : (q.text || "Boş soru...")}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => setIsPreviewOpen(true)} variant="outline" className="flex-1"><Eye className='mr-2'/>Önizleme</Button>
                        <Button onClick={() => setIsAssignModalOpen(true)} className="flex-1"><Send className='mr-2'/>Ata & Yayınla</Button>
                    </div>
                </CardContent>
            </Card>
          </div>
          <div className="flex-1 p-0 overflow-y-auto">
            {activeQuestion ? (<div className="bg-white p-6 rounded-lg shadow-sm border space-y-6 h-full"><div><Label htmlFor="questionText" className="text-lg font-semibold">Soru Metni</Label><div className="flex gap-2 items-center mt-2 mb-4"><input type="file" ref={imageInputRef} onChange={(e) => {if (activeQuestion) handleImageUpload(e, activeQuestion.id)}} className="hidden" accept="image/*" /><Button variant="outline" size="sm" onClick={() => { if(activeQuestion) { setQuestionIdForImageUpload(activeQuestion.id); imageInputRef.current?.click(); }}} disabled={!!isUploading}>{isUploading ? <Loader2 className="animate-spin mr-2"/> : <ImageIcon className="mr-2"/>} Resim Ekle</Button>{activeQuestion.image && (<Button variant="destructive" size="sm" onClick={() => { if (activeQuestion.image) handleDeleteImage(activeQuestion.id, activeQuestion.image)}}><Trash2 className="mr-2"/> Resmi Sil</Button>)}</div>{activeQuestion.image && (<div className="relative group/image mb-2 p-2 border rounded-md flex justify-center bg-gray-50"><img src={activeQuestion.image} alt="Soru görseli" className="max-w-full max-h-80 object-contain rounded" /><Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100" onClick={() => {if (activeQuestion.image) handleDeleteImage(activeQuestion.id, activeQuestion.image)}}><X size={14}/></Button></div>)}<Textarea id="questionText" value={activeQuestion.text} onChange={e => updateQuestion(activeQuestion.id, 'text', e.target.value)} rows={5} className="mt-2" placeholder='Sorunuzu buraya yazın ya da bir resim ekleyin...'/></div>{activeQuestion.type === 'multiple-choice' && (<div><Label className="text-lg font-semibold">Seçenekler</Label><div className='mt-2 space-y-3'>{(activeQuestion.options || []).map((opt, i) => (<div key={i} className="flex items-center gap-2"><Label htmlFor={`option-${i}`} className='p-2 bg-slate-100 rounded-md'>{String.fromCharCode(65 + i)})</Label><Input id={`option-${i}`} value={opt} onChange={e => {const newOptions = [...(activeQuestion.options || [])];newOptions[i] = e.target.value;updateQuestion(activeQuestion.id, 'options', newOptions);}}/><RadioGroup value={activeQuestion.correctAnswer === opt ? 'correct' : ''} onValueChange={() => updateQuestion(activeQuestion.id, 'correctAnswer', opt)}><RadioGroupItem value="correct" id={`${activeQuestion.id}-${i}`}/></RadioGroup></div>))}</div></div>)}{activeQuestion.type === 'matching' && (<div><Label className="text-lg font-semibold">Eşleştirme Çiftleri</Label><div className='mt-2 space-y-2'>{(activeQuestion.matchingPairs || []).map((pair, i) => (<div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"><span className="text-sm font-semibold">{i + 1}.</span><Input placeholder="Kavram" value={pair.question} onChange={e => {/* handleUpdateMatchingPair */}} /><Input placeholder="Açıklama" value={pair.answer} onChange={e => {/* handleUpdateMatchingPair */}} /><Button size="icon" variant="ghost" className="text-red-500" onClick={() => {/* handleRemoveMatchingPair */}}><Trash2 className="h-4 w-4" /></Button></div>))}<Button variant="outline" size="sm" onClick={() => {/* handleAddMatchingPair */}} className="mt-2"><Plus className="mr-2 h-4 w-4"/>Çift Ekle</Button></div></div>)}<div><Label htmlFor="questionPoints" className="text-lg font-semibold">Puan</Label><Input id="questionPoints" type="number" value={activeQuestion.points} onChange={e => updateQuestion(activeQuestion.id, 'points', parseInt(e.target.value) || 0)} className="mt-2 w-24"/></div></div>) : (<div className='flex items-center justify-center h-full text-gray-500'><Card className='p-8 text-center border-dashed'><CardHeader><div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4"><FileQuestion className="h-10 w-10 text-primary" /></div><CardTitle>Soru Bankası ve Sınav Oluşturucu</CardTitle><CardDescription>Soldaki menüden kazanım seçip soru üretin veya manuel olarak yeni soru ekleyin.</CardDescription></CardHeader></Card></div>)}
          </div>
          <AssignExamModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} exam={currentExam} onConfirm={handleAssignConfirm} classes={classes} students={students} />
          {isPreviewOpen && (<div className="fixed inset-0 bg-black/80 z-50 flex justify-center overflow-y-auto py-10"><div className="relative"><button onClick={() => setIsPreviewOpen(false)} className="fixed top-5 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition"><X size={24} /></button><button onClick={() => setShowAnswerKey(!showAnswerKey)} className="fixed top-20 right-5 bg-white rounded-full p-2 hover:bg-gray-200 transition"><KeySquare size={24} className={showAnswerKey ? 'text-blue-600' : ''}/></button><ExamPaper exam={currentExam} showAnswerKey={showAnswerKey} /></div></div>)}
        </div>
    );
};


interface ContentStudioTabProps {
  teacherProfile: TeacherProfile | null;
  classes: Class[];
  students: Student[];
}

export function ContentStudioTab({ teacherProfile, classes, students }: ContentStudioTabProps) {
    return (
        <Tabs defaultValue="material">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="material">Ders Materyali Üret</TabsTrigger>
                <TabsTrigger value="exam">Ödev/Sınav Oluştur</TabsTrigger>
                <TabsTrigger value="edebiyat-asistan">Edebiyat Asistanı</TabsTrigger>
            </TabsList>
            <TabsContent value="material" className="mt-4">
                <MaterialCreator teacherProfile={teacherProfile} />
            </TabsContent>
            <TabsContent value="exam" className="mt-4">
                <ExamBuilderComponent classes={classes} students={students} />
            </TabsContent>
            <TabsContent value="edebiyat-asistan" className="mt-4">
                <EdebiyatSinavAsistaniTab />
            </TabsContent>
        </Tabs>
    );
}

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
