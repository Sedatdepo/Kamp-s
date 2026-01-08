
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Search, BookOpen, Clock, Filter, ArrowRight, Download, CheckCircle, Circle } from 'lucide-react';

// --- YARDIMCI FONKSİYONLAR ---

const turkishToRTF = (text: string | undefined) => {
  if (!text) return "";
  return text.toString()
    .replace(/ğ/g, "\\'f0")
    .replace(/Ğ/g, "\\'d0")
    .replace(/ü/g, "\\'fc")
    .replace(/Ü/g, "\\'dc")
    .replace(/ş/g, "\\'fe")
    .replace(/Ş/g, "\\'de")
    .replace(/ı/g, "\\'fd")
    .replace(/İ/g, "\\'dd")
    .replace(/ö/g, "\\'f6")
    .replace(/Ö/g, "\\'d6")
    .replace(/ç/g, "\\'e7")
    .replace(/Ç/g, "\\'c7")
    .replace(/<br>/g, "\\par ")
    .replace(/\n/g, "\\par ");
};

const downloadDailyPlan = (weekData: any, grade: number) => {
  const processText = weekData.processComponents 
    ? turkishToRTF(weekData.processComponents) 
    : "Konu ile ilgili temel kavramlar a\\'e7\\'fdklan\\'fdr. \\'d6rnek soru \\'e7\\'f6z\\'fcmleri yap\\'fdl\\'fdr.";

  const rtfContent = `{\\rtf1\\ansi\\ansicpg1254\\deff0\\nouicompat\\deflang1055
{\\fonttbl{\\f0\\fnil\\fcharset162 Times New Roman;}{\\f1\\fnil\\fcharset162 Arial;}{\\f2\\fnil\\fcharset162 Calibri;}}
{\\colortbl ;\\red0\\green0\\blue0;\\red255\\green0\\blue0;}
\\viewkind4\\uc1 
\\pard\\sa200\\sl276\\slmult1\\qc\\b\\f0\\fs24 T.C.\\par
M\\'ddLL\\'ce E\\'d0\\'ddT\\'ddM BAKANLI\\'d0I\\par
........................................... L\\'ddSES\\'dd\\par
2025-2026 E\\'d0\\'ddT\\'ddM \\'d6\\'d0RET\\'ddM YILI\\par
G\\'dcNL\\'dcK DERS PLANI\\par
\\pard\\sa200\\sl276\\slmult1\\b0\\fs22\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b\\f1\\fs20 B\\'d6L\\'dcM I: DERS K\\'dcML\\'dd\\'d0\\'dd\\b0\\f0\\fs22\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Dersin Ad\\'fd\\cell F\\'ddZ\\'ddK\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl S\\'fdn\\'fdf / \\'deube\\cell ${grade}. SINIF\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Tarih / Hafta\\cell ${turkishToRTF(weekData.dates)} / ${turkishToRTF(weekData.week)}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\'dcni\\'fete Ad\\'fd\\cell ${turkishToRTF(weekData.unit || "Genel Tekrar")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Konu\\cell ${turkishToRTF(weekData.topic || "Belirtilmemis")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\'d6nerilen S\\'fcre\\cell ${weekData.hours} Ders Saati (40 + 40 Dakika)\\cell\\row
\\pard\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b\\f1\\fs20 B\\'d6L\\'dcM II: E\\'d0\\'ddT\\'ddM - \\'d6\\'d0RET\\'ddM S\\'dcREC\\'dd\\b0\\f0\\fs22\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Kazan\\'fdm (\\'d6\\'f0renme \\'c7\\'fdkt\\'fds\\'fd)\\cell ${turkishToRTF(weekData.learningOutcome || "Belirtilmemis")}\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Y\\'f6ntem ve Teknikler\\cell Anlat\\'fdm, Soru-Cevap, Tart\\'fd\\'fea, G\\'f6sterip Yapt\\'fdrma, Problem \\'c7\\'f6zme, Beyin F\\'fdrta\\'fdnas\\'fd, Deney/G\\'f6zlem\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl Ara\\'e7, Gere\\'e7 ve Materyaller\\cell Ders Kitab\\'fd, Etkile\\'feimli Tahta, EBA, OGM Materyal, Deney Malzemeleri, \\'c7al\\'fd\\'fea Ka\\'f0\\'fdtlar\\'fd\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl K\\'fclt\\'fcr ve De\\'f0erler\\cell Bilimsellik, Sorumluluk, Sab\\'fdr, Do\\'f0ruluk, D\\'fcr\\'fcstl\\'fck, Vatanseverlik, Estetik\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx2500
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl G\\'fcvenlik \\'d6nlemleri\\cell Laboratuvar kullan\\'fdm\\'fd s\\'fdras\\'fdnda elektrik ve cam malzeme g\\'fcvenli\\'f0ine dikkat edilecektir. S\\'fdn\\'fdf i\\'e7i hareketlerde fiziksel mesafeye \\'f6zen g\\'f6sterilecektir.\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b DERSE HAZIRLIK VE G\\'ddR\\'dd\\'de\\b0\\par
\\pard\\li100 1. S\\'fdn\\'fdfa selam verilerek girilir, \\'f6\\'f0rencilerin hal ve hat\\'fdrlar\\'fd sorulur. Yoklama al\\'fdn\\'fdr.\\par
2. S\\'fdn\\'fdf\\'fdn fiziksel ortam\\'fd (\\'fd\\'fe\\'fdk, s\\'fdcakl\\'fdk vb.) derse haz\\'fdr hale getirilir.\\par
3. \\'d6nceki derste i\\'felenen konular k\\'fdsaca soru-cevap y\\'f6ntemiyle hat\\'fdrla\\'fdt\\'fdl\\'fdr.\\par
4. \\'d6\\'f0rencilere "Bug\\'fcn ne \\'f6\\'f0renece\\'f0iz?" sorusu y\\'f6neltilerek dersin kazan\\'fdm\\'fd tahtaya yaz\\'ffl\\'fdr.\\par
5. G\\'fcnl\\'fck hayattan konuyla ilgili bir \\'f6rnek veya problem durumu payla\\'fe\\'fdlarak \\'f6\\'f0rencilerin dikkati \\'e7ekilir ve motivasyonlar\\'fd sa\\'f0lan\\'fdr.\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b GEL\\'dd\\'deME (KONU \\'dd\\'deLEN\\'dd\\'de\\'dd)\\b0\\par
\\pard\\li100 Bu b\\'f6l\\'fcmde T\\'fcrkiye Y\\'fczy\\'fdl\\'fd Maarif Modeli \\'e7er\\'e7evesinde a\\'fea\\'f0\\'fddaki s\\'fcre\\'e7 bile\\'feenleri takip edilecektir:\\par
\\par
${processText}\\par
\\par
1. Konunun temel kavramlar\\'fd etkile\\'feimli tahta veya sunum arac\\'fdl\\'fd\\'f0\\'fdyla g\\'f6rsellerle desteklenerek a\\'e7\\'fdklan\\'fdr.\\par
2. Varsa form\\'fcller ve matematiksel modeller t\\'fcretilir, birim analizleri yap\\'fdl\\'fdr.\\par
3. Anla\\'fe\\'fdlmay\\'fd kolayla\\'fet\\'fdrmak i\\'e7in analojiler ve modeller kullan\\'fdl\\'fdr.\\par
4. Konuyla ilgili \\'f6rnek sorular \\'f6nce \\'f6\\'f0retmen taraf\\'fdndan, sonra \\'f6\\'f0rencilerle birlikte \\'e7\\'f6z\\'fcl\\'fcr.\\par
5. Anla\\'fe\\'fdlmayan noktalar i\\'e7in \\'f6\\'f0rencilere s\\'f6z hakk\\'fd verilir ve geri bildirim sa\\'f0lan\\'fdr.\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl \\b SONU\\'c7 VE DE\\'d0ERLEND\\'ddRME\\b0\\par
\\pard\\li100 1. Dersin sonunda konu k\\'fdsaca \\'f6zetlenir.\\par
2. Kazan\\'fdm\\'fdn ger\\'e7ekle\\'feip ger\\'e7ekle\\'femedi\\'f0ini anlamak i\\'e7in s\\'fdn\\'fdfa 2-3 adet k\\'fdsa cevapl\\'fd soru sorulur.\\par
3. Gelecek derste i\\'felecek konu hakk\\'fdnda k\\'fdsa bilgi verilerek derse haz\\'fdrl\\'fdkl\\'fd gelmeleri istenir.\\par
4. Varsa ders kitab\\'fdndan ilgili b\\'f6l\\'fcmdeki sorular \\'f6dev olarak verilir.\\cell\\row
\\pard\\par
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\b\\f1\\fs20 B\\'d6L\\'dcM III: ONAMA\\b0\\f0\\fs22\\cell\\row
\\trowd\\trgaph108\\trleft-108
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx4750
\\clbrdrt\\brdrs\\brdrw10 \\clbrdrl\\brdrs\\brdrw10 \\clbrdrb\\brdrs\\brdrw10 \\clbrdrr\\brdrs\\brdrw10 \\cellx9500
\\pard\\intbl\\qc DERS \\'d6\\'d0RETMEN\\'dd\\par
\\par
\\par
(\\'ddmza)\\cell OKUL M\\'dcD\\'dcR\\'dc\\par
\\par
\\par
(\\'ddmza)\\cell\\row
\\pard\\par
}`;

  const blob = new Blob([rtfContent], { type: 'application/rtf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Fizik_${grade}_Sinif_Gunluk_Plan_${weekData.week.replace(/\s/g, "_")}.rtf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- VERİ SETLERİ ---

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

export default function KazanımlarTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [activeGrade, setActiveGrade] = useState(9);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [completedWeeks, setCompletedWeeks] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('physicsPlanCompleted');
    if (saved) {
      setCompletedWeeks(JSON.parse(saved));
    }
  }, []);

  const toggleCompletion = (weekId: string) => {
    const newCompleted = completedWeeks.includes(weekId)
      ? completedWeeks.filter(id => id !== weekId)
      : [...completedWeeks, weekId];
    
    setCompletedWeeks(newCompleted);
    localStorage.setItem('physicsPlanCompleted', JSON.stringify(newCompleted));
  };

  const calculateProgress = () => {
    const currentData = activeGrade === 9 ? plan9 : plan10;
    const totalWeeks = currentData.filter(w => !w.isBreak).length;
    if (totalWeeks === 0) return 0;
    const completedCount = currentData.filter(w => !w.isBreak && completedWeeks.includes(w.id)).length;
    return Math.round((completedCount / totalWeeks) * 100);
  };

  const progress = calculateProgress();

  const gradeConfig: any = {
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

  const filteredWeeks = useMemo(() => {
    const currentData = gradeConfig[activeGrade].data;
    
    return currentData.filter((week: any) => {
      if (activeMonth !== 'all' && week.monthId !== activeMonth) return false;
      if (activeFilter !== 'all' && week.unitType !== activeFilter && !['break', 'okul-temelli', 'sosyal'].includes(week.unitType)) return false;

      if (searchTerm) {
        const text = `${week.unit || ''} ${week.topic || ''} ${week.learningOutcome || ''} ${week.processComponents || ''} ${week.specialDays || ''} ${week.week || ''}`.toLowerCase();
        if (!text.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  }, [activeGrade, activeFilter, activeMonth, searchTerm, gradeConfig]);

  const getAccentColor = (unitType: string) => {
    const colors: { [key: string]: string } = {
      'fizik-bilimi': 'border-amber-500', 'kuvvet-hareket': 'border-red-500', 'akiskanlar': 'border-sky-500',
      'enerji': 'border-emerald-500', 'elektrik': 'border-blue-500', 'dalgalar': 'border-purple-500',
      'okul-temelli': 'border-violet-500', 'sosyal': 'border-pink-500', 'break': 'border-yellow-400'
    };
    return colors[unitType] || 'border-slate-300';
  };

  const getBadgeColor = (unitType: string) => {
    const colors: { [key: string]: string } = {
      'fizik-bilimi': 'bg-amber-500', 'kuvvet-hareket': 'bg-red-500', 'akiskanlar': 'bg-sky-500',
      'enerji': 'bg-emerald-500', 'elektrik': 'bg-blue-500', 'dalgalar': 'bg-purple-500',
      'okul-temelli': 'bg-violet-500', 'sosyal': 'bg-pink-500'
    };
    return colors[unitType] || 'bg-slate-500';
  };

  const getBackgroundColor = (unitType: string, isBreak: boolean) => {
    if (isBreak) return 'bg-yellow-50';
    if (unitType === 'okul-temelli') return 'bg-violet-50';
    if (unitType === 'sosyal') return 'bg-pink-50';
    return 'bg-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-full mx-auto">
        
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 mb-2 tracking-tight">
            Fizik Dersi Yıllık Planı
          </h1>
          <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200 text-slate-600 font-medium">
            2025-2026 Eğitim-Öğretim Yılı
          </div>
        </header>

        <div className="flex justify-center gap-4 mb-8">
          {[9, 10].map((grade) => (
            <button
              key={grade}
              onClick={() => { setActiveGrade(grade); setActiveFilter('all'); }}
              className={`px-8 py-3 rounded-xl font-bold transition-all shadow-sm border-2 ${activeGrade === grade ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform -translate-y-0.5' : 'bg-white text-slate-500 border-transparent hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              {grade}. Sınıf
            </button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-600">Yıllık İlerleme Durumu</span>
            <span className="text-sm font-bold text-indigo-600">%{progress} Tamamlandı</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-4 z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              {gradeConfig[activeGrade].filters.map((filter: any) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border ${activeFilter === filter.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-transparent text-slate-500 border-slate-200 hover:border-indigo-500 hover:text-indigo-600'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

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

        <div className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory">
          {filteredWeeks.length > 0 ? (
            filteredWeeks.map((week, index) => {
              const isCompleted = completedWeeks.includes(week.id);
              
              return (
              <div 
                key={index}
                className={`flex-none w-[90vw] md:w-[400px] snap-center relative rounded-xl p-6 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-lg border-l-4 ${getAccentColor(week.unitType)} ${getBackgroundColor(week.unitType, week.isBreak)} ${isCompleted ? 'border-slate-300 opacity-70' : 'border-slate-200'}`}
              >
                {!week.isBreak && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCompletion(week.id); }}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isCompleted ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-slate-50'}`}
                    title={isCompleted ? "Tamamlandı olarak işaretlendi" : "Tamamlandı olarak işaretle"}
                  >
                    {isCompleted ? <CheckCircle size={24} fill="currentColor" className="text-emerald-500" /> : <Circle size={24} />}
                  </button>
                )}

                <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded mb-3 border border-slate-200">
                  {week.month}
                </span>

                <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className={`text-xl font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{week.week}</h3>
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

                <div className="space-y-4">
                  {(week.unit || week.topic) && (
                    <div>
                      {week.unit && (
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wide text-white mb-2 ${getBadgeColor(week.unitType)}`}>
                          {week.unit}
                        </span>
                      )}
                      {week.topic && (
                        <div className={`text-lg font-semibold leading-tight ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>
                          {week.topic}
                        </div>
                      )}
                    </div>
                  )}

                  {week.learningOutcome && (
                    <div className="bg-white/50 border border-slate-200 p-4 rounded-lg">
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
                    <button 
                      onClick={() => downloadDailyPlan(week, activeGrade)}
                      className="w-full mt-4 pt-4 border-t border-slate-100 text-center text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors flex items-center justify-center gap-2 group"
                    >
                      <Download size={16} className="group-hover:scale-110 transition-transform" /> 
                      Günlük Planı İndir (.rtf)
                    </button>
                  )}
                </div>
              </div>
            )})
          ) : (
            <div className="flex-1 text-center py-16 bg-white rounded-xl border border-slate-200 text-slate-400">
              <p className="text-lg font-medium">Aradığınız kriterlere uygun sonuç bulunamadı.</p>
            </div>
          )}
        </div>
        
        <div className="text-center text-slate-400 text-xs font-medium mt-2 flex items-center justify-center gap-2 md:hidden animate-pulse">
          Kaydır <ArrowRight size={12} />
        </div>

        <footer className="mt-12 text-center text-slate-400 text-sm border-t border-slate-200 pt-6 pb-8">
          <p>Türkiye Yüzyılı Maarif Modeli Çerçevesinde Hazırlanmıştır</p>
          <p>© 2025-2026 Eğitim-Öğretim Yılı</p>
        </footer>
      </div>
    </div>
  );
}
