'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Student, Class } from '@/lib/types';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface AttendanceTabProps {
  students: Student[];
  currentClass: Class | null;
  onStudentsChange: (students: Student[]) => void;
}


export function AttendanceTab({ students: initialStudents, onStudentsChange }: AttendanceTabProps) {
  const [students, setStudents] = useState(initialStudents.map(s => ({ ...s, present: null as boolean | null })));
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  useEffect(() => {
    // Reset state when initial students change (e.g. class switch)
    setStudents(initialStudents.map(s => ({...s, present: null})));
  }, [initialStudents]);

  const updateStudentStatus = (id: string, status: boolean | null) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: status } : s));
  };
  
  const handleMarkPresent = (id: string) => {
    const studentElement = document.getElementById(`student-${id}`);
    if (studentElement) {
        studentElement.classList.add('fade-out');
        setTimeout(() => {
            updateStudentStatus(id, true);
        }, 500);
    }
  };

  const handleMarkAbsent = (id: string) => {
    updateStudentStatus(id, false);
  };
  
  const handleMarkPresentFromAbsent = (id: string) => {
    updateStudentStatus(id, true);
  };


  const resetAttendance = () => {
    if (confirm('Tüm yoklama verilerini sıfırlamak istediğinizden emin misiniz?')) {
        setStudents(prev => prev.map(s => ({...s, present: null})));
    }
  };

  const stats = useMemo(() => {
    const presentCount = students.filter(s => s.present === true).length;
    const absentCount = students.filter(s => s.present === false).length;
    const remainingCount = students.filter(s => s.present === null).length;
    return { presentCount, absentCount, remainingCount };
  }, [students]);
  
  const absentStudents = useMemo(() => students.filter(s => s.present === false), [students]);
  const remainingStudents = useMemo(() => students.filter(s => s.present === null), [students]);

  const printSummary = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(`
          <html>
              <head>
                  <title>Yoklama Özeti</title>
                   <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 30px; 
                            background: #fff;
                            color: #000;
                        }
                        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;}
                        .summary { background: #f5f5f5; padding: 25px; border-radius: 15px; margin: 25px 0; border: 1px solid #ddd;}
                        table { width: 100%; border-collapse: collapse; margin: 25px 0; }
                        th, td { border: 1px solid #ccc; padding: 15px; text-align: left; }
                        th { background: #eee; color: #000; font-weight: bold;}
                        .absent { color: #cc0000; font-weight: bold; }
                        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0;}
                        .stat-item { padding: 20px; text-align: center; border-radius: 10px; font-weight: bold;}
                    </style>
              </head>
              <body>
                  <div class="header">
                      <h1 style="font-size: 2.5em;">YOKLAMA ÖZETİ</h1>
                      <p style="font-size: 1.2em;">Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
                  </div>
                  
                  <div class="stats">
                      <div class="stat-item" style="background: #e0ffe0; color: #006400;">
                          <div style="font-size: 2em;">${stats.presentCount}</div>
                          <div>GELEN ÖĞRENCİ</div>
                      </div>
                      <div class="stat-item" style="background: #ffe0e0; color: #cc0000;">
                          <div style="font-size: 2em;">${stats.absentCount}</div>
                          <div>GELMEYEN ÖĞRENCİ</div>
                      </div>
                      <div class="stat-item" style="background: #fff0e0; color: #cc6600;">
                          <div style="font-size: 2em;">${stats.remainingCount}</div>
                          <div>BEKLEYEN ÖĞRENCİ</div>
                      </div>
                  </div>

                  <div class="summary">
                      <h3>Genel Özet</h3>
                      <p>Toplam Öğrenci: <strong>${students.length}</strong></p>
                  </div>

                  ${absentStudents.length > 0 ? `
                  <h3>Gelmeyen Öğrenci Listesi</h3>
                  <table>
                      <thead><tr><th>Öğrenci No</th><th>Ad Soyad</th><th>Durum</th></tr></thead>
                      <tbody>
                          ${absentStudents.map(student => `
                              <tr>
                                  <td>${student.number}</td>
                                  <td>${student.name}</td>
                                  <td class="absent">❌ GELMEDİ</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
                  ` : ''}
                  
                  <script>window.onload = function() { window.print(); }<\/script>
              </body>
          </html>
      `);
      printWindow.document.close();
  };

  return (
    <>
      <style>{`
        .student-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 15px;
            padding: 10px;
        }
        .student-item {
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
            border: 2px solid #333;
            border-radius: 12px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            animation: slideIn 0.5s ease;
        }
         @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
        }
        .student-item:hover {
            border-color: #00ff88;
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
        .student-name { font-size: 1.3em; font-weight: 600; color: #fff; margin-bottom: 5px; }
        .student-id { color: #888; font-size: 0.9em; }
        .attendance-actions { display: flex; gap: 10px; }
        .attendance-actions button {
            padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer;
            font-size: 14px; font-weight: 600; transition: all 0.3s ease; min-width: 100px;
        }
        .present-btn { background: linear-gradient(135deg, #00ff88, #00cc6a); color: #000; }
        .present-btn:hover { background: linear-gradient(135deg, #00cc6a, #00aa55); transform: scale(1.05); }
        .absent-btn { background: linear-gradient(135deg, #ff4444, #cc0000); color: white; }
        .absent-btn:hover { background: linear-gradient(135deg, #cc0000, #aa0000); transform: scale(1.05); }
        .fade-out { animation: fadeOut 0.5s ease forwards; }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100px); }
        }
      `}</style>

      <div className="container" style={{ background: '#000', minHeight: '100vh', color: '#fff' }}>
        <div className="header" style={{ background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', padding: '25px', textAlign: 'center', borderBottom: '3px solid #333' }}>
            <h1 style={{ fontSize: '2.8em', marginBottom: '10px', color: '#00ff88', textShadow: '0 0 10px rgba(0, 255, 136, 0.5)' }}>🎓 YOKLAMA SİSTEMİ</h1>
            <p style={{ fontSize: '1.2em', color: '#ccc' }}>Gelen öğrencileri listeden çıkarın, sadece gelmeyenler kalsın</p>
        </div>

        <div className="controls" style={{ padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #333', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button className="primary-btn" onClick={() => setShowStatsModal(true)}>📊 İstatistikleri Göster</Button>
            <Button className="secondary-btn" onClick={() => setShowAbsentModal(true)}>❌ Sadece Gelmediklerim</Button>
            <Button className="success-btn" style={{background: 'linear-gradient(135deg, #ffaa00, #ff8800)', color: '#000'}} onClick={resetAttendance}>🔄 Yoklamayı Sıfırla</Button>
            <Button className="primary-btn" onClick={printSummary}>🖨️ Özeti Yazdır</Button>
        </div>

        <div className="stats-container" style={{ background: '#1a1a1a', padding: '20px', margin: '20px', borderRadius: '12px', border: '2px solid #333' }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className="stat-card stat-present" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #00ff88', color: '#00ff88' }}>
                    <div className="stat-number" style={{ fontSize: '2.5em', fontWeight: 700, marginBottom: '10px' }}>{stats.presentCount}</div>
                    <div>GELEN ÖĞRENCİ</div>
                </div>
                 <div className="stat-card stat-absent" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #ff4444', color: '#ff4444' }}>
                    <div className="stat-number" style={{ fontSize: '2.5em', fontWeight: 700, marginBottom: '10px' }}>{stats.absentCount}</div>
                    <div>GELMEYEN ÖĞRENCİ</div>
                </div>
                 <div className="stat-card stat-remaining" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #ffaa00', color: '#ffaa00' }}>
                    <div className="stat-number" style={{ fontSize: '2.5em', fontWeight: 700, marginBottom: '10px' }}>{stats.remainingCount}</div>
                    <div>BEKLEYEN ÖĞRENCİ</div>
                </div>
            </div>
        </div>

        <div className="student-list-container">
            <div className="student-list">
                {remainingStudents.length > 0 ? remainingStudents.map(student => (
                    <div key={student.id} className="student-item" id={`student-${student.id}`}>
                        <div className="student-info">
                            <div className="student-name">{student.name}</div>
                            <div className="student-id">Öğrenci No: {student.number}</div>
                        </div>
                        <div className="attendance-actions">
                            <button className="present-btn" onClick={() => handleMarkPresent(student.id)}>
                                ✅ GELDİ
                            </button>
                            <button className="absent-btn" onClick={() => handleMarkAbsent(student.id)}>
                                ❌ GELMEDİ
                            </button>
                        </div>
                    </div>
                )) : (
                     <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#00ff88', fontSize: '1.5em'}}>
                        🎉 Tüm öğrencilerin yoklaması tamamlandı!
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <AlertDialog open={showStatsModal} onOpenChange={setShowStatsModal}>
         <AlertDialogContent style={{background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', border: '3px solid #00ff88', color: 'white'}}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{color: '#00ff88', textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'}}>📊 YOKLAMA İSTATİSTİKLERİ</AlertDialogTitle>
            </AlertDialogHeader>
             <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                 <div className="stat-card stat-present" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #00ff88', color: '#00ff88' }}>
                    <div className="stat-number">{stats.presentCount}</div>
                    <div>GELEN</div>
                </div>
                 <div className="stat-card stat-absent" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #ff4444', color: '#ff4444' }}>
                    <div className="stat-number">{stats.absentCount}</div>
                    <div>GELMEYEN</div>
                </div>
                 <div className="stat-card stat-remaining" style={{ background: 'linear-gradient(135deg, #2d2d2d, #3d3d3d)', padding: '25px', borderRadius: '10px', textAlign: 'center', border: '2px solid #ffaa00', color: '#ffaa00' }}>
                    <div className="stat-number">{stats.remainingCount}</div>
                    <div>BEKLEYEN</div>
                </div>
            </div>
            <AlertDialogFooter>
                <Button className="close-btn" style={{background: '#ff4444', color: 'white'}} onClick={() => setShowStatsModal(false)}>Kapat</Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={showAbsentModal} onOpenChange={setShowAbsentModal}>
         <AlertDialogContent style={{background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)', border: '3px solid #ff4444', color: 'white'}}>
            <AlertDialogHeader>
              <AlertDialogTitle style={{color: '#ff4444'}}>❌ GELMEYEN ÖĞRENCİLER</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="absent-students-list" style={{maxHeight: '400px', overflowY: 'auto', margin: '20px 0'}}>
                {absentStudents.length > 0 ? absentStudents.map(student => (
                     <div key={student.id} className="absent-student-item" style={{background: '#2d2d2d', padding: '15px', margin: '10px 0', borderRadius: '8px', borderLeft: '4px solid #ff4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div className="student-info">
                            <div className="student-name">{student.name}</div>
                            <div className="student-id">Öğrenci No: {student.number}</div>
                        </div>
                        <button className="present-btn" onClick={() => handleMarkPresentFromAbsent(student.id)}>
                            ✅ GELDİ YAP
                        </button>
                    </div>
                )) : <div style={{ textAlign: 'center', padding: '30px', color: '#00ff88', fontSize: '1.2em' }}>🎉 Tüm öğrenciler geldi!</div>}
            </div>
            <AlertDialogFooter>
                 <Button className="close-btn" style={{background: '#ff4444', color: 'white'}} onClick={() => setShowAbsentModal(false)}>Kapat</Button>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>

    </>
  );
}
