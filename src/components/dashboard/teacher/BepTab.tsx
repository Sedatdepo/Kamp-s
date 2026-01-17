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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                {/* Öğrenci Yönetimi içeriği */}
            </TabsContent>
            <TabsContent value="bep" className="mt-4">
                {/* BEP Hazırlama içeriği */}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
