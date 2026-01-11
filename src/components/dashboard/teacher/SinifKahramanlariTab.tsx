
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student } from '@/lib/types';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Trophy, Star, Zap, BookOpen, Heart, Smile, 
  Crown, Award, Trash2, UserPlus, X, Check, MinusCircle, Plus
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


const BEHAVIORS = [
  { id: 'beh_1', label: 'Derse Katılım', points: 5, icon: <Zap className="text-yellow-500" /> },
  { id: 'beh_2', label: 'Ödev Tamamlama', points: 10, icon: <BookOpen className="text-blue-500" /> },
  { id: 'beh_3', label: 'Arkadaşına Yardım', points: 8, icon: <Heart className="text-red-500" /> },
  { id: 'beh_4', label: 'Örnek Davranış', points: 15, icon: <Star className="text-purple-500" /> },
  { id: 'beh_5', label: 'Düzenli Defter', points: 5, icon: <Smile className="text-green-500" /> },
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

export function SinifKahramanlariTab({ students }: { students: Student[] }) {
  const { db } = useAuth();
  const { toast } = useToast();
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("points");
  
  const updatePoints = async (student: Student, points: number, reason: string) => {
    if (!db) return;

    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        behaviorScore: increment(points)
      });

      toast({
        title: `${points > 0 ? '+' : ''}${points} Puan ${points > 0 ? 'Verildi' : 'Geri Alındı'}!`,
        description: `${student.name}: ${reason}`,
        className: points > 0 ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800"
      });
      
      // Close modal after action for better user experience
      setIsModalOpen(false);
    } catch (error) {
      console.error("Puan verme/alma hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Puan işlemi gerçekleştirilemedi."
      });
    }
  };

  const handleBadgeClick = async (student: Student, badge: any) => {
    if (!db) return;

    const isOwned = student.badges?.includes(badge.id);

    if (isOwned) {
      // Rozeti geri al
       try {
        const studentRef = doc(db, 'students', student.id);
        await updateDoc(studentRef, {
          badges: arrayRemove(badge.id)
        });

        toast({
          title: "Rozet Geri Alındı!",
          description: `${student.name} öğrencisinden "${badge.name}" rozeti kaldırıldı.`,
          variant: "destructive"
        });
        setIsModalOpen(false); // Modalı kapat
      } catch (error) {
        console.error("Rozet geri alma hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Rozet geri alınamadı."
        });
      }
    } else {
      // Rozeti ver
      try {
        const studentRef = doc(db, 'students', student.id);
        
        await updateDoc(studentRef, {
          badges: arrayUnion(badge.id)
        });

        toast({
          title: "Rozet Kazanıldı!",
          description: `${student.name}: ${badge.name}`,
          className: "bg-yellow-50 border-yellow-200 text-yellow-800"
        });

        setIsModalOpen(false);
      } catch (error) {
        console.error("Rozet hatası:", error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Rozet verilemedi."
        });
      }
    }
  };

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActiveTab("points");
  };

  const safeStudents = students || [];
  const sortedStudentsByName = [...safeStudents].sort((a, b) => (a.number && b.number) ? a.number.localeCompare(b.number, undefined, { numeric: true }) : a.name.localeCompare(b.name));

  return (
    <div className="p-2">
      <Card>
        <CardHeader>
          <CardTitle>Sınıf Listesi ve Puan Durumu</CardTitle>
          <CardDescription>Öğrencilerinize puan ve rozetler vererek onları motive edin.</CardDescription>
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
                        Puan/Rozet Ver
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                {selectedStudent?.name.charAt(0)}
              </span>
              {selectedStudent?.name}
            </DialogTitle>
            <DialogDescription>
              Bu öğrenciye puan veya rozet verin/geri alın.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="points" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="points">Puan İşlemleri</TabsTrigger>
                <TabsTrigger value="badges">Rozet İşlemleri</TabsTrigger>
              </TabsList>
              
              <TabsContent value="points" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {BEHAVIORS.map((behavior) => (
                    <div
                      key={behavior.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full shadow-sm">
                          {behavior.icon}
                        </div>
                        <span className="font-medium text-slate-700">{behavior.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Button size="sm" variant="destructive" onClick={() => updatePoints(selectedStudent, -behavior.points, `${behavior.label} (Geri Alındı)`)}>
                           <MinusCircle className="mr-2 h-4 w-4" /> -{behavior.points}
                         </Button>
                         <Button size="sm" variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-none" onClick={() => updatePoints(selectedStudent, behavior.points, behavior.label)}>
                           <Plus className="mr-2 h-4 w-4" /> +{behavior.points}
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="badges" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_BADGES.map((badge) => {
                      const isOwned = selectedStudent.badges?.includes(badge.id);
                      return (
                        isOwned ? (
                            <AlertDialog key={badge.id}>
                                <AlertDialogTrigger asChild>
                                     <div 
                                      className="relative p-3 rounded-xl border-2 border-dashed border-red-300 flex flex-col items-center text-center transition-all cursor-pointer bg-red-50/50 hover:bg-red-100"
                                    >
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
                             <div 
                              key={badge.id}
                              onClick={() => handleBadgeClick(selectedStudent, badge)}
                              className="p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md"
                            >
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
