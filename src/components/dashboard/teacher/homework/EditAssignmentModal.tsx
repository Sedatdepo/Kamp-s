'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Question } from '@/lib/types';


export const EditAssignmentModal = ({ isOpen, onClose, assignment, onSave }: any) => {
    const [formData, setFormData] = useState({ title: '', description: '', instructions: '', questions: [] as Question[] });
  
    useEffect(() => {
      if (assignment) {
        setFormData({
          title: assignment.title || '',
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          questions: assignment.questions || []
        });
      }
    }, [assignment]);
  
    if (!isOpen || !assignment) return null;
  
    const handleSave = () => {
      onSave(formData);
      onClose();
    };

    const addQuestion = () => {
      const newQ: Question = { id: `q_${Date.now()}`, type: 'choice', text: '', options: [''], required: false };
      setFormData(prev => ({...prev, questions: [...prev.questions, newQ]}));
    };
  
    const deleteQuestion = (id: string | number) => {
      setFormData(prev => ({...prev, questions: prev.questions.filter(q => q.id !== id)}));
    };
  
    const updateQuestion = (id: string | number, field: keyof Question, value: any) => {
      setFormData(prev => ({...prev, questions: prev.questions.map(q => q.id === id ? { ...q, [field]: value } : q)}));
    };
  
    const addOption = (qId: string | number) => {
      setFormData(prev => ({...prev, questions: prev.questions.map(q => {
        if (q.id === qId) return { ...q, options: [...(q.options || []), ''] };
        return q;
      })}));
    };
  
    const updateOption = (qId: string | number, opIndex: number, val: string) => {
       setFormData(prev => ({...prev, questions: prev.questions.map(q => {
        if (q.id === qId) {
          const newOps = [...(q.options || [])];
          newOps[opIndex] = val;
          return { ...q, options: newOps };
        }
        return q;
      })}));
    };
  
    const removeOption = (qId: string | number, opIndex: number) => {
       setFormData(prev => ({...prev, questions: prev.questions.map(q => {
        if (q.id === qId) return { ...q, options: q.options?.filter((_, i) => i !== opIndex) };
        return q;
      })}));
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Edit size={18} className="text-blue-600" />
              Ödevi Düzenle
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Ödev Başlığı</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kısa Açıklama</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 text-sm"
                rows={2}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Kart üzerinde görünecek özet bilgi.</p>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Yönergesi</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-gray-50 font-medium"
                rows={4}
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">Öğrencinin ne yapması gerektiğini detaylıca anlatın.</p>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-md font-bold text-gray-800 mb-2">Sorular</h3>
              <div className="space-y-4">
                {formData.questions.map(q => (
                  <div key={q.id} className="p-4 border rounded-lg bg-gray-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)} className="border-gray-300 rounded text-sm">
                        <option value="choice">Çoktan Seçmeli</option>
                        <option value="open">Açık Uçlu</option>
                      </select>
                      <button onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500"/></button>
                    </div>
                    <textarea value={q.text} onChange={e => updateQuestion(q.id, 'text', e.target.value)} className="w-full border p-2 rounded" placeholder="Soru metni..."/>
                    {q.type === 'choice' && (
                      <div className="space-y-2 pl-4">
                        {(q.options || []).map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input type="text" value={opt} onChange={e => updateOption(q.id, i, e.target.value)} className="flex-grow p-1 border-b" placeholder={`Seçenek ${i + 1}`}/>
                            <button onClick={() => removeOption(q.id, i)}><X className="h-4 w-4 text-gray-400"/></button>
                          </div>
                        ))}
                        <button onClick={() => addOption(q.id)} className="text-xs text-blue-600">Seçenek Ekle</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={addQuestion} variant="outline" className="mt-4 w-full border-dashed"><Plus className="mr-2"/>Soru Ekle</Button>
            </div>

          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <Save size={16} /> Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    );
};
