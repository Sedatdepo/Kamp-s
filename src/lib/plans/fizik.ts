// 9. Sınıf Fizik Planı
const plan9 = [
  // EYLÜL
  { id: "9-1", month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Bilimi", learningOutcome: "FİZ.9.1.1. Fizik biliminin tanımına yönelik tümevarımsal akıl yürütebilme", unitType: "fizik-bilimi", specialDays: "15 Temmuz Demokrasi ve Milli Birlik Günü", processComponents: "a) Fizik biliminin diğer disiplinlerle arasındaki ilişkileri belirler.<br>b) Fizik bilimini belirlediği ilişkilerden yararlanarak tanımlar." },
  { id: "9-2", month: "EYLÜL", monthId: "eylul", week: "2. Hafta", dates: "15-19 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Biliminin Alt Dalları", learningOutcome: "FİZ.9.1.2. Fizik biliminin alt dallarını sınıflandırabilme", unitType: "fizik-bilimi" },
  { id: "9-3", month: "EYLÜL", monthId: "eylul", week: "3. Hafta", dates: "22-26 Eylül", hours: 2, unit: "FİZİK BİLİMİ", topic: "Fizik Bilimine Yön Verenler", learningOutcome: "FİZ.9.1.3. Fizik bilimine katkıda bulunmuş bilim insanlarının deneyimlerini yansıtabilme", unitType: "fizik-bilimi" },
  // EKİM
  { id: "9-4", month: "EKİM", monthId: "ekim", week: "4. Hafta", dates: "29 Eylül-3 Ekim", hours: 2, unit: "FİZİK BİLİMİ", topic: "Kariyer Keşfi", learningOutcome: "FİZ.9.1.4. Bilim ve teknoloji alanında fizik bilimi ile ilişkili kariyer olanaklarını sorgulayabilme", unitType: "fizik-bilimi" },
  { id: "9-5", month: "EKİM", monthId: "ekim", week: "5. Hafta", dates: "5-9 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Temel ve Türetilmiş Nicelikler", learningOutcome: "FİZ.9.2.1. Temel ve türetilmiş nicelikleri sınıflandırabilme", unitType: "kuvvet-hareket" },
  { id: "9-6", month: "EKİM", monthId: "ekim", week: "6. Hafta", dates: "13-17 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Skaler ve Vektörel Nicelikler", learningOutcome: "FİZ.9.2.2. Skaler ve vektörel nicelikleri karşılaştırabilme", unitType: "kuvvet-hareket" },
  { id: "9-7", month: "EKİM", monthId: "ekim", week: "7. Hafta", dates: "20-24 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörler", learningOutcome: "FİZ.9.2.3. Aynı doğrultu üzerindeki vektörlere yönelik çıkarım yapabilme", unitType: "kuvvet-hareket" },
  // KASIM
  { id: "9-8", month: "KASIM", monthId: "kasim", week: "8. Hafta", dates: "27-31 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörlerin Toplanması", learningOutcome: "FİZ.9.2.4. Vektörlerin toplanması işlemine ilişkin tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket", specialDays: "29 Ekim Cumhuriyet Bayramı" },
  { id: "9-9", month: "KASIM", monthId: "kasim", week: "9. Hafta", dates: "3-7 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörlerin Toplanması", learningOutcome: "FİZ.9.2.4. Devamı...", unitType: "kuvvet-hareket", specialDays: "Atatürk Haftası" },
  { id: "9-10", month: "KASIM", monthId: "kasim", week: "1. DÖNEM ARA TATİLİ", dates: "10-14 Kasım", hours: 0, isBreak: true, unitType: "break" },
  { id: "9-11", month: "KASIM", monthId: "kasim", week: "10. Hafta", dates: "17-21 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Vektörler", learningOutcome: "FİZ.9.2.4. Devamı...", unitType: "kuvvet-hareket", specialDays: "24 Kasım Öğretmenler Günü" },
  { id: "9-12", month: "KASIM", monthId: "kasim", week: "11. Hafta", dates: "24-28 Kasım", hours: 2, unit: "KUVVET VE HAREKET", topic: "Doğadaki Temel Kuvvetler", learningOutcome: "FİZ.9.2.5. Doğadaki temel kuvvetleri karşılaştırabilme", unitType: "kuvvet-hareket" },
  // ARALIK
  { id: "9-13", month: "ARALIK", monthId: "aralik", week: "12. Hafta", dates: "1-5 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Hareketin temel kavramlarına yönelik akıl yürütebilme", unitType: "kuvvet-hareket", specialDays: "3 Aralık Dünya Engelliler Günü" },
  { id: "9-14", month: "ARALIK", monthId: "aralik", week: "13. Hafta", dates: "8-12 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Devamı...", unitType: "kuvvet-hareket" },
  { id: "9-15", month: "ARALIK", monthId: "aralik", week: "14. Hafta", dates: "15-19 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.6. Devamı...", unitType: "kuvvet-hareket" },
  { id: "9-16", month: "ARALIK", monthId: "aralik", week: "15. Hafta", dates: "22-26 Aralık", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.7. Hareket türlerini sınıflandırabilme", unitType: "kuvvet-hareket" },
  // OCAK
  { id: "9-17", month: "OCAK", monthId: "ocak", week: "16. Hafta", dates: "29 Aralık-2 Ocak", hours: 2, unit: "KUVVET VE HAREKET", topic: "Hareket ve Hareket Türleri", learningOutcome: "FİZ.9.2.7. Devamı...", unitType: "kuvvet-hareket" },
  { id: "9-18", month: "OCAK", monthId: "ocak", week: "17. Hafta", dates: "5-9 Ocak", hours: 2, unit: "AKIŞKANLAR", topic: "Basınç", learningOutcome: "FİZ.9.3.1. Basınca yönelik çıkarımlarda bulunabilme", unitType: "akiskanlar" },
  { id: "9-19", month: "OCAK", monthId: "ocak", week: "18. Hafta", dates: "12-16 Ocak", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { id: "9-20", month: "OCAK", monthId: "ocak", week: "YARIYIL TATİLİ", dates: "19 Ocak - 30 Ocak 2026", hours: 0, isBreak: true, unitType: "break" },
  // ŞUBAT
  { id: "9-21", month: "ŞUBAT", monthId: "subat", week: "19. Hafta", dates: "2-5 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Sıvılarda Basınç", learningOutcome: "FİZ.9.3.2. Durgun sıvılarda basınca yönelik çıkarımlarda bulunabilme", unitType: "akiskanlar" },
  { id: "9-22", month: "ŞUBAT", monthId: "subat", week: "20. Hafta", dates: "9-13 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Sıvılarda Basınç (Günlük Hayat)", learningOutcome: "FİZ.9.3.3. Sıvılarda basıncın kullanıldığı örnekleri sorgulayabilme", unitType: "akiskanlar" },
  { id: "9-23", month: "ŞUBAT", monthId: "subat", week: "21. Hafta", dates: "16-20 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Açık Hava Basıncı", learningOutcome: "FİZ.9.3.4. Açık hava basıncına ilişkin çıkarım yapabilme", unitType: "akiskanlar" },
  { id: "9-24", month: "ŞUBAT", monthId: "subat", week: "22. Hafta", dates: "23-27 Şubat", hours: 2, unit: "AKIŞKANLAR", topic: "Açık Hava Basıncı", learningOutcome: "FİZ.9.3.4. Devamı...", unitType: "akiskanlar" },
  // MART
  { id: "9-25", month: "MART", monthId: "mart", week: "23. Hafta", dates: "2-6 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Kaldırma Kuvveti", learningOutcome: "FİZ.9.3.5. Kaldırma kuvvetini etkileyen değişkenleri belirlemeye yönelik deney yapabilme", unitType: "akiskanlar" },
  { id: "9-26", month: "MART", monthId: "mart", week: "24. Hafta", dates: "10-14 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Kaldırma Kuvveti", learningOutcome: "FİZ.9.3.6. Kaldırma kuvveti ile basınç kuvveti ilişkisi", unitType: "akiskanlar", specialDays: "12 Mart İstiklâl Marşı, 18 Mart Çanakkale Zaferi" },
  { id: "9-27", month: "MART", monthId: "mart", week: "2. DÖNEM ARA TATİLİ", dates: "16-20 Mart", hours: 0, isBreak: true, unitType: "break" },
  { id: "9-28", month: "MART", monthId: "mart", week: "25. Hafta", dates: "23-27 Mart", hours: 2, unit: "AKIŞKANLAR", topic: "Bernoulli İlkesi", learningOutcome: "FİZ.9.3.7. Akışkanın hızı ve basıncı arasındaki ilişki", unitType: "akiskanlar" },
  { id: "9-29", month: "MART", monthId: "mart", week: "26. Hafta", dates: "30 Mart-3 Nisan", hours: 2, unit: "AKIŞKANLAR", topic: "Bernoulli İlkesi", learningOutcome: "FİZ.9.3.7. Devamı...", unitType: "akiskanlar" },
  // NİSAN
  { id: "9-30", month: "NİSAN", monthId: "nisan", week: "27. Hafta", dates: "6-10 Nisan", hours: 2, unit: "ENERJİ", topic: "İç Enerji, Isı ve Sıcaklık", learningOutcome: "FİZ.9.4.1. İç enerjinin ısı ve sıcaklık ile ilişkisi", unitType: "enerji" },
  { id: "9-31", month: "NİSAN", monthId: "nisan", week: "28. Hafta", dates: "13-17 Nisan", hours: 2, unit: "ENERJİ", topic: "Isı, Öz Isı, Isı Sığası", learningOutcome: "FİZ.9.4.2. Isı, öz ısı, ısı sığası ve sıcaklık farkı ilişkisi", unitType: "enerji" },
  { id: "9-32", month: "NİSAN", monthId: "nisan", week: "29. Hafta", dates: "20-24 Nisan", hours: 2, unit: "ENERJİ", topic: "Isı, Öz Isı, Isı Sığası", learningOutcome: "FİZ.9.4.2. Devamı...", unitType: "enerji", specialDays: "23 Nisan Ulusal Egemenlik" },
  { id: "9-33", month: "NİSAN", monthId: "nisan", week: "30. Hafta", dates: "27 Nisan-1 Mayıs", hours: 2, unit: "ENERJİ", topic: "Hâl Değişimi", learningOutcome: "FİZ.9.4.3. Hâl değişimi için gereken ısı miktarı", unitType: "enerji" },
  // MAYIS
  { id: "9-34", month: "MAYIS", monthId: "mayis", week: "31. Hafta", dates: "4-8 Mayıs", hours: 2, unit: "ENERJİ", topic: "Hâl Değişimi", learningOutcome: "FİZ.9.4.3. Devamı...", unitType: "enerji" },
  { id: "9-35", month: "MAYIS", monthId: "mayis", week: "32. Hafta", dates: "11-15 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isıl Denge", learningOutcome: "FİZ.9.4.4. Isıl denge durumu", unitType: "enerji" },
  { id: "9-36", month: "MAYIS", monthId: "mayis", week: "33. Hafta", dates: "18-22 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isı Aktarım Yolları", learningOutcome: "FİZ.9.4.5. Isı aktarım yollarını sınıflayabilme", unitType: "enerji", specialDays: "19 Mayıs Atatürk'ü Anma" },
  { id: "9-37", month: "MAYIS", monthId: "mayis", week: "34. Hafta", dates: "25-29 Mayıs", hours: 2, unit: "ENERJİ", topic: "Isı Aktarım Yolları", learningOutcome: "FİZ.9.4.5. Devamı...", unitType: "enerji", specialDays: "29 Mayıs İstanbul'un Fethi" },
  // HAZİRAN
  { id: "9-38", month: "HAZİRAN", monthId: "haziran", week: "35. Hafta", dates: "1-5 Haziran", hours: 2, unit: "ENERJİ", topic: "Isı İletim Hızı", learningOutcome: "FİZ.9.4.6. Isı iletim hızını etkileyen etmenler", unitType: "enerji" },
  { id: "9-39", month: "HAZİRAN", monthId: "haziran", week: "36. Hafta", dates: "8-12 Haziran", hours: 0, unit: "", topic: "", learningOutcome: "", unitType: "" },
  { id: "9-40", month: "HAZİRAN", monthId: "haziran", week: "37. Hafta", dates: "15-19 Haziran", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { id: "9-41", month: "HAZİRAN", monthId: "haziran", week: "38. Hafta", dates: "22-26 Haziran", hours: 0, unit: "SOSYAL ETKİNLİK", topic: "Sosyal Etkinlik", unitType: "sosyal" }
];

// 10. Sınıf Fizik Planı
const plan10 = [
  // EYLÜL
  { id: "10-1", month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Sabit Hızlı Hareket", learningOutcome: "FİZ.10.1.1. Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket", processComponents: "a) Yatay doğrultuda sabit hızlı hareket eden cisimlerin konum, yer değiştirme, hız ve zaman değişkenlerini deney yaparak gözlemler.<br>b) Hareket grafiklerinden yararlanarak matematiksel modeli bulur." },
  { id: "10-2", month: "EYLÜL", monthId: "eylul", week: "2. Hafta", dates: "15-19 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Sabit Hızlı Hareket", learningOutcome: "FİZ.10.1.1. Yatay doğrultuda sabit hızlı hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { id: "10-3", month: "EYLÜL", monthId: "eylul", week: "3. Hafta", dates: "22-26 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Bir Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.2. İvme ve hız değişimi arasındaki ilişkiye yönelik tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  // EKİM
  { id: "10-4", month: "EKİM", monthId: "ekim", week: "4. Hafta", dates: "29 Eylül-3 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Bir Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.3. Hareket grafiklerinden elde edilen matematiksel modelleri yorumlayabilme", unitType: "kuvvet-hareket" },
  { id: "10-5", month: "EKİM", monthId: "ekim", week: "5. Hafta", dates: "6-10 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Serbest Düşme", learningOutcome: "FİZ.10.1.4. Serbest düşme hareketi yapan cisimlerin ivmesine yönelik tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { id: "10-6", month: "EKİM", monthId: "ekim", week: "6. Hafta", dates: "13-17 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "Serbest Düşme", learningOutcome: "FİZ.10.1.5. Serbest düşme hareketi ile ilgili kanıt kullanabilme", unitType: "kuvvet-hareket" },
  { id: "10-7", month: "EKİM", monthId: "ekim", week: "7. Hafta", dates: "20-24 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "İki Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.6. İki boyutta sabit ivmeli hareket ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
  { id: "10-8", month: "EKİM", monthId: "ekim", week: "8. Hafta", dates: "27-31 Ekim", hours: 2, unit: "KUVVET VE HAREKET", topic: "İki Boyutta Sabit İvmeli Hareket", learningOutcome: "FİZ.10.1.6. Devamı...", unitType: "kuvvet-hareket", specialDays: "29 Ekim Cumhuriyet Bayramı" },
  // KASIM
  { id: "10-9", month: "KASIM", monthId: "kasim", week: "9. Hafta", dates: "3-7 Kasım", hours: 2, unit: "ENERJİ", topic: "İş, Enerji ve Güç", learningOutcome: "FİZ.10.2.1. Kuvvet-yer değiştirme grafiği kullanılarak iş ile ilgili tümevarımsal akıl yürütebilme", unitType: "enerji", specialDays: "Atatürk Haftası" },
  { id: "10-10", month: "KASIM", monthId: "kasim", week: "1. DÖNEM ARA TATİLİ", dates: "10-14 Kasım", hours: 0, isBreak: true, unitType: "break" },
  { id: "10-11", month: "KASIM", monthId: "kasim", week: "10. Hafta", dates: "17-21 Kasım", hours: 2, unit: "ENERJİ", topic: "İş, Enerji ve Güç", learningOutcome: "FİZ.10.2.2. İş, enerji ve güç kavramlarına ilişkin çıkarım yapabilme", unitType: "enerji" },
  { id: "10-12", month: "KASIM", monthId: "kasim", week: "11. Hafta", dates: "24-28 Kasım", hours: 2, unit: "ENERJİ", topic: "Enerji Biçimleri", learningOutcome: "FİZ.10.2.3. Enerji biçimlerini karşılaştırabilme", unitType: "enerji" },
  // ARALIK
  { id: "10-13", month: "ARALIK", monthId: "aralik", week: "12. Hafta", dates: "1-5 Aralık", hours: 2, unit: "ENERJİ", topic: "Enerji Biçimleri", learningOutcome: "FİZ.10.2.3. Devamı...", unitType: "enerji" },
  { id: "10-14", month: "ARALIK", monthId: "aralik", week: "13. Hafta", dates: "8-12 Aralık", hours: 2, unit: "ENERJİ", topic: "Mekanik Enerji", learningOutcome: "FİZ.10.2.4. Mekanik enerjiyi çözümleyebilme", unitType: "enerji" },
  { id: "10-15", month: "ARALIK", monthId: "aralik", week: "14. Hafta", dates: "15-19 Aralık", hours: 2, unit: "ENERJİ", topic: "Mekanik Enerji", learningOutcome: "FİZ.10.2.4. Devamı...", unitType: "enerji" },
  { id: "10-16", month: "ARALIK", monthId: "aralik", week: "15. Hafta", dates: "22-26 Aralık", hours: 2, unit: "ENERJİ", topic: "Enerji Kaynakları", learningOutcome: "FİZ.10.2.5. Yenilenebilen ve yenilenemeyen enerji kaynaklarını karşılaştırabilme", unitType: "enerji" },
  // OCAK
  { id: "10-17", month: "OCAK", monthId: "ocak", week: "16. Hafta", dates: "29 Aralık-2 Ocak", hours: 2, unit: "ELEKTRİK", topic: "Basit Elektrik Devreleri", learningOutcome: "FİZ.10.3.1. Potansiyel fark, akım ve direnç kavramlarına ilişkin analojik akıl yürütebilme", unitType: "elektrik" },
  { id: "10-18", month: "OCAK", monthId: "ocak", week: "17. Hafta", dates: "5-9 Ocak", hours: 2, unit: "ELEKTRİK", topic: "Basit Elektrik Devreleri", learningOutcome: "FİZ.10.3.1. Devamı...", unitType: "elektrik" },
  { id: "10-19", month: "OCAK", monthId: "ocak", week: "18. Hafta", dates: "12-16 Ocak", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { id: "10-20", month: "OCAK", monthId: "ocak", week: "YARIYIL TATİLİ", dates: "19 Ocak - 30 Ocak 2026", hours: 0, isBreak: true, unitType: "break" },
  // ŞUBAT
  { id: "10-21", month: "ŞUBAT", monthId: "subat", week: "19. Hafta", dates: "2-6 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Elektrik Akımı", learningOutcome: "FİZ.10.3.2. Elektrik akımı kavramını çözümleyebilme", unitType: "elektrik" },
  { id: "10-22", month: "ŞUBAT", monthId: "subat", week: "20. Hafta", dates: "9-13 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Ohm Yasası", learningOutcome: "FİZ.10.3.3. Ohm Yasası ile ilgili tümevarımsal akıl yürütebilme", unitType: "elektrik" },
  { id: "10-23", month: "ŞUBAT", monthId: "subat", week: "21. Hafta", dates: "16-20 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Dirençlerin Bağlanması", learningOutcome: "FİZ.10.3.4. Eşdeğer direncin büyüklüğüne ilişkin bilimsel çıkarım yapabilme", unitType: "elektrik" },
  { id: "10-24", month: "ŞUBAT", monthId: "subat", week: "22. Hafta", dates: "23-27 Şubat", hours: 2, unit: "ELEKTRİK", topic: "Dirençlerin Bağlanması", learningOutcome: "FİZ.10.3.4. Devamı...", unitType: "elektrik" },
  // MART
  { id: "10-25", month: "MART", monthId: "mart", week: "23. Hafta", dates: "2-6 Mart", hours: 2, unit: "ELEKTRİK", topic: "Üreteçlerin Bağlanması", learningOutcome: "FİZ.10.3.5. Üreteçlerin bağlanma türüne göre potansiyel fark çıkarımı", unitType: "elektrik" },
  { id: "10-26", month: "MART", monthId: "mart", week: "24. Hafta", dates: "9-13 Mart", hours: 2, unit: "ELEKTRİK", topic: "Üreteçlerin Bağlanması", learningOutcome: "FİZ.10.3.5. Devamı...", unitType: "elektrik" },
  { id: "10-27", month: "MART", monthId: "mart", week: "2. DÖNEM ARA TATİLİ", dates: "16-20 Mart", hours: 0, isBreak: true, unitType: "break" },
  { id: "10-28", month: "MART", monthId: "mart", week: "25. Hafta", dates: "23-27 Mart", hours: 2, unit: "ELEKTRİK", topic: "Elektrik Tehlikeleri", learningOutcome: "FİZ.10.3.6. Elektrik akımının oluşturabileceği tehlikelere karşı önlemler", unitType: "elektrik" },
  { id: "10-29", month: "MART", monthId: "mart", week: "26. Hafta", dates: "30 Mart-3 Nisan", hours: 2, unit: "ELEKTRİK", topic: "Topraklama", learningOutcome: "FİZ.10.3.7. Topraklama olayının önemini sorgulayabilme", unitType: "elektrik" },
  // NİSAN
  { id: "10-30", month: "NİSAN", monthId: "nisan", week: "27. Hafta", dates: "6-10 Nisan", hours: 2, unit: "DALGALAR", topic: "Dalgaların Temel Kavramları", learningOutcome: "FİZ.10.4.1. Dalgaların temel kavramlarına ilişkin operasyonel tanımlama yapabilme", unitType: "dalgalar" },
  { id: "10-31", month: "NİSAN", monthId: "nisan", week: "28. Hafta", dates: "13-17 Nisan", hours: 2, unit: "DALGALAR", topic: "Dalgaların Temel Kavramları", learningOutcome: "FİZ.10.4.1. Devamı...", unitType: "dalgalar" },
  { id: "10-32", month: "NİSAN", monthId: "nisan", week: "29. Hafta", dates: "20-24 Nisan", hours: 2, unit: "DALGALAR", topic: "Yayılma Sürati", learningOutcome: "FİZ.10.4.2. Sınıflandırma / FİZ.10.4.3. Yayılma süratini etkileyen etmenler", unitType: "dalgalar" },
  { id: "10-33", month: "NİSAN", monthId: "nisan", week: "30. Hafta", dates: "27 Nisan-1 Mayıs", hours: 2, unit: "DALGALAR", topic: "Yayılma Sürati", learningOutcome: "FİZ.10.4.3. Devamı...", unitType: "dalgalar" },
  // MAYIS
  { id: "10-34", month: "MAYIS", monthId: "mayis", week: "31. Hafta", dates: "4-8 Mayıs", hours: 2, unit: "DALGALAR", topic: "Periyodik Hareketler", learningOutcome: "FİZ.10.4.4. Periyodik hareketlere ilişkin deneyimlerini yansıtabilme", unitType: "dalgalar" },
  { id: "10-35", month: "MAYIS", monthId: "mayis", week: "32. Hafta", dates: "11-15 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Su dalgalarında yansıma ve kırılma ile ilgili tümevarımsal akıl yürütebilme", unitType: "dalgalar" },
  { id: "10-36", month: "MAYIS", monthId: "mayis", week: "33. Hafta", dates: "18-22 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Devamı...", unitType: "dalgalar" },
  { id: "10-37", month: "MAYIS", monthId: "mayis", week: "34. Hafta", dates: "25-29 Mayıs", hours: 2, unit: "DALGALAR", topic: "Su Dalgalarında Yansıma ve Kırılma", learningOutcome: "FİZ.10.4.5. Devamı...", unitType: "dalgalar" },
  // HAZİRAN
  { id: "10-38", month: "HAZİRAN", monthId: "haziran", week: "35. Hafta", dates: "1-5 Haziran", hours: 2, unit: "DALGALAR", topic: "Rezonans ve Deprem", learningOutcome: "FİZ.10.4.6. Rezonans ve depreme ilişkin kavramlar üzerinden depremi sorgulayabilme", unitType: "dalgalar" },
  { id: "10-39", month: "HAZİRAN", monthId: "haziran", week: "36. Hafta", dates: "8-12 Haziran", hours: 2, unit: "DALGALAR", topic: "Deprem Modeli", learningOutcome: "FİZ.10.4.7. Depremle ilgili bilimsel model oluşturabilme", unitType: "dalgalar" },
  { id: "10-40", month: "HAZİRAN", monthId: "haziran", week: "37. Hafta", dates: "15-19 Haziran", hours: 2, unit: "OKUL TEMELLİ PLANLAMA", topic: "Okul Temelli Planlama", unitType: "okul-temelli" },
  { id: "10-41", month: "HAZİRAN", monthId: "haziran", week: "38. Hafta", dates: "22-26 Haziran", hours: 0, unit: "SOSYAL ETKİNLİK", topic: "Sosyal Etkinlik", unitType: "sosyal" }
];

// Placeholder for future grades
const plan11 = [
    { id: "11-1", month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Newton'un Hareket Yasaları", learningOutcome: "FİZ.11.1.1 Newton Hareket Yasaları ile ilgili tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
];
const plan12 = [
    { id: "12-1", month: "EYLÜL", monthId: "eylul", week: "1. Hafta", dates: "8-12 Eylül", hours: 2, unit: "KUVVET VE HAREKET", topic: "Tork", learningOutcome: "FİZ.12.1.1. Torkun matematiksel modeline yönelik tümevarımsal akıl yürütebilme", unitType: "kuvvet-hareket" },
];

export const fizikPlan = {
  '9': {
    data: plan9,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'fizik-bilimi', label: 'Fizik Bilimi' },
      { id: 'kuvvet-hareket', label: 'Kuvvet ve Hareket' },
      { id: 'akiskanlar', label: 'Akışkanlar' },
      { id: 'enerji', label: 'Enerji' }
    ]
  },
  '10': {
    data: plan10,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
      { id: 'enerji', label: 'Enerji' },
      { id: 'elektrik', label: 'Elektrik' },
      { id: 'dalgalar', label: 'Dalgalar' }
    ]
  },
  '11': {
    data: plan11,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
    ]
  },
  '12': {
    data: plan12,
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'kuvvet-hareket', label: 'Kuvvet' },
    ]
  }
};
