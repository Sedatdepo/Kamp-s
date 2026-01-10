
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student } from '@/lib/types';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { 
  Trophy, Star, Zap, BookOpen, Heart, Smile, 
  Crown, Award, Trash2, UserPlus, X, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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
  
  const handleGivePoints = async (student: Student, points: number, reason: string) => {
    if (!db) return;

    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, {
        behaviorScore: increment(points)
      });

      toast({
        title: `+${points} Puan Verildi!`,
        description: `${student.name}: ${reason}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Puan verme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Puan verilemedi."
      });
    }
  };

  const handleGiveBadge = async (student: Student, badge: any) => {
    if (!db) return;

    if (student.badges?.includes(badge.id)) {
      toast({
        variant: "destructive",
        title: "Zaten Var",
        description: `${student.name} zaten bu rozete sahip.`
      });
      return;
    }

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
  };

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setActiveTab("points");
  };

  const safeStudents = students || [];
  const sortedStudents = [...safeStudents].sort((a, b) => (b.behaviorScore || 0) - (a.behaviorScore || 0));

  return (
    <div className="space-y-6 p-2">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-300" />
          </h2>
          <p className="text-indigo-100 opacity-90">Öğrencilerinizi motive edin, puanlar ve rozetler verin.</p>
        </div>
      </div>

      {safeStudents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
          <p className="text-slate-500">Bu sınıfta henüz öğrenci yok.</p>
        </div>
      ) : (
        <Card>
            <CardHeader>
                <CardTitle>Sınıf Listesi ve Puan Durumu</CardTitle>
                <CardDescription>Öğrencilere puan veya rozet vermek için işlem yapabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Sıra</TableHead>
                            <TableHead>Öğrenci Adı</TableHead>
                            <TableHead>Okul No</TableHead>
                            <TableHead>Puan</TableHead>
                            <TableHead>Rozetler</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStudents.map((student, index) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-bold">{index + 1}</TableCell>
                                <TableCell>{student.name}</TableCell>
                                <TableCell>{student.number}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{student.behaviorScore || 0}</Badge>
                                </TableCell>
                                <TableCell className="flex gap-1">
                                    {student.badges?.slice(0, 4).map((badgeId) => (
                                        <span key={badgeId} title={AVAILABLE_BADGES.find(b => b.id === badgeId)?.name} className="text-lg">
                                            {AVAILABLE_BADGES.find(b => b.id === badgeId)?.icon || '🏅'}
                                        </span>
                                    ))}
                                    {(student.badges?.length || 0) > 4 && (
                                        <span className="text-xs font-bold">+{(student.badges?.length || 0) - 4}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={() => openStudentModal(student)}>
                                        <Award className="mr-2 h-4 w-4" /> Puan/Rozet Ver
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

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
              Bu öğrenciye puan veya rozet verin.
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="points" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="points">Puan Ver</TabsTrigger>
                <TabsTrigger value="badges">Rozet Ver</TabsTrigger>
              </TabsList>
              
              <TabsContent value="points" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {BEHAVIORS.map((behavior) => (
                    <button
                      key={behavior.id}
                      onClick={() => handleGivePoints(selectedStudent, behavior.points, behavior.label)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                          {behavior.icon}
                        </div>
                        <span className="font-medium text-slate-700">{behavior.label}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 group-hover:bg-green-200 border-none">
                        +{behavior.points} Puan
                      </Badge>
                    </button>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="badges" className="mt-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_BADGES.map((badge) => {
                      const isOwned = selectedStudent.badges?.includes(badge.id);
                      return (
                        <div 
                          key={badge.id}
                          onClick={() => !isOwned && handleGiveBadge(selectedStudent, badge)}
                          className={`
                            relative p-3 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer
                            ${isOwned 
                              ? 'bg-yellow-50 border-yellow-200 opacity-80 cursor-default' 
                              : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}
                          `}
                        >
                          <div className="text-3xl mb-2">{badge.icon}</div>
                          <div className="font-bold text-sm text-slate-800">{badge.name}</div>
                          <div className="text-xs text-slate-500 line-clamp-1">{badge.description}</div>
                          
                          {isOwned && (
                            <div className="absolute top-2 right-2 text-green-600 bg-white rounded-full p-0.5 shadow-sm">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
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
    </div>
  );
}
