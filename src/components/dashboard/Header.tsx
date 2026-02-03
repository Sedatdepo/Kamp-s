
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
import { useState, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { ProfileDialog } from './teacher/ProfileDialog';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/icons/Logo';
import { Skeleton } from '@/components/ui/skeleton';


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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const userName = appUser?.type === 'teacher' ? appUser.profile?.name : '';
  const userEmail = appUser?.type === 'teacher' ? appUser.data.email : undefined;
  const userRole = 'Öğretmen';


  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">KAMPÜS</span>
        </div>
        <div className="ml-auto">
          {isClient && appUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${userName}`} />
                      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-semibold">{userName}</span>
                    {userEmail && <span className="text-xs text-muted-foreground">{userEmail} ({userRole})</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
             <Skeleton className="h-10 w-10 rounded-full" />
          )}
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
