'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save, X } from 'lucide-react';

export const CreateProjectModal = ({ isOpen, onClose, onSave }: any) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      instructions: '',
      grade: '9',
      subject: 'physics',
      formats: 'PDF, Word',
      size: '10 MB'
    });
  
    if (!isOpen) return null;
  
    const handleSave = () => {
      if (!formData.title || !formData.description) return alert("Başlık ve açıklama zorunludur.");
      onSave(formData);
      onClose();
      // Reset form defaults
      setFormData({
          title: '',
          description: '',
          instructions: '',
          grade: '9',
          subject: 'physics',
          formats: 'PDF, Word',
          size: '10 MB'
      });
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <PlusCircle size={20} className="text-green-600" />
              Yeni Proje Konusu Oluştur
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf Seviyesi</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                >
                  <option value="9">9. Sınıf</option>
                  <option value="10">10. Sınıf</option>
                  <option value="11">11. Sınıf</option>
                  <option value="12">12. Sınıf</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ders</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                >
                  <option value="physics">Fizik</option>
                  <option value="literature">Türk Dili ve Edebiyatı</option>
                </select>
              </div>
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Proje Konusu</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Örn: Serbest Düşme Hareketi Analizi"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Kısa Açıklama</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none"
                rows={2}
                placeholder="Projenin amacı ve kapsamı hakkında kısa bilgi..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
  
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Öğrenci Yönergesi</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                rows={3}
                placeholder="Öğrenci bu projeyi yaparken hangi adımları izlemeli?"
                value={formData.instructions}
                onChange={e => setFormData({...formData, instructions: e.target.value})}
              />
            </div>
  
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Kabul Edilen Formatlar</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                   placeholder="Örn: Rapor, Sunum, Video"
                   value={formData.formats}
                   onChange={e => setFormData({...formData, formats: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1">Maks. Dosya Boyutu</label>
                 <input 
                   type="text" 
                   className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                   placeholder="Örn: 50 MB"
                   value={formData.size}
                   onChange={e => setFormData({...formData, size: e.target.value})}
                 />
               </div>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 font-medium shadow-sm"
            >
              <Save size={16} /> Projeyi Oluştur
            </button>
          </div>
        </div>
      </div>
    );
};
