import { saveAs } from 'file-saver';
import { Student, InfoForm, TeacherProfile, Criterion, Class, Lesson, RiskFactor, Election, Candidate, RosterItem, GradingScores, DailyPlan, AnnualPlanEntry, AnnualPlan, DilekceDocument, Homework, Submission } from './types';
import { format, parseISO } from 'date-fns';
import { ActiveGradingTab, ActiveTerm } from '@/components/dashboard/teacher/GradingToolTab';
import { INITIAL_BEHAVIOR_CRITERIA, INITIAL_PERF_CRITERIA, INITIAL_PROJ_CRITERIA } from './grading-defaults';


// We are generating an HTML string and telling the browser to save it as an .rtf file.
// Word and other text editors can correctly interpret this HTML-like structure as a rich text document.
// This provides maximum compatibility, especially with older versions like Word 2003.
const generateHtmlShell = (content: string, title: string) => {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0.5in;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 10pt;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid black;
          padding: 4px;
          text-align: left;
          vertical-align: top;
        }
        th {
          font-weight: bold;
          text-align: center;
          background-color: #f2f2f2;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .no-border { border: none; }
        .small-text { font-size: 8pt; }
        .header-p { margin: 0; padding: 0; }
        .word-export-desk-container { vertical-align: top; }
        .word-export-desk { width: 100%; border: 1.5px solid #d97706; background-color: #fef3c7; border-collapse: collapse; }
        .word-export-seat { width: 50%; height: 50px; border: 1px solid #d97706; padding: 4px; text-align: center; vertical-align: middle; font-size: 11px; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
};

const downloadRtf = (htmlContent: string, filename: string) => {
    const blob = new Blob([htmlContent], { type: 'application/rtf;charset=utf-8;' });
    saveAs(blob, filename);
};

const generateReportHeader = (
    reportTitle: string, 
    currentClass: Class, 
    teacherProfile?: TeacherProfile | null, 
) => {
    const config = teacherProfile?.reportConfig;
    const school = config?.schoolName || "..........................................";
    const year = config?.academicYear || "20....-20....";
    const lesson = config?.lessonName || "...................";
    const term = config?.semester || "1";

    return `
        <div class="center">
            <p class="header-p bold">T.C.</p>
            <p class="header-p bold">${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜ</p>
            <p class="header-p bold">${year} EĞİTİM ÖĞRETİM YILI ${lesson.toLocaleUpperCase('tr-TR')} DERSİ</p>
            <p class="header-p bold">${currentClass.name.toLocaleUpperCase('tr-TR')} SINIFI ${reportTitle.toLocaleUpperCase('tr-TR')}</p>
        </div>
        <br>
    `;
}

const generateReportFooter = (teacherProfile?: TeacherProfile | null) => {
    const config = teacherProfile?.reportConfig;
    const teacher = config?.teacherName || "...........................";
    const principal = config?.principalName || "...........................";
    const date = config?.date || new Date().toLocaleDateString('tr-TR');

     return `
        <br><br><br>
        <table class="no-border" style="width:100%;">
            <tr>
                <td class="no-border" style="width:33%;"></td>
                <td class="no-border center" style="width:34%;">
                    Uygundur<br/>${date}<br/><br/><br/>
                    <span class="bold">${teacher}</span><br/>
                    Ders Öğretmeni
                </td>
                <td class="no-border" style="width:33%;"></td>
            </tr>
            <tr>
                <td colspan="3" class="no-border center">
                    <br/><br/>
                    Tasdik Olunur<br/>${date}<br/><br/><br/>
                    <span class="bold">${principal}</span><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
    `;
}

// --- ANNUAL PLAN EXPORT ---
interface ExportAnnualPlanArgs {
    annualPlan: AnnualPlan;
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}

export function exportAnnualPlanToRtf({ annualPlan, currentClass, teacherProfile }: ExportAnnualPlanArgs) {
    const reportTitle = "ÜNİTELENDİRİLMİŞ YILLIK DERS PLANI";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${annualPlan.title}`;

    const tableHeader = `
        <tr>
            <th style="width:8%;">Hafta / Tarih</th>
            <th style="width:5%;">Ders Saati</th>
            <th style="width:15%;">Ünite / Tema</th>
            <th style="width:20%;">Konu</th>
            <th style="width:22%;">Kazanımlar / Hedef ve Davranışlar</th>
            <th style="width:10%;">Yöntem ve Teknikler</th>
            <th style="width:10%;">Araç-Gereçler</th>
            <th style="width:10%;">Ölçme-Değerlendirme</th>
        </tr>
    `;

    const dataRows = annualPlan.rows.map(row => `
        <tr>
            <td class="center">${row.hafta || ''}</td>
            <td class="center">${row.saat || ''}</td>
            <td>${row.unite || ''}</td>
            <td>${row.konu || ''}</td>
            <td>${row.cikti || ''}</td>
            <td>${row.yontem || 'Anlatım, Soru-Cevap'}</td>
            <td>${row.arac || 'Ders Kitabı, Akıllı Tahta'}</td>
            <td>${row.degerlendirme || 'Sözlü Değerlendirme'}</td>
        </tr>
    `).join('');

    const content = `
        ${header}
        <table>
            <thead>${tableHeader}</thead>
            <tbody>${dataRows}</tbody>
        </table>
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- DAILY PLAN EXPORT ---
interface ExportDailyPlanArgs {
    dailyPlan: DailyPlan;
    annualPlanEntry: AnnualPlanEntry;
    currentClass: Class;
    teacherProfile: TeacherProfile;
}

export function exportDailyPlanToRtf({ dailyPlan, annualPlanEntry, currentClass, teacherProfile }: ExportDailyPlanArgs) {
    const config = teacherProfile.reportConfig || {};
    const title = `${currentClass.name} - ${dailyPlan.date} Günlük Plan`;

    const content = `
        <div class="center bold">
            <p>${config.academicYear || '...'} EĞİTİM-ÖĞRETİM YILI</p>
            <p>${config.schoolName || '...'} OKULU</p>
            <p>${config.lessonName || '...'} DERSİ GÜNLÜK DERS PLANI</p>
        </div>
        <br>
        <table style="width: 100%;">
            <tr><td style="width: 20%;" class="bold">Ders</td><td>${config.lessonName || '...'}</td></tr>
            <tr><td class="bold">Sınıf</td><td>${currentClass.name}</td></tr>
            <tr><td class="bold">Tarih</td><td>${dailyPlan.date}</td></tr>
            <tr><td class="bold">Ünite</td><td>${annualPlanEntry.unite}</td></tr>
            <tr><td class="bold">Konu</td><td>${dailyPlan.konu}</td></tr>
            <tr><td class="bold">Kazanımlar</td><td>${dailyPlan.kazanim}</td></tr>
            <tr><td class="bold">Öğretim Yöntemleri</td><td>${annualPlanEntry.yontem || 'Anlatım, Soru-Cevap, Gösteri'}</td></tr>
            <tr><td class="bold">Araç-Gereçler</td><td>${dailyPlan.materyal}</td></tr>
            <tr><td class="bold">Öğrenme-Öğretme Süreci</td><td>
                <b>Giriş (İlgi Çekme, Güdüleme):</b><br>${dailyPlan.plan.giris}<br><br>
                <b>Gelişme (Konu Anlatımı, Etkinlikler):</b><br>${dailyPlan.plan.gelisme}<br><br>
                <b>Sonuç (Özet, Tekrar):</b><br>${dailyPlan.plan.sonuc}
            </td></tr>
            <tr><td class="bold">Ölçme-Değerlendirme</td><td>${dailyPlan.degerlendirme}</td></tr>
        </table>
        <br><br><br>
        <table class="no-border" style="width:100%;">
            <tr>
                <td class="no-border center" style="width:50%;">
                    <br/><br/>
                    <span class="bold">${teacherProfile.name}</span><br/>
                    Ders Öğretmeni
                </td>
                <td class="no-border center" style="width:50%;">
                    <br/>Uygundur<br/>
                    <span class="bold">${config.date || new Date().toLocaleDateString('tr-TR')}</span><br/><br/>
                    <span class="bold">${config.principalName || '...'}</span><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- DILEKCE EXPORT ---
export function exportDilekceToRtf(data: DilekceDocument['data']) {
    const ilgiList = data.ilgiler?.filter(i => i.value) || [];
    const eklerList = data.ekler?.filter(e => e.value) || [];

    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5;">
            <div style="text-align: center;">
                <p style="margin:0;">${data.kurum || 'T.C.'}</p>
                <p style="margin:0;">${data.kaymakamlik || 'KAYMAKAMLIĞI'}</p>
                <p style="margin:0;">${data.mudurluk || 'İlçe Milli Eğitim Müdürlüğü'}</p>
            </div>
            
            <table class="no-border" style="width:100%; margin-top: 20px;">
                <tr>
                    <td class="no-border" style="width: 50%; vertical-align: top;">
                        ${data.sayi ? `<p style="margin:0;">Sayı&nbsp;&nbsp;&nbsp;: ${data.sayi}</p>` : ''}
                        ${data.konu ? `<p style="margin:0;">Konu&nbsp;&nbsp;: ${data.konu}</p>` : ''}
                    </td>
                    <td class="no-border" style="width: 50%; text-align: right; vertical-align: top;">
                        <p style="margin:0;">${data.tarih || '.../.../....'}</p>
                    </td>
                </tr>
            </table>

            <div style="text-align: center; font-weight: bold; text-transform: uppercase; margin-top: 40px; margin-bottom: 20px;">
                <p style="margin:0;">${data.muhatap || 'İLGİLİ MAKAMA'}</p>
                ${data.muhatap_detay ? `<p style="margin:0; text-transform: none; font-size: 11pt;">(${data.muhatap_detay})</p>` : ''}
            </div>

            ${ilgiList.length > 0 ? `
                <div style="margin-bottom: 10px;">
                    ${ilgiList.map((ilgi, index) => `
                        <p style="margin:0; padding-left: 50px; text-indent: -30px;">İlgi: ${String.fromCharCode(97 + index)}) ${ilgi.value}</p>
                    `).join('')}
                </div>
            ` : ''}
            
            <p style="text-indent: 50px; text-align: justify; white-space: pre-wrap;">
                ${data.metin || 'Dilekçe metni...'}
            </p>

            <p style="text-align: right; margin-top: 20px;">${data.kapanis || 'Gereğini arz ederim.'}</p>

            <div style="width: 50%; margin-left: 50%; text-align: center; margin-top: 40px;">
                <p style="margin:0; height: 40px;">(İmza)</p>
                <p style="margin:0; font-weight: bold;">${data.imza_ad_soyad || 'Ad Soyad'}</p>
                <p style="margin:0;">${data.imza_unvan || 'Unvan'}</p>
            </div>

            ${(eklerList.length > 0 || data.dagitim_geregi || data.dagitim_bilgi) ? `
                <div style="margin-top: 20px;">
                    ${eklerList.length > 0 ? `
                        <div>
                            <p style="margin:0; font-weight: bold;">EKLER:</p>
                            ${eklerList.map((ek, index) => `<p style="margin:0;">${index + 1}. ${ek.value}</p>`).join('')}
                        </div>
                    ` : ''}
                    ${(data.dagitim_geregi || data.dagitim_bilgi) ? `
                        <div style="margin-top: 10px;">
                            <p style="margin:0; font-weight: bold;">DAĞITIM:</p>
                            ${data.dagitim_geregi ? `<p style="margin:0; white-space: pre-wrap;">Gereği:<br/>${data.dagitim_geregi}</p>` : ''}
                            ${data.dagitim_bilgi ? `<p style="margin:0; margin-top: 5px; white-space: pre-wrap;">Bilgi:<br/>${data.dagitim_bilgi}</p>` : ''}
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
    const finalHtml = generateHtmlShell(content, data.konu || "Dilekce");
    downloadRtf(finalHtml, `${(data.konu || "Dilekce").replace(/ /g, '_')}.rtf`);
}


// --- GRADING TOOL EXPORT ---
interface ExportGradingArgs {
    activeTab: ActiveGradingTab;
    activeTerm: ActiveTerm;
    students: Student[];
    currentCriteria: Criterion[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}

export function exportGradingToRtf({
    activeTab,
    activeTerm,
    students,
    currentCriteria,
    currentClass,
    teacherProfile
}: ExportGradingArgs) {

    let scoreKey: 'scores1' | 'scores2' | 'projectScores' | 'behaviorScores';
    let reportTitle: string;
    
    if (activeTab === 3) {
        scoreKey = 'projectScores';
        reportTitle = "PROJE ÖDEVİ DEĞERLENDİRME ÖLÇEĞİ";
    } else if (activeTab === 4) {
        scoreKey = 'behaviorScores';
        reportTitle = "DAVRANIŞ (KANAAT) DEĞERLENDİRME ÖLÇEĞİ";
    } else {
        scoreKey = activeTab === 1 ? 'scores1' : 'scores2';
        reportTitle = `${activeTab}. PERFORMANS DEĞERLENDİRME ÖLÇEĞİ`;
    }
    
    reportTitle = `${activeTerm}. DÖNEM ${reportTitle}`;
    const termGradesKey: keyof Student = activeTerm === 1 ? 'term1Grades' : 'term2Grades';

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

    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:5%;">S.No</th>
            <th class="horizontal" style="width:10%;">Okul No</th>
            <th class="horizontal" style="width:25%;">Adı Soyadı</th>
            ${currentCriteria.map(c => `<th>${c.name}<br/><span class="small-text">(${c.max} P)</span></th>`).join('')}
            <th class="horizontal" style="width:10%;">PUAN</th>
        </tr>
    `;

    const dataRows = visibleStudents.map((s, index) => {
        const termGrades = s[termGradesKey] as GradingScores | undefined;
        const scores = termGrades ? termGrades[scoreKey] : undefined;
        const total = calculateTotal(scores);
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                ${currentCriteria.map(c => `<td class="center">${scores?.[c.id] || 0}</td>`).join('')}
                <td class="center bold">${total}</td>
            </tr>
        `;
    }).join('');

    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const content = `
        ${header}
        <table>
            <thead>${tableHeader}</thead>
            <tbody>${dataRows}</tbody>
        </table>
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- STUDENT LIST EXPORT ---
interface ExportStudentListArgs {
    students: Student[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportStudentListToRtf({ students, currentClass, teacherProfile }: ExportStudentListArgs) {
    const reportTitle = "Öğrenci Listesi";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:70%;">Adı Soyadı</th>
        </tr>
    `;
    const dataRows = students.map((s, index) => `
        <tr>
            <td class="center">${index + 1}</td>
            <td class="center">${s.number}</td>
            <td>${s.name}</td>
        </tr>
    `).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- PROJECT DISTRIBUTION EXPORT ---
interface ExportProjectDistributionArgs {
    students: Student[];
    lessons: Lesson[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportProjectDistributionToRtf({ students, lessons, currentClass, teacherProfile }: ExportProjectDistributionArgs) {
    const reportTitle = "Proje Ödevi İstek Dilekçeleri";
    const title = `${currentClass.name} - ${reportTitle}`;
    const config = teacherProfile?.reportConfig;
    const school = config?.schoolName || "..........................................";

    const generateDilekce = (student: Student) => {
        const preferences = student.projectPreferences?.slice(0, 5).map((prefId, i) => {
            const lesson = lessons.find(l => l.id === prefId);
            return lesson ? `<tr><td class="center">${i + 1}</td><td>${lesson.name}</td></tr>` : '';
        }).join('') || '<tr><td colspan="2" class="center">Tercih yapılmadı</td></tr>';

        return `
            <div style="border: 1px solid #ccc; padding: 15px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="center bold">
                        <p style="margin:0;">${school.toLocaleUpperCase('tr-TR')} MÜDÜRLÜĞÜNE</p>
                    </div>
                    <br>
                    <p style="text-indent: 2em; line-height: 1.5;">
                        2025-2026 Eğitim-Öğretim yılında almam gereken proje ödevi için, aşağıda belirttiğim derslerden birinin tarafıma verilmesini istiyorum.<br>
                        Gereğini bilgilerinize arz ederim.
                    </p>
                    <br>
                    <table style="width: 80%; margin: 0 auto;">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Sıra</th>
                                <th>İstenilen Dersin Adı</th>
                            </tr>
                        </thead>
                        <tbody>
                           ${preferences}
                           ${Array.from({ length: 5 - (student.projectPreferences?.length || 0) }).map((_, i) => `<tr><td class="center">${(student.projectPreferences?.length || 0) + i + 1}</td><td></td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="text-align: right;">
                    <p style="margin-bottom: 5px;">.../.../.....</p>
                    <p style="margin-bottom: 5px;" class="bold">${student.name}</p>
                    <p style="margin-bottom: 5px;">Sınıfı: ${currentClass.name}</p>
                    <p style="margin-bottom: 5px;">No: ${student.number}</p>
                    <p style="margin-bottom: 5px;">İmza:</p>
                </div>
            </div>
            <div style="page-break-after: always;"></div>
        `;
    };

    let dilekcelerContent = students.map(generateDilekce).join('');

    const summaryTitle = "PROJE ÖDEVİ DAĞILIM LİSTESİ";
    const summaryHeader = generateReportHeader(summaryTitle, currentClass, teacherProfile);
    const summaryTableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:35%;">Adı Soyadı</th>
            <th class="horizontal" style="width:35%;">Atanan Proje Ödevi</th>
        </tr>
    `;
    const summaryDataRows = students.map((s, index) => {
        const assignedLesson = lessons.find(l => l.id === s.assignedLesson);
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                <td>${assignedLesson ? assignedLesson.name : 'Atanmadı'}</td>
            </tr>
        `;
    }).join('');
    
    const summaryFooter = generateReportFooter(teacherProfile);

    const summaryContent = `
        <div>
            ${summaryHeader}
            <table>
                <thead>${summaryTableHeader}</thead>
                <tbody>${summaryDataRows}</tbody>
            </table>
            ${summaryFooter}
        </div>
    `;

    const content = `
        ${dilekcelerContent}
        ${summaryContent}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}


// --- RISK MAP EXPORT ---
interface ExportRiskMapArgs {
    students: Student[];
    riskFactors: RiskFactor[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportRiskMapToRtf({ students, riskFactors, currentClass, teacherProfile }: ExportRiskMapArgs) {
    const reportTitle = "Sınıf Risk Haritası";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const getRiskScore = (studentRisks: string[]) => {
        return studentRisks.reduce((total, riskId) => {
          const factor = riskFactors.find(f => f.id === riskId);
          return total + (factor?.weight || 0);
        }, 0);
    };

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:5%;">S.No</th>
            <th class="horizontal" style="width:10%;">Okul No</th>
            <th class="horizontal" style="width:25%;">Adı Soyadı</th>
            ${riskFactors.map(factor => `<th>${factor.label}</th>`).join('')}
            <th class="horizontal">Risk Puanı</th>
        </tr>
    `;
    const dataRows = students.map((s, index) => {
        const riskScore = getRiskScore(s.risks);
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                ${riskFactors.map(factor => {
                    const hasRisk = s.risks.includes(factor.id);
                    return `<td class="center">${hasRisk ? 'X' : ''}</td>`;
                }).join('')}
                <td class="center bold">${riskScore}</td>
            </tr>
        `;
    }).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}


// --- INFO FORMS STATUS EXPORT ---
interface ExportInfoFormsStatusArgs {
    students: Student[];
    infoForms: InfoForm[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportInfoFormsStatusToRtf({ students, infoForms, currentClass, teacherProfile }: ExportInfoFormsStatusArgs) {
    const reportTitle = "Öğrenci Bilgi Formu Doldurma Durumu";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:50%;">Adı Soyadı</th>
            <th class="horizontal" style="width:20%;">Doldurma Durumu</th>
        </tr>
    `;
    const dataRows = students.map((s, index) => {
        const form = infoForms.find(f => f.studentId === s.id);
        const status = form?.submitted ? 'Dolduruldu' : 'Bekleniyor';
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                <td class="center bold">${status}</td>
            </tr>
        `;
    }).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- STUDENT INFO FORM EXPORT ---
export function exportStudentInfoToRtf(student: Student, form: InfoForm, teacher: TeacherProfile) {
    const content = `
        <div class="center">
            <p class="bold">ÖĞRENCİ BİLGİ FORMU</p>
        </div>
        <p><b>Okul:</b> ${teacher.schoolName}</p>
        <p><b>Öğretmen:</b> ${teacher.name}</p>
        <p><b>Öğrenci:</b> ${student.name} (#${student.number})</p>
        <br>
        <h3>KİŞİSEL BİLGİLER</h3>
        <table>
            <tr><td style="width: 30%;">Doğum Tarihi</td><td>${form.birthDate ? format(form.birthDate.toDate(), 'dd.MM.yyyy') : 'N/A'}</td></tr>
            <tr><td>Doğum Yeri</td><td>${form.birthPlace || 'N/A'}</td></tr>
            <tr><td>Adres</td><td>${form.address || 'N/A'}</td></tr>
            <tr><td>Sürekli Hastalığı / Alerjisi</td><td>${form.healthIssues || 'Yok'}</td></tr>
            <tr><td>İlgi Alanları / Hobileri</td><td>${form.hobbies || 'N/A'}</td></tr>
            <tr><td>Günlük Teknoloji Kullanımı</td><td>${form.techUsage || 'N/A'}</td></tr>
        </table>
        <br>
        <h3>VELİ BİLGİLERİ</h3>
        <table>
            <tr><td style="width: 30%;">Anne Durumu</td><td>${form.motherStatus || 'N/A'}</td></tr>
            <tr><td>Anne Eğitim Durumu</td><td>${form.motherEducation || 'N/A'}</td></tr>
            <tr><td>Anne Mesleği</td><td>${form.motherJob || 'N/A'}</td></tr>
            <tr><td>Baba Durumu</td><td>${form.fatherStatus || 'N/A'}</td></tr>
            <tr><td>Baba Eğitim Durumu</td><td>${form.fatherEducation || 'N/A'}</td></tr>
            <tr><td>Baba Mesleği</td><td>${form.fatherJob || 'N/A'}</td></tr>
        </table>
        <br>
        <h3>AİLE BİLGİLERİ</h3>
        <table>
            <tr><td style="width: 30%;">Kardeş Sayısı / Bilgileri</td><td>${form.siblingsInfo || 'N/A'}</td></tr>
            <tr><td>Ailenin Ekonomik Durumu</td><td>${form.economicStatus || 'N/A'}</td></tr>
        </table>
    `;
    const finalHtml = generateHtmlShell(content, "Öğrenci Bilgi Formu");
    downloadRtf(finalHtml, `${student.name.replace(/ /g, '_')}_Bilgi_Formu.rtf`);
}


// --- DUTY ROSTER EXPORT ---
interface ExportDutyRosterArgs {
    roster: RosterItem[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}

export function exportDutyRosterToRtf({ roster, currentClass, teacherProfile }: ExportDutyRosterArgs) {
    const reportTitle = "Sınıf Nöbetçi Öğrenci Listesi";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:33%;">Tarih</th>
            <th class="horizontal" style="width:33%;">Gün</th>
            <th class="horizontal" style="width:34%;">Nöbetçi Öğrenciler</th>
        </tr>
    `;
    const dataRows = roster.map(item => `
        <tr>
            <td class="center">${item.date}</td>
            <td class="center">${item.day}</td>
            <td>${item.student}</td>
        </tr>
    `).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}


// --- ELECTION RESULTS EXPORT ---
interface ElectionResult {
    winner: Candidate;
    runnerUp: Candidate | null;
    allCandidates: Candidate[];
}
interface ExportElectionResultsArgs {
    electionResult: ElectionResult;
    electionType: 'class_president' | 'school_representative' | 'honor_board';
    currentClass: Class;
    students: Student[];
    teacherProfile?: TeacherProfile | null;
}
export function exportElectionResultsToRtf({
    electionResult,
    electionType,
    currentClass,
    students,
    teacherProfile,
}: ExportElectionResultsArgs) {
    
    const infoMap = {
        class_president: {
            title: `SINIF BAŞKANLIĞI SEÇİM SONUÇ TUTANAĞI`,
            decisionText: (winner: Candidate, runnerUp: Candidate | null, className: string) =>
                `Okulumuz ${className} sınıfı öğrencileri arasında yapılan oylama sonucunda ${winner.votes} oyla ${winner.name} sınıf başkanı, ${runnerUp ? `${runnerUp.votes} oyla ${runnerUp.name} sınıf başkan yardımcısı seçilmiştir.` : 'sınıf başkan yardımcısı seçilememiştir.'}`
        },
        school_representative: {
            title: `OKUL MECLİSİ SINIF TEMSİLCİSİ SEÇİMİ SONUÇ TUTANAĞI`,
            decisionText: (winner: Candidate, runnerUp: Candidate | null, className: string) =>
                `Okulumuz ${className} sınıfı öğrencileri arasında yapılan oylama sonucunda ${winner.votes} oyla ${winner.name} sınıf temsilcisi olarak seçilmiştir.`
        },
        honor_board: {
            title: `ONUR KURULU SINIF TEMSİLCİSİ SEÇİMİ SONUÇ TUTANAĞI`,
             decisionText: (winner: Candidate, runnerUp: Candidate | null, className: string) =>
                `Okulumuz ${className} sınıfı öğrencileri arasında yapılan oylama sonucunda ${winner.votes} oyla ${winner.name} onur kurulu sınıf temsilcisi olarak seçilmiştir.`
        }
    };
    const electionInfo = infoMap[electionType];
    const { winner, runnerUp, allCandidates } = electionResult;

    const reportTitle = electionInfo.title;
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const introText = `<p>Okulumuz ${currentClass.name} sınıfında, ${allCandidates.length} adayın katılımıyla ${electionInfo.title.toLocaleLowerCase('tr-TR')} yapılmıştır. ${students.length} mevcutlu sınıfta, ${currentClass.election?.votedStudentIds.length || 0} öğrenci oy kullanmıştır. Oyların sayımı yapılarak, oy dökümü aşağıya çıkarılmıştır.</p>`;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:50%;">Adı Soyadı</th>
            <th class="horizontal" style="width:20%;">Aldığı Oy</th>
        </tr>
    `;
    const dataRows = allCandidates.map((c, index) => `
        <tr>
            <td class="center">${index + 1}</td>
            <td class="center">${c.number}</td>
            <td>${c.name}</td>
            <td class="center bold">${c.votes}</td>
        </tr>
    `).join('');

    const decision = `<br><p>${electionInfo.decisionText(winner, runnerUp, currentClass.name)} İş bu tutanak tarafımızdan imza altına alınmıştır.</p>`;

    const content = `${header}${introText}<br><table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${decision}${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}


// --- SEATING PLAN EXPORT ---
interface SeatingPlanExportArgs {
    seatingPlan: { [key: string]: Student };
    rowCount: number;
    colCount: number;
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportSeatingPlanToRtf({
    seatingPlan,
    rowCount,
    colCount,
    currentClass,
    teacherProfile,
}: SeatingPlanExportArgs) {
    const reportTitle = "Sınıf Oturma Planı";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    let tableContent = '';
    for (let r = 0; r < rowCount; r++) {
        tableContent += '<tr>';
        for (let c = 0; c < colCount; c++) {
            const leftStudent = seatingPlan[`${r}-${c}-0`];
            const rightStudent = seatingPlan[`${r}-${c}-1`];
            tableContent += `
                <td class="word-export-desk-container">
                    <table class="word-export-desk">
                        <tr>
                            <td class="word-export-seat">${leftStudent ? leftStudent.name : ''}</td>
                            <td class="word-export-seat">${rightStudent ? rightStudent.name : ''}</td>
                        </tr>
                    </table>
                </td>
            `;
        }
        tableContent += '</tr>';
    }

    const board = `<div class="center bold" style="background-color: #f2f2f2; padding: 10px; margin: 20px auto; width: 60%;">TAHTA / ÖĞRETMEN MASASI</div>`;

    const content = `
        ${header}
        ${board}
        <table style="border: none; border-spacing: 10px; width: 100%;">${tableContent}</table>
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

interface StudentDevelopmentReportArgs {
    student: Student;
    infoForm: InfoForm | null;
    riskFactors: RiskFactor[];
    teacherProfile: TeacherProfile;
    currentClass: Class;
}
export function exportStudentDevelopmentReportToRtf({ student, infoForm, riskFactors, teacherProfile, currentClass }: StudentDevelopmentReportArgs) {
    const reportTitle = "ÖĞRENCİ GELİŞİM VE DEĞERLENDİRME RAPORU";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${student.name} - Gelişim Raporu`;
    
    // --- GRADES CALCULATION ---
    const perfCriteria = teacherProfile.perfCriteria || INITIAL_PERF_CRITERIA;
    const projCriteria = teacherProfile.projCriteria || INITIAL_PROJ_CRITERIA;
    const behaviorCriteria = teacherProfile.behaviorCriteria || INITIAL_BEHAVIOR_CRITERIA;

    const calculateAverage = (scores: { [key: string]: number } | undefined, criteria: Criterion[]): number | null => {
        if (!scores || !criteria.length || Object.keys(scores).length === 0) return null;
        const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
        if (totalMax === 0) return 0;
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        return (totalScore / totalMax) * 100;
    };

    const calculateTermAverage = (termGrades?: GradingScores) => {
        if (!termGrades) return 0;
        const exam1 = termGrades.exam1;
        const exam2 = termGrades.exam2;
        const perf1 = calculateAverage(termGrades.scores1, perfCriteria);
        const perf2 = calculateAverage(termGrades.scores2, perfCriteria);
        const projAvg = student.hasProject ? calculateAverage(termGrades.projectScores, projCriteria) : null;
        const allScores = [exam1, exam2, perf1, perf2, projAvg].filter((score): score is number => score !== null && score !== undefined && !isNaN(score) && score >= 0);
        if (allScores.length === 0) return 0;
        const sum = allScores.reduce((acc, score) => acc + score, 0);
        return sum / allScores.length;
    };
    
    const term1Avg = calculateTermAverage(student.term1Grades);
    const term2Avg = calculateTermAverage(student.term2Grades);
    const finalAverage = (term1Avg > 0 && term2Avg > 0) ? (term1Avg + term2Avg) / 2 : (term1Avg > 0 ? term1Avg : term2Avg);
    
    // --- REPORT SECTIONS ---
    const studentInfoSection = `
        <h3>A. ÖĞRENCİ KİMLİK BİLGİLERİ</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;"><b>Adı Soyadı:</b></td><td>${student.name}</td></tr>
            <tr><td><b>Okul Numarası:</b></td><td>${student.number}</td></tr>
            <tr><td><b>Sınıfı:</b></td><td>${currentClass.name}</td></tr>
            <tr><td><b>Doğum Tarihi:</b></td><td>${infoForm?.birthDate ? format(infoForm.birthDate.toDate(), 'dd.MM.yyyy') : 'Belirtilmemiş'}</td></tr>
            <tr><td><b>Doğum Yeri:</b></td><td>${infoForm?.birthPlace || 'Belirtilmemiş'}</td></tr>
        </table>
    `;

    const familyInfoSection = `
        <h3>B. AİLE BİLGİLERİ</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;"><b>Anne Durumu:</b></td><td>${infoForm?.motherStatus || 'Belirtilmemiş'}</td></tr>
            <tr><td><b>Anne Eğitim / Meslek:</b></td><td>${(infoForm?.motherEducation || 'N/A') + ' / ' + (infoForm?.motherJob || 'N/A')}</td></tr>
            <tr><td><b>Baba Durumu:</b></td><td>${infoForm?.fatherStatus || 'Belirtilmemiş'}</td></tr>
            <tr><td><b>Baba Eğitim / Meslek:</b></td><td>${(infoForm?.fatherEducation || 'N/A') + ' / ' + (infoForm?.fatherJob || 'N/A')}</td></tr>
            <tr><td><b>Kardeş Bilgileri:</b></td><td>${infoForm?.siblingsInfo || 'Belirtilmemiş'}</td></tr>
            <tr><td><b>Ekonomik Durum:</b></td><td>${infoForm?.economicStatus || 'Belirtilmemiş'}</td></tr>
        </table>
    `;

    const gradesSection = `
        <h3>C. AKADEMİK DURUMU (${teacherProfile.reportConfig?.lessonName || 'Bu Ders'})</h3>
        <h4>1. Dönem Notları</h4>
        <table style="width: 100%;">
            <tr>
                <td class="center bold">1. Sınav</td>
                <td class="center bold">2. Sınav</td>
                <td class="center bold">1. Performans</td>
                <td class="center bold">2. Performans</td>
                <td class="center bold">Proje</td>
                <td class="center bold">Ortalama</td>
            </tr>
            <tr>
                <td class="center">${student.term1Grades?.exam1 ?? '-'}</td>
                <td class="center">${student.term1Grades?.exam2 ?? '-'}</td>
                <td class="center">${calculateAverage(student.term1Grades?.scores1, perfCriteria)?.toFixed(2) ?? '-'}</td>
                <td class="center">${calculateAverage(student.term1Grades?.scores2, perfCriteria)?.toFixed(2) ?? '-'}</td>
                <td class="center">${student.hasProject ? (calculateAverage(student.term1Grades?.projectScores, projCriteria)?.toFixed(2) ?? '-') : 'Almadı'}</td>
                <td class="center bold">${term1Avg.toFixed(2)}</td>
            </tr>
        </table>
        <h4>2. Dönem Notları</h4>
        <table style="width: 100%;">
             <tr>
                <td class="center bold">1. Sınav</td>
                <td class="center bold">2. Sınav</td>
                <td class="center bold">1. Performans</td>
                <td class="center bold">2. Performans</td>
                <td class="center bold">Proje</td>
                <td class="center bold">Ortalama</td>
            </tr>
            <tr>
                <td class="center">${student.term2Grades?.exam1 ?? '-'}</td>
                <td class="center">${student.term2Grades?.exam2 ?? '-'}</td>
                <td class="center">${calculateAverage(student.term2Grades?.scores1, perfCriteria)?.toFixed(2) ?? '-'}</td>
                <td class="center">${calculateAverage(student.term2Grades?.scores2, perfCriteria)?.toFixed(2) ?? '-'}</td>
                <td class="center">${student.hasProject ? (calculateAverage(student.term2Grades?.projectScores, projCriteria)?.toFixed(2) ?? '-') : 'Almadı'}</td>
                <td class="center bold">${term2Avg.toFixed(2)}</td>
            </tr>
        </table>
        <br/>
        <div style="text-align: right; font-size: 14pt;"><b>YIL SONU GENEL ORTALAMA: ${finalAverage.toFixed(2)}</b></div>
    `;
    
    const attendanceCount = student.attendance?.filter(a => a.status === 'absent').length || 0;
    const socialSection = `
        <h3>D. SOSYAL VE DAVRANIŞSAL DURUMU</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;"><b>Devamsızlık Durumu:</b></td><td>Toplam ${attendanceCount} gün devamsızlığı bulunmaktadır.</td></tr>
            <tr><td><b>Risk Faktörleri:</b></td><td>${student.risks.map(rId => riskFactors.find(rf => rf.id === rId)?.label).filter(Boolean).join(', ') || 'Belirtilen risk faktörü yok.'}</td></tr>
            <tr><td><b>Davranış (Kanaat) Notu:</b></td><td>${calculateAverage(student.term1Grades?.behaviorScores, behaviorCriteria)?.toFixed(2) ?? 'Hesaplanmadı'}</td></tr>
        </table>
    `;

    const observationSection = `
        <h3>E. ÖĞRETMEN GÖZLEM VE DEĞERLENDİRMELERİ</h3>
        <div style="border: 1px solid black; height: 200px; padding: 5px;"></div>
    `;

    const content = `
        ${header}
        ${studentInfoSection}
        ${familyInfoSection}
        ${gradesSection}
        ${socialSection}
        ${observationSection}
        ${footer}
    `;

    downloadRtf(generateHtmlShell(content, title), `${title.replace(/ /g, '_')}.rtf`);
}

// --- HOMEWORK STATUS EXPORT ---
interface ExportHomeworkStatusArgs {
    students: Student[];
    homeworks: Homework[]; 
    submissions: Submission[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}

export function exportHomeworkStatusToRtf({ students, homeworks, submissions, currentClass, teacherProfile }: ExportHomeworkStatusArgs) {
    const reportTitle = "Ödev Durum Raporu";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;
    
    if (students.length === 0) return;
    
    const sortedHomeworks = [...homeworks].sort((a,b) => new Date(a.assignedDate).getTime() - new Date(b.assignedDate).getTime());

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:5%;">S.No</th>
            <th class="horizontal" style="width:10%;">Okul No</th>
            <th class="horizontal" style="width:25%;">Adı Soyadı</th>
            ${sortedHomeworks.map((hw, i) => `<th class="horizontal" style="width:5%;"><span class="small-text">${i+1}. Ödev</span></th>`).join('')}
        </tr>
    `;

    const dataRows = students.map((student, index) => {
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${student.number}</td>
                <td>${student.name}</td>
                ${sortedHomeworks.map(hw => {
                    const hasSubmitted = submissions.some(sub => sub.studentId === student.id && sub.homeworkId === hw.id);
                    return `<td class="center bold">${hasSubmitted ? '+' : '-'}</td>`;
                }).join('')}
            </tr>
        `;
    }).join('');
    
    const homeworkList = sortedHomeworks.map((hw, i) => `<p class="small-text"><b>${i+1}. Ödev:</b> ${hw.text}</p>`).join('');

    const content = `
      ${header}
      <table>
        <thead>${tableHeader}</thead>
        <tbody>${dataRows}</tbody>
      </table>
      <br>
      <h3>Ödev Listesi</h3>
      ${homeworkList}
      ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}
