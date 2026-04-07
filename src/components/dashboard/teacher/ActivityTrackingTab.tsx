'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Download, 
  Save, 
  ChevronDown,
  BookOpen,
  Wand2,
  Loader2,
  Share2
} from 'lucide-react';
import { TeacherProfile, Class, Student, Criterion } from '@/lib/types';
import { unitsData } from '@/components/dashboard/teacher/ActivityTrackingTab';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { predictActivityCompletion } from '@/ai/flows/predict-activity-completion-flow';
import { INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from '@/lib/grading-defaults';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


export function ActivityTrackingTab({ students, currentClass, teacherProfile }: {students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null}) {
  const [activeTab, setActiveTab] = useState(unitsData[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const { db } = useAuth();
  const { toast } = useToast();

  const classStudents = useMemo(() => {
    return [...(students || [])].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
  }, [students]);

  const toggleCheck = async (studentId: string, unitId: string, colIdx: number) => {
    if (!db) return;
    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;
    
    const key = `${unitId}_${colIdx}`;
    const newChecks = { ...(studentToUpdate.activityChecks || {}) };
    newChecks[key] = !newChecks[key];

    const studentRef = doc(db, 'students', studentId);
    try {
      await updateDoc(studentRef, { activityChecks: newChecks });
    } catch (error) {
        toast({ title: 'Hata', description: 'Değişiklik kaydedilemedi.', variant: 'destructive'});
    }
  };

   const handleTogglePublish = async (field: 'isActivityTrackingPublished' | 'canStudentEditActivityTracking', checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    try {
        await updateDoc(classRef, { [field]: checked });
        let message = '';
        if (field === 'isActivityTrackingPublished') {
            message = `Etkinlik takibi öğrencilerle ${checked ? 'paylaşıldı' : 'paylaşımı durduruldu'}.`;
        } else {
            message = `Öğrenci düzenlemesine ${checked ? 'izin verildi' : 'izin kaldırıldı'}.`;
        }
        toast({ title: 'Başarılı', description: message });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Yayın durumu değiştirilemedi.' });
    }
  };
  
    const calculateAverageForCriteria = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
        if (!scores || !criteria.length || Object.keys(scores).length === 0) return null;
        const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
        if (totalMax === 0) return 0;
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        return (totalScore / totalMax) * 100;
    };

    const calculateTermAverage = (student: Student, termKey: 'term1Grades' | 'term2Grades', perfCriteria: Criterion[], projCriteria: Criterion[]) => {
        const termGrades = student[termKey];
        if (!termGrades || !teacherProfile) return 0;
        
        const isLiteratureTeacher = teacherProfile.branch === 'Edebiyat' || teacherProfile.branch === 'Türk Dili ve Edebiyatı';
        const getExamAvg = (written?: number, speaking?: number, listening?: number, standard?: number) => {
            if(isLiteratureTeacher) {
                if (written === undefined && speaking === undefined && listening === undefined) return null;
                const w = written !== undefined && written >= 0 ? written : 0;
                const s = speaking !== undefined && speaking >= 0 ? speaking : 0;
                const l = listening !== undefined && listening >= 0 ? listening : 0;
                return (w * 0.7) + (s * 0.15) + (l * 0.15);
            }
            return standard;
        }
        
        const exam1 = getExamAvg(termGrades.writtenExam1, termGrades.speakingExam1, termGrades.listeningExam1, termGrades.exam1);
        const exam2 = getExamAvg(termGrades.writtenExam2, termGrades.speakingExam2, termGrades.listeningExam2, termGrades.exam2);

        const perf1 = termGrades.perf1 ?? calculateAverageForCriteria(termGrades.scores1, perfCriteria);
        const perf2 = termGrades.perf2 ?? calculateAverageForCriteria(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? (termGrades.projectGrade ?? calculateAverageForCriteria(termGrades.projectScores, projCriteria)) : null;

        const allScores = [exam1, exam2, perf1, perf2, projAvg].filter(
          (score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0
        );
        
        if (allScores.length === 0) return 0;
        
        const sum = allScores.reduce((acc, score) => acc + score, 0);
        return sum / allScores.length;
    };

    const handleAiFill = async () => {
        if (!teacherProfile || !activeUnit) {
            toast({ title: 'Hata', description: 'Öğretmen profili veya aktif ünite yüklenemedi.', variant: 'destructive'});
            return;
        }
        setIsGenerating(true);
        const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
        const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    
        const studentProfiles = classStudents.map(student => ({
            id: student.id,
            name: student.name,
            term1Average: calculateTermAverage(student, 'term1Grades', perfCriteria, projCriteria),
            term2Average: calculateTermAverage(student, 'term2Grades', perfCriteria, projCriteria),
            behaviorScore: student.behaviorScore || 100
        }));
    
        const activityList = activeUnit.columns;
    
        try {
            const predictions = await predictActivityCompletion({
                students: studentProfiles,
                activities: activityList,
            });
            
            if (!db) return;
            const batch = writeBatch(db);

            for (const studentId in predictions) {
                if (predictions.hasOwnProperty(studentId)) {
                    const studentToUpdate = students.find(s => s.id === studentId);
                    if (!studentToUpdate) continue;

                    const newChecks = { ...(studentToUpdate.activityChecks || {}) };
                    const activityIndexes = predictions[studentId];

                    if (Array.isArray(activityIndexes)) {
                        for (const activityIndex of activityIndexes) {
                            const key = `${activeUnit.id}_${activityIndex}`;
                            newChecks[key] = true;
                        }
                    }
                    const studentRef = doc(db, 'students', studentId);
                    batch.update(studentRef, { activityChecks: newChecks });
                }
            }
            await batch.commit();
    
            toast({ title: 'AI Otomatik Doldurma Tamamlandı!', description: `${Object.keys(predictions).length} öğrenci için tahminler işaretlendi.` });
    
        } catch (error) {
            console.error("AI Fill Error:", error);
            toast({ title: 'Hata', description: 'Yapay zeka ile doldurma işlemi başarısız oldu.', variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch id="publish-switch" checked={currentClass.isActivityTrackingPublished} onCheckedChange={(checked) => handleTogglePublish('isActivityTrackingPublished', checked)} />
            <Label htmlFor="publish-switch">Paylaş</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="edit-switch" checked={currentClass.canStudentEditActivityTracking} onCheckedChange={(checked) => handleTogglePublish('canStudentEditActivityTracking', checked)} disabled={!currentClass.isActivityTrackingPublished}/>
            <Label htmlFor="edit-switch">Öğrenci Düzenlesin</Label>
          </div>
          <button onClick={handleAiFill} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium" disabled={isGenerating}>
             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
             AI ile Doldur
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
                {classStudents.map((student, index) => {
                  const isCurrentUser = student.id === appUser?.data.uid;
                  return (
                  <tr key={student.id} className="border-b border-gray-100 hover:bg-indigo-50/30 transition">
                    <td className="p-2 border-r text-center text-gray-500 font-medium">{index + 1}</td>
                    <td className="p-3 border-r font-medium">
                      {student.name}
                    </td>
                    {activeUnit!.columns.map((_, colIdx) => {
                      const key = `${activeUnit!.id}_${colIdx}`;
                      const isChecked = student.activityChecks?.[key] || false;
                      return (
                        <td key={`${key}-${student.id}`} className="p-0 border-r text-center cursor-pointer hover:bg-indigo-100/50" onClick={() => toggleCheck(student.id, activeUnit!.id, colIdx)}>
                          <div className="flex items-center justify-center w-full h-12">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-gray-300'}`}>
                              {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                )})}
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
    </div>
  );
}

// Helper to define static data for units.
// This data could also be fetched from a database or a JSON file.
export const unitsData = [
  // --- 9. SINIF ÜNİTELERİ ---
  {
    id: 'u9_1',
    grade: '9. Sınıf',
    title: '1. Ünite: Fizik Bilimi ve Kariyer Keşfi',
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
