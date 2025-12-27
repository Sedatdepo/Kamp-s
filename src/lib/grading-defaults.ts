import { Criterion } from './types';

// PERFORMANS KRİTERLERİ - Toplam 100 Puan
export const INITIAL_PERF_CRITERIA: Criterion[] = [
    { id: 'c1', name: 'Derse Hazırlık & Araç-Gereç', max: 20 },
    { id: 'c2', name: 'Derse Aktif Katılım', max: 30 },
    { id: 'c3', name: 'Ödev ve Sorumluluk', max: 20 },
    { id: 'c4', name: 'Davranış ve Kurallar', max: 10 },
    { id: 'c5', name: 'Uygulama / Etkinlik', max: 20 },
];

// PROJE KRİTERLERİ - Toplam 100 Puan
export const INITIAL_PROJ_CRITERIA: Criterion[] = [
    { id: 'p1', name: 'Araştırma ve Kaynak Kullanımı', max: 20 },
    { id: 'p2', name: 'İçerik ve Özgünlük', max: 30 },
    { id: 'p3', name: 'Planlama ve Süreç', max: 20 },
    { id: 'p4', name: 'Sunum ve Görsellik', max: 20 },
    { id: 'p5', name: 'Zamanında Teslim', max: 10 },
];

// DAVRANIŞ (KANAAT) KRİTERLERİ - Toplam 100 Puan
export const INITIAL_BEHAVIOR_CRITERIA: Criterion[] = [
    { id: 'b1', name: 'Saç-Sakal Bakımı', max: 5 },
    { id: 'b2', name: 'Makyaj', max: 5 },
    { id: 'b3', name: 'Okul Üniforması', max: 10 },
    { id: 'b4', name: 'Telefon Teslim Etmeme', max: 10 },
    { id: 'b5', name: 'Dersten Çıkma Talebi', max: 5 },
    { id: 'b6', name: 'Arkadaşlarına Zorbalık', max: 10 },
    { id: 'b7', name: 'Kötü Söz Kullanımı', max: 10 },
    { id: 'b8', name: 'Temizlik Anlayışı', max: 5 },
    { id: 'b9', name: 'Okul Malına Zarar Verme', max: 10 },
    { id: 'b10', name: 'Derste Uyuma', max: 5 },
    { id: 'b11', name: 'Derse Geç Kalmak', max: 5 },
    { id: 'b12', name: 'Dersin İşlenişine Engel Olmak', max: 10 },
    { id: 'b13', name: 'Derse Hazırlıksız Gelmek', max: 5 },
    { id: 'b14', name: 'Akademik Başarısızlık', max: 5 },
];
