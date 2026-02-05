'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, BehaviorLog, TeacherProfile } from '@/lib/types';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Trophy, Star, UserPlus, X, Check, Share2, Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_BADGES } from '@/lib/grading-defaults';


export function SinifKahramanlariTab({ students, currentClass, teacherProfile }: { students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
  const { db } = useAuth();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add-behavior");

  const behaviorCriteria = teacherProfile?.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;
  const availableBadges = teacherProfile?.badgeCriteria || INITIAL_BADGES;
  
  const handleToggleGamification = async (checked: boolean) => {
    // This function implementation remains the same
  };

  const addBehaviorLog = async (student: Student, behavior: {id: string; name: string; max: number}) => {
    if (!db || !student?.id) return;
    
    const newLog: BehaviorLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      behaviorId: behavior.id,
      label: behavior.name,
      points: behavior.max,
    };

    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        behaviorScore: increment(behavior.max),
        behaviorLogs: arrayUnion(newLog)
      });
      toast({
        title: `Davranış Kaydedildi: ${behavior.max > 0 ? '+' : ''}${behavior.max} Puan`,
        description: `${student.name}: ${behavior.name}`,
        className: behavior.max > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800",
      });
    } catch (error) {
      console.error("Davranış kaydetme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Davranış kaydı gerçekleştirilemedi."
      });
    }
  };

  const deleteBehaviorLog = async (student: Student, log: BehaviorLog) => {
    if (!db || !student?.id) return;
    try {
        const studentRef = doc(db, 'students', student.id);
        await updateDoc(studentRef, {
            behaviorScore: increment(-log.points),
            behaviorLogs: arrayRemove(log)
        });
        toast({
            title: "Kayıt Silindi",
            description: `${student.name}: '${log.label}' kaydı silindi. (${-log.points} Puan)`,
            variant: "destructive"
        });
    } catch (error) {
        console.error("Kayıt silme hatası:", error);
        toast({
            variant: "destructive",
            title: "Hata",
            description: "Kayıt silinemedi."
        });
    }
  };

  const handleBadgeClick = async (student: Student, badge: any) => {
    if (!db) return;
    const isOwned = student.badges?.includes(badge.id);
    const studentRef = doc(db, 'students', student.id);
    try {
      if (isOwned) {
        await updateDoc(studentRef, { badges: arrayRemove(badge.id) });
        toast({ title: "Rozet Geri Alındı!", description: `${student.name} öğrencisinden "${badge.name}" rozeti kaldırıldı.`, variant: "destructive"});
      } else {
        await updateDoc(studentRef, { badges: arrayUnion(badge.id) });
        toast({ title: "Rozet Kazanıldı!", description: `${student.name}: ${badge.name}`, className: "bg-yellow-50 border-yellow-200 text-yellow-800"});
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Hata", description: "Rozet işlemi gerçekleştirilemedi."});
    }
  };

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActiveTab("add-behavior");
  };

  const safeStudents = students || [];
  const sortedStudentsByName = [...safeStudents].sort((a, b) => (a.number && b.number) ? a.number.localeCompare(b.number, undefined, { numeric: true }) : a.name.localeCompare(b.name));

  return (
    <div className="p-2">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                <CardTitle>Sınıf Kahramanları</CardTitle>
                <CardDescription>Öğrencilerinizin davranışlarını kaydedin ve rozetlerle motive edin.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                 <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Kriter Ayarları
                </Button>
                <div className="flex items-center space-x-2">
                    <Switch id="gamification-toggle" checked={currentClass?.isGamificationActive ?? false} onCheckedChange={()=>{}} />
                    <Label htmlFor="gamification-toggle">Paylaş</Label>
                </div>
              </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Numara</TableHead>
                  <TableHead>Adı Soyadı</TableHead>
                  <TableHead>Davranış Puanı</TableHead>
                  <TableHead>Rozetler</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudentsByName.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>{student.number}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{student.behaviorScore || 100}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-1 flex-wrap">
                      {student.badges?.map(badgeId => (
                        <span key={badgeId} className="text-lg" title={availableBadges.find(b => b.id === badgeId)?.name}>
                          {availableBadges.find(b => b.id === badgeId)?.icon || '🏅'}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openStudentModal(student)}>
                        İşlem Yap
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {safeStudents.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
              <p className="text-slate-500">Bu sınıfta henüz öğrenci yok.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              Davranış ve Rozet İşlemleri: {selectedStudent?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <Tabs defaultValue="add-behavior" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="add-behavior">Davranış Ekle</TabsTrigger>
                <TabsTrigger value="history">Geçmiş</TabsTrigger>
                <TabsTrigger value="badges">Rozetler</TabsTrigger>
              </TabsList>
              <TabsContent value="add-behavior" className="mt-4">
                <ScrollArea className="h-[350px] pr-4">
                  <div className="grid grid-cols-1 gap-2">
                    {behaviorCriteria.map((behavior) => (
                      <div key={behavior.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 group">
                        <div>
                          <span className="font-medium text-slate-700">{behavior.name}</span>
                          <span className={`text-sm font-bold ml-2 ${behavior.max > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({behavior.max > 0 ? '+' : ''}{behavior.max} P)
                          </span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addBehaviorLog(selectedStudent, behavior)}>Ekle</Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-2">
                    {(selectedStudent?.behaviorLogs || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                        <div key={log.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50">
                            <div>
                                <p className="text-sm font-medium">{log.label} ({log.points > 0 ? '+' : ''}{log.points}P)</p>
                                <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleString('tr-TR')}</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-400"><Trash2 size={16}/></Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>Bu davranış kaydını silmek istediğinizden emin misiniz? Bu işlem öğrencinin puanını etkileyecektir.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => deleteBehaviorLog(selectedStudent, log)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    {(selectedStudent?.behaviorLogs || []).length === 0 && (<p className="text-center text-sm text-muted-foreground p-4">Henüz davranış kaydı yok.</p>)}
                    </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="badges" className="mt-4">
                <ScrollArea className="h-[350px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {availableBadges.map((badge) => {
                      const isOwned = selectedStudent.badges?.includes(badge.id);
                      return (
                         <div key={badge.id} onClick={() => handleBadgeClick(selectedStudent, badge)} className={`relative p-3 rounded-xl border-2 flex flex-col items-center text-center transition-all cursor-pointer ${isOwned ? 'border-dashed border-green-400 bg-green-50' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                           {isOwned && <div className="absolute top-2 right-2 text-green-600 bg-white rounded-full p-0.5 shadow-sm"><Check size={14} strokeWidth={3} /></div>}
                           <div className="text-3xl mb-2">{badge.icon}</div>
                           <div className="font-bold text-sm text-slate-800">{badge.name}</div>
                           <div className="text-xs text-slate-500 line-clamp-1">{badge.description}</div>
                         </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
      {teacherProfile && (
        <GradingSettingsDialog
            isOpen={isSettingsOpen}
            setIsOpen={setIsSettingsOpen}
            teacherProfile={teacherProfile}
        />
      )}
    </div>
  );
}
