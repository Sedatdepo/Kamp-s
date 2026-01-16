'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Eye, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useMemoFirebase } from '@/firebase';
import { Class, InfoForm, TeacherProfile } from '@/lib/types';
import { Dialog, DialogClose, DialogFooter, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { exportStudentInfoFormToRtf } from '@/lib/word-export';

const infoFormSchema = z.object({
  birthDate: z.date().optional(),
  birthPlace: z.string().optional(),
  studentPhone: z.string().min(10, "Geçerli bir telefon numarası girin."),
  studentEmail: z.string().email("Geçersiz e-posta.").optional().or(z.literal('')),
  address: z.string().optional(),
  healthIssues: z.string().optional(),
  hobbies: z.string().optional(),
  techUsage: z.string().optional(),
  motherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  motherEducation: z.string().optional(),
  motherJob: z.string().optional(),
  fatherStatus: z.enum(['alive', 'deceased', 'unknown']).optional(),
  fatherEducation: z.string().optional(),
  fatherJob: z.string().optional(),
  siblingsInfo: z.string().optional(),
  economicStatus: z.enum(['low', 'middle', 'high']).optional(),
  homeEnvironment: z.string().optional(),
  parentalAttitude: z.string().optional(),
  hasDisability: z.enum(['yes', 'no']).optional(),
  isMartyrVeteranChild: z.enum(['yes', 'no']).optional(),
});

type InfoFormData = z.infer<typeof infoFormSchema>;

const formQuestions = [
    { section: "Kişisel Bilgiler", fields: [
      { name: "birthDate", label: "Doğum Tarihi", type: "date" },
      { name: "birthPlace", label: "Doğum Yeri", type: "text" },
      { name: "studentPhone", label: "Telefon Numarası", type: "text" },
      { name: "studentEmail", label: "E-posta Adresi", type: "email" },
      { name: "address", label: "Adres", type: "textarea" },
      { name: "healthIssues", label: "Sürekli Sağlık Sorunu / Alerji", type: "text" },
      { name: "hobbies", label: "Hobiler ve İlgi Alanları", type: "text" },
      { name: "techUsage", label: "Günlük Teknoloji Kullanım Süresi", type: "text" },
    ]},
    { section: "Aile Bilgileri", fields: [
      { name: "motherStatus", label: "Anne Hayatta Mı?", type: "select", options: [{value: "alive", label: "Hayatta"}, {value: "deceased", label: "Vefat Etti"}] },
      { name: "motherEducation", label: "Anne Eğitim Durumu", type: "text" },
      { name: "motherJob", label: "Anne Mesleği", type: "text" },
      { name: "fatherStatus", label: "Baba Hayatta Mı?", type: "select", options: [{value: "alive", label: "Hayatta"}, {value: "deceased", label: "Vefat Etti"}] },
      { name: "fatherEducation", label: "Baba Eğitim Durumu", type: "text" },
      { name: "fatherJob", label: "Baba Mesleği", type: "text" },
      { name: "siblingsInfo", label: "Kardeş Bilgileri (Yaş, okul durumu vb.)", type: "textarea" },
      { name: "economicStatus", label: "Ailenin Ekonomik Durumu", type: "select", options: [{value: "low", label: "Düşük"}, {value: "middle", label: "Orta"}, {value: "high", label: "Yüksek"}]},
      { name: "homeEnvironment", label: "Evde Çalışma Ortamı", type: "textarea", placeholder: "Öğrencinin ders çalışmak için ayrı bir odası var mı?" },
      { name: "parentalAttitude", label: "Ailenin Derslere Karşı Tutumu", type: "textarea", placeholder: "Aile ders başarısını önemsiyor mu, destek oluyor mu?" },
    ]},
    { section: "Özel Durum Bilgileri", fields: [
      { name: "hasDisability", label: "Herhangi bir engel durumu var mı?", type: "select", options: [{value: "yes", label: "Evet"}, {value: "no", label: "Hayır"}] },
      { name: "isMartyrVeteranChild", label: "Şehit veya Gazi yakını mı?", type: "select", options: [{value: "yes", label: "Evet"}, {value: "no", label: "Hayır"}] },
    ]}
];


const InfoFormDetailDialog = ({ form, studentName, isOpen, onClose, onExport, teacherProfile }: { form: InfoForm | null, studentName: string, isOpen: boolean, onClose: () => void, onExport: (form: InfoForm) => void, teacherProfile: TeacherProfile | null }) => {
    
    const renderFieldValue = (value: any) => {
        if (value === undefined || value === null || value === '') return <span className="text-muted-foreground italic">Belirtilmemiş</span>;
        if (value.toDate && typeof value.toDate === 'function') { 
            return format(value.toDate(), "dd.MM.yyyy");
        } else if (value instanceof Date) {
             return format(value, "dd.MM.yyyy");
        }
        return String(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{studentName} - Öğrenci Bilgi Formu</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4 mt-4">
                    {form ? (
                        <div className="space-y-6">
                            {formQuestions.map((section, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-lg border-b pb-2 mb-3">{section.section}</h3>
                                    <div className="space-y-4">
                                        {section.fields.map(field => (
                                            <div key={field.name} className="grid grid-cols-3 gap-4 text-sm">
                                                <p className="font-semibold text-muted-foreground col-span-1">{field.label}</p>
                                                <p className="col-span-2">{renderFieldValue((form as any)[field.name])}</p>
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
    if (studentIds.length > 30) {
        toast({ variant: "destructive", title: "Uyarı", description: "Sınıf mevcudu 30'dan fazla olduğu için tüm bilgi formları yüklenemeyebilir." });
    }
    return query(collection(db, 'infoForms'), where('studentId', 'in', studentIds.slice(0, 30)));
  }, [db, studentIds, toast]);

  const { data: infoForms, isLoading: infoFormsLoading } = useCollection<InfoForm>(infoFormsQuery);

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
            onExport={handleExport}
            teacherProfile={teacherProfile}
        />
    </>
  );
}
