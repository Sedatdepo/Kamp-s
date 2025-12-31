'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Survey, SurveyResponse, Question } from '@/lib/types';
import { collection, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send, FileText, CheckSquare, Circle, ChevronDown, Star, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StudentSurveyTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentId = appUser?.type === 'student' ? appUser.data.id : null;
  const classId = appUser?.type === 'student' ? appUser.data.classId : null;

  const surveysQuery = useMemo(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'surveys'), where('classId', '==', classId), where('isActive', '==', true));
  }, [db, classId]);

  const { data: activeSurveys, loading: surveysLoading } = useFirestore<Survey[]>(`active-surveys-${classId}`, surveysQuery);

  const responsesQuery = useMemo(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'surveyResponses'), where('studentId', '==', studentId));
  }, [db, studentId]);

  const { data: userResponses, loading: responsesLoading } = useFirestore<SurveyResponse[]>(`user-responses-${studentId}`, responsesQuery);

  const unansweredSurveys = useMemo(() => {
    if (!activeSurveys || !userResponses) return [];
    const respondedSurveyIds = new Set(userResponses.map(r => r.surveyId));
    return activeSurveys.filter(s => !respondedSurveyIds.has(s.id));
  }, [activeSurveys, userResponses]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSurvey || !studentId || !db) return;

    setIsSubmitting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const answers: { questionId: string; answer: string | string[] }[] = [];

    selectedSurvey.questions.forEach(q => {
      if (q.type === 'checkbox') {
        answers.push({ questionId: q.id, answer: formData.getAll(`q_${q.id}`) as string[] });
      } else {
        answers.push({ questionId: q.id, answer: formData.get(`q_${q.id}`) as string });
      }
    });

    try {
      await addDoc(collection(db, 'surveyResponses'), {
        surveyId: selectedSurvey.id,
        studentId: studentId,
        submittedAt: Timestamp.now(),
        answers: answers,
      });
      toast({ title: "Anket gönderildi!", description: "Katılımınız için teşekkürler." });
      setSelectedSurvey(null); // Return to list view
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Anket gönderilemedi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (surveysLoading || responsesLoading) {
    return <Card><CardContent className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  if (selectedSurvey) {
    return (
        <div className="max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
           <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
               <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
                  <div className="absolute -bottom-10 left-8">
                     <div className="bg-white p-4 rounded-2xl shadow-lg inline-block">
                        <FileText size={32} className="text-indigo-600" />
                     </div>
                  </div>
               </div>

               <div className="px-8 pt-14 pb-10">
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{selectedSurvey.title}</h1>
                  <p className="text-slate-500 leading-relaxed text-lg">{selectedSurvey.description}</p>
               </div>

               <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-10">
                 {selectedSurvey.questions.map((q, idx) => (
                   <div key={q.id} className="space-y-4">
                     <div className="flex items-start gap-3">
                       <span className="text-indigo-200 font-bold text-xl select-none">{idx + 1}.</span>
                       <label className="block text-lg font-semibold text-slate-800 leading-snug pt-0.5">
                         {q.text} {q.required && <span className="text-pink-500 text-sm align-top ml-1">*</span>}
                       </label>
                     </div>
                     
                     <div className="ml-8">
                      {q.type === 'text' && (
                        <input name={`q_${q.id}`} required={q.required} className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 focus:border-indigo-500 focus:ring-0 focus:bg-white rounded-t-lg px-4 py-3 transition-all placeholder:text-slate-400" placeholder="Cevabınız..." />
                      )}
                      {q.type === 'paragraph' && (
                        <textarea name={`q_${q.id}`} required={q.required} rows={4} className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 focus:border-indigo-500 focus:ring-0 focus:bg-white rounded-t-lg px-4 py-3 transition-all placeholder:text-slate-400 resize-none" placeholder="Detaylı cevabınız..."></textarea>
                      )}
                      {q.type === 'dropdown' && (
                        <div className="relative">
                          <select name={`q_${q.id}`} required={q.required} className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 focus:border-indigo-500 focus:ring-0 focus:bg-white rounded-t-lg px-4 py-3 appearance-none cursor-pointer">
                            <option value="">Seçiniz...</option>
                            {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20}/>
                        </div>
                      )}
                      {q.type === 'date' && (
                        <input type="date" name={`q_${q.id}`} required={q.required} className="w-full bg-slate-50 border-0 border-b-2 border-slate-200 focus:border-indigo-500 focus:ring-0 focus:bg-white rounded-t-lg px-4 py-3 text-slate-600" />
                      )}
                      {q.type === 'linear' && (
                        <div className="flex justify-between items-center max-w-md p-4 bg-slate-50 rounded-xl border border-slate-100">
                           {[1, 2, 3, 4, 5].map((val) => (
                             <label key={val} className="flex flex-col items-center gap-2 cursor-pointer group">
                               <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{val}</span>
                               <input type="radio" name={`q_${q.id}`} value={val} required={q.required} className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-full checked:border-indigo-600 checked:bg-indigo-600 transition-all hover:border-indigo-400" />
                             </label>
                           ))}
                        </div>
                      )}
                      {(q.type === 'multiple' || q.type === 'checkbox') && (
                        <div className="grid gap-3">
                          {q.options?.map((opt, i) => (
                            <label key={i} className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-200">
                              <input 
                                type={q.type === 'multiple' ? 'radio' : 'checkbox'}
                                name={`q_${q.id}`} 
                                value={opt}
                                required={q.required && q.type === 'multiple'}
                                className={`peer appearance-none w-5 h-5 border-2 border-slate-300 checked:border-indigo-600 checked:bg-indigo-600 transition-colors shrink-0 ${q.type === 'multiple' ? 'rounded-full' : 'rounded-md'}`}
                              />
                              <div className="absolute left-4 top-4 w-5 h-5 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity">
                                 <Check size={12} strokeWidth={4} />
                              </div>
                              <span className="text-slate-600 font-medium peer-checked:text-indigo-900">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                     </div>
                   </div>
                 ))}

                 <div className="pt-8 border-t border-slate-100 flex items-center justify-end">
                   <Button id="submit-btn" type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2">
                     {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send size={18} />}
                     <span>Anketi Tamamla</span>
                   </Button>
                 </div>
               </form>
           </div>
        </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Anketlerim</CardTitle>
        <CardDescription>Öğretmeniniz tarafından yayınlanan ve henüz cevaplamadığınız anketler.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {unansweredSurveys.length > 0 ? (
          unansweredSurveys.map(survey => (
            <Card key={survey.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{survey.title}</CardTitle>
                <CardDescription>{survey.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setSelectedSurvey(survey)}>Anketi Cevapla</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center p-10 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Cevaplamanız gereken aktif bir anket bulunmuyor.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
