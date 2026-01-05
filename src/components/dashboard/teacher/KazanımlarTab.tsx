'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Search, BookOpen, Clock, Filter, FileSignature } from 'lucide-react';
import { useDatabase } from '@/hooks/use-database';
import { AnnualPlanEntry, AnnualPlan } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// --- VERİ SETLERİ ---

const plan9 = [
  // EYLÜL
  { month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Bilimi", learningOutcome: "FİZ.9.1.1. Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme", unitType: "fizik-bilimi", specialDays: "15 Temmuz Demokrasi ve Milli Birlik Günü", processComponents: "a) Fizik biliminin diğer disiplinlerle arasındaki ilişkileri belirler.<br>b) Fizik bilimini belirlediği ilişkilerden yararlanarak tanımlar." },
  { month: "EYLÜL", monthId: "eylul", week: "2. Hafta", dates: "15-19 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Biliminin Alt Dalları", learningOutcome: "FİZ.9.1.2. Fizik biliminin alt dallarını sınıflandırabilme", unitType: "fizik-bilimi" },
  { month: "EYLÜL", monthId: "eylul", week: "3. Hafta", dates: "22-26 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Bilimine Yön Verenler", learningOutcome: "FİZ.9.1.3. Fizik bilimine katkıda bulunmuş bilim insanlarının deneyimlerini yansıtabilme", unitType: "fizik-bilimi" },
  // EKİM
  { month: "EKİM", monthId: "ekim", week: "4. Hafta", dates: "29 Eylül-3 Ekim", hours: 2, unit: "FİZİK BİLİMİ", topic: "Kariyer Keşfi", learningOutcome: "FİZ.9.1.4. Bilim ve teknoloji alanında fizik bilimi ile ilişkili kariyer olanaklarını sorgulayabilme", unitType: "fizik-bilimi" },
  { month: "EKİM", monthId: "ekim", week: "5. Hafta", dates: "5-9 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Temel ve Türetilmiş Nicelikler", learningOutcome: "FİZ.9.2.1. Temel ve türetilmiş nicelikleri sınıflandırabilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "6. Hafta", dates: "13-17 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Skaler ve Vektörel Nicelikler", learningOutcome: "FİZ.9.2.2. Skaler ve vektörel nicelikleri karşılaştırabilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "7. Hafta", dates: "20-24 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörler", learningOutcome: "FİZ.9.2.3. Aynı doğrultu üzerindeki vektörlere yönelik çıkarım yapabilme", unitType: "kuvvet-hareket" },
  // KASIM
  { month: "KASIM", monthId: "kasim", week: "8. Hafta", dates: "27-31 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörlerin Toplanması", learningOutcome: "FİZ.9.2.4. Vektörlerin toplanması işlemine ilişkin tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket", specialDays: "29 Ekim Cumhuriyet Bayramı" },
  { month: "KASIM", monthId: "kasim", week: "9. Hafta", dates: "3-7 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörlerin Toplanması", learningOutcome: "FİZ.9.2.4. Devamı...", unitType: "kuvvet-hareket", specialDays: "Atatürk Haftası" },
  { month: "KASIM", monthId: "kasim", week: "1. DÖNEM ARA TATİLİ", dates: "10-14 Kasım", hours: 0, isBreak: true, unitType: "break" },
  { month: "KASIM", monthId: "kasim", week: "10. Hafta", dates: "17-21 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörler", learningOutcome: "FİZ.9.2.4. Devamı...", unitType: "kuvvet-hareket", specialDays: "24 Kasım Öğretmenler Günü" },
  { month: "KASIM", monthId: "kasim", week: "11. Hafta", dates: "24-28 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Doğadaki Temel Kuvvetler", learningOutcome: "FİZ.9.2.5. Doğadaki temel kuvvetleri karşılaştırabilme", unitType: "kuvvet-hareket" },
  // ARALIK
  { month: "ARALIK", monthId: "aralik", week: "12. Hafta", dates: "1-5 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Hareketin temel kavramlarına yönelik akıl yürütebilme", unitType: "kuvvet-hareket", specialDays: "3 Aralık Dünya Engelliler Günü" },
  { month: "ARALIK", monthId: "aralik", week: "13. Hafta", dates: "8-12 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Devamı...", unitType: "kuvvet-hareket" },
  { month: "ARALIK", monthId: "aralik", week: "14. Hafta", dates: "15-19 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Devamı...", unitType: "kuvvet-hareket" },
  { month: "ARALIK", monthId: "aralik", week: "15. Hafta", dates: "22-26 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.7. Hareket türlerini sınıflandırabilme", unitType: "kuvvet-hareket" },
  // OCAK
  { month: "OCAK", monthId: "ocak", week: "16. Hafta", dates: "29 Aralık-2 Ocak", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.7. Devamı...", unitType: "kuvvet-hareket" },
  { month: "OCAK", monthId: "ocak", week: "17. Hafta", dates: "5-9 Ocak", hours: 2, unit: "AKIŞKANLAR", topic: "Basınç", learningOutcome: "FİZ.9.3.1. Basınca yönelik çıkarımlarda bulunabilme", unitType: "akiskanlar" },
  { month: "OCAK", monthId: "ocak", week: "18. Hafta", dates: "12-16 Ocak", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { month: "OCAK", monthId: "ocak", week: "YARIYIL TATİLİ", dates: "19 Ocak - 30 Ocak 2026", hours: 0, isBreak: true, unitType: "break" },
  // ŞUBAT
  { month: "ŞUBAT", monthId: "subat", week: "19. Hafta", dates: "2-5 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Sıvılarda Basınç", learningOutcome: "FİZ.9.3.2. Durgun sıvılarda basınca yönelik çıkarımlarda bulunabilme", unitType: "akiskanlar" },
  { month: "ŞUBAT", monthId: "subat", week: "20. Hafta", dates: "9-13 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Sıvılarda Basınç (Günlük Hayat)", learningOutcome: "FİZ.9.3.3. Sıvılarda basıncın kullanıldığı örnekleri sorgulayabilme", unitType: "akiskanlar" },
  { month: "ŞUBAT", monthId: "subat", week: "21. Hafta", dates: "16-20 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Açık Hava Basıncı", learningOutcome: "FİZ.9.3.4. Açık hava basıncına ilişkin çıkarım yapabilme", unitType: "akiskanlar" },
  { month: "ŞUBAT", monthId: "subat", week: "22. Hafta", dates: "23-27 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Açık Hava Basıncı", learningOutcome: "FİZ.9.3.4. Devamı...", unitType: "akiskanlar" },
  // MART
  { month: "MART", monthId: "mart", week: "23. Hafta", dates: "2-6 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Kaldırma Kuvveti", learningOutcome: "FİZ.9.3.5. Kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik deney yapabilme", unitType: "akiskanlar" },
  { month: "MART", monthId: "mart", week: "24. Hafta", dates: "10-14 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Kaldırma Kuvveti", learningOutcome: "FİZ.9.3.6. Kaldırma kuvveti ile basınç kuvveti ilişkisi", unitType: "akiskanlar", specialDays: "12 Mart İstiklâl Marşı, 18 Mart Çanakkale Zaferi" },
  { month: "MART", monthId: "mart", week: "2. DÖNEM ARA TATİLİ", dates: "16-20 Mart", hours: 0, isBreak: true, unitType: "break" },
  { month: "MART", monthId: "mart", week: "25. Hafta", dates: "23-27 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Bernoulli İlkesi", learningOutcome: "FİZ.9.3.7. Akışkanın hızı ve basıncı arasındaki ilişki", unitType: "akiskanlar" },
  { month: "MART", monthId: "mart", week: "26. Hafta", dates: "30 Mart-3 Nisan", hours: 2, unit: "AKIŞKANLAR", topic: "Bernoulli İlkesi", learningOutcome: "FİZ.9.3.7. Devamı...", unitType: "akiskanlar" },
  // NİSAN
  { month: "NİSAN", monthId: "nisan", week: "27. Hafta", dates: "6-10 Nisan", hours: 2, unit: "ENERJİ", topic: "İç Enerji, Isı ve Sıcaklık", learningOutcome: "FİZ.9.4.1. İç enerjinin ısı ve sıcaklık ile ilişkisi", unitType: "enerji" },
  { month: "NİSAN", monthId: "nisan", week: "28. Hafta", dates: "13-17 Nisan", hours: 2, unit: "ENERJİ", topic: "Isı, Öz Isı, Isı Sığası", learningOutcome: "FİZ.9.4.2. Isı, öz ısı, ısı sığası ve sıcaklık farkı ilişkisi", unitType: "enerji" },
  { month: "NİSAN", monthId: "nisan", week: "29. Hafta", dates: "20-24 Nisan", hours: 2, unit: "ENERJİ", topic: "Isı, Öz Isı, Isı Sığası", learningOutcome: "FİZ.9.4.2. Devamı...", unitType: "enerji", specialDays: "23 Nisan Ulusal Egemenlik" },
  { month: "NİSAN", monthId: "nisan", week: "30. Hafta", dates: "27 Nisan-1 Mayıs", hours: 2, unit: "ENERJİ", topic: "Hâl Değişimi", learningOutcome: "FİZ.9.4.3. Hâl değişimi için gereken ısı miktarı", unitType: "enerji" },
  // MAYIS
  { month: "MAYIS", monthId: "mayis", week: "31. Hafta", dates: "4-8 Mayıs", hours: 2, unit: "ENERJİ", topic: "Hâl Değişimi", learningOutcome: "FİZ.9.4.3. Devamı...", unitType: "enerji" },
  { month: "MAYIS", monthId: "mayis", week: "32. Hafta", dates: "11-15 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isıl Denge", learningOutcome: "FİZ.9.4.4. Isıl denge durumu", unitType: "enerji" },
  { month: "MAYIS", monthId: "mayis", week: "33. Hafta", dates: "18-22 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isı Aktarım Yolları", learningOutcome: "FİZ.9.4.5. Isı aktarım yollarını sınıflayabilme", unitType: "enerji", specialDays: "19 Mayıs Atatürk'ü Anma" },
  { month: "MAYIS", monthId: "mayis", week: "34. Hafta", dates: "25-29 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isı Aktarım Yolları", learningOutcome: "FİZ.9.4.5. Devamı...", unitType: "enerji", specialDays: "29 Mayıs İstanbul'un Fethi" },
  // HAZİRAN
  { month: "HAZİRAN", monthId: "haziran", week: "35. Hafta", dates: "1-5 Haziran", hours: 2, unit: "ENERJİ", topic: "Isı İletim Hızı", learningOutcome: "FİZ.9.4.6. Isı iletim hızını etkileyen etmenler", unitType: "enerji" },
  { month: "HAZİRAN", monthId: "haziran", week: "36. Hafta", dates: "8-12 Haziran", hours: 0, unit: "", topic: "", learningOutcome: "", unitType: "" },
  { month: "HAZİRAN", monthId: "haziran", week: "37. Hafta", dates: "15-19 Haziran", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { month: "HAZİRAN", monthId: "haziran", week: "38. Hafta", dates: "22-26 Haziran", hours: 0, unit: "SOSYAL ETKİNLİK", topic: "Sosyal Etkinlik", unitType: "sosyal" }
];

const plan10 = [
  // EYLÜL
  { month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Sabit Hızlı Hareket", learningOutcome: "FİZ.10.1.1. Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket", processComponents: "a) Yatay doğrultuda sabit hızlı hareket eden cisimlerin konum, yer değiştirme, hız ve zaman değişkenlerini deney yaparak gözlemler.<br>b) Hareket grafiklerinden yararlanarak matematiksel modeli bulur." },
  { month: "EYLÜL", monthId: "eylul", week: "2. Hafta", dates: "15-19 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Sabit Hızlı Hareket", learningOutcome: "FİZ.10.1.1. Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { month: "EYLÜL", monthId: "eylul", week: "3. Hafta", dates: "22-26 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Bir Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.2. İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  // EKİM
  { month: "EKİM", monthId: "ekim", week: "4. Hafta", dates: "29 Eylül-3 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Bir Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.3. Hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "5. Hafta", dates: "6-10 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Serbest Düşme", learningOutcome: "FİZ.10.1.4. Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "6. Hafta", dates: "13-17 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Serbest Düşme", learningOutcome: "FİZ.10.1.5. Serbest düşme hareketi ile ilgili kanıt kullanabilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "7. Hafta", dates: "20-24 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "İki Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.6. İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { month: "EKİM", monthId: "ekim", week: "8. Hafta", dates: "27-31 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "İki Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.6. Devamı...", unitType: "kuvvet-hareket", specialDays: "29 Ekim Cumhuriyet Bayramı" },
  // KASIM
  { month: "KASIM", monthId: "kasim", week: "9. Hafta", dates: "3-7 Kasım", hours: 2, unit: "ENERJİ", topic: "İş, Enerji ve Güç", learningOutcome: "FİZ.10.2.1. Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme", unitType: "enerji", specialDays: "Atatürk Haftası" },
  { month: "KASIM", monthId: "kasim", week: "1. DÖNEM ARA TATİLİ", dates: "10-14 Kasım", hours: 0, isBreak: true, unitType: "break" },
  { month: "KASIM", monthId: "kasim", week: "10. Hafta", dates: "17-21 Kasım", hours: 2, unit: "ENERJİ", topic: "İş, Enerji ve Güç", learningOutcome: "FİZ.10.2.2. İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme", unitType: "enerji" },
  { month: "KASIM", monthId: "kasim", week: "11. Hafta", dates: "24-28 Kasım", hours: 2, unit: "ENERJİ", topic: "Enerji Biçimleri", learningOutcome: "FİZ.10.2.3. Enerji biçimlerini karşılaştırabilme", unitType: "enerji" },
  // ARALIK
  { month: "ARALIK", monthId: "aralik", week: "12. Hafta", dates: "1-5 Aralık", hours: 2, unit: "ENERJİ", topic: "Enerji Biçimleri", learningOutcome: "FİZ.10.2.3. Devamı...", unitType: "enerji" },
  { month: "ARALIK", monthId: "aralik", week: "13. Hafta", dates: "8-12 Aralık", hours: 2, unit: "ENERJİ", topic: "Mekanik Enerji", learningOutcome: "FİZ.10.2.4. Mekanik enerjiyi çözümleyebilme", unitType: "enerji" },
  { month: "ARALIK", monthId: "aralik", week: "14. Hafta", dates: "15-19 Aralık", hours: 2, unit: "ENERJİ", topic: "Mekanik Enerji", learningOutcome: "FİZ.10.2.4. Devamı...", unitType: "enerji" },
  { month: "ARALIK", monthId: "aralik", week: "15. Hafta", dates: "22-26 Aralık", hours: 2, unit: "ENERJİ", topic: "Enerji Kaynakları", learningOutcome: "FİZ.10.2.5. Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme", unitType: "enerji" },
  // OCAK
  { month: "OCAK", monthId: "ocak", week: "16. Hafta", dates: "29 Aralık-2 Ocak", hours: 2, unit: "ELEKTRİK", topic: "Basit Elektrik Devreleri", learningOutcome: "FİZ.10.3.1. Potansiyel fark, akım ve direnç kavramlarına ilişkin analojik akıl yürütebilme", unitType: "elektrik" },
  { month: "OCAK", monthId: "ocak", week: "17. Hafta", dates: "5-9 Ocak", hours: 2, unit: "ELEKTRİK", topic: "Basit Elektrik Devreleri", learningOutcome: "FİZ.10.3.1. Devamı...", unitType: "elektrik" },
  { month: "OCAK", monthId: "ocak", week: "18. Hafta", dates: "12-16 Ocak", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { month: "OCAK", monthId: "ocak", week: "YARIYIL TATİLİ", dates: "19 Ocak - 30 Ocak 2026", hours: 0, isBreak: true, unitType: "break" },
  // ŞUBAT
  { month: "ŞUBAT", monthId: "subat", week: "19. Hafta", dates: "2-6 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Elektrik Akımı", learningOutcome: "FİZ.10.3.2. Elektrik akımı kavramını çözümleyebilme", unitType: "elektrik" },
  { month: "ŞUBAT", monthId: "subat", week: "20. Hafta", dates: "9-13 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Ohm Yasası", learningOutcome: "FİZ.10.3.3. Ohm Yasası ile ilgili tümevarımsal akıl yürütebilme", unitType: "elektrik" },
  { month: "ŞUBAT", monthId: "subat", week: "21. Hafta", dates: "16-20 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Dirençlerin Bağlanması", learningOutcome: "FİZ.10.3.4. Eşdeğer direncin büyüklüğüne ilişkin bilimsel çıkarım yapabilme", unitType: "elektrik" },
  { month: "ŞUBAT", monthId: "subat", week: "22. Hafta", dates: "23-27 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Dirençlerin Bağlanması", learningOutcome: "FİZ.10.3.4. Devamı...", unitType: "elektrik" },
  // MART
  { month: "MART", monthId: "mart", week: "23. Hafta", dates: "2-6 Mart", hours: 2, unit: "ELEKTRİK", topic: "Üreteçlerin Bağlanması", learningOutcome: "FİZ.10.3.5. Üreteçlerin bağlanma türüne göre potansiyel fark çıkarımı", unitType: "elektrik" },
  { month: "MART", monthId: "mart", week: "24. Hafta", dates: "9-13 Mart", hours: 2, unit: "ELEKTRİK", topic: "Üreteçlerin Bağlanması", learningOutcome: "FİZ.10.3.5. Devamı...", unitType: "elektrik" },
  { month: "MART", monthId: "mart", week: "2. DÖNEM ARA TATİLİ", dates: "16-20 Mart", hours: 0, isBreak: true, unitType: "break" },
  { month: "MART", monthId: "mart", week: "25. Hafta", dates: "23-27 Mart", hours: 2, unit: "ELEKTRİK", topic: "Elektrik Tehlikeleri", learningOutcome: "FİZ.10.3.6. Elektrik akımının oluşturabileceği tehlikelere karşı alınması gereken önlemler", unitType: "elektrik" },
  { month: "MART", monthId: "mart", week: "26. Hafta", dates: "30 Mart-3 Nisan", hours: 2, unit: "ELEKTRİK", topic: "Topraklama", learningOutcome: "FİZ.10.3.7. Topraklama olayının önemini sorgulayabilme", unitType: "elektrik" },
  // NİSAN
  { month: "NİSAN", monthId: "nisan", week: "27. Hafta", dates: "6-10 Nisan", hours: 2, unit: "DALGALAR", topic: "Dalgaların Temel Kavramları", learningOutcome: "FİZ.10.4.1. Dalgaların temel kavramlarına ilişkin operasyonel tanımlama yapabilme", unitType: "dalgalar" },
  { month: "NİSAN", monthId: "nisan", week: "28. Hafta", dates: "13-17 Nisan", hours: 2, unit: "DALGALAR", topic: "Dalgaların Temel Kavramları", learningOutcome: "FİZ.10.4.1. Devamı...", unitType: "dalgalar" },
  { month: "NİSAN", monthId: "nisan", week: "29. Hafta", dates: "20-24 Nisan", hours: 2, unit: "DALGALAR", topic: "Yayılma Sürati", learningOutcome: "FİZ.10.4.2. Sınıflandırma / FİZ.10.4.3. Yayılma süratini etkileyen etmenler", unitType: "dalgalar" },
  { month: "NİSAN", monthId: "nisan", week: "30. Hafta", dates: "27 Nisan-1 Mayıs", hours: 2, unit: "DALGALAR", topic: "Yayılma Sürati", learningOutcome: "FİZ.10.4.3. Devamı...", unitType: "dalgalar" },
  // MAYIS
  { month: "MAYIS", monthId: "mayis", week: "31. Hafta", dates: "4-8 Mayıs", hours: 2, unit: "DALGALAR", topic: "Periyodik Hareketler", learningOutcome: "FİZ.10.4.4. Periyodik hareketlere ilişkin deneyimlerini yansıtabilme", unitType: "dalgalar" },
  { month: "MAYIS", monthId: "mayis", week: "32. Hafta", dates: "11-15 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Su dalgalarında yansıma ve kırılma ile ilgili tümevarımsal akıl yürütebilme", unitType: "dalgalar" },
  { month: "MAYIS", monthId: "mayis", week: "33. Hafta", dates: "18-22 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Devamı...", unitType: "dalgalar" },
  { month: "MAYIS", monthId: "mayis", week: "34. Hafta", dates: "25-29 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Devamı...", unitType: "dalgalar" },
  // HAZİRAN
  { month: "HAZİRAN", monthId: "haziran", week: "35. Hafta", dates: "1-5 Haziran", hours: 2, unit: "DALGALAR", topic: "Rezonans ve Deprem", learningOutcome: "FİZ.10.4.6. Rezonans ve depreme ilişkin kavramlar üzerinden depremi sorgulayabilme", unitType: "dalgalar" },
  { month: "HAZİRAN", monthId: "haziran", week: "36. Hafta", dates: "8-12 Haziran", hours: 2, unit: "DALGALAR", topic: "Deprem Modeli", learningOutcome: "FİZ.10.4.7. Depremle ilgili bilimsel model oluşturabilme", unitType: "dalgalar" },
  { month: "HAZİRAN", monthId: "haziran", week: "37. Hafta", dates: "15-19 Haziran", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { month: "HAZİRAN", monthId: "haziran", week: "38. Hafta", dates: "22-26 Haziran", hours: 0, unit: "SOSYAL ETKİNLİK", topic: "Sosyal Etkinlik", unitType: "sosyal" }
];

export default function KazanımlarTab() {
  const [activeGrade, setActiveGrade] = useState(9);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sınıf bazlı filtre konfigürasyonu
  const gradeConfig = {
    9: {
      data: plan9,
      filters: [
        { id: 'all', label: 'Tümü' },
        { id: 'fizik-bilimi', label: 'Fizik Bilimi' },
        { id: 'kuvvet-hareket', label: 'Kuvvet ve Hareket' },
        { id: 'akiskanlar', label: 'Akışkanlar' },
        { id: 'enerji', label: 'Enerji' }
      ]
    },
    10: {
      data: plan10,
      filters: [
        { id: 'all', label: 'Tümü' },
        { id: 'kuvvet-hareket', label: 'Kuvvet' },
        { id: 'enerji', label: 'Enerji' },
        { id: 'elektrik', label: 'Elektrik' },
        { id: 'dalgalar', label: 'Dalgalar' }
      ]
    }
  };

  // Filtreleme Mantığı
  const filteredWeeks = useMemo(() => {
    const currentData = gradeConfig[activeGrade].data;
    
    return currentData.filter(week => {
      // 1. Ay Filtresi
      if (activeMonth !== 'all' && week.monthId !== activeMonth) return false;
      
      // 2. Konu Filtresi
      if (activeFilter !== 'all' && week.unitType !== activeFilter) {
          // Tatilleri ve özel planlamaları her zaman göster
          if (week.unitType !== 'break' && week.unitType !== 'okul-temelli' && week.unitType !== 'sosyal') {
              return false;
          }
      }

      // 3. Arama Filtresi
      if (searchTerm) {
        const text = `
          ${week.unit || ''} 
          ${week.topic || ''} 
          ${week.learningOutcome || ''} 
          ${week.processComponents || ''} 
          ${week.specialDays || ''}
          ${week.week || ''}
        `.toLowerCase();
        
        if (!text.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  }, [activeGrade, activeFilter, activeMonth, searchTerm, gradeConfig]);

  // Yardımcı fonksiyon: Ünite tipine göre renk döndür
  const getAccentColor = (unitType) => {
    switch(unitType) {
      case 'fizik-bilimi': return 'border-amber-500';
      case 'kuvvet-hareket': return 'border-red-500';
      case 'akiskanlar': return 'border-sky-500';
      case 'enerji': return 'border-emerald-500';
      case 'elektrik': return 'border-blue-500';
      case 'dalgalar': return 'border-purple-500';
      case 'okul-temelli': return 'border-violet-500';
      case 'sosyal': return 'border-pink-500';
      case 'break': return 'border-yellow-400';
      default: return 'border-slate-300';
    }
  };

  const getBadgeColor = (unitType) => {
    switch(unitType) {
      case 'fizik-bilimi': return 'bg-amber-500';
      case 'kuvvet-hareket': return 'bg-red-500';
      case 'akiskanlar': return 'bg-sky-500';
      case 'enerji': return 'bg-emerald-500';
      case 'elektrik': return 'bg-blue-500';
      case 'dalgalar': return 'bg-purple-500';
      case 'okul-temelli': return 'bg-violet-500';
      case 'sosyal': return 'bg-pink-500';
      default: return 'bg-slate-500';
    }
  };

  const getBackgroundColor = (unitType, isBreak) => {
    if (isBreak) return 'bg-yellow-50';
    if (unitType === 'okul-temelli') return 'bg-violet-50';
    if (unitType === 'sosyal') return 'bg-pink-50';
    return 'bg-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 mb-2 tracking-tight">
            Fizik Dersi Yıllık Planı
          </h1>
          <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium">
            2025-2026 Eğitim-Öğretim Yılı
          </div>
        </header>

        {/* Grade Switcher */}
        <div className="flex justify-center gap-4 mb-8">
          {[9, 10].map((grade) => (
            <button
              key={grade}
              onClick={() => {
                setActiveGrade(grade);
                setActiveFilter('all'); // Sınıf değişince filtreyi sıfırla
              }}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${
                activeGrade === grade 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform -translate-y-0.5' 
                  : 'bg-white text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {grade}. Sınıf
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Dynamic Filters */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {gradeConfig[activeGrade].filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                    activeFilter === filter.id
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-transparent text-slate-500 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Month & Search */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <select
                  value={activeMonth}
                  onChange={(e) => setActiveMonth(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                >
                  <option value="all">Tüm Aylar</option>
                  <option value="eylul">Eylül</option>
                  <option value="ekim">Ekim</option>
                  <option value="kasim">Kasım</option>
                  <option value="aralik">Aralık</option>
                  <option value="ocak">Ocak</option>
                  <option value="subat">Şubat</option>
                  <option value="mart">Mart</option>
                  <option value="nisan">Nisan</option>
                  <option value="mayis">Mayıs</option>
                  <option value="haziran">Haziran</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <Filter size={16} />
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ara..."
                  className="w-full sm:w-48 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-slate-400">
                  <Search size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-6">
          {filteredWeeks.length > 0 ? (
            filteredWeeks.map((week, index) => (
              <div 
                key={index}
                className={`relative rounded-xl p-6 shadow-sm border border-slate-200 transition-transform hover:-translate-y-1 hover:shadow-md border-l-4 ${getAccentColor(week.unitType)} ${getBackgroundColor(week.unitType, week.isBreak)}`}
              >
                {/* Month Tag */}
                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded mb-3 border border-slate-200">
                  {week.month}
                </span>

                {/* Header */}
                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{week.week}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-1 font-medium text-sm">
                      <Calendar size={14} />
                      {week.dates}
                    </div>
                  </div>
                  {week.hours > 0 && (
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide flex items-center gap-1">
                      <Clock size={12} />
                      {week.hours} Saat
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="space-y-4">
                  {(week.unit || week.topic) && (
                    <div>
                      {week.unit && (
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide text-white mb-2 ${getBadgeColor(week.unitType)}`}>
                          {week.unit}
                        </span>
                      )}
                      {week.topic && (
                        <div className="text-lg font-semibold text-slate-800 leading-tight">
                          {week.topic}
                        </div>
                      )}
                    </div>
                  )}

                  {week.learningOutcome && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                      <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Kazanım</span>
                      <p className="text-slate-700 text-sm leading-relaxed">{week.learningOutcome}</p>
                    </div>
                  )}

                  {week.processComponents && (
                    <div className="pt-2 border-t border-dashed border-slate-200">
                      <span className="block text-[11px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Süreç Bileşenleri</span>
                      <div 
                        className="text-slate-600 text-sm leading-relaxed space-y-1"
                        dangerouslySetInnerHTML={{ __html: week.processComponents }}
                      />
                    </div>
                  )}

                  {week.specialDays && (
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 mt-2">
                      <BookOpen size={12} />
                      {week.specialDays}
                    </div>
                  )}
                  {!week.isBreak && week.hours > 0 && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => {
                                // Placeholder for future functionality
                                console.log("Dönüştürülecek hafta:", week);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            <FileSignature size={14} />
                            Günlük Plana Dönüştür
                        </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400">
              <p className="text-lg font-medium">Aradığınız kriterlere uygun sonuç bulunamadı.</p>
            </div>
          )}
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm border-t border-slate-200 pt-6 pb-8">
          <p>Türkiye Yüzyılı Maarif Modeli Çerçevesinde Hazırlanmıştır</p>
          <p>© 2025-2026 Eğitim-Öğretim Yılı</p>
        </footer>
      </div>
    </div>
  );
}