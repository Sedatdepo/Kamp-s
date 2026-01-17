'use client';

import React from 'react';
import { Search } from 'lucide-react';

export const EmptyState = () => (
<div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border-2 border-dashed border-blue-100 text-center px-4">
    <div className="bg-blue-50 p-6 rounded-full mb-6">
    <Search size={48} className="text-blue-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">Projeleri Görüntülemek İçin Seçim Yapınız</h3>
    <p className="text-gray-500 max-w-md mx-auto">
    İlgili sınıf ve dersi yukarıdaki filtrelerden seçerek, o gruba ait performans projelerini listeleyebilirsiniz.
    </p>
</div>
);
