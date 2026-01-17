'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Users, 
  FileText, 
  Save, 
  Trash2, 
  Edit, 
  Download, 
  Plus, 
  CheckSquare, 
  Square,
  School,
  X,
  Calendar,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';


// --- SABİT VERİLER (CONSTANTS) ---
const PHYSICS_OUTCOMES = [
  { id: "FİZ.9.1.1", grade: 9, unit: "FİZİK BİLİMİ VE KARİYER KEŞFİ", text: "Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme" },
  { id: "FİZ.9.1.2", grade: 9, unit: "FİZİK BİLİMİ VE KARİYER KEŞFİ", text: "Fizik biliminin alt dallarını sınıflandırabilme" },
  { id: "FİZ.9.2.1", grade: 9, unit: "KUVVET VE HAREKET", text: "SI birim sisteminde birimleri verilen temel ve türetilmiş nicelikleri sınıflandırabilme" },
  { id: "FİZ.9.2.2", grade: 9, unit: "KUVVET VE HAREKET", text: "Skaler ve vektörel nicelikleri karşılaştırabilme" },
  { id: "FİZ.10.1.1", grade: 10, unit: "HAREKET", text: "Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme" },
  { id: "FİZ.10.2.1", grade: 10, unit: "ENERJİ", text: "Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme" },
  { id: "FİZ.11.1.1", grade: 11, unit: "KUVVET VE HAREKET", text: "Newton Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme" },
  { id: "FİZ.12.1.1", grade: 12, unit: "KUVVET VE HAREKET", text: "Torkun matematiksel modeline yönelik tümevarımsal akıl yürütebilme" }
];

const PERFORMANCE_ITEMS = [
  { id: 1, skill: "Temel Kavram Bilgisi: Fiziksel kavramları tanımlama ve temel düzeyde açıklama." },
  { id: 2, skill: "Soru Sorma ve Merak: Dersle ilgili konularda sorular sorma eğilimi." },
  { id: 3, skill: "Derse Katılım: Sınıf içi etkinliklere katılma isteği." },
  { id: 4, skill: "Materyal Kullanımı: Ders araç gereçlerini amacına uygun kullanma." }
];

const KABA_ITEMS = [
  { grade: 9, unit: "1. Fizik Bilimi", skill: "Fiziğin ne olduğunu kendi cümleleriyle açıklar." },
  { grade: 9, unit: "1. Fizik Bilimi", skill: "Fiziğin alt dallarından 3 tanesini sayar." },
  { grade: 10, unit: "1. Hareket", skill: "Hareket çeşitlerini ayırt eder." },
  { grade: 10, unit: "2. Enerji", skill: "Enerji türlerini sayar." }
];

const SPECIAL_NEED_TYPES = [
  "otizm", "işitme-engelli", "görme-engelli",
  "zihinsel-yetersizlik", "dikkat-eksikliği", "öğrenme-güçlüğü"
];

// --- YARDIMCI FONKSİYONLAR ---
const downloadAsRTF = (content: any, filename: any) => {
  const header = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head><body>`;
  const footer = "</body></html>";
  const sourceHTML = header + content + footer;
  
  const blob = new Blob(['\ufeff', sourceHTML], {
      type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function BepTab() {
  const { toast } = useToast();
  // --- STATE YÖNETİMİ ---
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<any[]>([]);
  const [teacherInfo, setTeacherInfo] = useState({
    branchTeacher: '',
    guidanceTeacher: '',
    schoolPrincipal: '',
    schoolName: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [bepDates, setBepDates] = useState({ start: '', end: '' });
  const [selectedKazanims, setSelectedKazanims] = useState(new Set());
  const [selectedPerformance, setSelectedPerformance] = useState<any>({});
  const [selectedKaba, setSelectedKaba] = useState<any>({});

  // --- INITIALIZATION ---
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    const savedTeacher = localStorage.getItem('teacherInfo');
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      setStudents([{
        id: "1",
        name: "Ali Veli",
        class: "10-A",
        number: "123",
        branch: "Bilişim",
        specialNeeds: ["öğrenme-güçlüğü"],
        notes: "Örnek öğrenci",
        isSpecialNeeds: true
      }]);
    }

    if (savedTeacher) {
      setTeacherInfo(JSON.parse(savedTeacher));
    }

    const today = new Date();
    const future = new Date();
    future.setMonth(today.getMonth() + 6);
    setBepDates({
      start: today.toISOString().split('T')[0],
      end: future.toISOString().split('T')[0]
    });
  }, []);

  // --- ACTIONS ---
  const handleSaveTeacher = () => {
    localStorage.setItem('teacherInfo', JSON.stringify(teacherInfo));
    toast({ title: 'Başarılı', description: 'Öğretmen bilgileri kaydedildi.' });
  };

  const handleSaveStudent = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const newStudent = {
      id: editingStudent ? editingStudent.id : Date.now().toString(),
      name: formData.get('name'),
      class: formData.get('class'),
      number: formData.get('number'),
      branch: formData.get('branch'),
      notes: formData.get('notes'),
      specialNeeds: editingStudent?.specialNeeds || [],
      isSpecialNeeds: true
    };

    let updatedStudents;
    if (editingStudent && students.some(s => s.id === editingStudent.id)) {
      updatedStudents = students.map(s => s.id === newStudent.id ? newStudent : s);
      toast({ title: 'Başarılı', description: 'Öğrenci güncellendi.' });
    } else {
      updatedStudents = [...students, newStudent];
      toast({ title: 'Başarılı', description: 'Öğrenci eklendi.' });
    }

    setStudents(updatedStudents);
    localStorage.setItem('students', JSON.stringify(updatedStudents));
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: any) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem('students', JSON.stringify(updated));
      toast({ title: 'Silindi', description: 'Öğrenci silindi.', variant: 'destructive' });
    }
  };

  const toggleSpecialNeed = (need: any) => {
    setEditingStudent((prev: any) => {
      const currentNeeds = prev?.specialNeeds || [];
      const newNeeds = currentNeeds.includes(need)
        ? currentNeeds.filter((n: any) => n !== need)
        : [...currentNeeds, need];
      return { ...prev, specialNeeds: newNeeds };
    });
  };

  // --- BEP LOGIC ---
  const getFilteredKazanims = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return [];
    
    const gradeMatch = student.class.match(/(\d+)/);
    const grade = gradeMatch ? parseInt(gradeMatch[0]) : 9;
    return PHYSICS_OUTCOMES.filter(k => k.grade === grade);
  };
  
  const getFilteredKabaItems = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return [];
    
    const gradeMatch = student.class.match(/(\d+)/);
    const grade = gradeMatch ? parseInt(gradeMatch[0]) : 9;
    return KABA_ITEMS.filter(k => k.grade === grade);
  };

  const toggleKazanim = (id: any) => {
    const next = new Set(selectedKazanims);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedKazanims(next);
  };

  const handleKabaEvaluation = (key: any, value: any, skillText: any) => {
    let text = "";
    if (value === 'yapar') text = `"${skillText}" kazanımını bağımsız olarak gerçekleştirmektedir.`;
    else if (value === 'yapamaz') text = `"${skillText}" kazanımını henüz kazanamamıştır.`;
    else if (value === 'kısmen') text = `"${skillText}" kazanımını yardım ile gerçekleştirmektedir.`;

    setSelectedKaba((prev: any) => ({
      ...prev,
      [key]: { evaluation: value, text: text }
    }));
  };

  const handleKabaTextChange = (key: any, text: any) => {
    setSelectedKaba((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], text: text }
    }));
  };

  // --- EXPORT LOGIC ---
  const generateRTF = (type: any) => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return toast({ title: 'Hata', description: 'Öğrenci seçilmedi.', variant: 'destructive'});

    let content = '';
    // ... (rest of the generateRTF logic)
    downloadAsRTF(content, `${type}_raporu_${student.name}`);
    toast({ title: 'Başarılı', description: 'Rapor indirildi.' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 pb-10">
        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full">
            <TabsList>
                <TabsTrigger value="students">Öğrenci Yönetimi</TabsTrigger>
                <TabsTrigger value="bep">BEP Hazırla</TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>BEP Öğrenci Yönetimi</CardTitle>
                        <CardDescription>Bireyselleştirilmiş Eğitim Programı hazırlanacak öğrencileri yönetin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between mb-4">
                            <Input 
                                placeholder="Öğrenci ara..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                            <Button onClick={() => { setIsModalOpen(true); setEditingStudent(null); }}>
                                <Plus className="mr-2 h-4 w-4" /> Yeni Öğrenci Ekle
                            </Button>
                        </div>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Adı Soyadı</TableHead>
                                        <TableHead>Sınıf</TableHead>
                                        <TableHead>Numara</TableHead>
                                        <TableHead>Tanı</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                        <TableRow key={student.id}>
                                            <TableCell className="font-medium">{student.name}</TableCell>
                                            <TableCell>{student.class}</TableCell>
                                            <TableCell>{student.number}</TableCell>
                                            <TableCell>{student.specialNeeds?.join(', ')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingStudent(student); setIsModalOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="bep" className="mt-4">
                <Card>
                  <CardHeader>
                      <CardTitle>BEP Hazırlama Sihirbazı</CardTitle>
                      <CardDescription>Öğrenci seçerek BEP planı oluşturun ve raporları indirin.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                          <SelectTrigger>
                              <SelectValue placeholder="BEP hazırlanacak öğrenciyi seçin..." />
                          </SelectTrigger>
                          <SelectContent>
                              {students.filter(s => s.isSpecialNeeds).map(student => (
                                  <SelectItem key={student.id} value={student.id}>{student.name} ({student.class})</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      {selectedStudentId && (
                        <div className="space-y-6 pt-4 border-t">
                          <div className="flex gap-4">
                              <Button onClick={() => generateRTF('kaba')}>Kaba Değerlendirme Formu İndir</Button>
                              <Button onClick={() => generateRTF('performans')}>Eğitsel Performans Formu İndir</Button>
                              <Button onClick={() => generateRTF('bep')}>BEP Planı İndir</Button>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingStudent ? 'Öğrenciyi Düzenle' : 'Yeni Öğrenci Ekle'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveStudent} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Adı Soyadı</Label>
                            <Input id="name" name="name" defaultValue={editingStudent?.name || ''} />
                        </div>
                         <div>
                            <Label htmlFor="class">Sınıf</Label>
                            <Input id="class" name="class" defaultValue={editingStudent?.class || ''} />
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="number">Numara</Label>
                            <Input id="number" name="number" defaultValue={editingStudent?.number || ''} />
                        </div>
                         <div>
                            <Label htmlFor="branch">Dal/Alan</Label>
                            <Input id="branch" name="branch" defaultValue={editingStudent?.branch || ''} />
                        </div>
                    </div>
                    <div>
                        <Label>Tanı/Özel Durum</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {SPECIAL_NEED_TYPES.map(need => (
                                <div key={need} className="flex items-center gap-2">
                                    <input type="checkbox" id={need} checked={editingStudent?.specialNeeds?.includes(need)} onChange={() => toggleSpecialNeed(need)} />
                                    <Label htmlFor={need} className="text-sm">{need}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="notes">Notlar</Label>
                        <Textarea id="notes" name="notes" defaultValue={editingStudent?.notes || ''} />
                    </div>
                    <DialogFooter>
                      <Button type="submit">Kaydet</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
