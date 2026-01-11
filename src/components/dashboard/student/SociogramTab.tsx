'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, query, updateDoc } from 'firebase/firestore';
import { Student, Class, SociogramQuestion } from '@/lib/types';
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Users, UserX, Star, BookOpen, Coffee, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';


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
  
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !student?.classId) return null;
    return query(collection(db, 'classes', student.classId, 'students'));
  }, [db, student?.classId]);
  const { data: classmates, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  
  const otherClassmates = useMemo(() => classmates?.filter(c => c.id !== student?.id) || [], [classmates, student]);
  const survey = useMemo(() => currentClass?.sociogramSurvey || { title: '', questions: [] }, [currentClass]);
  

  useEffect(() => {
    if (student && survey) {
      const initialAnswers: Record<number, string[]> = {};
      survey.questions.forEach(q => {
        let selections: string[] = [];
        if (q.type === 'positive') selections = student.positiveSelections || [];
        else if (q.type === 'negative') selections = student.negativeSelections || [];
        else if (q.type === 'leadership') selections = student.leadershipSelections || [];
        initialAnswers[q.id] = selections;
      });
      setAnswers(initialAnswers);
    }
  }, [student, survey]);
  
  const handleSelection = (questionId: number, targetId: string, maxSelections: number) => {
    setAnswers(prev => {
      const currentList = prev[questionId] || [];
      const isSelected = currentList.includes(targetId);
      
      let newList;
      if (isSelected) {
        newList = currentList.filter(id => id !== targetId);
      } else {
        if (currentList.length < maxSelections) {
          newList = [...currentList, targetId];
        } else {
          toast({ variant: 'destructive', title: `En fazla ${maxSelections} kişi seçebilirsiniz.` });
          return prev;
        }
      }
      return { ...prev, [questionId]: newList };
    });
  };

  const handleSubmit = async () => {
    if (!student || !db) return;

    let allPositive: string[] = [];
    let allNegative: string[] = [];
    let allLeadership: string[] = [];

    survey.questions.forEach(q => {
      const questionAnswers = answers[q.id] || [];
      if (q.type === 'positive') allPositive.push(...questionAnswers);
      if (q.type === 'negative') allNegative.push(...questionAnswers);
      if (q.type === 'leadership') allLeadership.push(...questionAnswers);
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

  return (
    <div className="space-y-8">
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-800">{survey.title}</CardTitle>
                <CardDescription>Aşağıdaki soruları dürüstçe cevaplaman sınıf dinamiklerini anlamamıza yardımcı olacaktır.</CardDescription>
            </CardHeader>
        </Card>

        {survey.questions.filter(q => q.active).map(question => {
            const currentAnswers = answers[question.id] || [];
            const isMax = currentAnswers.length >= question.maxSelections;

            return (
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
                            <CardDescription>En fazla {question.maxSelections} kişi seçebilirsiniz. ({currentAnswers.length}/{question.maxSelections})</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-2 rounded-lg border bg-slate-50 p-4">
                            {otherClassmates.map(classmate => {
                                const isSelected = currentAnswers.includes(classmate.id);
                                return (
                                    <button
                                        key={classmate.id}
                                        onClick={() => handleSelection(question.id, classmate.id, question.maxSelections)}
                                        disabled={!isSelected && isMax}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                                            isSelected 
                                                ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                                                : isMax
                                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                                        )}
                                    >
                                        {classmate.name}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )
        })}
         <div className="flex justify-center py-4">
             <Button onClick={handleSubmit} size="lg" className="px-12 py-6 text-lg font-bold">Cevapları Kaydet</Button>
         </div>
    </div>
  );
}
