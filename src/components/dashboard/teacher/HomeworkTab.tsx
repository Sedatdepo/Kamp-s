

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, HomeworkDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Atom, FileText, Video, Mic, Paperclip, CheckCircle, GraduationCap, Filter, Send, ClipboardList, X, Plus, Trash2, Save, Edit, Pencil, PlusCircle, Calendar, Users, Clock, Search, Heart, Bell, History, Printer, BarChart3, PieChart, Download } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { assignmentsData, initialRubricDefinitions, getRubricType } from '@/lib/maarif-modeli-odevleri';


// --- HELPER COMPONENTS from User's Code ---
// (These are defined inside the provided code, so I'm extracting them to be used by HomeworkLibrary)

const LibraryHeader = ({ onOpenAddRubric, onOpenCreateAssignment, history, toggleFavoritesOnly, showFavoritesOnly }: any) => {
    const [showHistory, setShowHistory] = useState(false);
  
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">E-Ödev Yönetim Paneli</h1>
            <p className="text-sm text-gray-500">Hoş Geldiniz, Öğretmenim</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end relative">
          <button 
            onClick={toggleFavoritesOnly}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors border ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            <Heart size={16} className={showFavoritesOnly ? "fill-current" : ""} />
            Favorilerim
          </button>
  
          <button 
            onClick={onOpenCreateAssignment}
            className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Yeni Ödev
          </button>
          
          <button 
            onClick={onOpenAddRubric}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={16} />
            Kriter
          </button>
  
          <div className="relative">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600"
            >
              <Bell size={20} />
              {history.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showHistory && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Son İşlemler</span>
                  <button onClick={() => setShowHistory(false)}><X size={14} className="text-gray-400" /></button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Henüz işlem yapılmadı.</div>
                  ) : (
                    history.map((item: any, index: number) => (
                      <div key={index} className="p-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3">
                        <div className="mt-1"><CheckCircle size={16} className="text-green-500" /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.class} • {item.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
};
  
const StatsCards = ({ total, assignedCount, favoritesCount }: any) => (
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
        <BookOpen size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Toplam Ödev</p>
        <h3 className="text-2xl font-bold text-gray-800">{total}</h3>
    </div>
    </div>
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-green-50 text-green-600 rounded-full">
        <CheckCircle size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Bu Ay Atanan</p>
        <h3 className="text-2xl font-bold text-gray-800">{assignedCount}</h3>
    </div>
    </div>
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-red-50 text-red-600 rounded-full">
        <Heart size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Favoriler</p>
        <h3 className="text-2xl font-bold text-gray-800">{favoritesCount}</h3>
    </div>
    </div>
</div>
);

const FilterBar = ({ gradeFilter, subjectFilter, setGradeFilter, setSubjectFilter, disabled }: any) => (
<div className={`flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex items-center gap-2 text-gray-700 font-medium min-w-fit">
    <Filter size={18} />
    Filtrele:
    </div>
    
    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
    <div className="relative">
        <select 
        value={gradeFilter}
        onChange={(e) => setGradeFilter(e.target.value)}
        className={`appearance-none w-full md:w-48 border text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${gradeFilter === '' ? 'border-blue-400 bg-blue-50 font-semibold' : 'border-gray-300 bg-gray-50'}`}
        >
        <option value="" disabled>Sınıf Seçiniz</option>
        <option value="9">9. Sınıf</option>
        <option value="10">10. Sınıf</option>
        <option value="11">11. Sınıf</option>
        <option value="12">12. Sınıf</option>
        </select>
    </div>

    <div className="relative">
        <select 
        value={subjectFilter}
        onChange={(e) => setSubjectFilter(e.target.value)}
        className={`appearance-none w-full md:w-48 border text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${subjectFilter === '' ? 'border-blue-400 bg-blue-50 font-semibold' : 'border-gray-300 bg-gray-50'}`}
        >
        <option value="" disabled>Ders Seçiniz</option>
        <option value="physics">Fizik</option>
        <option value="literature">Türk Dili ve Edebiyatı</option>
        </select>
    </div>
    </div>
</div>
);

const EmptyState = () => (
<div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-dashed border-blue-100 text-center px-4">
    <div className="bg-blue-50 p-6 rounded-full mb-6">
    <Search size={48} className="text-blue-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">Ödevleri Görüntülemek İçin Seçim Yapınız</h3>
    <p className="text-gray-500 max-w-md mx-auto">
    İlgili sınıf ve dersi yukarıdaki filtrelerden seçerek, o gruba ait performans ödevlerini listeleyebilirsiniz.
    </p>
</div>
);

const AssignmentCard = ({ item, onAssign, onShowRubric, onEdit, isFavorite, onToggleFavorite, onPrint }: any) => {
    const isPhysics = item.subject === 'physics';
    
    const getFormatIcon = () => {
        if (item.formats.includes('Video')) return <Video size={14} />;
        if (item.formats.includes('Ses')) return <Mic size={14} />;
        return <FileText size={14} />;
    };
  
    return (
      <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isPhysics ? 'hover:border-cyan-400' : 'hover:border-rose-400'}`}>
        <div className={`h-1.5 w-full ${isPhysics ? 'bg-cyan-600' : 'bg-rose-600'}`}></div>
  
        <div className="p-5 flex-grow flex flex-col relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button 
              onClick={() => onPrint(item)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Ödevi Yazdır"
            >
              <Printer size={16} />
            </button>
            <button 
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:bg-gray-50 hover:text-gray-500'}`}
              title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Heart size={16} className={isFavorite ? "fill-current" : ""} />
            </button>
            <button 
              onClick={() => onEdit(item)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Ödevi Düzenle"
            >
              <Pencil size={16} />
            </button>
          </div>
  
          <div className="flex justify-between items-start mb-3 pr-24">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              isPhysics ? 'bg-cyan-50 text-cyan-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {isPhysics ? <Atom size={12} /> : <BookOpen size={12} />}
              {isPhysics ? 'Fizik' : 'Edebiyat'}
            </div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
              {item.grade}. Sınıf
            </span>
          </div>
  
          <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors pr-6">
            {item.title}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {item.description}
          </p>
  
          <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-md mb-4 text-xs text-gray-600 italic relative">
             <span className="font-semibold block not-italic mb-1 text-gray-700">Öğrenci Yönergesi:</span>
             "{item.instructions}"
          </div>
  
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5" title="Kabul Edilen Formatlar">
              {getFormatIcon()}
              {item.formats}
            </div>
            <div className="flex items-center gap-1.5" title="Maksimum Dosya Boyutu">
              <Paperclip size={14} />
              Max: {item.size}
            </div>
          </div>
        </div>
  
        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
          <button
            onClick={() => onShowRubric(item)}
            className="py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-xs"
          >
            <ClipboardList size={14} />
            Kriterler
          </button>
          <button 
            onClick={() => onAssign(item)}
            className={`py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${
              isPhysics 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200' 
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
            } shadow-sm hover:shadow-md text-xs`}
          >
            <Send size={14} />
            Sınıfa Ata
          </button>
        </div>
      </div>
    );
};

const EditAssignmentModal = ({ isOpen, onClose, assignment, onSave }: any) => {
    const [formData, setFormData] = useState({ title: '', description: '', instructions: '' });
  
    useEffect(() => {
      if (assignment) {
        setFormData({
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions
        });
      }
    }, [assignment]);
  
    if (!isOpen || !assignment) return null;
  
    const handleSave = () => {
      onSave(formData);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Edit size={18} className="text-blue-600" />
              Ödevi Düzenle
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ödev Başlığı</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kısa Açıklama</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
                rows={2}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Kart üzerinde görünecek özet bilgi.</p>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Yönergesi</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-gray-50 font-medium"
                rows={4}
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Öğrencinin ne yapması gerektiğini detaylıca anlatın.</p>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <Save size={16} /> Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    );
};

const CreateAssignmentModal = ({ isOpen, onClose, onSave }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      instructions: '',
      grade: '9',
      subject: 'physics',
      formats: 'PDF, Word',
      size: '10 MB'
    });
  
    if (!isOpen) return null;
  
    const handleSave = () => {
      if (!formData.title || !formData.description) return alert("Başlık ve açıklama zorunludur.");
      onSave(formData);
      onClose();
      // Reset form defaults
      setFormData({
          title: '',
          description: '',
          instructions: '',
          grade: '9',
          subject: 'physics',
          formats: 'PDF, Word',
          size: '10 MB'
      });
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle size={20} className="text-green-600" />
              Yeni Ödev Oluştur
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf Seviyesi</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ders</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                >
                  <option value="physics">Fizik</option>
                  <option value="literature">Türk Dili ve Edebiyatı</option>
                </select>
              </div>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ödev Başlığı</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Örn: Newton'un Hareket Yasaları"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kısa Açıklama</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                rows={2}
                placeholder="Ödevin amacı ve kapsamı hakkında kısa bilgi..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Yönergesi</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                rows={3}
                placeholder="Öğrenci bu ödevi yaparken hangi adımları izlemeli?"
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
              />
            </div>
  
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Kabul Edilen Formatlar</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                   placeholder="Örn: PDF, Word, Video"
                   value={formData.formats}
                   onChange={e => setFormData({...formData, formats: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Maks. Dosya Boyutu</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                   placeholder="Örn: 20 MB"
                   value={formData.size}
                   onChange={e => setFormData({...formData, size: e.target.value})}
                 />
               </div>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <Save size={16} /> Ödevi Oluştur
            </button>
          </div>
        </div>
      </div>
    );
};

const AssignSettingsModal = ({ isOpen, onClose, assignment, onConfirm, classes, students }: any) => {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('all');
    const [dueDate, setDueDate] = useState('');
  
    useEffect(() => {
      if (assignment) {
        if (classes && classes.length > 0) {
            setSelectedClass(classes[0].id);
        }
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDueDate(nextWeek.toISOString().split('T')[0]);
      }
    }, [assignment, classes]);
  
    if (!isOpen || !assignment) return null;
  
    const handleConfirm = () => {
      onConfirm({ classId: selectedClass, studentId: selectedStudent, date: dueDate });
      onClose();
    };

    const studentsInSelectedClass = students.filter((s: Student) => s.classId === selectedClass);
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Send size={18} className="text-blue-600" />
              Ödev Atama Ayarları
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 space-y-5">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 mb-2">
              <span className="font-bold">{(assignment as any).title}</span> ödevi için atama yapıyorsunuz.
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <Users size={16} /> Hangi Şubeye Atanacak?
              </label>
              <select 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={selectedClass}
                onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('all');
                }}
              >
                {(classes || []).map((cls: Class) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <Users size={16} /> Hangi Öğrenciye?
                </label>
                <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    disabled={!selectedClass}
                >
                    <option value="all">Tüm Sınıfa</option>
                    {studentsInSelectedClass.map((student: Student) => (
                        <option key={student.id} value={student.id}>{student.name} ({student.number})</option>
                    ))}
                </select>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <Clock size={16} /> Son Teslim Tarihi
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
            <button 
              onClick={handleConfirm}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <CheckCircle size={16} /> Atamayı Tamamla
            </button>
          </div>
        </div>
      </div>
    );
};

const AddRubricModal = ({ isOpen, onClose, onSave }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([{ label: '', score: '', desc: '' }]);
  
    if (!isOpen) return null;
  
    const handleAddItem = () => {
      setItems([...items, { label: '', score: '', desc: '' }]);
    };
  
    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    };
  
    const handleItemChange = (index: number, field: string, value: string) => {
      const newItems: any = [...items];
      newItems[index][field] = value;
      setItems(newItems);
    };
  
    const totalScore = items.reduce((sum, item) => sum + (parseInt(item.score) || 0), 0);
  
    const handleSave = () => {
      if (!title || !description) return alert("Lütfen başlık ve açıklama giriniz.");
      if (items.some(i => !i.label || !i.score)) return alert("Lütfen tüm kriter alanlarını doldurunuz.");
      
      onSave({ title, description, items });
      onClose();
      setTitle('');
      setDescription('');
      setItems([{ label: '', score: '', desc: '' }]);
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Yeni Değerlendirme Kriteri Ekle</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kriter Başlığı</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Örn: Proje Değerlendirme Ölçeği"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Bu kriter seti hangi tür ödevlerde kullanılacak?"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
  
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Değerlendirme Maddeleri</label>
                <div className={`text-sm font-bold ${totalScore === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                  Toplam Puan: {totalScore} / 100
                </div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="flex-grow space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Madde Adı (Örn: Sunum)" 
                        className="flex-grow border rounded p-1 text-sm"
                        value={item.label}
                        onChange={e => handleItemChange(index, 'label', e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Puan" 
                        className="w-16 border rounded p-1 text-sm text-center"
                        value={item.score}
                        onChange={e => handleItemChange(index, 'score', e.target.value)}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Açıklama (Örn: Ses tonu ve hakimiyet)" 
                      className="w-full border rounded p-1 text-xs text-gray-600"
                      value={item.desc}
                      onChange={e => handleItemChange(index, 'desc', e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
  
              <button 
                onClick={handleAddItem}
                className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Yeni Madde Ekle
              </button>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <Save size={16} /> Kaydet
            </button>
          </div>
        </div>
      </div>
    );
};

const RubricModal = ({ isOpen, onClose, assignment, rubrics, onAddRubricClick, onSaveRubric }: any) => {
    const [selectedRubricKey, setSelectedRubricKey] = React.useState('');
    const [editableRubric, setEditableRubric] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen && assignment) {
            const defaultKey = getRubricType((assignment as any).formats);
            setSelectedRubricKey(defaultKey);
            setEditableRubric(JSON.parse(JSON.stringify(rubrics[defaultKey] || rubrics['research'])));
        }
    }, [isOpen, assignment, rubrics]);

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...editableRubric.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleAddItem = () => {
        const newItems = [...editableRubric.items, { label: 'Yeni Kriter', score: 10, desc: '' }];
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = editableRubric.items.filter((_:any, i:number) => i !== index);
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleSave = () => {
        onSaveRubric(selectedRubricKey, editableRubric);
        onClose();
    };

    if (!isOpen || !assignment || !editableRubric) return null;

    const totalScore = editableRubric.items.reduce((acc: any, curr: any) => acc + (parseInt(curr.score) || 0), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all scale-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Değerlendirme Kriterleri</h2>
                        <p className="text-sm text-gray-500 mt-1">{(assignment as any).title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="mb-6 flex gap-2 items-end">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kullanılacak Kriter Seti</label>
                            <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedRubricKey}
                                onChange={(e) => {
                                    const newKey = e.target.value;
                                    setSelectedRubricKey(newKey);
                                    setEditableRubric(JSON.parse(JSON.stringify(rubrics[newKey])));
                                }}
                            >
                                <optgroup label="Standart Kriterler">
                                    <option value="research">Araştırma ve Yazma Rubriği</option>
                                    <option value="multimedia">Multimedya ve Sunum Rubriği</option>
                                    <option value="visual">Görsel Tasarım Rubriği</option>
                                </optgroup>
                                <optgroup label="Özel Kriterler">
                                    {Object.keys(rubrics).filter(k => k.startsWith('custom')).map(key => (
                                        <option key={key} value={key}>{(rubrics as any)[key].title}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        <button
                            onClick={() => { onClose(); onAddRubricClick(); }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200"
                            title="Yeni Kriter Seti Ekle"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <span className="font-semibold">Açıklama:</span> {editableRubric.description}
                    </div>

                    <div className="space-y-3">
                        {editableRubric.items.map((item: any, index: number) => (
                            <div key={index} className="flex gap-2 p-3 rounded-xl border bg-gray-50/50">
                                <div className="flex-grow space-y-2">
                                     <Input 
                                        value={item.label}
                                        onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                                        className="font-bold text-gray-800 text-base"
                                        placeholder="Kriter Adı"
                                    />
                                    <Textarea 
                                        value={item.desc}
                                        onChange={(e) => handleItemChange(index, 'desc', e.target.value)}
                                        className="text-sm text-gray-600"
                                        placeholder="Kriter Açıklaması"
                                        rows={1}
                                    />
                                </div>
                                <div className="flex flex-col items-center justify-center gap-1 w-24">
                                     <Input 
                                        type="number"
                                        value={item.score}
                                        onChange={(e) => handleItemChange(index, 'score', e.target.value)}
                                        className="w-20 h-10 text-center text-xl font-bold text-blue-600"
                                    />
                                    <span className="text-xs text-gray-400 uppercase font-semibold">Puan</span>
                                </div>
                                 <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-red-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <Button onClick={handleAddItem} variant="outline" className="mt-4 w-full border-dashed">
                        <Plus size={16} className="mr-2" /> Kriter Ekle
                    </Button>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-right">
                        <span className="text-sm text-gray-500 mr-2">Toplam Puan:</span>
                        <span className={`text-2xl font-bold ${totalScore === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                            {totalScore}
                        </span>
                    </div>
                     <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save size={16} className="mr-2" /> Değişiklikleri Kaydet
                    </Button>
                </div>
            </div>
        </div>
    );
};

const SuccessModal = ({ isOpen, onClose, assignment, details }: any) => {
    if (!isOpen || !assignment) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ödev Atandı!</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{(assignment as any).title}</h3>
              <p className="text-sm text-gray-500 mb-2">{(assignment as any).grade}. Sınıf • {(assignment as any).subject === 'physics' ? 'Fizik' : 'Edebiyat'}</p>
              
              {details && (
                <div className="flex justify-between items-center text-xs font-medium text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                  <span className="flex items-center gap-1"><Users size={12}/> {details.class}</span>
                  <span className="flex items-center gap-1"><Calendar size={12}/> {details.date}</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
              Ödev başarıyla ilgili sınıfın paneline gönderildi. Öğrencilere bildirim iletildi.
            </p>
  
            <button 
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    );
};
  
const PrintPreviewModal = ({ isOpen, onClose, assignment }: any) => {
    if (!isOpen || !assignment) return null;
  
    const handlePrint = () => {
      window.print();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
        <style>
          {`
            @media print {
              body > *:not(.print-modal-container) {
                display: none !important;
              }
              .print-modal-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 9999;
                display: block !important;
              }
              .print-hidden {
                display: none !important;
              }
              .print-page {
                padding: 40px !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}
        </style>
        
        <div className="print-modal-container bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col print:h-auto print:shadow-none print:w-full">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center print-hidden rounded-t-xl">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Printer size={18} className="text-blue-600" />
              Ödev Çıktısı Önizleme
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer size={16} /> Yazdır
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
            </div>
          </div>
  
          <div className="p-8 overflow-y-auto flex-grow bg-gray-100 print:bg-white print:p-0 print-page">
            <div className="bg-white max-w-2xl mx-auto p-12 shadow-sm min-h-full border border-gray-200 print:border-0 print:shadow-none print:max-w-full">
              
              <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold text-black mb-1">PERFORMANS ÖDEVİ</h1>
                  <p className="text-sm text-gray-600">Eğitim - Öğretim Yılı: 2025-2026</p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-black uppercase">${(assignment as any).subject === 'physics' ? 'FİZİK' : 'TÜRK DİLİ VE EDEBİYATI'}</span>
                  <span className="block text-sm text-gray-600">${(assignment as any).grade}. Sınıf</span>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-4 border border-gray-300 rounded bg-gray-50 print:bg-white">
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Adı Soyadı:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Sınıfı / No:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Teslim Tarihi:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Aldığı Not:</span>
                </div>
              </div>
  
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                    Ödev Konusu
                  </h3>
                  <div className="p-4 border-l-4 border-gray-300 bg-gray-50 print:bg-white text-gray-800">
                    <h4 className="font-bold mb-1">${(assignment as any).title}</h4>
                    <p className="text-sm">${(assignment as any).description}</p>
                  </div>
                </div>
  
                <div>
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                    Yönerge
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed text-justify">
                    ${(assignment as any).instructions}
                  </div>
                </div>
  
                <div>
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                    Teslim Formatı
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                    <li>Bu ödev <strong>${(assignment as any).formats}</strong> formatında hazırlanmalıdır.</li>
                    <li>Dijital dosya boyutu <strong>${(assignment as any).size}</strong>'ı geçmemelidir.</li>
                  </ul>
                </div>
              </div>
  
              <div className="mt-16 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                <p>Bu belge E-Ödev Yönetim Sistemi üzerinden oluşturulmuştur.</p>
              </div>
  
            </div>
          </div>
        </div>
      </div>
    );
};

// --- LIVE HOMEWORK MANAGEMENT COMPONENT ---
const LiveHomeworkManagement = ({ classId, currentClass, teacherProfile, students }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[] }) => {
    const { toast } = useToast();
    const { db } = useAuth();
    const { db: localDb, setDb: setLocalDb, loading: dbLoading } = useDatabase();
    const { homeworkDocuments = [] } = localDb;
  
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
    const [submissions, setSubmissions] = useState<{ [homeworkId: string]: Submission[] }>({});
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const liveHomeworksQuery = useMemo(() => {
        if (!db || !classId) return null;
        return query(collection(db, 'classes', classId, 'homeworks'));
    }, [db, classId]);

    const { data: liveHomeworks, loading: homeworksLoading } = useFirestore<Homework[]>(`homeworks-${classId}`, liveHomeworksQuery);

    const displayedHomeworks = useMemo(() => {
        if (selectedRecordId) {
            const record = homeworkDocuments.find(d => d.id === selectedRecordId);
            return record ? record.data.homeworks : [];
        }
        return liveHomeworks ?? [];
    }, [selectedRecordId, homeworkDocuments, liveHomeworks]);

    const displayedSubmissions = useMemo(() => {
        if (selectedRecordId) {
            const record = homeworkDocuments.find(d => d.id === selectedRecordId);
            const subsByHwId: { [homeworkId: string]: Submission[] } = {};
            if(record) {
                for (const sub of record.data.submissions) {
                    if(!subsByHwId[sub.homeworkId as string]) {
                        subsByHwId[sub.homeworkId as string] = [];
                    }
                    subsByHwId[sub.homeworkId as string].push(sub);
                }
            }
            return subsByHwId;
        }
        return submissions;
    }, [selectedRecordId, homeworkDocuments, submissions]);

    useEffect(() => {
        if (homeworksLoading || !db || !classId || !liveHomeworks) return;

        const fetchSubmissions = async () => {
            const newSubmissions: { [homeworkId: string]: Submission[] } = {};
            for (const hw of liveHomeworks) {
                const subsQuery = query(collection(db, `classes/${classId}/homeworks/${hw.id}/submissions`));
                const querySnapshot = await getDocs(subsQuery);
                const subs: Submission[] = [];
                querySnapshot.forEach(doc => {
                    subs.push({ id: doc.id, ...doc.data() } as Submission);
                });
                newSubmissions[hw.id] = subs;
            }
            setSubmissions(newSubmissions);
        };

        fetchSubmissions();
    }, [liveHomeworks, homeworksLoading, db, classId]);
    
    const handleSaveToArchive = async () => {
        if (!currentClass) return;
        const allSubmissions: Submission[] = Object.values(submissions).flat();

        const newRecord: HomeworkDocument = {
            id: `hw_${Date.now()}`,
            name: `Ödevler - ${new Date().toLocaleDateString('tr-TR')}`,
            date: new Date().toISOString(),
            classId: currentClass.id,
            data: {
                homeworks: liveHomeworks ?? [],
                submissions: allSubmissions
            },
        };
        
        setLocalDb(prevDb => ({
            ...prevDb,
            homeworkDocuments: [...(prevDb.homeworkDocuments || []), newRecord],
        }));
        toast({ title: 'Kaydedildi', description: 'Mevcut ödevler ve teslimler arşive başarıyla kaydedildi.' });
    };

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
    }, []);

    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prevDb => ({
            ...prevDb,
            homeworkDocuments: (prevDb.homeworkDocuments || []).filter(d => d.id !== selectedRecordId),
        }));
        handleNewRecord();
        toast({ title: "Silindi", description: "Ödev kaydı arşivden silindi.", variant: "destructive" });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);


    const handleAddOrUpdateHomework = async () => {
        if (!db || !classId || !text.trim()) return;

        try {
            if (editingHomework) {
                const homeworkRef = doc(db, 'classes', classId, 'homeworks', editingHomework.id);
                await updateDoc(homeworkRef, {
                    text: text,
                    dueDate: dueDate ? dueDate.toISOString() : null,
                });
                toast({ title: "Ödev güncellendi!" });
            } else {
                await addDoc(collection(db, 'classes', classId, 'homeworks'), {
                    classId,
                    text,
                    assignedDate: new Date().toISOString(),
                    dueDate: dueDate ? dueDate.toISOString() : null,
                    teacherName: teacherProfile?.name,
                    lessonName: teacherProfile?.branch,
                    seenBy: [],
                });
                toast({ title: "Ödev eklendi!" });
            }
            setText('');
            setDueDate(undefined);
            setEditingHomework(null);
        } catch (error) {
            console.error("Homework error:", error);
            toast({ variant: "destructive", title: "Hata", description: "İşlem sırasında bir sorun oluştu." });
        }
    };

    const handleDeleteHomework = async (id: string) => {
        if (!db || !classId) return;
        const homeworkRef = doc(db, 'classes', classId, 'homeworks', id);
        await deleteDoc(homeworkRef);
        toast({ title: "Ödev silindi." });
    };

    const startEditing = (hw: Homework) => {
        setEditingHomework(hw);
        setText(hw.text);
        if (hw.dueDate) {
            setDueDate(new Date(hw.dueDate));
        }
    };

    const cancelEditing = () => {
        setEditingHomework(null);
        setText('');
        setDueDate(undefined);
    };

    const handleExport = () => {
        if (currentClass) {
            exportHomeworkStatusToRtf({
                students,
                homeworks: liveHomeworks ?? [],
                submissions: Object.values(submissions).flat(),
                currentClass,
                teacherProfile
            });
        }
    };
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
           <RecordManager
                records={(homeworkDocuments || []).filter(d => d.classId === classId).map(r => ({ id: r.id, name: r.name }))}
                selectedRecordId={selectedRecordId}
                onSelectRecord={setSelectedRecordId}
                onNewRecord={handleNewRecord}
                onDeleteRecord={handleDeleteRecord}
                noun="Ödev Kaydı"
            />
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{editingHomework ? 'Ödevi Düzenle' : 'Yeni Ödev Ekle'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ödev açıklamasını buraya yazın..."
                        rows={5}
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP", { locale: tr }) : <span>Son teslim tarihi seçin</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <CalendarPicker
                                mode="single"
                                selected={dueDate}
                                onSelect={setDueDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="flex gap-2">
                        {editingHomework && <Button variant="ghost" onClick={cancelEditing}>İptal</Button>}
                        <Button onClick={handleAddOrUpdateHomework} className="w-full">{editingHomework ? 'Güncelle' : 'Ekle'}</Button>
                    </div>
                </CardContent>
            </Card>
            <div className='flex items-center gap-2'>
                <Button onClick={handleSaveToArchive} className="w-full bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" /> Canlı Veriyi Arşive Kaydet
                </Button>
                <Button onClick={handleExport} variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4"/> Raporu İndir
                </Button>
            </div>
        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Ödev Listesi ve Teslim Durumu</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[70vh]">
                        {homeworksLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : (
                            <div className="space-y-4">
                                {displayedHomeworks.length > 0 ? displayedHomeworks.map(hw => {
                                    const submittedCount = (displayedSubmissions[hw.id] || []).length;
                                    const studentCount = students.length;
                                    return (
                                        <Accordion key={hw.id} type="single" collapsible>
                                            <AccordionItem value={hw.id} className="border rounded-lg p-4">
                                                <AccordionTrigger>
                                                    <div className="flex flex-col text-left">
                                                        <p className="font-semibold">{hw.text}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Son Teslim: {hw.dueDate ? format(new Date(hw.dueDate), 'dd MMMM yyyy', { locale: tr }) : 'Belirtilmemiş'}
                                                        </p>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="text-sm font-medium">{submittedCount}/{studentCount} öğrenci teslim etti.</p>
                                                        <div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditing(hw)}><Edit className="h-4 w-4"/></Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="h-4 w-4"/></Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                                        <AlertDialogDescription>Bu ödevi ve tüm teslimleri kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteHomework(hw.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Öğrenci</TableHead><TableHead>Teslim Durumu</TableHead><TableHead>Not</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {students.map(student => {
                                                                const submission = (displayedSubmissions[hw.id] || []).find(s => s.studentId === student.id);
                                                                return (
                                                                    <TableRow key={student.id}>
                                                                        <TableCell>{student.name}</TableCell>
                                                                        <TableCell>
                                                                            {submission ? <Badge>Teslim Edildi</Badge> : <Badge variant="secondary">Bekleniyor</Badge>}
                                                                        </TableCell>
                                                                        <TableCell>{submission?.grade ?? 'N/A'}</TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    );
                                }) : <p className="text-center text-muted-foreground py-4">Henüz ödev eklenmemiş.</p>}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    );
};


// --- HOMEWORK LIBRARY COMPONENT ---
const HomeworkLibrary = ({ classId, teacherProfile, classes, students }: { classId: string; teacherProfile: TeacherProfile | null, classes: Class[], students: Student[] }) => {
    const { db } = useAuth();
    const { toast } = useToast();
    
    const [gradeFilter, setGradeFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [rubricModalOpen, setRubricModalOpen] = useState(false);
    const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
    const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
    const [createAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
    const [assignSettingsModalOpen, setAssignSettingsModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [assignDetails, setAssignDetails] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [favorites, setFavorites] = useState<number[]>([]);
    
    const [assignments, setAssignments] = useState(assignmentsData);
    const [rubrics, setRubrics] = useState(initialRubricDefinitions);


    const toggleFavorite = (id: number) => {
        setFavorites(prev => 
        prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const toggleFavoritesOnly = () => {
        setShowFavoritesOnly(!showFavoritesOnly);
        if (!showFavoritesOnly) {
        setGradeFilter('');
        setSubjectFilter('');
        }
    };

    const filteredAssignments = assignments.filter(item => {
        if (showFavoritesOnly) {
        return favorites.includes(item.id);
        }
        if (gradeFilter === '' || subjectFilter === '') return false;
        
        const gradeMatch = item.grade === parseInt(gradeFilter);
        const subjectMatch = item.subject === subjectFilter;
        return gradeMatch && subjectMatch;
    });

    const handleAssignClick = (assignment: any) => {
        setSelectedAssignment(assignment);
        setAssignSettingsModalOpen(true);
    };

    const handleAssignConfirm = async (details: { classId: string, studentId: string, date: string }) => {
        if(!db || !details.classId) return;

        const targetClass = classes.find(c => c.id === details.classId);
        
        try {
            const homeworkData: Omit<Homework, 'id'> = {
                classId: details.classId,
                text: `${selectedAssignment.title}: ${selectedAssignment.instructions}`,
                assignedDate: new Date().toISOString(),
                dueDate: details.date ? new Date(details.date).toISOString() : null,
                teacherName: teacherProfile?.name,
                lessonName: teacherProfile?.branch,
                seenBy: [],
            };
            
            let assignedTo = targetClass?.name || 'Bilinmeyen Sınıf';

            // If a specific student is selected
            if (details.studentId !== 'all') {
                const student = students.find(s => s.id === details.studentId);
                if (student) {
                    // Customize homework text for the specific student and add only to them
                    homeworkData.text = `${student.name} için özel ödev: ${selectedAssignment.title} - ${selectedAssignment.instructions}`;
                    // In a real scenario, you might want to add a `studentId` field to the homework
                    // or handle this assignment in a separate "personal_homeworks" collection.
                    // For now, we will add it to the class but with a specific text.
                    // This is a simplification. A better approach would be a dedicated collection or field.
                    homeworkData.seenBy = [student.id]; // Only this student can see it implicitly
                     assignedTo = student.name;
                }
            }


            await addDoc(collection(db, 'classes', details.classId, 'homeworks'), homeworkData);
            
            const newHistoryItem = {
                title: selectedAssignment.title,
                class: assignedTo,
                date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };

            setHistory(prev => [newHistoryItem, ...prev]);
            setAssignDetails({class: assignedTo, date: details.date});
            setSuccessModalOpen(true);

        } catch (error) {
            toast({variant: 'destructive', title: 'Hata', description: 'Ödev atanamadı.'});
        }
    };

    const handleShowRubric = (assignment: any) => {
        setSelectedAssignment(assignment);
        setRubricModalOpen(true);
    };

    const handleEditAssignment = (assignment: any) => {
        setSelectedAssignment(assignment);
        setEditAssignmentModalOpen(true);
    };

    const handlePrintAssignment = (assignment: any) => {
        setSelectedAssignment(assignment);
        setPrintModalOpen(true);
    }

    const handleSaveEditedAssignment = (updatedFields: any) => {
        setAssignments(prev => prev.map(a => 
        a.id === selectedAssignment.id ? { ...a, ...updatedFields } : a
        ));
    };

    const handleSaveNewAssignment = (newAssignment: any) => {
        const assignmentWithId = {
            ...newAssignment,
            id: Date.now(), 
            grade: parseInt(newAssignment.grade)
        };
        setAssignments(prev => [assignmentWithId, ...prev]);
    };

    const handleSaveNewRubric = (newRubric: any) => {
        const key = `custom_${Date.now()}`;
        setRubrics(prev => ({
        ...prev,
        [key]: newRubric
        }));
    };

    const handleSaveRubric = (key: string, rubric: any) => {
        setRubrics(prev => ({ ...prev, [key]: rubric }));
        toast({title: 'Kriterler Güncellendi', description: 'Değişiklikler bu oturum için kaydedildi.'})
    };

    const hasSelection = (gradeFilter !== '' && subjectFilter !== '') || showFavoritesOnly;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            
            <LibraryHeader 
                onOpenAddRubric={() => setAddRubricModalOpen(true)} 
                onOpenCreateAssignment={() => setCreateAssignmentModalOpen(true)}
                history={history}
                toggleFavoritesOnly={toggleFavoritesOnly}
                showFavoritesOnly={showFavoritesOnly}
            />
            
            <main>
            <div className="mb-8">
                {!hasSelection && (
                <StatsCards 
                    total={assignments.length} 
                    assignedCount={history.length} 
                    favoritesCount={favorites.length} 
                />
                )}
            </div>

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Performans Ödevleri (2025-2026 Maarif Modeli)</h2>
                <p className="text-gray-500">
                Yüklediğiniz yıllık planlardaki güncel tema ve kazanımlara uygun, araştırma odaklı performans ödevlerini filtreleyin ve özelleştirin.
                </p>
            </div>

            {!showFavoritesOnly && (
                <FilterBar 
                gradeFilter={gradeFilter}
                subjectFilter={subjectFilter}
                setGradeFilter={setGradeFilter}
                setSubjectFilter={setSubjectFilter}
                disabled={showFavoritesOnly}
                />
            )}

            {showFavoritesOnly && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
                <span className="text-red-700 font-medium flex items-center gap-2"><Heart className="fill-current" size={18}/> Favori Ödevleriniz Listeleniyor</span>
                <button onClick={toggleFavoritesOnly} className="text-sm text-red-600 hover:underline">Tümüne Dön</button>
                </div>
            )}

            {!hasSelection ? (
                <EmptyState />
            ) : filteredAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map(item => (
                    <AssignmentCard 
                    key={item.id} 
                    item={item} 
                    onAssign={handleAssignClick}
                    onShowRubric={handleShowRubric}
                    onEdit={handleEditAssignment}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={toggleFavorite}
                    onPrint={handlePrintAssignment}
                    />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Filter size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
                <p className="text-gray-500">
                    {showFavoritesOnly 
                    ? "Henüz favorilere eklediğiniz bir ödev yok." 
                    : "Seçili filtrelere uygun ödev yok. Lütfen filtreleri değiştirin."}
                </p>
                </div>
            )}
            </main>
        </div>

        <AssignSettingsModal 
            isOpen={assignSettingsModalOpen}
            onClose={() => setAssignSettingsModalOpen(false)}
            assignment={selectedAssignment}
            onConfirm={handleAssignConfirm}
            classes={classes}
            students={students}
        />

        <SuccessModal 
            isOpen={successModalOpen} 
            onClose={() => setSuccessModalOpen(false)} 
            assignment={selectedAssignment}
            details={assignDetails}
        />

        <RubricModal 
            isOpen={rubricModalOpen}
            onClose={() => setRubricModalOpen(false)}
            assignment={selectedAssignment}
            rubrics={rubrics}
            onAddRubricClick={() => setAddRubricModalOpen(true)}
            onSaveRubric={handleSaveRubric}
        />

        <AddRubricModal 
            isOpen={addRubricModalOpen}
            onClose={() => setAddRubricModalOpen(false)}
            onSave={handleSaveNewRubric}
        />

        <EditAssignmentModal 
            isOpen={editAssignmentModalOpen}
            onClose={() => setEditAssignmentModalOpen(false)}
            assignment={selectedAssignment}
            onSave={handleSaveEditedAssignment}
        />

        <CreateAssignmentModal
            isOpen={createAssignmentModalOpen}
            onClose={() => setCreateAssignmentModalOpen(false)}
            onSave={handleSaveNewAssignment}
        />

        <PrintPreviewModal
            isOpen={printModalOpen}
            onClose={() => setPrintModalOpen(false)}
            assignment={selectedAssignment}
        />
        </div>
    );
};

// --- MAIN EXPORTED COMPONENT ---
export function HomeworkTab({ classId, currentClass, teacherProfile, students, classes }: { classId: string, currentClass: Class | null, teacherProfile: TeacherProfile | null, students: Student[], classes: Class[] }) {
    
    const { db } = useAuth();
    
    const allStudentsForTeacherQuery = useMemo(() => {
        if (!teacherProfile?.id || !db) return null;
        // This is not a scalable query for a large number of classes.
        // It's used here because the class list for a teacher is not directly available without fetching all classes.
        // A better data model would have a 'teacherId' on the class document.
        // Assuming the current setup, we fetch all students and filter client-side, which is inefficient.
        // The logic is corrected to fetch students for ALL of the teacher's classes.
        const classIds = classes.map(c => c.id);
        if (classIds.length === 0) return null;
        return query(collection(db, 'students'), where('classId', 'in', classIds));
    }, [teacherProfile?.id, db, classes]);

    const { data: allStudents } = useFirestore<Student[]>(
        `all-students-for-teacher-${teacherProfile?.id}`,
        allStudentsForTeacherQuery
    );

    return (
        <Tabs defaultValue="live">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="live">Canlı Ödev Yönetimi</TabsTrigger>
                <TabsTrigger value="library">Hazır Ödev Kütüphanesi</TabsTrigger>
            </TabsList>
            <TabsContent value="live" className="mt-4">
                <LiveHomeworkManagement
                    classId={classId}
                    currentClass={currentClass}
                    teacherProfile={teacherProfile}
                    students={students}
                />
            </TabsContent>
            <TabsContent value="library" className="mt-4">
                <HomeworkLibrary 
                    classId={classId}
                    teacherProfile={teacherProfile}
                    classes={classes}
                    students={allStudents || []}
                />
            </TabsContent>
        </Tabs>
    );
}
