
"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TeacherProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Separator } from '@/components/ui/separator';
import { usePushNotifications } from '@/hooks/usePushNotifications';


const NotificationSettings = () => {
    const { 
        isNotificationPermissionGranted, 
        requestNotificationPermission, 
        isSubscribing,
        unsubscribeFromNotifications,
        error
    } = usePushNotifications();

    if (error) {
        return <p className="text-sm text-destructive">Bildirim hatası: {error.message}</p>
    }
    
    if (typeof window !== 'undefined' && Notification.permission === 'denied') {
        return <p className="text-sm text-red-600 font-medium">Bildirimler tarayıcı ayarlarından engellenmiş. Lütfen bu site için tarayıcı bildirim ayarlarına manuel olarak izin verin.</p>
    }

    if (isNotificationPermissionGranted) {
        return (
            <div className="space-y-3">
                <p className="text-sm text-green-600 font-medium">Bu cihazda anlık bildirimler aktif.</p>
                <Button onClick={unsubscribeFromNotifications} variant="destructive" disabled={isSubscribing}>
                    {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
                    Bildirimleri Kapat
                </Button>
            </div>
        )
    }
    
    return (
        <div className="space-y-3">
             <p className="text-sm text-gray-600 font-medium">Bu cihaz için anlık bildirimler kapalı.</p>
            <Button onClick={requestNotificationPermission} disabled={isSubscribing}>
                {isSubscribing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                Bildirimlere İzin Ver
            </Button>
        </div>
    )
}

interface ProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teacherProfile: TeacherProfile;
}

export function ProfileDialog({ isOpen, setIsOpen, teacherProfile }: ProfileDialogProps) {
  const { toast } = useToast();
  const { db } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(teacherProfile);

  useEffect(() => {
    setProfile(teacherProfile);
  }, [teacherProfile]);
  
  const handleInputChange = (field: keyof TeacherProfile, value: string) => {
    setProfile(prev => ({...prev, [field]: value }));
  }

  const handleSave = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
        const teacherRef = doc(db, 'teachers', profile.id);
        await updateDoc(teacherRef, {
            name: profile.name,
            branch: profile.branch,
            schoolName: profile.schoolName,
            principalName: profile.principalName
        });
        toast({ title: 'Profil güncellendi.'});
        setIsOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Hata', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profil ve Ayarlar</DialogTitle>
          <DialogDescription>
            Öğretmen bilgilerinizi ve uygulama ayarlarınızı buradan güncelleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div>
                <h3 className="text-md font-semibold mb-4 border-b pb-2">Kişisel Bilgiler</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Ad Soyad</Label>
                        <Input id="name" value={profile.name} onChange={(e) => handleInputChange('name', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="branch" className="text-right">Branş</Label>
                        <Input id="branch" value={profile.branch} onChange={(e) => handleInputChange('branch', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="schoolName" className="text-right">Okul Adı</Label>
                        <Input id="schoolName" value={profile.schoolName} onChange={(e) => handleInputChange('schoolName', e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="principalName" className="text-right">Müdür Adı</Label>
                        <Input id="principalName" value={profile.principalName} onChange={(e) => handleInputChange('principalName', e.target.value)} className="col-span-3" />
                    </div>
                </div>
            </div>

            <Separator />
            
            <div>
                 <h3 className="text-md font-semibold mb-4 border-b pb-2">Bildirim Ayarları</h3>
                 <div className="p-4 rounded-lg bg-muted/50">
                    <NotificationSettings />
                 </div>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
