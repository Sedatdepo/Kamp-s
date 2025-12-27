
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
import { Class, Student } from '@/lib/types';
import { collection, addDoc, query, where, deleteDoc, doc, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2, Edit, Save, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


interface TeacherSidebarProps {
  selectedClassId: string | null;
  onSelectClass: (id: string | null) => void;
}

export function TeacherSidebar({ selectedClassId, onSelectClass }: TeacherSidebarProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { setOpenMobile } = useSidebar();
  const [newClassName, setNewClassName] = useState('');
  
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);


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
        code: generateClassCode(),
        announcements: []
      });
      toast({ title: 'Sınıf oluşturuldu!' });
      setNewClassName('');
      onSelectClass(docRef.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Sınıf oluşturulamadı.' });
    }
  };

  const handleStartEdit = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
  };
  
  const handleCancelEdit = () => {
    setEditingClassId(null);
    setEditingClassName('');
  };

  const handleSaveEdit = async () => {
    if (!editingClassId || !editingClassName.trim()) return;
    await updateDoc(doc(db, 'classes', editingClassId), { name: editingClassName });
    toast({ title: 'Sınıf adı güncellendi' });
    handleCancelEdit();
  };

  const handleDeleteClass = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    if(window.confirm("Bu sınıfı ve içindeki TÜM öğrencileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
        setIsDeleting(classId);
        try {
            // Find all students in the class
            const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
            const studentSnapshot = await getDocs(studentsQuery);
            
            const batch = writeBatch(db);

            // Delete all students found
            studentSnapshot.forEach(studentDoc => {
                batch.delete(doc(db, 'students', studentDoc.id));
            });

            // Delete the class itself
            batch.delete(doc(db, 'classes', classId));
            
            await batch.commit();

            toast({ title: 'Sınıf ve öğrenciler silindi', variant: 'destructive'});
            if(selectedClassId === classId) {
                onSelectClass(null);
            }
        } catch(error: any) {
             toast({ variant: 'destructive', title: 'Hata', description: error.message || 'Sınıf silinemedi.' });
        } finally {
            setIsDeleting(null);
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
              {editingClassId === cls.id ? (
                <div className="flex w-full items-center gap-1 p-1">
                    <Input 
                        value={editingClassName} 
                        onChange={(e) => setEditingClassName(e.target.value)} 
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={handleSaveEdit}><Save className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <>
                <SidebarMenuButton
                    onClick={() => handleSelect(cls.id)}
                    isActive={selectedClassId === cls.id}
                >
                    <span>{cls.name}</span>
                </SidebarMenuButton>
                <div className="absolute right-1 top-1 flex">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={(e) => handleStartEdit(e, cls)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteClass(e, cls.id)} disabled={isDeleting === cls.id}>
                       {isDeleting === cls.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                </div>
                </>
              )}
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
