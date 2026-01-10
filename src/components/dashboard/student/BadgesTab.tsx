
"use client";

import { useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Star, Zap, Shield, BookOpen, Smile, Crown, Trash2 } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';

// Rozet Tanımları (Öğretmen paneliyle aynı olmalı)
const AVAILABLE_BADGES = [
  { id: '1', name: 'Katılım Ustası', icon: <Star className="h-8 w-8 text-yellow-500" />, description: 'İstikrarlı derse katılım.' },
  { id: '2', name: 'Ödev Canavarı', icon: <Zap className="h-8 w-8 text-blue-500" />, description: 'Ödevlerini eksiksiz yapar.' },
  { id: '3', name: 'Sınıf Lideri', icon: <Crown className="h-8 w-8 text-yellow-600" />, description: 'Liderlik vasıfları gösterir.' },
  { id: '4', name: 'Yardımsever', icon: <Shield className="h-8 w-8 text-red-500" />, description: 'Arkadaşlarına yardım eder.' },
  { id: '5', name: 'Mükemmel Puan', icon: <Star className="h-8 w-8 text-purple-500" />, description: 'Sınavlarda üstün başarı.' },
  { id: '6', name: 'Proje Uzmanı', icon: <Zap className="h-8 w-8 text-green-500" />, description: 'Projeleri başarıyla tamamlar.' },
  { id: '7', name: 'Kitap Kurdu', icon: <BookOpen className="h-8 w-8 text-blue-400" />, description: 'Çok kitap okur.' },
  { id: '8', name: 'Temizlik Elçisi', icon: <Trash2 className="h-8 w-8 text-green-600" />, description: 'Çevresini temiz tutar.' },
  { id: 'hw-master', name: 'Ödev Ustası', icon: <BookOpen className="h-8 w-8 text-indigo-500" />, description: 'Bir ödevi zamanında teslim etti.' },
];

export function BadgesTab() {
  const authContext = useContext(AuthContext);
  const { appUser } = authContext || {};
  const studentData = appUser?.data;

  // Öğrencinin sahip olduğu rozet ID'leri
  const ownedBadges = studentData?.badges || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozetlerim</CardTitle>
        <CardDescription>
          Toplam Puanın: <span className="font-bold text-indigo-600 text-lg">{studentData?.behaviorScore || 0}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ownedBadges.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Henüz hiç rozet kazanmadın.</p>
                <p className="text-sm">Derslere katıl, ödevlerini yap ve rozetleri topla!</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {AVAILABLE_BADGES.map((badge) => {
                const isOwned = ownedBadges.includes(badge.id);
                // Sadece kazanılanları göster (veya tümünü gösterip kilitli olanları soluk yap)
                // Şimdilik sadece kazanılanları veya hepsini gösterip durumunu belirtelim.
                
                return (
                <div 
                    key={badge.id}
                    className={`flex flex-col items-center text-center p-4 border rounded-lg transition-all ${isOwned ? 'bg-yellow-50 border-yellow-200 shadow-sm opacity-100' : 'opacity-40 grayscale bg-slate-50'}`}
                    title={isOwned ? badge.description : `Kilitli: ${badge.description}`}
                >
                    <div className="mb-2">{badge.icon}</div>
                    <p className="font-bold text-sm text-slate-800">{badge.name}</p>
                    {isOwned && <span className="text-[10px] text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full mt-1">Kazanıldı</span>}
                </div>
                );
            })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
