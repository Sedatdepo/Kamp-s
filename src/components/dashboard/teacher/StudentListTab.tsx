"use client";

import { useState, useMemo } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Student } from '@/lib/types';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, Plus, Minus, UserPlus, MessageSquare, RefreshCw } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BulkAddStudentsModal } from './BulkAddStudentsModal';
import { useToast } from '@/hooks/use-toast';
import { ChatModal } from './ChatModal';
import { useAuth } from '@/hooks/useAuth';

export function StudentListTab({ classId }: { classId: string }) {
  const { appUser } = useAuth();
  const studentsQuery = useMemo(() => query(collection(db, 'students'), where('classId', '==', classId)), [classId]);
  const { data: students, loading } = useFirestore<Student>('students', studentsQuery);
  const { data: classes } = useFirestore<Class>('classes');

  const [isBulkAddOpen, setBulkAddOpen] = useState(false);
  const [chatStudent, setChatStudent] = useState<Student | null>(null);

  const { toast } = useToast();

  const handleBehaviorScoreChange = async (studentId: string, currentScore: number, change: number) => {
    const studentRef = doc(db, 'students', studentId);
    await updateDoc(studentRef, { behaviorScore: currentScore + change });
  };
  
  const handleResetPassword = async (student: Student) => {
    try {
        const studentRef = doc(db, 'students', student.id);
        // Reset password to student number
        await updateDoc(studentRef, { password: student.number, needsPasswordChange: true });
        toast({ title: "Başarılı", description: `${student.name} adlı öğrencinin şifresi kendi öğrenci numarası olarak sıfırlandı.`});
    } catch (error) {
        toast({ variant: 'destructive', title: "Hata", description: "Şifre sıfırlanamadı."});
    }
  };

  const currentClass = classes.find(c => c.id === classId);
  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : currentClass?.teacherId;

  return (
    <>
      <BulkAddStudentsModal classId={classId} isOpen={isBulkAddOpen} onOpenChange={setBulkAddOpen} />
      {chatStudent && teacherId && (
        <ChatModal 
            student={chatStudent} 
            teacherId={teacherId}
            isOpen={!!chatStudent}
            onOpenChange={(isOpen) => !isOpen && setChatStudent(null)}
        />
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="font-headline">Öğrenciler</CardTitle>
                <CardDescription>Bu sınıftaki öğrencileri yönetin.</CardDescription>
            </div>
            <Button onClick={() => setBulkAddOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Toplu Ekle
            </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İsim</TableHead>
                  <TableHead className="text-center">Davranış Puanı</TableHead>
                  <TableHead className="text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="h-16 w-1/3 bg-muted/30 animate-pulse rounded-md"></TableCell>
                            <TableCell className="h-16 w-1/3 bg-muted/30 animate-pulse rounded-md"></TableCell>
                            <TableCell className="h-16 w-1/3 bg-muted/30 animate-pulse rounded-md"></TableCell>
                        </TableRow>
                    ))
                ) : students.length > 0 ? (
                  students.map((student, index) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={PlaceHolderImages[index % PlaceHolderImages.length].imageUrl} data-ai-hint="student portrait" />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">#{student.number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleBehaviorScoreChange(student.id, student.behaviorScore, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-lg w-8 text-center">{student.behaviorScore}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleBehaviorScoreChange(student.id, student.behaviorScore, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setChatStudent(student)}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Sohbeti Aç
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleResetPassword(student)}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Şifreyi Sıfırla
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                            Bu sınıfta öğrenci bulunamadı. 'Toplu Ekle' özelliğini kullanarak ekleyin.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
