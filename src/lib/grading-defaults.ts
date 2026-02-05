import { Criterion, Badge } from './types';

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
    { id: 'beh_1', name: 'Derse Katılım', max: 5 },
    { id: 'beh_2', name: 'Ödev Tamamlama', max: 10 },
    { id: 'beh_3', name: 'Arkadaşına Yardım', max: 8 },
    { id: 'beh_4', name: 'Örnek Davranış', max: 15 },
    { id: 'beh_5', name: 'Düzenli Defter', max: 5 },
    { id: 'beh_neg_1', name: 'Derse Geç Kalma', max: -3 },
    { id: 'beh_neg_2', name: 'Ödev Eksikliği', max: -5 },
    { id: 'beh_neg_3', name: 'Dersin Akışını Bozma', max: -10 },
];

// ROZET KRİTERLERİ
export const INITIAL_BADGES: Badge[] = [
  { id: '1', name: 'Katılım Ustası', icon: '⭐', description: 'İstikrarlı derse katılım.', cost: 50 },
  { id: '2', name: 'Ödev Canavarı', icon: '⚡', description: 'Ödevlerini eksiksiz yapar.', cost: 60 },
  { id: '3', name: 'Sınıf Lideri', icon: '👑', description: 'Liderlik vasıfları gösterir.', cost: 100 },
  { id: '4', name: 'Yardımsever', icon: '🛡️', description: 'Arkadaşlarına yardım eder.', cost: 40 },
  { id: '5', name: 'Mükemmel Puan', icon: '🌟', description: 'Sınavlarda üstün başarı.', cost: 80 },
  { id: '6', name: 'Proje Uzmanı', icon: '🚀', description: 'Projeleri başarıyla tamamlar.', cost: 70 },
  { id: '7', name: 'Kitap Kurdu', icon: '📚', description: 'Çok kitap okur.', cost: 30 },
  { id: '8', name: 'Temizlik Elçisi', icon: '♻️', description: 'Çevresini temiz tutar.', cost: 20 },
];
