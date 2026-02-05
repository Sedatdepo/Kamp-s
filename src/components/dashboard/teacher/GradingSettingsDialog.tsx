
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Criterion, ReportConfig, TeacherProfile, Badge } from '@/lib/types';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA, INITIAL_BADGES } from '@/lib/grading-defaults';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';


interface GradingSettingsDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  teacherProfile: TeacherProfile;
}

type CriteriaKey = 'perfCriteria' | 'projCriteria' | 'behaviorCriteria';
type BadgeCriteriaKey = 'badgeCriteria';

const CriteriaEditor = ({ title, criteria, onUpdate, onAdd, onRemove, onReset }: { title: string, criteria: Criterion[], onUpdate: (id: string, field: keyof Criterion, value: any) => void, onAdd: () => void, onRemove: (id: string) => void, onReset: () => void }) => {
    
  const total = criteria.reduce((sum, c) => sum + (Number(c.max) || 0), 0);
  
  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-slate-700">{title}</h4>
            <Button variant="link" size="sm" onClick={onReset} className="text-xs text-muted-foreground">Varsayılana Sıfırla</Button>
        </div>
      {criteria.map((c, i) => (
        <div key={c.id} className="flex gap-2 items-center">
          <span className="text-slate-400 w-6 text-sm">{i + 1}.</span>
          <Input type="text" value={c.name} onChange={(e) => onUpdate(c.id, 'name', e.target.value)} className="flex-1 p-2 text-sm" placeholder="Kriter Adı" />
          <Input type="number" value={c.max} onChange={(e) => onUpdate(c.id, 'max', parseInt(e.target.value, 10) || 0)} className="w-20 p-2 text-center text-sm" placeholder="Puan" />
          <Button variant="ghost" size="icon" onClick={() => onRemove(c.id)} className="text-red-400 hover:text-red-600 h-8 w-8">
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
      <Button onClick={onAdd} variant="outline" className="w-full border-dashed">
        <Plus size={16} className="mr-2" /> Yeni Kriter Ekle
      </Button>
      <div className="text-right text-sm font-bold text-slate-600">Toplam: {total} Puan</div>
    </div>
  );
};

const BadgeEditor = ({ title, badges, onUpdate, onAdd, onRemove, onReset }: { title: string, badges: Badge[], onUpdate: (id: string, field: keyof Badge, value: any) => void, onAdd: () => void, onRemove: (id: string) => void, onReset: () => void }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-slate-700">{title}</h4>
        <Button variant="link" size="sm" onClick={onReset} className="text-xs text-muted-foreground">Varsayılana Sıfırla</Button>
      </div>
      {badges.map((badge, i) => (
        <div key={badge.id} className="flex gap-2 items-center p-3 border rounded-lg bg-slate-50">
          <Input value={badge.icon} onChange={(e) => onUpdate(badge.id, 'icon', e.target.value)} className="w-12 h-9 text-center text-xl" />
          <div className="flex-grow space-y-1">
            <Input value={badge.name} onChange={(e) => onUpdate(badge.id, 'name', e.target.value)} className="h-9 font-medium" placeholder="Rozet Adı" />
            <Input value={badge.description} onChange={(e) => onUpdate(badge.id, 'description', e.target.value)} className="h-8 text-xs text-muted-foreground" placeholder="Açıklama"/>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onRemove(badge.id)} className="text-red-400 hover:text-red-600 h-8 w-8">
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
       <Button onClick={onAdd} variant="outline" className="w-full border-dashed">
        <Plus size={16} className="mr-2" /> Yeni Rozet Ekle
      </Button>
    </div>
  );
};


export function GradingSettingsDialog({
  isOpen,
  setIsOpen,
  teacherProfile,
}: GradingSettingsDialogProps) {
    const { toast } = useToast();
    const { db } = useAuth();
    const [localProfile, setLocalProfile] = useState(teacherProfile);

    useEffect(() => {
        if(isOpen) {
            setLocalProfile(teacherProfile);
        }
    }, [isOpen, teacherProfile]);

    const updateTeacherProfile = async (data: Partial<TeacherProfile>) => {
      if (!teacherProfile?.id || !db) return;
      const teacherRef = doc(db, 'teachers', teacherProfile.id);
      await updateDoc(teacherRef, data);
    };

    const handleSave = () => {
        updateTeacherProfile(localProfile);
        setIsOpen(false);
        toast({ title: "Ayarlar kaydedildi." });
    };
    
    const handleUpdateReportConfig = (field: keyof ReportConfig, value: string) => {
        setLocalProfile(prev => ({
            ...prev,
            reportConfig: { ...(prev.reportConfig ?? {}), [field]: value }
        }));
    };

    const handleUpdateCriteria = (key: CriteriaKey, updatedCriteria: Criterion[]) => {
        setLocalProfile(prev => ({ ...prev, [key]: updatedCriteria }));
    };
    
    const handleUpdateBadges = (updatedBadges: Badge[]) => {
        setLocalProfile(prev => ({ ...prev, badgeCriteria: updatedBadges }));
    };

    const handleAddCriterion = (key: CriteriaKey) => {
        const criteria = (localProfile as any)[key] || [];
        const newId = (key.substring(0, 1)) + Date.now();
        const newItem = { id: newId, name: 'Yeni Kriter', max: 10 };
        handleUpdateCriteria(key, [...criteria, newItem]);
    };
    
    const handleAddBadge = () => {
        const badges = localProfile.badgeCriteria || [];
        const newId = `badge_${Date.now()}`;
        const newItem: Badge = { id: newId, name: 'Yeni Rozet', description: 'Açıklama', icon: '🏆' };
        handleUpdateBadges([...badges, newItem]);
    };


    const handleRemoveCriterion = (key: CriteriaKey, id: string) => {
        const criteria = (localProfile as any)[key] || [];
        if (criteria.length <= 1) {
            toast({ variant: 'destructive', title: "En az bir kriter kalmalıdır." });
            return;
        }
        handleUpdateCriteria(key, criteria.filter((c: Criterion) => c.id !== id));
    };

    const handleRemoveBadge = (id: string) => {
        const badges = localProfile.badgeCriteria || [];
        handleUpdateBadges(badges.filter(b => b.id !== id));
    };

    const handleUpdateCriterionField = (key: CriteriaKey, id: string, field: keyof Criterion, value: any) => {
        const criteria = (localProfile as any)[key] || [];
        const updated = criteria.map((c: Criterion) => c.id === id ? { ...c, [field]: value } : c);
        handleUpdateCriteria(key, updated);
    };

    const handleUpdateBadgeField = (id: string, field: keyof Badge, value: any) => {
        const badges = localProfile.badgeCriteria || [];
        const updated = badges.map(b => b.id === id ? { ...b, [field]: value } : b);
        handleUpdateBadges(updated);
    };


    const handleResetCriteria = (key: CriteriaKey) => {
        let defaultCriteria;
        if (key === 'perfCriteria') defaultCriteria = INITIAL_PERF_CRITERIA;
        else if (key === 'projCriteria') defaultCriteria = INITIAL_PROJ_CRITERIA;
        else defaultCriteria = INITIAL_BEHAVIOR_CRITERIA;
        handleUpdateCriteria(key, defaultCriteria);
        toast({ title: "Kriterler sıfırlandı." });
    };
    
    const handleResetBadges = () => {
        handleUpdateBadges(INITIAL_BADGES);
        toast({ title: "Rozetler sıfırlandı." });
    };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Değerlendirme Ayarları</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
            <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">Genel</TabsTrigger>
                <TabsTrigger value="perf_criteria">Performans</TabsTrigger>
                <TabsTrigger value="proj_criteria">Proje</TabsTrigger>
                <TabsTrigger value="behavior_criteria">Davranış</TabsTrigger>
                <TabsTrigger value="badge_criteria">Rozetler</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-4 space-y-4">
                <div>
                    <Label htmlFor="schoolName">Okul Adı</Label>
                    <Input id="schoolName" value={localProfile.reportConfig?.schoolName} onChange={(e) => handleUpdateReportConfig('schoolName', e.target.value)} />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="academicYear">Eğitim Yılı</Label>
                        <Input id="academicYear" value={localProfile.reportConfig?.academicYear} onChange={(e) => handleUpdateReportConfig('academicYear', e.target.value)} />
                    </div>
                     <div>
                        <Label htmlFor="semester">Dönem</Label>
                        <Input id="semester" value={localProfile.reportConfig?.semester} onChange={(e) => handleUpdateReportConfig('semester', e.target.value as '1' | '2')} />
                    </div>
                </div>
                 <div>
                    <Label htmlFor="lessonName">Ders Adı</Label>
                    <Input id="lessonName" value={localProfile.reportConfig?.lessonName} onChange={(e) => handleUpdateReportConfig('lessonName', e.target.value)} />
                </div>
                 <div>
                    <Label htmlFor="teacherName">Öğretmen Adı</Label>
                    <Input id="teacherName" value={localProfile.reportConfig?.teacherName} onChange={(e) => handleUpdateReportConfig('teacherName', e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="principalName">Okul Müdürü</Label>
                    <Input id="principalName" value={localProfile.reportConfig?.principalName} onChange={(e) => handleUpdateReportConfig('principalName', e.target.value)} />
                </div>
                 <div>
                    <Label htmlFor="date">Tarih</Label>
                    <Input id="date" value={localProfile.reportConfig?.date} onChange={(e) => handleUpdateReportConfig('date', e.target.value)} />
                </div>
            </TabsContent>
            <TabsContent value="perf_criteria" className="mt-4">
                 <CriteriaEditor 
                    title="Performans Değerlendirme Kriterleri"
                    criteria={localProfile.perfCriteria || INITIAL_PERF_CRITERIA}
                    onUpdate={(id, field, value) => handleUpdateCriterionField('perfCriteria', id, field, value)}
                    onAdd={() => handleAddCriterion('perfCriteria')}
                    onRemove={(id) => handleRemoveCriterion('perfCriteria', id)}
                    onReset={() => handleResetCriteria('perfCriteria')}
                />
            </TabsContent>
            <TabsContent value="proj_criteria" className="mt-4">
                <CriteriaEditor 
                    title="Proje Değerlendirme Kriterleri"
                    criteria={localProfile.projCriteria || INITIAL_PROJ_CRITERIA}
                    onUpdate={(id, field, value) => handleUpdateCriterionField('projCriteria', id, field, value)}
                    onAdd={() => handleAddCriterion('projCriteria')}
                    onRemove={(id) => handleRemoveCriterion('projCriteria', id)}
                    onReset={() => handleResetCriteria('projCriteria')}
                />
            </TabsContent>
             <TabsContent value="behavior_criteria" className="mt-4">
                <CriteriaEditor 
                    title="Davranış Değerlendirme Kriterleri"
                    criteria={localProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA}
                    onUpdate={(id, field, value) => handleUpdateCriterionField('behaviorCriteria', id, field, value)}
                    onAdd={() => handleAddCriterion('behaviorCriteria')}
                    onRemove={(id) => handleRemoveCriterion('behaviorCriteria', id)}
                    onReset={() => handleResetCriteria('behaviorCriteria')}
                />
            </TabsContent>
             <TabsContent value="badge_criteria" className="mt-4">
                <BadgeEditor 
                    title="Rozet Kriterleri"
                    badges={localProfile.badgeCriteria || INITIAL_BADGES}
                    onUpdate={(id, field, value) => handleUpdateBadgeField(id, field, value)}
                    onAdd={handleAddBadge}
                    onRemove={handleRemoveBadge}
                    onReset={handleResetBadges}
                />
            </TabsContent>
            </Tabs>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">İptal</Button>
            </DialogClose>
          <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
