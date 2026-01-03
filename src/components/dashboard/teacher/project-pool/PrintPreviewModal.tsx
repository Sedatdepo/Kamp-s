'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

export const PrintPreviewModal = ({ isOpen, onClose, project }: any) => {
    if (!isOpen || !project) return null;
  
    const handlePrint = () => {
      window.print();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
        <style>
          {`
            @media print {
              body > *:not(.print-modal-container) {
                display: none !important;
              }
              .print-modal-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: white;
                z-index: 9999;
                display: block !important;
              }
              .print-hidden {
                display: none !important;
              }
              .print-page {
                padding: 40px !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}
        </style>
        
        <div className="print-modal-container bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col print:h-auto print:shadow-none print:w-full">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center print-hidden rounded-t-xl">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Printer size={18} className="text-blue-600" />
              Proje Çıktısı Önizleme
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer size={16} /> Yazdır
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20} /></button>
            </div>
          </div>
  
          <div className="p-8 overflow-y-auto flex-grow bg-gray-100 print:bg-white print:p-0 print-page">
            <div className="bg-white max-w-2xl mx-auto p-12 shadow-sm min-h-full border border-gray-200 print:border-0 print:shadow-none print:max-w-full">
              
              <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold text-black mb-1">PERFORMANS PROJESİ</h1>
                  <p className="text-sm text-gray-600">Eğitim - Öğretim Yılı: 2025-2026</p>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-black uppercase">${project.subject === 'physics' ? 'FİZİK' : 'TÜRK DİLİ VE EDEBİYATI'}</span>
                  <span className="block text-sm text-gray-600">${project.grade}. Sınıf</span>
                </div>
              </div>
  
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 p-4 border border-gray-300 rounded bg-gray-50 print:bg-white">
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
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
                    Proje Konusu
                  </h3>
                  <div className="p-4 border-l-4 border-gray-300 bg-gray-50 print:bg-white text-gray-800">
                    <h4 className="font-bold mb-1">${project.title}</h4>
                    <p className="text-sm">${project.description}</p>
                  </div>
                </div>
  
                <div>
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
                    Yönerge
                  </h3>
                  <div className="text-sm text-gray-700 leading-relaxed text-justify">
                    ${project.instructions}
                  </div>
                </div>
  
                <div>
                  <h3 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
                    <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-xs">3</span>
                    Teslim Formatı
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                    <li>Bu proje <strong>${project.formats}</strong> formatında hazırlanmalıdır.</li>
                    <li>Dijital dosya boyutu <strong>${project.size}</strong>'ı geçmemelidir.</li>
                  </ul>
                </div>
              </div>
  
              <div className="mt-16 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                <p>Bu belge E-Proje Yönetim Sistemi üzerinden oluşturulmuştur.</p>
              </div>
  
            </div>
          </div>
        </div>
      </div>
    );
};
