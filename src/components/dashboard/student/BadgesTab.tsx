
"use client";

import { useContext, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, Star, Zap, Shield, BookOpen, Smile, Crown, Trash2 } from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TeacherProfile } from '@/lib/types';
import { INITIAL_BEHAVIOR_CRITERIA } from '@/lib/grading-defaults';

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
  const { appUser, db } = useAuth();
  
  if (appUser?.type !== 'student') return null;

  const studentData = appUser.data;

  const teacherQuery = useMemoFirebase(() => (studentData.teacherId && db ? doc(db, 'teachers', studentData.teacherId) : null), [studentData.teacherId, db]);
  const { data: teacherProfile } = useDoc<TeacherProfile>(teacherQuery);
  const behaviorCriteria = teacherProfile?.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;

  const ownedBadges = studentData?.badges || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AVAILABLE_BADGES.map((badge) => {
                    const isOwned = ownedBadges.includes(badge.id);
                    if (!isOwned) return null;
                    
                    return (
                    <div 
                        key={badge.id}
                        className="flex flex-col items-center text-center p-4 border rounded-lg bg-yellow-50 border-yellow-200 shadow-sm"
                        title={badge.description}
                    >
                        <div className="mb-2">{badge.icon}</div>
                        <p className="font-bold text-sm text-slate-800">{badge.name}</p>
                    </div>
                    );
                })}
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
         <Card>
             <CardHeader>
                <CardTitle>Davranış Puanı Kriterleri</CardTitle>
                <CardDescription>Davranış puanınız 100 puandan başlar ve aşağıdaki olumsuz davranışlarda bulunduğunuzda belirtilen miktarda düşer.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Olumsuz Davranış</TableHead>
                            <TableHead className="text-right">Düşülecek Puan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {behaviorCriteria.map(criterion => (
                            <TableRow key={criterion.id}>
                                <TableCell>{criterion.name}</TableCell>
                                <TableCell className="text-right font-semibold text-red-600">-{criterion.max}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
