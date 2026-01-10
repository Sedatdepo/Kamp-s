
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeType, CustomBadge } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const INITIAL_BADGES: BadgeType[] = [
  { id: 'b1', name: 'Kitap Kurdu', icon: '📚', description: 'Okuma sevgisi yüksek!', cost: 50 },
  { id: 'b2', name: 'Matematik Dehası', icon: '🧮', description: 'Problem çözme ustası.', cost: 60 },
  { id: 'b3', name: 'Sorumluluk Lideri', icon: '👑', description: 'Görevlerini eksiksiz yapar.', cost: 80 },
  { id: 'b4', name: 'Yardım Meleği', icon: '😇', description: 'Herkese yardıma koşar.', cost: 40 },
  { id: 'b5', name: 'Temizlik Elçisi', icon: '♻️', description: 'Çevresini temiz tutar.', cost: 30 },
  { id: 'b6', name: 'Sanatçı Ruhu', icon: '🎨', description: 'Yaratıcılıkta sınır tanımaz.', cost: 45 },
  { id: 'b7', name: 'Sporcu', icon: '⚽', description: 'Enerjisi hiç bitmez!', cost: 45 },
  { id: 'b8', name: 'Genç Bilim İnsanı', icon: '🧬', description: 'Meraklı ve araştırmacı.', cost: 70 },
  { id: 'b9', name: 'Kodlama Ustası', icon: '💻', description: 'Geleceğin yazılımcısı.', cost: 75 },
  { id: 'b10', name: 'Müzik Dehası', icon: '🎵', description: 'Ritim duygusu harika.', cost: 45 },
];


const BadgeDisplay = ({ badge, earned }: { badge: BadgeType | CustomBadge; earned: boolean }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
          earned
            ? 'bg-amber-50 border-amber-200 shadow-sm'
            : 'bg-slate-100 border-slate-200 opacity-50 grayscale'
        }`}>
          <div className="text-4xl">{badge.icon}</div>
          <div className="font-bold text-sm text-center text-slate-800">{badge.name}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{badge.description}</p>
        {earned && badge.dateAwarded && <p className="text-xs text-muted-foreground">Kazanma Tarihi: {new Date(badge.dateAwarded).toLocaleDateString('tr-TR')}</p>}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function BadgesTab() {
  const { appUser } = useAuth();

  const student = appUser?.type === 'student' ? appUser.data : null;

  const level = useMemo(() => student ? Math.floor((student.xp || 0) / 50) + 1 : 1, [student]);
  const currentLevelXp = useMemo(() => student ? (student.xp || 0) % 50 : 0, [student]);
  const xpToNextLevel = 50;
  const progressPercentage = (currentLevelXp / xpToNextLevel) * 100;

  if (!student) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yükleniyor...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Öğrenci verileri yükleniyor, lütfen bekleyin.</p>
        </CardContent>
      </Card>
    );
  }

  const earnedStandardBadgeIds = new Set(student.badges || []);
  const earnedCustomBadges = student.customBadges || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-3">
            <Trophy className="text-primary" />
            Puan ve Seviye Durumum
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <div className="font-bold text-primary text-xl">Seviye {level}</div>
              <div className="text-right">
                <span className="font-bold text-2xl text-slate-800">{student.xp || 0}</span>
                <span className="text-sm text-slate-500"> / {level * 50} XP</span>
              </div>
            </div>
            <Progress value={progressPercentage} className="h-4" />
            <p className="text-xs text-center text-slate-500 mt-2">
              Sonraki seviye için {xpToNextLevel - currentLevelXp} XP daha kazanmalısın!
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3">
            <Award className="text-primary" />
            Kazandığım Rozetler
          </CardTitle>
          <CardDescription>Öğretmeninin sana verdiği özel başarımlar ve standart rozetler.</CardDescription>
        </CardHeader>
        <CardContent>
          {(earnedStandardBadgeIds.size === 0 && earnedCustomBadges.length === 0) ? (
             <div className="text-center p-8 bg-slate-50 rounded-lg">
                <p className="text-slate-500">Henüz hiç rozet kazanmadın. Puan toplayarak yeni rozetler açabilirsin!</p>
             </div>
          ) : (
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {earnedCustomBadges.map(badge => (
                    <BadgeDisplay key={badge.id} badge={badge} earned={true} />
                ))}
                {INITIAL_BADGES.map(badge => (
                    <BadgeDisplay key={badge.id} badge={badge} earned={earnedStandardBadgeIds.has(badge.id)} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
