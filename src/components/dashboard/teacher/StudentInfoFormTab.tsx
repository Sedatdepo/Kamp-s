'use client';

import React, { useState, useMemo } from 'react';
import { Student, Class, TeacherProfile, InfoForm } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, CheckCircle, XCircle, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { exportStudentInfoFormToRtf } from '@/lib/word-export';

const formQuestions = [
    { section: "ÖĞRENCİ BİLGİSİ", fields: [
      { name: "studentName", label: "Adı Soyadı" },
      { name: "studentGender", label: "Cinsiyeti" },
      { name: "studentClassAndNumber", label: "Sınıfı ve Numarası" },
      { name: "studentBirthPlaceAndDate", label: "Doğum Yeri ve Tarihi"},
      { name: "studentSchool", label: "Okulu" },
      { name: "studentAddress", label: "Adresi" },
      { name: "studentPreschool", label: "Okul öncesi eğitim aldınız mı?"},
      { name: "studentHealthDevice", label: "Sürekli kullandığınız ilaç ve/veya tıbbi cihaz var mı? Varsa nedir?"},
      { name: "studentHobbies", label: "Ne yapmaktan hoşlanırsınız?"},
      { name: "studentChronicIllness", label: "Sürekli bir hastalığınız var mı? Varsa nedir?"},
      { name: "studentRecentMove", label: "Yakın zamanda taşındınız mı, okul değiştirdiniz mi?"},
      { name: "studentExtracurricular", label: "Ders dışı faaliyetleriniz nelerdir?"},
      { name: "studentTechUsage", label: "Kendinize ait teknolojik aletleriniz var mı? Varsa günde/haftada ne kadar süre kullanırsınız?"},
      { name: "studentMemorableEvent", label: "Hala etkisi altında olduğunuz bir olay yaşadınız mı? Yaşantınızı açıklayınız."}
    ]},
    { section: "VELİ BİLGİSİ (Öğrenciyle ilgili işlemlerden birinci derecede sorumlu kişi)", fields: [
      { name: "guardianKinship", label: "Yakınlığı"},
      { name: "guardianPhone", label: "Telefon Numarası"},
      { name: "guardianEducation", label: "Eğitim Durumu"},
      { name: "guardianOccupation", label: "Mesleği"}
    ]},
    { section: "ANNE BİLGİLERİ", fields: [
      { name: "motherName", label: "Adı Soyadı"},
      { name: "motherBirthPlaceAndDate", label: "Doğum Yeri / Doğum Tarihi"},
      { name: "motherIsAlive", label: "Öz mü?"},
      { name: "motherIsHealthy", label: "Sağ mı?"},
      { name: "motherHasDisability", label: "Engel durumu var mı?"},
      { name: "motherEducation", label: "Eğitim Durumu"},
      { name: "motherOccupation", label: "Mesleği"}
    ]},
    { section: "BABA BİLGİLERİ", fields: [
      { name: "fatherName", label: "Adı Soyadı"},
      { name: "fatherBirthPlaceAndDate", label: "Doğum Yeri / Doğum Tarihi"},
      { name: "fatherIsAlive", label: "Öz mü?"},
      { name: "fatherIsHealthy", label: "Sağ mı?"},
      { name: "fatherHasDisability", label: "Engel durumu var mı?"},
      { name: "fatherEducation", label: "Eğitim Durumu"},
      { name: "fatherOccupation", label: "Mesleği"}
    ]},
    { section: "AİLE BİLGİSİ", fields: [
      { name: "siblingCount", label: "Kaç kardeşsiniz?"},
      { name: "birthOrder", label: "Ailenizin kaçıncı çocuğusunuz?"},
      { name: "familyLivesWith", label: "Evde sizinle birlikte kim/kimler yaşıyor? Yakınlık derecelerini belirtiniz."},
      { name: "familyMemberWithDisability", label: "Aile üyelerinizde sürekli bir hastalığı/engeli olan biri var mı? Varsa yazınız."},
      { name: "familyFinancialIssues", label: "Ailenizde sürekli borçlar ya da farklı nedenlerle yaşanan ekonomik sorunlar yaşanır mı?"}
    ]}
  ];


const InfoFormDetailDialog = ({ form, studentName, isOpen, onClose }: { form: InfoForm | null, studentName: string, isOpen: boolean, onClose: () => void }) => {
    
    const renderField = (label: string, value: any) => {
        if (value === undefined || value === null || value === '') return null;
        let displayValue = value;
        if (value instanceof Date) {
            displayValue = format(value, "dd.MM.yyyy");
        }
        return (
            <div className="py-2 border-b">
                <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                <p className="text-sm">{String(displayValue)}</p>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{studentName} - Öğrenci Bilgi Formu</DialogTitle>
                    {form?.formDate && <DialogDescription>Form Tarihi: {new Date(form.formDate).toLocaleDateString('tr-TR')}</DialogDescription>}
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4 mt-4">
                    {form ? (
                        formQuestions.map(section => (
                            <div key={section.section} className="mb-6">
                                <h3 className="font-bold text-lg border-b pb-2 mb-2">{section.section}</h3>
                                <div className="space-y-3">
                                    {section.fields.map(field => {
                                        const value = (form as any)[field.name];
                                        return renderField(field.label, value);
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Bu öğrenci için doldurulmuş bir form bulunamadı.</p>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};


export function StudentInfoFormTab({ students, currentClass, teacherProfile }: { students: Student[], currentClass: Class | null, teacherProfile: TeacherProfile | null }) {
    const { db } = useAuth();
    const { toast } = useToast();
    const [selectedForm, setSelectedForm] = useState<InfoForm | null>(null);
    const [selectedStudentName, setSelectedStudentName] = useState<string>('');

    const studentIds = useMemo(() => students.map(s => s.id), [students]);

    const infoFormsQuery = useMemoFirebase(() => {
        if (!db || studentIds.length === 0) return null;
        if (studentIds.length > 30) {
            toast({
                variant: "destructive",
                title: "Uyarı",
                description: "Sınıf mevcudu 30'dan fazla olduğu için tüm bilgi formları yüklenemeyebilir."
            });
        }
        return query(collection(db, 'infoForms'), where('studentId', 'in', studentIds.slice(0, 30)));
    }, [db, studentIds, toast]);

    const { data: infoForms, isLoading: infoFormsLoading } = useCollection<InfoForm>(infoFormsQuery);

    const handleToggleChange = async (checked: boolean) => {
        if (!currentClass || !db) return;
        const classRef = doc(db, 'classes', currentClass.id);
        try {
            await updateDoc(classRef, { isInfoFormActive: checked });
            toast({
                title: 'Başarılı',
                description: `Bilgi formu öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.`,
            });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Güncelleme sırasında bir sorun oluştu.',
            });
        }
    };
    
    const viewForm = (studentId: string, studentName: string) => {
        const formData = infoForms?.find(f => f.studentId === studentId) || null;
        setSelectedForm(formData);
        setSelectedStudentName(studentName);
    };
    
    const handleExport = () => {
        if (!currentClass || !teacherProfile || !students) return;
        // This function would need to be implemented to export all forms for the class.
        // For simplicity, we can demonstrate exporting a single visible form.
        if (selectedForm) {
            exportStudentInfoFormToRtf({ record: selectedForm, teacherProfile });
        } else {
            toast({ title: 'Lütfen önce bir form görüntüleyin.' });
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Öğrenci Bilgi Formu Takibi</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="info-form-toggle"
                                checked={currentClass?.isInfoFormActive || false}
                                onCheckedChange={handleToggleChange}
                                disabled={!currentClass}
                            />
                            <Label htmlFor="info-form-toggle">Form Aktif</Label>
                        </div>
                    </div>
                    <CardDescription>Öğrenciler tarafından doldurulan bilgi formlarının durumunu takip edin ve görüntüleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    {infoFormsLoading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead className="text-center">Durum</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => {
                                    const form = infoForms?.find(f => f.studentId === student.id);
                                    const isSubmitted = form?.submitted === true;
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell>{student.name} ({student.number})</TableCell>
                                            <TableCell className="text-center">
                                                {isSubmitted ? (
                                                    <span className="flex items-center justify-center text-green-600 font-medium">
                                                        <CheckCircle className="mr-2 h-4 w-4"/> Dolduruldu
                                                    </span>
                                                ) : (
                                                     <span className="flex items-center justify-center text-orange-600 font-medium">
                                                        <XCircle className="mr-2 h-4 w-4"/> Bekleniyor
                                                     </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => viewForm(student.id, student.name)}>
                                                    <Eye className="mr-2 h-4 w-4" /> Görüntüle
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            <InfoFormDetailDialog 
                form={selectedForm} 
                studentName={selectedStudentName}
                isOpen={!!selectedStudentName} 
                onClose={() => setSelectedStudentName('')} 
            />
        </>
    );
}
