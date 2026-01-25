import { saveAs } from 'file-saver';
import { Student, InfoForm, TeacherProfile, Criterion, Class, Lesson, RiskFactor, Election, Candidate, RosterItem, GradingScores, DailyPlan, AnnualPlanEntry, AnnualPlan, DilekceDocument, Homework, Submission, Question, DisciplineRecord, Club, SociogramSurvey, SociogramAnalysisOutput, GuidanceReferralRecord, ObservationRecord, TimetableCell, ElectionType, ActiveGradingTab, ActiveTerm } from './types';
import { format, parseISO } from 'date-fns';
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
          margin: 0.7in;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
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
    const school = teacherProfile?.schoolName || "..........................................";
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
    const teacher = teacherProfile?.name || "...........................";
    const principal = teacherProfile?.principalName || "...........................";
    const guidanceCounselor = teacherProfile?.guidanceCounselorName || "...........................";
    const date = new Date().toLocaleDateString('tr-TR');

    return `
        <br><br><br>
        <table class="no-border" style="width:100%;">
            <tr>
                <td class="no-border center" style="width:50%;">
                    <br/><br/>
                    <span class="bold">${teacher}</span><br/>
                    Sınıf Rehber Öğretmeni
                </td>
                <td class="no-border center" style="width:50%;">
                    <br/><br/>
                    <span class="bold">${guidanceCounselor}</span><br/>
                    Okul Rehber Öğretmeni
                </td>
            </tr>
            <tr>
                <td colspan="2" class="no-border center">
                    <br/><br/><br/>
                    Uygundur<br/>${date}<br/><br/><br/>
                    <span class="bold">${principal}</span><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
    `;
}

// --- GUIDANCE REFERRAL EXPORT ---
interface ExportGuidanceReferralArgs {
    record: GuidanceReferralRecord;
    teacherProfile: TeacherProfile | null;
}

export function exportGuidanceReferralToRtf({ record, teacherProfile }: ExportGuidanceReferralArgs) {
    const title = "REHBERLİK SERVİSİNE ÖĞRENCİ YÖNLENDİRME FORMU";
    const filename = `Yonlendirme_Formu_${record.studentName.replace(/ /g, '_')}.rtf`;
    const schoolName = teacherProfile?.schoolName || "..................";
    
    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4;">
            <div style="text-align:center; font-weight: bold; font-size: 14pt;">${title}</div>
            <div style="text-align:center; font-size: 12pt; margin-bottom: 20px;">${schoolName} MÜDÜRLÜĞÜ</div>
            
            <table style="width:100%; border-collapse: collapse;">
                <tr>
                    <td style="border:1px solid black; padding: 5px; width: 25%;"><b>Öğrencinin Adı Soyadı</b></td>
                    <td style="border:1px solid black; padding: 5px; width: 25%;">${record.studentName}</td>
                    <td style="border:1px solid black; padding: 5px; width: 25%;"><b>Tarih</b></td>
                    <td style="border:1px solid black; padding: 5px; width: 25%;">${new Date(record.date).toLocaleDateString('tr-TR')}</td>
                </tr>
                 <tr>
                    <td style="border:1px solid black; padding: 5px;"><b>Sınıfı</b></td>
                    <td style="border:1px solid black; padding: 5px;">${record.className}</td>
                    <td style="border:1px solid black; padding: 5px;"><b>Numarası</b></td>
                    <td style="border:1px solid black; padding: 5px;">${record.studentNumber}</td>
                </tr>
            </table>

            <table style="width:100%; border-collapse: collapse; margin-top: 15px;">
                <tr><th style="border:1px solid black; padding: 5px; background-color: #f2f2f2;">ÖĞRENCİNİN REHBERLİK SERVİSİNE YÖNLENDİRİLME NEDENİ</th></tr>
                <tr><td style="border:1px solid black; padding: 5px; height: 80px;">${record.reason || ''}</td></tr>
                <tr><th style="border:1px solid black; padding: 5px; background-color: #f2f2f2;">ÖĞRENCİYLE İLGİLİ GÖZLEM VE DÜŞÜNCELER</th></tr>
                <tr><td style="border:1px solid black; padding: 5px; height: 80px;">${record.observations || ''}</td></tr>
                <tr><th style="border:1px solid black; padding: 5px; background-color: #f2f2f2;">ÖĞRENCİYLE İLGİLİ EDİNİLEN DİĞER BİLGİLER</th></tr>
                <tr><td style="border:1px solid black; padding: 5px; height: 80px;">${record.otherInfo || ''}</td></tr>
                <tr><th style="border:1px solid black; padding: 5px; background-color: #f2f2f2;">YÖNLENDİRMEYE NEDEN OLAN DURUMLA İLGİLİ YAPILAN ÇALIŞMALAR</th></tr>
                <tr><td style="border:1px solid black; padding: 5px; height: 80px;">${record.studiesDone || ''}</td></tr>
            </table>

             <table class="no-border" style="width:100%; margin-top: 40px; border:none;">
                <tr style="border:none;">
                    <td class="no-border" style="width:50%; vertical-align: top; text-align:center;">
                        <p style="margin: 0; padding: 0;"><b>Yönlendiren</b></p>
                        <p style="margin: 0; padding: 0;"><b>Adı Soyadı:</b> ${record.referrerName}</p>
                        <p style="margin: 0; padding: 0;"><b>Unvan:</b> ${record.referrerTitle}</p>
                        <p style="margin: 0; padding: 0; margin-top: 20px;"><b>İmza:</b></p>
                    </td>
                    <td class="no-border" style="width:50%; vertical-align: top; text-align:center;">
                        <p style="margin: 0; padding: 0;"><b>Okul Rehber Öğretmeni</b></p>
                        <p style="margin: 0; padding: 0;">${teacherProfile?.guidanceCounselorName || '....................'}</p>
                    </td>
                </tr>
                 <tr style="border:none;">
                    <td colspan="2" class="no-border" style="text-align: center; padding-top: 40px;">
                        <p style="margin:0;">Uygundur</p>
                        <p style="margin:0;">${new Date(record.date).toLocaleDateString('tr-TR')}</p>
                        <br/><br/>
                        <p style="margin:0;"><b>${teacherProfile?.principalName || '....................'}</b></p>
                        <p style="margin:0;">Okul Müdürü</p>
                    </td>
                 </tr>
            </table>
        </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
}

// --- OBSERVATION FORM EXPORT ---
interface ExportObservationFormArgs {
    record: ObservationRecord;
    teacherProfile: TeacherProfile | null;
    currentClass: Class | null;
}

export function exportObservationFormToRtf({ record, teacherProfile, currentClass }: ExportObservationFormArgs) {
    const title = "ÖĞRENCİ GÖZLEM FORMU";
    const filename = `Gozlem_Kaydi_${record.studentName!.replace(/ /g, '_')}.rtf`;
    const schoolName = teacherProfile?.schoolName || "..................";
    
    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4;">
            <div style="text-align:center;">
                <p style="margin:0; font-weight: bold; font-size: 10pt;">T.C.</p>
                <p style="margin:0; font-weight: bold; font-size: 12pt;">${(teacherProfile?.schoolName || schoolName).toLocaleUpperCase('tr-TR')}</p>
                <p style="margin:0; font-weight: bold; font-size: 12pt;">${(teacherProfile?.reportConfig?.academicYear || '20...-20...')} EĞİTİM ÖĞRETİM YILI</p>
                <h1 style="font-size: 14pt; font-weight: bold; margin-top: 15px;">${title}</h1>
            </div>
            <div style="text-align: right; margin-bottom: 10px; font-size: 11pt;">Tarih: ${new Date(record.recordDate).toLocaleDateString('tr-TR')}</div>
            
            <table style="width:100%; border-collapse: collapse;">
                <tr><td style="border:1px solid black; padding: 5px; width: 40%; background-color:#f2f2f2;"><b>Adı Soyadı</b></td><td style="border:1px solid black; padding: 5px;">${record.studentName}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Sınıfı/Okul Numarası</b></td><td style="border:1px solid black; padding: 5px;">${record.studentClassNumber}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Okulu</b></td><td style="border:1px solid black; padding: 5px;">${record.studentSchool}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Sınıf/Şube Rehber Öğretmeni</b></td><td style="border:1px solid black; padding: 5px;">${record.classTeacherName}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Gözlem Yapılan Yer</b></td><td style="border:1px solid black; padding: 5px;">${record.observationPlace}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Gözlem Yapılan Tarih/Saat</b></td><td style="border:1px solid black; padding: 5px;">${record.observationDateTime}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Gözlem Süresi</b></td><td style="border:1px solid black; padding: 5px;">${record.observationDuration}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; background-color:#f2f2f2;"><b>Gözlem Yapılacak Davranış</b></td><td style="border:1px solid black; padding: 5px;">${record.observationBehavior}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; min-height: 80px; background-color:#f2f2f2;"><b>Gözlem Sürecinin Planlanması</b><br/><span style="font-weight:normal; font-size:9pt;">(Davranışın Nerede, Ne Zaman, Ne Sıklıkta vs. Gözlemleneceği)</span></td><td style="border:1px solid black; padding: 5px;">${(record.observationPlanning || '').replace(/\n/g, '<br/>')}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; min-height: 100px; background-color:#f2f2f2;"><b>Öğretmenin Gözlemleri</b></td><td style="border:1px solid black; padding: 5px;">${(record.teacherObservations || '').replace(/\n/g, '<br/>')}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; min-height: 100px; background-color:#f2f2f2;"><b>Gözlem Sürecinin Değerlendirilmesi</b></td><td style="border:1px solid black; padding: 5px;">${(record.observationEvaluation || '').replace(/\n/g, '<br/>')}</td></tr>
                <tr><td style="border:1px solid black; padding: 5px; min-height: 100px; background-color:#f2f2f2;"><b>Sonuç ve Öneriler</b></td><td style="border:1px solid black; padding: 5px;">${(record.conclusionAndSuggestions || '').replace(/\n/g, '<br/>')}</td></tr>
            </table>

            <div style="text-align: right; margin-top: 40px;">
                 <p style="margin: 0; padding: 0;"><b>Gözlemi Yapan</b></p>
                 <p style="margin: 0; padding: 0;"><b>Adı Soyadı:</b> ${record.observerName}</p>
                 <p style="margin: 0; padding: 0;"><b>Unvanı:</b> ${record.observerTitle}</p>
                 <p style="margin: 0; padding: 0; margin-top: 20px;"><b>İmza:</b></p>
            </div>
        </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
}


// --- STUDENT INFO FORM EXPORT ---
interface ExportStudentInfoFormArgs {
    record: InfoForm;
    studentName: string;
    teacherProfile: TeacherProfile | null;
}

export function exportStudentInfoFormToRtf({ record, studentName, teacherProfile }: ExportStudentInfoFormArgs) {
    const title = "ÖĞRENCİ BİLGİ FORMU";
    const filename = `Ogrenci_Bilgi_Formu_${studentName.replace(/ /g, '_')}.rtf`;
    const schoolName = teacherProfile?.schoolName || "..................";

    const fields = [
        // Personal
        { label: 'Adı Soyadı', value: studentName },
        { label: 'Doğum Tarihi', value: record.birthDate || '' },
        { label: 'Doğum Yeri', value: record.birthPlace || '' },
        { label: 'Kan Grubu', value: record.bloodType || '' },
        { label: 'Boy / Kilo', value: `${record.height || '-'} cm / ${record.weight || '-'} kg` },
        { label: 'Telefon', value: record.studentPhone || '' },
        { label: 'E-posta', value: record.studentEmail || '' },
        { label: 'Adres', value: (record.address || '').replace(/\n/g, '<br/>') },
        { label: 'Yabancı Dil', value: record.foreignLanguage || '' },
        // Health
        { label: 'Sürekli Hastalık/Alerji', value: record.healthIssues || '' },
        { label: 'Geçmiş Önemli Hastalık/Ameliyat', value: record.pastIllnesses || '' },
        { label: 'Kullandığı Cihaz/Protez', value: record.healthDevice || '' },
        // Socio-economic
        { label: 'Hobiler', value: record.hobbies || '' },
        { label: 'Bir İşte Çalışıyor mu?', value: record.isWorking === 'yes' ? 'Evet' : 'Hayır' },
        { label: 'Okula Ulaşım Şekli', value: record.commutesToSchoolBy || '' },
        { label: 'Oturulan Ev Kira Mı?', value: record.isHomeRented === 'yes' ? 'Evet' : 'Hayır' },
        { label: 'Kendine Ait Odası Var Mı?', value: record.hasOwnRoom === 'yes' ? 'Evet' : 'Hayır' },
        // Family
        { label: 'Veli Telefonu', value: record.guardianPhone || '' },
        { label: 'Anne Hayatta mı?', value: record.motherStatus === 'alive' ? 'Hayatta' : 'Vefat Etti' },
        { label: 'Anne Eğitim/Meslek', value: `${record.motherEducation || ''} / ${record.motherJob || ''}` },
        { label: 'Baba Hayatta mı?', value: record.fatherStatus === 'alive' ? 'Hayatta' : 'Vefat Etti' },
        { label: 'Baba Eğitim/Meslek', value: `${record.fatherEducation || ''} / ${record.fatherJob || ''}` },
        { label: 'Kiminle Yaşıyor?', value: record.familyLivesWith || '' },
        { label: 'Kardeş Bilgileri', value: record.siblingsInfo || '' },
        { label: 'Üvey Kardeşi Var Mı?', value: record.hasStepSibling === 'yes' ? 'Evet' : 'Hayır' },
        { label: 'Ailenin Gelir Düzeyi', value: record.economicStatus || '' },
        { label: 'Ailenin Derslere Tutumu', value: record.parentalAttitude || '' },
        // Special Status
        { label: 'Engel Durumu', value: record.hasDisability === 'yes' ? 'Evet' : 'Hayır' },
        { label: 'Şehit/Gazi Çocuğu Mu?', value: record.isMartyrVeteranChild === 'yes' ? 'Evet' : 'Hayır' },
    ];
    
    let tableRows = fields.map(field => `<tr><td style="width:30%; padding: 5px; font-weight: bold; background-color: #f2f2f2;">${field.label}</td><td style="padding: 5px;">${field.value}</td></tr>`).join('');

    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.4;">
            <div style="text-align:center; font-weight: bold; font-size: 14pt;">${title}</div>
            <div style="text-align:center; font-size: 12pt; margin-bottom: 20px;">${schoolName} MÜDÜRLÜĞÜ</div>
            <table style="width:100%; border-collapse: collapse;" border="1">
                ${tableRows}
            </table>
        </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
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
                <td class="no-border center" style="width:100%;">
                    <br/><br/>
                    <span class="bold">${teacherProfile.name}</span><br/>
                    Ders Öğretmeni
                </td>
            </tr>
            <tr>
                <td class="no-border center" style="width:100%;">
                    <br/><br/><br/>
                    Uygundur<br/>
                    <span class="bold">${config.date || new Date().toLocaleDateString('tr-TR')}</span><br/><br/><br/>
                    <span class="bold">${config.principalName || '...'}</span><br/>
                    Okul Müdürü
                </td>
            </tr>
        </table>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- PRINTABLE HOMEWORK EXPORT ---
interface ExportPrintableHomeworkArgs {
    assignment: any; 
    rubric: {
        items: { label: string; desc: string; score: string | number }[];
    };
    teacherProfile: TeacherProfile | null;
}

export function exportPrintableHomeworkToRtf({ assignment, rubric, teacherProfile }: ExportPrintableHomeworkArgs) {
    const title = assignment.title || "Ödev Çıktısı";
    const filename = `${title.replace(/ /g, '_')}.rtf`;

    const rubricHtml = `
        <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px;">4. Değerlendirme Kriterleri</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;" border="1">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; font-weight: bold;">Kriter</th>
                    <th style="padding: 8px; font-weight: bold;">Açıklama</th>
                    <th style="padding: 8px; font-weight: bold; width: 15%;">Puan</th>
                </tr>
            </thead>
            <tbody>
                ${(rubric?.items || []).map((item: any) => `
                    <tr>
                        <td style="padding: 8px;">${item.label}</td>
                        <td style="padding: 8px;">${item.desc}</td>
                        <td style="padding: 8px; text-align: center;">${item.score}</td>
                    </tr>
                `).join('')}
                <tr>
                    <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">TOPLAM</td>
                    <td style="padding: 8px; text-align: center; font-weight: bold;">${(rubric?.items || []).reduce((sum: number, item: any) => sum + parseInt(item.score || '0', 10), 0)}</td>
                </tr>
            </tbody>
        </table>
    `;

    const content = `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
        <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 18pt;">PERFORMANS ÖDEVİ</h1>
          <p style="margin: 0; font-size: 11pt;">${teacherProfile?.reportConfig?.academicYear || '2025-2026'} Eğitim - Öğretim Yılı</p>
        </div>
        <div style="grid-template-columns: 1fr 1fr; display: grid; gap: 20px 30px; margin-bottom: 30px; padding: 15px; border: 1px solid #ccc; border-radius: 5px;">
            <div><b>Adı Soyadı:</b></div><div><b>Sınıfı / No:</b></div>
            <div><b>Teslim Tarihi:</b></div><div><b>Aldığı Not:</b></div>
        </div>
        <div>
          <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Ödev Konusu</h2>
          <div style="background-color: #f8f8f8; padding: 15px; border-left: 4px solid #4a90e2; margin-bottom: 20px;">
            <h3 style="margin-top: 0; font-size: 13pt;">${assignment.title}</h3>
            <p>${assignment.description}</p>
          </div>
        </div>
        <div>
          <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Yönerge</h2>
          <p>${assignment.instructions}</p>
        </div>
        <div>
          <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px;">3. Teslim Şartları</h2>
          <ul>
            <li>Bu ödev <b>${assignment.formats}</b> formatında hazırlanmalıdır.</li>
            <li>Dijital dosya boyutu <b>${assignment.size}</b>'ı geçmemelidir.</li>
          </ul>
        </div>
        ${rubric ? rubricHtml : ''}
      </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
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

// --- PROJECT DISTRIBUTION EXPORT (SUMMARY ONLY) ---
interface ExportProjectDistributionArgs {
    students: Student[];
    lessons: Lesson[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportProjectDistributionToRtf({ students, lessons, currentClass, teacherProfile }: ExportProjectDistributionArgs) {
    const reportTitle = "PROJE ÖDEVİ DAĞILIM LİSTESİ";
    const title = `${currentClass.name} - ${reportTitle}`;
    
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:35%;">Adı Soyadı</th>
            <th class="horizontal" style="width:35%;">Atanan Proje Ödevi</th>
        </tr>
    `;
    const dataRows = students.filter(s => s.assignedLesson).map((s, index) => {
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

// --- PROJECT PETITIONS EXPORT ---
interface ExportProjectPetitionsArgs {
    students: Partial<Student>[];
    lessons: Lesson[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportProjectPetitionsToRtf({ students, lessons, currentClass, teacherProfile }: ExportProjectPetitionsArgs) {
    const css = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; margin: 0; padding: 0; }
            .page-break { page-break-after: always; }
            .dilekce-container { height: 9.5cm; border-bottom: 1px dashed #999; padding: 20px 40px; box-sizing: border-box; position: relative; }
            .header { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 10px; text-transform: uppercase; }
            .tarih-sag { text-align: right; margin-bottom: 10px; font-size: 11pt; }
            .content { text-align: justify; margin-bottom: 15px; line-height: 1.4; }
            .tercihler { margin-left: 10px; margin-bottom: 20px; }
            .tercih-satir { margin-bottom: 8px; font-weight: bold; }
            .imza-tablosu { width: 100%; margin-top: 25px; border-collapse: collapse; }
            .imza-hucre { vertical-align: top; width: 50%; padding: 5px; border: none;}
            .imza-baslik { font-weight: bold; margin-bottom: 40px; display: block; }
            .imza-isim { font-weight: bold; display: block; margin-top: 40px; text-transform: uppercase; }
            .imza-unvan { font-size: 10pt; }
        </style>
    `;

    let htmlContent = '';
    students.forEach((student, index) => {
        const isThirdItem = (index + 1) % 3 === 0;

        const tercihlerHtml = Array.from({ length: 5 }).map((_, i) => {
            const preferenceId = student.projectPreferences?.[i];
            const lessonName = preferenceId ? lessons.find(l => l.id === preferenceId)?.name : '....................................................................';
            return `<div class="tercih-satir"><b>${i + 1}.</b> ${lessonName}</div>`;
        }).join('');

        htmlContent += `
            <div class="dilekce-container">
                <div class="header">${teacherProfile?.schoolName || '...'} OKULU MÜDÜRLÜĞÜNE</div>
                <div class="tarih-sag">${new Date().toLocaleDateString('tr-TR')}</div>
                <div class="content">
                    Okulunuzun <b>${currentClass?.name || '...'}</b> sınıfı, <b>${student.number || '...'}</b> numaralı öğrencisiyim.
                    <b>${teacherProfile?.reportConfig?.academicYear || '...'}</b> Eğitim-Öğretim yılında proje ödevi almak istediğim derslere ait tercihlerim öncelik sırasına göre aşağıdadır.
                    <br/>Gereğini bilgilerinize arz ederim.
                </div>
                <div class="tercihler">${tercihlerHtml}</div>
                <table class="imza-tablosu">
                    <tr>
                        <td class="imza-hucre" align="center">
                            <span class="imza-baslik">Uygundur</span><br/><br/>
                            <span class="imza-isim">${teacherProfile?.name || '...'}</span><br/>
                            <span class="imza-unvan">Sınıf Rehber Öğretmeni</span>
                        </td>
                        <td class="imza-hucre" align="center">
                            <div style="height: 40px;"></div>
                            <span class="imza-isim">${student.name || '...'}</span><br/>
                            <span>İmza</span>
                        </td>
                    </tr>
                </table>
            </div>
            ${isThirdItem ? '<br class="page-break" />' : ''}
        `;
    });

    const fullHtml = `<html><head><meta charset='utf-8'><title>Proje Tercih Dilekçeleri</title>${css}</head><body>${htmlContent}</body></html>`;
    downloadRtf(fullHtml, 'proje_tercih_dilekceleri.doc');
}



// --- CLUB PETITIONS EXPORT ---
interface ExportClubPetitionsArgs {
    students: Partial<Student>[];
    clubs: Club[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportClubPetitionsToRtf({ students, clubs, currentClass, teacherProfile }: ExportClubPetitionsArgs) {
    const css = `
        <style>
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; margin: 0; padding: 0; }
            .page-break { page-break-after: always; }
            .dilekce-container { height: 9.5cm; border-bottom: 1px dashed #999; padding: 20px 40px; box-sizing: border-box; position: relative; }
            .header { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 10px; text-transform: uppercase; }
            .tarih-sag { text-align: right; margin-bottom: 10px; font-size: 11pt; }
            .content { text-align: justify; margin-bottom: 15px; line-height: 1.4; }
            .tercihler { margin-left: 10px; margin-bottom: 20px; }
            .tercih-satir { margin-bottom: 8px; font-weight: bold; }
            .imza-tablosu { width: 100%; margin-top: 25px; border-collapse: collapse; }
            .imza-hucre { vertical-align: top; width: 50%; padding: 5px; border: none;}
            .imza-baslik { font-weight: bold; margin-bottom: 40px; display: block; }
            .imza-isim { font-weight: bold; display: block; margin-top: 40px; text-transform: uppercase; }
            .imza-unvan { font-size: 10pt; }
        </style>
    `;

    let htmlContent = '';
    students.forEach((student, index) => {
        const isThirdItem = (index + 1) % 3 === 0;

        const tercihlerHtml = Array.from({ length: 4 }).map((_, i) => {
            const preferenceId = student.clubPreferences?.[i];
            const clubName = preferenceId ? clubs.find(c => c.id === preferenceId)?.name : '....................................................................';
            return `<div class="tercih-satir"><b>${i + 1}.</b> ${clubName}</div>`;
        }).join('');

        htmlContent += `
            <div class="dilekce-container">
                <div class="header">${teacherProfile?.schoolName || '...'} OKULU MÜDÜRLÜĞÜNE</div>
                <div class="tarih-sag">${new Date().toLocaleDateString('tr-TR')}</div>
                <div class="content">
                    Okulunuzun <b>${currentClass?.name || '...'}</b> sınıfı, <b>${student.number || '...'}</b> numaralı öğrencisiyim.
                    <b>${teacherProfile?.reportConfig?.academicYear || '...'}</b> Eğitim-Öğretim yılında, okuldaki sosyal etkinlik çalışmaları kapsamında görev almak istediğim kulüplere ait tercihlerim öncelik sırasına göre aşağıdadır.
                    <br/>Gereğini bilgilerinize arz ederim.
                </div>
                <div class="tercihler">${tercihlerHtml}</div>
                <table class="imza-tablosu">
                    <tr>
                        <td class="imza-hucre" align="center">
                            <span class="imza-baslik">Uygundur</span><br/><br/>
                            <span class="imza-isim">${teacherProfile?.name || '...'}</span><br/>
                            <span class="imza-unvan">Sınıf Rehber Öğretmeni</span>
                        </td>
                        <td class="imza-hucre" align="center">
                            <div style="height: 40px;"></div>
                            <span class="imza-isim">${student.name || '...'}</span><br/>
                            <span>İmza</span>
                        </td>
                    </tr>
                </table>
            </div>
            ${isThirdItem ? '<br class="page-break" />' : ''}
        `;
    });

    const fullHtml = `<html><head><meta charset='utf-8'><title>Kulüp Tercih Dilekçeleri</title>${css}</head><body>${htmlContent}</body></html>`;
    downloadRtf(fullHtml, 'kulup_tercih_dilekceleri.doc');
}



// --- CLUB DISTRIBUTION EXPORT ---
interface ExportClubDistributionArgs {
    students: Student[];
    clubs: Club[];
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportClubDistributionToRtf({ students, clubs, currentClass, teacherProfile }: ExportClubDistributionArgs) {
    const reportTitle = "SOSYAL KULÜP DAĞILIM LİSTESİ";
    const title = `${currentClass.name} - ${reportTitle}`;
    
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:10%;">S.No</th>
            <th class="horizontal" style="width:20%;">Okul No</th>
            <th class="horizontal" style="width:35%;">Adı Soyadı</th>
            <th class="horizontal" style="width:35%;">Atanan Kulüp</th>
        </tr>
    `;
    const dataRows = students.map((s, index) => {
        const assignedClubs = s.assignedClubIds?.map(clubId => clubs.find(c => c.id === clubId)?.name).filter(Boolean).join(', ') || 'Atanmadı';
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                <td>${assignedClubs}</td>
            </tr>
        `;
    }).join('');
    
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

// --- STUDENT DEVELOPMENT REPORT EXPORT ---
interface StudentDevelopmentReportArgs {
    student: Student;
    infoForm: InfoForm | null;
    riskFactors: RiskFactor[];
    teacherProfile: TeacherProfile;
    currentClass: Class;
    homeworks: Homework[];
    submissions: Submission[];
    disciplineRecords: DisciplineRecord[];
    lessons: Lesson[];
    aiReport: StudentReportOutput | null;
}
export function exportStudentDevelopmentReportToRtf({ student, infoForm, riskFactors, teacherProfile, currentClass, homeworks, submissions, disciplineRecords, lessons, aiReport }: StudentDevelopmentReportArgs) {
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
    
    const getBehaviorIssues = (termGrades?: GradingScores) => {
        if (!termGrades?.behaviorScores) return [];
        return Object.entries(termGrades.behaviorScores)
            .filter(([_, score]) => score > 0)
            .map(([criteriaId, _]) => {
                const criterion = behaviorCriteria.find(c => c.id === criteriaId);
                return criterion ? criterion.name : null;
            })
            .filter((name): name is string => name !== null);
    };

    const term1BehaviorIssues = getBehaviorIssues(student.term1Grades);
    const term2BehaviorIssues = getBehaviorIssues(student.term2Grades);
    const allBehaviorIssues = [...new Set([...term1BehaviorIssues, ...term2BehaviorIssues])];

    // --- REPORT SECTIONS ---
    const studentInfoSection = `
        <h3>A. ÖĞRENCİ KİMLİK BİLGİLERİ</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;"><b>Adı Soyadı:</b></td><td>${student.name}</td></tr>
            <tr><td><b>Okul Numarası:</b></td><td>${student.number}</td></tr>
            <tr><td><b>Sınıfı:</b></td><td>${currentClass.name}</td></tr>
            <tr><td><b>Doğum Tarihi:</b></td><td>${infoForm?.birthDate || 'Belirtilmemiş'}</td></tr>
            <tr><td><b>Doğum Yeri:</b></td><td>${infoForm?.birthPlace || 'Belirtilmemiş'}</td></tr>
        </table>
    `;

    const familyInfoSection = `
        <h3>B. AİLE BİLGİLERİ</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;">Anne Durumu:</td><td>${infoForm?.motherStatus || 'N/A'}</td></tr>
            <tr><td>Anne Eğitim / Meslek:</td><td>${(infoForm?.motherEducation || 'N/A') + ' / ' + (infoForm?.motherJob || 'N/A')}</td></tr>
            <tr><td>Baba Durumu:</td><td>${infoForm?.fatherStatus || 'N/A'}</td></tr>
            <tr><td>Baba Eğitim / Meslek:</td><td>${(infoForm?.fatherEducation || 'N/A') + ' / ' + (infoForm?.fatherJob || 'N/A')}</td></tr>
            <tr><td>Kardeş Bilgileri:</td><td>${infoForm?.siblingsInfo || 'N/A'}</td></tr>
            <tr><td>Ailenin Ekonomik Durumu:</td><td>${infoForm?.economicStatus || 'N/A'}</td></tr>
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
    const assignedProject = lessons.find(l => l.id === student.assignedLesson);
    
    const socialSection = `
        <h3>D. SOSYAL VE DAVRANIŞSAL DURUMU</h3>
        <table style="width: 100%;">
            <tr><td style="width: 30%;"><b>Devamsızlık Durumu:</b></td><td>Toplam ${attendanceCount} gün devamsızlığı bulunmaktadır.</td></tr>
            <tr><td><b>Risk Faktörleri:</b></td><td>${student.risks.map(rId => riskFactors.find(rf => rf.id === rId)?.label).filter(Boolean).join(', ') || 'Belirtilen risk faktörü yok.'}</td></tr>
            <tr><td><b>Davranış (Kanaat) Notu:</b></td><td>${student.behaviorScore ?? 'Hesaplanmadı'}</td></tr>
            <tr><td><b>Gözlemlenen Olumsuz Davranışlar:</b></td><td>${allBehaviorIssues.length > 0 ? allBehaviorIssues.join(', ') : 'Kaydedilmiş olumsuz davranış bulunmamaktadır.'}</td></tr>
            <tr><td><b>Proje Ödevi:</b></td><td>${assignedProject ? assignedProject.name : 'Proje ödevi almadı.'}</td></tr>
        </table>
    `;

    const homeworkRows = homeworks.map(hw => {
        const submission = submissions.find(s => s.homeworkId === hw.id && s.studentId === student.id);
        return `
            <tr>
                <td>${format(new Date(hw.assignedDate), 'dd.MM.yyyy')}</td>
                <td>${hw.text}</td>
                <td class="center">${submission ? 'Evet' : 'Hayır'}</td>
                <td class="center">${submission?.grade ?? '-'}</td>
            </tr>
        `;
    }).join('');

    const homeworkSection = `
        <h3>E. ÖDEV DURUMU</h3>
        ${homeworks.length > 0 ? `
            <table style="width: 100%;">
                <tr><th>Veriliş Tarihi</th><th>Ödev Konusu</th><th>Teslim Edildi Mi?</th><th>Notu</th></tr>
                ${homeworkRows}
            </table>
        ` : '<p>Öğrenciye atanmış ödev bulunmamaktadır.</p>'}
    `;

    const disciplineRows = disciplineRecords.filter(dr => dr.formData?.studentInfo?.studentId === student.id).map(dr => {
        const phaseMap = ['Olay Tespiti', 'Savunma', 'Kurula Sevk', 'Kurul Toplantısı', 'Karar'];
        return `
            <tr>
                <td>${format(new Date(dr.date), 'dd.MM.yyyy')}</td>
                <td>${dr.formData?.phase1Data?.behaviorType ? (dr.formData.phase1Data.label || dr.formData.phase1Data.behaviorType) : 'Belirtilmemiş'}</td>
                <td>${phaseMap[dr.currentPhase - 1] || 'Bilinmiyor'}</td>
            </tr>
        `;
    }).join('');

    const disciplineSection = `
        <h3>F. DİSİPLİN SÜREÇLERİ</h3>
         ${disciplineRecords.filter(dr => dr.formData?.studentInfo?.studentId === student.id).length > 0 ? `
            <table style="width: 100%;">
                <tr><th>Tarih</th><th>Konu</th><th>Mevcut Aşama</th></tr>
                ${disciplineRows}
            </table>
        ` : '<p>Öğrenci hakkında başlatılmış bir disiplin süreci bulunmamaktadır.</p>'}
    `;


    const observationSection = `
        <h3>G. ÖĞRETMEN GÖZLEM VE DEĞERLENDİRMELERİ</h3>
        ${aiReport ? `
            <p><b>Akademik Durum:</b> ${aiReport.academicStatus}</p>
            <p><b>Sosyal ve Davranışsal Durum:</b> ${aiReport.socialAndBehavioralStatus}</p>
            <p><b>Risk Analizi:</b> ${aiReport.riskAnalysis}</p>
            <p><b>Güçlü Yönler:</b></p>
            <p>${aiReport.strengths.replace(/\n/g, '<br>')}</p>
            <p><b>Tavsiyeler:</b></p>
            <p>${aiReport.recommendations.replace(/\n/g, '<br>')}</p>
        ` : '<div style="border: 1px solid black; height: 200px; padding: 5px;"></div>'}
    `;

    const content = `
        ${header}
        ${studentInfoSection}
        ${familyInfoSection}
        ${gradesSection}
        ${socialSection}
        ${homeworkSection}
        ${disciplineSection}
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

// --- HOMEWORK EVALUATION EXPORT ---
interface ExportHomeworkEvaluationArgs {
    students: Student[];
    selectedHomework: any; // Using any because it's a dynamic object from Firestore
    scores: { [studentId: string]: { [criteriaId: string]: number } };
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}

export function exportHomeworkEvaluationToRtf({
    students,
    selectedHomework,
    scores,
    currentClass,
    teacherProfile
}: ExportHomeworkEvaluationArgs) {
    const reportTitle = `${selectedHomework.text.substring(0, 30)}... Performans Ödevi Değerlendirme Çizelgesi`;
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - Performans Değerlendirme`;

    const rubric = selectedHomework.rubric;

    const tableHeader = `
        <tr>
            <th class="horizontal" style="width:5%;">S.No</th>
            <th class="horizontal" style="width:10%;">Okul No</th>
            <th class="horizontal" style="width:25%;">Adı Soyadı</th>
            ${rubric.map((c: any) => `<th>${c.label}<br/><span class="small-text">(${c.score} P)</span></th>`).join('')}
            <th class="horizontal" style="width:10%;">TOPLAM</th>
        </tr>
    `;

    const dataRows = students.map((s, index) => {
        const studentScores = scores[s.id] || {};
        const total = rubric.reduce((sum: number, c: any) => sum + (Number(studentScores[c.label]) || 0), 0);
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                ${rubric.map((c: any) => `<td class="center">${studentScores[c.label] || 0}</td>`).join('')}
                <td class="center bold">${total}</td>
            </tr>
        `;
    }).join('');

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



// --- QUESTION EXPORT ---
function getRtfImageString(base64Data: string, width: number, height: number): string {
    const hexData = Array.from(atob(base64Data), c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const picw = Math.round(width);
    const pich = Math.round(height);
    // RTF uses twips. 1 inch = 1440 twips. Assume 96 DPI. 1 pixel = 1440/96 = 15 twips.
    const picwgoal = Math.round(width * 15);
    const pichgoal = Math.round(height * 15);
    
    //{\\pict\\pngblip\\picw[width]\\pich[height]\\picwgoal[width in twips]\\pichgoal[height in twips] HEX_DATA}
    return `{\\pict\\pngblip\\picw${picw}\\pich${pich}\\picwgoal${picwgoal}\\pichgoal${pichgoal} ${hexData}}`;
}

export function exportQuestionToRtf(question: Question, imageDataUrl: string | null) {
    const title = `Soru - ${question.id}`;

    const header = `{\\rtf1\\ansi\\ansicpg1254\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset162 Calibri;}}\\pard\\sa200\\sl276\\slmult1\\f0\\fs22`;

    const studentInfo = `
\\b Adı Soyadı: \\b0 .................................... \\tab \\b Sınıfı: \\b0 ........... \\tab \\b No: \\b0 ...........\\par
\\line`;

    let questionContent = '';
    if (imageDataUrl) {
        const base64String = imageDataUrl.split(',')[1];
        // Cannot get image dimensions synchronously here, so we might need a fixed size or pass them in.
        // Assuming a default display size for now. A better solution would involve loading the image to get its dimensions.
        const rtfImage = getRtfImageString(base64String, 500, 300); // Placeholder dimensions
        questionContent = `{\\pard ${rtfImage}\\par}`;
    } else {
        const escapedText = question.text
            .replace(/\\/g, '\\\\')
            .replace(/{/g, '\\{')
            .replace(/}/g, '\\}')
            .replace(/\n/g, '\\line ');
        questionContent = `{\\pard ${escapedText}\\par}`;
    }

    const optionsContent = (question.options || []).map((opt, i) =>
        `{\\pard \\tab \\b ${String.fromCharCode(65 + i)}) \\b0 ${opt} \\par}`
    ).join('');

    const footer = `}`;

    const rtfContent = `${header}${studentInfo}${questionContent}${optionsContent}${footer}`;
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    saveAs(blob, `Soru_${question.id}.rtf`);
}

// --- EXAM EXPORT ---
interface ExportExamArgs {
    questions: Question[];
    imageDataUrls: { [questionId: string]: string | null };
    examTitle: string;
    schoolName: string;
    academicYear: string;
    lessonName: string;
    className: string;
    teacherName?: string;
    departmentHeadName?: string;
    principalName?: string;
    columns?: '1' | '2';
    showTeacher?: boolean;
    showDepartmentHead?: boolean;
    showPrincipal?: boolean;
}


export function exportExamToRtf({ questions, imageDataUrls, examTitle, ...settings }: ExportExamArgs) {
    const title = examTitle || "Sınav";
    
    const tr = (text: string) => {
        if (!text) return '';
        let escapedText = text.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}');
        const replacements: { [key: string]: string } = {
            'ı': "\\'fd", 'İ': "\\'dd", 'ş': "\\'fe", 'Ş': "\\'de",
            'ğ': "\\'f0", 'Ğ': "\\'d0", 'ü': "\\'fc", 'Ü': "\\'dc",
            'ö': "\\'f6", 'Ö': "\\'d6", 'ç': "\\'e7", 'Ç': "\\'c7",
        };

        for (const char in replacements) {
            escapedText = escapedText.replace(new RegExp(char, 'g'), replacements[char]);
        }
        return escapedText;
    };

    const header = `{\\rtf1\\ansi\\ansicpg1254\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset162 Calibri;}}\\pard\\sa200\\sl276\\slmult1\\f0\\fs22`;
    
    const examHeader = `
{\\pard\\qc\\b\\fs32 ${tr(examTitle.toLocaleUpperCase('tr-TR'))}\\par}
{\\pard\\qc\\b\\fs24 ${tr(settings.schoolName)} \\line ${tr(settings.academicYear)} E\\\'f0itim \\\'d6\\\'f0retim Y\\'fdl\\'fd ${tr(settings.lessonName)} Dersi ${tr(settings.className)} S\\'fdn\\'fd f\\'fd\\par}
\\line
{\\pard\\b Ad\\'fd Soyad\\'fd: \\b0 .................................... \\tab \\b S\\'fdn\\'fd f\\'fd: \\b0 ........... \\tab \\b No: \\b0 ...........\\par}
\\line
\\line`;

    let questionsContent = '';

    if (settings.columns === '2') {
        questionsContent += `{\\pard\\cols2\\par `;
    }

    questions.forEach((q, index) => {
        let questionBody = '';
        const imageDataUrl = imageDataUrls[q.id];

        if (imageDataUrl) {
            const base64String = imageDataUrl.split(',')[1];
            // Cannot get image dimensions synchronously here, so we might need a fixed size or pass them in.
            // Assuming a default display size for now. A better solution would involve loading the image to get its dimensions.
            questionBody = `{\\pard ${getRtfImageString(base64String, 800, 600)}\\par}`;
        } else {
             const escapedText = q.text.replace(/\n/g, '\\line ');
            questionBody = `{\\pard ${tr(escapedText)}\\par}`;
        }
        
        let answerContent = '';
        if (q.type === 'multiple-choice') {
            answerContent = (q.options || []).map((opt, i) =>
                `{\\pard \\tab \\b ${String.fromCharCode(65 + i)}) \\b0 ${tr(opt)} \\par}`
            ).join('');
        } else if (q.type === 'matching' && q.matchingPairs && q.matchingPairs.length > 0) {
            const shuffledAnswers = [...q.matchingPairs].sort(() => Math.random() - 0.5);

            let questionsList = q.matchingPairs.map((pair, index) => 
                `{\\pard \\tab (___) ${index + 1}. ${tr(pair.question)}\\par}`
            ).join('');
            
            let answersList = shuffledAnswers.map((pair, index) =>
                 `{\\pard \\tab \\b ${String.fromCharCode(65 + index)}) \\b0 ${tr(pair.answer)}\\par}`
            ).join('');

            answerContent = `${questionsList}{\\pard \\line \\par}${answersList}`;
        } else if (q.type === 'true-false') {
            answerContent = '{\\pard \\tab ( ) Do\\\'f0ru \\tab ( ) Yanl\\\'fd\\\'fe \\par}';
        } else if (q.type === 'short-answer' || q.type === 'open-ended') {
            answerContent = '{\\pard \\line \\line \\line \\par}';
        }

        const questionHeader = `{\\pard\\fs22 \\b ${index + 1}) (Puan: ${q.points || 0}) \\b0 `;
        
        questionsContent += `${questionHeader}${questionBody} ${answerContent} \\par}`;
    });
    
    if (settings.columns === '2') {
        questionsContent += `\\colbreak}`;
    }

    const signatureSection = () => {
        const teacherSig = settings.showTeacher ? `\\pard\\intbl\\qc ${tr(settings.teacherName || '')}\\line ${tr(settings.lessonName)} \\'d6\\'f0retmeni\\cell` : `\\pard\\intbl\\qc \\cell`;
        const deptHeadSig = settings.showDepartmentHead ? `\\pard\\intbl\\qc ${tr(settings.departmentHeadName || '')}\\line Z\\'fcmre Ba\\\'fe kan\\'fd\\cell` : `\\pard\\intbl\\qc \\cell`;
        const principalSig = settings.showPrincipal ? `\\pard\\intbl\\qc ${tr(settings.principalName || '')}\\line Okul M\\'fcd\\'fcr\\'fc\\cell` : `\\pard\\intbl\\qc \\cell`;
        
        if (!settings.showTeacher && !settings.showDepartmentHead && !settings.showPrincipal) return '';

        return `
\\line\\line\\line
{\\pard\\qc
{\\trowd \\trgaph108 \\trleft-108 \\trbrdrt\\brdrs\\brdrw10
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx3166
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx6332
\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10 \\cellx9500
${teacherSig}
${deptHeadSig}
${principalSig}
\\row}
\\par}`;
    };


    const footer = `}`;

    const rtfContent = `${header}${examHeader}${questionsContent}${signatureSection()}${footer}`;
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    saveAs(blob, `${title.replace(/ /g, '_')}.rtf`);
}

// --- PROJECT RTF EXPORT ---
export function exportProjectToRtf(project: any) {
    const title = project.title || "Proje Ödevi";
    
    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; padding: 2cm;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 18pt;">PERFORMANS PROJESİ</h1>
                <p style="margin: 0; font-size: 11pt;">${project.grade}. Sınıf - ${project.subject === 'physics' ? 'Fizik' : 'Türk Dili ve Edebiyatı'}</p>
            </div>

            <table style="width: 100%; border: 1px solid black; border-collapse: collapse; margin-bottom: 30px;">
                <tr><td style="padding: 8px; border: 1px solid black; font-weight: bold; width: 30%;">Adı Soyadı:</td><td style="border: 1px solid black;"></td></tr>
                <tr><td style="padding: 8px; border: 1px solid black; font-weight: bold;">Sınıfı / No:</td><td style="border: 1px solid black;"></td></tr>
                <tr><td style="padding: 8px; border: 1px solid black; font-weight: bold;">Teslim Tarihi:</td><td style="border: 1px solid black;"></td></tr>
                <tr><td style="padding: 8px; border: 1px solid black; font-weight: bold;">Aldığı Not:</td><td style="border: 1px solid black;"></td></tr>
            </table>

            <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Proje Konusu</h2>
            <div style="background-color: #f7f7f7; padding: 15px; border-left: 4px solid #4a90e2; margin-bottom: 20px;">
                <h3 style="margin-top: 0; font-size: 13pt;">${project.title}</h3>
                <p style="margin-bottom: 0;">${project.description}</p>
            </div>

            <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Yönerge</h2>
            <p style="text-align: justify;">${project.instructions}</p>
            
            <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px;">3. Teslim Şartları</h2>
            <ul>
                <li>Bu proje <b>${project.formats}</b> formatında hazırlanmalıdır.</li>
                <li>Dijital dosya boyutu <b>${project.size}</b>'ı geçmemelidir.</li>
            </ul>
        </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- TERM GRADES EXPORT ---
interface ExportTermGradesArgs {
    students: Student[];
    term: 1 | 2;
    currentClass: Class;
    teacherProfile: TeacherProfile;
    perfCriteria: Criterion[];
    projCriteria: Criterion[];
}

export function exportTermGradesToRtf({ students, term, currentClass, teacherProfile, perfCriteria, projCriteria }: ExportTermGradesArgs) {
    const reportTitle = `${term}. DÖNEM NOT ÇİZELGESİ`;
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${term}. Dönem Notları`;
    const termKey = term === 1 ? 'term1Grades' : 'term2Grades';

    const calculateAverage = (grades: GradingScores, hasProject?: boolean) => {
        const scores = [grades.exam1, grades.exam2, grades.perf1, grades.perf2];
        if (term === 2 && hasProject) {
            scores.push(grades.projectGrade);
        }
        const validScores = scores.filter(g => g !== undefined && g !== null && g !== -1) as number[];
        if (validScores.length === 0) return 0;
        return validScores.reduce((a, b) => a + b, 0) / validScores.length;
    };
    
    const sortedStudents = [...students].sort((a, b) => a.number.localeCompare(b.number, 'tr', { numeric: true }));

    const tableHeader = `
        <tr>
            <th>S.No</th>
            <th>Okul No</th>
            <th>Adı Soyadı</th>
            <th>1. Sınav</th>
            <th>2. Sınav</th>
            <th>1. Performans</th>
            <th>2. Performans</th>
            ${term === 2 ? '<th>Proje</th>' : ''}
            <th>Ortalama</th>
        </tr>
    `;

    const dataRows = sortedStudents.map((s, index) => {
        const grades = s[termKey] || {};
        const average = calculateAverage(grades, s.hasProject);
        const displayGrade = (grade: number | undefined | null) => (grade === -1 ? 'G' : grade ?? '');
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                <td class="center">${displayGrade(grades.exam1)}</td>
                <td class="center">${displayGrade(grades.exam2)}</td>
                <td class="center">${displayGrade(grades.perf1)}</td>
                <td class="center">${displayGrade(grades.perf2)}</td>
                ${term === 2 ? `<td class="center">${s.hasProject ? displayGrade(grades.projectGrade) : 'N/A'}</td>` : ''}
                <td class="center bold">${average.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- SOCIOGRAM EXPORT ---
interface SociogramExportArgs {
    students: Student[];
    analysis: {
        popular: { student: Student; pos: number; neg: number; lead: number }[];
        isolated: Student[];
        rejected: { student: Student; pos: number; neg: number; lead: number }[];
    };
    currentClass: Class;
    teacherProfile: TeacherProfile | null;
    survey: SociogramSurvey;
    aiAnalysis: SociogramAnalysisOutput | null;
}

export function exportSociogramToRtf({ students, analysis, currentClass, teacherProfile, survey, aiAnalysis }: SociogramExportArgs) {
    const reportTitle = "Sosyometri Analiz Raporu";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - ${reportTitle}`;

    const studentTable = `
        <h3>A. ÖĞRENCİ SEÇİMLERİ (HAM VERİ)</h3>
        <table>
            <thead>
                <tr>
                    <th>Öğrenci</th>
                    <th>Olumlu Seçimler (${survey.questions.find(q => q.type === 'positive')?.maxSelections || ''} kişi)</th>
                    <th>Olumsuz Seçimler (${survey.questions.find(q => q.type === 'negative')?.maxSelections || ''} kişi)</th>
                    <th>Lider Seçimleri (${survey.questions.find(q => q.type === 'leadership')?.maxSelections || ''} kişi)</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td>${s.name}</td>
                        <td>${s.positiveSelections?.map(id => students.find(st => st.id === id)?.name).join(', ') || '-'}</td>
                        <td>${s.negativeSelections?.map(id => students.find(st => st.id === id)?.name).join(', ') || '-'}</td>
                        <td>${s.leadershipSelections?.map(id => students.find(st => st.id === id)?.name).join(', ') || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    const numericalAnalysisSection = `
        <h3>B. SAYISAL ANALİZ SONUÇLARI</h3>
        <p><b>Sınıfın Yıldızları (En Çok Olumlu Seçilenler):</b> ${analysis.popular.map(p => `${p.student.name} (${p.pos} oy)`).join(', ') || 'Belirlenemedi'}</p>
        <p><b>Destek Gerekenler (En Çok Olumsuz Seçilenler):</b> ${analysis.rejected.map(r => `${r.student.name} (${r.neg} oy)`).join(', ') || 'Yok'}</p>
        <p><b>Yalnızlar (Hiç Seçim Yapmayan/Almayan):</b> ${analysis.isolated.map(s => s.name).join(', ') || 'Yok'}</p>
    `;
    
    let aiAnalysisSection = `<h3>C. YAPAY ZEKA ANALİZİ</h3>`;
    if (aiAnalysis) {
        aiAnalysisSection += `
            <h4>1. Sınıf Geneli Değerlendirmesi</h4>
            <p><b>Genel Özet:</b> ${aiAnalysis.classAnalysis.summary || 'Yorum yok.'}</p>
            <p><b>Liderler:</b></p>
            <ul>${aiAnalysis.classAnalysis.leaders.map(l => `<li><b>${l.student}:</b> ${l.reason}</li>`).join('')}</ul>
            <p><b>Gruplar (Klikler):</b></p>
            <ul>${aiAnalysis.classAnalysis.cliques.map(c => `<li><b>[${c.members.join(', ')}]:</b> ${c.description}</li>`).join('')}</ul>
             <p><b>Risk Grubundaki Öğrenciler:</b></p>
            <ul>${aiAnalysis.classAnalysis.risks.map(r => `<li><b>${r.student} (${r.reason}):</b> ${r.recommendation}</li>`).join('')}</ul>
             <p><b>Potansiyel Gerilimler:</b></p>
            <ul>${aiAnalysis.classAnalysis.tensions.map(t => `<li><b>${t.students.join(' ve ')}:</b> ${t.description}</li>`).join('')}</ul>
            <br/>
            <h4>2. Bireysel Öğrenci Değerlendirmeleri</h4>
            ${aiAnalysis.studentAnalyses.map(s => `
                <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                    <p><b>Öğrenci: ${s.studentName}</b></p>
                    <p><b>Genel Durum:</b> ${s.summary}</p>
                    <p><b>Güçlü Yönler:</b> ${s.strengths}</p>
                    <p><b>Riskler ve Zorluklar:</b> ${s.risksAndChallenges}</p>
                    <p><b>Tavsiye:</b> ${s.recommendation}</p>
                </div>
            `).join('')}
        `;
    } else {
        aiAnalysisSection += '<p>Yapay zeka analizi henüz yapılmadı.</p>';
    }


    const content = `
        ${header}
        ${studentTable}
        <br>
        ${numericalAnalysisSection}
        <br>
        ${aiAnalysisSection}
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- DETAILED GRADES EXPORT ---
interface ExportDetailedGradesArgs {
    students: Student[];
    currentClass: Class;
    teacherProfile: TeacherProfile;
    studentAverages: { studentId: string; term1Avg: number; term2Avg: number; }[];
    perfCriteria: Criterion[];
    projCriteria: Criterion[];
}

export function exportDetailedGradesToRtf({ students, currentClass, teacherProfile, studentAverages, perfCriteria, projCriteria }: ExportDetailedGradesArgs) {
    const reportTitle = "DETAYLI DÖNEM SONU NOT ÇİZELGESİ";
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - Detaylı Not Listesi`;

    const tableHeader = `
        <tr>
            <th rowspan="2">S.No</th>
            <th rowspan="2">Okul No</th>
            <th rowspan="2">Adı Soyadı</th>
            <th colspan="6">1. Dönem</th>
            <th colspan="6">2. Dönem</th>
        </tr>
        <tr>
            <th>1.S</th><th>2.S</th><th>1.P</th><th>2.P</th><th>Proje</th><th class="bold">Ort.</th>
            <th>1.S</th><th>2.S</th><th>1.P</th><th>2.P</th><th>Proje</th><th class="bold">Ort.</th>
        </tr>
    `;
    
    const calculateAverage = (grades: GradingScores | undefined, criteria: Criterion[]) => {
        if (!grades) return null;
        const totalMax = criteria.reduce((sum, c) => sum + c.max, 0);
        if (totalMax === 0) return 0;
        const totalScore = Object.values(grades).reduce((sum, score) => sum + (score as number || 0), 0);
        return (totalScore / totalMax) * 100;
    };
    
    const displayGrade = (grade: number | undefined | null) => (grade === -1 ? 'G' : (grade !== null && grade !== undefined) ? grade.toFixed(2) : '-');

    const dataRows = students.map((s, index) => {
        const term1 = s.term1Grades || {};
        const term2 = s.term2Grades || {};
        const averages = studentAverages.find(a => a.studentId === s.id);
        
        const perf1_1 = calculateAverageForCriteria(term1.scores1, perfCriteria);
        const perf1_2 = calculateAverageForCriteria(term1.scores2, perfCriteria);
        const proj1 = calculateAverageForCriteria(term1.projectScores, projCriteria);
        
        const perf2_1 = calculateAverageForCriteria(term2.scores1, perfCriteria);
        const perf2_2 = calculateAverageForCriteria(term2.scores2, perfCriteria);
        const proj2 = calculateAverageForCriteria(term2.projectScores, projCriteria);
        
        return `
            <tr>
                <td class="center">${index + 1}</td>
                <td class="center">${s.number}</td>
                <td>${s.name}</td>
                <td class="center">${displayGrade(term1.exam1)}</td>
                <td class="center">${displayGrade(term1.exam2)}</td>
                <td class="center">${displayGrade(perf1_1)}</td>
                <td class="center">${displayGrade(perf1_2)}</td>
                <td class="center">${s.hasProject ? displayGrade(proj1) : 'N/A'}</td>
                <td class="center bold">${averages?.term1Avg.toFixed(2)}</td>
                <td class="center">${displayGrade(term2.exam1)}</td>
                <td class="center">${displayGrade(term2.exam2)}</td>
                <td class="center">${displayGrade(perf2_1)}</td>
                <td class="center">${displayGrade(perf2_2)}</td>
                <td class="center">${s.hasProject ? displayGrade(proj2) : 'N/A'}</td>
                <td class="center bold">${averages?.term2Avg.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const content = `${header}<table><thead>${tableHeader}</thead><tbody>${dataRows}</tbody></table>${footer}`;
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- TIMETABLE EXPORT ---
interface ExportTimetableArgs {
    schedule: { [key: string]: TimetableCell };
    periods: { start: string; end: string }[];
    days: string[];
    teacherName: string;
    schoolName?: string;
    dutyDay?: string;
    dutyPlace?: string;
}

export function exportTimetableToRtf({ schedule, periods, days, teacherName, schoolName, dutyDay, dutyPlace }: ExportTimetableArgs) {
    const title = `Haftalık Ders Programı - ${teacherName}`;
    const filename = `Ders_Programi_${teacherName.replace(/ /g, '_')}.rtf`;
    
    const header = `
        <div class="center">
            <p class="header-p bold">${schoolName || ''}</p>
            <p class="header-p bold">${teacherName} - Haftalık Ders Programı</p>
            ${dutyDay || dutyPlace ? `<p class="header-p small-text">Nöbet Günü: ${dutyDay || ''} - Nöbet Yeri: ${dutyPlace || ''}</p>` : ''}
        </div>
        <br>
    `;

    let tableHeader = `
        <tr>
            <th style="width:10%;">Saatler</th>
            ${days.map(day => `<th>${day}</th>`).join('')}
        </tr>
    `;

    let tableRows = periods.map((period, pIndex) => {
        let row = `<tr><td class="center bold">${pIndex+1}. Ders<br/><span class="small-text">${period.start}-${period.end}</span></td>`;
        days.forEach((_, dIndex) => {
            const cellKey = `${dIndex}-${pIndex}`;
            const cellData = schedule[cellKey];
            if (cellData) {
                row += `<td class="center">${cellData.ders}<br/><span class="small-text">${cellData.sinif}</span></td>`;
            } else {
                row += `<td></td>`;
            }
        });
        row += `</tr>`;
        return row;
    }).join('');

    const content = `
        ${header}
        <table>
            <thead>${tableHeader}</thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;
    
    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
}

// --- SEATING PLAN EXPORT ---
interface ExportSeatingPlanArgs {
    seatingPlan: { [key: string]: Student };
    rowCount: number;
    colCount: number;
    currentClass: Class;
    teacherProfile?: TeacherProfile | null;
}
export function exportSeatingPlanToRtf({ seatingPlan, rowCount, colCount, currentClass, teacherProfile }: ExportSeatingPlanArgs) {
    const reportTitle = `${currentClass.name} SINIFI OTURMA PLANI`;
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - Oturma Planı`;

    let tableRows = '';
    for (let r = 0; r < rowCount; r++) {
        tableRows += '<tr>';
        for (let c = 0; c < colCount; c++) {
            const deskKey1 = `${r}-${c}-0`;
            const deskKey2 = `${r}-${c}-1`;
            const student1 = seatingPlan[deskKey1];
            const student2 = seatingPlan[deskKey2];
            tableRows += `
                <td class="word-export-desk-container">
                    <table class="word-export-desk">
                        <tr>
                            <td class="word-export-seat">${student1 ? student1.name : 'Boş'}</td>
                            <td class="word-export-seat">${student2 ? student2.name : 'Boş'}</td>
                        </tr>
                    </table>
                </td>
            `;
        }
        tableRows += '</tr>';
    }

    const content = `
        ${header}
        <div class="center" style="background-color: #333; color: white; padding: 8px; margin-bottom: 20px; font-weight: bold;">TAHTA</div>
        <table style="border-collapse: separate; border-spacing: 10px;">
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- ELECTION RESULTS EXPORT ---
interface ExportElectionResultsArgs {
    electionResult: {
        winner: Candidate | null;
        runnerUp: Candidate | null;
        allCandidates: Candidate[];
    };
    electionType: ElectionType;
    currentClass: Class;
    students: Student[];
    teacherProfile?: TeacherProfile | null;
}
export function exportElectionResultsToRtf({ electionResult, electionType, currentClass, students, teacherProfile }: ExportElectionResultsArgs) {
    const electionInfoMap = {
        class_president: {
            title: `SINIF BAŞKANI VE BAŞKAN YARDIMCISI SEÇİMİ SONUÇ TUTANAĞI`,
            winnerLabel: 'Sınıf Başkanı',
            runnerUpLabel: 'Sınıf Başkan Yardımcısı',
        },
        school_representative: {
            title: `OKUL MECLİSİ TEMSİLCİSİ SEÇİMİ SONUÇ TUTANAĞI`,
            winnerLabel: 'Sınıf Temsilcisi',
            runnerUpLabel: null,
        },
        honor_board: {
            title: `ONUR KURULU TEMSİLCİSİ SEÇİMİ SONUÇ TUTANAĞI`,
            winnerLabel: 'Onur Kurulu Temsilcisi',
            runnerUpLabel: null,
        }
    };

    const electionDetails = electionInfoMap[electionType];
    const reportTitle = electionDetails.title;
    const header = generateReportHeader(reportTitle, currentClass, teacherProfile);
    const footer = generateReportFooter(teacherProfile);
    const title = `${currentClass.name} - Seçim Sonuçları`;

    const winnerSection = electionResult.winner ? `
        <p><b>${electionDetails.winnerLabel}:</b> ${electionResult.winner.name} (${electionResult.winner.votes} oy)</p>
    ` : '';

    const runnerUpSection = electionResult.runnerUp && electionDetails.runnerUpLabel ? `
        <p><b>${electionDetails.runnerUpLabel}:</b> ${electionResult.runnerUp.name} (${electionResult.runnerUp.votes} oy)</p>
    ` : '';

    const resultsSummary = `
        <h3>SEÇİM SONUCU</h3>
        ${winnerSection}
        ${runnerUpSection}
        <br/>
        <p><b>Katılım Oranı:</b> ${electionResult.allCandidates.reduce((sum, c) => sum + c.votes, 0)} / ${students.length} öğrenci</p>
    `;

    const tableHeader = `
        <tr>
            <th>S.No</th>
            <th>Aday Öğrenci</th>
            <th>Aldığı Oy Sayısı</th>
        </tr>
    `;
    const dataRows = electionResult.allCandidates.map((c, index) => `
        <tr>
            <td class="center">${index + 1}</td>
            <td>${c.name}</td>
            <td class="center">${c.votes}</td>
        </tr>
    `).join('');

    const content = `
        ${header}
        ${resultsSummary}
        <br>
        <h3>DETAYLI OY DAĞILIMI</h3>
        <table>
            <thead>${tableHeader}</thead>
            <tbody>${dataRows}</tbody>
        </table>
        ${footer}
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, `${title.replace(/ /g, '_')}.rtf`);
}

// --- MATERIAL CREATOR EXPORT ---
interface ExportMaterialArgs {
    task: any;
    teacherProfile: TeacherProfile | null;
}
export function exportMaterialToRtf({ task, teacherProfile }: ExportMaterialArgs) {
    const title = task.title || "Öğretim Materyali";
    const filename = `${title.replace(/ /g, '_')}.doc`;
    const academicYear = teacherProfile?.reportConfig?.academicYear || '2025-2026';
    
    const content = `
        <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; padding: 1in;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 18pt;">${title.toLocaleUpperCase('tr-TR')}</h1>
                <p style="margin: 0; font-size: 11pt;">${academicYear} EĞİTİM-ÖĞRETİM YILI PERFORMANS GÖREVİ</p>
            </div>
            
            <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; border-radius: 5px;">
                <b>Adı Soyadı:</b> ..................................................
                <b style="margin-left: 30px;">Sınıf/No:</b> ..................................................
            </div>

            <div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #4a90e2; background-color: #f0f8ff;">
                <h3 style="margin-top: 0; font-size: 13pt; color: #3b82f6;">Hedeflenen Kazanım</h3>
                <p style="margin-bottom: 0; font-style: italic;">"${task.outcome}"</p>
            </div>

            <div>
                <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Görev Senaryosu</h2>
                <p style="text-align: justify;">
                    Sizden bir <b>${task.role}</b> olarak, ${task.scenario}
                </p>
            </div>
            
            <div style="margin-top: 25px;">
                <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Süreç Adımları ve Yönerge</h2>
                <ol style="padding-left: 20px;">
                    ${task.steps.map((step: string) => `<li style="margin-bottom: 10px;">${step}</li>`).join('')}
                </ol>
            </div>
            
            <div style="margin-top: 25px; page-break-before: always;">
                <h2 style="font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Değerlendirme Kriterleri</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;" border="1">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="padding: 8px; font-weight: bold; width: 70%;">Kriter</th>
                            <th style="padding: 8px; font-weight: bold; width: 15%;">Ağırlık</th>
                            <th style="padding: 8px; font-weight: bold; width: 15%;">Alınan Puan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${task.evaluation.map((criteria: string) => `
                            <tr>
                                <td style="padding: 8px;">${criteria.split('(%')[0]}</td>
                                <td style="padding: 8px; text-align: center;">%${criteria.split('(%')[1].replace(')', '')}</td>
                                <td style="padding: 8px;"></td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="2" style="padding: 8px; text-align: right; font-weight: bold;">TOPLAM PUAN</td>
                            <td style="padding: 8px;"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    `;

    const finalHtml = generateHtmlShell(content, title);
    downloadRtf(finalHtml, filename);
}
