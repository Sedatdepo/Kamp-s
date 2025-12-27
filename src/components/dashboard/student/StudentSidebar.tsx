"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Home, ShieldAlert, FileText, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function StudentSidebar({ activeTab, setActiveTab }: StudentSidebarProps) {
    const { appUser } = useAuth();
    if(appUser?.type !== 'student') return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="font-headline text-xl font-semibold">İTO KAMPÜS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('home')}
              isActive={activeTab === 'home'}
            >
              <Home />
              <span>Anasayfa</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('announcements')}
              isActive={activeTab === 'announcements'}
            >
              <Bell />
              <span>Duyurular</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('risks')}
              isActive={activeTab === 'risks'}
            >
              <ShieldAlert />
              <span>Risk Formu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('info')}
              isActive={activeTab === 'info'}
            >
              <FileText />
              <span>Bilgi Formu</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
