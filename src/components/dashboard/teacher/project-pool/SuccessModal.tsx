'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';

export const SuccessModal = ({ isOpen, onClose, project, details }: any) => {
    if (!isOpen || !project) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Proje Atandı!</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl w-full mb-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{project.grade}. Sınıf • {project.subject === 'physics' ? 'Fizik' : 'Edebiyat'}</p>
              
              {details && (
                <div className="text-xs font-medium text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                  <p><b>Atanan Kişi/Grup:</b> {details.assignedTo}</p>
                  <p><b>Teslim Tarihi:</b> {details.date}</p>
                </div>
              )}
            </div>
            
            <p className="text-gray-500 text-sm mb-6">
              Proje başarıyla ilgili öğrenci(ler)in paneline gönderildi.
            </p>
  
            <button 
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    );
};
