
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, PlusCircle, Trash2, FileDown, Loader2, Plus, X } from 'lucide-react';
import { TeacherProfile } from '@/lib/types';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario, GenerateAssignmentScenarioInput } from '@/ai/flows/generate-assignment-scenario-flow';
import { exportMaterialToRtf } from '@/lib/word-export';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import type { AssignmentTemplate } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

const MaterialCreatorTab = ({ teacherProfile }: { teacherProfile: TeacherProfile | null }) => {
    const { toast } = useToast();
    const { db: localDb, setDb: setLocalDb, loading: dbLoading } = useDatabase();
    const { performanceAssignments = [] } = localDb;
    
    const [selectedLesson, setSelectedLesson] = useState("Fizik");
    const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
    const [selectedOutcome, setSelectedOutcome] = useState('');
    const [selectedTaskType, setSelectedTaskType] = useState<keyof typeof TASK_TYPES>("performance");
    const [selectedTaskSubtype, setSelectedTaskSubtype] = useState(TASK_TYPES.performance.subtypes[0]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTask, setGeneratedTask] = useState<AssignmentTemplate | null>(null);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    
    const generateAssignment = () => {
        toast({ title: 'Bu özellik kaldırıldı.', description: 'Lütfen AI ile görev üretin.' });
    };

    const currentGradeData = KAZANIMLAR[selectedLesson][selectedGradeIndex];
    const currentTopic = currentGradeData?.konular[selectedTopicIndex];

    useEffect(() => {
        setSelectedGradeIndex(0);
        setSelectedTopicIndex(0);
    }, [selectedLesson]);

    useEffect(() => {
        setSelectedTopicIndex(0);
    }, [selectedGradeIndex]);
    
    useEffect(() => {
        if (currentTopic && currentTopic.kazanimlar.length > 0) {
            setSelectedOutcome(currentTopic.kazanimlar[0]);
        } else {
            setSelectedOutcome('');
        }
    }, [currentTopic]);


    useEffect(() => {
        setSelectedTaskSubtype(TASK_TYPES[selectedTaskType].subtypes[0]);
    }, [selectedTaskType]);

    useEffect(() => {
        const record = performanceAssignments.find(rec => rec.id === selectedRecordId);
        if (record) {
            setGeneratedTask(record);
        }
    }, [selectedRecordId, performanceAssignments]);

    const generateWithAi = async () => {
        if (!currentTopic || !selectedOutcome) {
            toast({
                title: "Eksik Seçim",
                description: "Lütfen bir ders, sınıf, konu ve kazanım seçin.",
                variant: "destructive",
            });
            return;
        }
        setIsGenerating(true);
        setGeneratedTask(null);
        try {
            const input: GenerateAssignmentScenarioInput = {
                lesson: selectedLesson,
                grade: currentGradeData.unite,
                topic: currentTopic.konu,
                outcome: selectedOutcome,
                taskType: TASK_TYPES[selectedTaskType].label,
                taskSubtype: selectedTaskSubtype
            };
            const response = await generateAssignmentScenario(input);
            const task = {
                id: Date.now(),
                grade: parseInt(currentGradeData.unite.match(/\d+/)?.[0] || '9'),
                subject: selectedLesson === 'Fizik' ? 'physics' : 'literature',
                formats: 'Word, PDF',
                size: '10 MB',
                title: response.taskTitle,
                description: response.taskDescription,
                outcome: selectedOutcome,
                steps: [],
                evaluation: [],
                isCustom: true,
            };
            setGeneratedTask(task as AssignmentTemplate);
        } catch (error) { console.error("AI Generation Error:", error);
        } finally { setIsGenerating(false); }
    };

    const handleTaskChange = (field: string, value: string) => {
        if (!generatedTask) return;
        setGeneratedTask((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleStepChange = (index: number, value: string) => {
        if (!generatedTask || !generatedTask.steps) return;
        const newSteps = [...generatedTask.steps];
        newSteps[index] = value;
        handleTaskChange('steps', newSteps as any);
    };

    const addStep = () => {
        if (!generatedTask) return;
        handleTaskChange('steps', [...(generatedTask.steps || []), ''] as any);
    };

    const removeStep = (index: number) => {
        if (!generatedTask || !generatedTask.steps) return;
        handleTaskChange('steps', generatedTask.steps.filter((_: any, i: number) => i !== index) as any);
    };

    const handleEvalChange = (index: number, value: string) => {
        if (!generatedTask || !generatedTask.evaluation) return;
        const newEval = [...generatedTask.evaluation];
        newEval[index] = value;
        handleTaskChange('evaluation', newEval as any);
    };

    const addEval = () => {
        if (!generatedTask) return;
        handleTaskChange('evaluation', [...(generatedTask.evaluation || []), 'Yeni Kriter (%10)'] as any);
    };

    const removeEval = (index: number) => {
        if (!generatedTask || !generatedTask.evaluation) return;
        handleTaskChange('evaluation', generatedTask.evaluation.filter((_: any, i: number) => i !== index) as any);
    };
    
    const handleNewTask = useCallback(() => {
        setSelectedRecordId(null);
        setGeneratedTask({
            id: Date.now(),
            title: 'Yeni Ödev Taslağı',
            description: 'Ödev için bir açıklama girin.',
            instructions: 'Öğrencilerin takip etmesi gereken adımları ve yönergeleri buraya yazın.',
            grade: parseInt(currentGradeData.unite.match(/\d+/)?.[0] || '9'),
            subject: selectedLesson === 'Fizik' ? 'physics' : 'literature',
            formats: 'Word, PDF', size: '10 MB',
            steps: [], evaluation: [], isCustom: true,
            outcome: ''
        });
    }, [currentGradeData.unite, selectedLesson]);

    const handleSaveTask = () => {
        if (!generatedTask) return;
        setLocalDb(prevDb => {
            const existingIndex = (prevDb.performanceAssignments || []).findIndex(a => a.id === generatedTask.id);
            let newAssignments;
            if (existingIndex > -1) {
                newAssignments = [...(prevDb.performanceAssignments || [])];
                newAssignments[existingIndex] = generatedTask;
            } else {
                newAssignments = [generatedTask, ...(prevDb.performanceAssignments || [])];
            }
            return { ...prevDb, performanceAssignments: newAssignments };
        });
        setSelectedRecordId(generatedTask.id);
        toast({ title: 'Kaydedildi!', description: `"${generatedTask.title}" kütüphaneye kaydedildi.` });
    };

    const handleDeleteTask = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({
            ...prev,
            performanceAssignments: (prev.performanceAssignments || []).filter(a => a.id !== selectedRecordId)
        }));
        handleNewTask();
        toast({ title: 'Ödev Silindi', variant: 'destructive' });
    }, [selectedRecordId, setLocalDb, handleNewTask, toast]);

    if (dbLoading) {
        return <Loader2 className="animate-spin" />
    }

    return (
        <Tabs defaultValue="ai-generator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai-generator">AI Görev Üretici</TabsTrigger>
                <TabsTrigger value="advanced-editor">Gelişmiş Editör</TabsTrigger>
            </TabsList>
            <TabsContent value="ai-generator" className="mt-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Başlık */}
                    <div className="lg:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${selectedLesson === 'Fizik' ? 'bg-blue-700' : 'bg-rose-700'}`}>
                                <Brain className="text-white w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">MEB Ödev Asistanı</h1>
                                <p className="text-slate-500 text-sm">Türkiye Yüzyılı Maarif Modeli - {selectedLesson} (2025-2026)</p>
                            </div>
                        </div>
                    </div>

                    {/* SOL PANEL: Seçimler */}
                    <div className="lg:col-span-4 space-y-6">
                        <RecordManager
                            records={(performanceAssignments || []).map(r => ({ id: r.id, name: r.title }))}
                            selectedRecordId={selectedRecordId}
                            onSelectRecord={setSelectedRecordId}
                            onNewRecord={handleNewTask}
                            onDeleteRecord={handleDeleteTask}
                            noun="Ödev Taslağı"
                        />
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="flex items-center gap-2 font-semibold text-lg mb-6 border-b pb-2 text-slate-800">
                                <GraduationCap className="w-5 h-5" />
                                Ders ve Konu Seçimi
                            </h2>

                            {/* Ders Seçimi */}
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ders</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.keys(KAZANIMLAR).map(lesson => (
                                        <button
                                            key={lesson}
                                            onClick={() => setSelectedLesson(lesson)}
                                            className={`py-2 rounded-lg font-medium transition-colors border ${
                                            selectedLesson === lesson 
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {lesson}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sınıf Seviyesi */}
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Sınıf Seviyesi</label>
                                <select 
                                    value={selectedGradeIndex}
                                    onChange={(e) => setSelectedGradeIndex(parseInt(e.target.value))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium"
                                >
                                    {KAZANIMLAR[selectedLesson].map((gradeData: any, idx: number) => (<option key={idx} value={idx}>{gradeData.unite}</option>))}
                                </select>
                            </div>

                            {/* Konu */}
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Konu</label>
                                <select 
                                    value={selectedTopicIndex}
                                    onChange={(e) => setSelectedTopicIndex(parseInt(e.target.value))}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {currentGradeData?.konular.map((t: any, idx: number) => (<option key={idx} value={idx}>{t.konu}</option>))}
                                </select>
                            </div>
                            
                             {/* Kazanım */}
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Hedeflenen Kazanım</label>
                                <select 
                                    value={selectedOutcome}
                                    onChange={(e) => setSelectedOutcome(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 h-20"
                                    disabled={!currentTopic || currentTopic.kazanimlar.length === 0}
                                    size={5}
                                >
                                    {currentTopic?.kazanimlar.map((outcome: string, idx: number) => (
                                        <option key={idx} value={outcome}>
                                            {outcome.length > 80 ? outcome.substring(0, 80) + '...' : outcome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-5">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ödev Türü</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(TASK_TYPES).map(([key, value]) => (
                                        <button key={key} onClick={() => setSelectedTaskType(key as keyof typeof TASK_TYPES)} className={`p-3 rounded-lg border text-center transition-all ${selectedTaskType === key ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white hover:border-blue-300'}`}>
                                            <div className="font-bold text-sm">{value.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ödev Alt Türü</label>
                                <select value={selectedTaskSubtype} onChange={(e) => setSelectedTaskSubtype(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                    {TASK_TYPES[selectedTaskType].subtypes.map(subtype => (
                                        <option key={subtype} value={subtype}>{subtype}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={generateAssignment} disabled={isGenerating} variant="outline">Şablondan Senaryo</Button>
                                <Button onClick={generateWithAi} disabled={isGenerating} className="bg-slate-800 hover:bg-slate-900">
                                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                                    AI ile Görev Üret
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ PANEL: Çıktı */}
                    <div className="lg:col-span-8">
                        {generatedTask ? (
                            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className={`p-8 border-b-4 relative overflow-hidden ${selectedLesson === 'Fizik' ? 'border-blue-500 bg-blue-900 text-white' : 'border-rose-500 bg-rose-900 text-white'}`}>
                                    <div className="relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                        <Input className="text-xl md:text-2xl font-bold font-serif tracking-wide bg-transparent border-0 border-b-2 border-transparent focus-visible:ring-0 focus-visible:border-white rounded-none -ml-3 h-auto p-1" value={generatedTask.title} onChange={(e) => handleTaskChange('title', e.target.value)} />
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-slate-300 text-sm font-medium">
                                            <span className="bg-white/10 px-2 py-1 rounded">{selectedLesson}</span>
                                            <span className="bg-white/10 px-2 py-1 rounded">{currentGradeData.unite}</span>
                                        </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="secondary" size="sm" onClick={handleSaveTask}><Save className="mr-2 h-4 w-4"/> Kütüphaneye Kaydet</Button>
                                            <Button variant="ghost" size="icon" onClick={() => exportMaterialToRtf({ task: generatedTask, teacherProfile })}>
                                                <FileDown className="text-white"/>
                                            </Button>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8 print:p-0">
                                    <div className={`p-4 rounded-lg border-l-4 ${selectedLesson === 'Fizik' ? 'bg-blue-50 border-blue-600' : 'bg-rose-50 border-rose-600'}`}>
                                        <h4 className={`text-sm font-bold uppercase mb-1 ${selectedLesson === 'Fizik' ? 'text-blue-900' : 'text-rose-900'}`}>Hedeflenen Kazanım</h4>
                                        <p className={`${selectedLesson === 'Fizik' ? 'text-blue-800' : 'text-rose-800'} font-medium italic`}>"{generatedTask.outcome}"</p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3 border-b pb-2"><Brain className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} /> Görev Açıklaması</h4>
                                        <Textarea className="text-slate-700 leading-relaxed text-lg" value={generatedTask.description} onChange={(e) => handleTaskChange('description', e.target.value)} rows={5} />
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-4 border-b pb-2"><List className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} /> Süreç Adımları ve Yönerge</h4>
                                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                            <div className="space-y-3">
                                                {(generatedTask.steps || []).map((step: string, idx: number) => (
                                                    <div key={idx} className="flex gap-2 items-center">
                                                        <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center font-bold shadow-sm bg-white ${selectedLesson === 'Fizik' ? 'border-blue-200 text-blue-700' : 'border-rose-200 text-rose-700'}`}>{idx + 1}</div>
                                                        <Input value={step} onChange={(e) => handleStepChange(idx, e.target.value)} className="flex-1" />
                                                        <Button variant="ghost" size="icon" onClick={() => removeStep(idx)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={addStep} className="mt-2 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Adım Ekle</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg mb-4 border-b pb-2">Değerlendirme Kriterleri</h4>
                                        <div className="space-y-2">
                                            {(generatedTask.evaluation || []).map((criteria: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Input value={criteria} onChange={(e) => handleEvalChange(idx, e.target.value)} className="flex-1" placeholder="Kriter Adı (% Puan)" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeEval(idx)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={addEval} className="mt-2 w-full border-dashed"><PlusCircle className="mr-2 h-4 w-4" /> Kriter Ekle</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 p-8">
                                <div className="bg-slate-50 p-8 rounded-full mb-6 border border-slate-100">
                                    <Cpu className="w-16 h-16 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-600 mb-2">Materyal Oluşturmaya Başlayın</h3>
                                <p className="text-center max-w-md text-slate-500 mb-6">
                                    Sol menüden <strong>{selectedLesson}</strong> dersi için sınıf ve konu seçimi yapın. Sistem, seçtiğiniz kazanımı analiz edip size özel bir senaryo hazırlayacaktır.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="advanced-editor" className="mt-4">
                 <iframe src="/material-editor.html" className="w-full border-0 rounded-lg shadow-md" style={{ height: 'calc(100vh - 150px)' }} title="Gelişmiş Materyal Editörü" />
            </TabsContent>
        </Tabs>
    );
};

export default MaterialCreatorTab;
