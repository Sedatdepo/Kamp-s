"use client";

import React, { useState } from 'react';
import { FileText, Settings } from 'lucide-react';
import { Student, TeacherProfile, Criterion } from '@/lib/types';
import { ActiveGradingTab } from './GradingToolTab';
import { Button } from '@/components/ui/button';
import { GradingSettingsDialog } from './GradingSettingsDialog';
import { exportGradingToDoc } from '@/lib/word-export';
import { useToast } from '@/hooks/use-toast';

interface GradingHeaderProps {
  activeTab: ActiveGradingTab;
  setActiveTab: (tab: ActiveGradingTab) => void;
  teacherProfile: TeacherProfile;
  students: Student[];
  currentCriteria: Criterion[];
  updateTeacherProfile: (data: Partial<TeacherProfile>) => Promise<void>;
  className: string;
}

export function GradingHeader({
  activeTab,
  setActiveTab,
  teacherProfile,
  students,
  currentCriteria,
  updateTeacherProfile,
  className
}: GradingHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();

  const getTabStyle = (tabId: ActiveGradingTab) => {
    let color;
    switch(tabId) {
        case 1: color = 'blue'; break;
        case 2: color = 'orange'; break;
        case 3: color = 'violet'; break;
        case 4: color = 'emerald'; break;
        default: color = 'slate';
    }
    const isActive = activeTab === tabId;
    return `flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap 
      ${isActive ? `bg-${color}-100 text-${color}-700 ring-2 ring-${color}-200` : 'text-slate-500 hover:bg-slate-50'}`;
  };

  const handleExport = () => {
    exportGradingToDoc({
      activeTab,
      students,
      currentCriteria,
      reportConfig: teacherProfile.reportConfig,
      className: className,
    });
    toast({ title: "Başarılı", description: "Rapor Word dosyası olarak indirildi." });
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-auto">
          {/* Gelecekteki kontroller için boş */}
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
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExport}>
            <FileText className="mr-2 h-4 w-4" /> Word'e Aktar
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
