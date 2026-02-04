
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class, BehaviorLog } from '@/lib/types';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, setDoc, deleteField } from 'firebase/firestore';
import { 
  Trophy, Star, Zap, BookOpen, Heart, Smile, 
  Crown, Award, Trash2, UserPlus, X, Check, MinusCircle, Plus, Share2, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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


const BEHAVIORS = [
  { id: 'beh_1', label: 'Derse Katılım', points: 5, icon: <Zap className="text-yellow-500" /> },
  { id: 'beh_2', label: 'Ödev Tamamlama', points: 10, icon: <BookOpen className="text-blue-500" /> },
  { id: 'beh_3', label: 'Arkadaşına Yardım', points: 8, icon: <Heart className="text-red-500" /> },
  { id: 'beh_4', label: 'Örnek Davranış', points: 15, icon: <Star className="text-purple-500" /> },
  { id: 'beh_5', label: 'Düzenli Defter', points: 5, icon: <Smile className="text-green-500" /> },
  // Negative behaviors
  { id: 'beh_neg_1', label: 'Derse Geç Kalma', points: -3, icon: <Zap className="text-orange-500" /> },
  { id: 'beh_neg_2', label: 'Ödev Eksikliği', points: -5, icon: <BookOpen className="text-orange-500" /> },
  { id: 'beh_neg_3', label: 'Dersin Akışını Bozma', points: -10, icon: <Heart className="text-orange-500" /> },
];

const AVAILABLE_BADGES = [
  { id: '1', name: 'Katılım Ustası', icon: '⭐', description: 'İstikrarlı derse katılım.', cost: 50 },
  { id: '2', name: 'Ödev Canavarı', icon: '⚡', description: 'Ödevlerini eksiksiz yapar.', cost: 60 },
  { id: '3', name: 'Sınıf Lideri', icon: '👑', description: 'Liderlik vasıfları gösterir.', cost: 100 },
  { id: '4', name: 'Yardımsever', icon: '🛡️', description: 'Arkadaşlarına yardım eder.', cost: 40 },
  { id: '5', name: 'Mükemmel Puan', icon: '🌟', description: 'Sınavlarda üstün başarı.', cost: 80 },
  { id: '6', name: 'Proje Uzmanı', icon: '🚀', description: 'Projeleri başarıyla tamamlar.', cost: 70 },
  { id: '7', name: 'Kitap Kurdu', icon: '📚', description: 'Çok kitap okur.', cost: 30 },
  { id: '8', name: 'Temizlik Elçisi', icon: '♻️', description: 'Çevresini temiz tutar.', cost: 20 },
];

export function SinifKahramanlariTab({ students, currentClass }: { students: Student[], currentClass: Class | null }) {
  const { db } = useAuth();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("add-behavior");
  
  const handleToggleGamification = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    const publicViewRef = doc(db, 'publicViews', currentClass.id);

    try {
        await updateDoc(classRef, { isGamificationActive: checked });
        if (checked) {
             const publicData = {
                className: currentClass.name,
                gamification: {
                    students: students.map(s => ({
                        id: s.id,
                        name: s.name,
                        number: s.number,
                        behaviorScore: s.behaviorScore,
                        badges: s.badges || [],
                    })),
                }
            };
            await setDoc(publicViewRef, publicData, { merge: true });
            toast({ title: 'Oyunlaştırma modülü yayınlandı!' });
        } else {
            await updateDoc(publicViewRef, { gamification: deleteField() });
            toast({ title: 'Oyunlaştırma modülü yayından kaldırıldı.' });
        }
    } catch(error) {
        toast({ title: `Oyunlaştırma modülü öğrenciler için ${checked ? 'aktif' : 'pasif'} edildi.` });
    }
  };

  const addBehaviorLog = async (student: Student, behavior: {id: string; label: string; points: number}) => {
    if (!db || !student?.id) return;
    
    const newLog: BehaviorLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      behaviorId: behavior.id,
      label: behavior.label,
      points: behavior.points,
    };

    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        behaviorScore: increment(behavior.points),
        behaviorLogs: arrayUnion(newLog)
      });
      toast({
        title: `Davranış Kaydedildi: ${behavior.points > 0 ? '+' : ''}${behavior.points} Puan`,
        description: `${student.name}: ${behavior.label}`,
        className: behavior.points > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800",
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
        await updateDoc(studentRef, {
          badges: arrayRemove(badge.id)
        });
        toast({
          title: "Rozet Geri Alındı!",
          description: `${student.name} öğrencisinden "${badge.name}" rozeti kaldırıldı.`,
          variant: "destructive"
        });
      } else {
        await updateDoc(studentRef, {
          badges: arrayUnion(badge.id)
        });
        toast({
          title: "Rozet Kazanıldı!",
          description: `${student.name}: ${badge.name}`,
          className: "bg-yellow-50 border-yellow-200 text-yellow-800"
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Rozet işlemi hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Rozet işlemi gerçekleştirilemedi."
      });
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
                <CardTitle>Sınıf Listesi ve Puan Durumu</CardTitle>
                <CardDescription>Öğrencilerinizin davranışlarını kaydedin ve rozetlerle motive edin.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="gamification-toggle"
                  checked={currentClass?.isGamificationActive ?? false}
                  onCheckedChange={handleToggleGamification}
                  disabled={!currentClass}
                />
                <Label htmlFor="gamification-toggle">Öğrencilerle Paylaş</Label>
                 {currentClass?.isGamificationActive && (
                    <Button variant="outline" size="sm" onClick={() => {
                        const link = `${window.location.origin}/view/gamification/${currentClass.code}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: 'Paylaşım linki kopyalandı!' });
                    }}>
                        <Share2 className="mr-2 h-4 w-4" /> Linki Kopyala
                    </Button>
                )}
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
                        <span key={badgeId} className="text-lg" title={AVAILABLE_BADGES.find(b => b.id === badgeId)?.name}>
                          {AVAILABLE_BADGES.find(b => b.id === badgeId)?.icon || '🏅'}
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

      {/* İŞLEM MODALI */}
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
                    {BEHAVIORS.map((behavior) => (
                      <div key={behavior.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-full shadow-sm">{behavior.icon}</div>
                          <div>
                            <span className="font-medium text-slate-700">{behavior.label}</span>
                            <span className={`text-sm font-bold ml-2 ${behavior.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({behavior.points > 0 ? '+' : ''}{behavior.points} P)
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addBehaviorLog(selectedStudent, behavior)}>
                          Ekle
                        </Button>
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
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                                        <Trash2 size={16}/>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                        <AlertDialogDescription>Bu davranış kaydını silmek istediğinizden emin misiniz? Bu işlem öğrencinin puanını etkileyecektir.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteBehaviorLog(selectedStudent, log)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                    {(selectedStudent?.behaviorLogs || []).length === 0 && (
                        <p className="text-center text-sm text-muted-foreground p-4">Henüz davranış kaydı yok.</p>
                    )}
                    </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="badges" className="mt-4">
                <ScrollArea className="h-[350px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_BADGES.map((badge) => {
                      const isOwned = selectedStudent.badges?.includes(badge.id);
                      return (
                        isOwned ? (
                            <AlertDialog key={badge.id}>
                                <AlertDialogTrigger asChild>
                                     <div className="relative p-3 rounded-xl border-2 border-dashed border-red-300 flex flex-col items-center text-center transition-all cursor-pointer bg-red-50/50 hover:bg-red-100">
                                      <div className="absolute top-2 right-2 text-green-600 bg-white rounded-full p-0.5 shadow-sm">
                                        <Check size={14} strokeWidth={3} />
                                      </div>
                                      <div className="text-3xl mb-2">{badge.icon}</div>
                                      <div className="font-bold text-sm text-slate-800">{badge.name}</div>
                                      <div className="text-xs text-slate-500 line-clamp-1">{badge.description}</div>
                                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                          <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded-full flex items-center gap-1"><Trash2 size={12}/> Geri Al</span>
                                      </div>
                                    </div>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Rozeti Geri Al</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            "{badge.name}" rozetini {selectedStudent.name} adlı öğrenciden geri almak istediğinize emin misiniz?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleBadgeClick(selectedStudent, badge)} className="bg-destructive hover:bg-destructive/90">Geri Al</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : (
                             <div onClick={() => handleBadgeClick(selectedStudent, badge)} className="p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md">
                              <div className="text-3xl mb-2">{badge.icon}</div>
                              <div className="font-bold text-sm text-slate-800">{badge.name}</div>
                              <div className="text-xs text-slate-500 line-clamp-1">{badge.description}</div>
                            </div>
                        )
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
