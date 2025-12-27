
"use client";

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { Loader2 } from 'lucide-react';

interface ProfileDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teacherProfile: TeacherProfile;
}

export function ProfileDialog({ isOpen, setIsOpen, teacherProfile }: ProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(teacherProfile);

  useEffect(() => {
    setProfile(teacherProfile);
  }, [teacherProfile]);
  
  const handleInputChange = (field: keyof TeacherProfile, value: string) => {
    setProfile(prev => ({...prev, [field]: value }));
  }

  const handleSave = async () => {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profili Düzenle</DialogTitle>
          <DialogDescription>
            Öğretmen bilgilerinizi buradan güncelleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
