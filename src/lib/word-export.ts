
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import { Student, InfoForm, TeacherProfile, Criterion, ReportConfig } from './types';
import { format } from 'date-fns';
import { ActiveGradingTab } from '@/components/dashboard/teacher/GradingToolTab';

export function exportStudentInfoToDoc(student: Student, form: InfoForm, teacher: TeacherProfile) {

  const doc = new docx.Document({
    compatibility: {
        compatibilityMode: docx.CompatibilityMode.WORD_2003,
    },
    sections: [{
      properties: {},
      children: [
        new docx.Paragraph({ text: "Öğrenci Bilgi Formu", heading: docx.HeadingLevel.HEADING_1, alignment: docx.AlignmentType.CENTER }),
        new docx.Paragraph({ text: `Okul: ${teacher.schoolName}`, alignment: docx.AlignmentType.LEFT }),
        new docx.Paragraph({ text: `Öğretmen: ${teacher.name}`, alignment: docx.AlignmentType.LEFT }),
        new docx.Paragraph({ text: `Müdür: ${teacher.principalName}`, alignment: docx.AlignmentType.LEFT }),
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({ text: `Öğrenci: ${student.name} (#${student.number})`, heading: docx.HeadingLevel.HEADING_2 }),
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({ text: "Kişisel Bilgiler", heading: docx.HeadingLevel.HEADING_3 }),
        new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Doğum Tarihi")] }), new docx.TableCell({ children: [new docx.Paragraph(form.birthDate ? format(form.birthDate.toDate(), 'dd.MM.yyyy') : 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Doğum Yeri")] }), new docx.TableCell({ children: [new docx.Paragraph(form.birthPlace || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Adres")] }), new docx.TableCell({ children: [new docx.Paragraph(form.address || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Sağlık Sorunları")] }), new docx.TableCell({ children: [new docx.Paragraph(form.healthIssues || 'Yok')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Hobiler")] }), new docx.TableCell({ children: [new docx.Paragraph(form.hobbies || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Teknoloji Kullanımı")] }), new docx.TableCell({ children: [new docx.Paragraph(form.techUsage || 'N/A')] })] }),
            ]
        }),
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({ text: "Veli Bilgileri", heading: docx.HeadingLevel.HEADING_3 }),
         new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Anne Durumu")] }), new docx.TableCell({ children: [new docx.Paragraph(form.motherStatus || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Anne Eğitim")] }), new docx.TableCell({ children: [new docx.Paragraph(form.motherEducation || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Anne Mesleği")] }), new docx.TableCell({ children: [new docx.Paragraph(form.motherJob || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Baba Durumu")] }), new docx.TableCell({ children: [new docx.Paragraph(form.fatherStatus || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Baba Eğitim")] }), new docx.TableCell({ children: [new docx.Paragraph(form.fatherEducation || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Baba Mesleği")] }), new docx.TableCell({ children: [new docx.Paragraph(form.fatherJob || 'N/A')] })] }),
            ]
        }),
        new docx.Paragraph({ text: "" }),
        new docx.Paragraph({ text: "Aile Bilgileri", heading: docx.HeadingLevel.HEADING_3 }),
        new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Kardeş Bilgileri")] }), new docx.TableCell({ children: [new docx.Paragraph(form.siblingsInfo || 'N/A')] })] }),
                new docx.TableRow({ children: [new docx.TableCell({ children: [new docx.Paragraph("Ekonomik Durum")] }), new docx.TableCell({ children: [new docx.Paragraph(form.economicStatus || 'N/A')] })] }),
            ]
        }),
      ],
    }],
  });

  docx.Packer.toBlob(doc).then(blob => {
    saveAs(blob, `${student.name.replace(/ /g, '_')}_Bilgi_Formu.docx`);
  });
}


// --- GRADING TOOL EXPORT ---
interface ExportGradingArgs {
    activeTab: ActiveGradingTab;
    students: Student[];
    currentCriteria: Criterion[];
    reportConfig?: ReportConfig;
    className: string;
}

export function exportGradingToDoc({
    activeTab,
    students,
    currentCriteria,
    reportConfig,
    className
}: ExportGradingArgs) {

    let targetKey: keyof Student, reportTitle: string;
    if (activeTab === 3) {
        targetKey = 'projectScores';
        reportTitle = "PROJE ÖDEVİ DEĞERLENDİRME ÖLÇEĞİ";
    } else if (activeTab === 4) {
        targetKey = 'behaviorScores';
        reportTitle = "DAVRANIŞ (KANAAT) DEĞERLENDİRME ÖLÇEĞİ";
    } else {
        targetKey = activeTab === 1 ? 'scores1' : 'scores2';
        reportTitle = `${activeTab}. PERFORMANS DEĞERLENDİRME ÖLÇEĞİ`;
    }

    const visibleStudents = activeTab === 3 
        ? students.filter(s => s.hasProject) 
        : students;

    if (visibleStudents.length === 0) {
        alert("Listede öğrenci yok, çıktı alınamaz.");
        return;
    }
    
    const calculateTotal = (scores: { [key: string]: number } | undefined) => {
        if (!scores) return 0;
        return currentCriteria.reduce((sum, c) => sum + (Number(scores[c.id]) || 0), 0);
    };

    const school = reportConfig?.schoolName || "..........................................";
    const year = reportConfig?.academicYear || "20....-20....";
    const lesson = reportConfig?.lessonName || "...................";
    const term = reportConfig?.semester || "1";
    const teacher = reportConfig?.teacherName || "...........................";
    const principal = reportConfig?.principalName || "...........................";
    const date = reportConfig?.date || new Date().toLocaleDateString('tr-TR');

    const title = `${className} - ${activeTab === 3 ? "Proje" : activeTab === 4 ? "Davranış" : activeTab + ". Performans"}`;

    const tableHeader = new docx.TableRow({
        tableHeader: true,
        children: [
            new docx.TableCell({ children: [new docx.Paragraph({ text: "S.No", alignment: docx.AlignmentType.CENTER, bold: true })], width: { size: 5, type: docx.WidthType.PERCENTAGE } }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: "Adı Soyadı", alignment: docx.AlignmentType.LEFT, bold: true })], width: { size: 25, type: docx.WidthType.PERCENTAGE } }),
            ...currentCriteria.map(c => new docx.TableCell({ children: [
                new docx.Paragraph({ text: c.name, alignment: docx.AlignmentType.CENTER, bold: true }), 
                new docx.Paragraph({ text: `(${c.max} P)`, alignment: docx.AlignmentType.CENTER, style: 'small' })
            ] })),
            new docx.TableCell({ children: [new docx.Paragraph({ text: "PUAN", alignment: docx.AlignmentType.CENTER, bold: true })], width: { size: 10, type: docx.WidthType.PERCENTAGE } }),
        ],
    });

    const dataRows = visibleStudents.map((s, index) => {
        const scores = s[targetKey as keyof Student] as { [key: string]: number } | undefined;
        const total = calculateTotal(scores);
        return new docx.TableRow({
            children: [
                new docx.TableCell({ children: [new docx.Paragraph({ text: `${index + 1}`, alignment: docx.AlignmentType.CENTER })] }),
                new docx.TableCell({ children: [new docx.Paragraph({ text: s.name, alignment: docx.AlignmentType.LEFT })] }),
                ...currentCriteria.map(c => new docx.TableCell({ children: [new docx.Paragraph({ text: `${scores?.[c.id] || 0}`, alignment: docx.AlignmentType.CENTER })] })),
                new docx.TableCell({ children: [new docx.Paragraph({ text: `${total}`, bold: true, alignment: docx.AlignmentType.CENTER })] }),
            ],
        });
    });

    const signatureTable = new docx.Table({
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE }, insideHorizontal: { style: docx.BorderStyle.NONE }, insideVertical: { style: docx.BorderStyle.NONE } },
        rows: [
             new docx.TableRow({
                children: [
                    new docx.TableCell({ children: [ new docx.Paragraph('Uygundur'), new docx.Paragraph(date) ], alignment: docx.AlignmentType.CENTER, borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                    new docx.TableCell({ children: [], borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                    new docx.TableCell({ children: [new docx.Paragraph("Tasdik Olunur")], alignment: docx.AlignmentType.CENTER, borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                ],
            }),
             new docx.TableRow({
                children: [ new docx.TableCell({ children: [], borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),new docx.TableCell({ children: [], borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),new docx.TableCell({ children: [], borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }) ],
            }),
            new docx.TableRow({
                children: [
                    new docx.TableCell({ children: [new docx.Paragraph({ text: teacher, bold: true }), new docx.Paragraph("Ders Öğretmeni")], alignment: docx.AlignmentType.CENTER, borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                    new docx.TableCell({ children: [], borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                    new docx.TableCell({ children: [new docx.Paragraph({ text: principal, bold: true }), new docx.Paragraph("Okul Müdürü")], alignment: docx.AlignmentType.CENTER, borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } } }),
                ],
            }),
        ],
    })


    const doc = new docx.Document({
        compatibility: {
            compatibilityMode: docx.CompatibilityMode.WORD_2003,
        },
        styles: {
            paragraphStyles: [
                 { id: "small", name: "Small Text", run: { size: 16 } },
            ]
        },
        sections: [{
            children: [
                new docx.Paragraph({ text: "T.C.", alignment: docx.AlignmentType.CENTER, style: "Normal" }),
                new docx.Paragraph({ text: `${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜ`, alignment: docx.AlignmentType.CENTER, bold: true }),
                new docx.Paragraph({ text: `${year} EĞİTİM ÖĞRETİM YILI ${lesson.toLocaleUpperCase('tr-TR')} DERSİ`, alignment: docx.AlignmentType.CENTER, bold: true }),
                new docx.Paragraph({ text: `${className.toLocaleUpperCase('tr-TR')} SINIFI ${term}. DÖNEM ${reportTitle}`, alignment: docx.AlignmentType.CENTER, bold: true }),
                new docx.Paragraph({ text: "" }),
                new docx.Table({
                    width: { size: 100, type: docx.WidthType.PERCENTAGE },
                    rows: [tableHeader, ...dataRows],
                }),
                new docx.Paragraph({ text: "" }),
                new docx.Paragraph({ text: "" }),
                signatureTable,
            ],
        }],
    });

    docx.Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${title.replace(/ /g, '_')}.docx`);
    });
}
