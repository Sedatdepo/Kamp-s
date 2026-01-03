'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Calendar, Users, Clock, CheckCircle, Send, X } from 'lucide-react';
import { Student, Class } from '@/lib/types';


export const AssignProjectModal = ({ isOpen, onClose, project, onConfirm, classes, students }: any) => {
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
  
    useEffect(() => {
      if (project) {
        if (classes && classes.length > 0) {
            setSelectedClassIds([classes[0].id]);
        }
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 30); // Projects usually have longer deadlines
        setDueDate(nextWeek.toISOString().split('T')[0]);
      }
    }, [project, classes]);

    const studentsInSelectedClasses = useMemo(() => {
        return students.filter((s: Student) => selectedClassIds.includes(s.classId));
    }, [students, selectedClassIds]);

    const handleClassToggle = (classId: string) => {
        setSelectedClassIds(prev => 
            prev.includes(classId) 
                ? prev.filter(id => id !== classId) 
                : [...prev, classId]
        );
        setSelectedStudentIds([]);
    };
    
    const handleStudentToggle = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAllInClass = (classId: string) => {
        const studentIdsInClass = students.filter((s: Student) => s.classId === classId).map((s: Student) => s.id);
        const areAllSelected = studentIdsInClass.every((id: string) => selectedStudentIds.includes(id));
        
        if (areAllSelected) {
            setSelectedStudentIds(prev => prev.filter(id => !studentIdsInClass.includes(id)));
        } else {
            setSelectedStudentIds(prev => [...new Set([...prev, ...studentIdsInClass])]);
        }
    };
  
    if (!isOpen || !project) return null;
  
    const handleConfirm = () => {
      if(selectedStudentIds.length === 0){
          alert("Lütfen en az bir öğrenci seçin.");
          return;
      }
      onConfirm({ studentIds: selectedStudentIds, date: dueDate });
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Send size={18} className="text-blue-600" />
              Proje Atama Ayarları
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-5">
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 mb-2">
              <span className="font-bold">{project.title}</span> projesi için atama yapıyorsunuz.
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} /> 1. Sınıf/Sınıfları Seçin
                </label>
                 <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg border">
                    {(classes || []).map((cls: Class) => (
                        <div key={cls.id} className="flex items-center gap-2 p-2 bg-white rounded-md">
                            <Checkbox 
                                id={`class-${cls.id}`} 
                                checked={selectedClassIds.includes(cls.id)}
                                onCheckedChange={() => handleClassToggle(cls.id)}
                            />
                            <label htmlFor={`class-${cls.id}`} className="text-sm font-medium cursor-pointer">{cls.name}</label>
                        </div>
                    ))}
                 </div>
            </div>

            <div className="min-h-[200px]">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Users size={16} /> 2. Öğrencileri Seçin
                </label>
                <ScrollArea className="h-64 border rounded-lg p-2 bg-gray-50">
                {selectedClassIds.length > 0 ? (
                    (classes || []).filter(c => selectedClassIds.includes(c.id)).map(cls => {
                         const studentsInThisClass = students.filter((s: Student) => s.classId === cls.id);
                         const areAllInClassSelected = studentsInThisClass.every((s: Student) => selectedStudentIds.includes(s.id));
                         return (
                            <div key={cls.id} className="mb-4">
                                <div className="flex items-center gap-2 p-2 bg-gray-200 rounded-t-md">
                                    <Checkbox
                                        id={`select-all-${cls.id}`}
                                        checked={areAllInClassSelected}
                                        onCheckedChange={() => handleSelectAllInClass(cls.id)}
                                    />
                                    <label htmlFor={`select-all-${cls.id}`} className="font-bold text-sm cursor-pointer">{cls.name} (Tümünü Seç)</label>
                                </div>
                                <div className="grid grid-cols-2 gap-2 p-2">
                                {studentsInThisClass.map((student: Student) => (
                                    <div key={student.id} className="flex items-center gap-2 p-1.5 rounded bg-white">
                                        <Checkbox
                                            id={`student-${student.id}`}
                                            checked={selectedStudentIds.includes(student.id)}
                                            onCheckedChange={() => handleStudentToggle(student.id)}
                                        />
                                        <label htmlFor={`student-${student.id}`} className="text-sm cursor-pointer">{student.name} ({student.number})</label>
                                    </div>
                                ))}
                                </div>
                            </div>
                         )
                    })
                ) : (
                    <div className="text-center text-sm text-muted-foreground pt-10">Lütfen önce sınıf seçin.</div>
                )}
                </ScrollArea>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                <Clock size={16} /> 3. Son Teslim Tarihi
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center rounded-b-2xl">
            <div className="text-sm font-semibold">{selectedStudentIds.length} öğrenci seçildi.</div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
              <button 
                onClick={handleConfirm}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
              >
                <CheckCircle size={16} /> Atamayı Tamamla
              </button>
            </div>
          </div>
        </div>
      </div>
    );
};
