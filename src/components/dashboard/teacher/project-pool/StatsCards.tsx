'use client';

import React from 'react';
import { BookOpen, CheckCircle, Heart } from 'lucide-react';

export const StatsCards = ({ total, assignedCount, favoritesCount }: any) => (
<div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
        <BookOpen size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Toplam Proje</p>
        <h3 className="text-2xl font-bold text-gray-800">{total}</h3>
    </div>
    </div>
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-green-50 text-green-600 rounded-full">
        <CheckCircle size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Bu Ay Atanan</p>
        <h3 className="text-2xl font-bold text-gray-800">{assignedCount}</h3>
    </div>
    </div>
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-red-50 text-red-600 rounded-full">
        <Heart size={24} />
    </div>
    <div>
        <p className="text-sm text-gray-500 font-medium">Favoriler</p>
        <h3 className="text-2xl font-bold text-gray-800">{favoritesCount}</h3>
    </div>
    </div>
</div>
);