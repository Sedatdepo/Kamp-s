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
  Settings,
  BookOpen,
  Zap,
  Waves,
  Activity,
  Compass,
  Rocket,
  Droplets,
  Flame
} from 'lucide-react';
import { TeacherProfile, Class, BepStudent } from '@/lib/types';
import { ALL_PLANS } from '@/lib/plans';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDatabase } from '@/hooks/use-database';

// --- SABİT VERİLER (CONSTANTS) ---

const unitsData = [
  // --- 9. SINIF ÜNİTELERİ ---
  {
    id: 'u9_1',
    grade: '9. Sınıf',
    title: '1. Ünite: Fizik Bilimi ve Kariyer Keşfi',
    icon: <Compass className="w-5 h-5" />,
    header: "9/ ….. SINIFI FİZİK DERSİ TEMA1: FİZİK BİLİMİ VE KARİYER KEŞFİ",
    outcomes: "FİZ.9.1.1 - 9.1.4: Fizik bilimi tanımı, alt dalları, bilim insanları, kariyer olanakları",
    columns: [
      "ETKİNLİK 1: Fizik Bilimi", "Değerlendirme", "Alıştırma 1", "Alıştırma 2",
      "ETKİNLİK 2: Alt Dalları", "Değerlendirme", "Alıştırma 3",
      "ETKİNLİK 3: Bilim İnsanları", "Değerlendirme", "Alıştırma 4",
      "ETKİNLİK 4: Kariyer Keşfi", "Değerlendirme", "Öz Değerlendirme Formu", "Performans Görevi", "Alıştırma 5"
    ]
  },
  {
    id: 'u9_2',
    grade: '9. Sınıf',
    title: '2. Ünite: Kuvvet ve Hareket',
    icon: <Rocket className="w-5 h-5" />,
    header: "9/… SINIFI FİZİK DERSİ 2. ÜNİTE: KUVVET VE HAREKET",
    outcomes: "FİZ.9.2.1 - FİZ.9.2.7: Kuvvet, hareket ve ilgili kavramlar",
    columns: [
      "Hazır mısınız (52)", "1.ETKİNLİK (55)", "Alıştırma 1 (57)", "Alıştırma 2 (58)", "Alıştırma 3 (58)",
      "2.ETKİNLİK (59)", "Alıştırma 4 (62)", "Alıştırma 5 (63)", "3. ETKİNLİK (65)", "Alıştırma 6 (69)",
      "Alıştırma 7 (69)", "1. Çalışma yaprağı (70)", "4. ETKİNLİK (72)", "Alıştırma 8 (76)", "Alıştırma 9 (78)",
      "Alıştırma 10 (79)", "Alıştırma 11 (79)", "Alıştırma 12 (80)", "Alıştırma 13 (82)", "Alıştırma 14 (82)",
      "2. Çalışma yaprağı (83)", "5. ETKİNLİK (86)", "Alıştırma 15 (91)", "6 ETKİNLİK (92)", "Performans G. (103)",
      "Öz değerlendirme (104)", "Alıştırma 16 (108)", "Alıştırma 17 (108)", "Alıştırma 18 (109)", "Alıştırma 19 (110)",
      "Alıştırma 20 (110)", "7. ETKİNLİK (112)", "Alıştırma 21 (115)", "Farklı kaydet (116)", "2. Ünite Ölçme (117)", "E içerik (129)"
    ]
  },
  {
    id: 'u9_3',
    grade: '9. Sınıf',
    title: '3. Ünite: Akışkanlar',
    icon: <Droplets className="w-5 h-5" />,
    header: "9/... SINIFI FİZİK DERSİ 3.ÜNİTE: AKIŞKANLAR",
    outcomes: "FİZ.9.3.1 - FİZ.9.3.5: Akışkanların özellikleri ve temel prensipler",
    columns: [
      "Hazır mısınız (133)", "1.ETKİNLİK (134)", "Değerlendirme (138)", "Alıştırma 1 (140)", "Alıştırma 2 (141)",
      "Alıştırma 3 (141)", "Alıştırma 4 (142)", "Çalışma yaprağı 1 (144)", "2.ETKİNLİK (145)", "Değerlendirme (148)",
      "Alıştırma 5 (151)", "Alıştırma 6 (152)", "Çalışma yaprağı 2 (153)", "3. ETKİNLİK (154)", "Değerlendirme (156)",
      "Alıştırma 7 (159)", "4. ETKİNLİK (161)", "Değerlendirme (163)", "Alıştırma 8 (166)", "Çalışma yaprağı 3 (168)",
      "5. ETKİNLİK (170)", "Değerlendirme (171)", "Performans Görevi (172)", "Alıştırma 9 (174)", "6. ETKİNLİK (176)",
      "Değerlendirme (179)", "Alıştırma 10 (182)", "Çalışma yaprağı 4 (184)", "7. ETKİNLİK (185)", "Değerlendirme (188)",
      "Alıştırma 11 (192)", "Alıştırma 12 (193)", "Çalışma yaprağı 5 (195)", "3. Ünite Ölçme (196)", "E içerik (205)", "AÇIKLAMA", "GENEL DEĞERLENDİRME"
    ]
  },
  {
    id: 'u9_4',
    grade: '9. Sınıf',
    title: '4. Ünite: Enerji',
    icon: <Flame className="w-5 h-5" />,
    header: "9/… SINIFI FİZİK DERSİ 4. ÜNİTE: ENERJİ",
    outcomes: "FİZ.9.4.1 - FİZ.9.4.6: Enerji türleri, dönüşümleri ve korunumu",
    columns: [
      "Üniteye Başlarken (208)", "1.ETKİNLİK (210)", "Alıştırma 1 (214)", "Termometreler ödevi (215)", "Alıştırma 2 (218)",
      "2. ETKİNLİK (220)", "Alıştırma 3 (223)", "Alıştırma 4 (223)", "Alıştırma 5 (223)", "Alıştırma 6 (224)",
      "1.Çalışma yaprağı (224)", "3. ETKİNLİK (227)", "Alıştırma 7 (235)", "Alıştırma 8 (235)", "4.ETKİNLİK (236)",
      "Alıştırma 9 (240)", "Alıştırma 10 (240)", "Alıştırma 11 (241)", "5.ETKİNLİK (241)", "Alıştırma 12 (245)",
      "Alıştırma 13 (245)", "Alıştırma 14 (246)", "6. ETKİNLİK (248)", "Alıştırma 15 (252)", "Performans Görevi (253)",
      "Öz değerlendirme (254)", "4. Ünite Ölçme (255)", "Toplam Puan"
    ]
  },

  // --- 10. SINIF ÜNİTELERİ ---
  {
    id: 'u10_1',
    grade: '10. Sınıf',
    title: '1. Ünite: Hareket',
    icon: <Activity className="w-5 h-5" />,
    header: "10/ ... SINIFI FİZİK DERSİ TEMA1: FİZİK BİLİMİ VE KARİYER KEŞFİ",
    outcomes: "FİZ.10.1.1. Sabit hızlı - 10.1.2. İvmeli - 10.1.3. Grafikler - 10.1.4. Serbest Düşme - 10.1.5. Serbest düşme - 10.1.6. İki boyutta sabit ivmeli",
    columns: [
      "ETKİNLİK 1: Sabit hız", "Değerlendirme", "Sorular", "Çalışma Yaprağı",
      "ETKİNLİK 2: Sabit ivmeli", "Sorular", "Çıkış kartı",
      "ETKİNLİK 3: İvmeli grafik", "Değerlendirme", "Sorular", "Performans görevi",
      "ETKİNLİK 4: Serbest Düşme", "Değerlendirme", "Sorular", "Performans Görevi",
      "ETKİNLİK 1 (B2): Serbest düşme", "Değerlendirme", "Sorular", "Performans görevi",
      "ETKİNLİK 2 (B2): İki boyutta ivmeli", "Değerlendirme", "Sorular"
    ]
  },
  {
    id: 'u10_2',
    grade: '10. Sınıf',
    title: '2. Ünite: Enerji',
    icon: <Zap className="w-5 h-5" />,
    header: "10/ ... SINIFI FİZİK DERSİ TEMA1: FİZİK BİLİMİ VE KARİYER KEŞFİ",
    outcomes: "FİZ.10.2.1. Kuvvet/Yer değ. - 10.2.2. İş enerji - 10.2.3. Enerji biçimleri - 10.2.4. Mekanik - 10.2.5. Enerji kaynakları - 10.2.6. Avantaj/dezavantaj",
    columns: [
      "ETKİNLİK 1: Kuvvet/Yer değ.", "Değerlendirme", "Öz değerlendirme", "Sorular", "Çalışma Yaprağı",
      "ETKİNLİK 2: İş enerji güç", "Değerlendirme", "Deney", "Sorular", "Çalışma yaprağı", "Ders öncesi hzl.",
      "ETKİNLİK 3: Enerji biçimleri", "Değerlendirme", "Sorular", "Performans görevi", "Çalışma yaprağı",
      "ETKİNLİK 4: Mekanik bileşenler", "Değerlendirme",
      "ETKİNLİK 5: Mekanik enerji", "Değerlendirme", "Sorular",
      "ETKİNLİK 6: Düşün eşleş paylaş", "Değerlendirme", "Sorular",
      "ETKİNLİK 7: Kaynakların av/dez", "Değerlendirme", "Sorular", "Performans görevi"
    ]
  },
  {
    id: 'u10_3',
    grade: '10. Sınıf',
    title: '3. Ünite: Elektrik',
    icon: <BookOpen className="w-5 h-5" />,
    header: "10/ ... SINIFI FİZİK DERSİ TEMA1: FİZİK BİLİMİ VE KARİYER KEŞFİ",
    outcomes: "FİZ.10.3.1 - 10.3.6: Basit devreler, Ohm yasası, Direnç/Üreteç, Tehlikeler - FİZ.10.3.7. Topraklamanın önemi",
    columns: [
      "Öndeğerlendirme", "ETKİNLİK 1: Su tes. elk.", "Değerlendirme", "Sorular", "Çalışma Yaprağı",
      "ETKİNLİK 2: Elektrik akımı", "Değerlendirme", "Sorular",
      "ETKİNLİK 3: Devre bileşenleri", "Değerlendirme", "Sorular", "Çalışma yaprağı",
      "DENEY: Dirençlerin bağ.", "Özdeğerlendirme", "Sorular", "Performans görevi", "Sorular (2)",
      "Etkinlik: Akım tehlikeleri", "Değerlendirme", "Sorular",
      "ETKİNLİK 1 (B2): Topraklama", "Değerlendirme", "Sorular"
    ]
  },
  {
    id: 'u10_4',
    grade: '10. Sınıf',
    title: '4. Ünite: Dalgalar',
    icon: <Waves className="w-5 h-5" />,
    header: "10/ ... SINIFI FİZİK DERSİ TEMA1: FİZİK BİLİMİ VE KARİYER KEŞFİ",
    outcomes: "FİZ.10.4.1 - 10.4.6: Dalgalar, Sürat, Yansıma/Kırılma, Rezonans",
    columns: [
      "Öndeğerlendirme", "ETKİNLİK 1: Temel özell.", "Değerlendirme", "Sorular", "Çalışma yaprağı", "Performans hzl.",
      "ETKİNLİK 2: Sınıflandırma", "Değerlendirme", "Çalışma yaprağı",
      "ETKİNLİK 3: Yayılma sürati", "Değerlendirme", "Sorular", "Performans görevi",
      "ETKİNLİK 4: Sarkaç", "Değerlendirme", "Özdeğerlendirme", "Sorular",
      "ETKİNLİK 5: Yansıma/Kırılma", "Değerlendirme", "Sorular", "Çalışma Yaprağı",
      "Etkinlik 6: Rezonans/Deprem", "Değerlendirme", "Sorular",
      "Etkinlik 7: Benim mod.", "Değerlendirme", "Performans görevi", "Özdeğerlendirme"
    ]
  }
];

export function ActivityTrackingTab({ students, currentClass }: {students: Student[], currentClass: Class | null}) {
  const [activeTab, setActiveTab] = useState(unitsData[0].id);
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // Öğrenci listesini prop'lardan alıyoruz
  const classStudents = students || [];

  // Tikleri (checkbox verilerini) state'te tut (Sınıf ID'ye özgü)
  const [checks, setChecks] = useState(() => {
    if (typeof window === 'undefined') {
        return {};
    }
    const saved = localStorage.getItem(`fizik_checks_${currentClass?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Değişiklikleri LocalStorage'a kaydet
  useEffect(() => {
    if (currentClass?.id) {
        localStorage.setItem(`fizik_checks_${currentClass.id}`, JSON.stringify(checks));
    }
  }, [checks, currentClass?.id]);

  const toggleCheck = (unitId: string, studentId: string, colIdx: number) => {
    const key = `${unitId}_${studentId}_${colIdx}`;
    setChecks((prev: any) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleManualSave = () => {
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2000);
  };

  const exportToWord = () => {
    const activeUnit = unitsData.find(u => u.id === activeTab);
    if (!activeUnit) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Calibri', sans-serif; }
          table { border-collapse: collapse; width: 100%; font-size: 10pt; }
          th, td { border: 1px solid #000; padding: 4px; text-align: center; vertical-align: middle; }
          th.name-col { text-align: left; width: 150px; }
          td.name-col { text-align: left; }
        </style>
      </head>
      <body>
        <h2 style="text-align:center; font-size: 14pt;">${activeUnit.header}</h2>
        <p style="font-size: 11pt;"><strong>ÇIKTILAR (İÇERİK+BECERİ):</strong> ${activeUnit.outcomes}</p>
        <table>
          <thead>
            <tr>
              <th>SIRA</th>
              <th class="name-col">ÖĞRENCİ ADI SOYADI</th>
              ${
                activeUnit.columns.map(col => `<th>${col}</th>`).join('')
              }
            </tr>
          </thead>
          <tbody>
            ${classStudents.map((student, index) => `
              <tr>
                <td>${index + 1}</td>
                <td class="name-col">${student.name}</td>
                ${activeUnit.columns.map((_, colIdx) => {
                  const key = activeUnit.id + '_' + student.id + '_' + colIdx;
                  const isChecked = checks[key];
                  return '<td>' + (isChecked ? 'X' : '') + '</td>';
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', tableHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fizik_Takip_${activeUnit.title.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/gi, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const activeUnit = unitsData.find(u => u.id === activeTab);

  if (!currentClass) {
      return <div>Sınıf bilgisi bulunamadı.</div>;
  }

  return (
    <div className="font-sans text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-indigo-900">Etkinlik Takip Çizelgesi</h1>
          <p className="text-sm text-gray-500">{currentClass.name} Sınıfı Öğrenci Etkinlik Takibi</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToWord} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium">
            <Download className="w-4 h-4" />
            Word'e Aktar
          </button>
          <button onClick={handleManualSave} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium">
            <Save className="w-4 h-4" />
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
        <label htmlFor="unit-select" className="font-semibold text-indigo-900 flex items-center gap-2 whitespace-nowrap">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          Ünite Seçimi:
        </label>
        <div className="relative w-full sm:w-auto flex-1">
          <select
            id="unit-select"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full appearance-none p-3 pl-4 pr-10 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 font-medium cursor-pointer"
          >
            <optgroup label="9. Sınıf Üniteleri">
              {unitsData.filter(u => u.grade === '9. Sınıf').map(unit => (
                <option key={unit.id} value={unit.id}>{unit.title}</option>
              ))}
            </optgroup>
            <optgroup label="10. Sınıf Üniteleri">
              {unitsData.filter(u => u.grade === '10. Sınıf').map(unit => (
                <option key={unit.id} value={unit.id}>{unit.title}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-8 pb-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-50 p-4 border-b border-gray-200">
            <h2 className="font-bold text-indigo-900 text-center mb-2">{activeUnit!.header}</h2>
            <div className="text-sm text-indigo-700 bg-indigo-100/50 p-2 rounded border border-indigo-200">
              <strong>ÇIKTILAR (İÇERİK+BECERİ):</strong> {activeUnit!.outcomes}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-3 border-r w-12 text-center font-semibold text-gray-600">SIRA</th>
                  <th className="p-3 border-r w-64 font-semibold text-gray-600">ÖĞRENCİ ADI SOYADI</th>
                  {activeUnit!.columns.map((col, colIdx) => (
                    <th key={colIdx} className="border-r p-2 align-bottom h-48 w-12 bg-gray-50">
                       <div className="writing-vertical text-xs font-medium text-gray-600 tracking-wider flex items-center justify-start space-x-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                         <span>{col}</span>
                       </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student, index) => (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-indigo-50/30 transition">
                    <td className="p-2 border-r text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="p-3 border-r font-medium">
                      {student.name}
                    </td>
                    {activeUnit!.columns.map((_, colIdx) => {
                      const isChecked = checks[`${activeUnit!.id}_${student.id}_${colIdx}`] || false;
                      return (
                        <td key={`${activeUnit!.id}_${student.id}_${colIdx}`} className="p-0 border-r text-center cursor-pointer hover:bg-indigo-100/50" onClick={() => toggleCheck(activeUnit!.id, student.id, colIdx)}>
                          <div className="flex items-center justify-center w-full h-12">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'}`}>
                              {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={activeUnit!.columns.length + 2} className="p-4 text-center text-gray-500">
                      Bu sınıfta henüz öğrenci bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSaveToast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce z-50">
          <Save className="w-5 h-5 text-green-400" />
          Tüm veriler tarayıcıya kaydedildi!
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; padding: 0; }
          .max-w-7xl { max-width: 100%; margin: 0; }
          button, .hide-scrollbar { display: none !important; }
          .shadow-sm { box-shadow: none; border: 1px solid #ccc; }
          input::placeholder { color: transparent; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
