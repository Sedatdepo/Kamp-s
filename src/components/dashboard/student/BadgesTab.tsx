"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Star, Zap, Shield } from 'lucide-react';

// Örnek rozet verileri
const badges = [
  {
    id: '1',
    name: 'Katılım Ustası',
    description: 'Tüm derslere zamanında katıldın.',
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    unlocked: true,
  },
  {
    id: '2',
    name: 'Ödev Canavarı',
    description: 'Ayın tüm ödevlerini tamamladın.',
    icon: <Zap className="h-8 w-8 text-blue-500" />,
    unlocked: true,
  },
  {
    id: '3',
    name: 'Sınıf Lideri',
    description: 'Sınıf başkanı seçimini kazandın.',
    icon: <Award className="h-8 w-8 text-green-500" />,
    unlocked: false,
  },
  {
    id: '4',
    name: 'Yardımsever',
    description: 'Arkadaşlarına 5 kez yardım ettin.',
    icon: <Shield className="h-8 w-8 text-red-500" />,
    unlocked: true,
  },
  {
    id: '5',
    name: 'Mükemmel Puan',
    description: 'Bir sınavdan 100 tam puan aldın.',
    icon: <Star className="h-8 w-8 text-yellow-500" />,
    unlocked: false,
  },
    {
    id: '6',
    name: 'Proje Uzmanı',
    description: 'Proje ödevini başarıyla tamamladın.',
    icon: <Zap className="h-8 w-8 text-blue-500" />,
    unlocked: false,
  },
];

export function BadgesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozetlerim</CardTitle>
        <CardDescription>
          Burada kazandığın rozetleri ve başarılarını görebilirsin.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div 
            key={badge.id}
            className={`flex flex-col items-center text-center p-4 border rounded-lg ${badge.unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}
            title={badge.unlocked ? badge.description : `Kilitli: ${badge.description}`}
          >
            {badge.icon}
            <p className="mt-2 font-semibold text-sm">{badge.name}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
