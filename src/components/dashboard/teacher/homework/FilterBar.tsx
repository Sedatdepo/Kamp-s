'use client';

import React from 'react';
import { Filter } from 'lucide-react';

export const FilterBar = ({ gradeFilter, subjectFilter, setGradeFilter, setSubjectFilter, disabled }: any) => (
<div className={`flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <div className="flex items-center gap-2 text-gray-700 font-medium min-w-fit">
    <Filter size={18} />
    Filtrele:
    </div>
    
    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
    <div className="relative">
        <select 
        value={gradeFilter}
        onChange={(e) => setGradeFilter(e.target.value)}
        className={`appearance-none w-full md:w-48 border text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${gradeFilter === '' ? 'border-blue-400 bg-blue-50 font-semibold' : 'border-gray-300 bg-gray-50'}`}
        >
        <option value="" disabled>Sınıf Seçiniz</option>
        <option value="9">9. Sınıf</option>
        <option value="10">10. Sınıf</option>
        <option value="11">11. Sınıf</option>
        <option value="12">12. Sınıf</option>
        </select>
    </div>

    <div className="relative">
        <select 
        value={subjectFilter}
        onChange={(e) => setSubjectFilter(e.target.value)}
        className={`appearance-none w-full md:w-48 border text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 transition-colors ${subjectFilter === '' ? 'border-blue-400 bg-blue-50 font-semibold' : 'border-gray-300 bg-gray-50'}`}
        >
        <option value="" disabled>Ders Seçiniz</option>
        <option value="physics">Fizik</option>
        <option value="literature">Türk Dili ve Edebiyatı</option>
        </select>
    </div>
    </div>
</div>
);
