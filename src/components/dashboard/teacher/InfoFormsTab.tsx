'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, Timestamp, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { Class, Student, TeacherProfile, GuidanceReferralRecord } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuidanceReferralTab } from './GuidanceReferralTab';


interface InfoFormsTabProps {
  classId: string;
  teacherProfile: TeacherProfile | null;
  currentClass: Class | null;
}

export function InfoFormsTab({ classId, teacherProfile, currentClass }: InfoFormsTabProps) {
    const { db } = useAuth();
    const studentsQuery = useMemoFirebase(() => (classId && db ? query(collection(db, 'students'), where('classId', '==', classId)) : null), [classId, db]);
    const { data: students, isLoading: studentsLoading } = useCollection<Student>(studentsQuery);

    return (
        <Tabs defaultValue="guidance-referral">
            <TabsList>
                <TabsTrigger value="student-info-forms" disabled>Öğrenci Bilgi Formları</TabsTrigger>
                <TabsTrigger value="guidance-referral">Rehberliğe Yönlendirme</TabsTrigger>
            </TabsList>
            <TabsContent value="student-info-forms" className="mt-4">
                <p>Bu bölüm geliştirme aşamasındadır.</p>
            </TabsContent>
            <TabsContent value="guidance-referral" className="mt-4">
                 <GuidanceReferralTab />
            </TabsContent>
        </Tabs>
    );
}
