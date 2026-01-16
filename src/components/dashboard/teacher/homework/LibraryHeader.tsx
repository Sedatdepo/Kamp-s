'use client';

import React, { useState } from 'react';
import { Plus, GraduationCap, Heart, Bell, X, PlusCircle } from 'lucide-react';
import { CheckCircle } from 'lucide-react';

export const LibraryHeader = ({ onOpenAddRubric, onOpenCreateProject, history, toggleFavoritesOnly, showFavoritesOnly }: any) => {
    const [showHistory, setShowHistory] = useState(false);
  
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-10 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">E-Ödev Yönetim Paneli</h1>
            <p className="text-sm text-gray-500">Hoş Geldiniz, Öğretmenim</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end relative">
          <button 
            onClick={toggleFavoritesOnly}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors border ${showFavoritesOnly ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            <Heart size={16} className={showFavoritesOnly ? "fill-current" : ""} />
            Favorilerim
          </button>
  
          <button 
            onClick={onOpenCreateProject}
            className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Yeni Ödev
          </button>
          
          <button 
            onClick={onOpenAddRubric}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus size={16} />
            Kriter
          </button>
  
          <div className="relative">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full hover:bg-gray-100 relative text-gray-600"
            >
              <Bell size={20} />
              {history.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            {showHistory && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-700 text-sm">Son İşlemler</span>
                  <button onClick={() => setShowHistory(false)}><X size={14} className="text-gray-400" /></button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {history.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Henüz işlem yapılmadı.</div>
                  ) : (
                    history.map((item: any, index: number) => (
                      <div key={index} className="p-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3">
                        <div className="mt-1"><CheckCircle size={16} className="text-green-500" /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.class} • {item.date}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
};