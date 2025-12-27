import { Student, InfoForm, TeacherProfile, Criterion, ReportConfig } from './types';
import { format } from 'date-fns';
import { ActiveGradingTab } from '@/components/dashboard/teacher/GradingToolTab';

export function exportStudentInfoToDoc(student: Student, form: InfoForm, teacher: TeacherProfile) {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Student Information</title></head>
    <body>
      <h1>Student Information Form</h1>
      <p><strong>School:</strong> ${teacher.schoolName}</p>
      <p><strong>Teacher:</strong> ${teacher.name}</p>
      <p><strong>Principal:</strong> ${teacher.principalName}</p>
      <br/>
      <h2>Student: ${student.name} (#${student.number})</h2>
      <br/>
      <h3>Personal Information</h3>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:5px;"><strong>Date of Birth</strong></td><td style="padding:5px;">${form.birthDate ? format(form.birthDate.toDate(), 'PPP') : 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Place of Birth</strong></td><td style="padding:5px;">${form.birthPlace || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Address</strong></td><td style="padding:5px;">${form.address || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Health Issues</strong></td><td style="padding:5px;">${form.healthIssues || 'None'}</td></tr>
        <tr><td style="padding:5px;"><strong>Hobbies</strong></td><td style="padding:5px;">${form.hobbies || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Tech Usage</strong></td><td style="padding:5px;">${form.techUsage || 'N/A'}</td></tr>
      </table>
      <br/>
      <h3>Parent Information</h3>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:5px;"><strong>Mother's Status</strong></td><td style="padding:5px;">${form.motherStatus || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Mother's Education</strong></td><td style="padding:5px;">${form.motherEducation || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Mother's Job</strong></td><td style="padding:5px;">${form.motherJob || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Father's Status</strong></td><td style="padding:5px;">${form.fatherStatus || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Father's Education</strong></td><td style="padding:5px;">${form.fatherEducation || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Father's Job</strong></td><td style="padding:5px;">${form.fatherJob || 'N/A'}</td></tr>
      </table>
      <br/>
      <h3>Family Information</h3>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:5px;"><strong>Siblings</strong></td><td style="padding:5px;">${form.siblingsInfo || 'N/A'}</td></tr>
        <tr><td style="padding:5px;"><strong>Economic Status</strong></td><td style="padding:5px;">${form.economicStatus || 'N/A'}</td></tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword'
  });

  const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(htmlContent);

  const filename = `${student.name.replace(' ', '_')}_Info.doc`;

  const downloadLink = document.createElement("a");
  document.body.appendChild(downloadLink);

  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.click();
  }

  document.body.removeChild(downloadLink);
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

    let html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title>
    <style>
    body { font-family: 'Times New Roman', serif; font-size: 11pt; }
    table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    th, td { border: 1px solid black; padding: 4px; text-align: center; font-size: 9pt; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .text-left { text-align: left; padding-left: 5px; }
    .header-text { text-align: center; font-weight: bold; line-height: 1.5; margin-bottom: 20px; }
    .footer-table { border: none; margin-top: 40px; }
    .footer-table td { border: none; vertical-align: top; }
    </style>
    </head><body>
    
    <div class="header-text">
        T.C.<br/>
        ${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜ<br/>
        ${year} EĞİTİM ÖĞRETİM YILI ${lesson.toLocaleUpperCase('tr-TR')} DERSİ<br/>
        ${className.toLocaleUpperCase('tr-TR')} SINIFI ${term}. DÖNEM ${reportTitle}
    </div>

    <table>
    <thead>
        <tr>
        <th style="width: 5%">S.No</th>
        <th class="text-left" style="width: 20%">Adı Soyadı</th>
        ${currentCriteria.map(c => `<th>${c.name}<br/><span style="font-size:8pt">(${c.max} P)</span></th>`).join('')}
        <th style="width: 8%">PUAN</th>
        </tr>
    </thead>
    <tbody>`;

    visibleStudents.forEach((s, index) => {
        const scores = s[targetKey as keyof Student] as { [key: string]: number } | undefined;
        const total = calculateTotal(scores);
        html += `<tr>
            <td>${index + 1}</td>
            <td class="text-left">${s.name}</td>
            ${currentCriteria.map(c => `<td>${scores?.[c.id] || 0}</td>`).join('')}
            <td><strong>${total}</strong></td>
        </tr>`;
    });

    html += `</tbody></table>
    
    <table class="footer-table">
        <tr>
            <td style="width: 33%; text-align: left;">
                <br/>
                Uygundur<br/>
                ${date}
            </td>
            <td style="width: 33%; text-align: center;"></td>
            <td style="width: 33%; text-align: center;">
                <br/>
                Tasdik Olunur
            </td>
        </tr>
        <tr>
            <td style="text-align: center;">
                <strong>${teacher}</strong><br/>
                Ders Öğretmeni
            </td>
            <td></td>
            <td style="text-align: center;">
                <strong>${principal}</strong><br/>
                Okul Müdürü
            </td>
        </tr>
    </table>
    </body></html>`;
    
    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
