
"use client";

import React, { useState } from 'react';
import { FileText, Settings, Trash2 } from 'lucide-react';
import { Student, TeacherProfile, Criterion } from '@/lib/types';
import { ActiveGradingTab, ActiveTerm } from './GradingToolTab';
import { Button } from '@/components/ui/button';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface GradingHeaderProps {
  activeTab: ActiveGradingTab;
  setActiveTab: (tab: ActiveGradingTab) => void;
  activeTerm: ActiveTerm;
  setActiveTerm: (term: ActiveTerm) => void;
  teacherProfile: TeacherProfile;
  onExport: () => void;
  onClearScores: () => void;
  updateTeacherProfile: (data: Partial<TeacherProfile>) => Promise<void>;
}

export function GradingHeader({
  activeTab,
  setActiveTab,
  activeTerm,
  setActiveTerm,
  teacherProfile,
  onExport,
  onClearScores,
  updateTeacherProfile
}: GradingHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const getTabStyle = (tabId: ActiveGradingTab) => {
    const isActive = activeTab === tabId;
    return `flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap 
      ${isActive ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 'text-slate-500 hover:bg-slate-50'}`;
  };

  const getTermButtonStyle = (term: ActiveTerm) => {
    return activeTerm === term
      ? "bg-slate-800 text-white hover:bg-slate-700"
      : "bg-white text-slate-600 hover:bg-slate-100 border";
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg">
           <Button size="sm" onClick={() => setActiveTerm(1)} className={getTermButtonStyle(1)}>1. Dönem</Button>
           <Button size="sm" onClick={() => setActiveTerm(2)} className={getTermButtonStyle(2)}>2. Dönem</Button>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto gap-1">
          <button onClick={() => setActiveTab(1)} className={getTabStyle(1)}>1. Performans</button>
          <button onClick={() => setActiveTab(2)} className={getTabStyle(2)}>2. Performans</button>
          <button onClick={() => setActiveTab(3)} className={getTabStyle(3)}>Proje Ödevi</button>
          <button onClick={() => setActiveTab(4)} className={getTabStyle(4)}>Davranış Notu</button>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Ayarlar
          </Button>
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Sayfayı Temizle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bu sayfadaki tüm notları temizlemek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={onClearScores} className="bg-destructive hover:bg-destructive/90">
                    Temizle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
          <Button onClick={onExport}>
            <FileText className="mr-2 h-4 w-4" /> Dışa Aktar
          </Button>
        </div>
      </div>
      <GradingSettingsDialog
        isOpen={isSettingsOpen}
        setIsOpen={setIsSettingsOpen}
        teacherProfile={teacherProfile}
        updateTeacherProfile={updateTeacherProfile}
      />
    </>
  );
}
