
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { useNotification } from '@/hooks/useNotification';
import { Bell, FileText, Home, MessageSquare, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NotificationBadge = () => (
    <Badge variant="destructive" className="absolute top-1 right-1 h-3 w-3 p-0 flex items-center justify-center text-xs">
    </Badge>
);

export function StudentSidebar({ activeTab, setActiveTab }: StudentSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const { notifications } = useNotification();

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    setOpenMobile(false);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary" />
          <span className="font-headline text-xl font-semibold">Öğrenci Paneli</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSelect('home')} isActive={activeTab === 'home'}>
                    <Home />
                    <span>Anasayfa</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSelect('announcements')} isActive={activeTab === 'announcements'}>
                    <Bell />
                    <span>Duyurular</span>
                    {notifications.announcements && <NotificationBadge />}
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSelect('teacher-chats')} isActive={activeTab === 'teacher-chats'}>
                    <MessageSquare />
                    <span>Sohbetlerim</span>
                    {/* TODO: Add notification logic for new messages */}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSelect('risks')} isActive={activeTab === 'risks'}>
                    <ShieldAlert />
                    <span>Risk Formu</span>
                    {notifications.riskForm && <NotificationBadge />}
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSelect('info')} isActive={activeTab === 'info'}>
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
