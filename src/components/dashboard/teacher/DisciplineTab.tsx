'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, FileDown, Save, Trash2, History, UserPlus } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { DisciplineRecord, TeacherProfile, Student, Class } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RecordManager } from './RecordManager';

// --- YÖNETMELİK MADDELERİ ---
const DISCIPLINE_ARTICLES = [
    {
        article: "Madde 164/1 - Kınama Cezasını Gerektiren Davranışlar",
        behaviors: [
            { value: "164_1_a", label: "Okulu, okulun eşyasını ve çevresini kirletmek" },
            { value: "164_1_b", label: "Yönetici, öğretmen veya okulun diğer personeline ve arkadaşlarına kaba ve saygısız davranmak" },
            { value: "164_1_c", label: "Dersin ve ders dışı faaliyetlerin akışını ve düzenini bozacak davranışlarda bulunmak" },
            { value: "164_1_d", label: "Okul personeli ve arkadaşlarını rahatsız edecek nitelikte her türlü söz ve davranışta bulunmak" },
        ]
    },
    {
        article: "Madde 164/2 - Okuldan Kısa Süreli Uzaklaştırma (1-5 Gün)",
        behaviors: [
            { value: "164_2_a", label: "Kavga etmek, başkalarına fiili şiddet uygulamak" },
            { value: "164_2_b", label: "Okul personeline veya arkadaşlarına hakaret etmek, küfretmek" },
            { value: "164_2_c", label: "Okul eşyasına kasıtlı olarak zarar vermek" },
            { value: "164_2_d", label: "Kopya çekmek veya kopya vermek" },
        ]
    },
    {
        article: "Madde 164/3 - Okul Değişikliği",
        behaviors: [
            { value: "164_3_a", label: "Öğretmene, personele fiili saldırıda bulunmak" },
            { value: "164_3_b", label: "Yaralayıcı, öldürücü aletler bulundurmak, taşımak" },
            { value: "164_3_c", label: "Zorbalık yapmak, zorla para toplamak" },
        ]
    },
    {
        article: "Madde 164/4 - Örgün Eğitim Dışına Çıkarma",
        behaviors: [
            { value: "164_4_a", label: "Uyuşturucu madde ticareti yapmak veya kullanmak" },
            { value: "164_4_b", label: "Okul güvenliğini ciddi şekilde tehlikeye atmak" },
            { value: "164_4_c", label: "Silah kullanmak, başkasını ciddi şekilde yaralamak" },
        ]
    }
];

const PhaseIndicator = ({ currentPhase }: { currentPhase: number }) => {
    const phases = [
        "Olay Tespiti",
        "Savunma & Değerlendirme",
        "Kurula Sevk",
        "Kurul Toplantısı",
        "Karar ve Tebliğ"
    ];

    return (
        <div className="flex justify-between items-start my-8 relative">
            <div className="absolute top-5 left-0 w-full h-1 bg-gray-200" />
            <div className="absolute top-5 left-0 h-1 bg-blue-600 transition-all" style={{ width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%` }} />
            {phases.map((phase, index) => {
                const phaseNumber = index + 1;
                const isCompleted = phaseNumber < currentPhase;
                const isActive = phaseNumber === currentPhase;
                return (
                    <div key={phaseNumber} className="z-10 text-center w-32">
                        <div className={cn("mx-auto w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all",
                            isCompleted ? "bg-green-500" : isActive ? "bg-blue-600 scale-110" : "bg-gray-300"
                        )}>
                            {isCompleted ? '✓' : phaseNumber}
                        </div>
                        <p className={cn("text-xs mt-2", isActive ? "text-blue-600 font-semibold" : "text-gray-500")}>
                            {phase}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

export function DisciplineTab({ students, currentClass, teacherProfile }: { students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
    const { db: localDb, setDb } = useDatabase();
    const { disciplineRecords = [] } = localDb;
    const { toast } = useToast();

    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveName, setSaveName] = useState('');

    const createNewRecord = useCallback((): DisciplineRecord => ({
        id: `discipline_${Date.now()}`,
        name: 'Yeni Disiplin Süreci',
        date: new Date().toISOString(),
        classId: currentClass?.id,
        currentPhase: 1,
        formData: { 
            studentInfo: { schoolName: teacherProfile?.schoolName || '' },
            phase1Data: { teacherName: teacherProfile?.name || ''},
            incidentDate: '',
            incidentTime: '',
            location: '',
            description: '',
            witnesses: '',
            evidence: '',
        }
    }), [currentClass?.id, teacherProfile]);

    const [currentRecord, setCurrentRecord] = useState<DisciplineRecord>(createNewRecord());
    
    const phase = currentRecord?.currentPhase || 1;
    const formData = currentRecord?.formData || {};

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));
    }, [students]);

    useEffect(() => {
        if(selectedRecordId) {
            const record = disciplineRecords.find(r => r.id === selectedRecordId);
            setCurrentRecord(record || createNewRecord());
        } else {
            setCurrentRecord(createNewRecord());
        }
    }, [selectedRecordId, disciplineRecords, createNewRecord]);


    const updateCurrentRecord = useCallback((data: Partial<DisciplineRecord['formData']>, newPhase?: number) => {
        setCurrentRecord(prev => ({
            ...prev,
            currentPhase: newPhase || prev.currentPhase,
            formData: {
                ...prev.formData,
                ...data
            }
        }));
    }, []);

    const handleNextPhase = (currentPhaseData: any) => {
        updateCurrentRecord(currentPhaseData, phase + 1);
    };
    
    const handlePrevPhase = () => {
        setCurrentRecord(prev => ({...prev, currentPhase: Math.max(prev.currentPhase - 1, 1)}));
    };

    const saveProcess = () => {
        if (!formData.studentInfo?.studentName) {
            toast({ title: "Hata", description: "Lütfen önce öğrenci bilgilerini girin.", variant: "destructive" });
            return;
        }
        setSaveName(currentRecord?.name || `Disiplin Süreci - ${formData.studentInfo.studentName}`);
        setIsSaveDialogOpen(true);
    };

    const handleSaveConfirm = () => {
        const recordToSave: DisciplineRecord = {
            ...currentRecord,
            name: saveName,
            date: new Date().toISOString(),
        };

        setDb(prev => {
            const existingIndex = (prev.disciplineRecords || []).findIndex(r => r.id === recordToSave.id);
            let newRecords;
            if (existingIndex > -1) {
                newRecords = [...(prev.disciplineRecords || [])];
                newRecords[existingIndex] = recordToSave;
            } else {
                newRecords = [...(prev.disciplineRecords || []), recordToSave];
            }
            return { ...prev, disciplineRecords: newRecords };
        });

        setIsSaveDialogOpen(false);
        toast({ title: "Kaydedildi", description: "Disiplin süreci arşive kaydedildi." });
    };

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
    }, []);

    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setDb(prev => ({
            ...prev,
            disciplineRecords: (prev.disciplineRecords || []).filter(r => r.id !== selectedRecordId),
        }));
        handleNewRecord();
        toast({ title: "Silindi", description: "Kayıt arşivden silindi.", variant: "destructive" });
    }, [selectedRecordId, setDb, handleNewRecord, toast]);
    
    return (
        <main className="p-1">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <RecordManager 
                        records={disciplineRecords.filter(r => r.classId === currentClass?.id)}
                        selectedRecordId={selectedRecordId}
                        onSelectRecord={setSelectedRecordId}
                        onNewRecord={handleNewRecord}
                        onDeleteRecord={handleDeleteRecord}
                        noun="Disiplin Kaydı"
                    />
                </div>
                <div className="md:col-span-3">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-red-600 text-white flex items-center justify-center rounded-xl text-2xl font-bold">
                                        ⚖️
                                    </div>
                                    <div>
                                        <CardTitle>Okul Disiplin Süreci Yönetim Sistemi</CardTitle>
                                        <CardDescription>MEB Yönetmeliğine uygun disiplin süreçleri</CardDescription>
                                    </div>
                                </div>
                                 <div className="flex flex-wrap gap-2">
                                     <Button onClick={saveProcess}><Save className="mr-2"/> Kaydet</Button>
                                 </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <PhaseIndicator currentPhase={phase} />

                            <div className='mt-8'>
                                <Phase1 isVisible={phase === 1} onNext={handleNextPhase} data={formData} updateRecord={updateCurrentRecord} students={sortedStudents} teacherProfile={teacherProfile} currentClass={currentClass} toast={toast} />
                                <Phase2 isVisible={phase === 2} onNext={handleNextPhase} onPrev={handlePrevPhase} data={formData} updateRecord={updateCurrentRecord} toast={toast} />
                                <Phase3 isVisible={phase === 3} onNext={handleNextPhase} onPrev={handlePrevPhase} data={formData} updateRecord={updateCurrentRecord} teacherProfile={teacherProfile} />
                                <Phase4 isVisible={phase === 4} onNext={handleNextPhase} onPrev={handlePrevPhase} data={formData} updateRecord={updateCurrentRecord} teacherProfile={teacherProfile} />
                                <Phase5 isVisible={phase === 5} onPrev={handlePrevPhase} data={formData} teacherProfile={teacherProfile} />
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
            
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Süreci Kaydet</DialogTitle>
                        <DialogDescription>Bu disiplin sürecini daha sonra devam etmek için bir isimle kaydedin.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="save-name">Süreç Adı</Label>
                        <Input id="save-name" value={saveName} onChange={(e) => setSaveName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>İptal</Button>
                        <Button onClick={handleSaveConfirm}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
};

const Phase1 = ({ isVisible, onNext, data, updateRecord, students, teacherProfile, currentClass, toast }: any) => {
    const [localData, setLocalData] = useState(data.phase1Data || {});
    const [studentInfo, setStudentInfo] = useState(data.studentInfo || {});
    
    useEffect(() => {
        const studentInfoToSet = data.studentInfo || { schoolName: teacherProfile?.schoolName || '' };
        const localDataToSet = data.phase1Data || { teacherName: teacherProfile?.name || ''};
        setStudentInfo(studentInfoToSet);
        setLocalData(localDataToSet);
    }, [data, teacherProfile]);

    const handleChange = (e: any) => {
        setLocalData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleStudentInfoChange = (field: string, value: string) => {
        const newStudentInfo:any = {...studentInfo, [field]: value};
        if(field === 'studentId') {
            const student = students.find((s:any) => s.id === value);
            if(student) {
                newStudentInfo.studentName = student.name;
                newStudentInfo.studentNumber = student.number;
                newStudentInfo.studentClass = currentClass?.name || '';
            }
        }
        setStudentInfo(newStudentInfo);
    };

    const handleSave = () => {
        if (!studentInfo.studentName || !localData.teacherName || !localData.behaviorType || !localData.incidentDetails) {
            toast({
                title: "Eksik Bilgi",
                description: "Lütfen öğrenci seçimi dahil tüm zorunlu alanları doldurun.",
                variant: "destructive"
            });
            return;
        }
        onNext({ phase1Data: localData, studentInfo });
    };
    
    const generateWordDocument = (docType: 'olay' | 'tanik' | 'savunma') => {
        let title = '';
        let docHtml = '';
        
        switch (docType) {
            case 'olay':
                title = 'OLAY TESPİT TUTANAĞI';
                docHtml = `<h2 style="text-align: center;">${title}</h2>
                    <p><strong>Okul:</strong> ${studentInfo.schoolName || ''}</p>
                    <p><strong>Olay Tarihi:</strong> ${localData.incidentDate ? new Date(localData.incidentDate).toLocaleDateString('tr-TR') : ''}</p>
                    <p><strong>Bildiren Öğretmen:</strong> ${localData.teacherName || ''}</p>
                    <br>
                    <p><strong>Öğrenci:</strong> ${studentInfo.studentName || ''} (${studentInfo.studentNumber || ''}) - ${studentInfo.studentClass || ''}</p>
                    <p><strong>Davranış Türü:</strong> ${DISCIPLINE_ARTICLES.flatMap(a => a.behaviors).find(b => b.value === localData.behaviorType)?.label || localData.behaviorType}</p>
                    <br>
                    <p><strong>Olayın Meydana Geldiği Yer ve Zaman, Şahitler, Detaylar:</strong></p>
                    <p style="border: 1px solid #000; padding: 10px; min-height: 100px;">${(localData.incidentDetails || '').replace(/\n/g, '<br>')}</p>
                    <br><p><strong>Tutanak Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                    <div style="text-align: right; margin-top: 50px;"><p>${localData.teacherName || ''}<br/>İmza</p></div>`;
                break;
            case 'tanik':
                title = 'TANIK İFADE TUTANAĞI';
                docHtml = `<h2 style="text-align: center;">${title}</h2><p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p><p><strong>Konu:</strong> ${studentInfo.studentName} hakkında tanık ifadesi.</p><br><p><strong>Tanık Adı Soyadı:</strong> ........................................</p><p><strong>Görevi/Sınıfı:</strong> ........................................</p><br><p><strong>Olay Hakkındaki Gözlem ve Bilgileriniz:</strong></p><div style="border: 1px solid #000; padding: 10px; height: 300px;"></div><br><br><p style="text-align: right;">İmza</p>`;
                break;
            case 'savunma':
                title = 'ÖĞRENCİ SAVUNMA İSTEMİ YAZISI';
                docHtml = `<h2 style="text-align: center;">ÖĞRENCİ SAVUNMA İSTEMİ YAZISI</h2><p><strong>Sayı:</strong></p><p><strong>Konu:</strong> Yazılı Savunma İsteği</p><br><p><strong>Sayın ${studentInfo.studentName},</strong></p><p>${localData.incidentDate ? new Date(localData.incidentDate).toLocaleDateString('tr-TR') : ''} tarihinde yaşanan ve hakkınızda düzenlenen tutanakla ilgili olarak, Ortaöğretim Kurumları Yönetmeliği'nin ilgili maddeleri uyarınca savunmanızı vermeniz gerekmektedir.</p><p>Savunmanızı bu yazının size tebliğ edildiği tarihten itibaren 1 (bir) iş günü içinde okul idaresine yazılı olarak teslim etmeniz, aksi takdirde savunma hakkınızdan vazgeçmiş sayılacağınız hususunda bilgilerinizi rica ederim.</p><br><br><div style="text-align: right;"><p>${teacherProfile?.principalName || 'Okul Müdürü'}<br/>Okul Müdürü</p></div>`;
                break;
        }

        const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">${docHtml}</body></html>`;
        const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/ /g, '_')}_${studentInfo.studentName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isVisible) return null;

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>1. Olay Tespiti ve Raporlama</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <FormItem label="Öğrenci Seçin *"><Select value={studentInfo.studentId || ''} onValueChange={v => handleStudentInfoChange('studentId', v)}><SelectTrigger><SelectValue placeholder="Öğrenci seçin..." /></SelectTrigger><SelectContent>{students.map((std: any) => (<SelectItem key={std.id} value={std.id}>{std.name} ({std.number})</SelectItem>))}</SelectContent></Select></FormItem>
                </div>
                <FormItem id="incidentDate" label="Olay Tarihi *" value={localData.incidentDate} onChange={handleChange} type="date" />
                <FormItem id="teacherName" label="Bildiren Öğretmen *" value={localData.teacherName} onChange={handleChange} />
                <FormItem label="Davranış Türü (Yönetmelik Maddesi) *">
                    <Select value={localData.behaviorType || ''} onValueChange={(val) => setLocalData((prev:any)=>({...prev, behaviorType: val}))}>
                        <SelectTrigger><SelectValue placeholder="Davranış seçin..." /></SelectTrigger>
                        <SelectContent>
                            {DISCIPLINE_ARTICLES.map(article => (
                                <SelectGroup key={article.article}>
                                    <SelectLabel>{article.article}</SelectLabel>
                                    {article.behaviors.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                                </SelectGroup>
                            ))}
                        </SelectContent>
                    </Select>
                </FormItem>
                <FormItem id="incidentDetails" label="Olayın Meydana Geldiği Yer ve Zaman, Şahitler, Detaylar *" value={localData.incidentDetails} onChange={handleChange} isTextarea />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => generateWordDocument('olay')}><FileDown className="mr-2" /> Olay Tutanağı</Button>
                    <Button variant="outline" onClick={() => generateWordDocument('tanik')}><FileDown className="mr-2" /> Tanık İfade</Button>
                    <Button variant="outline" onClick={() => generateWordDocument('savunma')}><FileDown className="mr-2" /> Savunma İstemi</Button>
                </div>
                <Button onClick={handleSave}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
            </CardFooter>
        </Card>
    );
};

const Phase2 = ({ isVisible, onNext, onPrev, data, updateRecord, toast }: any) => {
    const [localData, setLocalData] = useState(data.phase2Data || {});
    useEffect(() => setLocalData(data.phase2Data || {}), [data.phase2Data]);

    if (!isVisible) return null;
    const handleChange = (e: any) => setLocalData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    
    const handleNext = () => {
        updateRecord({ phase2Data: localData });
        onNext({});
    };

    const handleProcessDecision = (decision: 'end' | 'refer') => {
        const updatedData = { phase2Data: { ...localData, processDecision: decision } };
        updateRecord(updatedData);
        if (decision === 'refer') {
            onNext(updatedData);
        } else {
             toast({
                title: "Süreç Sonlandırıldı",
                description: "Süreç bu aşamada sonlandırılmıştır. Gerekli bildirimleri yapmayı unutmayın.",
                variant: "default"
             });
        }
    };
    
     const generateDocument = () => {
        const docHtml = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>İfade ve Görüşme Tutanağı</title></head>
            <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
                <h2 style="text-align: center;">ÖĞRENCİ İFADE VE REHBERLİK GÖRÜŞME TUTANAĞI</h2>
                <p><strong>Öğrenci:</strong> ${data.studentInfo.studentName}</p>
                <p><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                <br>
                <h3>ÖĞRENCİNİN YAZILI İFADESİ (SAVUNMASI):</h3>
                <p style="border: 1px solid #000; padding: 10px; min-height: 150px;">${(localData.studentStatement || '').replace(/\n/g, '<br>')}</p>
                <br>
                <h3>REHBERLİK GÖRÜŞME NOTLARI:</h3>
                <p><strong>Tarih:</strong> ${localData.counselingDate ? new Date(localData.counselingDate).toLocaleDateString('tr-TR') : ''}</p>
                <p><strong>Görüşmeyi Yapan:</strong> ${localData.counselorName || ''}</p>
                <p><strong>Özet:</strong></p>
                <p style="border: 1px solid #000; padding: 10px; min-height: 100px;">${(localData.counselingSummary || '').replace(/\n/g, '<br>')}</p>
            </body></html>
        `;
        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Ifade_Gorusme_Tutanagi_${data.studentInfo.studentName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>2. Savunma ve Değerlendirme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={data.studentInfo} />
                <FormItem id="studentStatement" label="Öğrencinin Yazılı İfadesi (Savunması)" value={localData.studentStatement} onChange={handleChange} isTextarea />
                <FormItem id="counselingDate" label="Rehberlik Görüşme Tarihi" value={localData.counselingDate} onChange={handleChange} type="date" />
                <FormItem id="counselorName" label="Rehberlik Görevlisi" value={localData.counselorName} onChange={handleChange} />
                <FormItem id="counselingSummary" label="Görüşme Özeti" value={localData.counselingSummary} onChange={handleChange} isTextarea />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={generateDocument}><FileDown className="mr-2" /> Tutanak Oluştur</Button>
                    <Button variant="outline" onClick={() => handleProcessDecision('end')}>Süreci Sonlandır</Button>
                    <Button onClick={() => handleProcessDecision('refer')}>Disiplin Kuruluna Sevk Et <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase3 = ({ isVisible, onNext, onPrev, data, updateRecord, teacherProfile }: any) => {
    const [localData, setLocalData] = useState(data.phase3Data || {});
    useEffect(() => setLocalData(data.phase3Data || {}), [data.phase3Data]);

    if (!isVisible) return null;
    const handleChange = (e: any) => setLocalData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    const handleSave = () => {
        updateRecord({ phase3Data: localData });
        onNext({});
    };
    
    const generateDocument = () => {
        const docHtml = `
             <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Disiplin Kuruluna Sevk Yazısı</title></head>
            <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
                <h2 style="text-align: center;">DİSİPLİN KURULUNA SEVK YAZISI</h2>
                <p style="text-align: right;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                <br>
                <p><strong>Disiplin Kurulu Başkanlığına,</strong></p>
                <br>
                <p>Okulumuz ${data.studentInfo.studentClass} sınıfı, ${data.studentInfo.studentNumber} numaralı öğrencisi ${data.studentInfo.studentName}'in, ${data.phase1Data.incidentDate} tarihinde gerçekleştirdiği "${DISCIPLINE_ARTICLES.flatMap(a => a.behaviors).find(b => b.value === data.phase1Data.behaviorType)?.label}" fiili nedeniyle, Ortaöğretim Kurumları Yönetmeliği uyarınca değerlendirilmek üzere Disiplin Kuruluna sevk edilmesine karar verilmiştir.</p>
                <p><strong>Sevk Gerekçesi ve Amir Görüşü:</strong></p>
                <p style="border: 1px solid #000; padding: 10px; min-height: 100px;">${(localData.referralReason || '').replace(/\n/g, '<br>')}</p>
                <p>Gereğini arz ederim.</p>
                <br><br>
                <div style="text-align: right;">
                    <p>${teacherProfile?.principalName || 'Okul Müdürü'}</p>
                    <p>Okul Müdürü</p>
                </div>
                 <br>
                <p><strong>Ekler:</strong><br>
                1. Olay Tespit Tutanağı<br>
                2. Öğrenci İfade Tutanağı<br>
                3. Rehberlik Görüşme Tutanağı<br>
                4. (Varsa) Diğer Deliller
                </p>
            </body></html>
        `;
        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Sevk_Yazisi_${data.studentInfo.studentName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>3. Disiplin Kuruluna Sevk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={data.studentInfo} />
                <FormItem id="referralReason" label="Sevk Gerekçesi / Amirin Görüşü" value={localData.referralReason} onChange={handleChange} isTextarea />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={generateDocument}><FileDown className="mr-2" /> Sevk Yazısı Oluştur</Button>
                    <Button onClick={handleSave}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase4 = ({ isVisible, onNext, onPrev, data, updateRecord, teacherProfile }: any) => {
    const [localData, setLocalData] = useState(data.phase4Data || {});
    useEffect(() => setLocalData(data.phase4Data || {disciplinaryMembers: `${teacherProfile?.name || ''} (Rehber Öğrt.)`}), [data.phase4Data, teacherProfile]);

    if (!isVisible) return null;

    const handleChange = (e: any) => setLocalData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    const handleSelectChange = (id: string, value: string) => setLocalData((prev: any) => ({ ...prev, [id]: value }));
    const handleSave = () => {
        updateRecord({ phase4Data: localData });
        onNext({});
    };

    const generateDocument = () => {
         const docHtml = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Disiplin Kurulu Karar Tutanağı</title></head>
            <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
                <h2 style="text-align: center;">DİSİPLİN KURULU KARAR TUTANAĞI</h2>
                <p><strong>Toplantı Tarihi:</strong> ${localData.disciplinaryDate ? new Date(localData.disciplinaryDate).toLocaleDateString('tr-TR') : ''}</p>
                <p><strong>Öğrenci:</strong> ${data.studentInfo.studentName}</p>
                <br>
                <p><strong>Kurul Üyeleri:</strong></p>
                <p>${(localData.disciplinaryMembers || '').replace(/\n/g, '<br>')}</p>
                <br>
                <p><strong>Gündem:</strong> ${data.studentInfo.studentName} adlı öğrencinin disiplin durumu.</p>
                <br>
                <p><strong>Rehberlik Servisi Görüşü:</strong></p>
                <p style="border: 1px solid #000; padding: 10px; min-height: 80px;">${(localData.guidanceReport || '').replace(/\n/g, '<br>')}</p>
                <br>
                <p><strong>Alınan Karar:</strong> ${localData.disciplinaryDecision || ''}</p>
                <p><strong>Oylama Sonucu:</strong> ${localData.voteResult || ''}</p>
                <br>
                <p><strong>Kararın Gerekçesi:</strong></p>
                <p style="border: 1px solid #000; padding: 10px; min-height: 100px;">${(localData.decisionDetails || '').replace(/\n/g, '<br>')}</p>
                <br><br><br>
                <div style="display: flex; justify-content: space-around; text-align:center;">
                    <p>Kurul Başkanı<br/><br/>(İmza)</p>
                    <p>Üye<br/><br/>(İmza)</p>
                    <p>Üye<br/><br/>(İmza)</p>
                </div>
            </body></html>
        `;
        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Disiplin_Karari_${data.studentInfo.studentName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>4. Disiplin Kurulu Toplantısı ve Karar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={data.studentInfo} />
                <FormItem id="disciplinaryDate" label="Disiplin Kurulu Tarihi" value={localData.disciplinaryDate} onChange={handleChange} type="date" />
                <FormItem id="disciplinaryMembers" label="Kurul Üyeleri (Her satıra bir üye)" value={localData.disciplinaryMembers} onChange={handleChange} isTextarea />
                <FormItem id="guidanceReport" label="Rehberlik Servisi Görüşü" value={localData.guidanceReport} onChange={handleChange} isTextarea />
                <FormItem label="Disiplin Kurulu Kararı">
                    <Select value={localData.disciplinaryDecision || ''} onValueChange={(val) => handleSelectChange('disciplinaryDecision', val)}>
                        <SelectTrigger><SelectValue placeholder="Karar seçiniz..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Uyarı/Kınama">Uyarı / Kınama</SelectItem>
                            <SelectItem value="Okuldan Kısa Süreli Uzaklaştırma (1-5 gün)">Okuldan Kısa Süreli Uzaklaştırma (1-5 gün)</SelectItem>
                            <SelectItem value="Okul Değiştirme">Okul Değiştirme</SelectItem>
                            <SelectItem value="Örgün Eğitim Dışına Çıkarma">Örgün Eğitim Dışına Çıkarma</SelectItem>
                            <SelectItem value="Ceza Tayinine Gerek Yoktur">Ceza Tayinine Gerek Yoktur</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>
                <FormItem label="Oylama Sonucu"><Select value={localData.voteResult || ''} onValueChange={(val) => handleSelectChange('voteResult', val)}><SelectTrigger><SelectValue placeholder="Sonuç seçin..." /></SelectTrigger><SelectContent><SelectItem value="Oy Birliği">Oy Birliği</SelectItem><SelectItem value="Oy Çokluğu">Oy Çokluğu</SelectItem></SelectContent></Select></FormItem>
                <FormItem id="decisionDetails" label="Kararın Gerekçesi" value={localData.decisionDetails} onChange={handleChange} isTextarea />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                     <Button variant="outline" onClick={generateDocument}><FileDown className="mr-2" /> Karar Tutanağı Oluştur</Button>
                    <Button onClick={handleSave}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase5 = ({ isVisible, onPrev, data, teacherProfile }: any) => {
    const [localData, setLocalData] = useState(data.phase5Data || {});
     useEffect(() => setLocalData(data.phase5Data || {}), [data.phase5Data]);

    if (!isVisible) return null;
    const handleChange = (e: any) => setLocalData((prev: any) => ({ ...prev, [e.target.id]: e.target.value }));
    const handleSelectChange = (id: string, value: string) => setLocalData((prev: any) => ({ ...prev, [id]: value }));

     const generateDocument = () => {
        const docHtml = `
            <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Karar Bildirim Yazısı</title></head>
            <body style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
                <h2 style="text-align: center;">DİSİPLİN KURULU KARAR BİLDİRİM YAZISI</h2>
                <p style="text-align: right;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
                <br>
                <p><strong>Sayın ${data.studentInfo.parentName || '....................'},</strong></p>
                <p>Velisi bulunduğunuz, okulumuz ${data.studentInfo.studentClass} sınıfı öğrencisi ${data.studentInfo.studentName}'in disiplin durumu ile ilgili olarak, ${data.phase4Data.disciplinaryDate ? new Date(data.phase4Data.disciplinaryDate).toLocaleDateString('tr-TR') : ''} tarihinde toplanan okul disiplin kurulumuzun aldığı karar aşağıda bilgilerinize sunulmuştur.</p>
                <br>
                <p><strong>Karar:</strong> ${data.phase4Data.disciplinaryDecision || ''}</p>
                <p><strong>Gerekçe:</strong> ${data.phase4Data.decisionDetails || ''}</p>
                <br>
                <p>Ortaöğretim Kurumları Yönetmeliği uyarınca, bu karara tebliğ tarihinden itibaren 5 iş günü içinde Okul Müdürlüğü aracılığıyla itiraz etme hakkınız bulunmaktadır.</p>
                <p>Bilgilerinizi rica ederim.</p>
                <br><br>
                <div style="text-align: right;"><p>${teacherProfile?.principalName || 'Okul Müdürü'}<br/>Okul Müdürü</p></div>
                <br><hr><br>
                <p><strong>Tebellüğ Eden (Veli):</strong></p>
                <p><strong>Adı Soyadı:</strong></p>
                <p><strong>Tarih:</strong></p>
                <p><strong>İmza:</strong></p>
            </body></html>
        `;
        const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Karar_Tebligati_${data.studentInfo.studentName}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
         <Card className="animate-in fade-in">
            <CardHeader><CardTitle>5. Kararın Tebliği ve Sonuç</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <StudentInfoDisplay studentInfo={data.studentInfo} />
                 <p className="font-bold">Nihai Karar: {data.phase4Data?.disciplinaryDecision}</p>
                 <FormItem id="notificationDate" label="Veliye Bildirim Tarihi" value={localData.notificationDate} onChange={handleChange} type="date" />
                 <FormItem label="Bildirim Yöntemi"><Select value={localData.notificationMethod || ''} onValueChange={(val) => handleSelectChange('notificationMethod', val)}><SelectTrigger><SelectValue placeholder="Yöntem seçin..." /></SelectTrigger><SelectContent><SelectItem value="elden">Elden İmza Karşılığı</SelectItem><SelectItem value="posta">İadeli Taahhütlü Posta</SelectItem><SelectItem value="e-posta">E-Posta</SelectItem></SelectContent></Select></FormItem>
                 <FormItem id="eokulEntry" label="e-Okul İşlemleri" value="Karar e-Okul sistemine işlendi." isTextarea readOnly />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <Button variant="destructive" onClick={generateDocument}><FileDown className="mr-2" /> Veli Tebligatı Oluştur</Button>
            </CardFooter>
        </Card>
    );
};

const FormItem = ({ label, children, ...props }: any) => {
    if (props.type || props.isTextarea) {
        const { value, onChange, type, isTextarea, id } = props;
        return (
            <div className="space-y-2">
                <Label htmlFor={id}>{label}</Label>
                {isTextarea ? (
                    <Textarea id={id} value={value || ''} onChange={onChange} />
                ) : (
                    <Input id={id} type={type} value={value || ''} onChange={onChange} />
                )}
            </div>
        )
    }
    return <div className="space-y-2"><Label>{label}</Label>{children}</div>
};

const StudentInfoDisplay = ({ studentInfo }: any) => {
    if (!studentInfo || !studentInfo.studentName) return null;
    return (
        <Card className="bg-blue-50 border-blue-200 p-4 mb-6">
            <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg">{studentInfo.studentName}</CardTitle>
                <CardDescription>No: {studentInfo.studentNumber} - Sınıf: {studentInfo.studentClass}</CardDescription>
            </CardHeader>
        </Card>
    );
};

    