// This file is created based on user's request to integrate their provided code.
"use client";

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Sheet, Trash2, Users, X, Copy, 
  UserPlus, Plus, Folder, Menu, FileText, Settings, 
  Save, Edit2, CheckSquare 
} from 'lucide-react';

// --- Sabitler ---
const INITIAL_PERF_CRITERIA = [
    { id: 'c1', name: 'Derse Hazırlık & Araç-Gereç', max: 20 },
    { id: 'c2', name: 'Derse Aktif Katılım', max: 30 },
    { id: 'c3', name: 'Ödev ve Sorumluluk', max: 20 },
    { id: 'c4', name: 'Davranış ve Kurallar', max: 10 },
    { id: 'c5', name: 'Uygulama / Etkinlik', max: 20 },
];

const INITIAL_PROJ_CRITERIA = [
    { id: 'p1', name: 'Araştırma ve Kaynak Kullanımı', max: 20 },
    { id: 'p2', name: 'İçerik ve Özgünlük', max: 30 },
    { id: 'p3', name: 'Planlama ve Süreç', max: 20 },
    { id: 'p4', name: 'Sunum ve Görsellik', max: 20 },
    { id: 'p5', name: 'Zamanında Teslim', max: 10 },
];

// DAVRANIŞ (KANAAT) KRİTERLERİ - Toplam 100 Puan
const INITIAL_BEHAVIOR_CRITERIA = [
    { id: 'b1', name: 'Saç-Sakal Bakımı', max: 5 },
    { id: 'b2', name: 'Makyaj', max: 5 },
    { id: 'b3', name: 'Okul Üniforması', max: 10 },
    { id: 'b4', name: 'Telefon Teslim Etmeme', max: 10 },
    { id: 'b5', name: 'Dersten Çıkma Talebi', max: 5 },
    { id: 'b6', name: 'Arkadaşlarına Zorbalık', max: 10 },
    { id: 'b7', name: 'Kötü Söz Kullanımı', max: 10 },
    { id: 'b8', name: 'Temizlik Anlayışı', max: 5 },
    { id: 'b9', name: 'Okul Malına Zarar Verme', max: 10 },
    { id: 'b10', name: 'Derste Uyuma', max: 5 },
    { id: 'b11', name: 'Derse Geç Kalmak', max: 5 },
    { id: 'b12', name: 'Dersin İşlenişine Engel Olmak', max: 10 },
    { id: 'b13', name: 'Derse Hazırlıksız Gelmek', max: 5 },
    { id: 'b14', name: 'Akademik Başarısızlık', max: 5 },
];

// İkon Haritası (Dinamik render için)
const IconMap: { [key: string]: React.FC<any> } = {
    BookOpen, Sheet, Trash2, Users, X, Copy, UserPlus, Plus, 
    Folder, Menu, FileText, Settings, Save, Edit2, CheckSquare
};

const Icon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
    const LucideIcon = IconMap[name];
    if (!LucideIcon) return null;
    return <LucideIcon size={size} className={className} />;
};

export function SınıfModulu() {
    const [classes, setClasses] = useState<any[]>([]);
    const [activeClassId, setActiveClassId] = useState<number | null>(null);
    
    // Kriterler
    const [perfCriteria, setPerfCriteria] = useState(INITIAL_PERF_CRITERIA);
    const [projCriteria, setProjCriteria] = useState(INITIAL_PROJ_CRITERIA);
    const [behaviorCriteria, setBehaviorCriteria] = useState(INITIAL_BEHAVIOR_CRITERIA);

    // Rapor Ayarları
    const [reportConfig, setReportConfig] = useState({
        schoolName: "",
        academicYear: "2024-2025",
        semester: "1",
        lessonName: "",
        teacherName: "",
        principalName: "",
        date: new Date().toLocaleDateString('tr-TR')
    });

    // UI Durumları
    // 1: Perf1, 2: Perf2, 3: Proje, 4: Davranış
    const [activeTab, setActiveTab] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    const [showClassModal, setShowClassModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showProjectSelectModal, setShowProjectSelectModal] = useState(false);
    
    const [settingsTab, setSettingsTab] = useState("general");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempClassName, setTempClassName] = useState("");
    
    // Form Girdileri
    const [newClassName, setNewClassName] = useState("");
    const [newStudentName, setNewStudentName] = useState("");
    const [bulkText, setBulkText] = useState("");
    const [notification, setNotification] = useState<{ msg: string, type: string } | null>(null);

    // --- Veri Yükleme & Migration ---
    useEffect(() => {
        try {
            const savedDB = localStorage.getItem('meb_performans_db');
            if (savedDB) {
                let parsedDB = JSON.parse(savedDB);
                // Migration: Öğrencilere yeni alanları ekle
                parsedDB = parsedDB.map((cls: any) => ({
                    ...cls,
                    students: cls.students.map((s: any) => ({
                        ...s,
                        scores1: s.scores1 || s.scores || {},
                        scores2: s.scores2 || {},
                        hasProject: s.hasProject || false,
                        projectScores: s.projectScores || {},
                        behaviorScores: s.behaviorScores || {}
                    }))
                }));
                setClasses(parsedDB);
                if (parsedDB.length > 0 && !activeClassId) setActiveClassId(parsedDB[0].id);
            }
            
            const savedConfig = localStorage.getItem('meb_performans_config');
            if (savedConfig) setReportConfig(JSON.parse(savedConfig));
            
            const savedPerfCriteria = localStorage.getItem('meb_performans_criteria');
            if (savedPerfCriteria) setPerfCriteria(JSON.parse(savedPerfCriteria));

            const savedProjCriteria = localStorage.getItem('meb_project_criteria');
            if (savedProjCriteria) setProjCriteria(JSON.parse(savedProjCriteria));

            const savedBehaviorCriteria = localStorage.getItem('meb_behavior_criteria');
            if (savedBehaviorCriteria) setBehaviorCriteria(JSON.parse(savedBehaviorCriteria));

        } catch (error) {
            console.error("Yükleme hatası:", error);
        }
    }, []);

    useEffect(() => { setIsEditingTitle(false); }, [activeClassId]);

    // --- Veri Kaydetme ---
    useEffect(() => {
        if (classes.length > 0 || localStorage.getItem('meb_performans_db')) {
            localStorage.setItem('meb_performans_db', JSON.stringify(classes));
        }
    }, [classes]);

    useEffect(() => { localStorage.setItem('meb_performans_config', JSON.stringify(reportConfig)); }, [reportConfig]);
    useEffect(() => { localStorage.setItem('meb_performans_criteria', JSON.stringify(perfCriteria)); }, [perfCriteria]);
    useEffect(() => { localStorage.setItem('meb_project_criteria', JSON.stringify(projCriteria)); }, [projCriteria]);
    useEffect(() => { localStorage.setItem('meb_behavior_criteria', JSON.stringify(behaviorCriteria)); }, [behaviorCriteria]);

    const activeClass = classes.find(c => c.id === activeClassId);

    const getCurrentCriteria = () => {
        if (activeTab === 3) return projCriteria;
        if (activeTab === 4) return behaviorCriteria;
        return perfCriteria;
    };
    const getCurrentMaxTotal = () => getCurrentCriteria().reduce((sum, c) => sum + (parseInt(c.max) || 0), 0);

    const showNotification = (msg: string, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- Kriter Yönetimi ---
    const handleAddCriterion = (type: 'perf' | 'proj' | 'behavior') => { // type: 'perf', 'proj', 'behavior'
        const newId = (type === 'perf' ? 'c' : type === 'proj' ? 'p' : 'b') + Date.now();
        const newItem = { id: newId, name: 'Yeni Kriter', max: 10 };
        if (type === 'perf') setPerfCriteria([...perfCriteria, newItem]);
        else if (type === 'proj') setProjCriteria([...projCriteria, newItem]);
        else setBehaviorCriteria([...behaviorCriteria, newItem]);
    };

    const handleRemoveCriterion = (id: string, type: 'perf' | 'proj' | 'behavior') => {
        const list = type === 'perf' ? perfCriteria : type === 'proj' ? projCriteria : behaviorCriteria;
        if(list.length <= 1) { showNotification("En az bir kriter kalmalıdır.", "error"); return; }
        if (type === 'perf') setPerfCriteria(perfCriteria.filter(c => c.id !== id));
        else if (type === 'proj') setProjCriteria(projCriteria.filter(c => c.id !== id));
        else setBehaviorCriteria(behaviorCriteria.filter(c => c.id !== id));
    };

    const handleUpdateCriterion = (id: string, field: string, value: string | number, type: 'perf' | 'proj' | 'behavior') => {
        const updateFn = type === 'perf' ? setPerfCriteria : type === 'proj' ? setProjCriteria : setBehaviorCriteria;
        const list = type === 'perf' ? perfCriteria : type === 'proj' ? projCriteria : behaviorCriteria;
        updateFn(list.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    // --- Sınıf İşlemleri ---
    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;
        const newClass = { id: Date.now(), name: newClassName.trim(), students: [] };
        setClasses([...classes, newClass]);
        setActiveClassId(newClass.id);
        setNewClassName("");
        setShowClassModal(false);
        showNotification(`"${newClass.name}" oluşturuldu.`);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleDeleteClass = (classId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if(window.confirm("Bu sınıfı ve içindeki tüm verileri silmek istediğinize emin misiniz?")) {
            const updated = classes.filter(c => c.id !== classId);
            setClasses(updated);
            if (activeClassId === classId) setActiveClassId(updated.length > 0 ? updated[0].id : null);
            showNotification("Sınıf silindi.", "error");
        }
    };

    const saveClassName = () => {
        if (!tempClassName.trim()) { setIsEditingTitle(false); return; }
        const updatedClasses = classes.map(c => c.id === activeClassId ? { ...c, name: tempClassName } : c);
        setClasses(updatedClasses);
        setIsEditingTitle(false);
        showNotification("Sınıf adı güncellendi.");
    };

    // --- Öğrenci İşlemleri ---
    const updateActiveStudents = (newStudents: any[]) => {
        setClasses(classes.map(c => c.id === activeClassId ? { ...c, students: newStudents } : c));
    };

    const getInitialScores = (type: 'perf' | 'proj' | 'behavior') => {
        const scores: { [key: string]: number } = {};
        let criteriaList;
        if (type === 'proj') criteriaList = projCriteria;
        else if (type === 'behavior') criteriaList = behaviorCriteria;
        else criteriaList = perfCriteria;
        
        criteriaList.forEach(c => scores[c.id] = c.max);
        return scores;
    };

    const addStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudentName.trim() || !activeClass) return;
        const newStudent = { 
            id: Date.now(), 
            name: newStudentName, 
            scores1: getInitialScores('perf'), 
            scores2: getInitialScores('perf'),
            hasProject: false,
            projectScores: getInitialScores('proj'),
            behaviorScores: getInitialScores('behavior')
        };
        updateActiveStudents([...activeClass.students, newStudent]);
        setNewStudentName("");
        showNotification("Öğrenci eklendi.");
    };

    const handleBulkAdd = () => {
        if (!bulkText.trim() || !activeClass) return;
        const names = bulkText.split('\n').filter(line => line.trim() !== '');
        const newStudents = names.map((name, index) => ({
            id: Date.now() + index + Math.random(), 
            name: name.trim(), 
            scores1: getInitialScores('perf'), 
            scores2: getInitialScores('perf'),
            hasProject: false,
            projectScores: getInitialScores('proj'),
            behaviorScores: getInitialScores('behavior')
        }));
        updateActiveStudents([...activeClass.students, ...newStudents]);
        setBulkText("");
        setShowBulkModal(false);
        showNotification(`${newStudents.length} öğrenci eklendi!`);
    };

    const deleteStudent = (studentId: number) => {
        updateActiveStudents(activeClass.students.filter((s: any) => s.id !== studentId));
        showNotification("Öğrenci silindi.", "error");
    };

    const toggleProjectAssignment = (studentId: number) => {
        updateActiveStudents(activeClass.students.map((s: any) => {
            if (s.id === studentId) {
                return { 
                    ...s, 
                    hasProject: !s.hasProject,
                    projectScores: (!s.hasProject && (!s.projectScores || Object.keys(s.projectScores).length === 0)) 
                        ? getInitialScores('proj') 
                        : s.projectScores
                };
            }
            return s;
        }));
    };

    // --- Puanlama İşlemleri ---
    const updateScore = (studentId: number, criteriaId: string, value: string) => {
        const currentCriteria = getCurrentCriteria();
        const criterion = currentCriteria.find(c => c.id === criteriaId);
        const limit = criterion ? criterion.max : 100;
        let numValue = parseInt(value) || 0;
        if (numValue < 0) numValue = 0;
        if (numValue > limit) numValue = limit;

        let targetKey: string;
        if (activeTab === 1) targetKey = 'scores1';
        else if (activeTab === 2) targetKey = 'scores2';
        else if (activeTab === 3) targetKey = 'projectScores';
        else targetKey = 'behaviorScores';

        updateActiveStudents(activeClass.students.map((s: any) => s.id === studentId ? { ...s, [targetKey]: { ...s[targetKey], [criteriaId]: numValue } } : s));
    };

    const distributeTotalScore = (studentId: number, totalStr: string) => {
        const maxTotal = getCurrentMaxTotal();
        let newTotal = parseInt(totalStr);
        if (isNaN(newTotal)) newTotal = 0;
        if (newTotal < 0) newTotal = 0;
        if (newTotal > maxTotal) newTotal = maxTotal;

        const currentCriteria = getCurrentCriteria();
        const ratio = newTotal / maxTotal;
        let newScores: { [key: string]: number } = {};
        let currentSum = 0;
        
        currentCriteria.forEach(c => {
            let val = Math.round(c.max * ratio);
            newScores[c.id] = val;
            currentSum += val;
        });

        let diff = newTotal - currentSum;
        const sortedIds = [...currentCriteria].sort((a, b) => b.max - a.max).map(c => c.id);
        let i = 0;
        while (diff !== 0 && i < 100) {
            const cId = sortedIds[i % sortedIds.length];
            const maxVal = currentCriteria.find(c => c.id === cId)!.max;
            if (diff > 0 && newScores[cId] < maxVal) { newScores[cId]++; diff--; }
            else if (diff < 0 && newScores[cId] > 0) { newScores[cId]--; diff++; }
            i++;
        }

        let targetKey: string;
        if (activeTab === 1) targetKey = 'scores1';
        else if (activeTab === 2) targetKey = 'scores2';
        else if (activeTab === 3) targetKey = 'projectScores';
        else targetKey = 'behaviorScores';

        updateActiveStudents(activeClass.students.map((s: any) => s.id === studentId ? { ...s, [targetKey]: newScores } : s));
    };

    const calculateTotal = (scores: { [key: string]: string | number }) => {
        if (!scores) return 0;
        const currentCriteria = getCurrentCriteria();
        return currentCriteria.reduce((sum, c) => sum + (parseInt(String(scores[c.id])) || 0), 0);
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-emerald-600 font-bold";
        if (score >= 70) return "text-blue-600 font-bold";
        if (score >= 50) return "text-yellow-600 font-bold";
        return "text-red-600 font-bold";
    };

    // --- Raporlama ---
    const handleExportWord = () => {
        if (!activeClass) return;
        
        let targetKey: string, reportTitle: string;
        if (activeTab === 3) {
            targetKey = 'projectScores';
            reportTitle = "PROJE ÖDEVİ DEĞERLENDİRME ÖLÇEĞİ";
        } else if (activeTab === 4) {
            targetKey = 'behaviorScores';
            reportTitle = "DAVRANIŞ (KANAAT) DEĞERLENDİRME ÖLÇEĞİ";
        } else {
            targetKey = activeTab === 1 ? 'scores1' : 'scores2';
            reportTitle = `${activeTab}. PERFORMANS DEĞERLENDİRME ÖLÇEĞİ`;
        }

        const visibleStudents = activeTab === 3 
            ? activeClass.students.filter((s: any) => s.hasProject) 
            : activeClass.students;

        if (visibleStudents.length === 0) {
            showNotification("Listede öğrenci yok, çıktı alınamaz.", "error");
            return;
        }

        const currentCriteria = getCurrentCriteria();
        
        const school = reportConfig.schoolName || "..........................................";
        const year = reportConfig.academicYear || "20....-20....";
        const lesson = reportConfig.lessonName || "...................";
        const term = reportConfig.semester || "1";
        const teacher = reportConfig.teacherName || "...........................";
        const principal = reportConfig.principalName || "...........................";
        const date = reportConfig.date || "..../..../20....";

        const title = `${activeClass.name} - ${activeTab === 3 ? "Proje" : activeTab === 4 ? "Davranış" : activeTab + ". Performans"}`;

        let header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${title}</title>
        <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { border: 1px solid black; padding: 4px; text-align: center; font-size: 9pt; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-left { text-align: left; padding-left: 5px; }
        .header-text { text-align: center; font-weight: bold; line-height: 1.5; margin-bottom: 20px; }
        .footer-table { border: none; margin-top: 40px; }
        .footer-table td { border: none; vertical-align: top; }
        </style>
        </head><body>
        
        <div class="header-text">
            T.C.<br/>
            ${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜ<br/>
            ${year} EĞİTİM ÖĞRETİM YILI ${lesson.toLocaleUpperCase('tr-TR')} DERSİ<br/>
            ${activeClass.name.toLocaleUpperCase('tr-TR')} SINIFI ${term}. DÖNEM ${reportTitle}
        </div>

        <table>
        <thead>
            <tr>
            <th style="width: 5%">S.No</th>
            <th class="text-left" style="width: 20%">Adı Soyadı</th>
            ${currentCriteria.map(c => `<th>${c.name}<br/><span style="font-size:8pt">(${c.max} P)</span></th>`).join('')}
            <th style="width: 8%">PUAN</th>
            </tr>
        </thead>
        <tbody>`;

        visibleStudents.forEach((s: any, index: number) => {
            const scores = s[targetKey];
            const total = calculateTotal(scores);
            header += `<tr>
                <td>${index + 1}</td>
                <td class="text-left">${s.name}</td>
                ${currentCriteria.map(c => `<td>${scores[c.id] || 0}</td>`).join('')}
                <td><strong>${total}</strong></td>
            </tr>`;
        });

        header += `</tbody></table>
        
        <table class="footer-table">
            <tr>
                <td style="width: 33%; text-align: left;">
                    <br/>
                    Uygundur<br/>
                    ${date}
                </td>
                <td style="width: 33%; text-align: center;"></td>
                <td style="width: 33%; text-align: center;">
                    <br/>
                    Tasdik Olunur
                </td>
            </tr>
            <tr>
                <td style="text-align: center;">
                    <strong>${teacher}</strong><br/>
                    Ders Öğretmeni
                </td>
                <td></td>
                <td style="text-align: center;">
                    <strong>${principal}</strong><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
        </body></html>`;

        const blob = new Blob([header], { type: 'application/vnd.ms-word' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification("Resmi formatta Word dosyası indirildi.");
    };

    const copyToClipboard = () => {
        if (!activeClass) return;
        let targetKey: string;
        if (activeTab === 3) targetKey = 'projectScores';
        else if (activeTab === 4) targetKey = 'behaviorScores';
        else targetKey = activeTab === 1 ? 'scores1' : 'scores2';

        const visibleStudents = activeTab === 3 
            ? activeClass.students.filter((s: any) => s.hasProject) 
            : activeClass.students;

        let text = "Öğrenci Adı\tNot\n";
        visibleStudents.forEach((s: any) => text += `${s.name}\t${calculateTotal(s[targetKey])}\n`);
        
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try { document.execCommand('copy'); showNotification("Panoya kopyalandı!"); } catch (e) {}
        document.body.removeChild(textArea);
        setShowCopyModal(false);
    };

    const getTabStyle = (tabId: number, color: string) => {
        const isActive = activeTab === tabId;
        const colorClasses: { [key: string]: string } = {
            blue: 'bg-blue-100 text-blue-700 ring-blue-200',
            orange: 'bg-orange-100 text-orange-700 ring-orange-200',
            violet: 'bg-violet-100 text-violet-700 ring-violet-200',
            emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
        };
        return `flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap 
            ${isActive ? colorClasses[color] : 'text-slate-500 hover:bg-slate-50'}`;
    };

    // --- Render ---
    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
            
            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-72' : 'w-0 md:w-20'} bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className={`flex items-center gap-2 overflow-hidden ${!isSidebarOpen && 'md:justify-center'}`}>
                        <div className="bg-red-600 p-2 rounded-lg text-white shrink-0"><Icon name="BookOpen" size={20} /></div>
                        <span className={`font-bold text-slate-700 whitespace-nowrap ${!isSidebarOpen && 'md:hidden'}`}>Not Defteri</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-400"><Icon name="X" size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {classes.map(cls => (
                        <button key={cls.id} onClick={() => setActiveClassId(cls.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left group relative ${activeClassId === cls.id ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'hover:bg-slate-50 text-slate-600'}`}>
                            <Icon name="Folder" size={20} className={activeClassId === cls.id ? 'fill-current text-blue-200' : 'text-slate-400'} />
                            <span className={`font-medium truncate ${!isSidebarOpen && 'md:hidden'}`}>{cls.name}</span>
                            <span className={`text-xs ml-auto opacity-60 ${!isSidebarOpen && 'md:hidden'}`}>{cls.students.length}</span>
                            <div onClick={(e) => handleDeleteClass(cls.id, e)} className={`absolute right-2 p-1.5 rounded-full hover:bg-white hover:text-red-500 hover:shadow-md transition ${activeClassId === cls.id ? 'opacity-100 bg-white/50 text-red-400' : 'opacity-0 group-hover:opacity-100'} ${!isSidebarOpen && 'hidden'}`} title="Sınıfı Sil"><Icon name="Trash2" size={14} /></div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100">
                    <button onClick={() => setShowClassModal(true)} className={`w-full bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200 ${!isSidebarOpen && 'md:p-3'}`}><Icon name="Plus" size={20} /><span className={`${!isSidebarOpen && 'md:hidden'}`}>Yeni Sınıf</span></button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-20 bg-white p-2 rounded-lg shadow-md border border-slate-100 md:hidden"><Icon name="Menu" size={20} /></button>}

                <div className="bg-white border-b border-slate-200 p-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="hidden md:block text-slate-400 hover:text-slate-600 mr-2"><Icon name="Menu" size={20} /></button>
                        {activeClass ? (
                            <div className="flex items-center gap-2">
                                {isEditingTitle ? (
                                    <input autoFocus className="text-xl font-bold text-slate-800 border-b-2 border-blue-500 outline-none bg-transparent" value={tempClassName} onChange={(e) => setTempClassName(e.target.value)} onBlur={saveClassName} onKeyDown={(e) => e.key === 'Enter' && saveClassName()} />
                                ) : (
                                    <div className="flex items-center gap-2 group cursor-pointer hover:bg-slate-50 p-1 -ml-1 rounded-lg transition" onClick={() => { if(activeClass){ setTempClassName(activeClass.name); setIsEditingTitle(true); }}} title="Sınıf adını düzenle">
                                        <h2 className="text-xl font-bold text-slate-800">{activeClass.name}</h2><Icon name="Edit2" size={16} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                )}
                            </div>
                        ) : <h2 className="text-xl font-bold text-slate-400">Sınıf Seçiniz</h2>}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        {activeClass && (
                            <>
                            <button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition border border-slate-200 text-sm"><Icon name="Settings" size={16} /> <span className="hidden sm:inline">Ayarlar</span></button>
                            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-200 whitespace-nowrap text-sm"><Icon name="UserPlus" size={16} /> Toplu Ekle</button>
                            <button onClick={handleExportWord} className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition border border-indigo-200 whitespace-nowrap text-sm"><Icon name="FileText" size={16} /> Word</button>
                            <button onClick={() => setShowCopyModal(true)} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition border border-emerald-200 whitespace-nowrap text-sm"><Icon name="Sheet" size={16} /> Excel</button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
                    {notification && <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>{notification.msg}</div>}

                    {!activeClass ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="bg-white p-8 rounded-full mb-4 shadow-sm"><Icon name="Folder" size={64} className="text-slate-200" /></div>
                            <h3 className="text-lg font-medium text-slate-600">Bir Sınıf Seçin veya Oluşturun</h3>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-4">
                                {/* Öğrenci Ekleme (Sadece Performans ve Davranış sekmelerinde) */}
                                {activeTab !== 3 ? (
                                    <form onSubmit={addStudent} className="flex gap-2 w-full md:w-auto">
                                        <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Tek öğrenci ekle..." className="w-full md:w-64 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                                        <button type="submit" className="bg-white border border-slate-200 p-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium px-4">Ekle</button>
                                    </form>
                                ) : (
                                    <div className="w-full md:w-auto">
                                        <button onClick={() => setShowProjectSelectModal(true)} className="flex items-center gap-2 bg-violet-600 text-white p-3 rounded-xl hover:bg-violet-700 font-medium px-6 shadow-lg shadow-violet-200 transition">
                                            <Icon name="UserPlus" size={20} /> Projeye Öğrenci Ekle
                                        </button>
                                    </div>
                                )}

                                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-auto overflow-x-auto gap-1">
                                    <button onClick={() => setActiveTab(1)} className={getTabStyle(1, 'blue')}>1. Performans</button>
                                    <button onClick={() => setActiveTab(2)} className={getTabStyle(2, 'orange')}>2. Performans</button>
                                    <button onClick={() => setActiveTab(3)} className={getTabStyle(3, 'violet')}>Proje Ödevi</button>
                                    <button onClick={() => setActiveTab(4)} className={getTabStyle(4, 'emerald')}>Davranış Notu</button>
                                </div>
                            </div>

                            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${activeTab === 3 ? 'border-violet-200' : activeTab === 4 ? 'border-emerald-200' : ''}`}>
                                <div className={`h-1 w-full ${activeTab === 1 ? 'bg-blue-500' : activeTab === 2 ? 'bg-orange-500' : activeTab === 3 ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
                                
                                {activeTab === 3 && activeClass.students.filter((s: any) => s.hasProject).length === 0 ? (
                                    <div className="text-center py-20 px-4">
                                        <div className="inline-block p-4 rounded-full bg-violet-50 mb-4 text-violet-300"><Icon name="Folder" size={48} /></div>
                                        <p className="text-slate-500 font-medium">Bu sınıfta henüz proje alan öğrenci yok.</p>
                                        <button onClick={() => setShowProjectSelectModal(true)} className="mt-4 text-violet-600 hover:underline">Sınıf listesinden seçmek için tıklayın</button>
                                    </div>
                                ) : activeClass.students.length === 0 ? (
                                    <div className="text-center py-20 px-4">
                                        <Icon name="Users" size={48} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-500">Sınıf boş.</p>
                                        <button onClick={() => setShowBulkModal(true)} className="mt-4 text-blue-600 hover:underline font-medium">Toplu ekle</button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                                                    <th className="p-4 font-semibold sticky left-0 bg-slate-50 z-10 w-48 min-w-[200px] shadow-sm">Ad Soyad</th>
                                                    {getCurrentCriteria().map(c => <th key={c.id} className="p-4 text-center min-w-[100px]">{c.name.split(' ')[0]} <span className="opacity-50">({c.max})</span></th>)}
                                                    <th className="p-4 text-center w-24">Toplam</th>
                                                    <th className="p-4 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {activeClass.students
                                                    .filter((s: any) => activeTab === 3 ? s.hasProject : true)
                                                    .map((student: any) => {
                                                        let scores, total;
                                                        if (activeTab === 1) scores = student.scores1;
                                                        else if (activeTab === 2) scores = student.scores2;
                                                        else if (activeTab === 3) scores = student.projectScores;
                                                        else scores = student.behaviorScores;
                                                        
                                                        total = calculateTotal(scores);
                                                        const currentCriteria = getCurrentCriteria();
                                                        const maxTotal = getCurrentMaxTotal();

                                                        return (
                                                            <tr key={student.id} className={`transition-colors group hover:bg-slate-50`}>
                                                                <td className={`p-3 font-medium text-slate-700 sticky left-0 bg-white border-r border-transparent group-hover:bg-slate-50`}>{student.name}</td>
                                                                {currentCriteria.map(c => (
                                                                    <td key={c.id} className="p-2 text-center">
                                                                        <input type="number" title={c.name} value={scores?.[c.id] ?? 0} onChange={(e) => updateScore(student.id, c.id, e.target.value)} className="w-12 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white font-mono text-slate-600" />
                                                                    </td>
                                                                ))}
                                                                <td className="p-3 text-center font-bold">
                                                                    <input type="number" min="0" max={maxTotal} className={`w-12 p-1.5 text-center bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none ${getScoreColor(total)}`} value={total} onChange={(e) => distributeTotalScore(student.id, e.target.value)} />
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {activeTab === 3 ? (
                                                                        <button onClick={() => toggleProjectAssignment(student.id)} className="text-slate-300 hover:text-red-500 transition" title="Projeyi Kaldır"><Icon name="X" size={16} /></button>
                                                                    ) : (
                                                                        <button onClick={() => deleteStudent(student.id)} className="text-slate-300 hover:text-red-500 transition" title="Öğrenciyi Sil"><Icon name="Trash2" size={16} /></button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modallar */}
            {showClassModal && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><form onSubmit={handleCreateClass} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"><h3 className="text-lg font-bold text-slate-800 mb-4">Yeni Sınıf</h3><input autoFocus type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="Örn: 9/A Tarih" className="w-full p-3 border border-slate-300 rounded-xl mb-4" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">İptal</button><button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">Oluştur</button></div></form></div>}
            {showBulkModal && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl"><h3 className="text-lg font-bold mb-4">Toplu Ekle</h3><textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Ahmet Yılmaz..." className="w-full h-48 p-4 border border-slate-300 rounded-xl mb-4"></textarea><div className="flex justify-end gap-2"><button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-slate-500">İptal</button><button onClick={handleBulkAdd} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Ekle</button></div></div></div>}
            {showCopyModal && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"><div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Icon name="Sheet" size={24} /></div><h3 className="text-lg font-bold mb-2 text-slate-800">Excel</h3><p className="mb-6">Listeyi kopyalayıp Excel'e yapıştır.</p><div className="flex gap-2 justify-center"><button onClick={() => setShowCopyModal(false)} className="px-4 py-2 text-slate-500">İptal</button><button onClick={copyToClipboard} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Kopyala</button></div></div></div>}
            
            {/* Proje Öğrencisi Seçme Modalı */}
            {showProjectSelectModal && activeClass && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Proje Öğrencilerini Seç</h3>
                            <button onClick={() => setShowProjectSelectModal(false)} className="text-slate-400 hover:text-slate-600"><Icon name="X" size={20} /></button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <p className="text-sm text-slate-500 mb-4">Aşağıdaki listeden proje ödevi verdiğiniz öğrencileri işaretleyin.</p>
                            <div className="space-y-2">
                                {activeClass.students.map((s: any) => (
                                    <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${s.hasProject ? 'bg-violet-600 border-violet-600 text-white' : 'border-slate-300 bg-white'}`}>
                                            {s.hasProject && <Icon name="CheckSquare" size={14} />}
                                        </div>
                                        <input type="checkbox" checked={s.hasProject} onChange={() => toggleProjectAssignment(s.id)} className="hidden" />
                                        <span className={s.hasProject ? 'font-medium text-slate-800' : 'text-slate-600'}>{s.name}</span>
                                    </label>
                                ))}
                                {activeClass.students.length === 0 && <p className="text-center text-slate-400 py-4">Sınıfta öğrenci yok.</p>}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                            <button onClick={() => setShowProjectSelectModal(false)} className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">Tamam</button>
                        </div>
                    </div>
                </div>
            )}

            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10 overflow-x-auto">
                            <button onClick={() => setSettingsTab("general")} className={`flex-1 p-4 font-medium transition whitespace-nowrap ${settingsTab === "general" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Genel</button>
                            <button onClick={() => setSettingsTab("perf_criteria")} className={`flex-1 p-4 font-medium transition whitespace-nowrap ${settingsTab === "perf_criteria" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Performans K.</button>
                            <button onClick={() => setSettingsTab("proj_criteria")} className={`flex-1 p-4 font-medium transition whitespace-nowrap ${settingsTab === "proj_criteria" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Proje K.</button>
                            <button onClick={() => setSettingsTab("behavior_criteria")} className={`flex-1 p-4 font-medium transition whitespace-nowrap ${settingsTab === "behavior_criteria" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-700"}`}>Davranış K.</button>
                        </div>
                        <div className="p-6">
                            {settingsTab === "general" ? (
                                <div className="space-y-4">
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">Okul Bilgileri</label><input type="text" value={reportConfig.schoolName} onChange={(e) => setReportConfig({...reportConfig, schoolName: e.target.value})} className="w-full p-2 border rounded-lg mt-1" placeholder="Okul Adı" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" value={reportConfig.academicYear} onChange={(e) => setReportConfig({...reportConfig, academicYear: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Yıl" />
                                        <select value={reportConfig.semester} onChange={(e) => setReportConfig({...reportConfig, semester: e.target.value})} className="w-full p-2 border rounded-lg"><option value="1">1. Dönem</option><option value="2">2. Dönem</option></select>
                                    </div>
                                    <input type="text" value={reportConfig.lessonName} onChange={(e) => setReportConfig({...reportConfig, lessonName: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Ders" />
                                    <div><label className="text-xs font-bold text-slate-400 uppercase">İmza Alanları</label><input type="text" value={reportConfig.teacherName} onChange={(e) => setReportConfig({...reportConfig, teacherName: e.target.value})} className="w-full p-2 border rounded-lg mt-1" placeholder="Öğretmen Adı" /></div>
                                    <input type="text" value={reportConfig.principalName} onChange={(e) => setReportConfig({...reportConfig, principalName: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Okul Müdürü" />
                                    <input type="text" value={reportConfig.date} onChange={(e) => setReportConfig({...reportConfig, date: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Tarih" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-slate-700">
                                            {settingsTab === 'perf_criteria' ? 'Performans' : settingsTab === 'proj_criteria' ? 'Proje' : 'Davranış'} Değerlendirme Kriterleri
                                        </h4>
                                    </div>
                                    {
                                    (settingsTab === 'perf_criteria' ? perfCriteria : settingsTab === 'proj_criteria' ? projCriteria : behaviorCriteria).map((c, i) => (
                                        <div key={c.id} className="flex gap-2 items-center">
                                            <span className="text-slate-400 w-6 text-sm">{i+1}.</span>
                                            <input type="text" value={c.name} onChange={(e) => handleUpdateCriterion(c.id, 'name', e.target.value, settingsTab === 'perf_criteria' ? 'perf' : settingsTab === 'proj_criteria' ? 'proj' : 'behavior')} className="flex-1 p-2 border rounded-lg text-sm" placeholder="Kriter Adı" />
                                            <input type="number" value={c.max} onChange={(e) => handleUpdateCriterion(c.id, 'max', parseInt(e.target.value) || 0, settingsTab === 'perf_criteria' ? 'perf' : settingsTab === 'proj_criteria' ? 'proj' : 'behavior')} className="w-16 p-2 border rounded-lg text-center text-sm" placeholder="Puan" />
                                            <button onClick={() => handleRemoveCriterion(c.id, settingsTab === 'perf_criteria' ? 'perf' : settingsTab === 'proj_criteria' ? 'proj' : 'behavior')} className="text-red-400 hover:text-red-600 p-2"><Icon name="Trash2" size={16} /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddCriterion(settingsTab === 'perf_criteria' ? 'perf' : settingsTab === 'proj_criteria' ? 'proj' : 'behavior')} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2 transition text-sm"><Icon name="Plus" size={16} /> Yeni Kriter Ekle</button>
                                    <div className="text-right text-sm font-bold text-slate-600">Toplam: {(settingsTab === 'perf_criteria' ? perfCriteria : settingsTab === 'proj_criteria' ? projCriteria : behaviorCriteria).reduce((s, c) => s + (parseInt(c.max)||0), 0)} Puan</div>
                                </div>
                            )}
                            <div className="mt-6 flex justify-end gap-2">
                                <button onClick={() => setShowSettingsModal(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">Kaydet</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
