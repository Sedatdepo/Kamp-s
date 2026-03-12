'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Search,
  PlusCircle,
  Eye,
  FileDown,
  ToggleLeft,
  ToggleRight,
  FileSignature,
  Users2,
  BarChart,
  Scale,
  Banknote,
  Handshake,
  Bus,
  ClipboardList,
  CheckCircle,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDatabase } from '@/hooks/use-database';
import { TeacherProfile, DilekceDocument, Class } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecordManager } from '@/components/dashboard/teacher/RecordManager';
import { exportDilekceToRtf } from '@/lib/word-export';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Student } from '@/lib/types';


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
    const { db, setDb } = useDatabase();
    const { toast } = useToast();
    const clubData = db.mebClubData;

    const [classToImport, setClassToImport] = useState<string>('');
    const [participationList, setParticipationList] = useState<any[]>(Array(15).fill({ name: "", classNo: "" }));

    // Update function for nested data
    const updateClubData = (field: string, value: any) => {
        setDb(prev => ({
            ...prev,
            mebClubData: {
                ...prev.mebClubData,
                [field]: value,
            }
        }));
    };

    const activeClubName = useMemo(() => {
        if (clubData.clubSelection === "Diğer") return clubData.manualClubName;
        return clubData.clubSelection;
    }, [clubData.clubSelection, clubData.manualClubName]);

    // --- HELPER FUNCTIONS ---

    const fillAnnualPlan = () => {
        updateClubData('annualPlan', [...SAMPLE_PLANS.default]);
        toast({ title: 'Taslak plan yüklendi.'});
    };

    const handleAnnualPlanChange = (index: number, value: string) => {
        const newPlan = [...clubData.annualPlan];
        newPlan[index] = value;
        updateClubData('annualPlan', newPlan);
    };

    const handleStudentChange = (index: number, field: string, value: string) => {
        const newStudents = [...clubData.students];
        newStudents[index] = { ...newStudents[index], [field]: value };
        updateClubData('students', newStudents);
    };

    const importStudentsFromClass = () => {
        if (!classToImport) {
            toast({ title: 'Hata', description: "Lütfen öğrenci aktarılacak bir sınıf seçin.", variant: 'destructive'});
            return;
        }
        const studentsFromSelectedClass = allStudents.filter(s => s.classId === classToImport);
        if (studentsFromSelectedClass.length === 0) {
            toast({ title: 'Bilgi', description: "Seçilen sınıfta öğrenci bulunmuyor.", variant: 'default'});
            return;
        }
        const newClubStudents = studentsFromSelectedClass.map(s => ({
            no: s.number,
            name: s.name,
            class: classes.find(c => c.id === s.classId)?.name || '',
            role: ''
        }));
        
        const updatedList = [...newClubStudents, ...Array(Math.max(0, 20 - newClubStudents.length)).fill({ no: "", name: "", class: "", role: "" })];
        updateClubData('students', updatedList.slice(0, 20));

        toast({ title: 'Başarılı', description: `${newClubStudents.length} öğrenci kulüp listesine başarıyla aktarıldı.`});
        setClassToImport('');
    };

    const importStudentsToParticipation = () => {
        const activeStudents = clubData.students.filter(s => s.name && s.name.trim() !== "");
        if (activeStudents.length === 0) {
             toast({ title: 'Hata', description: "Önce 'Kulüp Öğrenci Listesi'ne öğrenci eklemelisiniz.", variant: 'destructive'});
            return;
        }
        
        const newList = [...participationList];
        activeStudents.forEach((student, index) => {
            if (index < newList.length) {
                newList[index] = { name: student.name, classNo: `${student.class} / ${student.no}` };
            }
        });
        setParticipationList(newList);
        toast({ title: 'Başarılı', description:`${activeStudents.length} öğrenci aktarıldı.`});
    };

    const handleBudgetChange = (index: number, field: string, value: string) => {
        const newBudget = [...clubData.budgetItems];
        newBudget[index] = { ...newBudget[index], [field]: value };
        updateClubData('budgetItems', newBudget);
    };

    const calculateBudget = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        clubData.budgetItems.forEach(item => {
            totalIncome += parseFloat(item.income) || 0;
            totalExpense += parseFloat(item.expense) || 0;
        });
        return { income: totalIncome.toFixed(2), expense: totalExpense.toFixed(2) };
    }, [clubData.budgetItems]);

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
                <h1>${clubData.schoolName || 'Okul Adı Girilmemiş'}</h1>
                <h2>${activeClubName || 'Kulüp Seçilmemiş'} - ${title}</h2>
                <p style="text-align: center;"><strong>Eğitim Yılı:</strong> ${clubData.academicYear} | <strong>Danışman:</strong> ${clubData.teacherName}</p>
        `;

        if (modalId === 'modal1') {
            content += `
                <table>
                    <thead><tr><th style="width: 50px;">Sıra</th><th>Öğrenci No</th><th>Sınıfı</th><th>Adı Soyadı</th><th>Görevi</th></tr></thead>
                    <tbody>
            `;
            clubData.students.forEach((s, i) => {
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
                const planText = clubData.annualPlan[index] || ""; 
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
            clubData.budgetItems.forEach(item => {
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
                    <tr><td colspan="2"><strong>Sorumlu Öğretmenler:</strong><br>${clubData.teacherName}<br><br></td></tr>
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
                        <br><strong>${clubData.teacherName}</strong><br>Danışman Öğretmen
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

    if (!clubData) return <div className="p-10 text-center">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <header className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <Home className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Kulüp ve Gezi Yönetim Sistemi</h1>
                        <p className="text-sm text-gray-500">Okul Yönetim Modülü v2.3 (Merkezi Veritabanı)</p>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
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
                        Burada girdiğiniz veriler veritabanına otomatik kaydedilir ve tüm formlara yansır.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-gray-600">🏫 Okul Adı</Label>
                            <Input 
                                value={clubData.schoolName} 
                                onChange={(e: any) => updateClubData('schoolName', e.target.value)}
                                className="bg-gray-50 focus:bg-white"
                                placeholder="Örn: Atatürk Anadolu Lisesi"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-600">📅 Eğitim Yılı</Label>
                            <Input 
                                value={clubData.academicYear} 
                                onChange={(e: any) => updateClubData('academicYear', e.target.value)}
                                className="bg-gray-50 focus:bg-white" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-600">👨‍🏫 Danışman Öğretmen</Label>
                            <Input 
                                value={clubData.teacherName} 
                                onChange={(e: any) => updateClubData('teacherName', e.target.value)}
                                className="bg-gray-50 focus:bg-white" 
                            />
                        </div>
                         <div className="space-y-2">
                            <Label className="text-gray-600">♣️ Aktif Kulüp Seçimi</Label>
                            <Select value={clubData.clubSelection} onValueChange={(val) => updateClubData('clubSelection', val)}>
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
                            {clubData.clubSelection === 'Diğer' && (
                                <Input
                                    className="mt-2 bg-yellow-50 border-yellow-200"
                                    placeholder="Kulüp adını buraya yazın..."
                                    value={clubData.manualClubName}
                                    onChange={(e: any) => updateClubData('manualClubName', e.target.value)}
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
                        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
                            <DialogHeader className="p-6 pb-4 border-b">
                                <DialogTitle>{mod.title}</DialogTitle>
                            </DialogHeader>
                            <div className="p-6 overflow-y-auto flex-grow">
                                {mod.id === 'modal1' && (
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <Select onValueChange={setClassToImport}><SelectTrigger className="w-[200px]"><SelectValue placeholder="Sınıf Seç..." /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                                <Button onClick={importStudentsFromClass}><Users size={16} /> Sınıftan Aktar</Button>
                                            </div>
                                        </div>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>No</TableHead><TableHead>Adı Soyadı</TableHead><TableHead>Sınıfı</TableHead><TableHead>Görevi</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {clubData.students.slice(0, 20).map((s, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Input value={s.no} onChange={e => handleStudentChange(i, 'no', e.target.value)} /></TableCell>
                                                    <TableCell><Input value={s.name} onChange={e => handleStudentChange(i, 'name', e.target.value)} /></TableCell>
                                                    <TableCell><Input value={s.class} onChange={e => handleStudentChange(i, 'class', e.target.value)} /></TableCell>
                                                    <TableCell><Input value={s.role} onChange={e => handleStudentChange(i, 'role', e.target.value)} /></TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                {mod.id === 'modal2' && (
                                    <div className="space-y-4">
                                        <Button onClick={fillAnnualPlan} variant="outline" className="mb-4">Taslak Planı Doldur</Button>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Ay</TableHead><TableHead>Yapılacak Etkinlik</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {MONTHS.map((month, index) => (
                                                <TableRow key={month}>
                                                    <TableCell className="font-semibold">{month}</TableCell>
                                                    <TableCell><Textarea value={clubData.annualPlan[index]} onChange={(e) => handleAnnualPlanChange(index, e.target.value)} rows={2} /></TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                {mod.id === 'modal3' && (
                                    <div>
                                        <Button onClick={importStudentsToParticipation} className="mb-4">Öğrenci Listesinden Aktar</Button>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Sıra No</TableHead><TableHead>Adı Soyadı</TableHead><TableHead>Sınıfı/No</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {participationList.map((s, i) => (
                                                <TableRow key={i}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell><Input value={s.name} onChange={(e) => { const newList = [...participationList]; newList[i].name = e.target.value; setParticipationList(newList); }}/></TableCell>
                                                <TableCell><Input value={s.classNo} onChange={(e) => { const newList = [...participationList]; newList[i].classNo = e.target.value; setParticipationList(newList); }}/></TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                {mod.id === 'modal10' && (
                                    <div>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Açıklama</TableHead><TableHead>Belge No</TableHead><TableHead>Gelir (TL)</TableHead><TableHead>Gider (TL)</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                            {clubData.budgetItems.map((item, index) => (
                                                <TableRow key={index}>
                                                <TableCell><Input type="date" value={item.date} onChange={e => handleBudgetChange(index, 'date', e.target.value)} /></TableCell>
                                                <TableCell><Input value={item.desc} onChange={e => handleBudgetChange(index, 'desc', e.target.value)} /></TableCell>
                                                <TableCell><Input value={item.docNo} onChange={e => handleBudgetChange(index, 'docNo', e.target.value)} /></TableCell>
                                                <TableCell><Input type="number" value={item.income} onChange={e => handleBudgetChange(index, 'income', e.target.value)} /></TableCell>
                                                <TableCell><Input type="number" value={item.expense} onChange={e => handleBudgetChange(index, 'expense', e.target.value)} /></TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                        <div className="text-right font-bold mt-4">Bakiye: {(parseFloat(calculateBudget.income) - parseFloat(calculateBudget.expense)).toFixed(2)} TL</div>
                                    </div>
                                )}
                                 {['modal4', 'modal5', 'modal6', 'modal7', 'modal8', 'modal9', 'modal11', 'modal12'].includes(mod.id) && (
                                    <div className="text-center text-gray-500">
                                        <p>Bu belge için standart bir şablon bulunmaktadır.</p>
                                        <p>"Word Olarak İndir" butonuna tıklayarak bilgisayarınıza indirebilirsiniz.</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="p-6 pt-4 border-t bg-gray-50">
                                <Button onClick={() => downloadRTF(mod.id, mod.title)}><FileDown size={16} /> Word Olarak İndir</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                 ))}
            </div>
        </div>
    );
}
