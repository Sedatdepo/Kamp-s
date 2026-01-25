'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BookOpen, Cpu, Save, RefreshCw, Printer, Brain, CheckCircle, GraduationCap, FileText, List, AlertCircle, Library, Sparkles, Wand2, PlusCircle, Trash2 } from 'lucide-react';
import { TeacherProfile } from '@/lib/types';
import { KAZANIMLAR } from '@/lib/kazanimlar';
import { generateAssignmentScenario, GenerateAssignmentScenarioInput } from '@/ai/flows/generate-assignment-scenario-flow';
import { exportMaterialToRtf } from '@/lib/word-export';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';


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
    const [selectedLesson, setSelectedLesson] = useState("Fizik");
    const [selectedGradeIndex, setSelectedGradeIndex] = useState(0);
    const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
    const [selectedTaskType, setSelectedTaskType] = useState<keyof typeof TASK_TYPES>("performance");
    const [selectedTaskSubtype, setSelectedTaskSubtype] = useState(TASK_TYPES.performance.subtypes[0]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTask, setGeneratedTask] = useState<any>(null);

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
        setSelectedTaskSubtype(TASK_TYPES[selectedTaskType].subtypes[0]);
    }, [selectedTaskType]);

    const generateWithAi = async () => {
        if (!currentTopic) return;
        setIsGenerating(true);
        setGeneratedTask(null);

        try {
            const input: GenerateAssignmentScenarioInput = {
                lesson: selectedLesson,
                grade: currentGradeData.unite,
                topic: currentTopic.konu,
                outcome: currentTopic.kazanimlar[0],
                taskType: TASK_TYPES[selectedTaskType].label,
                taskSubtype: selectedTaskSubtype
            };
            const response = await generateAssignmentScenario(input);
            
            const task = {
                title: response.taskTitle,
                description: response.taskDescription,
                outcome: currentTopic.kazanimlar[0],
                steps: currentTopic.kazanimlar.slice(1),
                evaluation: selectedTaskType === "project" ? [
                "Süreç Yönetimi (%30)", "İçerik Doğruluğu (%30)", "Özgünlük ve Yaratıcılık (%20)", "Raporlama ve Sunum (%20)"
                ] : [
                "Yönerge Takibi (%40)", "Konu Hakimiyeti (%40)", "Zamanında Teslim (%20)"
                ]
            };
            setGeneratedTask(task);

        } catch (error) {
            console.error("AI Generation Error:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTaskChange = (field: string, value: string) => {
        if (!generatedTask) return;
        setGeneratedTask((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleStepChange = (index: number, value: string) => {
        if (!generatedTask) return;
        const newSteps = [...generatedTask.steps];
        newSteps[index] = value;
        handleTaskChange('steps', newSteps);
    };

    const addStep = () => {
        if (!generatedTask) return;
        handleTaskChange('steps', [...generatedTask.steps, '']);
    };

    const removeStep = (index: number) => {
        if (!generatedTask) return;
        handleTaskChange('steps', generatedTask.steps.filter((_: any, i: number) => i !== index));
    };

    const handleEvalChange = (index: number, value: string) => {
        if (!generatedTask) return;
        const newEval = [...generatedTask.evaluation];
        newEval[index] = value;
        handleTaskChange('evaluation', newEval);
    };

    const addEval = () => {
        if (!generatedTask) return;
        handleTaskChange('evaluation', [...generatedTask.evaluation, 'Yeni Kriter (%10)']);
    };

    const removeEval = (index: number) => {
        if (!generatedTask) return;
        handleTaskChange('evaluation', generatedTask.evaluation.filter((_: any, i: number) => i !== index));
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-4 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
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

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="flex items-center gap-2 font-semibold text-lg mb-6 border-b pb-2 text-slate-800">
                            <GraduationCap className="w-5 h-5" />
                            Ders ve Konu Seçimi
                        </h2>
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ders</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(KAZANIMLAR).map(lesson => (
                                    <button key={lesson} onClick={() => setSelectedLesson(lesson)} className={`py-2 rounded-lg font-medium transition-colors border ${selectedLesson === lesson ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{lesson}</button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sınıf Seviyesi</label>
                            <select value={selectedGradeIndex} onChange={(e) => setSelectedGradeIndex(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium">
                                {KAZANIMLAR[selectedLesson].map((gradeData: any, idx: number) => (<option key={idx} value={idx}>{gradeData.unite}</option>))}
                            </select>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Konu / Kazanım</label>
                            <select value={selectedTopicIndex} onChange={(e) => setSelectedTopicIndex(parseInt(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                {currentGradeData?.konular.map((t: any, idx: number) => (<option key={idx} value={idx}>{t.konu.length > 60 ? t.konu.substring(0, 60) + "..." : t.konu}</option>))}
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

                        <Button onClick={generateWithAi} disabled={isGenerating} className="w-full bg-slate-800 hover:bg-slate-900 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95">
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                            AI ile Görev Üret
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {generatedTask ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className={`bg-slate-900 text-white p-8 border-b-4 relative overflow-hidden ${selectedLesson === 'Fizik' ? 'border-blue-500' : 'border-rose-500'}`}>
                                <div className="relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                    <Input
                                        className="text-xl md:text-2xl font-bold font-serif tracking-wide bg-transparent border-0 border-b-2 border-transparent focus-visible:ring-0 focus-visible:border-white rounded-none -ml-3 h-auto p-1"
                                        value={generatedTask.title}
                                        onChange={(e) => handleTaskChange('title', e.target.value)}
                                    />
                                    <div className="flex flex-wrap items-center gap-3 mt-3 text-slate-300 text-sm font-medium">
                                        <span className="bg-white/10 px-2 py-1 rounded">{selectedLesson}</span>
                                        <span className="bg-white/10 px-2 py-1 rounded">{currentGradeData.unite}</span>
                                    </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => exportMaterialToRtf({ task: generatedTask, teacherProfile })}>
                                        <FileDown className="text-white"/>
                                    </Button>
                                </div>
                                </div>
                            </div>
                            <div className="p-8 space-y-8 print:p-0">
                                <div className={`p-4 rounded-lg border-l-4 ${selectedLesson === 'Fizik' ? 'bg-blue-50 border-blue-600' : 'bg-rose-50 border-rose-600'}`}>
                                    <h4 className={`text-sm font-bold uppercase mb-1 ${selectedLesson === 'Fizik' ? 'text-blue-900' : 'text-rose-900'}`}>Hedeflenen Kazanım</h4>
                                    <p className={`${selectedLesson === 'Fizik' ? 'text-blue-800' : 'text-rose-800'} font-medium italic`}>"{generatedTask.outcome}"</p>
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3 border-b pb-2">
                                        <Brain className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                                        Görev Açıklaması
                                    </h4>
                                    <Textarea className="text-slate-700 leading-relaxed text-lg" value={generatedTask.description} onChange={(e) => handleTaskChange('description', e.target.value)} rows={5} />
                                </div>
                                <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-4 border-b pb-2">
                                        <List className={`w-5 h-5 ${selectedLesson === 'Fizik' ? 'text-blue-600' : 'text-rose-600'}`} />
                                        Süreç Adımları ve Yönerge
                                    </h4>
                                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                        <div className="space-y-3">
                                            {generatedTask.steps.map((step: string, idx: number) => (
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
                                        {generatedTask.evaluation.map((criteria: string, idx: number) => (
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
                            <p className="text-center max-w-md text-slate-500 mb-6">Sol menüden ders, sınıf, konu ve görev türü seçimi yaparak yapay zeka destekli materyal oluşturun.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialCreatorTab;
