'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Home, FileDown, Calendar, CheckSquare, Bus, Users, ClipboardList, BarChart, Scale, Banknote, Handshake, CheckCircle, X, Save, Wand2, Trash2, ArrowDownCircle, Plus } from 'lucide-react';
import { Student, Class, TeacherProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


// --- MOCK DATA & UTILS ---
const MEB_CLUBS = [
  "Kültür ve Edebiyat Kulübü", "Kütüphanecilik Kulübü", "Sivil Savunma Kulübü",
  "Gezi, Tanıtma ve Turizm Kulübü", "Spor Kulübü", "Müzik Kulübü",
  "Görsel Sanatlar Kulübü", "Bilişim ve İnternet Kulübü", "Bilim-Fen ve Teknoloji Kulübü",
  "Satranç Kulübü", "Tiyatro Kulübü", "Yeşilay Kulübü", "Sağlık, Temizlik ve Beslenme Kulübü",
  "Meslek Tanıtma Kulübü", "Sosyal Dayanışma ve Yardımlaşma Kulübü"
];

const MONTHS = ["EYLÜL", "EKİM", "KASIM", "ARALIK", "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN"];

// Örnek Yıllık Plan Taslakları
const SAMPLE_PLANS = {
    "default": [
        "Kulüp tüzüğünün hazırlanması, genel kurulun toplanması.",
        "Cumhuriyet Bayramı panosu hazırlanması.",
        "Atatürk Haftası etkinlikleri ve 10 Kasım anma programı.",
        "İnsan Hakları Haftası bilgilendirme çalışmaları.",
        "Yarıyıl tatili öncesi kulüp dosyasının düzenlenmesi.",
        "Sivil Savunma Günü kutlamaları için hazırlık.",
        "Çanakkale Zaferi ve Şehitleri Anma Günü etkinlikleri.",
        "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı panosu.",
        "19 Mayıs Gençlik ve Spor Bayramı etkinliklerine katılım.",
        "Yıl sonu faaliyet raporunun hazırlanması ve kulüp dosyasının teslimi."
    ]
};


// --- MAIN APPLICATION COMPONENT ---
export default function MebClubTab({ classes, allStudents, teacherProfile }: { classes: Class[], allStudents: Student[], teacherProfile: TeacherProfile | null }) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Ana Bilgiler
    const [schoolName, setSchoolName] = useState(teacherProfile?.schoolName || '');
    const [academicYear, setAcademicYear] = useState('2025-2026');
    const [teacherName, setTeacherName] = useState(teacherProfile?.name || '');
    const [clubSelection, setClubSelection] = useState(''); 
    const [manualClubName, setManualClubName] = useState(''); 

    // Veri Havuzları (Otomatik Aktarım İçin)
    const [annualPlan, setAnnualPlan] = useState(Array(10).fill("")); 
    
    // YENİ: Öğrenci Havuzu (Ad, No, Sınıf)
    const [students, setStudents] = useState<any[]>(Array(20).fill({ no: "", name: "", class: "", role: "" }));
    
    // YENİ: Bütçe Hesaplama
    const [budgetItems, setBudgetItems] = useState(Array(8).fill({ date: "", desc: "", docNo: "", income: "", expense: "" }));

    // Diğer listeler için geçici state (örn: Etkinlik Listesi)
    const [participationList, setParticipationList] = useState<any[]>(Array(15).fill({ name: "", classNo: "" }));
    
    const [classToImport, setClassToImport] = useState<string>('');


    // --- LOAD & SAVE ---
    useEffect(() => {
        const savedData = localStorage.getItem('clubApp_v2_3_settings');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setSchoolName(parsed.schoolName || teacherProfile?.schoolName || '');
            setAcademicYear(parsed.academicYear || '2025-2026');
            setTeacherName(parsed.teacherName || teacherProfile?.name || '');
            setClubSelection(parsed.clubSelection || '');
            setManualClubName(parsed.manualClubName || '');
            if(parsed.annualPlan) setAnnualPlan(parsed.annualPlan);
            if(parsed.students) setStudents(parsed.students);
            if(parsed.budgetItems) setBudgetItems(parsed.budgetItems);
        } else {
             setSchoolName(teacherProfile?.schoolName || '');
             setTeacherName(teacherProfile?.name || '');
        }
        setIsLoaded(true);
    }, [teacherProfile]);

    useEffect(() => {
        if (isLoaded) {
            const dataToSave = { schoolName, academicYear, teacherName, clubSelection, manualClubName, annualPlan, students, budgetItems };
            localStorage.setItem('clubApp_v2_3_settings', JSON.stringify(dataToSave));
        }
    }, [schoolName, academicYear, teacherName, clubSelection, manualClubName, annualPlan, students, budgetItems, isLoaded]);

    const activeClubName = useMemo(() => {
        if (clubSelection === "Diğer") return manualClubName;
        return clubSelection;
    }, [clubSelection, manualClubName]);

    // --- HELPER FUNCTIONS ---

    const fillAnnualPlan = () => {
        setAnnualPlan([...SAMPLE_PLANS.default]);
    };

    const handleAnnualPlanChange = (index: number, value: string) => {
        const newPlan = [...annualPlan];
        newPlan[index] = value;
        setAnnualPlan(newPlan);
    };

    const handleStudentChange = (index: number, field: string, value: string) => {
        const newStudents = [...students];
        newStudents[index] = { ...newStudents[index], [field]: value };
        setStudents(newStudents);
    };

    const importStudentsFromClass = () => {
        if (!classToImport) {
            alert("Lütfen öğrenci aktarılacak bir sınıf seçin.");
            return;
        }
        const studentsFromSelectedClass = allStudents.filter(s => s.classId === classToImport);
        if (studentsFromSelectedClass.length === 0) {
            alert("Seçilen sınıfta öğrenci bulunmuyor.");
            return;
        }
        const newClubStudents = studentsFromSelectedClass.map(s => ({
            no: s.number,
            name: s.name,
            class: classes.find(c => c.id === s.classId)?.name || '',
            role: ''
        }));
        
        // Mevcut listeyi boşaltıp yenisini ekleyelim, ya da üzerine yazalım? Şimdilik üzerine yazalım.
        const updatedList = [...newClubStudents, ...Array(Math.max(0, 20 - newClubStudents.length)).fill({ no: "", name: "", class: "", role: "" })];
        setStudents(updatedList.slice(0, 20));

        alert(`${newClubStudents.length} öğrenci kulüp listesine başarıyla aktarıldı.`);
        setClassToImport('');
    };


    // Kulüp listesinden diğer listelere aktarım
    const importStudentsToParticipation = () => {
        const activeStudents = students.filter(s => s.name && s.name.trim() !== "");
        if (activeStudents.length === 0) {
            alert("Önce 'Kulüp Öğrenci Listesi'ne öğrenci eklemelisiniz.");
            return;
        }
        
        const newList = [...participationList];
        activeStudents.forEach((student, index) => {
            if (index < newList.length) {
                newList[index] = { name: student.name, classNo: `${student.class} / ${student.no}` };
            }
        });
        setParticipationList(newList);
        alert(`${activeStudents.length} öğrenci aktarıldı.`);
    };

    const handleBudgetChange = (index: number, field: string, value: string) => {
        const newBudget = [...budgetItems];
        newBudget[index] = { ...newBudget[index], [field]: value };
        setBudgetItems(newBudget);
    };

    const calculateBudget = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        budgetItems.forEach(item => {
            totalIncome += parseFloat(item.income) || 0;
            totalExpense += parseFloat(item.expense) || 0;
        });
        return { income: totalIncome.toFixed(2), expense: totalExpense.toFixed(2) };
    }, [budgetItems]);

    const clearStorage = () => {
        if(confirm('Tüm kayıtlı okul, kulüp ve öğrenci bilgileri silinecek. Emin misiniz?')) {
            localStorage.removeItem('clubApp_v2_3_settings');
            window.location.reload();
        }
    };

    // --- RTF/WORD EXPORT FONKSİYONU ---
    const downloadRTF = (modalId: string, title: string) => {
        let content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${title}</title>
                <style>
                    body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                    h1 { font-size: 16pt; text-align: center; font-weight: bold; }
                    h2 { font-size: 14pt; text-align: center; font-weight: bold; margin-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    td, th { border: 1px solid black; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .info-box { border: 1px solid #ccc; padding: 10px; margin-bottom: 20px; background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h1>${schoolName || 'Okul Adı Girilmemiş'}</h1>
                <h2>${activeClubName || 'Kulüp Seçilmemiş'} - ${title}</h2>
                <p style="text-align: center;"><strong>Eğitim Yılı:</strong> ${academicYear} | <strong>Danışman:</strong> ${teacherName}</p>
        `;

        if (modalId === 'modal1') {
            content += `
                <table>
                    <thead><tr><th style="width: 50px;">Sıra</th><th>Öğrenci No</th><th>Sınıfı</th><th>Adı Soyadı</th><th>Görevi</th></tr></thead>
                    <tbody>
            `;
            // State'ten okuma
            students.forEach((s, i) => {
                // Eğer boşsa boş satır bas, doluysa doldur
                if (i < 20) { 
                    content += `<tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td>${s.no || ''}</td>
                        <td>${s.class || ''}</td>
                        <td>${s.name || ''}</td>
                        <td>${s.role || (i === 0 ? 'Başkan' : (i === 1 ? 'Bşk Yrd.' : ''))}</td>
                    </tr>`;
                }
            });
            content += `</tbody></table>`;
        } else if (modalId === 'modal2') {
             content += `
                <table>
                    <thead><tr><th style="width: 100px;">Ay</th><th style="width: 60px;">Hafta</th><th>Amaç ve Yapılacak Etkinlikler</th><th>İlgili Kulüp / Toplum Hizmeti</th></tr></thead>
                    <tbody>
            `;
            MONTHS.forEach((month, index) => {
                const planText = annualPlan[index] || ""; 
                content += `<tr><td><strong>${month}</strong></td><td></td><td style="height: 60px;">${planText}</td><td></td></tr>`;
            });
            content += `</tbody></table>`;
        } else if (modalId === 'modal3') {
            content += `
                <h3>Etkinlik Adı: _________________________  | Tarih: ___/___/20__</h3>
                <table>
                    <thead><tr><th>Sıra</th><th>Adı Soyadı</th><th>Sınıfı/No</th><th>İmza</th></tr></thead>
                    <tbody>
            `;
            participationList.forEach((s, i) => {
                 content += `<tr><td>${i + 1}</td><td>${s.name || ''}</td><td>${s.classNo || ''}</td><td></td></tr>`;
            });
            content += `</tbody></table>`;
        } else if (modalId === 'modal10') {
             content += `
                <table>
                    <thead><tr><th>Tarih</th><th>Açıklama</th><th>Belge No</th><th>Gelir (TL)</th><th>Gider (TL)</th></tr></thead>
                    <tbody>
            `;
            budgetItems.forEach(item => {
                 content += `<tr><td>${item.date}</td><td>${item.desc}</td><td>${item.docNo}</td><td>${item.income}</td><td>${item.expense}</td></tr>`;
            });
            content += `
                    <tr><td colspan="3" style="text-align: right;"><strong>TOPLAM:</strong></td><td>${calculateBudget.income}</td><td>${calculateBudget.expense}</td></tr>
                    <tr><td colspan="3" style="text-align: right;"><strong>BAKİYE (KASA):</strong></td><td colspan="2">${(parseFloat(calculateBudget.income) - parseFloat(calculateBudget.expense)).toFixed(2)} TL</td></tr>
             </tbody></table>`;
        }
        else if (modalId === 'modal4') {
             content += `
                <div class="info-box">
                    <h3>Gezi Temel Bilgileri</h3>
                    <p><strong>Gezi Yeri:</strong> __________________________________________</p>
                    <p><strong>Çıkış:</strong> _____/_____/20___  __:__ | <strong>Dönüş:</strong> _____/_____/20___  __:__</p>
                </div>
                <table style="margin-bottom: 20px;">
                    <tr><td style="width: 50%;"><strong>Kafile Başkanı:</strong><br><br></td><td style="width: 50%;"><strong>Araç Plakası:</strong><br><br></td></tr>
                    <tr><td colspan="2"><strong>Sorumlu Öğretmenler:</strong><br>${teacherName}<br><br></td></tr>
                </table>
             `;
        }
        else {
             content += `<p>Bu belge için standart şablon kullanılmıştır. Lütfen Word üzerinde düzenlemeye devam ediniz.</p>`;
        }

        content += `
            <br><br>
            <table style="border: none; margin-top: 30px;">
                <tr style="border: none;">
                    <td style="border: none; text-align: center; width: 50%;">
                        <br><strong>${teacherName}</strong><br>Danışman Öğretmen
                    </td>
                    <td style="border: none; text-align: center; width: 50%;">
                        <br><strong>${teacherProfile?.principalName || 'Okul Müdürü'}</strong><br>Uygundur<br>..../..../20....<br>İmza / Mühür
                    </td>
                </tr>
            </table>
            </body></html>
        `;

        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeClubName || 'Kulup'}_${title.replace(/\s+/g, '_')}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const modules = [
        { id: "modal1", title: "Kulüp Öğrenci Listesi", icon: <FileText className="h-8 w-8 text-blue-500" /> },
        { id: "modal2", title: "Yıllık Çalışma Planı (Ek 7a)", icon: <Calendar className="h-8 w-8 text-green-500" />, hasTemplate: true },
        { id: "modal3", title: "Etkinlik Katılım Formu", icon: <CheckSquare className="h-8 w-8 text-purple-500" />, canImport: true },
        { id: "modal4", title: "Gezi Planı (Ek-13)", icon: <Bus className="h-8 w-8 text-yellow-500" /> },
        { id: "modal5", title: "Veli İzin Belgesi", icon: <Users className="h-8 w-8 text-orange-500" /> },
        { id: "modal6", title: "Gezi Katılımcı Listesi", icon: <ClipboardList className="h-8 w-8 text-teal-500" /> },
        { id: "modal7", title: "Gezi Sonuç Raporu", icon: <BarChart className="h-8 w-8 text-indigo-500" /> },
        { id: "modal8", title: "Kulüp Yıl Sonu Raporu", icon: <BarChart className="h-8 w-8 text-red-500" /> },
        { id: "modal9", title: "Kulüp Yönergesi / Tutanak", icon: <Scale className="h-8 w-8 text-gray-500" /> },
        { id: "modal10", title: "Gelir - Gider Cetveli", icon: <Banknote className="h-8 w-8 text-emerald-600" />, isNew: true },
        { id: "modal11", title: "Toplum Hizmeti Onay", icon: <Handshake className="h-8 w-8 text-pink-500" />, isNew: true },
        { id: "modal12", title: "e-Okul Etkinlik Listesi", icon: <CheckCircle className="h-8 w-8 text-cyan-500" />, isNew: true },
    ];

    if (!isLoaded) return <div className="p-10 text-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Home className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Kulüp ve Gezi Yönetim Sistemi</h1>
                        <p className="text-sm text-gray-500">Okul Yönetim Modülü v2.3 (Akıllı Veri Aktarımı)</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                     <Button variant="ghost" onClick={clearStorage} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2"/> Verileri Temizle
                     </Button>
                     <Button variant="outline" className="gap-2">
                        <Save className="h-4 w-4 text-green-600"/>
                        <span className="text-green-600">Otomatik Kaydediliyor</span>
                     </Button>
                 </div>
            </header>

            <Card className="mb-8 border-l-4 border-l-blue-500 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-blue-700">
                        Ana Yönetim Paneli
                    </CardTitle>
                    <CardDescription>
                        Burada girdiğiniz veriler tarayıcınıza otomatik kaydedilir ve tüm formlara yansır.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-600">🏫 Okul Adı</Label>
                            <Input 
                                value={schoolName} 
                                onChange={(e: any) => setSchoolName(e.target.value)} 
                                className="bg-gray-50 focus:bg-white"
                                placeholder="Örn: Atatürk Anadolu Lisesi"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-600">📅 Eğitim Yılı</Label>
                            <Input 
                                value={academicYear} 
                                onChange={(e: any) => setAcademicYear(e.target.value)}
                                className="bg-gray-50 focus:bg-white" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-600">👨‍🏫 Danışman Öğretmen</Label>
                            <Input 
                                value={teacherName} 
                                onChange={(e: any) => setTeacherName(e.target.value)}
                                className="bg-gray-50 focus:bg-white" 
                            />
                        </div>
                         <div className="space-y-2">
                            <Label className="text-gray-600">♣️ Aktif Kulüp Seçimi</Label>
                            <Select value={clubSelection} onValueChange={setClubSelection}>
                                <SelectTrigger className="bg-gray-50 focus:bg-white">
                                    <SelectValue placeholder="Kulüp Seçiniz..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {MEB_CLUBS.map(club => (
                                        <SelectItem key={club} value={club}>{club}</SelectItem>
                                    ))}
                                    <SelectItem value="Diğer">Diğer (Elle Giriniz)</SelectItem>
                                </SelectContent>
                            </Select>
                            {clubSelection === 'Diğer' && (
                                <Input
                                    className="mt-2 bg-yellow-50 border-yellow-200"
                                    placeholder="Kulüp adını buraya yazın..."
                                    value={manualClubName}
                                    onChange={(e: any) => setManualClubName(e.target.value)}
                                />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {modules.map(mod => (
                    <Dialog key={mod.id}>
                        <DialogTrigger asChild>
                            <button className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl hover:border-blue-300 h-full flex flex-col text-center items-center justify-center gap-4 group">
                                <div className="p-4 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors">
                                    {mod.icon}
                                </div>
                                <h3 className="text-md font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">{mod.title}</h3>
                                {mod.isNew && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">YENİ</span>}
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl text-blue-800 border-b pb-4 mb-4 flex justify-between items-center pr-8">
                                    <span>{mod.title}</span>
                                    <div className="flex gap-2">
                                        {mod.id === 'modal1' && (
                                            <div className="flex gap-2">
                                                <Select value={classToImport} onValueChange={setClassToImport}>
                                                    <SelectTrigger className="w-[220px] h-9 text-sm">
                                                        <SelectValue placeholder="Sınıf Seçerek Öğrenci Aktar..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button onClick={importStudentsFromClass} variant="secondary" size="sm" className="gap-2 bg-green-100 text-green-700 hover:bg-green-200 border-green-200 h-9">
                                                    <ArrowDownCircle className="h-4 w-4" /> Aktar
                                                </Button>
                                            </div>
                                        )}
                                        {mod.canImport && (
                                            <Button onClick={importStudentsToParticipation} variant="secondary" size="sm" className="gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                                                <ArrowDownCircle className="h-4 w-4" /> Kulüp Listesinden Getir
                                            </Button>
                                        )}
                                        {mod.hasTemplate && (
                                            <Button onClick={fillAnnualPlan} variant="secondary" size="sm" className="gap-2">
                                                <Wand2 className="h-4 w-4" /> Taslak Planı Yükle
                                            </Button>
                                        )}
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                           
                            <div className="py-2 print-area">
                                 {/* --- MODAL 1: KULÜP ÖĞRENCİ LİSTESİ (STATE'E BAĞLANDI) --- */}
                                {mod.id === 'modal1' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <div className="col-span-2 md:col-span-1"><Label>Okul:</Label><Input value={schoolName} readOnly className="bg-white" /></div>
                                            <div className="col-span-2 md:col-span-1"><Label>Kulüp:</Label><Input value={activeClubName} readOnly className="bg-white font-bold" /></div>
                                        </div>
                                        <div className="bg-blue-50 p-2 text-blue-800 text-sm rounded mb-2 border border-blue-200">
                                            💡 Buraya girdiğiniz öğrenciler, diğer formlara otomatik olarak aktarılabilir.
                                        </div>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-100">
                                                        <TableHead className="w-[50px]">Sıra</TableHead>
                                                        <TableHead>Öğrenci No</TableHead>
                                                        <TableHead>Sınıfı</TableHead>
                                                        <TableHead>Adı Soyadı</TableHead>
                                                        <TableHead>Görevi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {students.map((student, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-medium text-center">{i + 1}</TableCell>
                                                            <TableCell><Input className="h-8" value={student.no} onChange={(e) => handleStudentChange(i, 'no', e.target.value)} /></TableCell>
                                                            <TableCell><Input className="h-8" value={student.class} onChange={(e) => handleStudentChange(i, 'class', e.target.value)} /></TableCell>
                                                            <TableCell><Input className="h-8" value={student.name} onChange={(e) => handleStudentChange(i, 'name', e.target.value)} /></TableCell>
                                                            <TableCell><Input className="h-8" placeholder={i === 0 ? 'Başkan' : ''} value={student.role} onChange={(e) => handleStudentChange(i, 'role', e.target.value)} /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* --- MODAL 2: YILLIK ÇALIŞMA PLANI --- */}
                                {mod.id === 'modal2' && (
                                    <div className="space-y-4">
                                         <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800 border border-yellow-200 mb-4 flex items-center justify-between">
                                            <span>ℹ️ Bu form Sosyal Etkinlikler Yönetmeliği Ek-7a standardına göre düzenlenmiştir.</span>
                                         </div>
                                         <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-100">
                                                        <TableHead className="w-[100px]">Ay</TableHead>
                                                        <TableHead className="w-[80px]">Hafta</TableHead>
                                                        <TableHead>Amaç ve Yapılacak Etkinlikler</TableHead>
                                                        <TableHead>İlgili Kulüp / Toplum Hizmeti</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {MONTHS.map((month, index) => (
                                                        <TableRow key={month}>
                                                            <TableCell className="font-bold">{month}</TableCell>
                                                            <TableCell><Input className="h-8 text-center" placeholder='1-4' /></TableCell>
                                                            <TableCell>
                                                                <Textarea 
                                                                    className="min-h-[80px] resize-none" 
                                                                    placeholder={`${month} ayı etkinlik planı...`}
                                                                    value={annualPlan[index]} 
                                                                    onChange={(e) => handleAnnualPlanChange(index, e.target.value)}
                                                                />
                                                            </TableCell>
                                                            <TableCell><Input className="h-8" placeholder="Toplum Hizmeti alanı" /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* --- MODAL 3: ETKİNLİK KATILIM FORMU (AKILLI LİSTE) --- */}
                                {mod.id === 'modal3' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><Label>Etkinlik Adı:</Label><Input placeholder="Örn: Huzurevi Ziyareti" /></div>
                                            <div><Label>Tarih:</Label><Input type="date" /></div>
                                            <div><Label>Yer:</Label><Input /></div>
                                        </div>
                                        <Table>
                                            <TableHeader><TableRow className="bg-gray-100"><TableHead>Sıra</TableHead><TableHead>Adı Soyadı</TableHead><TableHead>Sınıfı/No</TableHead><TableHead>İmza</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {participationList.map((st, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{i + 1}</TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                value={st.name} 
                                                                onChange={(e) => {
                                                                    const newList = [...participationList];
                                                                    newList[i] = { ...newList[i], name: e.target.value };
                                                                    setParticipationList(newList);
                                                                }} 
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                value={st.classNo} 
                                                                onChange={(e) => {
                                                                    const newList = [...participationList];
                                                                    newList[i] = { ...newList[i], classNo: e.target.value };
                                                                    setParticipationList(newList);
                                                                }} 
                                                            />
                                                        </TableCell>
                                                        <TableCell><Input disabled placeholder="Çıktıda imzalanacak" /></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* --- MODAL 4 (GEZİ PLANI) --- */}
                                {mod.id === 'modal4' && (
                                    <div className="space-y-6">
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <h4 className="text-blue-800 font-bold mb-4 border-b border-blue-200 pb-2">Gezi Temel Bilgileri</h4>
                                            <div className="space-y-4">
                                                <div><Label>Gezi Yeri / Konusu:</Label><Input className="bg-white" /></div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><Label>Çıkış Tarihi/Saati:</Label><Input type="datetime-local" className="bg-white" /></div>
                                                    <div><Label>Dönüş Tarihi/Saati:</Label><Input type="datetime-local" className="bg-white" /></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4 p-4 border rounded-lg">
                                                <h4 className="font-bold text-gray-700">Ulaşım ve Sorumlular</h4>
                                                 <div className="grid grid-cols-2 gap-4">
                                                    <div><Label>Kafile Başkanı:</Label><Input /></div>
                                                    <div><Label>Araç Plakası:</Label><Input /></div>
                                                </div>
                                                <div><Label>Sorumlu Öğretmenler:</Label><Input value={teacherName} readOnly /></div>
                                            </div>
                                            <div className="space-y-4 p-4 border rounded-lg">
                                                <h4 className="font-bold text-gray-700">Gezi Detayları</h4>
                                                <div><Label>Gezinin Amacı:</Label><Textarea className="h-[84px]" /></div>
                                                <div><Label>Takip Edilecek Güzergah:</Label><Input /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- MODAL 5: VELİ İZİN BELGESİ --- */}
                                {mod.id === 'modal5' && (
                                    <div className="space-y-6 p-6 border rounded-lg bg-orange-50">
                                        <h3 className="text-center font-bold text-xl text-orange-800">VELİ İZİN BELGESİ</h3>
                                        <p className="text-gray-700">Aşağıdaki bilgileri doldurarak çıktı alınız.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Öğrenci Adı Soyadı:</Label><Input className="bg-white" /></div>
                                            <div><Label>Sınıfı / No:</Label><Input className="bg-white" /></div>
                                            <div className="col-span-2"><Label>Etkinlik / Gezi Adı:</Label><Input className="bg-white" /></div>
                                            <div><Label>Tarih:</Label><Input type="date" className="bg-white" /></div>
                                        </div>
                                        <div className="border-t pt-4 mt-4">
                                            <p className="italic text-sm text-gray-600 mb-4">"Velisi bulunduğum yukarıda bilgileri yazılı öğrencinin belirtilen etkinliğe katılmasına izin veriyorum."</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                 <div><Label>Veli Adı Soyadı:</Label><Input className="bg-white" /></div>
                                                 <div><Label>Veli Telefon:</Label><Input className="bg-white" /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- MODAL 6: GEZİ KATILIMCI LİSTESİ --- */}
                                {mod.id === 'modal6' && (
                                    <div className="space-y-4">
                                        <div className="bg-teal-50 p-2 rounded text-teal-800 text-sm">⚠️ Gezi listelerinde T.C. Kimlik No ve Veli İletişim bilgisi zorunludur.</div>
                                        <Table>
                                            <TableHeader><TableRow className="bg-gray-100"><TableHead>Sıra</TableHead><TableHead>T.C. Kimlik No</TableHead><TableHead>Adı Soyadı</TableHead><TableHead>Sınıfı</TableHead><TableHead>Veli Tel</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 15 }).map((_, i) => (
                                                    <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell><Input placeholder="11 haneli" /></TableCell><TableCell><Input /></TableCell><TableCell><Input /></TableCell><TableCell><Input /></TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* --- MODAL 7: GEZİ SONUÇ RAPORU --- */}
                                {mod.id === 'modal7' && (
                                    <div className="space-y-6">
                                        <div><Label>1. Gezinin Amacı ve Kapsamı</Label><Textarea className="min-h-[100px]" /></div>
                                        <div><Label>2. Yapılan Gözlem ve İncelemeler</Label><Textarea className="min-h-[100px]" /></div>
                                        <div><Label>3. Karşılaşılan Sorunlar ve Çözüm Önerileri</Label><Textarea className="min-h-[80px]" /></div>
                                        <div><Label>4. Sonuç ve Değerlendirme</Label><Textarea className="min-h-[80px]" /></div>
                                    </div>
                                )}

                                {/* --- MODAL 8: YIL SONU RAPORU --- */}
                                {mod.id === 'modal8' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Kulüp:</Label><Input value={activeClubName} readOnly className="bg-gray-100"/></div>
                                            <div><Label>Öğretim Yılı:</Label><Input value={academicYear} readOnly className="bg-gray-100"/></div>
                                        </div>
                                        <div><Label>1. Yıl İçinde Yapılan Çalışmaların Özeti</Label><Textarea className="min-h-[120px]" placeholder="Yıl boyunca yapılanları özetleyiniz..." /></div>
                                        <div><Label>2. Hedeflenen ve Ulaşılan Sonuçlar</Label><Textarea className="min-h-[100px]" placeholder="Hedeflere ne kadar ulaşıldı?" /></div>
                                        <div><Label>3. Gelecek Yıl İçin Öneriler</Label><Textarea className="min-h-[100px]" placeholder="Gelecek yılki kulüp için tavsiyeler..." /></div>
                                    </div>
                                )}

                                {/* --- MODAL 9: TOPLANTI TUTANAĞI --- */}
                                {mod.id === 'modal9' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded border">
                                            <div><Label>Toplantı No:</Label><Input /></div>
                                            <div><Label>Tarih:</Label><Input type="date" /></div>
                                            <div><Label>Yer:</Label><Input /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">GÜNDEM MADDELERİ</Label>
                                            <div className="flex gap-2"><span className="pt-2">1.</span><Input defaultValue="Açılış ve yoklama." /></div>
                                            <div className="flex gap-2"><span className="pt-2">2.</span><Input placeholder="Madde ekle..." /></div>
                                            <div className="flex gap-2"><span className="pt-2">3.</span><Input placeholder="Madde ekle..." /></div>
                                            <div className="flex gap-2"><span className="pt-2">4.</span><Input defaultValue="Kapanış." /></div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">ALINAN KARARLAR</Label>
                                            <Textarea className="min-h-[150px]" placeholder="Toplantıda alınan kararları buraya yazınız..." />
                                        </div>
                                    </div>
                                )}

                                {/* --- MODAL 10: GELİR GİDER CETVELİ (OTOMATİK HESAPLAMA) --- */}
                                {mod.id === 'modal10' && (
                                    <div className="space-y-4">
                                        <Table>
                                            <TableHeader><TableRow className="bg-gray-100"><TableHead>Tarih</TableHead><TableHead>Açıklama / İşlem Türü</TableHead><TableHead>Belge No</TableHead><TableHead>Gelir (TL)</TableHead><TableHead>Gider (TL)</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {budgetItems.map((item, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell><Input type="date" className="w-[130px]" value={item.date} onChange={(e) => handleBudgetChange(i, 'date', e.target.value)} /></TableCell>
                                                        <TableCell><Input value={item.desc} onChange={(e) => handleBudgetChange(i, 'desc', e.target.value)} /></TableCell>
                                                        <TableCell><Input className="w-[80px]" value={item.docNo} onChange={(e) => handleBudgetChange(i, 'docNo', e.target.value)} /></TableCell>
                                                        <TableCell><Input placeholder="0.00" value={item.income} onChange={(e) => handleBudgetChange(i, 'income', e.target.value)} /></TableCell>
                                                        <TableCell><Input placeholder="0.00" value={item.expense} onChange={(e) => handleBudgetChange(i, 'expense', e.target.value)} /></TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-gray-50 font-bold">
                                                    <TableCell colSpan={3} className="text-right">TOPLAM:</TableCell>
                                                    <TableCell className="text-green-700">{calculateBudget.income} ₺</TableCell>
                                                    <TableCell className="text-red-700">{calculateBudget.expense} ₺</TableCell>
                                                </TableRow>
                                                <TableRow className="bg-blue-50 font-bold border-t-2 border-blue-200">
                                                    <TableCell colSpan={3} className="text-right">KASA BAKİYESİ:</TableCell>
                                                    <TableCell colSpan={2} className="text-blue-800 text-center text-lg">
                                                        {(parseFloat(calculateBudget.income) - parseFloat(calculateBudget.expense)).toFixed(2)} ₺
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* --- MODAL 11: TOPLUM HİZMETİ ONAY --- */}
                                {mod.id === 'modal11' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><Label>Toplum Hizmeti Çalışmasının Konusu:</Label><Input /></div>
                                            <div className="col-span-2"><Label>Hedef Kitle / Kurum:</Label><Input /></div>
                                        </div>
                                        <Label className="mt-4 block font-bold">Görevli Öğrenciler</Label>
                                        <Table>
                                            <TableHeader><TableRow className="bg-pink-50"><TableHead>Sıra</TableHead><TableHead>Öğrenci Adı Soyadı</TableHead><TableHead>Görevi</TableHead><TableHead>Planlanan Süre</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 8 }).map((_, i) => (
                                                    <TableRow key={i}><TableCell>{i + 1}</TableCell><TableCell><Input /></TableCell><TableCell><Input /></TableCell><TableCell><Input /></TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* --- MODAL 12: E-OKUL LİSTESİ --- */}
                                {mod.id === 'modal12' && (
                                    <div className="space-y-4">
                                        <div className="bg-cyan-50 p-2 rounded text-cyan-800 text-sm">ℹ️ Bu liste e-Okul Sosyal Etkinlik Modülü'ne veri girişi yaparken kolaylık sağlaması amacıyla hazırlanmıştır.</div>
                                        <Table>
                                            <TableHeader><TableRow className="bg-gray-100"><TableHead>Öğrenci No</TableHead><TableHead>Adı Soyadı</TableHead><TableHead>Etkinlik Alanı</TableHead><TableHead>Kategori</TableHead><TableHead>Temsil Düzeyi</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <TableRow key={i}><TableCell><Input className="w-[80px]" /></TableCell><TableCell><Input /></TableCell><TableCell>Sosyal Etkinlik</TableCell><TableCell>Okul İçi</TableCell><TableCell>Katılım</TableCell></TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                            </div>

                            <DialogFooter className="mt-8 border-t pt-4">
                                 <Button onClick={() => downloadRTF(mod.id, mod.title)} className="bg-green-600 hover:bg-green-700 gap-2">
                                    <Download className="h-5 w-5" /> RTF İndir (Word)
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                 ))}
            </div>
        </div>
    );
}
    