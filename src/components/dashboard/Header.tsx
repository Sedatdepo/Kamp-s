
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
import { LogOut, User, Star, Sun, Moon } from 'lucide-react';
import { useTheme, branchThemes } from '@/components/providers/ThemeProvider';
import { ProfileDialog } from './teacher/ProfileDialog';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/icons/Logo';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

function getInitials(name: string = '') {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
}

export function Header({ notificationCount, studentMode = false, studentData = null }: { notificationCount?: number, studentMode?: boolean, studentData?: any }) {
  const { appUser, signOut } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { theme, toggleTheme, setBranchColor } = useTheme();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update branch color based on teacher profile
  useEffect(() => {
    if (!studentMode && appUser?.type === 'teacher' && appUser.profile?.branch) {
      const color = branchThemes[appUser.profile.branch] || branchThemes.default;
      setBranchColor(color);
    } else if (studentMode) {
        setBranchColor(branchThemes.default); // Or specific student portal color
    }
  }, [appUser, studentMode, setBranchColor]);
  
  const handleStudentLogout = () => {
    // localStorage'dan siliyoruz
    localStorage.removeItem('student_portal_auth');
    const pathParts = window.location.pathname.split('/');
    const classCode = pathParts[2];
    router.replace(`/giris/${classCode}`);
  };

  const userName = studentMode ? studentData?.name : (appUser?.type === 'teacher' ? appUser.profile?.name : '');
  const userEmail = !studentMode && appUser?.type === 'teacher' ? appUser.data.email : undefined;
  const userRole = studentMode ? 'Öğrenci' : 'Öğretmen';

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-background px-4 sm:px-6 shadow-sm w-full">
        <div className="flex items-center">
            <div className="scale-[0.4] sm:scale-[0.5] origin-left">
              <Logo hideSlogan={true} />
            </div>
            {/* "Luminodo" yazısı kaldırıldı, logo kendi başına yeterli */}
        </div>

        {studentMode && studentData && (
          <div className="ml-2 hidden md:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-sm font-medium text-orange-400">
              <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{studentData.behaviorScore || 100} Puan</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="rounded-full"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <div className="h-8 w-px bg-border mx-1" />

          <div className="flex items-center gap-4">
          {isClient && (studentMode || appUser) ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10 focus-visible:ring-0">
                     {notificationCount && notificationCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                      </span>
                    )}
                    <Avatar className="border border-white/20 h-9 w-9">
                      <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${userName}`} />
                      <AvatarFallback className="bg-slate-800 text-white text-xs">{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-semibold">{userName}</span>
                    <span className="text-xs text-muted-foreground">{userRole} {studentData ? ` - No: ${studentData.number}` : ''}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {!studentMode && (
                    <>
                      <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem 
                    onClick={studentMode ? handleStudentLogout : signOut} 
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          ) : (
             <Skeleton className="h-9 w-9 rounded-full bg-slate-800" />
          )}
        </div>
      </header>
      {!studentMode && appUser?.type === 'teacher' && appUser.profile && (
        <ProfileDialog 
            isOpen={isProfileOpen} 
            setIsOpen={setProfileOpen} 
            teacherProfile={appUser.profile} 
        />
      )}
    </>
  );
}
