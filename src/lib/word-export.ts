
import { saveAs } from 'file-saver';
import { Student, InfoForm, TeacherProfile, Criterion, Class, Lesson, RiskFactor, Election, Candidate, RosterItem } from './types';
import { format } from 'date-fns';
import { ActiveGradingTab, ActiveTerm } from '@/components/dashboard/teacher/GradingToolTab';


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
          size: A4;
          margin: 1in;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
        }
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          border: 1px solid black;
          padding: 5px;
          text-align: left;
        }
        th {
          font-weight: bold;
          text-align: center;
          background-color: #f2f2f2;
          /* Rotate text for risk factors */
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
        }
        th.horizontal {
            writing-mode: horizontal-tb;
            transform: none;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .no-border { border: none; }
        .small-text { font-size: 10pt; }
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
            <p class="header-p bold">${currentClass.name.toLocaleUpperCase('tr-TR')} SINIFI ${term}. DÖNEM</p>
            <p class="header-p bold">${reportTitle.toLocaleUpperCase('tr-TR')}</p>
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
                <td class="no-border center" style="width:50%;">
                    Uygundur<br/>${date}<br/><br/><br/>
                    <span class="bold">${teacher}</span><br/>
                    Ders Öğretmeni
                </td>
                <td class="no-border center" style="width:50%;">
                    Tasdik Olunur<br/><br/><br/><br/>
                    <span class="bold">${principal}</span><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
    `;
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
        const termGrades = s[termGradesKey];
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
    const reportTitle = "Proje Tercih ve Atama Listesi";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:5%;">S.No</th>
            <th class="horizontal" style="width:15%;">Adı Soyadı</th>
            <th class="horizontal" style="width:40%;">Tercihler</th>
            <th class="horizontal" style="width:20%;">Atanan Proje</th>
        </tr>
    `;
    const dataRows = students.map((s, index) => {
        const preferences = s.projectPreferences?.map((prefId, i) => {
            const lesson = lessons.find(l => l.id === prefId);
            return lesson ? `${i+1}. ${lesson.name}` : '';
        }).filter(Boolean).join('<br>') || 'Tercih yok';
        const assigned = lessons.find(l => l.id === s.assignedLesson)?.name || 'Atanmadı';

        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td>${s.name}</td>
                <td>${preferences}</td>
                <td class="center bold">${assigned}</td>
            </tr>
        `;
    }).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
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

interface ExportDutyRosterArgs {
    roster: RosterItem[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
