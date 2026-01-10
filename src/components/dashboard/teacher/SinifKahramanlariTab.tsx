
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Student } from '@/lib/types';
import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { 
  Trophy, Star, Zap, BookOpen, Heart, Smile, 
  Crown, Award, Trash2, Volume2, VolumeX, Timer, X, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- SABİT VERİLER (Öğrenci Paneliyle Uyumlu ID'ler) ---

const BEHAVIORS = [
  { id: 'beh_1', label: 'Derse Katılım', points: 5, icon: <Zap className="text-yellow-500" /> },
  { id: 'beh_2', label: 'Ödev Tamamlama', points: 10, icon: <BookOpen className="text-blue-500" /> },
  { id: 'beh_3', label: 'Arkadaşına Yardım', points: 8, icon: <Heart className="text-red-500" /> },
  { id: 'beh_4', label: 'Örnek Davranış', points: 15, icon: <Star className="text-purple-500" /> },
  { id: 'beh_5', label: 'Düzenli Defter', points: 5, icon: <Smile className="text-green-500" /> },
];

// Bu ID'ler öğrenci panelindeki BadgesTab ile uyumlu olmalı veya genel bir yapı kurulmalı.
// Şimdilik temel rozetleri tanımlıyoruz.
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
  
  // Basit Ses Efekti
  const playSound = (type: 'success' | 'badge') => {
    // Tarayıcı kısıtlamaları nedeniyle basit bir beep veya console log
    // Gerçek bir uygulamada burada Audio objesi kullanılır.
    // const audio = new Audio('/sounds/success.mp3'); audio.play();
  };

  // --- PUAN VERME İŞLEMİ ---
  const handleGivePoints = async (student: Student, points: number, reason: string) => {
    if (!db) return;

    try {
      const studentRef = doc(db, 'students', student.id);
      
      // Firestore'da atomik güncelleme (Anlık yansır)
      await updateDoc(studentRef, {
        behaviorScore: increment(points)
      });

      toast({
        title: `+${points} Puan Verildi!`,
        description: `${student.name}: ${reason}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      playSound('success');
      setIsModalOpen(false); // Modalı kapat
    } catch (error) {
      console.error("Puan verme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Puan verilemedi."
      });
    }
  };

  // --- ROZET VERME İŞLEMİ ---
  const handleGiveBadge = async (student: Student, badge: any) => {
    if (!db) return;

    // Zaten bu rozete sahip mi?
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

      playSound('badge');
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

  // Öğrencileri puana göre sırala (Liderlik Tablosu mantığı)
  // FIX: students prop'u undefined ise boş dizi kullan
  const safeStudents = students || [];
  const sortedStudents = [...safeStudents].sort((a, b) => (b.behaviorScore || 0) - (a.behaviorScore || 0));

  return (
    <div className="space-y-6 p-2">
      {/* Üst Bilgi Kartı */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-300" />
          </h2>
          <p className="text-indigo-100 opacity-90">Öğrencilerinizi motive edin, puanlar ve rozetler verin.</p>
        </div>
        <div className="hidden md:block">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center min-w-[120px]">
            <div className="text-xs uppercase font-bold tracking-wider opacity-80">Toplam Puan</div>
            <div className="text-2xl font-black">{safeStudents.reduce((acc, s) => acc + (s.behaviorScore || 0), 0)}</div>
          </div>
        </div>
      </div>

      {/* Öğrenci Listesi Grid */}
      {safeStudents.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
          <p className="text-slate-500">Bu sınıfta henüz öğrenci yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedStudents.map((student, index) => (
            <Card 
              key={student.id} 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-indigo-300 group relative overflow-hidden"
              onClick={() => openStudentModal(student)}
            >
              {/* Sıralama Rozeti (İlk 3) */}
              {index < 3 && (
                <div className={`absolute top-0 right-0 p-2 rounded-bl-xl text-white font-bold text-xs shadow-sm z-10
                  ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                  #{index + 1}
                </div>
              )}

              <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3 border-4 
                    ${index === 0 ? 'border-yellow-100 bg-yellow-50 text-yellow-600' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                    {student.name.charAt(0)}
                  </div>
                  {/* Puan Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
                    {student.behaviorScore || 0}p
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 truncate w-full">{student.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{student.number}</p>

                {/* Rozet Önizleme */}
                <div className="flex gap-1 justify-center h-6">
                  {student.badges && student.badges.slice(0, 3).map((badgeId, i) => (
                    <span key={i} title="Rozet sahibi" className="text-sm">
                      {AVAILABLE_BADGES.find(b => b.id === badgeId)?.icon || '🏅'}
                    </span>
                  ))}
                  {(student.badges?.length || 0) > 3 && (
                    <span className="text-xs bg-slate-100 text-slate-500 px-1 rounded-full flex items-center">
                      +{ (student.badges?.length || 0) - 3 }
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
