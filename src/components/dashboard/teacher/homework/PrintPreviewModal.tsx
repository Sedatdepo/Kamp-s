'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Plus, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getRubricType } from '@/lib/maarif-modeli-odevleri';
import { exportPrintableHomeworkToRtf } from '@/lib/word-export';


export const PrintPreviewModal = ({ isOpen, onClose, assignment, rubrics, teacherProfile }: any) => {
    const [editableAssignment, setEditableAssignment] = useState(assignment);
    const [editableRubric, setEditableRubric] = useState<any>(null);

    useEffect(() => {
        if (assignment && rubrics) {
            setEditableAssignment(JSON.parse(JSON.stringify(assignment)));
            const rubricType = getRubricType(assignment.formats);
            const initialRubric = rubrics[rubricType] || rubrics['research'];
            setEditableRubric(JSON.parse(JSON.stringify(initialRubric)));
        }
    }, [assignment, rubrics]);

    if (!isOpen || !assignment || !editableRubric) return null;

    const handleAssignmentChange = (field: string, value: string) => {
        setEditableAssignment((prev: any) => ({ ...prev, [field]: value }));
    };
    
    const handleRubricItemChange = (index: number, field: string, value: string | number) => {
        const newItems = [...editableRubric.items];
        const updatedItem = { ...newItems[index], [field]: value };
        newItems[index] = updatedItem;
        setEditableRubric({ ...editableRubric, items: newItems });
    };
    
    const handleAddRubricItem = () => {
        const newItems = [...editableRubric.items, { label: '', desc: '', score: '' }];
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleRemoveRubricItem = (index: number) => {
        const newItems = editableRubric.items.filter((_: any, i: number) => i !== index);
        setEditableRubric({ ...editableRubric, items: newItems });
    };

    const handleExport = () => {
        exportPrintableHomeworkToRtf({
            assignment: editableAssignment,
            rubric: editableRubric,
            teacherProfile: teacherProfile
        });
    };

    const totalScore = editableRubric.items.reduce((sum: number, item: any) => sum + parseInt(item.score || '0', 10), 0);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">Ödev Çıktısını Düzenle ve İndir</h2>
            <div className="flex gap-2">
              <Button onClick={handleExport}>
                <FileDown size={16} className="mr-2" /> RTF Olarak İndir
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
            </div>
          </div>
          <div className="p-8 overflow-y-auto flex-grow bg-gray-100">
            <div className="bg-white max-w-3xl mx-auto p-12 shadow-sm min-h-full border border-gray-200">
              <div className="text-center mb-10">
                <Input className="text-2xl font-bold text-black mb-1 text-center border-0 shadow-none focus-visible:ring-0 p-1 h-auto" value={editableAssignment.title} onChange={e => handleAssignmentChange('title', e.target.value)} />
                <p className="text-sm text-gray-600">{teacherProfile?.reportConfig?.academicYear || '2025-2026'} Eğitim Öğretim Yılı</p>
              </div>
               <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-4 border border-gray-300 rounded bg-gray-50">
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Adı Soyadı:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Sınıfı / No:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Teslim Tarihi:</span>
                </div>
                <div className="border-b border-dashed border-gray-400 pb-1">
                  <span className="font-bold text-sm">Aldığı Not:</span>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-black mb-2">Yönerge</h3>
                  <Textarea className="text-sm text-gray-700 leading-relaxed" value={editableAssignment.instructions} onChange={e => handleAssignmentChange('instructions', e.target.value)} rows={4} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black mb-2">Değerlendirme Kriterleri (Toplam: {totalScore} Puan)</h3>
                  <div className="space-y-2">
                    {editableRubric.items.map((item: any, index: number) => (
                      <div key={index} className="flex gap-2 items-start p-2 border rounded-md">
                        <div className="flex-grow space-y-1">
                          <Input placeholder="Kriter Adı" value={item.label} onChange={e => handleRubricItemChange(index, 'label', e.target.value)} className="font-semibold text-sm"/>
                          <Input placeholder="Açıklama" value={item.desc} onChange={e => handleRubricItemChange(index, 'desc', e.target.value)} className="text-xs"/>
                        </div>
                        <Input type="number" placeholder="Puan" value={item.score} onChange={e => handleRubricItemChange(index, 'score', e.target.value)} className="w-20 text-center"/>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveRubricItem(index)}><Trash2 className="h-4 w-4 text-red-400"/></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={handleAddRubricItem}><Plus className="mr-2 h-4 w-4"/> Kriter Ekle</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
