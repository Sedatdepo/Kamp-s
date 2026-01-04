
"use client";

import React, { useState } from 'react';
import { FileText, Settings, Trash2, MoreVertical } from 'lucide-react';
import { ActiveGradingTab, ActiveTerm } from './GradingToolTab';
import { Button } from '@/components/ui/button';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TeacherProfile } from '@/lib/types';


interface GradingHeaderProps {
  activeTab: ActiveGradingTab;
  setActiveTab: (tab: ActiveGradingTab) => void;
  activeTerm: ActiveTerm;
  setActiveTerm: (term: ActiveTerm) => void;
  teacherProfile: TeacherProfile;
  onClearScores: () => void;
  updateTeacherProfile: (data: Partial<TeacherProfile>) => Promise<void>;
}

export function GradingHeader({
  activeTab,
  setActiveTab,
  activeTerm,
  setActiveTerm,
  teacherProfile,
  onClearScores,
  updateTeacherProfile
}: GradingHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline"><MoreVertical className="mr-2 h-4 w-4" /> İşlemler</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Ayarlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                            <Trash2 className="mr-2 h-4 w-4" /> Sayfayı Temizle
                        </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
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
