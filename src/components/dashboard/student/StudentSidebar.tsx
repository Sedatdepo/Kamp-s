
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
import { useNotification } from '@/hooks/useNotification';

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NotificationBadge = () => (
  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
  </span>
);


export function StudentSidebar({ activeTab, setActiveTab }: StudentSidebarProps) {
    const { appUser } = useAuth();
    const { notifications } = useNotification();
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
              {notifications.announcements && <NotificationBadge />}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('risks')}
              isActive={activeTab === 'risks'}
            >
              <ShieldAlert />
              <span>Risk Formu</span>
              {notifications.riskForm && <NotificationBadge />}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTab('info')}
              isActive={activeTab === 'info'}
            >
              <FileText />
              <span>Bilgi Formu</span>
              {notifications.infoForm && <NotificationBadge />}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
