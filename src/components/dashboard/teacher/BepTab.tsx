
"use client";

import React, { useState, useEffect } from 'react';
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

// RTF Çıktısı oluşturma fonksiyonu
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
  // --- STATE YÖNETİMİ ---
  
  // Navigasyon - Başlangıçta 'students' aktif
  const [activeTab, setActiveTab] = useState('students');
  
  // Veri
  const [students, setStudents] = useState<any[]>([]);
  const [teacherInfo, setTeacherInfo] = useState({
    branchTeacher: '',
    guidanceTeacher: '',
    schoolPrincipal: '',
    schoolName: ''
  });
  const [toasts, setToasts] = useState<any[]>([]);

  // Form & Seçim Stateleri
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<any>(null); // null ise yeni kayıt, doluysa düzenleme
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // BEP Modülü Stateleri
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [bepDates, setBepDates] = useState({ start: '', end: '' });
  const [selectedKazanims, setSelectedKazanims] = useState(new Set());
  const [selectedPerformance, setSelectedPerformance] = useState<any>({});
  const [selectedKaba, setSelectedKaba] = useState<any>({});

  // --- INITIALIZATION (Client-Side) ---
  useEffect(() => {
    // LocalStorage'dan verileri çek
    const savedStudents = localStorage.getItem('students');
    const savedTeacher = localStorage.getItem('teacherInfo');
    
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      // Demo veri
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

    // Varsayılan tarih
    const today = new Date();
    const future = new Date();
    future.setMonth(today.getMonth() + 6);
    setBepDates({
      start: today.toISOString().split('T')[0],
      end: future.toISOString().split('T')[0]
    });
  }, []);

  // --- ACTIONS ---

  const addToast = (msg: any, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleSaveTeacher = () => {
    localStorage.setItem('teacherInfo', JSON.stringify(teacherInfo));
    addToast('Öğretmen bilgileri kaydedildi', 'success');
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
      addToast('Öğrenci güncellendi', 'success');
    } else {
      updatedStudents = [...students, newStudent];
      addToast('Öğrenci eklendi', 'success');
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
      addToast('Öğrenci silindi', 'warning');
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

  // --- BEP MANTIĞI ---

  const getFilteredKazanims = () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return [];
    
    const gradeMatch = student.class.match(/(\d+)/);
    const grade = gradeMatch ? parseInt(gradeMatch[0]) : 9;
    return PHYSICS_OUTCOMES.filter(k => k.grade === grade);
  };
  
  // Kaba değerlendirme maddelerini de öğrencinin sınıfına göre filtrele
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

  // --- EXPORT MANTIĞI (React-ified) ---
  
  const generateRTF = (type: any) => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return addToast('Öğrenci seçilmedi', 'error');

    let content = '';

    if (type === 'bep') {
        const kazanims = PHYSICS_OUTCOMES.filter(k => selectedKazanims.has(k.id));
        if (kazanims.length === 0) return addToast('Kazanım seçilmedi', 'error');

        // Tablo satırlarını oluştur
        let rows = '';
        let currentDate = new Date(bepDates.start);
        const endD = new Date(bepDates.end);
        const diffTime = Math.abs(endD.getTime() - currentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const interval = Math.max(1, Math.floor(diffDays / kazanims.length));

        kazanims.forEach((k) => {
            const dateStr = currentDate.toLocaleDateString('tr-TR');
            rows += `
                <tr>
                    <td style="border:1px solid #000;padding:5px">${k.unit}</td>
                    <td style="border:1px solid #000;padding:5px">${k.text}</td>
                    <td style="border:1px solid #000;padding:5px">Soru-Cevap</td>
                    <td style="border:1px solid #000;padding:5px">Akıllı Tahta</td>
                    <td style="border:1px solid #000;padding:5px">${dateStr}</td>
                </tr>
            `;
            currentDate.setDate(currentDate.getDate() + interval);
        });

        content = `
            <h2 style="text-align:center">BİREYSELLEŞTİRİLMİŞ EĞİTİM PLANI</h2>
            <p><strong>Öğrenci:</strong> ${student.name}</p>
            <p><strong>Sınıf:</strong> ${student.class}</p>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee">
                    <th style="border:1px solid #000;padding:5px">Ünite</th>
                    <th style="border:1px solid #000;padding:5px">Kazanım</th>
                    <th style="border:1px solid #000;padding:5px">Yöntem</th>
                    <th style="border:1px solid #000;padding:5px">Materyal</th>
                    <th style="border:1px solid #000;padding:5px">Tarih</th>
                </tr>
                ${rows}
            </table>
            <br><br>
            <p><strong>Öğretmen:</strong> ${teacherInfo.branchTeacher}</p>
        `;
    } 
    else if (type === 'performance') {
        let rows = '';
        PERFORMANCE_ITEMS.forEach(item => {
            const data = selectedPerformance[item.id] || { score: '', observation: '' };
            rows += `
                <tr>
                    <td style="border:1px solid #000;padding:5px">${item.skill}</td>
                    <td style="border:1px solid #000;padding:5px;text-align:center">${data.score}</td>
                    <td style="border:1px solid #000;padding:5px">${data.observation}</td>
                </tr>
            `;
        });
        content = `
             <h2 style="text-align:center">EĞİTSEL PERFORMANS FORMU</h2>
             <p><strong>Öğrenci:</strong> ${student.name}</p>
             <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee">
                    <th style="border:1px solid #000;padding:5px">Beceri</th>
                    <th style="border:1px solid #000;padding:5px">Puan (1-4)</th>
                    <th style="border:1px solid #000;padding:5px">Gözlem</th>
                </tr>
                ${rows}
             </table>
        `;
    }
    else if (type === 'kaba') {
        const gradeMatch = student.class.match(/(\d+)/);
        const grade = gradeMatch ? parseInt(gradeMatch[0]) : 9;
        const items = KABA_ITEMS.filter(i => i.grade === grade);

        let rows = '';
        items.forEach((item) => {
            const key = `${item.unit}-${item.skill}`;
            const selection = selectedKaba[key];
            const evalText = selection?.evaluation ? selection.evaluation.toUpperCase() : '-';
            const note = selection?.text || '';
            
            rows += `
                <tr>
                    <td style="border:1px solid #000;padding:5px">${item.unit}</td>
                    <td style="border:1px solid #000;padding:5px">${item.skill}</td>
                    <td style="border:1px solid #000;padding:5px;text-align:center">${evalText}</td>
                    <td style="border:1px solid #000;padding:5px">${note}</td>
                </tr>
            `;
        });

        content = `
             <h2 style="text-align:center">KABA DEĞERLENDİRME FORMU</h2>
             <p><strong>Öğrenci:</strong> ${student.name}</p>
             <p><strong>Sınıf:</strong> ${student.class}</p>
             <table style="width:100%;border-collapse:collapse;margin-top:20px">
                <tr style="background:#eee">
                    <th style="border:1px solid #000;padding:5px">Ünite</th>
                    <th style="border:1px solid #000;padding:5px">Kazanım</th>
                    <th style="border:1px solid #000;padding:5px">Değerlendirme</th>
                    <th style="border:1px solid #000;padding:5px">Gözlem/Sonuç</th>
                </tr>
                ${rows}
             </table>
        `;
    }

    downloadAsRTF(content, `${type}_raporu_${student.name}`);
    addToast('Rapor indirildi', 'success');
  };


  // --- UI RENDERERS ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Toast */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {toasts.map((t: any) => (
          <div key={t.id} className={`bg-white p-4 rounded shadow-lg border-l-4 ${t.type === 'success' ? 'border-green-500' : t.type === 'error' ? 'border-red-500' : 'border-blue-500'} flex items-center gap-3 animate-slideIn`}>
            {t.type === 'success' ? <CheckSquare size={20} className="text-green-500"/> : <Square size={20} className="text-blue-500"/>}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm p-4 mb-6 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
                <School className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">BEP Modülü</h1>
                    <p className="text-xs text-gray-500">MEB Uyumlu Rehberlik Sistemi</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('students')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <Users size={18} /> Öğrenci Yönetimi
                </button>
                <button 
                    onClick={() => setActiveTab('bep')} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'bep' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    <FileText size={18} /> BEP Hazırla
                </button>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-10">
        
        {/* STUDENTS MODULE & TEACHER INFO (Combined view for simpler UX) */}
        {activeTab === 'students' && (
            <div className="space-y-6">
                
                {/* Öğretmen Bilgileri Kartı (Öğrenci sekmesinde üstte görünsün istedim) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700"><School size={20}/> Öğretmen & Okul Bilgileri</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Branş Öğretmeni</label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm" 
                                value={teacherInfo.branchTeacher} 
                                onChange={e => setTeacherInfo({...teacherInfo, branchTeacher: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Rehber Öğretmen</label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm" 
                                value={teacherInfo.guidanceTeacher} 
                                onChange={e => setTeacherInfo({...teacherInfo, guidanceTeacher: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Okul Müdürü</label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm" 
                                value={teacherInfo.schoolPrincipal} 
                                onChange={e => setTeacherInfo({...teacherInfo, schoolPrincipal: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Okul Adı</label>
                            <input type="text" className="w-full p-2 border rounded-md text-sm" 
                                value={teacherInfo.schoolName} 
                                onChange={e => setTeacherInfo({...teacherInfo, schoolName: e.target.value})} 
                            />
                        </div>
                    </div>
                    <div className="mt-4 text-right">
                        <button onClick={handleSaveTeacher} className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 inline-flex items-center gap-1">
                            <Save size={14} /> Kaydet
                        </button>
                    </div>
                </div>

                {/* Öğrenci Listesi */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Users /> Öğrenci Listesi</h2>
                        <button 
                            onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
                            <Plus size={18} /> Yeni Öğrenci
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Öğrenci adı, sınıf veya numara ile ara..." 
                            className="w-full p-3 pl-10 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        {students.filter(s => 
                            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.class.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map(student => (
                            <div key={student.id} className="p-4 border rounded-lg flex justify-between items-start hover:bg-gray-50 transition-colors">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                                    <div className="text-sm text-gray-600 mt-1 flex gap-3">
                                        <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-medium">{student.class}</span>
                                        <span>No: {student.number}</span>
                                        <span>Dal: {student.branch}</span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {student.specialNeeds && student.specialNeeds.map((need: any) => (
                                            <span key={need} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200">
                                                {need.replace('-', ' ').toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingStudent(student); setIsModalOpen(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteStudent(student.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {students.length === 0 && <div className="text-center text-gray-400 py-10">Kayıtlı öğrenci bulunamadı.</div>}
                    </div>
                </div>
            </div>
        )}

        {/* BEP MODULE */}
        {activeTab === 'bep' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText /> BEP Hazırlama</h2>
                    
                    {/* Öğrenci Seçimi */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Öğrenci Seçin</label>
                        <select 
                            className="w-full p-3 border rounded-lg bg-gray-50 text-lg"
                            value={selectedStudentId}
                            onChange={(e) => {
                                setSelectedStudentId(e.target.value);
                                setSelectedKazanims(new Set()); // Öğrenci değişince seçimleri sıfırla
                            }}
                        >
                            <option value="">-- Lütfen bir öğrenci seçin --</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                            ))}
                        </select>
                    </div>

                    {selectedStudentId && (
                        <div className="animate-fadeIn">
                            {/* Tarih Seçimi */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-1">Başlangıç Tarihi</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-blue-400" size={18} />
                                        <input type="date" className="w-full p-2 pl-10 border border-blue-200 rounded-md" 
                                            value={bepDates.start} onChange={e => setBepDates({...bepDates, start: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-900 mb-1">Bitiş Tarihi</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-blue-400" size={18} />
                                        <input type="date" className="w-full p-2 pl-10 border border-blue-200 rounded-md" 
                                            value={bepDates.end} onChange={e => setBepDates({...bepDates, end: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* Kazanım Seçimi */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-700">Kazanım Listesi ({selectedKazanims.size} seçili)</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
                                    {getFilteredKazanims().length > 0 ? getFilteredKazanims().map(k => (
                                        <div 
                                            key={k.id} 
                                            onClick={() => toggleKazanim(k.id)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedKazanims.has(k.id) ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white hover:border-blue-300'}`}
                                        >
                                            <div className="flex justify-between">
                                                <span className="font-mono text-xs font-bold text-gray-500">{k.id}</span>
                                                {selectedKazanims.has(k.id) && <CheckSquare className="text-green-600" size={18}/>}
                                            </div>
                                            <p className="text-sm mt-1">{k.text}</p>
                                        </div>
                                    )) : (
                                        <p className="text-gray-400 text-center italic p-4">Bu sınıf düzeyi için tanımlı kazanım bulunamadı.</p>
                                    )}
                                </div>
                            </div>

                            {/* Performans Değerlendirme */}
                            <div className="mb-8 border-t pt-6">
                                <h3 className="font-bold text-gray-700 mb-4">Eğitsel Performans Değerlendirme</h3>
                                <div className="space-y-4">
                                    {PERFORMANCE_ITEMS.map(item => (
                                        <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                                            <p className="text-sm font-medium mb-2">{item.skill}</p>
                                            <div className="flex flex-wrap gap-4 items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Puan:</span>
                                                    <input 
                                                        type="number" min="1" max="4" 
                                                        className="w-16 p-1 border rounded text-center"
                                                        value={selectedPerformance[item.id]?.score || ''}
                                                        onChange={e => setSelectedPerformance({
                                                            ...selectedPerformance,
                                                            [item.id]: { ...selectedPerformance[item.id], score: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                     <input 
                                                        type="text" 
                                                        placeholder="Gözlem notu..."
                                                        className="w-full p-1 border rounded text-sm"
                                                        value={selectedPerformance[item.id]?.observation || ''}
                                                        onChange={e => setSelectedPerformance({
                                                            ...selectedPerformance,
                                                            [item.id]: { ...selectedPerformance[item.id], observation: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Kaba Değerlendirme */}
                            <div className="mb-8 border-t pt-6">
                                <h3 className="font-bold text-gray-700 mb-4">Kaba Değerlendirme Formu</h3>
                                <div className="space-y-4">
                                    {getFilteredKabaItems().length > 0 ? getFilteredKabaItems().map((item, idx) => {
                                        const key = `${item.unit}-${item.skill}`;
                                        return (
                                            <div key={idx} className="p-4 border rounded-lg bg-white">
                                                <p className="text-sm font-bold text-gray-800 mb-2">{item.unit}: <span className="font-normal">{item.skill}</span></p>
                                                <div className="flex flex-wrap gap-4">
                                                    {['yapar', 'yapamaz', 'kısmen'].map(opt => (
                                                        <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                                            <input 
                                                                type="radio" 
                                                                name={`kaba_${idx}`}
                                                                checked={selectedKaba[key]?.evaluation === opt}
                                                                onChange={() => handleKabaEvaluation(key, opt, item.skill)}
                                                            />
                                                            <span className="text-sm capitalize">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="mt-2">
                                                    <textarea 
                                                        rows="2" 
                                                        placeholder="Otomatik oluşturulan gözlem notu (düzenlenebilir)"
                                                        className="w-full p-2 border rounded-md text-sm bg-gray-50 focus:bg-white transition-colors"
                                                        value={selectedKaba[key]?.text || ''}
                                                        onChange={(e) => handleKabaTextChange(key, e.target.value)}
                                                    ></textarea>
                                                </div>
                                            </div>
                                        )
                                    }) : (
                                        <p className="text-gray-400 text-center italic p-4">Bu sınıf düzeyi için tanımlı kaba değerlendirme maddesi bulunamadı.</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 justify-center mt-8 sticky bottom-4 bg-white p-4 shadow-lg rounded-full border border-gray-200">
                                <button 
                                    onClick={() => generateRTF('bep')}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 shadow-md flex items-center gap-2 font-bold">
                                    <Download size={20} /> BEP İndir (RTF)
                                </button>
                                <button 
                                    onClick={() => generateRTF('performance')}
                                    className="bg-teal-600 text-white px-6 py-3 rounded-full hover:bg-teal-700 shadow-md flex items-center gap-2 font-bold">
                                    <Download size={20} /> Perf. İndir (RTF)
                                </button>
                                <button 
                                    onClick={() => generateRTF('kaba')}
                                    className="bg-orange-600 text-white px-6 py-3 rounded-full hover:bg-orange-700 shadow-md flex items-center gap-2 font-bold">
                                    <Download size={20} /> Kaba Değ. İndir (RTF)
                                </button>
                            </div>

                        </div>
                    )}

                    {!selectedStudentId && (
                        <div className="text-center py-20 text-gray-400">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>İşlem yapmak için yukarıdan bir öğrenci seçiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* MODAL: Öğrenci Ekle/Düzenle */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="text-xl font-bold">{editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X /></button>
                </div>
                <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ad Soyad</label>
                            <input name="name" required defaultValue={editingStudent?.name} className="w-full p-2 border rounded" placeholder="Öğrenci Adı" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf</label>
                            <input name="class" required defaultValue={editingStudent?.class} className="w-full p-2 border rounded" placeholder="Örn: 10-A" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Numara</label>
                            <input name="number" defaultValue={editingStudent?.number} className="w-full p-2 border rounded" placeholder="Okul No" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Dal</label>
                            <input name="branch" defaultValue={editingStudent?.branch} className="w-full p-2 border rounded" placeholder="Bilişim, Muhasebe vb." />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Özel Gereksinim Türü</label>
                        <div className="flex flex-wrap gap-2">
                            {SPECIAL_NEED_TYPES.map(type => (
                                <button 
                                    key={type} type="button"
                                    onClick={() => toggleSpecialNeed(type)}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                        editingStudent?.specialNeeds?.includes(type) 
                                        ? 'bg-blue-500 text-white border-blue-600' 
                                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                    }`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Notlar</label>
                        <textarea name="notes" defaultValue={editingStudent?.notes} rows="3" className="w-full p-2 border rounded" placeholder="Öğrenci hakkında notlar..."></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50">İptal</button>
                        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-bold">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
