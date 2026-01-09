
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Star, BookCheck, ThumbsUp } from 'lucide-react';
import { Badge as BadgeType } from '@/lib/types';

// Örnek Rozetler (gerçekte bunlar veritabanından veya bir kural motorundan gelir)
const exampleBadges: BadgeType[] = [
    { id: 'hw-master', name: 'Ödev Ustası', description: '5 ödevi zamanında teslim etti.', icon: 'BookCheck', dateAwarded: '2024-07-20' },
    { id: 'top-student', name: 'Sınıf Birincisi', description: 'Dönem sonu not ortalaması en yüksek öğrenci.', icon: 'Award', dateAwarded: '2024-06-15' },
    { id: 'good-samaritan', name: 'İyi Davranış', description: 'Ay boyunca davranış puanı 100 olarak kaldı.', icon: 'ThumbsUp', dateAwarded: '2024-05-30' },
];

const ICONS: { [key: string]: React.ElementType } = {
    BookCheck,
    Award,
    ThumbsUp,
    Star,
};

export function AchievementsTab() {
  const { appUser } = useAuth();
  
  if (appUser?.type !== 'student') {
    return null;
  }

  const student = appUser.data;
  const xp = student.xp || 0;
  // Gerçek uygulamada öğrencinin kendi rozetleri kullanılacak. Şimdilik örnek veri:
  const badges = student.badges && student.badges.length > 0 ? student.badges : exampleBadges;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-3 text-3xl">
            <Award className="h-8 w-8 text-amber-500" />
            Başarımlarım
          </CardTitle>
          <CardDescription>Kazandığınız rozetler, unvanlar ve deneyim puanınız.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card className="bg-gradient-to-br from-primary to-blue-700 text-primary-foreground p-6 text-center shadow-lg">
                        <CardDescription className="text-blue-200">Deneyim Puanı (XP)</CardDescription>
                        <p className="text-6xl font-bold">{xp}</p>
                    </Card>
                </div>
                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle>Kazanılan Rozetler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {badges.length > 0 ? (
                                badges.map(badge => {
                                    const Icon = ICONS[badge.icon] || Star;
                                    return (
                                    <div key={badge.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                                        <div className="bg-amber-100 text-amber-600 p-3 rounded-full">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{badge.name}</p>
                                            <p className="text-sm text-muted-foreground">{badge.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Kazanma Tarihi: {new Date(badge.dateAwarded).toLocaleDateString('tr-TR')}</p>
                                        </div>
                                    </div>
                                    )
                                })
                            ) : (
                                <p className="text-sm text-center text-muted-foreground py-4">Henüz kazanılmış bir rozet yok.</p>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

