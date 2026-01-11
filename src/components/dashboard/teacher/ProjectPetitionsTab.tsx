'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, FileDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Student } from '@/lib/types';
import { saveAs } from 'file-saver';
import { Label } from '@/components/ui/label';


export function ProjectPetitionsTab({ students: initialStudents, teacherProfile }: { students: Student[], teacherProfile: any }) {
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [students, setStudents] = useState<Partial<Student>[]>([]);

  useEffect(() => {
    setTeacherName(teacherProfile?.name || '');
    setSchoolName(teacherProfile?.schoolName || '');
  }, [teacherProfile]);

  const importClassList = () => {
    const classStudents = initialStudents.map(s => ({
      id: s.id,
      number: s.number,
      name: s.name,
      className: s.classId, // This might need adjustment based on how you get class name
    }));
    setStudents(classStudents);
  };
  
  const addStudent = () => {
    setStudents([...students, { id: `manual_${Date.now()}`, number: '', name: '', className: '' }]);
  };

  const removeStudent = (id: any) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: any, field: string, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDownloadDoc = () => {
    const css = `
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; margin: 0; padding: 0; }
        .dilekce-container { height: 9.5cm; border-bottom: 1px dashed #999; padding: 20px 40px; box-sizing: border-box; position: relative; page-break-inside: avoid; }
        .header { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 10px; text-transform: uppercase; }
        .tarih-sag { text-align: right; margin-bottom: 10px; font-size: 11pt; }
        .content { text-align: justify; margin-bottom: 15px; line-height: 1.4; }
        .tercihler { margin-left: 10px; margin-bottom: 20px; }
        .tercih-satir { margin-bottom: 8px; }
        .imza-tablosu { width: 100%; margin-top: 25px; border-collapse: collapse; }
        .imza-hucre { vertical-align: top; width: 50%; padding: 5px; }
        .imza-baslik { font-weight: bold; margin-bottom: 40px; display: block; }
        .imza-isim { font-weight: bold; display: block; margin-top: 40px; text-transform: uppercase; }
        .imza-unvan { font-size: 10pt; }
        @media print { .page-break { page-break-after: always; } }
      </style>
    `;

    let htmlContent = '';
    students.forEach((student, index) => {
      const isThirdItem = (index + 1) % 3 === 0;
      
      htmlContent += `
        <div class="dilekce-container">
          <div class="header">${schoolName || '........................................... OKULU MÜDÜRLÜĞÜNE'}</div>
          <div class="tarih-sag">${new Date().toLocaleDateString('tr-TR')}</div>
          <div class="content">
            Okulunuzun <b>${student.className || '.......'}</b> sınıfı, <b>${student.number || '.......'}</b> numaralı öğrencisiyim.
            <b>${academicYear}</b> Eğitim-Öğretim yılında proje ödevi almak istediğim derslere ait tercihlerim öncelik sırasına göre aşağıdadır.
            <br/>Gereğini bilgilerinize arz ederim.
          </div>
          <div class="tercihler">
            ${[1, 2, 3, 4, 5].map(n => `<div class="tercih-satir"><b>${n}.</b> ....................................................................</div>`).join('')}
          </div>
          <table class="imza-tablosu">
            <tr>
              <td class="imza-hucre" align="center">
                <span class="imza-baslik">Uygundur</span><br/><br/>
                <span class="imza-isim">${teacherName || '...................................'}</span><br/>
                <span class="imza-unvan">Sınıf Rehber Öğretmeni</span>
              </td>
              <td class="imza-hucre" align="center">
                <div style="height: 40px;"></div>
                <span class="imza-isim">${student.name || '...................................'}</span><br/>
                <span>İmza</span>
              </td>
            </tr>
          </table>
        </div>
        ${isThirdItem ? '<div class="page-break"></div>' : ''}
      `;
    });

    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Proje Tercih Dilekçeleri</title>${css}</head>
      <body>${htmlContent}</body></html>
    `;
    
    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword;charset=utf-8;' });
    saveAs(blob, 'proje_tercih_dilekceleri.doc');
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Proje Tercih Dilekçesi Oluşturucu</CardTitle>
                <Button onClick={handleDownloadDoc}><FileDown className="mr-2"/> Word Olarak İndir</Button>
            </div>
            <CardDescription>
                Sınıf listenizi aktarın ve tüm öğrenciler için tek bir dosyada tercih dilekçeleri oluşturun.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-xs font-semibold">Okul Adı</Label>
                    <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                   <div>
                    <Label className="text-xs font-semibold">Eğitim Yılı</Label>
                    <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                  </div>
                   <div>
                    <Label className="text-xs font-semibold">Sınıf Rehber Öğretmeni</Label>
                    <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                  </div>
            </div>
            <div className="flex justify-end">
                <Button onClick={importClassList}><Users className="mr-2"/>Sınıf Listesini Aktar</Button>
            </div>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">No</TableHead>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead className="w-32">Sınıf</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell><Input value={student.number} onChange={(e) => updateStudent(student.id!, 'number', e.target.value)} placeholder="No" /></TableCell>
                    <TableCell><Input value={student.name} onChange={(e) => updateStudent(student.id!, 'name', e.target.value)} placeholder="İsim" /></TableCell>
                    <TableCell><Input value={student.className} onChange={(e) => updateStudent(student.id!, 'className', e.target.value)} placeholder="Sınıf" /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeStudent(student.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outline" onClick={addStudent} className="w-full border-dashed"><Plus className="mr-2"/>Öğrenci Ekle</Button>
        </CardContent>
    </Card>
  )
}
