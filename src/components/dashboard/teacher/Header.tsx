"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { ProfileDialog } from './ProfileDialog';
import { useAuth } from '@/hooks/useAuth';

function getInitials(name: string = '') {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
}


export function Header() {
  const { appUser, signOut } = useAuth();
  const [isProfileOpen, setProfileOpen] = useState(false);

  const userName = appUser?.type === 'teacher' ? appUser.profile?.name : appUser?.data.name;
  const userEmail = appUser?.type === 'teacher' ? appUser.data.email : undefined;


  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={appUser?.type === 'teacher' ? `https://api.dicebear.com/8.x/initials/svg?seed=${userName}` : undefined} />
                  <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span className="font-semibold">{userName}</span>
                {userEmail && <span className="text-xs text-muted-foreground">{userEmail}</span>}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {appUser?.type === 'teacher' && (
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {appUser?.type === 'teacher' && appUser.profile && (
        <ProfileDialog 
            isOpen={isProfileOpen} 
            setIsOpen={setProfileOpen} 
            teacherProfile={appUser.profile} 
        />
      )}
    </>
  );
}
