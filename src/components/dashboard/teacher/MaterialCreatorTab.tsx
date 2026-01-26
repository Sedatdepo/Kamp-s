'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, PlusCircle, Trash2, FileDown, Loader2 } from 'lucide-react';
import { TeacherProfile } from '@/lib/types';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario, GenerateAssignmentScenarioInput, GenerateAssignmentScenarioOutput } from '@/ai/flows/generate-assignment-scenario-flow';
import { generateMaterial, GenerateMaterialInput, GenerateMaterialOutput } from '@/ai/flows/generate-material-flow';
import { exportMaterialToRtf } from '@/lib/word-export';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import type { AssignmentTemplate } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TASK_TYPES = {
    performance: {
        label: "Performans Görevi",
        subtypes: [
            "Derse Hazırlık Performans Görevi",
            "Pekiştirici Performans Görevi",
            "Geliştirmeye Yönelik Performans Görevi",
            "Düzeltmeye Yönelik Performans Görevi"
        ]
    },
    project: {
        label: "Proje Ödevi",
        subtypes: [
            "Yapı/Maket Projesi",
            "Deneysel/Araştırma Projesi",
            "Araştırma ve Keşif Projesi"
        ]
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


const MaterialCreatorTab = ({ teacherProfile }: { teacherProfile: TeacherProfile | null }) => {
    const { toast } = useToast();
    
    // Selection States
    const [selectedLesson, setSelectedLesson] = useState("Fizik");
    const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
    const [selectedOutcome, setSelectedOutcome] = useState('');
    
    // Generation Type States
    const [generationType, setGenerationType] = useState<'assignment' | 'material'>('assignment');
    const [selectedTaskType, setSelectedTaskType] = useState<keyof typeof TASK_TYPES>("performance");
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
    
    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SOL PANEL: Kontroller */}
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

            {/* SAĞ PANEL: Çıktı */}
            <div className="lg:col-span-8">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-8">
                         <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                         <h3 className="text-xl font-bold text-slate-600 mb-2">İçerik Üretiliyor...</h3>
                         <p className="text-center max-w-md text-slate-500">Yapay zeka sizin için en uygun materyali hazırlıyor. Bu işlem biraz zaman alabilir.</p>
                    </div>
                ) : generatedContent ? (
                    generatedContent.taskTitle ? <RenderedAssignment content={generatedContent} /> : <RenderedMaterial content={generatedContent} />
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

export default MaterialCreatorTab;
