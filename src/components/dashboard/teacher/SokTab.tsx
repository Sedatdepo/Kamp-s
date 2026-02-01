'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Home, Save, FileDown, Users, PlusCircle, Trash2, GripVertical, Settings, Zap, Mic, MicOff, BookOpen, History, FolderOpen, FileText, FileSignature, Upload, FileSpreadsheet, Printer, Eye, Archive, BookmarkPlus, Library, CheckCircle, AlertCircle, Pencil, Check, Wand2, ListChecks, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { TeacherProfile, DisciplineRecord, Class, Student } from '@/lib/types';
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// --- ZOD SCHEMA ---
const studentInfoSchema = z.object({
    schoolName: z.string().optional(),
    studentId: z.string().optional(),
    studentName: z.string().optional(),
    studentNumber: z.string().optional(),
    studentClass: z.string().optional(),
    parentName: z.string().optional(),
}).optional();

const phase1Schema = z.object({
    teacherName: z.string().optional(),
    incidentDate: z.string().optional(),
    behaviorType: z.string().optional(),
    incidentDetails: z.string().optional(),
}).optional();

const phase2Schema = z.object({
    studentStatement: z.string().optional(),
    counselingDate: z.string().optional(),
    counselorName: z.string().optional(),
    counselingSummary: z.string().optional(),
    processDecision: z.enum(['end', 'refer']).optional(),
}).optional();

const phase3Schema = z.object({
    referralReason: z.string().optional(),
}).optional();

const phase4Schema = z.object({
    disciplinaryDate: z.string().optional(),
    disciplinaryMembers: z.string().optional(),
    guidanceReport: z.string().optional(),
    disciplinaryDecision: z.string().optional(),
    voteResult: z.string().optional(),
    decisionDetails: z.string().optional(),
}).optional();

const phase5Schema = z.object({
    notificationDate: z.string().optional(),
    notificationMethod: z.string().optional(),
}).optional();

const formSchema = z.object({
  id: z.string(),
  studentInfo: studentInfoSchema,
  phase1Data: phase1Schema,
  phase2Data: phase2Schema,
  phase3Data: phase3Schema,
  phase4Data: phase4Schema,
  phase5Data: phase5Schema,
});
type FormData = z.infer<typeof formSchema>;


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
    const { db: localDb, setDb: setLocalDb } = useDatabase();
    const { disciplineRecords = [] } = localDb;
    const { toast } = useToast();

    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState('');
    const [phase, setPhase] = useState(1);

    const defaultValues = useMemo<FormData>(() => ({
        id: `discipline_${Date.now()}`,
        studentInfo: { schoolName: teacherProfile?.schoolName || '' },
        phase1Data: { teacherName: teacherProfile?.name || ''},
        incidentDate: '',
        incidentTime: '',
        location: '',
        description: '',
        witnesses: '',
        evidence: '',
        defense: '',
        decision: '',
        sanction: '',
    } as any), [teacherProfile]);
    
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: defaultValues,
    });
    
    useEffect(() => {
        if (selectedRecordId) {
            const record = disciplineRecords.find(r => r.id === selectedRecordId);
            if (record) {
                form.reset(record.data);
                setPhase(record.currentPhase || 1);
            }
        } else {
            form.reset({
                ...defaultValues,
                id: `discipline_${Date.now()}`,
            });
            setPhase(1);
        }
    }, [selectedRecordId, disciplineRecords, form, defaultValues]);
    

    const handleNextPhase = () => setPhase(p => Math.min(p + 1, 5));
    const handlePrevPhase = () => setPhase(p => Math.max(p - 1, 1));
    
    const handleSaveConfirm = () => {
        if (!saveNameInput.trim()) {
            toast({ title: 'Hata', description: 'Lütfen süreç için bir isim girin.', variant: 'destructive' });
            return;
        }

        const currentData = form.getValues();
        if (!currentData.studentInfo?.studentName) {
            toast({ title: "Hata", description: "Lütfen önce öğrenci bilgilerini girin.", variant: "destructive" });
            return;
        }

        const recordToSave: DisciplineRecord = {
            id: currentData.id,
            name: saveNameInput,
            date: new Date().toISOString(),
            classId: currentClass?.id,
            currentPhase: phase,
            formData: currentData,
        };

        setLocalDb(prev => {
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
        setSelectedRecordId(recordToSave.id); // Make sure the saved record is now the selected one
        toast({ title: "Kaydedildi", description: "Disiplin süreci arşive kaydedildi." });
    };

    const handleNewRecord = useCallback(() => {
        setSelectedRecordId(null);
    }, []);
    
    const handleDeleteRecord = useCallback(() => {
        if (!selectedRecordId) return;
        setLocalDb(prev => ({
            ...prev,
            disciplineRecords: (prev.disciplineRecords || []).filter(r => r.id !== selectedRecordId)
        }));
        handleNewRecord();
        toast({ title: "Silindi", description: "Kayıt arşivden silindi.", variant: "destructive" });
    }, [selectedRecordId, setLocalDb, handleNewRecord, toast]);
    
    const openSaveDialog = () => {
        const studentName = form.getValues('studentInfo.studentName');
        setSaveNameInput(selectedRecordId ? disciplineRecords.find(r => r.id === selectedRecordId)?.name || `Disiplin Süreci - ${studentName}` : `Disiplin Süreci - ${studentName || 'İsimsiz'}`);
        setIsSaveDialogOpen(true);
    };
    
    return (
        <Form {...form}>
            <main className="p-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <RecordManager 
                            records={(disciplineRecords || []).filter(r => r.classId === currentClass?.id).map(r => ({ id: r.id, name: r.name }))}
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
                                        <div className="w-14 h-14 bg-red-600 text-white flex items-center justify-center rounded-xl text-2xl font-bold">⚖️</div>
                                        <div>
                                            <CardTitle>Okul Disiplin Süreci Yönetim Sistemi</CardTitle>
                                            <CardDescription>MEB Yönetmeliğine uygun disiplin süreçleri</CardDescription>
                                        </div>
                                    </div>
                                     <div className="flex flex-wrap gap-2">
                                         <Button onClick={openSaveDialog}><Save className="mr-2"/> Kaydet</Button>
                                     </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <PhaseIndicator currentPhase={phase} />

                                <div className='mt-8'>
                                    <Phase1 isVisible={phase === 1} form={form} onNext={handleNextPhase} students={students} teacherProfile={teacherProfile} currentClass={currentClass} toast={toast} />
                                    <Phase2 isVisible={phase === 2} form={form} onNext={handleNextPhase} onPrev={handlePrevPhase} setPhase={setPhase} toast={toast} />
                                    <Phase3 isVisible={phase === 3} form={form} onNext={handleNextPhase} onPrev={handlePrevPhase} teacherProfile={teacherProfile} />
                                    <Phase4 isVisible={phase === 4} form={form} onNext={handleNextPhase} onPrev={handlePrevPhase} teacherProfile={teacherProfile} />
                                    <Phase5 isVisible={phase === 5} form={form} onPrev={handlePrevPhase} teacherProfile={teacherProfile} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Süreci Kaydet</DialogTitle><DialogDescription>Bu disiplin sürecini daha sonra devam etmek için bir isimle kaydedin.</DialogDescription></DialogHeader>
                        <div className="py-4"><Label htmlFor="save-name">Süreç Adı</Label><Input id="save-name" value={saveNameInput} onChange={(e) => setSaveNameInput(e.target.value)} /></div>
                        <DialogFooter><Button variant="ghost" onClick={() => setIsSaveDialogOpen(false)}>İptal</Button><Button onClick={handleSaveConfirm}>Kaydet</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </Form>
    );
};


const Phase1 = ({ isVisible, form, onNext, students, teacherProfile, currentClass, toast }: any) => {
    
    const handleStudentSelect = (studentId: string) => {
        const student = students.find((s:any) => s.id === studentId);
        if(student) {
            form.setValue('studentInfo.studentId', student.id);
            form.setValue('studentInfo.studentName', student.name);
            form.setValue('studentInfo.studentNumber', student.number);
            form.setValue('studentInfo.studentClass', currentClass?.name || '');
        }
    };
    
    const handleNextClick = async () => {
        const result = await form.trigger(['studentInfo.studentId', 'phase1Data.teacherName', 'phase1Data.behaviorType', 'phase1Data.incidentDetails']);
        if (result) {
            onNext();
        } else {
             toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
        }
    };

    const generateWordDocument = (docType: 'olay' | 'tanik' | 'savunma') => {
        // ... (Bu kısım aynı kalabilir, sadece form verilerini form.getValues() ile alır)
    };

    if (!isVisible) return null;

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>1. Olay Tespiti ve Raporlama</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <FormField control={form.control} name="studentInfo.studentId" render={({ field }) => (
                    <FormItem><FormLabel>Öğrenci Seçin *</FormLabel>
                        <Select onValueChange={(value) => { field.onChange(value); handleStudentSelect(value); }} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Öğrenci seçin..." /></SelectTrigger></FormControl>
                           <SelectContent>{students.map((std: any) => (<SelectItem key={std.id} value={std.id}>{std.name} ({std.number})</SelectItem>))}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="phase1Data.incidentDate" render={({ field }) => (<FormItem><FormLabel>Olay Tarihi *</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phase1Data.teacherName" render={({ field }) => (<FormItem><FormLabel>Bildiren Öğretmen *</FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phase1Data.behaviorType" render={({ field }) => (
                    <FormItem><FormLabel>Davranış Türü (Yönetmelik Maddesi) *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl><SelectTrigger><SelectValue placeholder="Davranış seçin..." /></SelectTrigger></FormControl>
                           <SelectContent>{DISCIPLINE_ARTICLES.map(article => (<SelectGroup key={article.article}><Label className="px-2 py-1.5 text-sm font-semibold">{article.article}</Label>{article.behaviors.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectGroup>))}</SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="phase1Data.incidentDetails" render={({ field }) => (<FormItem><FormLabel>Olayın Meydana Geldiği Yer ve Zaman, Şahitler, Detaylar *</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => generateWordDocument('olay')}><FileDown className="mr-2" /> Olay Tutanağı</Button>
                    <Button type="button" variant="outline" onClick={() => generateWordDocument('tanik')}><FileDown className="mr-2" /> Tanık İfade</Button>
                    <Button type="button" variant="outline" onClick={() => generateWordDocument('savunma')}><FileDown className="mr-2" /> Savunma İstemi</Button>
                </div>
                <Button type="button" onClick={handleNextClick}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
            </CardFooter>
        </Card>
    );
};

// --- Diğer Phase component'leri de benzer şekilde refactor edilecek ---
const Phase2 = ({ isVisible, form, onNext, onPrev, setPhase, toast }: any) => {
    
    const handleProcessDecision = (decision: 'end' | 'refer') => {
        form.setValue('phase2Data.processDecision', decision);
        if (decision === 'refer') {
            onNext();
        } else {
             toast({ title: "Süreç Sonlandırıldı", description: "Süreç bu aşamada sonlandırılmıştır.", variant: "default" });
             // Optionally stay on this phase or navigate somewhere else. For now, we do nothing.
        }
    };
    
    if (!isVisible) return null;

    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>2. Savunma ve Değerlendirme</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={form.getValues('studentInfo')} />
                <FormField control={form.control} name="phase2Data.studentStatement" render={({ field }) => (<FormItem><FormLabel>Öğrencinin Yazılı İfadesi (Savunması)</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase2Data.counselingDate" render={({ field }) => (<FormItem><FormLabel>Rehberlik Görüşme Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase2Data.counselorName" render={({ field }) => (<FormItem><FormLabel>Rehberlik Görevlisi</FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase2Data.counselingSummary" render={({ field }) => (<FormItem><FormLabel>Görüşme Özeti</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button type="button" variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline"><FileDown className="mr-2" /> Tutanak Oluştur</Button>
                    <Button type="button" variant="outline" onClick={() => handleProcessDecision('end')}>Süreci Sonlandır</Button>
                    <Button type="button" onClick={() => handleProcessDecision('refer')}>Disiplin Kuruluna Sevk Et <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase3 = ({ isVisible, form, onNext, onPrev, teacherProfile }: any) => {
    if (!isVisible) return null;
    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>3. Disiplin Kuruluna Sevk</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={form.getValues('studentInfo')} />
                <FormField control={form.control} name="phase3Data.referralReason" render={({ field }) => (<FormItem><FormLabel>Sevk Gerekçesi / Amirin Görüşü</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button type="button" variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline"><FileDown className="mr-2" /> Sevk Yazısı Oluştur</Button>
                    <Button type="button" onClick={onNext}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase4 = ({ isVisible, form, onNext, onPrev, teacherProfile }: any) => {
    if (!isVisible) return null;
    return (
        <Card className="animate-in fade-in">
            <CardHeader><CardTitle>4. Disiplin Kurulu Toplantısı ve Karar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <StudentInfoDisplay studentInfo={form.getValues('studentInfo')} />
                <FormField control={form.control} name="phase4Data.disciplinaryDate" render={({ field }) => (<FormItem><FormLabel>Disiplin Kurulu Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase4Data.disciplinaryMembers" render={({ field }) => (<FormItem><FormLabel>Kurul Üyeleri (Her satıra bir üye)</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase4Data.guidanceReport" render={({ field }) => (<FormItem><FormLabel>Rehberlik Servisi Görüşü</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="phase4Data.disciplinaryDecision" render={({ field }) => (<FormItem><FormLabel>Disiplin Kurulu Kararı</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Karar seçiniz..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="Uyarı/Kınama">Uyarı / Kınama</SelectItem>
                            <SelectItem value="Okuldan Kısa Süreli Uzaklaştırma (1-5 gün)">Okuldan Kısa Süreli Uzaklaştırma (1-5 gün)</SelectItem>
                            <SelectItem value="Okul Değiştirme">Okul Değiştirme</SelectItem>
                            <SelectItem value="Örgün Eğitim Dışına Çıkarma">Örgün Eğitim Dışına Çıkarma</SelectItem>
                            <SelectItem value="Ceza Tayinine Gerek Yoktur">Ceza Tayinine Gerek Yoktur</SelectItem>
                        </SelectContent>
                    </Select>
                </FormItem>)} />
                <FormField control={form.control} name="phase4Data.voteResult" render={({ field }) => (<FormItem><FormLabel>Oylama Sonucu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Sonuç seçin..." /></SelectTrigger></FormControl>
                        <SelectContent><SelectItem value="Oy Birliği">Oy Birliği</SelectItem><SelectItem value="Oy Çokluğu">Oy Çokluğu</SelectItem></SelectContent>
                    </Select>
                </FormItem>)} />
                <FormField control={form.control} name="phase4Data.decisionDetails" render={({ field }) => (<FormItem><FormLabel>Kararın Gerekçesi</FormLabel><FormControl><Textarea {...field} value={field.value || ''} rows={4} /></FormControl></FormItem>)} />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button type="button" variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <div className="flex flex-wrap gap-2">
                     <Button type="button" variant="outline"><FileDown className="mr-2" /> Karar Tutanağı Oluştur</Button>
                    <Button type="button" onClick={onNext}>Kaydet ve İlerle <ArrowRight className="ml-2" /></Button>
                </div>
            </CardFooter>
        </Card>
    );
};

const Phase5 = ({ isVisible, form, onPrev, teacherProfile }: any) => {
    if (!isVisible) return null;
    return (
         <Card className="animate-in fade-in">
            <CardHeader><CardTitle>5. Kararın Tebliği ve Sonuç</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <StudentInfoDisplay studentInfo={form.getValues('studentInfo')} />
                 <p className="font-bold">Nihai Karar: {form.getValues('phase4Data.disciplinaryDecision')}</p>
                 <FormField control={form.control} name="phase5Data.notificationDate" render={({ field }) => (<FormItem><FormLabel>Veliye Bildirim Tarihi</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl></FormItem>)} />
                 <FormField control={form.control} name="phase5Data.notificationMethod" render={({ field }) => (<FormItem><FormLabel>Bildirim Yöntemi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Yöntem seçin..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="elden">Elden İmza Karşılığı</SelectItem>
                            <SelectItem value="posta">İadeli Taahhütlü Posta</SelectItem>
                            <SelectItem value="e-posta">E-Posta</SelectItem>
                        </SelectContent>
                    </Select>
                 </FormItem>)} />
                 <FormItem>
                    <FormLabel>e-Okul İşlemleri</FormLabel>
                    <Input value="Karar e-Okul sistemine işlendi." readOnly />
                 </FormItem>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2">
                <Button type="button" variant="secondary" onClick={onPrev}><ArrowLeft className="mr-2" /> Geri</Button>
                <Button type="button" variant="destructive"><FileDown className="mr-2" /> Veli Tebligatı Oluştur</Button>
            </CardFooter>
        </Card>
    );
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
