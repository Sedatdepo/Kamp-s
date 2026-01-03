'use client';

import React from 'react';
import { Atom, BookOpen, ClipboardList, FileText, Heart, Mic, Paperclip, Pencil, Printer, Send, Video } from 'lucide-react';

export const ProjectCard = ({ item, onAssign, onShowRubric, onEdit, isFavorite, onToggleFavorite, onPrint }: any) => {
    const isPhysics = item.subject === 'physics';
    
    const getFormatIcon = () => {
        if (item.formats.includes('Video')) return <Video size={14} />;
        if (item.formats.includes('Ses')) return <Mic size={14} />;
        return <FileText size={14} />;
    };
  
    return (
      <div className={`group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full ${isPhysics ? 'hover:border-cyan-400' : 'hover:border-rose-400'}`}>
        <div className={`h-1.5 w-full ${isPhysics ? 'bg-cyan-600' : 'bg-rose-600'}`}></div>
  
        <div className="p-5 flex-grow flex flex-col relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button 
              onClick={() => onPrint(item)}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="Projeyi Yazdır"
            >
              <Printer size={16} />
            </button>
            <button 
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:bg-gray-50 hover:text-gray-500'}`}
              title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
            >
              <Heart size={16} className={isFavorite ? "fill-current" : ""} />
            </button>
            <button 
              onClick={() => onEdit(item)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Projeyi Düzenle"
            >
              <Pencil size={16} />
            </button>
          </div>
  
          <div className="flex justify-between items-start mb-3 pr-24">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              isPhysics ? 'bg-cyan-50 text-cyan-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {isPhysics ? <Atom size={12} /> : <BookOpen size={12} />}
              {isPhysics ? 'Fizik' : 'Edebiyat'}
            </div>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
              {item.grade}. Sınıf
            </span>
          </div>
  
          <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors pr-6">
            {item.title}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            {item.description}
          </p>
  
          <div className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r-md mb-4 text-xs text-gray-600 italic relative">
             <span className="font-semibold block not-italic mb-1 text-gray-700">Öğrenci Yönergesi:</span>
             "{item.instructions}"
          </div>
  
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5" title="Kabul Edilen Formatlar">
              {getFormatIcon()}
              {item.formats}
            </div>
            <div className="flex items-center gap-1.5" title="Maksimum Dosya Boyutu">
              <Paperclip size={14} />
              Max: {item.size}
            </div>
          </div>
        </div>
  
        <div className="p-4 pt-0 grid grid-cols-2 gap-3">
          <button
            onClick={() => onShowRubric(item)}
            className="py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all text-xs"
          >
            <ClipboardList size={14} />
            Kriterler
          </button>
          <button 
            onClick={() => onAssign(item)}
            className={`py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all active:scale-95 ${
              isPhysics 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-200' 
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
            } shadow-sm hover:shadow-md text-xs`}
          >
            <Send size={14} />
            Sınıfa Ata
          </button>
        </div>
      </div>
    );
};
