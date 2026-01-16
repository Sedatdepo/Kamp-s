'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, FileDown, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Class, InfoForm, TeacherProfile, Student, RiskFactor } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { exportStudentInfoFormToRtf } from '@/lib/word-export';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const InfoFormDetailDialog = ({ form, studentName, isOpen, onClose, onExport, teacherProfile }: { form: InfoForm | null, studentName: string, isOpen: boolean, onClose: () => void, onExport: (form: InfoForm) => void, teacherProfile: TeacherProfile | null }) => {
    
    const renderFieldValue = (value: any) => {
        if (value === undefined || value === null || value === '') return <span className="text-muted-foreground italic">Belirtilmemiş</span>;
        if (value.toDate && typeof value.toDate === 'function') return format(value.toDate(), "dd.MM.yyyy");
        if (value instanceof Date) return format(value, "dd.MM.yyyy");
        if (value === 'yes') return 'Evet';
        if (value === 'no') return 'Hayır';
        if (value === 'alive') return 'Hayatta';
        if (value === 'deceased') return 'Vefat Etti';
        if (value === 'walking') return 'Yürüyerek';
        if (value === 'service') return 'Servis';
        if (value === 'public') return 'Toplu Taşıma';
        if (value === 'private') return 'Özel Araç';
        if (value === 'other') return 'Diğer';
        return String(value);
    };

    const formQuestions = useMemo(() => [
        { section: "Kişisel ve İletişim Bilgileri", fields: [
            { name: "birthDate", label: "Doğum Tarihi" }, { name: "birthPlace", label: "Doğum Yeri" },
            { name: "studentPhone", label: "Öğrenci Telefonu" }, { name: "studentEmail", label: "E-posta" },
            { name: "address", label: "Adres" }, { name: "bloodType", label: "Kan Grubu" },
            { name: "height", label: "Boy" }, { name: "weight", label: "Kilo" },
            { name: "foreignLanguage", label: "Yabancı Dil" },
        ]},
        { section: "Sağlık Bilgileri", fields: [
            { name: "healthIssues", label: "Sürekli Hastalık/Alerji" },
            { name: "pastIllnesses", label: "Geçmiş Önemli Hastalık/Ameliyat" },
            { name: "healthDevice", label: "Kullandığı Cihaz/Protez" },
        ]},
        { section: "Sosyo-Ekonomik Durum", fields: [
            { name: "isWorking", label: "Bir İşte Çalışıyor mu?" },
            { name: "commutesToSchoolBy", label: "Okula Ulaşım Şekli" },
            { name: "economicStatus", label: "Ailenin Gelir Düzeyi" },
            { name: "isHomeRented", label: "Oturulan Ev Kira mı?" },
            { name: "hasOwnRoom", label: "Kendine Ait Odası Var mı?" },
        ]},
        { section: "Aile Bilgileri", fields: [
            { name: "guardianPhone", label: "Veli Telefonu" },
            { name: "motherStatus", label: "Anne Hayatta mı?" }, { name: "motherEducation", label: "Anne Eğitimi" }, { name: "motherJob", label: "Anne Mesleği" },
            { name: "fatherStatus", label: "Baba Hayatta mı?" }, { name: "fatherEducation", label: "Baba Eğitimi" }, { name: "fatherJob", label: "Baba Mesleği" },
            { name: "familyLivesWith", label: "Kiminle Yaşıyor?" }, { name: "siblingsInfo", label: "Kardeş Bilgileri" },
            { name: "hasStepSibling", label: "Üvey Kardeşi Var mı?" }, { name: "parentalAttitude", label: "Ailenin Derslere Tutumu" },
        ]},
        { section: "Özel Durum", fields: [
            { name: "hasDisability", label: "Engel Durumu" },
            { name: "isMartyrVeteranChild", label: "Şehit/Gazi Yakını mı?" },
        ]}
    ], []);


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{studentName} - Öğrenci Bilgi Formu</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4 mt-4">
                    {form ? (
                        <div className="space-y-6">
                           {formQuestions.map(section => (
                                <div key={section.section}>
                                    <h3 className="font-bold text-lg border-b pb-2 mb-3">{section.section}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                        {section.fields.map(field => (
                                            <div key={field.name} className="py-2 border-b border-dashed">
                                                <p className="text-xs font-semibold text-muted-foreground">{field.label}</p>
                                                <p className="text-sm">{renderFieldValue((form as any)[field.name])}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Bu öğrenci için doldurulmuş bir form bulunamadı.</p>
                    )}
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Kapat</Button>
                    <Button onClick={() => form && onExport(form)} disabled={!form}><FileDown className="mr-2 h-4 w-4"/> Word Olarak İndir</Button>
                </DialogFooter>
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
    return query(collection(db, 'infoForms'), where('studentId', 'in', studentIds));
  }, [db, studentIds]);

  const { data: infoForms, isLoading: infoFormsLoading } = useCollection<InfoForm>(infoFormsQuery);
  
  const riskFactorsQuery = useMemoFirebase(() => {
    if (!db) return null;
    // Assuming teacherId is available on teacherProfile
    if (!teacherProfile?.id) return null;
    return query(collection(db, 'riskFactors'), where('teacherId', '==', teacherProfile.id));
  }, [db, teacherProfile?.id]);
  const { data: riskFactors, isLoading: riskFactorsLoading } = useCollection<RiskFactor>(riskFactorsQuery);
  
  const getRiskScore = (studentRisks: string[]) => {
    if (!riskFactors) return 0;
    return studentRisks.reduce((total, riskId) => {
      const factor = riskFactors.find(f => f.id === riskId);
      return total + (factor?.weight || 0);
    }, 0);
  };

  const handleToggleChange = async (checked: boolean) => {
    if (!currentClass || !db) return;
    const classRef = doc(db, 'classes', currentClass.id);
    try {
        await updateDoc(classRef, { isInfoFormActive: checked });
        toast({ title: 'Başarılı', description: `Bilgi formu öğrenciler için ${checked ? 'aktif edildi' : 'kapatıldı'}.` });
    } catch {
        toast({ variant: 'destructive', title: 'Hata', description: 'Güncelleme sırasında bir sorun oluştu.' });
    }
  };
  
  const viewForm = (studentId: string, studentName: string) => {
    const formData = infoForms?.find(f => f.studentId === studentId) || null;
    setSelectedForm(formData);
    setSelectedStudentName(studentName);
  };
  
  const handleExport = (form: InfoForm) => {
      exportStudentInfoFormToRtf({ record: form, studentName: selectedStudentName, teacherProfile });
  }

  return (
    <>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Öğrenci Bilgi Formu Takibi</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Switch id="info-form-toggle" checked={currentClass?.isInfoFormActive || false} onCheckedChange={handleToggleChange} disabled={!currentClass}/>
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
                                <TableHead>Veli Telefonu</TableHead>
                                <TableHead className="text-center">Risk Puanı</TableHead>
                                <TableHead className="text-center">Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => {
                                const form = infoForms?.find(f => f.studentId === student.id);
                                const riskScore = getRiskScore(student.risks || []);
                                const isSubmitted = form?.submitted === true;
                                return (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.name} ({student.number})</TableCell>
                                        <TableCell>{form?.guardianPhone || '-'}</TableCell>
                                        <TableCell className="text-center font-bold">{riskScore}</TableCell>
                                        <TableCell className="text-center">
                                            {isSubmitted ? (
                                                <span className="flex items-center justify-center text-green-600 font-medium"><CheckCircle className="mr-2 h-4 w-4"/> Dolduruldu</span>
                                            ) : (
                                                 <span className="flex items-center justify-center text-orange-600 font-medium"><XCircle className="mr-2 h-4 w-4"/> Bekleniyor</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="outline" size="sm" onClick={() => viewForm(student.id, student.name)}><Eye className="mr-2 h-4 w-4" /> Görüntüle</Button>
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
            onExport={handleExport}
            teacherProfile={teacherProfile}
        />
    </>
  );
}
    