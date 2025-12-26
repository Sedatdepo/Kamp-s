"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { Class } from '@/lib/types';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/Logo';
import { Plus, MoreVertical, Edit, Trash2, Loader2, School } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

interface TeacherSidebarProps {
  selectedClassId?: string | null;
  onSelectClass?: (id: string | null) => void;
  isMobile?: boolean;
  onSelect?: () => void;
}

export function TeacherSidebar({ selectedClassId, onSelectClass, isMobile = false, onSelect }: TeacherSidebarProps) {
  const { appUser } = useAuth();
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<Class | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const classesQuery = useMemo(() => 
    appUser?.type === 'teacher' ? query(collection(db, 'classes'), where('teacherId', '==', appUser.data.uid)) : null, 
    [appUser]
  );
  const { data: classes, loading: classesLoading } = useFirestore<Class>('classes', classesQuery);

  const handleAddClass = async () => {
    if (!newClassName.trim() || appUser?.type !== 'teacher') return;
    setIsLoading(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: appUser.data.uid,
        isProjectSelectionActive: false,
        isRiskFormActive: false,
        isInfoFormActive: false,
      });
      toast({ title: 'Sınıf başarıyla eklendi' });
      setNewClassName('');
      setAddDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sınıf eklenirken hata oluştu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = async () => {
    if (!newClassName.trim() || !selectedClassForEdit) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'classes', selectedClassForEdit.id), { name: newClassName });
      toast({ title: 'Sınıf başarıyla güncellendi' });
      setEditDialogOpen(false);
      setSelectedClassForEdit(null);
      setNewClassName('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sınıf güncellenirken hata oluştu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClassForEdit) return;
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'classes', selectedClassForEdit.id));
      toast({ title: 'Sınıf başarıyla silindi' });
      if(selectedClassId === selectedClassForEdit.id && onSelectClass) {
        onSelectClass(null);
      }
      setDeleteDialogOpen(false);
      setSelectedClassForEdit(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sınıf silinirken hata oluştu' });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (cls: Class) => {
    setSelectedClassForEdit(cls);
    setNewClassName(cls.name);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (cls: Class) => {
    setSelectedClassForEdit(cls);
    setDeleteDialogOpen(true);
  };
  
  const sidebarContent = (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <span className="font-headline text-xl font-semibold">İTO KAMPÜS</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='flex justify-between items-center'>
            Sınıflar
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {classesLoading ? (
                <div className="p-2 space-y-2">
                  <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
                  <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
                  <div className="h-8 w-full rounded-md bg-muted animate-pulse" />
                </div>
              ) : (
                classes.map((cls) => (
                  <SidebarMenuItem key={cls.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onSelectClass?.(cls.id);
                        onSelect?.();
                      }}
                      isActive={selectedClassId === cls.id}
                      className="justify-between"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <School className="h-4 w-4" />
                            <span className="truncate">{cls.name}</span>
                        </div>
                    </SidebarMenuButton>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => openEditDialog(cls)}><Edit className="mr-2 h-4 w-4" /> Düzenle</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openDeleteDialog(cls)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Sil</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* Can add profile button here later */}
      </SidebarFooter>
    </>
  );

  return (
    <>
      {isMobile ? (
        sidebarContent
      ) : (
        <Sidebar className="border-r" collapsible="icon">
          {sidebarContent}
        </Sidebar>
      )}

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Yeni Sınıf Ekle</DialogTitle>
            <DialogDescription>Yeni sınıfın adını girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="new-class-name" className="text-sm font-medium">Sınıf Adı</label>
            <Input id="new-class-name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="örn. 10-A" />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
            <Button onClick={handleAddClass} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sınıf Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Sınıf Adını Düzenle</DialogTitle>
            <DialogDescription>"{selectedClassForEdit?.name}" sınıfı için yeni adı girin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="edit-class-name" className="text-sm font-medium">Yeni Sınıf Adı</label>
            <Input id="edit-class-name" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">İptal</Button></DialogClose>
            <Button onClick={handleEditClass} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Class Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
                Bu işlem "{selectedClassForEdit?.name}" sınıfını ve ilişkili tüm verileri kalıcı olarak silecektir. Bu eylem geri alınamaz.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClass} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sil
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
