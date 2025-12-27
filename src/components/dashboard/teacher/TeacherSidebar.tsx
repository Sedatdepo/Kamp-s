"use client";

import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { Class } from '@/lib/types';
import { collection, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeacherSidebarProps {
  selectedClassId: string | null;
  onSelectClass: (id: string | null) => void;
}

export function TeacherSidebar({ selectedClassId, onSelectClass }: TeacherSidebarProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();
  const [newClassName, setNewClassName] = useState('');

  const teacherId = appUser?.type === 'teacher' ? appUser.data.uid : '';

  const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
  const { data: classes, loading } = useFirestore<Class>('classes', teacherId ? classesQuery : null);

  const handleAddClass = async () => {
    if (!newClassName.trim() || !teacherId) return;
    try {
      const docRef = await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: teacherId,
        isProjectSelectionActive: false,
        isRiskFormActive: false,
        isInfoFormActive: false,
      });
      toast({ title: 'Sınıf oluşturuldu!' });
      setNewClassName('');
      onSelectClass(docRef.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf oluşturulamadı.' });
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    if(window.confirm("Bu sınıfı silmek istediğinize emin misiniz?")) {
        try {
            await deleteDoc(doc(db, 'classes', classId));
            toast({ title: 'Sınıf silindi', variant: 'destructive'});
            if(selectedClassId === classId) {
                onSelectClass(null);
            }
        } catch {
             toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf silinemedi.' });
        }
    }
  }

  const handleSelect = (classId: string) => {
    onSelectClass(classId);
    setOpenMobile(false);
  }

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
          {loading && <p>Yükleniyor...</p>}
          {classes.map((cls) => (
            <SidebarMenuItem key={cls.id}>
              <SidebarMenuButton
                onClick={() => handleSelect(cls.id)}
                isActive={selectedClassId === cls.id}
              >
                <span>{cls.name}</span>
              </SidebarMenuButton>
                <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-2 top-0.5 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteClass(e, cls.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Sınıf Ekle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Sınıf Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input 
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Sınıf Adı (örn. 9/A)"
                    />
                    <DialogClose asChild>
                        <Button onClick={handleAddClass} className="w-full">Oluştur</Button>
                    </DialogClose>
                </div>
            </DialogContent>
         </Dialog>
      </SidebarFooter>
    </Sidebar>
  );
}
