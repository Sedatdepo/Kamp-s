'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
import { Student, Class, SociogramQuestion } from '@/lib/types';
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Users, UserX, Star, BookOpen, Coffee, X as XIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';


const getIconComponent = (iconName: SociogramQuestion['icon']) => {
    const icons = { Users, UserX, Star, BookOpen, Coffee };
    const Icon = icons[iconName] || Users;
    return <Icon size={20} />;
};


const MultiSelectCombobox = ({
  options,
  selected,
  onSelectionChange,
  maxSelections,
  placeholder = "Arkadaş seç..."
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onSelectionChange: (newSelection: string[]) => void;
  maxSelections: number;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onSelectionChange(selected.filter((s) => s !== value));
    } else {
      if (selected.length < maxSelections) {
        onSelectionChange([...selected, value]);
      } else {
        toast({
          variant: 'destructive',
          title: `En fazla ${maxSelections} kişi seçebilirsiniz.`,
        });
      }
    }
    setOpen(false);
  };

  const handleRemove = (value: string) => {
    onSelectionChange(selected.filter((s) => s !== value));
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10"
        >
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {option?.label}
                    <div
                      role="button"
                      aria-label={`Remove ${option?.label}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          handleRemove(value);
                        }
                      }}
                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                      tabIndex={0}
                    >
                      <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </div>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Arkadaş ara..." />
          <CommandEmpty>Öğrenci bulunamadı.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  disabled={selected.length >= maxSelections && !selected.includes(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


export function SociogramTab() {
  const { appUser, db } = useAuth();
  const { toast } = useToast();
  
  const student = appUser?.type === 'student' ? appUser.data : null;
  const classId = student?.classId;

  const classQuery = useMemoFirebase(() => (classId && db ? doc(db, 'classes', classId) : null), [classId, db]);
  const { data: currentClass, isLoading: classLoading } = useDoc<Class>(classQuery);
  
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !classId) return null;
    return query(collection(db, 'students'), where('classId', '==', classId));
  }, [db, classId]);
  const { data: classmates, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);
  
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  
  const otherClassmates = useMemo(() => {
    if (!classmates || !student) return [];
    return classmates.filter(c => c.id !== student.id);
  }, [classmates, student]);

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
  
  const handleSelectionChange = (questionId: number, newSelection: string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: newSelection }));
  };

  const handleSubmit = async () => {
    if (!student || !db || !classId) return;

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
        console.error("Sociogram save error:", e);
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

  const classmateOptions = otherClassmates.map(c => ({ value: c.id, label: c.name }));

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
                            <CardDescription>En fazla {question.maxSelections} kişi seçebilirsiniz. ({answers[question.id]?.length || 0}/{question.maxSelections})</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <MultiSelectCombobox
                            options={classmateOptions}
                            selected={answers[question.id] || []}
                            onSelectionChange={(newSelection) => handleSelectionChange(question.id, newSelection)}
                            maxSelections={question.maxSelections}
                        />
                    </CardContent>
                </Card>
            )
        )}
         <div className="flex justify-center py-4">
             <Button onClick={handleSubmit} size="lg" className="px-12 py-6 text-lg font-bold">Cevapları Kaydet</Button>
         </div>
    </div>
  );
}
