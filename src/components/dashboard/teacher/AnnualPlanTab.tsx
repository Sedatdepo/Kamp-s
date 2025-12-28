'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, Trash2, Save, X, ArrowDown, Download, Upload,
  PlusCircle, FileText, Settings, Calendar, Eraser, List, BookOpen, RefreshCw, Check, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatabase } from '@/hooks/use-database';
import type { AnnualPlan, AnnualPlanEntry, DailyPlan, TeacherProfile, Class } from '@/lib/types';
import { MOCK_CURRICULUM } from '@/lib/mock-curriculum';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { exportDailyPlanToRtf, exportAnnualPlanToRtf } from '@/lib/word-export';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';


// --- YARDIMCI BİLEŞENLER ---
const AutoResizingTextarea = ({ value, onChange, className, minHeight = "40px", ...props }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                        }
                          }, [value]);
                            return <textarea ref={textareaRef} value={value} onChange={onChange} className={`${className} overflow-hidden resize-none`} style={{ minHeight: minHeight }} {...props} />;
                            };

const QuickAddButtons = ({ items, onAdd }: any) => {
  return (
      <div className="flex flex-wrap gap-1 mt-1 print:hidden">
            <span className="text-[10px] text-gray-400 font-bold mr-1 self-center">HIZLI EKLE:</span>
                  {items.map((item: string, idx: number) => (
                          <button key={idx} onClick={() => onAdd(item)} className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-700 rounded border border-gray-200 transition flex items-center gap-1">
                                    <PlusCircle size={10} /> {item}
                                            </button>
                                                  ))}
                                                      </div>
                                                        );
                                                        };

// --- KONTROL PANELİ MODALI ---
const ControlPanelModal = ({
    isOpen, onClose, stats, activePlan,
    onAddSpecialRow, onInsertEmptyRow, onResetProgress, onOpenDailyPlan,
    onImportCurriculum, onDistributeDates
}: any) => {
    if (!isOpen || !activePlan) return null;

    const [selectedCurriculum, setSelectedCurriculum] = useState("Fizik 9. Sınıf");
    const [startDate, setStartDate] = useState("2025-09-08"); // Varsayılan Pazartesi
    const [keepHolidays, setKeepHolidays] = useState(false);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="text-blue-600" /> Plan Yönetim Merkezi
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Müfredat yükleme, tarih güncelleme ve plan takibi</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* SOL SÜTUN: OTOMASYON VE YENİ YIL AYARLARI */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* TARİH ROBOTU (YENİ YIL UYARLAMA) */}
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><RefreshCw size={64} className="text-orange-500" /></div>
                            <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-4 flex items-center gap-2 relative z-10">
                                <RefreshCw size={16} /> Yılı Güncelle
                            </h3>
                            <p className="text-[10px] text-orange-700 mb-3 relative z-10">
                                Planı seneye mi taşıyacaksınız? Yeni eğitim yılı başlangıcını seçin, konuları koruyup tarihleri yeniden dağıtalım.
                            </p>
                            <div className="mb-3 relative z-10">
                                <label className="text-[10px] font-bold text-orange-600 block mb-1">Yeni Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    className="w-full p-2 text-sm border border-orange-200 rounded bg-white focus:ring-2 focus:ring-orange-300 outline-none"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="mb-4 relative z-10 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="keepHolidays"
                                    className="rounded text-orange-600 focus:ring-orange-500"
                                    checked={keepHolidays}
                                    onChange={(e) => setKeepHolidays(e.target.checked)}
                                />
                                <label htmlFor="keepHolidays" className="text-[10px] text-orange-700 font-medium cursor-pointer">
                                    Eski tatil satırlarını koru (Tarihleri kayar)
                                </label>
                            </div>
                            <button
                                onClick={() => { onDistributeDates(startDate, keepHolidays); onClose(); }}
                                className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold transition shadow-sm relative z-10"
                            >
                                Tarihleri Yeniden Hesapla
                            </button>
                        </div>
                        {/* MÜFREDAT SİHİRBAZI */}
                        <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                            <h3 className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <BookOpen size={16} /> Müfredat Sihirbazı
                            </h3>
                            <p className="text-[10px] text-indigo-600 mb-3">Ders seçin, konular otomatik gelsin.</p>
                            <select
                                className="w-full p-2 mb-3 text-sm border border-indigo-200 rounded bg-white"
                                value={selectedCurriculum}
                                onChange={(e) => setSelectedCurriculum(e.target.value)}
                            >
                                {Object.keys(MOCK_CURRICULUM).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => { onImportCurriculum(selectedCurriculum); onClose(); }}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition shadow-sm"
                            >
                                Seçili Müfredatı Ekle
                            </button>
                        </div>
                        {/* HIZLI EKLEME ARAÇLARI */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={16} /> Tatil Ekle
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onAddSpecialRow('ARA TATİL', '1. ARA TATİL')} className="p-2 bg-white border hover:bg-yellow-50 text-xs font-medium rounded text-left">1. Ara Tatil</button>
                                <button onClick={() => onAddSpecialRow('YARIYIL', 'YARIYIL TATİLİ')} className="p-2 bg-white border hover:bg-blue-50 text-xs font-medium rounded text-left">Yarıyıl Tatili</button>
                                <button onClick={() => onAddSpecialRow('ARA TATİL', '2. ARA TATİL')} className="p-2 bg-white border hover:bg-yellow-50 text-xs font-medium rounded text-left">2. Ara Tatil</button>
                                <button onClick={() => onAddSpecialRow('RESMİ TATİL', 'RESMİ TATİL')} className="p-2 bg-white border hover:bg-red-50 text-xs font-medium rounded text-left">Resmi Tatil</button>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                <button onClick={onInsertEmptyRow} className="w-full p-2 bg-white border hover:bg-gray-100 text-xs font-medium rounded text-left flex items-center gap-2">
                                    <ArrowDown size={14} /> Boş Hafta Ekle
                                </button>
                                <button onClick={onResetProgress} className="w-full p-2 bg-white border hover:bg-red-50 text-xs font-medium rounded text-left flex items-center gap-2 text-red-600">
                                    <Eraser size={14} /> İlerlemeyi Sıfırla
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ SÜTUN: HAFTALIK PLAN LİSTESİ */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <List size={18} className="text-teal-600" /> Haftalık Plan Arşivi
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{stats.totalWeeks} Hafta</span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">%{stats.percentage} Tamamlandı</span>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[600px] p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-3 border-b">Hafta / Tarih</th>
                                            <th className="p-3 border-b">Konu & Kazanım</th>
                                            <th className="p-3 border-b text-right">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {activePlan.rows.map((row: any, index: number) => (
                                            <tr key={row.id} className={`hover:bg-teal-50 transition group ${row.isSpecial ? 'bg-orange-50/50' : ''}`}>
                                                <td className="p-3 align-top w-[20%]">
                                                    <div className="font-bold text-gray-700 whitespace-pre-line">{row.hafta || "Tarih Bekleniyor"}</div>
                                                    <div className="text-xs text-gray-400 mt-1">{index + 1}. Hafta</div>
                                                </td>
                                                <td className="p-3 align-top w-[60%]">
                                                    <div className="font-bold text-teal-700 mb-1">{row.unite}</div>
                                                    <div className="text-gray-800 font-medium mb-1">{row.konu || "Konu Girilmemiş"}</div>
                                                    <div className="text-xs text-gray-500 line-clamp-2">{row.cikti || "Kazanım Girilmemiş"}</div>
                                                </td>
                                                <td className="p-3 align-middle text-right w-[20%]">
                                                    <button
                                                        onClick={() => { onOpenDailyPlan(row); onClose(); }}
                                                        className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-600 hover:text-white transition shadow-sm text-xs font-bold"
                                                    >
                                                        <FileText size={14} /> Planı Aç
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {activePlan.rows.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-gray-400">Henüz plan satırı yok. Müfredat Sihirbazı ile veri yükleyin.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DailyPlanEditor = ({ row, plan, onSave, onBack, onExport }: { row: AnnualPlanEntry, plan: AnnualPlan, onSave: Function, onBack: Function, onExport: Function }) => {
    const { toast } = useToast();
    const [dailyPlan, setDailyPlan] = useState<DailyPlan>(row.dailyPlan || {
        id: `dp-${row.id}`,
        date: row.hafta,
        konu: row.konu,
        kazanim: row.cikti,
        materyal: plan.rows.find(r => r.id === row.id)?.arac || 'Ders Kitabı, EBA',
        plan: {
            giris: 'Giriş Bölümü',
            gelisme: 'Gelişme Bölümü',
            sonuc: 'Sonuç Bölümü'
        },
        degerlendirme: plan.rows.find(r => r.id === row.id)?.degerlendirme || 'Soru-cevap'
    });

    const updateField = (field: keyof DailyPlan, value: string) => {
        setDailyPlan(prev => ({...prev, [field]: value}));
    };
    
    const updatePlanPart = (part: keyof DailyPlan['plan'], value: string) => {
        setDailyPlan(prev => ({...prev, plan: {...prev.plan, [part]: value}}));
    };

    const addQuickText = (field: 'materyal' | 'degerlendirme' | 'plan.giris' | 'plan.gelisme' | 'plan.sonuc', text: string) => {
        if (field.startsWith('plan.')) {
            const part = field.split('.')[1] as keyof DailyPlan['plan'];
            setDailyPlan(prev => ({ ...prev, plan: { ...prev.plan, [part]: prev.plan[part] ? `${prev.plan[part]}, ${text}` : text } }));
        } else {
            setDailyPlan(prev => ({ ...prev, [field]: prev[field] ? `${prev[field]}, ${text}` : text }));
        }
    };
    
    const handleExport = () => {
        if (!plan.dailyPlanSettings.okul || !plan.dailyPlanSettings.mudur) {
            toast({variant: 'destructive', title: 'Lütfen önce Yıllık Plan Ayarlarından okul ve müdür adını girin.'});
            return;
        }
        onExport(dailyPlan);
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <Button onClick={() => onBack()} variant="ghost" className="mb-6 md:mb-0">
                    <ArrowLeft className="mr-2" /> Yıllık Plana Geri Dön
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => handleExport()}>
                        <Download className="mr-2"/> Word Olarak İndir
                    </Button>
                    <Button onClick={() => onSave(dailyPlan)}>
                        <Save className="mr-2"/> Günlük Planı Kaydet
                    </Button>
                </div>
            </div>
            
             <div className="mt-6 border-b pb-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Günlük Plan Detayları</h2>
                <p className="text-gray-500 text-sm">Hafta: {row.hafta} | Ünite: {row.unite}</p>
            </div>
            
            <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-bold text-gray-600">Konu</label>
                        <AutoResizingTextarea value={dailyPlan.konu} onChange={(e: any) => updateField('konu', e.target.value)} className="w-full p-2 border rounded mt-1 bg-gray-50"/>
                    </div>
                    <div>
                        <label className="font-bold text-gray-600">Kazanımlar</label>
                        <AutoResizingTextarea value={dailyPlan.kazanim} onChange={(e: any) => updateField('kazanim', e.target.value)} className="w-full p-2 border rounded mt-1 bg-gray-50"/>
                    </div>
                </div>
                <div>
                    <label className="font-bold text-gray-600">Giriş Bölümü (İlgi Çekme, Güdüleme)</label>
                    <AutoResizingTextarea value={dailyPlan.plan.giris} onChange={(e: any) => updatePlanPart('giris', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                    <QuickAddButtons items={['Önceki dersin tekrarı', 'Beyin fırtınası', 'Soru-cevap']} onAdd={(text: string) => addQuickText('plan.giris', text)} />
                </div>
                 <div>
                    <label className="font-bold text-gray-600">Gelişme Bölümü (Konu Anlatımı, Etkinlikler)</label>
                    <AutoResizingTextarea value={dailyPlan.plan.gelisme} onChange={(e: any) => updatePlanPart('gelisme', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                    <QuickAddButtons items={['Anlatım', 'Gösteri', 'Problem çözme', 'Grup çalışması']} onAdd={(text: string) => addQuickText('plan.gelisme', text)} />
                </div>
                 <div>
                    <label className="font-bold text-gray-600">Sonuç Bölümü (Özet, Tekrar)</label>
                    <AutoResizingTextarea value={dailyPlan.plan.sonuc} onChange={(e: any) => updatePlanPart('sonuc', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                     <QuickAddButtons items={['Özet', 'Değerlendirme', 'Gelecek konuya hazırlık']} onAdd={(text: string) => addQuickText('plan.sonuc', text)} />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="font-bold text-gray-600">Materyal & Araç-Gereç</label>
                        <AutoResizingTextarea value={dailyPlan.materyal} onChange={(e: any) => updateField('materyal', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                         <QuickAddButtons items={['Ders Kitabı', 'EBA', 'Akıllı Tahta', 'Çalışma Kağıdı']} onAdd={(text: string) => addQuickText('materyal', text)} />
                    </div>
                    <div>
                        <label className="font-bold text-gray-600">Ölçme & Değerlendirme</label>
                        <AutoResizingTextarea value={dailyPlan.degerlendirme} onChange={(e: any) => updateField('degerlendirme', e.target.value)} className="w-full p-2 border rounded mt-1"/>
                         <QuickAddButtons items={['Soru-Cevap', 'Çalışma Kağıdı', 'Gözlem Formu', 'Kısa Sınav']} onAdd={(text: string) => addQuickText('degerlendirme', text)} />
                    </div>
                </div>
            </div>
        </div>
    );
};


export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
    const { db, setDb, loading } = useDatabase();
    const { toast } = useToast();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    
    const [activePlanId, setActivePlanId] = useState<number | null>(null);
    const [activeRow, setActiveRow] = useState<AnnualPlanEntry | null>(null);

    const searchParams = useSearchParams();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && db.annualPlans.length > 0) {
            const planIdFromUrl = searchParams.get('planId');
            if (planIdFromUrl && db.annualPlans.find(p => p.id === parseInt(planIdFromUrl))) {
                setActivePlanId(parseInt(planIdFromUrl));
            } else if (!activePlanId) {
                setActivePlanId(db.annualPlans[0].id);
            }
        }
    }, [db.annualPlans, loading, activePlanId, searchParams]);

    const activePlan = useMemo(() => {
        if (!activePlanId) return null;
        return db.annualPlans.find(p => p.id === activePlanId);
    }, [activePlanId, db.annualPlans]);

    const updatePlan = (updatedPlan: AnnualPlan) => {
        setDb(prevDb => ({
            ...prevDb,
            annualPlans: prevDb.annualPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p)
        }));
    };

    const updateRow = useCallback((rowId: string, updatedFields: Partial<AnnualPlanEntry>) => {
        if (!activePlan) return;
        const newRows = activePlan.rows.map(r => r.id === rowId ? { ...r, ...updatedFields } : r);
        updatePlan({ ...activePlan, rows: newRows });
    }, [activePlan, updatePlan]);
    
    const stats = useMemo(() => {
        if (!activePlan) return { totalWeeks: 0, completedWeeks: 0, percentage: 0 };
        const total = activePlan.rows.filter(r => !r.isSpecial).length;
        if (total === 0) return { totalWeeks: 0, completedWeeks: 0, percentage: 0 };
        const completed = activePlan.rows.filter(r => r.isDone && !r.isSpecial).length;
        const percentage = Math.round((completed / total) * 100);
        return {
            totalWeeks: total,
            completedWeeks: completed,
            percentage: isNaN(percentage) ? 0 : percentage
        };
    }, [activePlan]);

    const addPlan = (title: string) => {
        const newPlan: AnnualPlan = {
            id: Date.now(),
            title: title || 'Yeni Yıllık Plan',
            rows: [],
            dailyPlanSettings: {
                okul: teacherProfile?.schoolName || "Okul Adı",
                mudur: teacherProfile?.principalName || "Müdür Adı",
                ogretmen: teacherProfile?.name || "Öğretmen Adı",
                ders: teacherProfile?.branch || "Ders Adı",
            }
        };
        setDb(prev => ({ ...prev, annualPlans: [...prev.annualPlans, newPlan] }));
        setActivePlanId(newPlan.id);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!activePlan) return;
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const newRows: AnnualPlanEntry[] = json.slice(1).map((row, index) => ({
                    id: `${activePlan.id}-${Date.now()}-${index}`,
                    hafta: String(row[0] || ''),
                    saat: String(row[1] || '2'),
                    unite: String(row[2] || ''),
                    konu: String(row[3] || ''),
                    cikti: String(row[4] || ''),
                    yontem: String(row[5] || ''),
                    arac: String(row[6] || ''),
                    degerlendirme: String(row[7] || ''),
                    isDone: false,
                    isSpecial: false,
                    dailyPlan: null,
                }));
                
                const updatedPlan = { ...activePlan, rows: [...activePlan.rows, ...newRows] };
                updatePlan(updatedPlan);
                toast({ title: 'Plan İçe Aktarıldı', description: `${newRows.length} hafta başarıyla eklendi.` });

            } catch (error) {
                console.error("Error parsing file:", error);
                toast({ variant: 'destructive', title: 'Dosya Okuma Hatası', description: 'Seçilen dosya geçerli bir formatta değil.' });
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    };

    const handleExportPlan = () => {
        if (!activePlan || !currentClass || !teacherProfile) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Dışa aktarılacak aktif bir plan veya sınıf yok.' });
            return;
        }
        exportAnnualPlanToRtf({
            annualPlan: activePlan,
            currentClass: currentClass,
            teacherProfile: teacherProfile
        });
    };
    
    const onOpenDailyPlan = (row: AnnualPlanEntry) => {
        setActiveRow(row);
    };

    const handleSaveDailyPlan = (dailyPlan: DailyPlan) => {
        if (!activePlan || !activeRow) return;
        const updatedRows = activePlan.rows.map(r => r.id === activeRow.id ? {...r, dailyPlan: dailyPlan, konu: dailyPlan.konu, cikti: dailyPlan.kazanim, arac: dailyPlan.materyal, degerlendirme: dailyPlan.degerlendirme } : r);
        updatePlan({...activePlan, rows: updatedRows});
        toast({title: 'Günlük plan kaydedildi!'});
    };

    const handleExportDailyPlan = (dailyPlan: DailyPlan) => {
        if (!activePlan || !activeRow || !currentClass || !teacherProfile) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Rapor oluşturmak için gerekli veriler eksik.' });
            return;
        }
        exportDailyPlanToRtf({
            dailyPlan,
            annualPlanEntry: activeRow,
            currentClass: currentClass,
            teacherProfile: teacherProfile,
        });
    }
    
    const onImportCurriculum = (curriculumName: keyof typeof MOCK_CURRICULUM) => {
        if (!activePlan) return;
        const curriculum = MOCK_CURRICULUM[curriculumName];
        const newRows = curriculum.map((item, index) => ({
            id: `${activePlan.id}-${Date.now()}-${index}`,
            hafta: '',
            saat: item.saat,
            unite: item.unite,
            konu: item.konu,
            cikti: item.kazanim,
            yontem: '',
            arac: '',
            degerlendirme: '',
            isDone: false,
            isSpecial: false,
            dailyPlan: null,
        }));
        const updatedPlan = { ...activePlan, rows: [...activePlan.rows, ...newRows] };
        updatePlan(updatedPlan);
        toast({ title: 'Müfredat Eklendi', description: `${newRows.length} konu ve kazanım plana eklendi.` });
    };

    const onDistributeDates = (startDateStr: string, keepHolidays: boolean) => {
        if (!activePlan) return;

        let currentDate = new Date(startDateStr);
        // Haftanın ilk günü Pazartesi değilse, bir sonraki Pazartesi'ye git
        while (currentDate.getDay() !== 1) { 
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const newRows = activePlan.rows.map(row => {
            if (row.isSpecial && !keepHolidays) {
                return null; // Tatilleri koruma seçeneği kapalıysa tatilleri sil
            }
            return { ...row, hafta: '' }; // Tüm tarihleri sıfırla
        }).filter(Boolean) as AnnualPlanEntry[];


        let weekIndex = 0;
        for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            if (row.isSpecial) continue; // Tatil satırlarını atla

            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() + (weekIndex * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 4);

            row.hafta = `${weekStart.toLocaleDateString('tr-TR')} - ${weekEnd.toLocaleDateString('tr-TR')}`;
            weekIndex++;
        }

        const updatedPlan = { ...activePlan, rows: newRows };
        updatePlan(updatedPlan);
        toast({ title: 'Tarihler Yenilendi', description: 'Tüm haftaların tarihleri güncellendi.' });
    };

    const onAddSpecialRow = (type: string, content: string) => {
        if (!activePlan) return;
        const newRow: AnnualPlanEntry = {
            id: `special-${Date.now()}`,
            isSpecial: true,
            isDone: true,
            hafta: type,
            unite: content,
            konu: '', cikti: '', saat: '', yontem: '', arac: '', degerlendirme: '', dailyPlan: null
        };
        const updatedPlan = { ...activePlan, rows: [...activePlan.rows, newRow] };
        updatePlan(updatedPlan);
    };

    const onInsertEmptyRow = (index?: number) => {
        if (!activePlan) return;
        const newRow: AnnualPlanEntry = {
            id: `empty-${Date.now()}`,
            isSpecial: false, isDone: false, hafta: '', saat: '2', unite: 'Ekstra Hafta',
            konu: '', cikti: '', yontem: '', arac: '', degerlendirme: '', dailyPlan: null
        };
        const newRows = [...activePlan.rows];
        newRows.splice(index !== undefined ? index : newRows.length, 0, newRow);
        updatePlan({ ...activePlan, rows: newRows });
    };

    const onResetProgress = () => {
        if (!activePlan) return;
        const newRows = activePlan.rows.map(row => ({ ...row, isDone: false }));
        updatePlan({ ...activePlan, rows: newRows });
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
    }

    if (!activePlan) {
        if (db.annualPlans.length === 0) {
            return (
                <div className="flex h-screen items-center justify-center text-center p-8">
                    <div className="bg-white p-12 rounded-2xl shadow-lg border border-gray-100 max-w-lg">
                        <List size={48} className="mx-auto text-blue-500 mb-6" />
                        <h1 className="text-3xl font-bold text-gray-800">Yıllık Plan Oluşturucuya Hoş Geldiniz</h1>
                        <p className="text-gray-500 mt-4 mb-8">
                            Ders planlarınızı kolayca oluşturun, yönetin ve dışa aktarın. Başlamak için ilk yıllık planınızı oluşturun.
                        </p>
                        <Button size="lg" onClick={() => addPlan('Yeni Yıllık Plan')}>
                            <PlusCircle className="mr-2" /> İlk Planını Oluştur
                        </Button>
                    </div>
                </div>
            )
        }
        return <div className="flex h-screen items-center justify-center">Aktif plan bulunamadı. Lütfen bir plan seçin veya oluşturun.</div>
    }

    if (activeRow) {
        return <DailyPlanEditor 
            row={activeRow} 
            plan={activePlan} 
            onSave={handleSaveDailyPlan} 
            onBack={() => setActiveRow(null)}
            onExport={handleExportDailyPlan}
        />;
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <Suspense fallback={<div>Yükleniyor...</div>}>
                <ControlPanelModal
                    isOpen={isPanelOpen}
                    onClose={() => setIsPanelOpen(false)}
                    stats={stats}
                    activePlan={activePlan}
                    onAddSpecialRow={onAddSpecialRow}
                    onInsertEmptyRow={onInsertEmptyRow}
                    onResetProgress={onResetProgress}
                    onOpenDailyPlan={onOpenDailyPlan}
                    onImportCurriculum={onImportCurriculum}
                    onDistributeDates={onDistributeDates}
                />
            </Suspense>
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
            />
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Yıllık Plan: {activePlan?.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Ders planlarınızı düzenleyin ve takip edin.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsPanelOpen(true)}>
                        <Settings className="mr-2" />
                        Yönetim Paneli
                    </Button>
                     <Button variant="outline" onClick={handleExportPlan}>
                        <Download className="mr-2" />
                        Planı İndir (RTF)
                    </Button>
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2" />
                        İçe Aktar (.xlsx)
                    </Button>
                </div>
            </div>

            {/* Plan Tablosu */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Hafta</th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Ünite</th>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Konu & Kazanım</th>
                                <th className="p-4 w-32 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            {activePlan.rows.length > 0 ? activePlan.rows.map((row, index) => (
                                <tr key={row.id} className={`group ${row.isSpecial ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <td className="p-4 text-center">
                                        {!row.isSpecial && (
                                            <Checkbox
                                                checked={row.isDone}
                                                onCheckedChange={(checked) => updateRow(row.id, { isDone: !!checked })}
                                                aria-label="Haftayı tamamlandı olarak işaretle"
                                            />
                                        )}
                                    </td>
                                    <td className="p-4 align-top">
                                        <AutoResizingTextarea value={row.hafta} onChange={(e: any) => updateRow(row.id, { hafta: e.target.value })} className="w-full bg-transparent p-1 focus:bg-white focus:ring-1 ring-blue-400 rounded" placeholder="Tarih aralığı"/>
                                    </td>
                                    <td className="p-4 align-top">
                                        <AutoResizingTextarea value={row.unite} onChange={(e: any) => updateRow(row.id, { unite: e.target.value })} className="w-full bg-transparent p-1 focus:bg-white focus:ring-1 ring-blue-400 rounded" placeholder="Ünite Adı"/>
                                    </td>
                                    <td className="p-4 align-top">
                                        <AutoResizingTextarea value={row.konu} onChange={(e: any) => updateRow(row.id, { konu: e.target.value })} className="w-full bg-transparent p-1 font-semibold focus:bg-white focus:ring-1 ring-blue-400 rounded" placeholder="Konu Adı"/>
                                        <AutoResizingTextarea value={row.cikti} onChange={(e: any) => updateRow(row.id, { cikti: e.target.value })} className="w-full bg-transparent p-1 text-sm text-gray-500 mt-1 focus:bg-white focus:ring-1 ring-blue-400 rounded" placeholder="Kazanımlar"/>
                                    </td>
                                    <td className="p-4 text-center align-middle">
                                        {!row.isSpecial && (
                                            <Button variant="outline" size="sm" onClick={() => onOpenDailyPlan(row)}>
                                                <FileText className="mr-2 h-4 w-4"/> Aç
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Yıllık plan tablosu burada görünecek. Başlamak için "Yönetim Paneli" üzerinden müfredat yükleyin.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
