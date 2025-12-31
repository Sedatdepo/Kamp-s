
'use client';

import React from 'react';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ClipboardCheck } from 'lucide-react';

interface SurveyTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

export function SurveyTab({ students, currentClass, teacherProfile }: SurveyTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <ClipboardCheck />
          Anket Modülü
        </CardTitle>
        <CardDescription>
          Bu özellik yakında aktif olacaktır. Buradan öğrencileriniz için anketler oluşturup sonuçlarını analiz edebileceksiniz.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center p-10 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">Anket modülü yapım aşamasındadır.</p>
        </div>
      </CardContent>
    </Card>
  );
}
