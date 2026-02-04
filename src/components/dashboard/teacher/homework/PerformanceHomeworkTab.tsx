'use client';

import React, { useMemo, useState } from 'react';
import { Homework, Submission, Student, Badge as BadgeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookText, Clock, CalendarIcon, CheckCircle, ArrowLeft, ClipboardList, Send, Paperclip, Download } from 'lucide-react';
import { collection, doc, addDoc, query, where, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { saveAs } from 'file-saver';


// Detail View for a single performance homework
const HomeworkDetailView = ({ homework, onBack }: { homework: Homework, onBack: () => void }) => {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{homework.text}</CardTitle>
                        <CardDescription>Ödevinizin detayları ve değerlendirme kriterleri aşağıdadır.</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={onBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {homework.instructions && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg">Proje Yönergesi</h3>
                        <div className="p-4 bg-muted/50 rounded-lg text-sm prose">
                            <p>{homework.instructions}</p>
                        </div>
                    </div>
                )}
                {homework.rubric && (
                    <div>
                        <h3 className="font-bold mb-2 text-lg flex items-center gap-2"><ClipboardList/> Değerlendirme Kriterleri</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kriter</TableHead>
                                        <TableHead className="text-right">Puan</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homework.rubric.map((item: any) => (
                                        <TableRow key={item.label}>
                                            <TableCell>
                                                <p className="font-medium">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-lg">{item.score}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// List item for a single performance homework
const HomeworkItem = ({ homework, student, classId, onSelect }: { homework: Homework, student: Student, classId: string, onSelect: () => void }) => {
    const { db } = useFirebase();

    const submissionsQuery = useMemoFirebase(() => {
      if (!db || !classId) return null;
      return query(collection(db, 'classes', classId, 'homeworks', homework.id, 'submissions'), where('studentId', '==', student.id));
    }, [db, classId, homework.id, student.id]);

    const { data: submissions } = useCollection<Submission>(submissionsQuery);

    const existingSubmission = useMemo(() => {
        return submissions?.[0];
    }, [submissions]);
    
    return (
        <div onClick={onSelect} className={`cursor-pointer border p-4 rounded-lg shadow-sm space-y-3 transition-all hover:border-primary/50 ${existingSubmission ? 'bg-green-50 dark:bg-green-900/20' : 'bg-background'}`}>
            <div>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2 pb-2 border-b">
                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>Veriliş: {format(new Date(homework.assignedDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    {homework.dueDate && (
                        <div className="flex items-center gap-1.5 text-red-600 font-semibold"><CalendarIcon className="h-3 w-3" /><span>Son Teslim: {format(new Date(homework.dueDate), 'd MMMM yyyy', { locale: tr })}</span></div>
                    )}
                 </div>

                 <h2 className="text-xl font-bold">{homework.text}</h2>
                 <p className="text-xs text-muted-foreground">(Detayları ve değerlendirme kriterlerini görmek için tıklayın)</p>

            </div>

            {existingSubmission && (
                <div className='bg-white dark:bg-muted/50 p-3 rounded-md border'>
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                        <CheckCircle className="h-5 w-5"/>
                        <p>Teslim Edildi ({format(new Date(existingSubmission.submittedAt), 'd MMMM yyyy, HH:mm', { locale: tr })})</p>
                    </div>
                    {existingSubmission.text && <p className="text-sm whitespace-pre-wrap font-mono p-2 rounded-md bg-muted/50">{existingSubmission.text}</p>}
                     {existingSubmission.feedback && (
                         <div className='bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md border border-blue-200 mt-2'>
                             <p className='text-xs font-bold text-blue-700 mb-1'>Öğretmen Geri Bildirimi</p>
                             <p className="text-sm">{existingSubmission.feedback}</p>
                         </div>
                    )}
                     {existingSubmission.grade !== undefined && (
                         <div className='flex justify-end mt-2'>
                            <Badge>Not: {existingSubmission.grade}</Badge>
                         </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function PerformanceHomeworkTab({ student, classId, assignmentType, title, description }: { student: Student; classId: string; assignmentType: 'performance' | 'project'; title: string; description: string; }) {
  const { db } = useFirebase();
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const homeworksQuery = useMemoFirebase(() => {
    if (!db || !classId || !student?.id) return null;
    return query(
        collection(db, 'classes', classId, 'homeworks'), 
        where('assignmentType', '==', assignmentType),
        where('assignedStudents', 'array-contains', student.id)
    );
  }, [db, classId, student?.id, assignmentType]);

  const { data: homeworks, isLoading: homeworksLoading } = useCollection<Homework>(homeworksQuery);

  const sortedHomeworks = useMemo(() => {
    if (!homeworks) return [];
    return [...homeworks].sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime());
  }, [homeworks]);

  if (selectedHomework) {
    return <HomeworkDetailView homework={selectedHomework} onBack={() => setSelectedHomework(null)} />;
  }
  
  if (homeworksLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-6">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
    
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <BookText className="h-6 w-6"/>
            {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {sortedHomeworks.length > 0 ? (
            sortedHomeworks.map((hw) => (
              <HomeworkItem key={hw.id} homework={hw} student={student} classId={classId} onSelect={() => setSelectedHomework(hw)} />
            ))
          ) : (
            <div className="text-center py-10 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Henüz verilmiş bir {title.toLowerCase()} yok.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
