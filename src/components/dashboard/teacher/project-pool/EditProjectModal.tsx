'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Save, X } from 'lucide-react';

export const EditProjectModal = ({ isOpen, onClose, project, onSave }: any) => {
    const [formData, setFormData] = useState({ title: '', description: '', instructions: '' });
  
    useEffect(() => {
      if (project) {
        setFormData({
          title: project.title,
          description: project.description,
          instructions: project.instructions
        });
      }
    }, [project]);
  
    if (!isOpen || !project) return null;
  
    const handleSave = () => {
      onSave(formData);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Edit size={18} className="text-blue-600" />
              Proje Konusunu Düzenle
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Proje Konusu</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
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