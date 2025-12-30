
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection, addDoc, deleteDoc, query, getDocs, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/hooks/useFirestore';
import { Class, Homework, TeacherProfile, Student, Submission, HomeworkDocument } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Atom, FileText, Video, Mic, Paperclip, CheckCircle, GraduationCap, Filter, Send, ClipboardList, X, Plus, Trash2, Save, Edit, Pencil, PlusCircle, Calendar, Users, Clock, Search, Heart, Bell, History, Printer, BarChart3, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { exportHomeworkStatusToRtf } from '@/lib/word-export';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { useDatabase } from '@/hooks/use-database';
import { RecordManager } from './RecordManager';

// --- ÖDEV KÜTÜPHANESİ ---

const initialRubricDefinitions = {
  research: {
    title: "Araştırma ve Yazma Rubriği",
    description: "Makale, Rapor, Hikaye, Deneme türü ödevler için standart değerlendirme.",
    items: [
      { label: "İçerik Doğruluğu ve Zenginliği", score: 40, desc: "Konu tam ve doğru anlatılmış mı? Bilgi eksikliği var mı?" },
      { label: "Dil ve Anlatım (İmla/Noktalama)", score: 20, desc: "Yazım kurallarına uyulmuş mu? Akıcı bir dil kullanılmış mı?" },
      { label: "Özgünlük ve Yorum", score: 20, desc: "Kopya içerik var mı? Öğrenci kendi yorumunu katmış mı?" },
      { label: "Düzen ve Kaynakça", score: 20, desc: "Sayfa düzeni temiz mi? Yararlanılan kaynaklar belirtilmiş mi?" }
    ]
  },
  multimedia: {
    title: "Multimedya ve Sunum Rubriği",
    description: "Video, Ses Kaydı, Animasyon türü ödevler için standart değerlendirme.",
    items: [
      { label: "İçerik ve Konuya Hakimiyet", score: 30, desc: "Videoda anlatılan bilgiler doğru ve konuyla ilgili mi?" },
      { label: "Yaratıcılık ve Kurgu", score: 30, desc: "Senaryo özgün mü? İlgi çekici bir kurgu var mı?" },
      { label: "İletişim ve Diksiyon", score: 20, desc: "Ses net anlaşılıyor mu? Akıcı bir anlatım var mı?" },
      { label: "Teknik Kalite (Görüntü/Ses)", score: 20, desc: "Görüntü net mi? Ses cızırtılı mı? Süreye uyulmuş mu?" }
    ]
  },
  visual: {
    title: "Görsel Tasarım Rubriği",
    description: "Poster, İnfografik, Dergi Kapağı türü ödevler için standart değerlendirme.",
    items: [
      { label: "Görsel Düzen ve Estetik", score: 30, desc: "Renk uyumu, yerleşim ve okunabilirlik iyi mi?" },
      { label: "Konuyu Görselleştirme", score: 30, desc: "Görseller konuyla alakalı mı? Mesajı doğru iletiyor mu?" },
      { label: "Yaratıcılık", score: 20, desc: "Sıradan görseller yerine özgün tasarımlar kullanılmış mı?" },
      { label: "Özen ve Emek", score: 20, desc: "Tasarım detaylarına dikkat edilmiş mi? Baştan savma mı?" }
    ]
  }
};

const getRubricType = (formats: string) => {
  if (formats.includes("Video") || formats.includes("MP4") || formats.includes("Ses") || formats.includes("MP3")) return 'multimedia';
  if (formats.includes("Canva") || formats.includes("JPG") || formats.includes("Poster") || formats.includes("Fotoğraf") || formats.includes("Görsel")) return 'visual';
  return 'research';
};

const assignmentsData = [
  // --- 9. SINIF EDEBİYAT ---
  { id: 901, grade: 9, subject: "literature", title: "Sözün İnceliği: Şiir Tahlili", description: "Bir şiirin ahenk unsurlarını analiz etme.", instructions: "Temaya uygun bir şiir seç. Kafiye, redif ve söz sanatlarını gösteren renkli bir tablo hazırla.", formats: "PDF, Word", size: "5 MB" },
  { id: 902, grade: 9, subject: "literature", title: "Deneme Yazarlığı Atölyesi", description: "Öznel düşüncelerin anlatıldığı deneme yazısı.", instructions: "'Dil ve Kültür' konusunda, 500 kelimelik samimi bir deneme yaz.", formats: "Word", size: "2 MB" },
  { id: 903, grade: 9, subject: "literature", title: "Dilin Zenginliği: Dijital Sözlük", description: "Yöresel kelimelerden oluşan görsel sözlük.", instructions: "Aile büyüklerinden 15 yöresel kelime derle, her biri için görsel içeren bir sözlük sayfası yap.", formats: "Canva Link", size: "10 MB" },
  { id: 904, grade: 9, subject: "literature", title: "Otobiyografi Sunumu", description: "Kendi yaşam öyküsünü görsel sunumla anlatma.", instructions: "Hayatını kronolojik sırayla anlatan, fotoğraflarla desteklenmiş bir sunum hazırla.", formats: "PPTX", size: "20 MB" },
  { id: 905, grade: 9, subject: "literature", title: "Şiir Dinletisi Videosu", description: "Şiir okuma ve vurgu/tonlama becerisi.", instructions: "Bir şiiri fon müziği eşliğinde seslendir ve uygun videolarla klip yap.", formats: "MP4", size: "50 MB" },
  { id: 906, grade: 9, subject: "literature", title: "Bağdaşıklık Analizi", description: "Metindeki bağlaç ve gönderimlerin analizi.", instructions: "Seçtiğin metindeki bağlaçları ve gönderimleri bularak metnin tutarlılığını nasıl sağladığını raporla.", formats: "PDF", size: "3 MB" },
  { id: 907, grade: 9, subject: "literature", title: "Tarih ve Edebiyat İlişkisi", description: "Tarihi bir romanın gerçeklikle ilişkisi.", instructions: "Tarihi bir romanı incele. Hangi olaylar gerçek, hangileri kurgu? Tablo halinde göster.", formats: "Word", size: "4 MB" },
  { id: 908, grade: 9, subject: "literature", title: "Türkçe Dedektifi", description: "Çevredeki Türkçe hatalarının tespiti.", instructions: "Tabelalardaki veya sosyal medyadaki 10 Türkçe hatasını fotoğrafla, doğrularını yaz.", formats: "PPTX", size: "15 MB" },
  { id: 909, grade: 9, subject: "literature", title: "Yazar Tanıtım Kartı", description: "Bir yazarın hayatının infografik ile anlatımı.", instructions: "Sevdiğin bir yazar için 'Instagram Profili' tarzında tanıtım kartı hazırla.", formats: "JPG", size: "5 MB" },
  { id: 910, grade: 9, subject: "literature", title: "Masal Kahramanı Tasarımı", description: "Yeni bir masal kahramanı yaratma.", instructions: "Olağanüstü özellikleri olan bir kahraman çiz ve özelliklerini yaz.", formats: "PDF, Çizim", size: "8 MB" },
  { id: 921, grade: 9, subject: "literature", title: "Hikaye Haritası Çıkarma", description: "Okunan bir hikayenin yapı unsurlarını şematize etme.", instructions: "Bir hikayenin serim, düğüm, çözüm bölümlerini ve mekan/zaman/kişi kadrosunu bir harita üzerinde göster.", formats: "Görsel (JPG)", size: "5 MB" },
  { id: 922, grade: 9, subject: "literature", title: "Deyimler ve Atasözleri", description: "Deyimlerin gerçek ve mecaz anlamlarını görselleştirme.", instructions: "5 deyimi seç. Hem gerçek anlamını (komik bir şekilde) hem de mecaz anlamını çizin.", formats: "PDF", size: "10 MB" },
  { id: 923, grade: 9, subject: "literature", title: "İletişim Şeması", description: "Günlük bir diyaloğun iletişim ögelerine ayrılması.", instructions: "Arkadaşınla yaptığın bir konuşmayı yaz. Gönderici, alıcı, ileti, dönüt, bağlam unsurlarını göster.", formats: "Word", size: "2 MB" },
  { id: 924, grade: 9, subject: "literature", title: "Kütüphane Araştırması", description: "Bilgi kaynaklarını kullanma becerisi.", instructions: "Okul veya ilçe kütüphanesine git. Katalog taraması nasıl yapılır, aradığın kitap nasıl bulunur? Süreci fotoğrafla anlat.", formats: "PPTX", size: "15 MB" },
  { id: 925, grade: 9, subject: "literature", title: "Mektup Arkadaşlığı", description: "Edebi mektup türünde yazma çalışması.", instructions: "Roman kahramanına veya gelecekteki kendine edebi bir dille mektup yaz.", formats: "Word", size: "3 MB" },
  { id: 931, grade: 9, subject: "literature", title: "Sosyal Medya Dili Analizi", description: "TDE4.3.5. Türkçe dil yapıları.", instructions: "Sosyal medyada kullanılan kısaltmaları (slm, nbr) ve bozuk cümleleri tespit et. Bu kullanımın iletişim üzerindeki etkisini anlatan bir deneme yaz.", formats: "Word", size: "3 MB" },
  { id: 932, grade: 9, subject: "literature", title: "Empati Günlüğü", description: "TDE2.1. İletişim ve Anlama.", instructions: "Bir gün boyunca ailenden birinin (anne/baba) yerine geçtiğini hayal et. O gün yaşananlara onların gözünden bakan bir günlük sayfası yaz.", formats: "PDF", size: "2 MB" },
  { id: 933, grade: 9, subject: "literature", title: "Reklam Sloganları İncelemesi", description: "Dilin işlevleri.", instructions: "TV veya internetteki 5 reklam sloganını seç. Dilin hangi işlevde (Alıcıyı harekete geçirme vb.) kullanıldığını analiz et.", formats: "PPTX", size: "5 MB" },
  { id: 934, grade: 9, subject: "literature", title: "Şehir Efsaneleri Araştırması", description: "Sözlü kültür ürünleri.", instructions: "Yaşadığın semtte anlatılan gizemli bir hikayeyi veya efsaneyi büyüklerinden dinle, yazıya dök ve 'Masal/Efsane' farkını belirt.", formats: "Word", size: "3 MB" },
  { id: 935, grade: 9, subject: "literature", title: "Kendi Şiir Antolojim", description: "Şiir zevki ve temalar.", instructions: "'Umut' veya 'Doğa' temalı, sevdiğin 5 şiiri seçerek dijital bir şiir defteri (antoloji) oluştur. Neden seçtiğini altına not düş.", formats: "Canva/PDF", size: "10 MB" },

  // --- 9. SINIF FİZİK ---
  { id: 911, grade: 9, subject: "physics", title: "Kariyer Keşfi", description: "Fizik ile ilgili mesleklerin araştırılması.", instructions: "Fizikle ilgili 3 mesleği (Makine Müh., Radyoloji vb.) ve çalışma alanlarını sun.", formats: "PPTX", size: "15 MB" },
  { id: 912, grade: 9, subject: "physics", title: "Bilim Merkezleri", description: "CERN, NASA, TÜBİTAK projeleri.", instructions: "CERN veya TÜBİTAK'ın güncel bir projesini araştır, insanlığa faydasını raporla.", formats: "PDF", size: "5 MB" },
  { id: 913, grade: 9, subject: "physics", title: "Özkütle Posteri", description: "Özkütlenin günlük hayattaki yeri.", instructions: "Kuyumculuk veya porselen yapımında özkütlenin önemini anlatan poster hazırla.", formats: "Canva", size: "10 MB" },
  { id: 914, grade: 9, subject: "physics", title: "Dayanıklılık Videosu", description: "Boyut değişiminin dayanıklılığa etkisi.", instructions: "Karınca ve fil örneği üzerinden kesit alanı/hacim ilişkisini anlatan video çek.", formats: "MP4", size: "40 MB" },
  { id: 915, grade: 9, subject: "physics", title: "Kılcallık Deneyi", description: "Adezyon-Kohezyon gözlemi.", instructions: "Peçetenin suyu emmesi veya renkli suyla çiçek boyama deneyi yap, videoya çek.", formats: "MP4", size: "50 MB" },
  { id: 916, grade: 9, subject: "physics", title: "Hareket Grafiği", description: "Konum-Zaman grafiği çizimi.", instructions: "Okuldan eve yolculuğunu hayali bir Hız-Zaman grafiğine dök ve yorumla.", formats: "PDF", size: "3 MB" },
  { id: 917, grade: 9, subject: "physics", title: "Sürtünme Yaşamdır", description: "Sürtünme kuvvetinin önemi.", instructions: "Sürtünme olmasaydı hayatımızda neler imkansız olurdu? 5 örnekle sun.", formats: "PPTX", size: "8 MB" },
  { id: 918, grade: 9, subject: "physics", title: "Yeşil Enerji Projesi", description: "Yenilenebilir enerji kullanımı.", instructions: "Yaşadığın bölge için en uygun yenilenebilir enerji kaynağını belirle ve proje taslağı hazırla.", formats: "Word", size: "5 MB" },
  { id: 919, grade: 9, subject: "physics", title: "Isı Yayılma Yolları", description: "İletim, konveksiyon, ışıma.", instructions: "Termos, kalorifer ve Güneş'in ısı yayma prensiplerini çizerek karşılaştır.", formats: "JPG", size: "6 MB" },
  { id: 920, grade: 9, subject: "physics", title: "Yalıtım Malzemeleri", description: "Isı iletim hızı deneyi.", instructions: "Metal ve tahta kaşığın ısıyı nasıl farklı ilettiğini basit bir deneyle göster.", formats: "Video", size: "20 MB" },
  { id: 926, grade: 9, subject: "physics", title: "SI Birim Sistemi", description: "Uluslararası birimlerin önemi.", instructions: "Temel büyüklükleri (Uzunluk, Kütle, Zaman vb.) ve birimlerini gösteren bir pano hazırla. Mars Climate Orbiter kazasını araştır.", formats: "Poster (JPG)", size: "5 MB" },
  { id: 927, grade: 9, subject: "physics", title: "Enerji Verimliliği Etiketi", description: "Ev aletlerindeki enerji etiketlerini okuma.", instructions: "Buzdolabı veya çamaşır makinesi üzerindeki enerji etiketini fotoğrafla. A+++ ne anlama geliyor araştır.", formats: "PDF", size: "3 MB" },
  { id: 928, grade: 9, subject: "physics", title: "Plazma Hali", description: "Maddenin 4. hali plazmanın araştırılması.", instructions: "Plazma nedir? Floresan lamba, neon ışıklar ve auroralar (Kutup ışıkları) üzerinden açıkla.", formats: "PPTX", size: "10 MB" },
  { id: 929, grade: 9, subject: "physics", title: "Yerli ve Milli Teknolojiler", description: "Mühendislik projelerinin fiziksel temelleri.", instructions: "TOGG veya İHA'ların aerodinamik yapısını veya batarya teknolojisini fiziksel açıdan incele.", formats: "Video Sunum", size: "30 MB" },
  { id: 930, grade: 9, subject: "physics", title: "Küresel Isınma ve Fizik", description: "Sera etkisinin fiziksel açıklaması.", instructions: "Atmosferin ısıyı tutma prensibini (Sera Etkisi) bir şema ile çiz ve çözüm önerileri sun.", formats: "PDF", size: "4 MB" },
  { id: 936, grade: 9, subject: "physics", title: "Mutfakta Isı Transferi", description: "FİZ.9.4.5. Isı aktarım yolları.", instructions: "Yemek yaparken tencerenin ısınması (iletim), suyun kaynaması (konveksiyon) ve fırının pişirmesi (ışıma) olaylarını mutfaktan fotoğraflarla anlat.", formats: "Görsel Sunum", size: "15 MB" },
  { id: 937, grade: 9, subject: "physics", title: "Su Faturası Tasarrufu", description: "Fiziksel büyüklükler ve ölçüm.", instructions: "Evdeki su sayacını 24 saat arayla oku. Günlük tüketimi hesapla ve tasarruf için 3 fiziksel çözüm (Debi kısıtlayıcı vb.) öner.", formats: "Rapor", size: "2 MB" },
  { id: 938, grade: 9, subject: "physics", title: "Kışlık Montların Fiziği", description: "Isı yalıtımı.", instructions: "Kışın neden kat kat giyiniriz veya kuş tüyü mont giyeriz? Havanın ısı iletkenliğini araştırarak açıkla.", formats: "PDF", size: "4 MB" },
  { id: 939, grade: 9, subject: "physics", title: "Doğa Yürüyüşü ve Sürtünme", description: "Sürtünme kuvveti.", instructions: "Farklı zeminlerde (çim, asfalt, toprak) yürürken ayakkabının kayma durumunu incele. Sürtünme katsayısının günlük hayattaki önemini videoda anlat.", formats: "Video", size: "30 MB" },
  { id: 940, grade: 9, subject: "physics", title: "Piknik Termosu Testi", description: "Isı yalıtım deneyi.", instructions: "Bir termosa sıcak su koy. 1'er saat arayla sıcaklığını ölç. Termosun iç yapısının (vakum, parlak yüzey) ısıyı nasıl koruduğunu şematize et.", formats: "Excel/Grafik", size: "5 MB" },

  // --- 10. SINIF EDEBİYAT ---
  { id: 1001, grade: 10, subject: "literature", title: "Divan'dan Sesleniş: Gazel Şerhi", description: "Seçilen bir gazelin günümüz diliyle yorumlanması.", instructions: "Fuzuli, Baki veya Nedim'den bir gazel seçerek beyit beyit günümüz Türkçesine çevirin ve ana temasını açıklayan bir kompozisyon yazın.", formats: "Word", size: "3 MB" },
  { id: 1002, grade: 10, subject: "literature", title: "Halkın Sesi: Mani Derlemesi", description: "Çevreden veya aile büyüklerinden mani derleme.", instructions: "Çevrenizden en az 10 farklı mani derleyerek bir video kaydı oluşturun. Manilerin temalarını (aşk, hasret, gurbet vb.) sınıflandırın.", formats: "Video, MP4", size: "50 MB" },
  { id: 1003, grade: 10, subject: "literature", title: "Mesnevi'den Hikmetler", description: "Mevlana'nın Mesnevi'sinden bir hikayeyi analiz etme.", instructions: "Mesnevi'den seçtiğiniz bir hikayeyi okuyun. Hikayenin ana fikrini ve içerdiği alegorik (sembolik) anlamları açıklayan bir sunum hazırlayın.", formats: "Canva, PDF", size: "8 MB" },
  { id: 1004, grade: 10, subject: "literature", title: "Modern Karagöz", description: "Geleneksel tiyatro güncellemesi.", instructions: "Güncel bir konu (örneğin sosyal medya) hakkında kısa bir Karagöz ve Hacivat diyaloğu yazın. Mümkünse basit figürlerle bu oyunu canlandırıp videosunu çekin.", formats: "Word, Video", size: "40 MB" },
  { id: 1005, grade: 10, subject: "literature", title: "Destan Kahramanı: Modern Bir Oğuz Kağan", description: "Oğuz Kağan Destanı'ndaki motifleri modern bir hikayeye uyarlama.", instructions: "Oğuz Kağan Destanı'ndaki olağanüstü doğum, ışık motifi gibi unsurları kullanarak günümüzde geçen bir süper kahraman hikayesi yazın.", formats: "Word", size: "5 MB" },
  { id: 1006, grade: 10, subject: "literature", title: "Koşma ve Semai Farkları", description: "Halk şiiri nazım biçimlerini karşılaştırma.", instructions: "Aşık Veysel'den bir koşma ve bir semai bularak bu iki şiiri; ölçü, kafiye şeması, konu ve dil bakımından karşılaştıran bir tablo hazırlayın.", formats: "PDF, Word", size: "2 MB" },
  { id: 1007, grade: 10, subject: "literature", title: "Nasreddin Hoca Fıkrası Analizi", description: "Bir Nasreddin Hoca fıkrasındaki mizah ve hiciv unsurlarını bulma.", instructions: "Seçtiğiniz bir Nasreddin Hoca fıkrasını anlatın ve fıkradaki nükteyi, eleştiriyi ve verilmek istenen dersi açıklayan bir metin yazın.", formats: "Word", size: "2 MB" },
  { id: 1008, grade: 10, subject: "literature", title: "Orta Oyunu Karakterleri Posteri", description: "Orta oyunundaki Pişekar ve Kavuklu tiplerini tanıtma.", instructions: "Pişekar ve Kavuklu'nun kostüm, konuşma özellikleri ve oyundaki rollerini anlatan görsel bir poster hazırlayın.", formats: "Poster, JPG", size: "12 MB" },
  { id: 1009, grade: 10, subject: "literature", title: "İlahi ve Nefes: Tasavvufi Şiir", description: "Yunus Emre'den bir ilahi ile Pir Sultan Abdal'dan bir nefesi karşılaştırma.", instructions: "Yunus Emre'den bir ilahi ve Pir Sultan Abdal'dan bir nefes bularak bu iki şiiri tema, dil ve temsil ettikleri inanç sistemi açısından karşılaştırın.", formats: "Word", size: "4 MB" },
  { id: 1010, grade: 10, subject: "literature", title: "Efsane Derleme", description: "Yaşanılan bölgeye ait bir efsaneyi araştırma ve kaydetme.", instructions: "Şehrinizle veya bölgenizle ilgili bir efsaneyi (Kız Kulesi Efsanesi, Sarıkız Efsanesi vb.) araştırın, farklı kaynaklardan derleyerek kendi üslubunuzla yeniden yazın.", formats: "PDF", size: "3 MB" },

  // --- 10. SINIF FİZİK ---
  { id: 1011, grade: 10, subject: "physics", title: "Sabit Hız Analizi", description: "Hareket deneyi.", instructions: "Oyuncak bir arabanın sabit hızla gidişini videoya çek, konum-zaman grafiğini çiz.", formats: "Video", size: "30 MB" },
  { id: 1012, grade: 10, subject: "physics", title: "Katı Basıncı Tasarımı", description: "Basınç teknolojileri.", instructions: "Kar ayakkabısı veya çivili kramponun basıncı nasıl değiştirdiğini açıkla.", formats: "PPTX", size: "10 MB" },
  { id: 1013, grade: 10, subject: "physics", title: "Hidrolik Sistem Modeli", description: "Pascal prensibi uygulaması.", instructions: "Şırıngalarla basit bir hidrolik kepçe veya asansör modeli yap.", formats: "MP4", size: "50 MB" },
  { id: 1014, grade: 10, subject: "physics", title: "Gemi Nasıl Yüzer?", description: "Kaldırma kuvveti prensibi.", instructions: "Çelikten yapılan gemilerin neden batmadığını Arşimet prensibiyle sun.", formats: "PDF", size: "8 MB" },
  { id: 1015, grade: 10, subject: "physics", title: "Devre Simülasyonu", description: "Seri-Paralel devreler.", instructions: "PhET ile devre kur. Seri ve paralel lambaların parlaklığını kıyasla.", formats: "Ekran Görüntüsü", size: "5 MB" },
  { id: 1016, grade: 10, subject: "physics", title: "Manyetik Alan Çizimi", description: "Mıknatıs etkileşimleri.", instructions: "İki mıknatısın itme/çekme alan çizgilerini çiz. Pusula neden kuzeyi gösterir?", formats: "JPG", size: "4 MB" },
  { id: 1017, grade: 10, subject: "physics", title: "Dalga Leğeni Deneyi", description: "Su dalgalarında kırılma.", instructions: "Tepside suyun derinliğini değiştirerek dalganın hız değişimini gözlemle.", formats: "Rapor", size: "5 MB" },
  { id: 1018, grade: 10, subject: "physics", title: "Rezonans ve Deprem", description: "Yıkıcı etkinin fiziği.", instructions: "Rezonans nedir? Binalar neden yıkılır? Tacoma Köprüsü örneğiyle anlat.", formats: "Video", size: "20 MB" },
  { id: 1019, grade: 10, subject: "physics", title: "Deprem Eylem Planı", description: "Afet bilinci.", instructions: "Ailen için deprem planı ve çantası hazırla. Malzemelerin fiziksel işlevini yaz.", formats: "Fotoğraf", size: "10 MB" },
  { id: 1020, grade: 10, subject: "physics", title: "Müzik ve Fizik", description: "Ses dalgaları analizi.", instructions: "Bir enstrümanda sesin inceliğinin (frekans) neye bağlı olduğunu göster.", formats: "Video", size: "40 MB" },

  // --- 11. SINIF EDEBİYAT ---
  { id: 1101, grade: 11, subject: "literature", title: "Tarihi Gazete Manşeti", description: "Tanzimat dönemi gazeteciliği.", instructions: "Namık Kemal adına 'Hürriyet' temalı bir gazete sayfası tasarla.", formats: "Canva", size: "8 MB" },
  { id: 1102, grade: 11, subject: "literature", title: "Makale Analizi", description: "Bilimsel metin incelemesi.", instructions: "Bir makalenin tezini, kanıtlarını ve sonucunu analiz et.", formats: "Word", size: "3 MB" },
  { id: 1103, grade: 11, subject: "literature", title: "Sohbet Yazısı", description: "Samimi anlatım türü.", instructions: "'Gençlik ve Gelecek' üzerine okuyucuyla konuşur gibi bir yazı yaz.", formats: "Word", size: "2 MB" },
  { id: 1104, grade: 11, subject: "literature", title: "Köşe Yazısı (Fıkra)", description: "Güncel sorun eleştirisi.", instructions: "Trafik veya çevre kirliliği hakkında iğneleyici bir köşe yazısı yaz.", formats: "PDF", size: "2 MB" },
  { id: 1105, grade: 11, subject: "literature", title: "Servet-i Fünun Kolajı", description: "Dönem ruhunu görselleştirme.", instructions: "Dönemin karamsar, sisli havasını yansıtan bir görsel kolaj yap.", formats: "JPG", size: "12 MB" },
  { id: 1106, grade: 11, subject: "literature", title: "Milli Hikaye Yazımı", description: "Ömer Seyfettin tarzı.", instructions: "Anadolu'da geçen, sade dilli ve milli duygulu bir hikaye yaz.", formats: "Word", size: "4 MB" },
  { id: 1107, grade: 11, subject: "literature", title: "Röportaj Projesi", description: "Mülakat tekniği.", instructions: "Bir esnaf veya dedenle röportaj yap, metne dök.", formats: "Word", size: "5 MB" },
  { id: 1108, grade: 11, subject: "literature", title: "Film/Kitap Eleştirisi", description: "Eleştiri türü uygulaması.", instructions: "Son izlediğin filmi kurgu, oyunculuk ve senaryo açısından eleştir.", formats: "PDF", size: "3 MB" },
  { id: 1109, grade: 11, subject: "literature", title: "Cümle Ögeleri", description: "Dil bilgisi analizi.", instructions: "5 uzun cümleyi ögelerine ayır, renkli kalemle göster.", formats: "Fotoğraf", size: "5 MB" },
  { id: 1110, grade: 11, subject: "literature", title: "Edebi Akım Podcast'i", description: "Akımların karşılaştırılması.", instructions: "Romantizm ve Realizmi savunan iki yazarı tartıştır (Ses kaydı).", formats: "MP3", size: "10 MB" },

  // --- 11. SINIF FİZİK ---
  { id: 1111, grade: 11, subject: "physics", title: "Vektör Haritası", description: "Yer değiştirme vektörü.", instructions: "Evinden okula gidiş rotanı çiz, yer değiştirme vektörünü göster.", formats: "JPG", size: "5 MB" },
  { id: 1112, grade: 11, subject: "physics", title: "Nehir Problemi Animasyonu", description: "Bağıl hareket.", instructions: "Akıntılı nehirde karşıya geçen yüzücünün rotasını çizimle göster.", formats: "Video/GIF", size: "15 MB" },
  { id: 1113, grade: 11, subject: "physics", title: "Asansör Fiziği", description: "Newton yasaları.", instructions: "Asansör hızlanırken ağırlığımız neden değişir? Serbest cisim diyagramı çiz.", formats: "PDF", size: "3 MB" },
  { id: 1114, grade: 11, subject: "physics", title: "Basketbol Fiziği", description: "Eğik atış hareketi.", instructions: "Basketbol atışının yörüngesini, menzilini ve tepe noktasını analiz et.", formats: "PPTX", size: "8 MB" },
  { id: 1115, grade: 11, subject: "physics", title: "Roller Coaster Enerjisi", description: "Mekanik enerji korunumu.", instructions: "Hız treninin çemberi tamamlaması için gereken yüksekliği hesapla.", formats: "Video", size: "10 MB" },
  { id: 1116, grade: 11, subject: "physics", title: "Elektrik Alan Çizgileri", description: "Coulomb kuvveti.", instructions: "Yüklü cisimlerin elektrik alan çizgilerini simülasyonla göster.", formats: "Ekran Görüntüsü", size: "4 MB" },
  { id: 1117, grade: 11, subject: "physics", title: "Sığaçlar Nasıl Çalışır?", description: "Kondansatör teknolojisi.", instructions: "Klavye tuşları veya dokunmatik ekranlarda sığaçların rolünü araştır.", formats: "PDF", size: "5 MB" },
  { id: 1118, grade: 11, subject: "physics", title: "Elektrik Üretimi", description: "İndüksiyon yasası.", instructions: "Barajlarda hareket enerjisi nasıl elektriğe dönüşür? Jeneratör mantığını anlat.", formats: "Video Sunum", size: "20 MB" },
  { id: 1119, grade: 11, subject: "physics", title: "Alternatif Akım", description: "AC devre elemanları.", instructions: "AC devresinde frekans değişirse bobin ve sığacın direnci nasıl değişir?", formats: "Rapor", size: "4 MB" },
  { id: 1120, grade: 11, subject: "physics", title: "Transformatör Modeli", description: "Gerilim dönüştürücüler.", instructions: "Cep telefonu şarj aleti 220V'u nasıl 5V'a düşürür? Araştır.", formats: "Poster", size: "10 MB" },

  // --- 12. SINIF EDEBİYAT ---
  { id: 1201, grade: 12, subject: "literature", title: "Şiir Kolajı", description: "İkinci Yeni şiirini görselleştirme.", instructions: "İkinci Yeni şiirinin soyut imgelerini sürrealist bir kolajla anlat.", formats: "Canva", size: "20 MB" },
  { id: 1202, grade: 12, subject: "literature", title: "Bilinç Akışı Denemesi", description: "Modern anlatım tekniği.", instructions: "Bir karakterin zihninden geçenleri noktalama olmadan, akış halinde yaz.", formats: "Word", size: "2 MB" },
  { id: 1203, grade: 12, subject: "literature", title: "Nutuk Analizi", description: "Hitabet sanatı.", instructions: "Gençliğe Hitabe'deki vurgu, tonlama ve seslenişleri analiz et.", formats: "PDF", size: "5 MB" },
  { id: 1204, grade: 12, subject: "literature", title: "Postmodern Kurgu", description: "Metinlerarasılık.", instructions: "Kırmızı Başlıklı Kız masalını postmodern tekniklerle yeniden kurgula.", formats: "Word", size: "3 MB" },
  { id: 1205, grade: 12, subject: "literature", title: "Garip Akımı Bildirisi", description: "Şiir manifestosu.", instructions: "Orhan Veli ağzından, şiirde kurallara neden karşı olduğunu anlatan bir manifesto yaz.", formats: "PDF", size: "2 MB" },
  { id: 1206, grade: 12, subject: "literature", title: "Toplumcu Roman", description: "Köy edebiyatı analizi.", instructions: "Yaşar Kemal'in eserindeki ağa-köylü çatışmasını incele.", formats: "PPTX", size: "5 MB" },
  { id: 1207, grade: 12, subject: "literature", title: "Küçürek Öykü", description: "Minimal öykü yazımı.", instructions: "50 kelimeyi geçmeyen, derin anlamlı 3 küçürek öykü yaz.", formats: "JPG", size: "2 MB" },
  { id: 1208, grade: 12, subject: "literature", title: "1980 Sonrası Şiir", description: "İmgeci şiir analizi.", instructions: "1980 sonrası şiirin bireysel ve imgesel yapısını bir şiir üzerinden yorumla.", formats: "PDF", size: "3 MB" },
  { id: 1209, grade: 12, subject: "literature", title: "Sinema Uyarlaması", description: "Roman vs Film.", instructions: "Aşk-ı Memnu'nun romanı ile dizisi arasındaki 5 farkı eleştir.", formats: "Video", size: "15 MB" },
  { id: 1210, grade: 12, subject: "literature", title: "Yazar Belgeseli", description: "Biyografik video.", instructions: "Bir Cumhuriyet dönemi yazarının hayatını belgesel tadında anlat.", formats: "MP4", size: "100 MB" },
  
  // --- 12. SINIF FİZİK ---
  { id: 1211, grade: 12, subject: "physics", title: "Merkezcil Kuvvet", description: "Çembersel hareket hissi.", instructions: "İpe bağlı cismi çevirirken ipteki gerilmenin hıza bağlı değişimini raporla.", formats: "Rapor", size: "20 MB" },
  { id: 1212, grade: 12, subject: "physics", title: "Uydu Yörüngeleri", description: "Kütle çekim kuvveti.", instructions: "Türksat uydusunun düşmeden nasıl döndüğünü şematize et.", formats: "PPTX", size: "5 MB" },
  { id: 1213, grade: 12, subject: "physics", title: "Sarkaç Deneyi", description: "Basit harmonik hareket.", instructions: "İp boyunun sarkaç periyoduna etkisini evde ölçüm yaparak grafiğe dök.", formats: "Excel", size: "4 MB" },
  { id: 1214, grade: 12, subject: "physics", title: "Girişim Deseni", description: "Dalga mekaniği.", instructions: "Lazer veya su dalgalarıyla girişim (Young deneyi) desenini gözlemle.", formats: "Fotoğraf", size: "5 MB" },
  { id: 1215, grade: 12, subject: "physics", title: "Atom Modelleri", description: "Tarihsel gelişim.", instructions: "Atomun yapısının Rutherford'dan Modern Teori'ye evrimini poster yap.", formats: "Canva", size: "8 MB" },
  { id: 1216, grade: 12, subject: "physics", title: "Güneş Pilleri", description: "Fotoelektrik etki.", instructions: "Güneş panelleri ışığı nasıl elektriğe çevirir? Einstein'ın teorisiyle açıkla.", formats: "PPTX", size: "6 MB" },
  { id: 1217, grade: 12, subject: "physics", title: "İkizler Paradoksu", description: "Özel görelilik.", instructions: "Zamanın genleşmesini Interstellar filmi veya İkizler Paradoksu üzerinden anlat.", formats: "Video", size: "30 MB" },
  { id: 1218, grade: 12, subject: "physics", title: "Maglev Trenleri", description: "Süperiletken teknolojisi.", instructions: "Süperiletkenlerin trenleri nasıl havada tuttuğunu (Meissner etkisi) araştır.", formats: "PDF", size: "10 MB" },
  { id: 1219, grade: 12, subject: "physics", title: "Akıllı İlaçlar", description: "Nanoteknoloji.", instructions: "Nanobotların tıpta kanser tedavisinde nasıl kullanıldığını sun.", formats: "Poster", size: "8 MB" },
  { id: 1220, grade: 12, subject: "physics", title: "Lazer Teknolojisi", description: "Uyarılmış emisyon.", instructions: "Lazer ışığının normal ışıktan farkını ve kullanım alanlarını (barkod, tıp) yaz.", formats: "PDF", size: "4 MB" },
  { id: 1226, grade: 12, subject: "physics", title: "Açısal Momentum", description: "Korunum yasası deneyi.", instructions: "Dönen bir sandalyede kollarını açıp kapatarak dönüş hızının değişimini videoya çek ve açıkla.", formats: "Video", size: "25 MB" },
  { id: 1227, grade: 12, subject: "physics", title: "Kara Delikler", description: "Genel görelilik.", instructions: "Kara delik nedir, olay ufku ne demektir? Popüler bilim diliyle anlat.", formats: "PPTX", size: "15 MB" },
  { id: 1228, grade: 12, subject: "physics", title: "Tıbbi Görüntüleme", description: "Fizik ve sağlık.", instructions: "MR, Tomografi ve Ultrason cihazlarının hangi fiziksel prensiplerle çalıştığını karşılaştır.", formats: "Tablo (PDF)", size: "5 MB" },
  { id: 1229, grade: 12, subject: "physics", title: "Yarı İletkenler", description: "Elektronik teknolojisi.", instructions: "Diyot ve transistör nedir? Bilgisayar çiplerinin temelini nasıl oluştururlar?", formats: "Poster", size: "8 MB" },
  { id: 1230, grade: 12, subject: "physics", title: "Big Bang Teorisi", description: "Evrenin oluşumu.", instructions: "Evrenin genişlemesi ve Büyük Patlama teorisinin kanıtlarını (Kozmik Ardalan Işıması) araştır.", formats: "Video Sunum", size: "20 MB" },
  { id: 1236, grade: 12, subject: "physics", title: "Çamaşır Makinesi Santrifüjü", description: "Merkezcil kuvvet.", instructions: "Sıkma programında çamaşırların neden dışa savrulduğunu (eylemsizlik) ve suyun nasıl ayrıldığını fiziksel olarak açıkla.", formats: "Video", size: "20 MB" },
  { id: 1237, grade: 12, subject: "physics", title: "Market Barkod Okuyucuları", description: "Lazer teknolojisi.", instructions: "Kasiyerin okuttuğu barkod sisteminde lazer ışığının yansıması ve veriye dönüşmesi sürecini araştır.", formats: "PDF", size: "5 MB" },
  { id: 1238, grade: 12, subject: "physics", title: "Otomatik Kapı Sensörleri", description: "Fotoelektrik olay.", instructions: "AVM girişlerindeki kapıların sizi gördüğünde açılmasını sağlayan fotosel sistemini (ışık-akım ilişkisi) şematize et.", formats: "PPTX", size: "8 MB" },
  { id: 1239, grade: 12, subject: "physics", title: "MR Cihazı Güvenliği", description: "Süperiletken ve Manyetizma.", instructions: "MR çektirecek birinin neden üzerindeki metalleri çıkarması gerekir? Cihazın içindeki dev mıknatısı araştır.", formats: "Poster", size: "6 MB" },
  { id: 1240, grade: 12, subject: "physics", title: "GPS ve Zaman Kayması", description: "Özel görelilik.", instructions: "Uydulardaki saatlerin dünyadaki saatlerden neden farklı çalıştığını ve Einstein'ın teorisinin GPS doğruluğu için önemini anlat.", formats: "Video Sunum", size: "25 MB" }
];

const HomeworkLibrary = () => {
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  // Modallar
  const [rubricModalOpen, setRubricModalOpen] = useState(false);
  const [addRubricModalOpen, setAddRubricModalOpen] = useState(false);
  const [editAssignmentModalOpen, setEditAssignmentModalOpen] = useState(false);
  const [createAssignmentModalOpen, setCreateAssignmentModalOpen] = useState(false);
  const [assignSettingsModalOpen, setAssignSettingsModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignDetails, setAssignDetails] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  const [assignments, setAssignments] = useState(assignmentsData);
  const [rubrics, setRubrics] = useState(initialRubricDefinitions);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const toggleFavoritesOnly = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    if (!showFavoritesOnly) {
      setGradeFilter('');
      setSubjectFilter('');
    }
  };

  const filteredAssignments = assignments.filter(item => {
    if (showFavoritesOnly) {
      return favorites.includes(item.id);
    }
    if (gradeFilter === '' || subjectFilter === '') return false;
    
    const gradeMatch = item.grade === parseInt(gradeFilter);
    const subjectMatch = item.subject === subjectFilter;
    return gradeMatch && subjectMatch;
  });

  const handleAssignClick = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignSettingsModalOpen(true);
  };

  const handleAssignConfirm = (details) => {
    setAssignDetails(details);
    const newHistoryItem = {
      title: selectedAssignment.title,
      class: details.class,
      date: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newHistoryItem, ...prev]);
    setSuccessModalOpen(true);
  };

  const handleShowRubric = (assignment) => {
    setSelectedAssignment(assignment);
    setRubricModalOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setEditAssignmentModalOpen(true);
  };
  
  const handlePrintAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setPrintModalOpen(true);
  }

  const handleSaveEditedAssignment = (updatedFields) => {
    setAssignments(prev => prev.map(a => 
      a.id === selectedAssignment.id ? { ...a, ...updatedFields } : a
    ));
  };

  const handleSaveNewAssignment = (newAssignment) => {
    const assignmentWithId = {
        ...newAssignment,
        id: Date.now(), 
        grade: parseInt(newAssignment.grade)
    };
    setAssignments(prev => [assignmentWithId, ...prev]);
  };

  const handleSaveNewRubric = (newRubric) => {
    const key = `custom_${Date.now()}`;
    setRubrics(prev => ({
      ...prev,
      [key]: newRubric
    }));
  };

  const hasSelection = (gradeFilter !== '' && subjectFilter !== '') || showFavoritesOnly;

  return (
    <div className="bg-gray-50 text-gray-800 font-sans p-4">
      <Header 
          onOpenAddRubric={() => setAddRubricModalOpen(true)} 
          onOpenCreateAssignment={() => setCreateAssignmentModalOpen(true)}
          history={history}
          toggleFavoritesOnly={toggleFavoritesOnly}
          showFavoritesOnly={showFavoritesOnly}
      />
      
      <main>
        
        <div className="my-8">
           {!hasSelection && (
             <StatsCards 
               total={assignments.length} 
               assignedCount={history.length} 
               favoritesCount={favorites.length} 
             />
           )}
        </div>

        {!showFavoritesOnly && (
          <FilterBar 
            gradeFilter={gradeFilter}
            subjectFilter={subjectFilter}
            setGradeFilter={setGradeFilter}
            setSubjectFilter={setSubjectFilter}
            disabled={showFavoritesOnly}
          />
        )}

        {showFavoritesOnly && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
            <span className="text-red-700 font-medium flex items-center gap-2"><Heart className="fill-current" size={18}/> Favori Ödevleriniz Listeleniyor</span>
            <button onClick={toggleFavoritesOnly} className="text-sm text-red-600 hover:underline">Tümüne Dön</button>
          </div>
        )}

        {!hasSelection ? (
          <EmptyState />
        ) : filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map(item => (
              <AssignmentCard 
                key={item.id} 
                item={item} 
                onAssign={handleAssignClick}
                onShowRubric={handleShowRubric}
                onEdit={handleEditAssignment}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={toggleFavorite}
                onPrint={handlePrintAssignment}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="bg-gray-100 p-4 rounded-full mb-4">
              <Filter size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
            <p className="text-gray-500">
              {showFavoritesOnly 
                ? "Henüz favorilere eklediğiniz bir ödev yok." 
                : "Seçili filtrelere uygun ödev yok. Lütfen filtreleri değiştirin."}
            </p>
          </div>
        )}
      </main>

      {/* MODALLAR */}
      <AssignSettingsModal 
        isOpen={assignSettingsModalOpen}
        onClose={() => setAssignSettingsModalOpen(false)}
        assignment={selectedAssignment}
        onConfirm={handleAssignConfirm}
      />

      <SuccessModal 
        isOpen={successModalOpen} 
        onClose={() => setSuccessModalOpen(false)} 
        assignment={selectedAssignment}
        details={assignDetails}
      />

      <RubricModal 
        isOpen={rubricModalOpen}
        onClose={() => setRubricModalOpen(false)}
        assignment={selectedAssignment}
        rubrics={rubrics}
        onAddRubricClick={() => setAddRubricModalOpen(true)}
      />

      <AddRubricModal 
        isOpen={addRubricModalOpen}
        onClose={() => setAddRubricModalOpen(false)}
        onSave={handleSaveNewRubric}
      />

      <EditAssignmentModal 
        isOpen={editAssignmentModalOpen}
        onClose={() => setEditAssignmentModalOpen(false)}
        assignment={selectedAssignment}
        onSave={handleSaveEditedAssignment}
      />

      <CreateAssignmentModal
        isOpen={createAssignmentModalOpen}
        onClose={() => setCreateAssignmentModalOpen(false)}
        onSave={handleSaveNewAssignment}
      />
      
      <PrintPreviewModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        assignment={selectedAssignment}
      />
    </div>
  );
};