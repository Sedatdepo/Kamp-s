import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, HeadingLevel, AlignmentType } from 'docx';
import { Student, InfoForm, TeacherProfile, Criterion, ReportConfig } from './types';
import { format } from 'date-fns';
import { ActiveGradingTab } from '@/components/dashboard/teacher/GradingToolTab';

export function exportStudentInfoToDoc(student: Student, form: InfoForm, teacher: TeacherProfile) {

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "Öğrenci Bilgi Formu", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        new Paragraph({ text: `Okul: ${teacher.schoolName}`, alignment: AlignmentType.LEFT }),
        new Paragraph({ text: `Öğretmen: ${teacher.name}`, alignment: AlignmentType.LEFT }),
        new Paragraph({ text: `Müdür: ${teacher.principalName}`, alignment: AlignmentType.LEFT }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: `Öğrenci: ${student.name} (#${student.number})`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Kişisel Bilgiler", heading: HeadingLevel.HEADING_3 }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Doğum Tarihi")] }), new TableCell({ children: [new Paragraph(form.birthDate ? format(form.birthDate.toDate(), 'dd.MM.yyyy') : 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Doğum Yeri")] }), new TableCell({ children: [new Paragraph(form.birthPlace || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Adres")] }), new TableCell({ children: [new Paragraph(form.address || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Sağlık Sorunları")] }), new TableCell({ children: [new Paragraph(form.healthIssues || 'Yok')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Hobiler")] }), new TableCell({ children: [new Paragraph(form.hobbies || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Teknoloji Kullanımı")] }), new TableCell({ children: [new Paragraph(form.techUsage || 'N/A')] })] }),
            ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Veli Bilgileri", heading: HeadingLevel.HEADING_3 }),
         new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Anne Durumu")] }), new TableCell({ children: [new Paragraph(form.motherStatus || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Anne Eğitim")] }), new TableCell({ children: [new Paragraph(form.motherEducation || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Anne Mesleği")] }), new TableCell({ children: [new Paragraph(form.motherJob || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Baba Durumu")] }), new TableCell({ children: [new Paragraph(form.fatherStatus || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Baba Eğitim")] }), new TableCell({ children: [new Paragraph(form.fatherEducation || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Baba Mesleği")] }), new TableCell({ children: [new Paragraph(form.fatherJob || 'N/A')] })] }),
            ]
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Aile Bilgileri", heading: HeadingLevel.HEADING_3 }),
        new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Kardeş Bilgileri")] }), new TableCell({ children: [new Paragraph(form.siblingsInfo || 'N/A')] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph("Ekonomik Durum")] }), new TableCell({ children: [new Paragraph(form.economicStatus || 'N/A')] })] }),
            ]
        }),
      ],
    }],
  });

  Packer.toBlob(doc).then(blob => {
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

    const headerRows = [
        new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: "S.No", bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: "Adı Soyadı", bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                ...currentCriteria.map(c => new TableCell({ children: [new Paragraph({ text: c.name, bold: true }), new Paragraph({ text: `(${c.max} P)`, size: 8 })] })),
                new TableCell({ children: [new Paragraph({ text: "PUAN", bold: true })] }),
            ],
        }),
    ];

    const dataRows = visibleStudents.map((s, index) => {
        const scores = s[targetKey as keyof Student] as { [key: string]: number } | undefined;
        const total = calculateTotal(scores);
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(`${index + 1}`)] }),
                new TableCell({ children: [new Paragraph(s.name)], alignment: AlignmentType.LEFT }),
                ...currentCriteria.map(c => new TableCell({ children: [new Paragraph(`${scores?.[c.id] || 0}`)] })),
                new TableCell({ children: [new Paragraph({ text: `${total}`, bold: true })] }),
            ],
        });
    });

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({ text: "T.C.", alignment: AlignmentType.CENTER, style: "Normal" }),
                new Paragraph({ text: `${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜ`, alignment: AlignmentType.CENTER, bold: true }),
                new Paragraph({ text: `${year} EĞİTİM ÖĞRETİM YILI ${lesson.toLocaleUpperCase('tr-TR')} DERSİ`, alignment: AlignmentType.CENTER, bold: true }),
                new Paragraph({ text: `${className.toLocaleUpperCase('tr-TR')} SINIFI ${term}. DÖNEM ${reportTitle}`, alignment: AlignmentType.CENTER, bold: true }),
                new Paragraph({ text: "" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [...headerRows, ...dataRows],
                }),
                new Paragraph({ text: "" }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    columnWidths: [33, 34, 33],
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph(""), new Paragraph("Uygundur"), new Paragraph(date)], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                                new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                                new TableCell({ children: [new Paragraph(""), new Paragraph("Tasdik Olunur")], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, alignment: AlignmentType.CENTER }),
                            ],
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: teacher, bold: true }), new Paragraph("Ders Öğretmeni")], alignment: AlignmentType.CENTER, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                                new TableCell({ children: [], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                                new TableCell({ children: [new Paragraph({ text: principal, bold: true }), new Paragraph("Okul Müdürü")], alignment: AlignmentType.CENTER, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
                            ],
                        }),
                    ],
                }),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${title.replace(/ /g, '_')}.docx`);
    });
}
