
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Student,
  Class,
  TeacherProfile,
  Kazanım,
} from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Users, TrendingUp, TrendingDown, Target, FileDown, CheckSquare, Square, BookOpen, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';


interface ExamAnalysisTabProps {
  students: Student[];
  currentClass: Class | null;
  teacherProfile: TeacherProfile | null;
}

type ExamKey = 'exam1' | 'exam2';
type TermKey = 'term1' | 'term2';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);


// --- KAZANIM ANALİZ FORMU ---

const TELAFI_SECENEKLERI = [
  { key: 'dersIciTekrar', label: 'Ders İçi Konu Tekrarı' },
  { key: 'bakanlikMateryal', label: 'Bakanlık Destek Materyalleri' },
  { key: 'calismaKagidi', label: 'Çalışma Kâğıdı / Yaprağı' },
  { key: 'eba', label: 'EBA Uygulamaları' },
  { key: 'mebi', label: 'MEBİ Uygulamaları' },
  { key: 'dyk', label: 'DYK Çalışmaları' }
];

function KazanımSelector({ onSelect, teacherId }: { onSelect: (kazanim: string) => void, teacherId: string }) {
    const { db } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    
    const kazanımlarQuery = useMemoFirebase(() => db ? query(collection(db, 'kazanims'), where('teacherId', '==', teacherId)) : null, [db, teacherId]);
    const { data: kazanımlar, isLoading } = useCollection<Kazanım>(kazanımlarQuery);

    const filteredKazanims = useMemo(() => {
        if (!kazanımlar) return [];
        if (!searchTerm) return kazanımlar;
        const lowercasedFilter = searchTerm.toLowerCase();
        return kazanımlar.filter(item => item.text.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, kazanımlar]);

    return (
        <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Kazanım Seç</DialogTitle>
                <DialogDescription>Telafisi yapılacak kazanımı seçin veya arayın.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Kazanım metni ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="flex-1 mt-4 border rounded-md">
                <div className="p-2 space-y-1">
                    {isLoading ? <p>Yükleniyor...</p> : filteredKazanims.length > 0 ? (
                        filteredKazanims.map(item => (
                            <DialogClose asChild key={item.id}>
                                <div
                                    onClick={() => onSelect(item.text)}
                                    className="p-3 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                >
                                    {item.text}
                                </div>
                            </DialogClose>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Aramanızla eşleşen kazanım bulunamadı.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    );
}

function ExamReportForm({ teacherProfile, currentClass, examData, selectedTerm, selectedExam }: { 
    teacherProfile: TeacherProfile | null, 
    currentClass: Class | null,
    examData: { student: Student; grade: number }[],
    selectedTerm: TermKey,
    selectedExam: ExamKey
}) {
  const [formData, setFormData] = useState({
    il: "İstanbul",
    ilce: "Şişli",
    okul: teacherProfile?.schoolName || "Okul Adı Girilmemiş",
    ders: teacherProfile?.branch || "Ders Adı Girilmemiş",
    sinavTarihi: "",
    sinif: currentClass?.name || "",
    sinavAdi: "",
    ogrenciSayisi: "",
    puan0_49: "",
    puan50_69: "",
    puan70_100: "",
    eksikKazanimlar: [
      {
        id: 1,
        konu: "",
        tarih: "",
        calismalar: {
          ...TELAFI_SECENEKLERI.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {}),
          diger: false,
          digerAciklama: ""
        }
      },
      {
        id: 2,
        konu: "",
        tarih: "",
        calismalar: {
          ...TELAFI_SECENEKLERI.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {}),
          diger: false,
          digerAciklama: ""
        }
      },
      {
        id: 3,
        konu: "",
        tarih: "",
        calismalar: {
          ...TELAFI_SECENEKLERI.reduce((acc, opt) => ({ ...acc, [opt.key]: false }), {}),
          diger: false,
          digerAciklama: ""
        }
      }
    ],
    ogretmen: teacherProfile?.name || "",
    zumreBaskani: "",
    okulMuduru: teacherProfile?.principalName || ""
  });
  
  useEffect(() => {
    const termName = selectedTerm === 'term1' ? '1. Dönem' : '2. Dönem';
    const examName = selectedExam === 'exam1' ? '1. Yazılı' : '2. Yazılı';
    
    const totalStudents = examData.length;
    const bracket1 = examData.filter(d => d.grade < 50).length;
    const bracket2 = examData.filter(d => d.grade >= 50 && d.grade < 70).length;
    const bracket3 = examData.filter(d => d.grade >= 70).length;

    setFormData(prev => ({
        ...prev,
        ders: teacherProfile?.branch || prev.ders,
        sinif: currentClass?.name || prev.sinif,
        ogretmen: teacherProfile?.name || prev.ogretmen,
        okulMuduru: teacherProfile?.principalName || prev.okulMuduru,
        okul: teacherProfile?.schoolName || prev.okul,
        sinavAdi: `${termName} ${examName}`,
        ogrenciSayisi: totalStudents.toString(),
        puan0_49: bracket1.toString(),
        puan50_69: bracket2.toString(),
        puan70_100: bracket3.toString(),
    }));

  }, [examData, selectedTerm, selectedExam, teacherProfile, currentClass]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKazanimChange = (index: number, field: string, value: string) => {
    const newKazanimlar = [...formData.eksikKazanimlar];
    (newKazanimlar[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, eksikKazanimlar: newKazanimlar }));
  };
  
   const handleSelectKazanım = (index: number, kazanim: string) => {
        const newKazanimlar = [...formData.eksikKazanimlar];
        (newKazanimlar[index] as any)['konu'] = kazanim;
        setFormData(prev => ({ ...prev, eksikKazanimlar: newKazanimlar }));
   };


  const handleCalismaToggle = (index: number, key: string) => {
    const newKazanimlar = [...formData.eksikKazanimlar];
    (newKazanimlar[index].calismalar as any)[key] = !(newKazanimlar[index].calismalar as any)[key];
    setFormData(prev => ({ ...prev, eksikKazanimlar: newKazanimlar }));
  };

  const handleDigerAciklamaChange = (index: number, value: string) => {
    const newKazanimlar = [...formData.eksikKazanimlar];
    newKazanimlar[index].calismalar.digerAciklama = value;
    if (value.length > 0 && !newKazanimlar[index].calismalar.diger) {
        newKazanimlar[index].calismalar.diger = true;
    }
    setFormData(prev => ({ ...prev, eksikKazanimlar: newKazanimlar }));
  };

  const trToRTF = (text: string | number) => {
    if (!text) return "";
    return text.toString()
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\line ')
      .split('').map(char => {
        const code = char.charCodeAt(0);
        return code > 127 ? `\\u${code}?` : char;
      }).join('');
  };

  const formatDateForRTF = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
  };

  const generateRTF = () => {
    let rtf = `{\\rtf1\\ansi\\ansicpg1254\\deff0\\nouicompat\\deflang1055
{\\fonttbl{\\f0\\fnil\\fcharset162 Calibri;}}
{\\colortbl ;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\sa200\\sl276\\slmult1\\qc\\b\\f0\\fs28 SINAV SONU\\u199? DE\\u286?ERLEND\\u304?RME TUTANA\\u286?I\\par
\\pard\\sa200\\sl276\\slmult1\\qj\\fs22\\par
`;
    rtf += `\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx2250
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx4750
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx7000
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b Il:\\b0  ${trToRTF(formData.il)}\\cell
\\pard\\intbl\\cell
\\pard\\intbl\\b Ilce:\\b0  ${trToRTF(formData.ilce)}\\cell
\\pard\\intbl\\cell
\\row
`;
    rtf += `\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx2250
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b Okul:\\b0  ${trToRTF(formData.okul)}\\cell
\\pard\\intbl\\cell
\\row
`;
    rtf += `\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx2250
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx4500
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx7000
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b Ders:\\b0  ${trToRTF(formData.ders)}\\cell
\\pard\\intbl\\b Sinav Tarihi:\\b0  ${formatDateForRTF(formData.sinavTarihi)}\\cell
\\pard\\intbl\\b Sinif:\\b0  ${trToRTF(formData.sinif)}\\cell
\\pard\\intbl\\b Sinav Adi:\\b0  ${trToRTF(formData.sinavAdi)}\\cell
\\row
\\pard\\par
`;
    rtf += `\\pard\\b 1. B\\u214?L\\u220?M: \\u214?GRENC\\u304?LER\\u304?N PUAN DA\\u286?ILIMI\\par\\b0
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx2375
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx4750
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx7125
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\qc Sinava Giren\\line Ogrenci Sayisi\\cell
\\pard\\intbl\\qc 0 - 49 Arasi\\line Puan Alan\\cell
\\pard\\intbl\\qc 50 - 69 Arasi\\line Puan Alan\\cell
\\pard\\intbl\\qc 70 - 100 Arasi\\line Puan Alan\\cell
\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx2375
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx4750
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx7125
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\qc ${trToRTF(formData.ogrenciSayisi)}\\cell
\\pard\\intbl\\qc ${trToRTF(formData.puan0_49)}\\cell
\\pard\\intbl\\qc ${trToRTF(formData.puan50_69)}\\cell
\\pard\\intbl\\qc ${trToRTF(formData.puan70_100)}\\cell
\\row
\\pard\\par
`;
    rtf += `\\pard\\b 2. B\\u214?L\\u220?M: EKS\\u304?K \\u214?GRENME \\u199?IKTILARI VE TELAF\\u304? PLANI\\par\\b0
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx500
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx3500
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx8000
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b No\\b0\\cell
\\pard\\intbl\\b Eksik Kazanimlar\\b0\\cell
\\pard\\intbl\\b Gelisim Plani / Calismalar\\b0\\cell
\\pard\\intbl\\b Tarih\\b0\\cell
\\row
`;
    formData.eksikKazanimlar.forEach((item) => {
      let checklistText = "";
      TELAFI_SECENEKLERI.forEach(opt => {
         const isChecked = (item.calismalar as any)[opt.key];
         checklistText += `${isChecked ? '[X]' : '[  ]'} ${trToRTF(opt.label)}\\line `;
      });
      const digerText = item.calismalar.digerAciklama ? ` (${trToRTF(item.calismalar.digerAciklama)})` : "";
      checklistText += `${item.calismalar.diger ? '[X]' : '[  ]'} Diger${digerText}`;

      rtf += `\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx500
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx3500
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx8000
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl ${item.id}\\cell
\\pard\\intbl ${trToRTF(item.konu)}\\cell
\\pard\\intbl ${checklistText}\\cell
\\pard\\intbl ${formatDateForRTF(item.tarih)}\\cell
\\row
`;
    });
    rtf += `\\pard\\par\\par
`;
    rtf += `\\pard\\qc
\\trowd\\trgaph108\\trleft-108 \\trbrdrt\\brdrs\\brdrw10
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx3166
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx6332
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl ${trToRTF(formData.ogretmen)}\\line Ogretmen\\cell
\\pard\\intbl ${trToRTF(formData.zumreBaskani)}\\line Zumre Baskani\\cell
\\pard\\intbl ${trToRTF(formData.okulMuduru)}\\line Okul Muduru\\cell
\\row
\\pard
}`;
    const blob = new Blob([rtf], { type: 'application/rtf' });
    saveAs(blob, `Sinav_Degerlendirme_${formData.ders || 'Form'}.rtf`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Kazanım Analizi ve Telafi Planı Formu</CardTitle>
            <Button onClick={generateRTF}>
                <FileDown className="mr-2 h-4 w-4" /> RTF Olarak İndir
            </Button>
        </div>
        <CardDescription>Sınav sonrası değerlendirme ve telafi çalışmalarını planlamak için bu formu kullanın.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Üst Bilgiler */}
          <div className="border p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Genel Bilgiler</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="il" value={formData.il} onChange={handleInputChange} placeholder="İl" className="p-2 border rounded" />
              <input type="text" name="ilce" value={formData.ilce} onChange={handleInputChange} placeholder="İlçe" className="p-2 border rounded" />
            </div>
            <input type="text" name="okul" value={formData.okul} onChange={handleInputChange} placeholder="Okul" className="w-full p-2 border rounded" readOnly/>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <input type="text" name="ders" value={formData.ders} onChange={handleInputChange} placeholder="Ders" className="p-2 border rounded" readOnly/>
              <input type="date" name="sinavTarihi" value={formData.sinavTarihi} onChange={handleInputChange} className="p-2 border rounded" />
              <input type="text" name="sinif" value={formData.sinif} onChange={handleInputChange} placeholder="Sınıf" className="p-2 border rounded" readOnly/>
              <input type="text" name="sinavAdi" value={formData.sinavAdi} onChange={handleInputChange} placeholder="Sınav Adı" className="p-2 border rounded" readOnly/>
            </div>
          </div>
          {/* Puan Dağılımı */}
          <div className="border p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">1. Bölüm: Öğrencilerin Puan Dağılımı</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                      <label className="text-sm font-medium">Sınava Giren Öğrenci</label>
                      <input type="number" name="ogrenciSayisi" value={formData.ogrenciSayisi} onChange={handleInputChange} className="w-full p-2 border rounded mt-1 text-center" readOnly/>
                  </div>
                  <div>
                      <label className="text-sm font-medium">0-49 Alan</label>
                      <input type="number" name="puan0_49" value={formData.puan0_49} onChange={handleInputChange} className="w-full p-2 border rounded mt-1 text-center" readOnly/>
                  </div>
                  <div>
                      <label className="text-sm font-medium">50-69 Alan</label>
                      <input type="number" name="puan50_69" value={formData.puan50_69} onChange={handleInputChange} className="w-full p-2 border rounded mt-1 text-center" readOnly/>
                  </div>
                  <div>
                      <label className="text-sm font-medium">70-100 Alan</label>
                      <input type="number" name="puan70_100" value={formData.puan70_100} onChange={handleInputChange} className="w-full p-2 border rounded mt-1 text-center" readOnly/>
                  </div>
              </div>
          </div>
          {/* Telafi Planı */}
          <div className="border p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">2. Bölüm: Eksik Öğrenme Çıktıları ve Telafi Planlaması</h3>
              {formData.eksikKazanimlar.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-b">
                      <div className="col-span-4 flex items-center">
                          <span className="mr-2 font-bold">{item.id}.</span>
                          <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-24">
                                        {item.konu || <span className="text-muted-foreground">Kazanım seçmek için tıklayın...</span>}
                                    </Button>
                                </DialogTrigger>
                                <KazanımSelector onSelect={(kazanim) => handleSelectKazanım(index, kazanim)} teacherId={teacherProfile?.id || ''}/>
                          </Dialog>
                      </div>
                      <div className="col-span-6 space-y-1">
                          {TELAFI_SECENEKLERI.map(opt => (
                              <div key={opt.key} className="flex items-center gap-2" onClick={() => handleCalismaToggle(index, opt.key)}>
                                  { (item.calismalar as any)[opt.key] ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                                  <span className="text-sm select-none">{opt.label}</span>
                              </div>
                          ))}
                           <div className="flex items-start gap-2 pt-1">
                              <div onClick={() => handleCalismaToggle(index, 'diger')} className="mt-1 cursor-pointer">
                                {item.calismalar.diger ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                              </div>
                              <div className="flex-1">
                                <span className="text-sm select-none cursor-pointer" onClick={() => handleCalismaToggle(index, 'diger')}>Diğer:</span>
                                <input type="text" value={item.calismalar.digerAciklama} onChange={(e) => handleDigerAciklamaChange(index, e.target.value)} placeholder="(Açıklama)" className="w-full bg-transparent border-b border-dotted text-xs outline-none"/>
                              </div>
                            </div>
                      </div>
                      <div className="col-span-2 flex items-center">
                          <input type="date" value={item.tarih} onChange={(e) => handleKazanimChange(index, 'tarih', e.target.value)} className="w-full p-1 border rounded text-sm"/>
                      </div>
                  </div>
              ))}
          </div>
           {/* İmzalar */}
           <div className="border p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">İmza Bölümü</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                      <input type="text" name="ogretmen" placeholder="Öğretmen Adı" value={formData.ogretmen} onChange={handleInputChange} className="w-full p-2 border rounded text-center" readOnly/>
                      <label className="text-xs">Öğretmen</label>
                  </div>
                  <div>
                      <input type="text" name="zumreBaskani" placeholder="Zümre Başkanı Adı" value={formData.zumreBaskani} onChange={handleInputChange} className="w-full p-2 border rounded text-center"/>
                      <label className="text-xs">Zümre Başkanı</label>
                  </div>
                  <div>
                      <input type="text" name="okulMuduru" placeholder="Okul Müdürü Adı" value={formData.okulMuduru} onChange={handleInputChange} className="w-full p-2 border rounded text-center" readOnly/>
                      <label className="text-xs">Okul Müdürü</label>
                  </div>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}



export function ExamAnalysisTab({ students, currentClass, teacherProfile }: ExamAnalysisTabProps) {
  const [selectedExamKey, setSelectedExamKey] = useState<string>('term1-exam1');

  const { term, exam } = useMemo(() => {
    const [termKey, examKey] = selectedExamKey.split('-');
    return {
      term: termKey as TermKey,
      exam: examKey as ExamKey,
    };
  }, [selectedExamKey]);

  const examData = useMemo(() => {
    const termGradesKey = term === 'term1' ? 'term1Grades' : 'term2Grades';
    return students
      .map(student => {
        const grades = student[termGradesKey] as any;
        const grade = grades?.[exam] ?? -1;
        return { student, grade };
      })
      .filter(item => item.grade !== -1);
  }, [students, term, exam]);

  const classAverage = useMemo(() => {
    if (examData.length === 0) return 0;
    const total = examData.reduce((sum, item) => sum + item.grade, 0);
    return total / examData.length;
  }, [examData]);

  const successRate = useMemo(() => {
    if (examData.length === 0) return 0;
    const passingStudents = examData.filter(item => item.grade >= 50).length;
    return (passingStudents / examData.length) * 100;
  }, [examData]);
  
  const sortedStudents = useMemo(() => {
      return [...examData].sort((a,b) => b.grade - a.grade);
  }, [examData]);

  const highestScorers = sortedStudents.slice(0, 3);
  const lowestScorers = sortedStudents.slice(-3).reverse();


  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Sınav Seçimi ve Genel İstatistikler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <Select value={selectedExamKey} onValueChange={setSelectedExamKey}>
                <SelectTrigger>
                    <SelectValue placeholder="Sınav seçin..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="term1-exam1">1. Dönem 1. Yazılı</SelectItem>
                    <SelectItem value="term1-exam2">1. Dönem 2. Yazılı</SelectItem>
                    <SelectItem value="term2-exam1">2. Dönem 1. Yazılı</SelectItem>
                    <SelectItem value="term2-exam2">2. Dönem 2. Yazılı</SelectItem>
                </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
                <StatCard title="Sınıf Ortalaması" value={classAverage.toFixed(2)} icon={<BarChart className="text-blue-500" />} />
                <StatCard title="Başarı Oranı" value={`%${successRate.toFixed(2)}`} icon={<Users className="text-green-500" />} />
                <StatCard title="En Yüksek Not" value={highestScorers[0]?.grade.toString() || 'N/A'} icon={<TrendingUp className="text-emerald-500" />} />
                <StatCard title="En Düşük Not" value={lowestScorers[0]?.grade.toString() || 'N/A'} icon={<TrendingDown className="text-red-500" />} />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target/> Öğrenci Performans Sıralaması</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Öğrenci</TableHead>
                            <TableHead className="text-right">Not</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedStudents.map(({student, grade}) => (
                            <TableRow key={student.id}>
                                <TableCell>{student.name}</TableCell>
                                <TableCell className="text-right font-bold">{grade}</TableCell>
                            </TableRow>
                        ))}
                        {sortedStudents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground">Bu sınav için not girilmemiş.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

      </div>
      <div className="xl:col-span-3">
         <ExamReportForm 
            teacherProfile={teacherProfile} 
            currentClass={currentClass} 
            examData={examData}
            selectedTerm={term}
            selectedExam={exam}
        />
      </div>
    </div>
  );
}


