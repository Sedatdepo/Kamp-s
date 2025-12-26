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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { PanelLeft, LogOut, User, Settings } from 'lucide-react';
import { TeacherSidebar } from './teacher/TeacherSidebar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { TeacherProfile } from '@/lib/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    branch: z.string().min(2, 'Branch is required.'),
    schoolName: z.string().min(3, 'School name is required.'),
    principalName: z.string().min(3, 'Principal name is required.'),
  });

function ProfileModal({ open, onOpenChange, profile, userId }: { open: boolean, onOpenChange: (open: boolean) => void, profile: TeacherProfile, userId: string }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const form = useForm<z.infer<typeof profileSchema>>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        name: profile.name || '',
        branch: profile.branch || '',
        schoolName: profile.schoolName || '',
        principalName: profile.principalName || '',
      },
    });
  
    async function onSubmit(values: z.infer<typeof profileSchema>) {
      setIsLoading(true);
      try {
        await updateDoc(doc(db, 'teachers', userId), values);
        toast({ title: 'Success', description: 'Profile updated successfully.' });
        onOpenChange(false);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
      } finally {
        setIsLoading(false);
      }
    }
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="branch" render={({ field }) => ( <FormItem><FormLabel>Branch</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="schoolName" render={({ field }) => ( <FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={form.control} name="principalName" render={({ field }) => ( <FormItem><FormLabel>Principal Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

export function Header() {
  const { appUser, signOut } = useAuth();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const avatarUrl = PlaceHolderImages.find(p => p.id === (appUser?.type === 'teacher' ? 'teacher-avatar-1' : 'student-avatar-1'))?.imageUrl;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const userName = appUser?.type === 'teacher' ? appUser.profile?.name : appUser?.data.name;
  const userSubtext = appUser?.type === 'teacher' ? appUser.profile?.branch : appUser?.data.classId;

  return (
    <>
    {appUser?.type === 'teacher' && appUser.profile && (
        <ProfileModal open={isProfileModalOpen} onOpenChange={setProfileModalOpen} profile={appUser.profile} userId={appUser.data.uid} />
    )}
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isMobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0">
          {appUser?.type === 'teacher' ? <TeacherSidebar isMobile={true} onSelect={() => setMobileSidebarOpen(false)} /> : <div />}
        </SheetContent>
      </Sheet>
      
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <Avatar>
                <AvatarImage src={avatarUrl} alt={userName || 'User Avatar'} />
                <AvatarFallback>{userName ? getInitials(userName) : 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
                <p className='font-semibold'>{userName}</p>
                <p className='text-xs text-muted-foreground font-normal'>{userSubtext}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {appUser?.type === 'teacher' && (
                <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
