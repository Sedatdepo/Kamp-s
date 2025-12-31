'use client';

import React, { useState } from 'react';
import { Student, Class, TeacherProfile, Survey } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Plus, List, ArrowLeft, Save } from 'lucide-react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SurveyTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

// Placeholder for the creation form
const SurveyCreationForm = ({ onBack }: { onBack: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Yeni Anket Oluştur</CardTitle>
      <CardDescription>Anketinizin temel bilgilerini girin ve soruları eklemeye başlayın.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label htmlFor="survey-title">Anket Başlığı</Label>
            <Input id="survey-title" placeholder="Örn: 1. Dönem Veli Memnuniyet Anketi" />
        </div>
         <div className="space-y-2">
            <Label htmlFor="survey-description">Açıklama</Label>
            <Textarea id="survey-description" placeholder="Anketin amacı hakkında kısa bir bilgi verin." />
        </div>
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground text-sm">Soru ekleme özelliği yakında aktif olacaktır.</p>
        </div>
         <div className="flex justify-between items-center">
            <Button onClick={onBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Geri Dön
            </Button>
            <Button disabled>
                <Save className="mr-2 h-4 w-4" />
                Kaydet ve Devam Et
            </Button>
        </div>
    </CardContent>
  </Card>
);

export function SurveyTab({ students, currentClass, teacherProfile }: SurveyTabProps) {
  const { db } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const surveysQuery = useMemo(() => {
    if (!db || !currentClass?.id) return null;
    return query(collection(db, 'surveys'), where('classId', '==', currentClass.id));
  }, [db, currentClass?.id]);

  const { data: surveys, loading } = useFirestore<Survey[]>(`surveys-${currentClass?.id}`, surveysQuery);

  if (isCreating) {
    return <SurveyCreationForm onBack={() => setIsCreating(false)} />;
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
            <Button onClick={() => setIsCreating(true)}>
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
                        <Button variant="outline" size="sm">Sonuçları Gör</Button>
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
