'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
import { Student, Class, SociogramQuestion } from '@/lib/types';
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Users, UserX, Star, BookOpen, Coffee, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';


const getIconComponent = (iconName: SociogramQuestion['icon']) => {
    const icons = { Users, UserX, Star, BookOpen, Coffee };
    const Icon = icons[iconName] || Users;
    return <Icon size={20} />;
};


export function SociogramTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  const student = appUser?.type === 'student' ? appUser.data : null;
  const classId = student?.classId;

  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classQuery);
  
  const [tempAnswers, setTempAnswers] = useState<Record<number, string[]>>({});
  const [manualInputs, setManualInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    if (student && currentClass?.sociogramSurvey) {
      const initialAnswers: Record<number, string[]> = {};
      const initialManualInputs: Record<number, string> = {};

      currentClass.sociogramSurvey.questions.forEach(q => {
        let selections: string[] = [];
        if (q.type === 'positive') selections = student.positiveSelections || [];
        else if (q.type === 'negative') selections = student.negativeSelections || [];
        else if (q.type === 'leadership') selections = student.leadershipSelections || [];
        initialAnswers[q.id] = selections;
      });

       setTempAnswers(initialAnswers);
    }
  }, [student, currentClass]);
  
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !student?.classId) return null;
    return query(collection(db, 'classes', student.classId, 'students'));
  }, [db, student?.classId]);
  const { data: classmates, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);


  const handleSelection = (questionId: number, targetId: string, maxSelections: number) => {
    setTempAnswers(prev => {
      const currentList = prev[questionId] || [];
      const index = currentList.indexOf(targetId);
      
      let newList;
      if (index === -1) {
        if (currentList.length < maxSelections) {
          newList = [...currentList, targetId];
        } else {
          toast({ variant: 'destructive', title: `En fazla ${maxSelections} kişi seçebilirsiniz.` });
          return prev;
        }
      } else {
        newList = currentList.filter(id => id !== targetId);
      }
      return { ...prev, [questionId]: newList };
    });
  };

    const handleSubmit = async () => {
    if (!student || !db || !currentClass?.sociogramSurvey || !classmates) return;

    let allPositive: string[] = [];
    let allNegative: string[] = [];
    let allLeadership: string[] = [];

    currentClass.sociogramSurvey.questions.forEach(q => {
      // Get selections from clickable cards
      const visualAnswers = tempAnswers[q.id] || [];
      
      // Process manually typed names
      const manualText = manualInputs[q.id] || '';
      const manualNames = manualText.split(',').map(name => name.trim()).filter(Boolean);
      const manualIds = manualNames.map(name => {
          const foundStudent = classmates.find(c => c.name.toLowerCase() === name.toLowerCase());
          return foundStudent ? foundStudent.id : null;
      }).filter((id): id is string => id !== null);

      const combinedAnswers = [...new Set([...visualAnswers, ...manualIds])];

      if (q.type === 'positive') allPositive.push(...combinedAnswers);
      if (q.type === 'negative') allNegative.push(...combinedAnswers);
      if (q.type === 'leadership') allLeadership.push(...combinedAnswers);
    });

    const studentRef = doc(db, 'students', student.id);
    try {
        await updateDoc(studentRef, {
            positiveSelections: [...new Set(allPositive)],
            negativeSelections: [...new Set(allNegative)],
            leadershipSelections: [...new Set(allLeadership)],
        });
        toast({ title: 'Cevaplarınız kaydedildi!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Cevaplar kaydedilemedi.' });
    }
  };
  
  if (classLoading || studentsLoading) {
      return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin"/></div>;
  }
  
  if (!currentClass?.isSociogramActive) {
      return (
          <Card>
            <CardHeader><CardTitle>Sosyogram</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground text-center">Sosyogram anketi şu anda aktif değil.</p></CardContent>
          </Card>
      );
  }
  
  const otherClassmates = classmates?.filter(c => c.id !== student?.id) || [];
  const survey = currentClass.sociogramSurvey || { title: '', questions: [] };

  return (
    <div className="space-y-8">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800">{survey.title}</CardTitle>
                <CardDescription>Aşağıdaki soruları dürüstçe cevaplaman sınıf dinamiklerini anlamamıza yardımcı olacaktır.</CardDescription>
            </CardHeader>
        </Card>

        {survey.questions.filter(q => q.active).map(question => (
            <Card key={question.id}>
                <CardHeader className={cn("flex flex-row items-start gap-4", 
                    question.type === 'positive' ? 'bg-green-50/50' : question.type === 'negative' ? 'bg-red-50/50' : 'bg-amber-50/50'
                )}>
                    <div className={cn("mt-1 p-2 rounded-lg",
                         question.type === 'positive' ? 'bg-green-100 text-green-600' : question.type === 'negative' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    )}>
                        {getIconComponent(question.icon)}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{question.text}</CardTitle>
                        <CardDescription>En fazla {question.maxSelections} kişi seçebilirsiniz.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                         {otherClassmates.map(classmate => {
                            const currentAnswers = tempAnswers[question.id] || [];
                            const isSelected = currentAnswers.includes(classmate.id);
                            const isMax = currentAnswers.length >= question.maxSelections;

                            return (
                                 <button
                                    key={classmate.id}
                                    onClick={() => handleSelection(question.id, classmate.id, question.maxSelections)}
                                    disabled={!isSelected && isMax}
                                    className={`relative p-3 rounded-xl border text-left transition-all ${
                                        isSelected 
                                        ? `border-blue-500 bg-blue-50 ring-2 ring-blue-200` 
                                        : isMax 
                                            ? 'opacity-40 grayscale cursor-not-allowed border-gray-100' 
                                            : 'border-gray-100 hover:border-blue-300 hover:shadow-md bg-white'
                                    }`}
                                >
                                    <div className="flex flex-col items-center">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-xl ${classmate.gender === 'F' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                                            {classmate.gender === 'F' ? '👩' : '👨'}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate w-full text-center">{classmate.name.split(' ')[0]}</span>
                                        {isSelected && <div className="absolute top-1 right-1 text-blue-600 bg-white rounded-full"><CheckCircle size={18} /></div>}
                                    </div>
                                </button>
                            );
                         })}
                     </div>
                     <div>
                        <Textarea
                            placeholder="Veya isimleri buraya virgülle ayırarak yazın (örn: Ahmet Yılmaz, Ayşe Kaya)..."
                            value={manualInputs[question.id] || ''}
                            onChange={(e) => setManualInputs(prev => ({...prev, [question.id]: e.target.value}))}
                            className="text-sm"
                        />
                     </div>
                </CardContent>
            </Card>
        ))}
         <div className="flex justify-center py-4">
             <Button onClick={handleSubmit} size="lg" className="px-12 py-6 text-lg font-bold">Cevapları Kaydet</Button>
         </div>
    </div>
  );
}
