'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, Trash2, X } from 'lucide-react';

export const AddRubricModal = ({ isOpen, onClose, onSave }: any) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([{ label: '', score: '', desc: '' }]);
  
    if (!isOpen) return null;
  
    const handleAddItem = () => {
      setItems([...items, { label: '', score: '', desc: '' }]);
    };
  
    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    };
  
    const handleItemChange = (index: number, field: string, value: string) => {
      const newItems: any = [...items];
      newItems[index][field] = value;
      setItems(newItems);
    };
  
    const totalScore = items.reduce((sum, item) => sum + (parseInt(item.score) || 0), 0);
  
    const handleSave = () => {
      if (!title || !description) return alert("Lütfen başlık ve açıklama giriniz.");
      if (items.some(i => !i.label || !i.score)) return alert("Lütfen tüm kriter alanlarını doldurunuz.");
      
      onSave({ title, description, items });
      onClose();
      setTitle('');
      setDescription('');
      setItems([{ label: '', score: '', desc: '' }]);
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Yeni Değerlendirme Kriteri Ekle</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
          </div>
  
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kriter Başlığı</label>
              <input 
                type="text" 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Örn: Proje Değerlendirme Ölçeği"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
              <textarea 
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Bu kriter seti hangi tür projelerde kullanılacak?"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
  
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Değerlendirme Maddeleri</label>
                <div className={`text-sm font-bold ${totalScore === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                  Toplam Puan: {totalScore} / 100
                </div>
              </div>
              
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2 items-start bg-gray-50 p-3 rounded-lg">
                  <div className="flex-grow space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Madde Adı (Örn: Sunum)" 
                        className="flex-grow border rounded p-1 text-sm"
                        value={item.label}
                        onChange={e => handleItemChange(index, 'label', e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Puan" 
                        className="w-16 border rounded p-1 text-sm text-center"
                        value={item.score}
                        onChange={e => handleItemChange(index, 'score', e.target.value)}
                      />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Açıklama (Örn: Ses tonu ve hakimiyet)" 
                      className="w-full border rounded p-1 text-xs text-gray-600"
                      value={item.desc}
                      onChange={e => handleItemChange(index, 'desc', e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
  
              <button 
                onClick={handleAddItem}
                className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Yeni Madde Ekle
              </button>
            </div>
          </div>
  
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">İptal</button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
            >
              <Save size={16} /> Kaydet
            </button>
          </div>
        </div>
      </div>
    );
};