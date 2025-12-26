import { Student, InfoForm, TeacherProfile } from './types';
import { format } from 'date-fns';

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
