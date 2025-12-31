
'use client';

import React, { useState } from 'react';
import { Student, Class, TeacherProfile, Survey, Question } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye, BarChart2, Check, X, FileText, CheckSquare, Circle, Layout, Send, AlignLeft, ChevronDown, Calendar, Star, Save } from 'lucide-react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SurveyTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}


// --- YARDIMCI BİLEŞENLER ---
const NavButton = ({ active, onClick, icon: Icon, label, count }: { active: boolean, onClick: ()=>void, icon: React.ElementType, label: string, count?: number }) => (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
        active 
          ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 transform scale-105' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${active ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
          {count}
        </span>
      )}
    </button>
);

// Soru Tipi İkonları
const getTypeIcon = (type: Question['type']) => {
    switch(type) {
      case 'text': return <FileText size={16}/>;
      case 'paragraph': return <AlignLeft size={16}/>;
      case 'multiple': return <Circle size={16}/>;
      case 'checkbox': return <CheckSquare size={16}/>;
      case 'dropdown': return <ChevronDown size={16}/>;
      case 'linear': return <Star size={16}/>;
      case 'date': return <Calendar size={16}/>;
      default: return <FileText size={16}/>;
    }
}


export function SurveyTab({ students, currentClass, teacherProfile }: SurveyTabProps) {
  const { db, appUser } = useAuth();
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';
  const { toast } = useToast();

  const [view, setView] = useState<'list' | 'builder' | 'preview' | 'results'>('list'); 
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);

  const [formTitle, setFormTitle] = useState('Yeni Anket');
  const [formDesc, setFormDesc] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  const surveysQuery = useMemo(() => {
    if (!db || !currentClass?.id) return null;
    return query(collection(db, 'surveys'), where('classId', '==', currentClass.id));
  }, [db, currentClass?.id]);

  const { data: surveys, loading } = useFirestore<Survey[]>(`surveys-${currentClass?.id}`, surveysQuery);

  const startNewSurvey = () => {
    setSelectedSurvey(null);
    setFormTitle('Yeni Anket');
    setFormDesc('');
    setQuestions([]);
    setView('builder');
  }

  const startEditingSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
    setFormTitle(survey.title);
    setFormDesc(survey.description);
    setQuestions(survey.questions);
    setView('builder');
  }

  const handleSaveSurvey = async () => {
    if(!db || !currentClass) return;

    const surveyData = {
        title: formTitle,
        description: formDesc,
        questions,
        classId: currentClass.id,
        teacherId,
        isActive: selectedSurvey?.isActive || false,
        createdAt: selectedSurvey?.createdAt || new Date().toISOString(),
    }

    try {
        if(selectedSurvey) {
            // Update existing survey
            const surveyRef = doc(db, 'surveys', selectedSurvey.id);
            await updateDoc(surveyRef, surveyData);
            toast({title: 'Anket güncellendi!'});
        } else {
            // Create new survey
            const docRef = await addDoc(collection(db, 'surveys'), surveyData);
            toast({title: 'Anket oluşturuldu!'});
            // Select the newly created survey for further editing
            setSelectedSurvey({id: docRef.id, ...surveyData});
        }
    } catch (e) {
        toast({variant: 'destructive', title: 'Hata', description: 'Anket kaydedilemedi.'});
    }
  }


  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: 'multiple',
      text: 'Yeni Soru',
      options: ['Seçenek 1'],
      required: false
    };
    setQuestions([...questions, newQ]);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: [...(q.options || []), `Seçenek ${(q.options?.length || 0) + 1}`] };
      }
      return q;
    }));
  };

  const updateOption = (qId: string, opIndex: number, val: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOps = [...(q.options || [])];
        newOps[opIndex] = val;
        return { ...q, options: newOps };
      }
      return q;
    }));
  };

  const removeOption = (qId: string, opIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options?.filter((_, i) => i !== opIndex) };
      }
      return q;
    }));
  };


  if (view === 'builder') {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <Button onClick={() => setView('list')} variant="outline"><Plus className="mr-2 h-4 w-4" /> Anket Listesine Dön</Button>
                <Button onClick={handleSaveSurvey}><Save className="mr-2 h-4 w-4" /> Anketi Kaydet</Button>
            </div>
          {/* Başlık */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            <input 
              type="text" 
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full text-4xl font-extrabold text-slate-900 text-center bg-transparent border-none focus:ring-0 placeholder-slate-300 tracking-tight"
              placeholder="Anket Başlığı"
            />
            <div className="mt-4 max-w-2xl mx-auto">
              <input 
                type="text" 
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full text-center text-slate-500 bg-transparent border-none focus:ring-0 placeholder-slate-300 text-lg"
                placeholder="Açıklama..."
              />
            </div>
          </div>

          {/* Sorular */}
          <div className="grid gap-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group">
              <div className="flex flex-col md:flex-row gap-6">
                
                <div className="hidden md:flex flex-col items-center pt-2 gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 text-sm font-bold font-mono">{index + 1}</span>
                  <div className="h-full w-0.5 bg-slate-100 rounded-full"></div>
                </div>

                <div className="flex-1 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                      className="flex-1 text-lg font-semibold text-slate-800 bg-slate-50 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-indigo-500 rounded-xl px-4 py-3 transition-all"
                      placeholder="Soru metni..."
                    />
                    <div className="sm:w-56 shrink-0 relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 pointer-events-none">
                        {getTypeIcon(q.type)}
                      </div>
                      <select 
                        value={q.type} 
                        onChange={(e) => updateQuestion(q.id, 'type', e.target.value as Question['type'])}
                        className="w-full bg-white border border-slate-200 text-slate-600 font-medium rounded-xl pl-10 pr-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="text">Kısa Cevap</option>
                        <option value="paragraph">Uzun Cevap</option>
                        <option value="multiple">Tek Seçim</option>
                        <option value="checkbox">Çoklu Seçim</option>
                        <option value="dropdown">Açılır Liste</option>
                        <option value="linear">Ölçek (1-5)</option>
                        <option value="date">Tarih</option>
                      </select>
                    </div>
                  </div>

                  {['multiple', 'checkbox', 'dropdown'].includes(q.type) && (
                    <div className="space-y-3 pl-1">
                      {q.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 group/opt animate-in fade-in duration-300">
                           <div className="text-slate-300">
                              {q.type === 'multiple' && <Circle size={20} />}
                              {q.type === 'checkbox' && <CheckSquare size={20} />}
                              {q.type === 'dropdown' && <span className="text-xs font-mono font-bold">#{i+1}</span>}
                           </div>
                           <input 
                              type="text" 
                              value={opt}
                              onChange={(e) => updateOption(q.id, i, e.target.value)}
                              className="flex-1 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 outline-none py-1 text-slate-600 transition-colors"
                           />
                           <button onClick={() => removeOption(q.id, i)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/opt:opacity-100">
                              <X size={16} />
                           </button>
                        </div>
                      ))}
                      <button onClick={() => addOption(q.id)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm mt-2 px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors w-max">
                        <Plus size={16} /> Seçenek Ekle
                      </button>
                    </div>
                  )}

                  {q.type === 'linear' && (
                     <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                       <Star size={16} className="fill-indigo-700"/>
                       <span>Bu soru tipi otomatik olarak 1'den 5'e kadar bir değerlendirme ölçeği oluşturur.</span>
                     </div>
                  )}
                  {q.type === 'date' && (
                     <div className="bg-slate-100 text-slate-500 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                       <Calendar size={16} />
                       <span>Öğrenci tarih seçimi yapabilecektir.</span>
                     </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                     <label className="flex items-center gap-2.5 cursor-pointer group/toggle select-none">
                       <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${q.required ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                         <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${q.required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                       </div>
                       <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)} className="hidden"/>
                       <span className={`text-sm font-medium transition-colors ${q.required ? 'text-indigo-600' : 'text-slate-400'}`}>{q.required ? 'Zorunlu' : 'Opsiyonel'}</span>
                     </label>

                     <button onClick={() => deleteQuestion(q.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all">
                       <Trash2 size={20} />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="flex justify-center py-8">
            <button onClick={addQuestion} className="group relative flex items-center gap-3 bg-slate-900 text-white pl-5 pr-6 py-3.5 rounded-full font-bold shadow-xl shadow-slate-200 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300">
              <div className="bg-white/20 rounded-full p-1"><Plus size={20} /></div>
              <span>Soru Ekle</span>
            </button>
          </div>
        </div>
      );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline flex items-center gap-2">
                <ClipboardCheck />
                Anket Modülü
                </CardTitle>
                <CardDescription>
                Öğrencileriniz için anketler oluşturun ve sonuçlarını analiz edin.
                </CardDescription>
            </div>
            <Button onClick={startNewSurvey}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Anket Oluştur
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : surveys && surveys.length > 0 ? (
            <div className="space-y-4">
                {surveys.map(survey => (
                    <div key={survey.id} className="border p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{survey.title}</p>
                            <p className="text-sm text-muted-foreground">{survey.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEditingSurvey(survey)}>Düzenle</Button>
                            <Button variant="outline" size="sm">Sonuçları Gör</Button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center p-10 bg-muted/50 rounded-lg">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                    <List className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Henüz Anket Oluşturulmamış</h3>
                <p className="text-muted-foreground mt-2">
                    İlk anketinizi oluşturmak için "Yeni Anket Oluştur" butonuna tıklayın.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
