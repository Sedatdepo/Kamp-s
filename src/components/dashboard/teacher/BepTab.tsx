'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Search,
  AlertCircle,
  ChevronDown,
  Settings
} from 'lucide-react';
import { TeacherProfile, Class, BepStudent } from '@/lib/types';
import { ALL_PLANS } from '@/lib/plans';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDatabase } from '@/hooks/use-database';
import { Checkbox } from '@/components/ui/checkbox';

// --- SABİT VERİLER (CONSTANTS) ---

const allOutcomes = Object.keys(ALL_PLANS).flatMap(subjectKey => {
    const subjectData = ALL_PLANS[subjectKey];
    if (!subjectData || !subjectData.data) return [];
    
    return Object.keys(subjectData.data).flatMap(classLevel => {
        const classData = subjectData.data[classLevel];
        if (!classData || !classData.data) return [];

        return classData.data.map((item: any) => {
            if (!item.learningOutcome || item.isBreak || item.learningOutcome.includes('Devamı...')) {
                return null;
            }

            const match = item.learningOutcome.match(/^(FİZ\.\d+\.\d+\.\d+)\.?\s*(.*)$/);
            
            let id, text;
            if (match && match[1] && match[2]) {
                id = match[1];
                text = match[2];
            } else {
                id = item.id; 
                text = item.learningOutcome;
            }

            return {
                id: id,
                grade: parseInt(classLevel, 10),
                unit: item.unit,
                text: text,
                subject: subjectKey,
            };
        }).filter(Boolean);
    });
});

const UNIQUE_OUTCOMES = Array.from(new Map(allOutcomes.map(item => [item!.id, item])).values());


const KABA_ITEMS = [
  { grade: 9, unit: "FİZİK BİLİMİ", skill: "Fiziğin ne olduğunu kendi cümleleriyle açıklar." },
  { grade: 9, unit: "FİZİK BİLİMİ", skill: "Fiziğin alt dallarından 3 tanesini sayar." },
  { grade: 9, unit: "KUVVET VE HAREKET", skill: "Temel ve türetilmiş büyüklükleri ayırt eder." },
  { grade: 10, unit: "KUVVET VE HAREKET", skill: "Hareket çeşitlerini ayırt eder." },
  { grade: 10, unit: "ENERJİ", skill: "Enerji türlerini sayar." }
];

const SPECIAL_NEED_TYPES = [
  "otizm", "işitme-engelli", "görme-engelli",
  "zihinsel-yetersizlik", "dikkat-eksikliği", "öğrenme-güçlüğü"
];

// --- YENİ EKLENEN LİSTELER ---
const TEACHING_METHODS = [
  "Anlatım", "Soru-Cevap", "Gösterip Yaptırma", "Beyin Fırtınası", 
  "Bireysel Çalışma", "Grup Çalışması", "Gezi-Gözlem", "Örnek Olay", "Rol Oynama"
];

const MATERIALS = [
  "Ders Kitabı", "Akıllı Tahta", "EBA İçerikleri", "Çalışma Yaprakları", 
  "Kavram Haritaları", "Video/Animasyon", "Deney Malzemeleri", "Somut Modeller"
];

const EVALUATION_METHODS = [
  "%60 Başarı", "%50 Başarı", "Gözlem Formu", "Yazılı Sınav", 
  "Sözlü Sınav", "Performans Ödevi", "Proje", "Kontrol Listesi"
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

// --- ANA BİLEŞEN ---

export function BepTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
  // --- STATE YÖNETİMİ ---
  const { db, setDb } = useDatabase();
  const { bepStudents: students = [] } = db;

  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  
  const [toasts, setToasts] = useState<any[]>([]);

  // Form & Seçim Stateleri
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<BepStudent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // BEP Modülü Stateleri
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [bepDates, setBepDates] = useState({ start: '', end: '' });
  const [bepSelections, setBepSelections] = useState<any>({});
  const [selectedPerformance, setSelectedPerformance] = useState<any>({});
  const [selectedKaba, setSelectedKaba] = useState<any>({});
  const [dynamicPerformanceItems, setDynamicPerformanceItems] = useState<any[]>([]);
  
  const [selectedBebSubject, setSelectedBebSubject] = useState(Object.keys(ALL_PLANS)[0]);
  const [selectedBebGrade, setSelectedBebGrade] = useState('9');


  const addToast = useCallback((msg: any, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
  }, []);

  // --- INITIALIZATION & DATA LOADING ---
  useEffect(() => {
    setIsClient(true);
    const today = new Date();
    const future = new Date();
    future.setMonth(today.getMonth() + 6);
    setBepDates({
      start: today.toISOString().split('T')[0],
      end: future.toISOString().split('T')[0]
    });
  }, []);
  
  // Load student's BEP data when selected
  useEffect(() => {
    if (!selectedStudentId || students.length === 0) {
        setBepSelections({});
        setSelectedPerformance({});
        setSelectedKaba({});
        setDynamicPerformanceItems([]);
        return;
    };
    
    const student = students.find(s => s.id === selectedStudentId);

    if (student && student.bepData) {
        const { bepData } = student;
        setBepSelections(bepData.bepSelections || {});
        setSelectedPerformance(bepData.selectedPerformance || {});
        setSelectedKaba(bepData.selectedKaba || {});
        setBepDates(bepData.bepDates || { start: new Date().toISOString().split('T')[0], end: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0] });
        setSelectedBebSubject(bepData.selectedBebSubject || Object.keys(ALL_PLANS)[0]);
        setSelectedBebGrade(bepData.selectedBebGrade || '9');
        addToast('Kaydedilmiş BEP verileri yüklendi.', 'info');
    } else {
        setBepSelections({});
        setSelectedPerformance({});
        setSelectedKaba({});
        setDynamicPerformanceItems([]);
    }
  }, [selectedStudentId, students, addToast]);


  // --- AUTO-FILL EFFECT ---
    useEffect(() => {
        if (!isClient) return;

        const selectedIds = Object.keys(bepSelections);
        if (selectedIds.length === 0) {
            setDynamicPerformanceItems([]);
            setSelectedPerformance({});
            setSelectedKaba({});
            return;
        }

        const selectedOutcomeObjects = UNIQUE_OUTCOMES.filter(k => k && selectedIds.includes(k.id));

        // --- 1. Eğitsel Performans (Birebir Eşleme) ---
        const newPerformanceItems = selectedOutcomeObjects.map(kazanim => ({
            id: kazanim!.id, 
            skill: kazanim!.text 
        }));
        setDynamicPerformanceItems(newPerformanceItems);

        const newPerformanceState: Record<string, { score: string; observation: string }> = {};
        selectedOutcomeObjects.forEach(kazanim => {
            if (kazanim) {
                newPerformanceState[kazanim.id] = {
                    score: '2', 
                    observation: `'${kazanim.text}' becerisini göstermede desteklenmelidir.`
                };
            }
        });
        setSelectedPerformance(newPerformanceState);

        // --- 2. Kaba Değerlendirme (Birebir Eşleme) ---
        const newKabaState: Record<string, { evaluation: string; text: string, unit: string }> = {};
        selectedOutcomeObjects.forEach(kazanim => {
            if (kazanim) {
                const key = kazanim.id;
                newKabaState[key] = {
                    evaluation: 'yapamaz', 
                    text: `'${kazanim.text}' kazanımını henüz edinememiştir. BEP planına bu doğrultuda alınmıştır.`,
                    unit: kazanim.unit
                };
            }
        });
        setSelectedKaba(newKabaState);

    }, [bepSelections, isClient]);

  
    useEffect(() => {
        const subjectData = ALL_PLANS[selectedBebSubject];
        if (subjectData && !subjectData.grades.includes(selectedBebGrade)) {
            setSelectedBebGrade(subjectData.grades[0]);
        }
    }, [selectedBebSubject, selectedBebGrade]);

  // --- ACTIONS ---
  
  const handleSaveStudent = (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const currentNeeds = editingStudent?.specialNeeds || [];

    const newStudent: BepStudent = {
      id: editingStudent && editingStudent.id ? editingStudent.id : crypto.randomUUID(),
      name: formData.get('name') as string,
      class: formData.get('class') as string,
      number: formData.get('number') as string,
      branch: formData.get('branch') as string,
      notes: formData.get('notes') as string,
      specialNeeds: currentNeeds, 
      isSpecialNeeds: true
    };

    let updatedStudents;
    if (editingStudent && editingStudent.id) {
      updatedStudents = students.map(s => s.id === newStudent.id ? newStudent : s);
      addToast('Öğrenci başarıyla güncellendi', 'success');
    } else {
      updatedStudents = [...students, newStudent];
      addToast('Yeni öğrenci eklendi', 'success');
    }

    setDb(prev => ({ ...prev, bepStudents: updatedStudents }));
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (id: any) => {
    if (confirm('Bu öğrenciyi ve tüm verilerini silmek istediğinize emin misiniz?')) {
      const updated = students.filter(s => s.id !== id);
      setDb(prev => ({ ...prev, bepStudents: updated }));
      addToast('Öğrenci silindi', 'warning');
      
      if (selectedStudentId === id) {
        setSelectedStudentId('');
        setBepSelections({});
      }
    }
  };

  const toggleSpecialNeed = (need: any) => {
    if (!editingStudent) return;
    const currentNeeds = editingStudent?.specialNeeds || [];
    const newNeeds = currentNeeds.includes(need)
      ? currentNeeds.filter((n: any) => n !== need)
      : [...currentNeeds, need];
    
    setEditingStudent((prev: any) => ({ ...prev, specialNeeds: newNeeds }));
  };

  // --- DATA FILTERING (MEMOIZED) ---

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.number.includes(searchTerm)
    );
  }, [students, searchTerm]);

  const currentStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const filteredKazanims = useMemo(() => {
    const grade = parseInt(selectedBebGrade, 10);
    if (isNaN(grade)) return [];
    return UNIQUE_OUTCOMES.filter(k => k!.subject === selectedBebSubject && k!.grade === grade);
  }, [selectedBebSubject, selectedBebGrade]);

  const filteredKabaItems = useMemo(() => {
    const grade = parseInt(selectedBebGrade, 10);
    if (isNaN(grade)) return [];
    return KABA_ITEMS.filter(k => k.grade === grade);
  }, [selectedBebGrade]);
  
  const areAllFilteredKazanimsSelected = useMemo(() => {
      if (filteredKazanims.length === 0) return false;
      return filteredKazanims.every(k => k && bepSelections.hasOwnProperty(k.id));
  }, [filteredKazanims, bepSelections]);

  const handleToggleAllKazanims = () => {
      const allIds = filteredKazanims.map(k => k!.id);
      if (areAllFilteredKazanimsSelected) {
          // Deselect all visible
          setBepSelections((prev: any) => {
              const newState = { ...prev };
              allIds.forEach(id => delete newState[id]);
              return newState;
          });
      } else {
          // Select all visible
          const newSelections: { [key: string]: any } = {};
          filteredKazanims.forEach(k => {
              if (k) {
                newSelections[k.id] = {
                    method: "Anlatım, Soru-Cevap",
                    material: "Ders Kitabı, Akıllı Tahta",
                    evaluation: "%60 Başarı"
                };
              }
          });
          setBepSelections((prev: any) => ({ ...prev, ...newSelections }));
      }
  };


  // --- BEP ACTIONS ---
  
    const handleSaveBepData = () => {
    if (!currentStudent) {
      addToast('Lütfen önce bir öğrenci seçin', 'error');
      return;
    }
    const bepDataForStudent = {
      bepSelections,
      selectedPerformance,
      selectedKaba,
      bepDates,
      selectedBebSubject,
      selectedBebGrade
    };

    const updatedStudents = students.map(s => {
      if (s.id === selectedStudentId) {
        return { ...s, bepData: bepDataForStudent };
      }
      return s;
    });
    setDb(prev => ({ ...prev, bepStudents: updatedStudents }));
    addToast('BEP verileri başarıyla öğrenciye kaydedildi.', 'success');
  };

  const toggleKazanim = (id: any) => {
    setBepSelections((prev: any) => {
        const newState = { ...prev };
        if (newState[id]) {
            delete newState[id]; // Varsa sil (seçimi kaldır)
        } else {
            // Yoksa varsayılan değerlerle ekle
            newState[id] = {
                method: "Anlatım, Soru-Cevap",
                material: "Ders Kitabı, Akıllı Tahta",
                evaluation: "%60 Başarı"
            };
        }
        return newState;
    });
  };

  const updateKazanimDetail = (id: any, field: any, value: any) => {
    setBepSelections((prev: any) => ({
        ...prev,
        [id]: {
            ...prev[id],
            [field]: value
        }
    }));
  };

  const handleKabaEvaluation = (key: any, value: any, skillText: any) => {
    let text = "";
    if (value === 'yapar') text = `"${skillText}" kazanımını bağımsız olarak gerçekleştirmektedir.`;
    else if (value === 'yapamaz') text = `"${skillText}" kazanımını henüz kazanamamıştır.`;
    else if (value === 'kısmen') text = `"${skillText}" kazanımını yardım ile gerçekleştirmektedir.`;

    setSelectedKaba((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], evaluation: value, text: text }
    }));
  };

  const handleKabaTextChange = (key: any, text: any) => {
    setSelectedKaba((prev: any) => ({
        ...prev,
        [key]: { ...prev[key], text: text }
    }));
  };

  const generateRTF = (type: any) => {
    if (!currentStudent) return addToast('Lütfen önce bir öğrenci seçin', 'error');

    let content = '';

    const teacherInfo = {
        branchTeacher: teacherProfile?.name || '',
        guidanceTeacher: teacherProfile?.guidanceCounselorName || '',
        schoolPrincipal: teacherProfile?.principalName || '',
        schoolName: teacherProfile?.schoolName || ''
    };


    if (type === 'bep') {
        const selectedIds = Object.keys(bepSelections);
        if (selectedIds.length === 0) return addToast('Lütfen en az bir kazanım seçin', 'warning');

        let rows = '';
        let currentDate = new Date(bepDates.start);
        const endD = new Date(bepDates.end);
        const diffTime = Math.abs(endD.getTime() - currentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const interval = Math.max(1, Math.floor(diffDays / selectedIds.length));
        
        const activeKazanims = filteredKazanims.filter(k => selectedIds.includes(k!.id));

        activeKazanims.forEach((k) => {
            const details = bepSelections[k!.id];
            const dateStr = currentDate.toLocaleDateString('tr-TR');
            rows += `
                <tr>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${k!.unit}</td>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${k!.text}</td>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${details.evaluation}</td>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${details.method}</td>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${details.material}</td>
                    <td style="border:1px solid #000;padding:5px;font-size:10pt">${dateStr}</td>
                </tr>
            `;
            currentDate.setDate(currentDate.getDate() + interval);
        });

        content = `
            <h2 style="text-align:center;font-size:16pt;font-weight:bold">BİREYSELLEŞTİRİLMİŞ EĞİTİM PLANI (BEP)</h2>
            <p style="font-size:12pt"><strong>Öğrenci:</strong> ${currentStudent.name}</p>
            <p style="font-size:12pt"><strong>Sınıf/No:</strong> ${currentStudent.class} / ${currentStudent.number}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee;font-weight:bold">
                    <th style="border:1px solid #000;padding:5px">Ünite</th>
                    <th style="border:1px solid #000;padding:5px">Kazanım</th>
                    <th style="border:1px solid #000;padding:5px">Ölçüt</th>
                    <th style="border:1px solid #000;padding:5px">Yöntem/Teknik</th>
                    <th style="border:1px solid #000;padding:5px">Materyal</th>
                    <th style="border:1px solid #000;padding:5px">Tarih</th>
                </tr>
                ${rows}
            </table>
            <br><br>
            <table style="width:100%;margin-top:50px">
                <tr>
                    <td style="text-align:center"><strong>${teacherInfo.branchTeacher}</strong><br>Branş Öğretmeni</td>
                    <td style="text-align:center"><strong>${teacherInfo.guidanceTeacher}</strong><br>Rehber Öğretmen</td>
                </tr>
            </table>
        `;
    } 
    else if (type === 'performance') {
        let rows = '';
        dynamicPerformanceItems.forEach(item => {
            const data = selectedPerformance[item.id] || { score: '', observation: '' };
            rows += `
                <tr>
                    <td style="border:1px solid #000;padding:5px">${item.skill}</td>
                    <td style="border:1px solid #000;padding:5px;text-align:center">${data.score || '-'}</td>
                    <td style="border:1px solid #000;padding:5px">${data.observation || ''}</td>
                </tr>
            `;
        });
        content = `
             <h2 style="text-align:center;font-size:16pt;font-weight:bold">EĞİTSEL PERFORMANS FORMU</h2>
             <p style="font-size:12pt"><strong>Öğrenci:</strong> ${currentStudent.name}</p>
             <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee;font-weight:bold">
                    <th style="border:1px solid #000;padding:5px">Beceri</th>
                    <th style="border:1px solid #000;padding:5px">Puan (1-4)</th>
                    <th style="border:1px solid #000;padding:5px">Gözlem</th>
                </tr>
                ${rows}
             </table>
        `;
    }
    else if (type === 'kaba') {
        const kabaKeys = Object.keys(selectedKaba);
        if (kabaKeys.length === 0) return addToast('Kaba değerlendirme için kazanım seçilmemiş', 'warning');
        
        let rows = '';
        kabaKeys.forEach((kazanimId: string) => {
            const kazanım = UNIQUE_OUTCOMES.find(k => k.id === kazanimId);
            const selection = selectedKaba[kazanimId];
            if(kazanım && selection) {
                const evalText = selection?.evaluation ? selection.evaluation.toUpperCase() : '-';
                const note = selection?.text || '';
                
                rows += `
                    <tr>
                        <td style="border:1px solid #000;padding:5px">${kazanım.unit}</td>
                        <td style="border:1px solid #000;padding:5px">${kazanım.text}</td>
                        <td style="border:1px solid #000;padding:5px;text-align:center">${evalText}</td>
                        <td style="border:1px solid #000;padding:5px">${note}</td>
                    </tr>
                `;
            }
        });

        content = `
             <h2 style="text-align:center;font-size:16pt;font-weight:bold">KABA DEĞERLENDİRME FORMU</h2>
             <p style="font-size:12pt"><strong>Öğrenci:</strong> ${currentStudent.name}</p>
             <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee;font-weight:bold">
                    <th style="border:1px solid #000;padding:5px">Ünite</th>
                    <th style="border:1px solid #000;padding:5px">Kazanım</th>
                    <th style="border:1px solid #000;padding:5px">Değerlendirme</th>
                    <th style="border:1px solid #000;padding:5px">Gözlem/Sonuç</th>
                </tr>
                ${rows}
             </table>
        `;
    }

    downloadAsRTF(content, `${type}_raporu_${currentStudent.name.replace(/\s+/g, '_')}`);
    addToast('Dosya oluşturuldu ve indiriliyor...', 'success');
  };


  // --- UI RENDERERS ---

  if (!isClient) return <div className="p-10 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-100">
      
      {/* Toast Messages */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t: any) => (
          <div key={t.id} className={`pointer-events-auto bg-white p-4 rounded-lg shadow-xl border-l-4 ${t.type === 'success' ? 'border-green-500' : t.type === 'error' ? 'border-red-500' : 'border-blue-500'} flex items-center gap-3 animate-bounce-in transform transition-all`}>
            {t.type === 'success' ? <CheckSquare size={20} className="text-green-500"/> : t.type === 'error' ? <AlertCircle size={20} className="text-red-500"/> : <Square size={20} className="text-blue-500"/>}
            <span className="font-medium text-sm">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-slate-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
                    <School size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-tight">BEP Modülü</h1>
                    <p className="text-xs text-slate-500 font-medium">MEB Uyumlu Rehberlik Sistemi</p>
                </div>
            </div>
            
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('students')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Users size={18} /> Öğrenci Yönetimi
                </button>
                <button 
                    onClick={() => setActiveTab('bep')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'bep' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    <FileText size={18} /> BEP Hazırla
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* TAB 1: ÖĞRENCİ YÖNETİMİ & AYARLAR */}
        {activeTab === 'students' && (
            <div className="space-y-8 animate-fadeIn">
                
                {/* Öğretmen Bilgileri */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-5">
                         <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                            <School size={20} className="text-blue-500"/> Okul & Öğretmen Bilgileri
                        </h2>
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                         {(['branchTeacher', 'guidanceTeacher', 'schoolPrincipal', 'schoolName'] as const).map((field, idx) => (
                             <div key={field} className="relative group">
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide group-focus-within:text-blue-500 transition-colors">
                                    {['Branş Öğretmeni', 'Rehber Öğretmen', 'Okul Müdürü', 'Okul Adı'][idx]}
                                </label>
                                <input 
                                    type="text"
                                    readOnly 
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" 
                                    value={
                                        field === 'branchTeacher' ? teacherProfile?.name || '' :
                                        field === 'guidanceTeacher' ? teacherProfile?.guidanceCounselorName || '' :
                                        field === 'schoolPrincipal' ? teacherProfile?.principalName || '' :
                                        teacherProfile?.schoolName || ''
                                    } 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Öğrenci Listesi */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Users className="text-blue-500" /> Kayıtlı Öğrenciler</h2>
                        <button 
                            onClick={() => { setEditingStudent({} as any); setIsModalOpen(true); }}
                            className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium">
                            <Plus size={18} /> Yeni Öğrenci Ekle
                        </button>
                    </div>

                    <div className="relative mb-6 group">
                        <Search className="absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input 
                            type="text" 
                            placeholder="Öğrenci adı, sınıf veya numara ile ara..." 
                            className="w-full p-3 pl-11 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredStudents.length > 0 ? filteredStudents.map((student: any) => (
                            <div key={student.id} className="p-4 border border-slate-200 rounded-xl flex justify-between items-start hover:shadow-md hover:border-blue-300 bg-white transition-all group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-slate-800">{student.name}</h3>
                                        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">#{student.number}</span>
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                        <span className="flex items-center gap-1"><School size={12}/> {student.class}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span>{student.branch}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {student.specialNeeds && student.specialNeeds.map((need: any) => (
                                            <span key={need} className="text-xs font-semibold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full border border-orange-100">
                                                {need.replace('-', ' ').toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingStudent(student); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Düzenle">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteStudent(student.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Sil">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                <Users size={48} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">Öğrenci bulunamadı.</p>
                                <p className="text-sm">Arama kriterlerini değiştirin veya yeni öğrenci ekleyin.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        )}

        {/* TAB 2: BEP MODULE */}
        {activeTab === 'bep' && (
            <div className="space-y-8 animate-fadeIn">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <FileText className="text-blue-600" size={24} />
                        <h2 className="text-xl font-bold text-slate-800">BEP ve Değerlendirme</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-slate-50 rounded-xl border">
                        <div>
                            <Label className="font-semibold text-slate-600">BEP Hazırlanacak Ders</Label>
                            <Select value={selectedBebSubject} onValueChange={setSelectedBebSubject}>
                                <SelectTrigger><SelectValue placeholder="Ders seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(ALL_PLANS).map(subject => <SelectItem key={subject} value={subject}>{subject}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="font-semibold text-slate-600">Kazanım Sınıf Seviyesi</Label>
                            <Select value={selectedBebGrade} onValueChange={setSelectedBebGrade}>
                                <SelectTrigger><SelectValue placeholder="Sınıf seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {ALL_PLANS[selectedBebSubject]?.grades.map((grade: string) => <SelectItem key={grade} value={grade}>{grade === '0' ? 'Hazırlık' : `${grade}. Sınıf`}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* Öğrenci Seçimi */}
                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">İşlem Yapılacak Öğrenciyi Seçin</label>
                        <select 
                            className="w-full p-4 border border-slate-300 rounded-xl bg-slate-50 text-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all cursor-pointer"
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                        >
                            <option value="">-- Listeden bir öğrenci seçiniz --</option>
                            {students.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} — {s.class} ({s.specialNeeds?.join(', ')})</option>
                            ))}
                        </select>
                    </div>

                    {currentStudent ? (
                        <div className="space-y-8">
                            
                            {/* Tarih ve Bilgi Kartı */}
                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <h4 className="text-blue-800 font-bold mb-1">{currentStudent.name}</h4>
                                    <p className="text-blue-600 text-sm">{currentStudent.class} • No: {currentStudent.number}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-blue-400 mb-1 uppercase">Başlangıç</label>
                                        <input type="date" className="p-2 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400" 
                                            value={bepDates.start} onChange={(e: any) => setBepDates({...bepDates, start: e.target.value})} />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-blue-400 mb-1 uppercase">Bitiş</label>
                                        <input type="date" className="p-2 border border-blue-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-400" 
                                            value={bepDates.end} onChange={(e: any) => setBepDates({...bepDates, end: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* 1. Kazanım Seçimi ve Detaylandırma */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                      <Checkbox id="select-all-kazanim" checked={areAllFilteredKazanimsSelected} onCheckedChange={handleToggleAllKazanims} />
                                      <label htmlFor="select-all-kazanim" className="font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                                        <CheckSquare size={18} /> Kazanım Listesi ve Planlama
                                      </label>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{Object.keys(bepSelections).length} Seçili</span>
                                </div>
                                <div className="space-y-3">
                                    {filteredKazanims.length > 0 ? filteredKazanims.map(k => {
                                        const isSelected = !!bepSelections[k!.id];
                                        return (
                                            <div 
                                                key={k!.id} 
                                                className={`border rounded-xl transition-all overflow-hidden ${isSelected ? 'border-blue-300 shadow-sm bg-white' : 'border-slate-200 bg-slate-50/50'}`}
                                            >
                                                {/* Header / Toggle Area */}
                                                <div 
                                                    onClick={() => toggleKazanim(k!.id)}
                                                    className={`p-4 cursor-pointer flex gap-3 items-start hover:bg-blue-50/30 transition-colors`}
                                                >
                                                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'}`}>
                                                        {isSelected && <CheckSquare className="text-white" size={14}/>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{k!.id}</span>
                                                            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">{k!.unit}</span>
                                                        </div>
                                                        <p className={`text-sm leading-relaxed ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>{k!.text}</p>
                                                    </div>
                                                    {isSelected && <Settings size={16} className="text-slate-400" />}
                                                </div>

                                                {/* Details Area (Only if selected) */}
                                                {isSelected && (
                                                    <div className="p-4 bg-blue-50/30 border-t border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Yöntem ve Teknik</label>
                                                            <select 
                                                                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                                                value={bepSelections[k!.id]?.method || ''}
                                                                onChange={(e) => updateKazanimDetail(k!.id, 'method', e.target.value)}
                                                            >
                                                                {TEACHING_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                                <option value="Anlatım, Soru-Cevap">Anlatım, Soru-Cevap (Standart)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Eğitim Materyali</label>
                                                            <select 
                                                                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                                                value={bepSelections[k!.id]?.material || ''}
                                                                onChange={(e) => updateKazanimDetail(k!.id, 'material', e.target.value)}
                                                            >
                                                                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                                                                <option value="Ders Kitabı, Akıllı Tahta">Ders Kitabı, Akıllı Tahta (Standart)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-500 mb-1">Değerlendirme Ölçütü</label>
                                                            <select 
                                                                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                                                                value={bepSelections[k!.id]?.evaluation || ''}
                                                                onChange={(e) => updateKazanimDetail(k!.id, 'evaluation', e.target.value)}
                                                            >
                                                                {EVALUATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="p-8 text-center text-slate-400 italic">
                                            Bu sınıf düzeyi ({selectedBebGrade}) için tanımlı kazanım bulunamadı.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* 2. Performans Değerlendirme */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Square size={18} /> Eğitsel Performans</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {dynamicPerformanceItems.map(item => (
                                        <div key={item.id} className="p-5 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition-shadow">
                                            <p className="text-sm font-semibold text-slate-800 mb-3">{item.skill}</p>
                                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-400 px-2">PUAN</span>
                                                    <input 
                                                        type="number" min="1" max="4" 
                                                        className="w-12 p-1.5 border border-slate-200 rounded-md text-center text-sm font-bold focus:ring-2 focus:ring-blue-200 outline-none"
                                                        value={selectedPerformance[item.id]?.score || ''}
                                                        onChange={(e: any) => setSelectedPerformance({
                                                            ...selectedPerformance,
                                                            [item.id]: { ...selectedPerformance[item.id], score: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="flex-1 w-full">
                                                     <input 
                                                        type="text" 
                                                        placeholder="Gözlem notunuzu buraya yazın..."
                                                        className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                        value={selectedPerformance[item.id]?.observation || ''}
                                                        onChange={(e: any) => setSelectedPerformance({
                                                            ...selectedPerformance,
                                                            [item.id]: { ...selectedPerformance[item.id], observation: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {dynamicPerformanceItems.length === 0 && <p className="text-sm text-slate-400 italic">Değerlendirme maddeleri, yukarıdan kazanım seçince otomatik olarak oluşacaktır.</p>}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* 3. Kaba Değerlendirme */}
                            <div>
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Square size={18} /> Kaba Değerlendirme</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {Object.keys(selectedKaba).length > 0 ? Object.keys(selectedKaba).map((kazanimId, idx) => {
                                        const kazanım = UNIQUE_OUTCOMES.find(k => k.id === kazanimId);
                                        if (!kazanım) return null;
                                        const item = selectedKaba[kazanimId];
                                        return (
                                            <div key={kazanimId} className="p-5 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition-shadow">
                                                <div className="mb-3">
                                                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">{item.unit}</span>
                                                    <p className="text-sm text-slate-700 mt-2">{kazanım.text}</p>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {['yapar', 'yapamaz', 'kısmen'].map(opt => (
                                                        <label key={opt} className={`flex-1 min-w-[80px] cursor-pointer text-center py-2 rounded-lg border text-sm font-medium transition-all ${item.evaluation === opt ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                                                            <input 
                                                                type="radio" 
                                                                name={`kaba_${idx}`}
                                                                className="hidden"
                                                                checked={item.evaluation === opt}
                                                                onChange={() => handleKabaEvaluation(kazanimId, opt, kazanım.text)}
                                                            />
                                                            <span className="capitalize">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                
                                                <textarea 
                                                    rows={2} 
                                                    placeholder="Otomatik oluşturulan gözlem notu (düzenlenebilir)"
                                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                    value={item.text || ''}
                                                    onChange={(e) => handleKabaTextChange(kazanimId, e.target.value)}
                                                ></textarea>
                                            </div>
                                        )
                                    }) : (
                                        <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl">
                                            Kaba değerlendirme maddeleri, yukarıdan kazanım seçince otomatik olarak oluşacaktır.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export Buttons */}
                             <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 sticky bottom-6 z-10">
                                <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex flex-wrap gap-2 justify-center">
                                    <button 
                                        onClick={handleSaveBepData}
                                        className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 shadow-sm flex items-center gap-2 font-bold text-sm transition-transform active:scale-95">
                                        <Save size={18} /> BEP Verilerini Kaydet
                                    </button>
                                    <button 
                                        onClick={() => generateRTF('bep')}
                                        className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 shadow-sm flex items-center gap-2 font-bold text-sm transition-transform active:scale-95">
                                        <Download size={18} /> BEP İndir
                                    </button>
                                    <button 
                                        onClick={() => generateRTF('performance')}
                                        className="bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 shadow-sm flex items-center gap-2 font-bold text-sm transition-transform active:scale-95">
                                        <Download size={18} /> Performans İndir
                                    </button>
                                    <button 
                                        onClick={() => generateRTF('kaba')}
                                        className="bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 shadow-sm flex items-center gap-2 font-bold text-sm transition-transform active:scale-95">
                                        <Download size={18} /> Kaba Değ. İndir
                                    </button>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                            <Users size={64} className="mb-4 opacity-30" />
                            <p className="text-lg font-medium">İşlem yapmak için yukarıdan bir öğrenci seçiniz.</p>
                            <p className="text-sm">Seçim yaptıktan sonra formlar burada görünecektir.</p>
                        </div>
                    )}
                </section>
            </div>
        )}
      </main>

      {/* MODAL: Öğrenci Ekle/Düzenle */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all scale-100">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-slate-800">{editingStudent?.id ? 'Öğrenci Bilgilerini Düzenle' : 'Yeni Öğrenci Ekle'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveStudent} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Ad Soyad</label>
                            <input name="name" required defaultValue={editingStudent?.name} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" placeholder="Örn: Ali Yılmaz" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Sınıf</label>
                            <input name="class" required defaultValue={editingStudent?.class} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" placeholder="Örn: 10-A" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Numara</label>
                            <input name="number" defaultValue={editingStudent?.number} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" placeholder="Örn: 1234" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Dal</label>
                            <input name="branch" defaultValue={editingStudent?.branch} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none" placeholder="Örn: Bilişim" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Özel Gereksinim Türü</label>
                        <div className="flex flex-wrap gap-2.5">
                            {SPECIAL_NEED_TYPES.map(type => (
                                <button 
                                    key={type} type="button"
                                    onClick={() => toggleSpecialNeed(type)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                                        editingStudent?.specialNeeds?.includes(type) 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}>
                                    {type.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Notlar</label>
                        <textarea name="notes" defaultValue={editingStudent?.notes} rows={3} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none" placeholder="Öğrenci hakkında ek bilgiler..."></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-600 transition-colors">İptal</button>
                        <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2">
                            <CheckSquare size={18}/> Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
