
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FileText, Calendar, Download, BookOpen, CheckCircle, ClipboardCheck, Sparkles, Loader2, Plus, Trash2, Settings, Save, School } from 'lucide-react';
import { TeacherProfile, Class } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * UI Bileşenleri (Tailwind tabanlı & ShadCN stili)
 * Not: Tek dosya yapısını korumak için ShadCN bileşenleri inline olarak tanımlanmıştır.
 */
const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const baseStyle = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 shadow-sm";
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700",
    ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    icon: "h-8 w-8 p-0"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Input = ({ className = '', ...props }: any) => (
  <input className={`flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Label = ({ children, className = '' }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>
);

const Textarea = ({ className = '', ...props }: any) => (
  <textarea className={`flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Card = ({ children, className = '' }: any) => <div className={`rounded-xl border border-gray-200 bg-white text-gray-950 shadow ${className}`}>{children}</div>;

const ClassGuidanceAssistant = () => {
  const [activeTab, setActiveTab] = useState('plan');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(0);
  
  // Okul ve Öğretmen Bilgileri State'i
  const [schoolDetails, setSchoolDetails] = useState({
    schoolName: '',
    classBranch: 'A', // Şube (A, B, C...)
    teacherName: '',
    counselorName: '',
    principalName: '',
    city: '', // İlçe/İl bilgisi başlık için
    year: '2025-2026'
  });

  // Başlangıç Rapor Verisi Şablonu
  const initialReportData = {
    kazanimStatus: 'evet',
    kazanimlar: Array(3).fill({ text: '' }).map((_, i) => ({ id: i + 1, text: '' })),
    envanterler: [
      { id: 1, name: 'Öğrenci Bilgi Formu', col1: 0, col2: 0 },
      { id: 2, name: 'Sınıf Risk Haritası', col1: 0, col2: 0 }
    ],
    rehberlik: [
      { id: 1, name: 'Bireysel Görüşme', col1: 0, col2: 0 }
    ],
    veli: [
      { id: 1, name: 'Veli Toplantısı', col1: 0, col2: 0, col3: 0 }
    ],
    guclukler: '',
    oneriler: ''
  };

  // Rapor İçerikleri State
  const [termReportData, setTermReportData] = useState(JSON.parse(JSON.stringify(initialReportData)));
  const [endYearReportData, setEndYearReportData] = useState(JSON.parse(JSON.stringify(initialReportData)));

  // UYGULAMA AÇILDIĞINDA KAYITLI BİLGİLERİ ÇEK
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('rehberlikAsistaniAyarlar');
      if (savedData) {
        setSchoolDetails(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Ayarlar yüklenirken hata oluştu", error);
    }
  }, []);

  // AYARLARI TARAYICIYA KAYDETME FONKSİYONU
  const saveSettingsToBrowser = () => {
    localStorage.setItem('rehberlikAsistaniAyarlar', JSON.stringify(schoolDetails));
    const btn = document.getElementById('saveButton');
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "Kaydedildi! ✓";
        btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        btn.classList.add('bg-green-600', 'hover:bg-green-700');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            btn.classList.remove('bg-green-600', 'hover:bg-green-700');
        }, 2000);
    }
  };

  // Veri Tabanı
  const plans: { [key: string]: { month: string; week: string; kazanim: string; tur: string; }[] } = {
    '9': [
      { month: 'Eylül', week: '1', kazanim: 'Okulunun ve sınıfının bir üyesi olduğunu fark eder. (Çimento Duygular)', tur: 'Oryantasyon' },
      { month: 'Eylül', week: '2', kazanim: 'Okulun yakın çevresini, bölümlerini ve çalışanları tanır. (Hoş Geldin Dostum)', tur: 'Oryantasyon' },
      { month: 'Eylül', week: '3', kazanim: 'Okulun eğitsel imkânları hakkında bilgi edinir. (Neler Oluyor Hayatta)', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Yönetmeliklerin kendisini ilgilendiren kısımlarını öğrenir. (Bilmekte Fayda Var)', tur: 'Oryantasyon' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Okul hazırlığına ilişkin sorumluluklarını üstlenir. (Keşke\'lerin Değil İyi ki\'lerin Olsun)', tur: 'Akademik' },
      { month: 'Ekim', week: '3', kazanim: 'Kendi mesleki değerlerinin farkına varır. (Mesleki Değerlerim Ne Durumda)', tur: 'Kariyer' },
      { month: 'Ekim', week: '4', kazanim: 'Yaşam değerlerinin farkına varır. (Değerlerimle Değerliyim)', tur: 'Kişisel' },
      { month: 'Kasım', week: '1', kazanim: 'Kişisel güvenliği için “Hayır!” demeyi alışkanlık hâline getirir. (Güvenlik Duvarım)', tur: 'Kişisel Güvenlik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'İhmal ve istismar türlerini ayırt eder. (Kırmızı Işık Yak)', tur: 'Kişisel Güvenlik' },
      { month: 'Kasım', week: '4', kazanim: 'Akran zorbalığı ile baş etme yöntemlerini kullanır. (Zorbalığa Dur De)', tur: 'Sosyal' },
      { month: 'Aralık', week: '1', kazanim: 'Etkili iletişim becerilerini kullanır. (İletişim Engelleri)', tur: 'Sosyal' },
      { month: 'Aralık', week: '2', kazanim: 'Çatışma çözme becerilerini günlük hayatta kullanır. (Çatışmayı Çözüyorum)', tur: 'Sosyal' },
      { month: 'Aralık', week: '3', kazanim: 'Sanal arkadaşlığı arkadaşlık ilişkileri kapsamında sorgular. (Sanal Kanka)', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '4', kazanim: 'Öfke yönetimi becerilerini geliştirir. (Öfkem Kontrolümde)', tur: 'Duygusal' },
      { month: 'Ocak', week: '1', kazanim: 'Verimli ders çalışma tekniklerini uygular. (Zamanı Yönetiyorum)', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Dönem sonu değerlendirmesi yapar.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Kısa ve uzun vadeli hedefler belirler. (Hedefime Yürüyorum)', tur: 'Akademik' },
      { month: 'Şubat', week: '2', kazanim: 'Alan/bölüm/dal seçiminde ilgi ve yeteneklerini dikkate alır. (Yetenek, İlgi ve Değerler)', tur: 'Kariyer' },
      { month: 'Şubat', week: '3', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi) Uygulaması', tur: 'Tanıma' },
      { month: 'Şubat', week: '4', kazanim: 'Kariyer hazırlığı sürecinde amaçlarına uygun karar verir. (Adım Adım Alanım)', tur: 'Kariyer' },
      { month: 'Mart', week: '1', kazanim: 'Bağımlılık yapıcı maddelerden uzak durur. (Hayır Diyebilmek)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '2', kazanim: 'Teknoloji bağımlılığının etkilerini fark eder. (Ekranı Yönet)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '3', kazanim: 'Sağlıklı yaşam bilinci geliştirir. (Sağlığım Geleceğim)', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '4', kazanim: 'Toplumsal rollerinin gerektirdiği sorumlulukları değerlendirir. (Rolden Role)', tur: 'Sosyal' },
      { month: 'Nisan', week: '1', kazanim: 'Sahip olduğu karakter güçlerini fark eder. (Güç Bende Artık)', tur: 'Kişisel' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Karakter güçlerini zorluklar karşısında kullanmayı bilir. (Çözüm Karakterimde)', tur: 'Kişisel' },
      { month: 'Nisan', week: '4', kazanim: 'Meslekleri tanır ve araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '1', kazanim: 'İş birliği içinde çalışmanın önemini kavrar.', tur: 'Sosyal' },
      { month: 'Mayıs', week: '2', kazanim: 'Zaman yönetimi konusunda kendini değerlendirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '3', kazanim: 'Sınav kaygısı ile baş etme yollarını öğrenir.', tur: 'Duygusal' },
      { month: 'Mayıs', week: '4', kazanim: 'Akran baskısıyla baş etme becerisi geliştirir.', tur: 'Sosyal' },
      { month: 'Haziran', week: '1', kazanim: 'Kimden, nereden ve ne zaman yardım isteyebileceğini bilir. (İhtiyaç Duyduğumda...)', tur: 'Kişisel Güvenlik' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu değerlendirmesi ve kapanış.', tur: 'Değerlendirme' }
    ],
    '10': [
      { month: 'Eylül', week: '1', kazanim: 'Yaşamındaki karar verme sürecini etkileyen faktörleri açıklar. (Son Kararım)', tur: 'Kariyer' },
      { month: 'Eylül', week: '2', kazanim: 'Okul içi/dışı etkinliklerin katkılarını değerlendirir. (Şefim! Bize Bir Faaliyet!)', tur: 'Sosyal' },
      { month: 'Eylül', week: '3', kazanim: 'Etkinliklere katılırken ilgi ve yeteneklerini dikkate alır. (Hangi İstasyon)', tur: 'Kişisel' },
      { month: 'Eylül', week: '4', kazanim: 'Alan/ders seçiminde ilgi ve yetenekleri dikkate alır. (Seçim Pusulası)', tur: 'Kariyer' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Karar verme basamaklarını kullanır. (Eksik Parçalar)', tur: 'Kariyer' },
      { month: 'Ekim', week: '3', kazanim: 'Öğrenme ve verimli çalışma stratejilerini açıklar. (Aklımdan Uçurma)', tur: 'Akademik' },
      { month: 'Ekim', week: '4', kazanim: 'Verimli çalışma stratejilerini kullanma açısından kendini değerlendirir. (Stratejik Miyim?)', tur: 'Akademik' },
      { month: 'Kasım', week: '1', kazanim: 'Ben bunu nasıl öğrendim? (Öğrenme Stilleri)', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'Zorlukların çaba ile üstesinden gelinebileceğini fark eder. (Zorluklarımın Farkındayım)', tur: 'Kişisel' },
      { month: 'Kasım', week: '4', kazanim: 'Fiziksel iyilik halini yaşamında uygular. (İyilik Hali Yolculuğu)', tur: 'Sağlıklı Yaşam' },
      { month: 'Aralık', week: '1', kazanim: 'Siber zorbalık kavramını açıklar.', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '2', kazanim: 'Siber zorbalıkla baş etme yöntemlerini kullanır.', tur: 'Kişisel Güvenlik' },
      { month: 'Aralık', week: '3', kazanim: 'İletişimde ben dilini kullanır.', tur: 'Sosyal' },
      { month: 'Aralık', week: '4', kazanim: 'Empati kurma becerisini geliştirir.', tur: 'Sosyal' },
      { month: 'Ocak', week: '1', kazanim: 'Dönem sonu değerlendirmesi.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '2', kazanim: 'Karne görüşmeleri ve motivasyon.', tur: 'Akademik' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Bilişim teknolojileri kullanımında kendini yönetir. (Yönetim Bende Mi?)', tur: 'Teknoloji' },
      { month: 'Şubat', week: '2', kazanim: 'Gerektiğinde arkadaşlığını sonlandırır. (Şiddet Varsa Ben Yokum)', tur: 'Sosyal' },
      { month: 'Şubat', week: '3', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi)', tur: 'Tanıma' },
      { month: 'Şubat', week: '4', kazanim: 'Zorluklar karşısında umut etme ve çabalama becerisi. (Vazgeçme, Umut Et)', tur: 'Kişisel' },
      { month: 'Mart', week: '1', kazanim: 'Yerel ve küresel sorunları fark eder. (Dünyada Neler Oluyor?)', tur: 'Sosyal' },
      { month: 'Mart', week: '2', kazanim: 'Kişisel sınırlarını korur.', tur: 'Kişisel' },
      { month: 'Mart', week: '3', kazanim: 'Bağımlılıkla mücadele yöntemlerini bilir.', tur: 'Sağlıklı Yaşam' },
      { month: 'Mart', week: '4', kazanim: 'Stresle baş etme yöntemlerini kullanır.', tur: 'Duygusal' },
      { month: 'Nisan', week: '1', kazanim: 'Öğrenme ortamlarındaki duygularını düzenler. (Duygumu Düzenledim)', tur: 'Duygusal' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Mesleki değerlerini fark eder.', tur: 'Kariyer' },
      { month: 'Nisan', week: '4', kazanim: 'Meslekleri araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '1', kazanim: 'Toplumsal cinsiyet rollerine ilişkin farkındalık kazanır.', tur: 'Sosyal' },
      { month: 'Mayıs', week: '2', kazanim: 'Geleceği planlama becerisi geliştirir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Zaman yönetimi becerilerini gözden geçirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '4', kazanim: 'Duygularını ifade etme becerilerini geliştirir.', tur: 'Duygusal' },
      { month: 'Haziran', week: '1', kazanim: 'Takım çalışmalarının kişisel gelişimine etkisini fark eder. (Takımımla Gelişiyorum)', tur: 'Sosyal' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu genel değerlendirmesi.', tur: 'Değerlendirme' }
    ],
    '11': [
      { month: 'Eylül', week: '1', kazanim: 'Kişilik özelliklerine ilişkin farkındalık geliştirir. (Kişilik Yapbozum)', tur: 'Kişisel' },
      { month: 'Eylül', week: '2', kazanim: 'Başarılı olduğu durumlarda kendini takdir eder. (Yaşam Karnem)', tur: 'Duygusal' },
      { month: 'Eylül', week: '3', kazanim: 'Akademik konulardaki güçlü yönlerini fark eder. (Güçlü Yönlerim)', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Başarmak için çalışmanın gerekliliğine inanır. (Çalış ve Başar)', tur: 'Akademik' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Ergen-ebeveyn ilişkilerini değerlendirir. (Aile Halkası)', tur: 'Sosyal' },
      { month: 'Ekim', week: '3', kazanim: 'Akademik başarının önündeki engelleri fark eder. (Başarımın Önündeki Engeller)', tur: 'Akademik' },
      { month: 'Ekim', week: '4', kazanim: 'Akademik sorumlulukları ertelemenin sonuçlarını fark eder. (Erteleme Bingosu)', tur: 'Akademik' },
      { month: 'Kasım', week: '1', kazanim: 'Eğitsel etkinliklerdeki başarısızlıkların öğrenme parçası olduğunu kavrar.', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'İlgi, yetenek ve mesleki değerlerini ilişkilendirir. (Başarısızlık mı Veri mi?)', tur: 'Kariyer' },
      { month: 'Kasım', week: '4', kazanim: 'Meslek seçiminde karar verme becerisini kullanır. (Benim Kararım)', tur: 'Kariyer' },
      { month: 'Aralık', week: '1', kazanim: 'Sınavlara hazırlanmayı etkileyen faktörleri açıklar. (Bugün Çok İyi Çalışacağım)', tur: 'Akademik' },
      { month: 'Aralık', week: '2', kazanim: 'Kişisel seçimleri ile toplumsal roller arasında denge kurar. (Seçimler ve Denge)', tur: 'Sosyal' },
      { month: 'Aralık', week: '3', kazanim: 'Öfke ile baş etme yollarını kullanır.', tur: 'Duygusal' },
      { month: 'Aralık', week: '4', kazanim: 'Stres yönetimi tekniklerini uygular.', tur: 'Duygusal' },
      { month: 'Ocak', week: '1', kazanim: 'Verimli ders çalışma planı hazırlar.', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Dönem değerlendirmesi.', tur: 'Değerlendirme' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Mesleki bilgi kaynaklarını kullanır. (Güvenilir mi?)', tur: 'Kariyer' },
      { month: 'Şubat', week: '2', kazanim: 'RİBA (Rehberlik İhtiyaçları Belirleme Anketi)', tur: 'Tanıma' },
      { month: 'Şubat', week: '3', kazanim: 'Akademik amaçlarıyla kariyer seçenekleri arasındaki ilişkiyi açıklar. (Amaçlarım ve Seçeneklerim)', tur: 'Kariyer' },
      { month: 'Şubat', week: '4', kazanim: 'Akran grubunun yaşamındaki yerini açıklar. (Benim İçin Arkadaşlık)', tur: 'Sosyal' },
      { month: 'Mart', week: '1', kazanim: 'Mesleki bilgi kaynaklarını kullanır (İncele/Araştır).', tur: 'Kariyer' },
      { month: 'Mart', week: '2', kazanim: 'Seçmeyi düşündüğü mesleklerle ilgili kariyer planlaması yapar. (Kariyerimi Planlıyorum)', tur: 'Kariyer' },
      { month: 'Mart', week: '3', kazanim: 'Yükseköğretim programlarını tanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '4', kazanim: 'Sınav sistemini (YKS) tanır.', tur: 'Kariyer' },
      { month: 'Nisan', week: '1', kazanim: 'Yükseköğretim kurumlarını ziyaret eder.', tur: 'Kariyer' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Motivasyonunu artırıcı stratejiler geliştirir.', tur: 'Akademik' },
      { month: 'Nisan', week: '4', kazanim: 'Zaman yönetimi becerilerini geliştirir.', tur: 'Akademik' },
      { month: 'Mayıs', week: '1', kazanim: 'Staj ve iş imkanlarını araştırır.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '2', kazanim: 'CV hazırlama tekniklerini öğrenir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Mülakat teknikleri hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '4', kazanim: 'İş dünyasında gerekli becerileri fark eder.', tur: 'Kariyer' },
      { month: 'Haziran', week: '1', kazanim: 'Kimlik gelişimi ile sosyal bağlamları ilişkilendirir. (Sosyal Bağlamda Kimliğim)', tur: 'Kişisel' },
      { month: 'Haziran', week: '2', kazanim: 'Ortaöğretim sonrası kariyer tercihleri ile ilgili yardım kaynaklarına başvurur.', tur: 'Kariyer' }
    ],
    '12': [
      { month: 'Eylül', week: '1', kazanim: 'Zamanını, ihtiyaçları ve sorumlulukları çerçevesinde planlar.', tur: 'Akademik' },
      { month: 'Eylül', week: '2', kazanim: 'Sahip olduğu karakter güçlerini zorluklar karşısında kullanır.', tur: 'Kişisel' },
      { month: 'Eylül', week: '3', kazanim: 'Okula hazırlıklı gelme ile akademik gelişimi arasında bağ kurar.', tur: 'Akademik' },
      { month: 'Eylül', week: '4', kazanim: 'Zamanını planlama ve yönetme becerilerini geliştirir.', tur: 'Akademik' },
      { month: 'Ekim', week: '1', kazanim: 'Sınıf Risk Haritasının oluşturulması.', tur: 'Risk Belirleme' },
      { month: 'Ekim', week: '2', kazanim: 'Bilişim teknolojileri kullanımı konusunda kendini değerlendirir.', tur: 'Teknoloji' },
      { month: 'Ekim', week: '3', kazanim: 'Kendi bedenine ilişkin olumlu tutum geliştirir.', tur: 'Kişisel' },
      { month: 'Ekim', week: '4', kazanim: 'Üst öğretim kurumlarına geçiş sınavlarına hazırlanmak için strateji geliştirir.', tur: 'Kariyer' },
      { month: 'Kasım', week: '1', kazanim: 'Akademik çalışmalarını zamanında bitirmede kararlı olur.', tur: 'Akademik' },
      { month: 'Kasım', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Kasım', week: '3', kazanim: 'Kariyer planlama sürecinde kişisel özelliklerini kullanır.', tur: 'Kariyer' },
      { month: 'Kasım', week: '4', kazanim: 'Ortaöğretim sonrası kariyer tercihleri için kaynaklara başvurur.', tur: 'Kariyer' },
      { month: 'Aralık', week: '1', kazanim: 'Kültürel farklılıklara saygı duyar.', tur: 'Sosyal' },
      { month: 'Aralık', week: '2', kazanim: 'Sınav kaygısı ile baş etme yöntemlerini kullanır.', tur: 'Duygusal' },
      { month: 'Aralık', week: '3', kazanim: 'Motivasyonunu artırma yollarını bilir.', tur: 'Akademik' },
      { month: 'Aralık', week: '4', kazanim: 'YKS başvuru süreci hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Ocak', week: '1', kazanim: 'Dönem sonu değerlendirmesi ve hedef güncelleme.', tur: 'Akademik' },
      { month: 'Ocak', week: '2', kazanim: 'Karne ve tatil planı.', tur: 'Sosyal' },
      { month: 'Ocak', week: '3', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Ocak', week: '4', kazanim: 'YARIYIL TATİLİ', tur: 'Tatil' },
      { month: 'Şubat', week: '1', kazanim: 'Karakter güçleri ile iyi oluş arasında bağ kurar.', tur: 'Kişisel' },
      { month: 'Şubat', week: '2', kazanim: 'Yaşadığı yoğun duyguları yönetir.', tur: 'Duygusal' },
      { month: 'Şubat', week: '3', kazanim: 'İyi oluşunu destekleyen duyguları yaşamında sıklıkla deneyimler.', tur: 'Duygusal' },
      { month: 'Şubat', week: '4', kazanim: 'Meslek seçiminde karar verme becerisini kullanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '1', kazanim: 'Mesleki bilgi kaynaklarını aktif kullanır.', tur: 'Kariyer' },
      { month: 'Mart', week: '2', kazanim: 'Değişim ve belirsizlikle baş eder.', tur: 'Kişisel' },
      { month: 'Mart', week: '3', kazanim: 'Seçmeyi düşündüğü mesleklerle ilgili kariyer planlaması yapar. (Kariyerimi Planlıyorum)', tur: 'Kariyer' },
      { month: 'Mart', week: '4', kazanim: 'Sınavlara ilişkin yoğun duygularını yönetir (Sınav Kaygısı).', tur: 'Duygusal' },
      { month: 'Nisan', week: '1', kazanim: 'Üst öğretim kurumuna ya da iş yaşamına ilişkin kariyer kararını verir.', tur: 'Kariyer' },
      { month: 'Nisan', week: '2', kazanim: 'ARA TATİL', tur: 'Tatil' },
      { month: 'Nisan', week: '3', kazanim: 'Üst öğretim kurumlarına geçiş sınavlarıyla ilgili detaylı bilgi edinir.', tur: 'Kariyer' },
      { month: 'Nisan', week: '4', kazanim: 'Sınav öncesi son stratejileri belirler.', tur: 'Akademik' },
      { month: 'Mayıs', week: '1', kazanim: 'Öğrenmenin hayat boyu devam ettiğine inanır.', tur: 'Akademik' },
      { month: 'Mayıs', week: '2', kazanim: 'Mezuniyet sonrası için planlar yapar.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '3', kazanim: 'Tercih süreci hakkında bilgi edinir.', tur: 'Kariyer' },
      { month: 'Mayıs', week: '4', kazanim: 'Üniversite yaşamına uyum.', tur: 'Oryantasyon' },
      { month: 'Haziran', week: '1', kazanim: 'Bir üst öğretim kurumuna ilişkin ön bilgiler edinir.', tur: 'Kariyer' },
      { month: 'Haziran', week: '2', kazanim: 'Yıl sonu değerlendirmesi ve kapanış.', tur: 'Değerlendirme' }
    ]
  };

  // --- YARDIMCI FONKSİYONLAR (Form İşlemleri) ---

  const updateReportField = (reportType, field, value) => {
    const setter = reportType === 'term' ? setTermReportData : setEndYearReportData;
    setter(prev => ({ ...prev, [field]: value }));
  };

  const updateTableItem = (reportType, table, id, field, value) => {
    const currentData = reportType === 'term' ? termReportData : endYearReportData;
    const setter = reportType === 'term' ? setTermReportData : setEndYearReportData;
    
    const newData = currentData[table].map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setter(prev => ({ ...prev, [table]: newData }));
  };

  const addRow = (reportType, table) => {
    const currentData = reportType === 'term' ? termReportData : endYearReportData;
    const setter = reportType === 'term' ? setTermReportData : setEndYearReportData;

    const newId = currentData[table].length > 0 ? Math.max(...currentData[table].map(i => i.id)) + 1 : 1;
    const newItem = table === 'veli' 
      ? { id: newId, name: '', col1: 0, col2: 0, col3: 0 } 
      : { id: newId, name: '', col1: 0, col2: 0 };
    
    setter(prev => ({ ...prev, [table]: [...prev[table], newItem] }));
  };

  const removeRow = (reportType, table, id) => {
    const setter = reportType === 'term' ? setTermReportData : setEndYearReportData;
    setter(prev => ({ ...prev, [table]: prev[table].filter(item => item.id !== id) }));
  };

  // --- WORD ÇIKTISI OLUŞTURMA (Yeni Formata Göre) ---
  const exportReportToWord = (reportType) => {
    const isTerm = reportType === 'term';
    const data = isTerm ? termReportData : endYearReportData;
    const title = isTerm ? '1. DÖNEM SONU FAALİYET RAPORU' : 'YIL SONU FAALİYET RAPORU';
    const periodText = isTerm ? '1.DÖNEM' : 'YIL';

    const contentHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 11pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        td, th { border: 1px solid black; padding: 5px; text-align: left; vertical-align: middle; }
        th { background-color: #f3f4f6; text-align: center; font-weight: bold; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .header { text-align: center; margin-bottom: 20px; }
        h3 { font-size: 12pt; margin-top: 15px; margin-bottom: 5px; text-decoration: underline; }
      </style>
      </head>
      <body>
        <div class="header">
          <p class="font-bold">
            ${schoolDetails.year} EĞİTİM ÖĞRETİM YILI<br>
            ${schoolDetails.schoolName ? schoolDetails.schoolName.toUpperCase() : '.........................'}<br>
            SINIF REHBERLİK ÇALIŞMALARI ${periodText} SONU FAALİYET RAPORU
          </p>
        </div>

        <p><strong>Sınıf/Şube:</strong> ${selectedGrade} / ${schoolDetails.classBranch}</p>

        <h3>Sınıf Rehberlik Planında Yer Alan Kazanımlar:</h3>
        <p>Tüm kazanımlar gerçekleştirilebildi mi? &nbsp;&nbsp;
           <strong>${data.kazanimStatus === 'evet' ? '(X) Evet' : '( ) Evet'}</strong> &nbsp;&nbsp;
           <strong>${data.kazanimStatus === 'kismen' ? '(X) Kısmen' : '( ) Kısmen'}</strong> &nbsp;&nbsp;
           <strong>${data.kazanimStatus === 'hayir' ? '(X) Hayır' : '( ) Hayır'}</strong>
        </p>
        
        ${data.kazanimStatus !== 'evet' ? `
          <table>
            <thead><tr><th width="50">No</th><th>Gerçekleştirilemeyen Kazanım ve Nedeni</th></tr></thead>
            <tbody>
              ${data.kazanimlar.map((k, i) => `<tr><td class="text-center">${i+1}</td><td>${k.text || '&nbsp;'}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}

        <h3>Uygulanan Envanterler:</h3>
        <table>
          <thead><tr><th width="40">SN</th><th>YAPILAN ÇALIŞMA</th><th width="60">KIZ</th><th width="60">ERKEK</th><th width="60">TOPLAM</th></tr></thead>
          <tbody>
            ${data.envanterler.map((row, i) => `
              <tr>
                <td class="text-center">${i+1}</td>
                <td>${row.name || '&nbsp;'}</td>
                <td class="text-center">${row.col1}</td>
                <td class="text-center">${row.col2}</td>
                <td class="text-center"><strong>${parseInt(row.col1||0) + parseInt(row.col2||0)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Rehberlik Faaliyetleri:</h3>
        <table>
          <thead><tr><th width="40">SN</th><th>YAPILAN ÇALIŞMA</th><th width="60">KIZ</th><th width="60">ERKEK</th><th width="60">TOPLAM</th></tr></thead>
          <tbody>
            ${data.rehberlik.map((row, i) => `
              <tr>
                <td class="text-center">${i+1}</td>
                <td>${row.name || '&nbsp;'}</td>
                <td class="text-center">${row.col1}</td>
                <td class="text-center">${row.col2}</td>
                <td class="text-center"><strong>${parseInt(row.col1||0) + parseInt(row.col2||0)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Veli Faaliyetleri:</h3>
        <table>
          <thead><tr><th width="40">SN</th><th>YAPILAN ÇALIŞMA</th><th width="60">ANNE</th><th width="60">BABA</th><th width="60">DİĞER</th><th width="60">TOPLAM</th></tr></thead>
          <tbody>
            ${data.veli.map((row, i) => `
              <tr>
                <td class="text-center">${i+1}</td>
                <td>${row.name || '&nbsp;'}</td>
                <td class="text-center">${row.col1}</td>
                <td class="text-center">${row.col2}</td>
                <td class="text-center">${row.col3}</td>
                <td class="text-center"><strong>${parseInt(row.col1||0) + parseInt(row.col2||0) + parseInt(row.col3||0)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Güçlükler ve Öneriler:</h3>
        <p><strong>Karşılaşılan Güçlükler:</strong><br>${data.guclukler || 'Belirtilmedi.'}</p>
        <p><strong>Çözüm Önerileri:</strong><br>${data.oneriler || 'Belirtilmedi.'}</p>

        <br><br><br>
        <table style="border:none;">
          <tr>
            <td style="border:none; text-align:center;">${schoolDetails.teacherName || '......................'}<br>Sınıf Rehber Öğretmeni</td>
            <td style="border:none; text-align:center;">${schoolDetails.counselorName || '......................'}<br>Okul PDR Servisi</td>
          </tr>
        </table>
        <br>
        <div style="text-align:center;">
          <strong>UYGUNDUR</strong><br>.... / .... / ${new Date().getFullYear()}<br><br>
          ${schoolDetails.principalName || '......................'}<br>Okul Müdürü
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', contentHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedGrade}_${schoolDetails.classBranch}_${isTerm ? '1_Donem' : 'Yil_Sonu'}_Raporu.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ÖNCEKİ FONKSİYONLAR (Yıllık Plan, Etkinlik Raporu vb.) ---
  const exportAnnualPlan = () => {
    // Yıllık plan verileri eksikse örnek veri kullan (hata almamak için)
    const currentPlans = plans[selectedGrade] || [];
    let tableRows = currentPlans.map(item => `<tr><td>${item.month}</td><td>${item.week}. Hafta</td><td>${item.kazanim}</td><td>${item.tur}</td></tr>`).join('');
    const content = `
      <div style="text-align:center; font-weight:bold; margin-bottom:20px;">
        <p>T.C.<br>${schoolDetails.city ? schoolDetails.city.toUpperCase() + ' KAYMAKAMLIĞI' : '................... KAYMAKAMLIĞI'}<br>${schoolDetails.schoolName ? schoolDetails.schoolName.toUpperCase() : '.........................'} MÜDÜRLÜĞÜ</p>
        <br><p>${schoolDetails.year} EĞİTİM ÖĞRETİM YILI<br>${selectedGrade}/${schoolDetails.classBranch} SINIFI REHBERLİK YILLIK PLANI</p>
      </div>
      <table border="1" style="border-collapse:collapse; width:100%;">
        <thead><tr style="background-color:#f0f0f0;"><th>Ay</th><th>Hafta</th><th>Kazanım / Etkinlik</th><th>Alan</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div style="margin-top:50px; display:flex; justify-content:space-between;">
        <div style="text-align:center;"><p>${schoolDetails.teacherName || '................................'}<br>Sınıf Rehber Öğretmeni</p></div>
        <div style="text-align:center;"><p>${schoolDetails.principalName || '................................'}<br>Okul Müdürü</p></div>
      </div>
    `;
    const blob = new Blob(['\ufeff', `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Yıllık Plan</title></head><body>${content}</body></html>`], { type: 'application/msword' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Yillik_Plan.doc";
    link.click();
  };

  const exportActivityReport = () => {
    const currentPlans = plans[selectedGrade] || [{ month: 'Eylül', week: '1', kazanim: 'Plan Yükleniyor...', tur: '' }];
    const currentActivity = currentPlans[selectedActivityIndex] || currentPlans[0];
    const content = `
      <div style="text-align:center; font-weight:bold; margin-bottom:20px;">HAFTALIK SINIF REHBERLİK ETKİNLİK RAPORU</div>
      <p><strong>Tarih:</strong> ..............................</p>
      <p><strong>Sınıf:</strong> ${selectedGrade}/${schoolDetails.classBranch}</p>
      <p><strong>Hafta:</strong> ${currentActivity.month} - ${currentActivity.week}. Hafta</p>
      <br>
      <table border="1" cellpadding="10" style="border-collapse:collapse; width:100%;">
        <tr><td width="30%" bgcolor="#f0f0f0"><strong>Kazanım / Etkinlik Adı</strong></td><td>${currentActivity.kazanim}</td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Katılan Öğrenci Sayısı</strong></td><td></td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Katılmayan Öğrenci Sayısı</strong></td><td></td></tr>
        <tr><td bgcolor="#f0f0f0"><strong>Değerlendirme</strong></td><td height="100">Etkinlik plana uygun olarak işlenmiş, öğrencilerin derse katılımı sağlanmıştır.</td></tr>
      </table>
      <br>
      <div style="text-align:center; margin-left:auto; width:200px;">
        <p>${schoolDetails.teacherName || '................................'}<br>Sınıf Rehber Öğretmeni</p>
      </div>
    `;
    const blob = new Blob(['\ufeff', `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Etkinlik Raporu</title></head><body>${content}</body></html>`], { type: 'application/msword' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Etkinlik_Raporu.doc";
    link.click();
  };

  // --- YENİ FORM RENDER FONKSİYONU ---
  const renderReportForm = (reportType) => {
    const isTerm = reportType === 'term';
    const data = isTerm ? termReportData : endYearReportData;
    const title = isTerm ? '1. Dönem Sonu Faaliyet Raporu' : 'Yıl Sonu Faaliyet Raporu';

    return (
      <Card className="p-8 bg-white shadow-md max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500">{isTerm ? 'Ocak ayı' : 'Haziran ayı'} teslim edilir.</p>
          </div>
          <Button onClick={() => exportReportToWord(reportType)} className="gap-2 bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4" /> Word İndir
          </Button>
        </div>

        {/* 1. KAZANIM DURUMU */}
        <section className="mb-8">
          <h3 className="font-bold text-gray-800 underline mb-4 text-sm uppercase">Sınıf Rehberlik Planında Yer Alan Kazanımlar</h3>
          <div className="flex flex-wrap items-center gap-6 mb-4 p-4 border rounded-lg bg-gray-50">
             <span className="text-sm font-medium">Tüm kazanımlar gerçekleştirilebildi mi?</span>
             <div className="flex gap-4">
               {['evet', 'kismen', 'hayir'].map((opt) => (
                 <label key={opt} className="flex items-center gap-2 cursor-pointer">
                   <input type="radio" name={`status-${reportType}`} checked={data.kazanimStatus === opt} onChange={() => updateReportField(reportType, 'kazanimStatus', opt)} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                   <span className="capitalize text-sm">{opt === 'kismen' ? 'Kısmen' : opt}</span>
                 </label>
               ))}
             </div>
          </div>
          {data.kazanimStatus !== 'evet' && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100"><tr><th className="p-2 border-r w-16 text-center">No</th><th className="p-2 text-left">Gerçekleştirilemeyen Kazanım ve Nedeni</th></tr></thead>
                <tbody>
                  {data.kazanimlar.map((k, index) => (
                    <tr key={k.id} className="border-t">
                      <td className="p-2 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="p-1"><Input value={k.text} onChange={(e) => {
                          const newK = [...data.kazanimlar]; newK[index].text = e.target.value; updateReportField(reportType, 'kazanimlar', newK);
                        }} className="border-0 focus-visible:ring-0 px-2 h-8" placeholder="..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 2. TABLOLAR (Envanter, Rehberlik, Veli) */}
        {['envanterler', 'rehberlik', 'veli'].map((tableName) => {
          const isVeli = tableName === 'veli';
          const headers = isVeli ? ['YAPILAN ÇALIŞMA', 'ANNE', 'BABA', 'DİĞER', 'TOPLAM'] : ['YAPILAN ÇALIŞMA', 'KIZ', 'ERKEK', 'TOPLAM'];
          const sectionTitle = tableName === 'envanterler' ? 'Uygulanan Envanterler' : tableName === 'rehberlik' ? 'Rehberlik Faaliyetleri' : 'Veli Faaliyetleri';

          return (
            <section key={tableName} className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-800 underline text-sm uppercase">{sectionTitle}</h3>
                <Button variant="outline" onClick={() => addRow(reportType, tableName)} className="h-7 text-xs gap-1 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"><Plus className="w-3 h-3" /> Ekle</Button>
              </div>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                      <th className="p-2 w-12 text-center border-r">SN</th>
                      <th className="p-2 border-r text-left">{headers[0]}</th>
                      <th className="p-2 w-20 text-center border-r">{headers[1]}</th>
                      <th className="p-2 w-20 text-center border-r">{headers[2]}</th>
                      {isVeli && <th className="p-2 w-20 text-center border-r">{headers[3]}</th>}
                      <th className="p-2 w-20 text-center bg-gray-200">{isVeli ? headers[4] : headers[3]}</th>
                      <th className="p-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data[tableName].map((row, index) => {
                      const total = (parseInt(row.col1)||0) + (parseInt(row.col2)||0) + (isVeli ? (parseInt(row.col3)||0) : 0);
                      return (
                        <tr key={row.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="p-2 text-center text-gray-500">{index + 1}</td>
                          <td className="p-1"><Input value={row.name} onChange={(e) => updateTableItem(reportType, tableName, row.id, 'name', e.target.value)} className="border-0 bg-transparent focus-visible:ring-0 h-8" placeholder="Çalışma adı..." /></td>
                          <td className="p-1"><Input type="number" min="0" value={row.col1} onChange={(e) => updateTableItem(reportType, tableName, row.id, 'col1', e.target.value)} className="text-center border-0 bg-transparent focus-visible:ring-0 h-8" /></td>
                          <td className="p-1"><Input type="number" min="0" value={row.col2} onChange={(e) => updateTableItem(reportType, tableName, row.id, 'col2', e.target.value)} className="text-center border-0 bg-transparent focus-visible:ring-0 h-8" /></td>
                          {isVeli && <td className="p-1"><Input type="number" min="0" value={row.col3} onChange={(e) => updateTableItem(reportType, tableName, row.id, 'col3', e.target.value)} className="text-center border-0 bg-transparent focus-visible:ring-0 h-8" /></td>}
                          <td className="p-2 text-center font-bold text-gray-700 bg-gray-50/50">{total}</td>
                          <td className="p-1 text-center"><button onClick={() => removeRow(reportType, tableName, row.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        {/* 3. GÜÇLÜKLER VE ÖNERİLER */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-bold"><FileText className="w-4 h-4"/> Karşılaşılan Güçlükler</Label>
            <Textarea value={data.guclukler} onChange={(e) => updateReportField(reportType, 'guclukler', e.target.value)} className="min-h-[100px] resize-none bg-yellow-50/30 border-yellow-200 focus-visible:ring-yellow-400" placeholder="Bu dönem karşılaşılan zorluklar..." />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700 font-bold"><FileText className="w-4 h-4"/> Çözüm Önerileri</Label>
            <Textarea value={data.oneriler} onChange={(e) => updateReportField(reportType, 'oneriler', e.target.value)} className="min-h-[100px] resize-none bg-green-50/30 border-green-200 focus-visible:ring-green-400" placeholder="Gelecek dönem için öneriler..." />
          </div>
        </section>
      </Card>
    );
  };

  const renderSettings = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-indigo-600"/>Genel Okul ve Öğretmen Bilgileri</h2>
            <button id="saveButton" onClick={saveSettingsToBrowser} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 shadow-sm transition-all font-bold">
                <Save size={18} /> Ayarları Kaydet
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><Label className="mb-1 block">Okul Adı</Label><Input type="text" placeholder="Örn: Atatürk Anadolu Lisesi" value={schoolDetails.schoolName} onChange={(e) => setSchoolDetails({...schoolDetails, schoolName: e.target.value})} /></div>
            <div><Label className="mb-1 block">İlçe / Şehir</Label><Input type="text" placeholder="Örn: Çankaya / ANKARA" value={schoolDetails.city} onChange={(e) => setSchoolDetails({...schoolDetails, city: e.target.value})} /></div>
            <div><Label className="mb-1 block">Eğitim Yılı</Label><Input type="text" value={schoolDetails.year} onChange={(e) => setSchoolDetails({...schoolDetails, year: e.target.value})} /><p className="text-xs text-gray-500 mt-1">Seneye burayı değiştirip kaydetmeniz yeterli.</p></div>
            <div><Label className="mb-1 block">Sınıf Şubesi</Label><Input type="text" placeholder="Örn: A, B, 11-F, AMP-12/A" value={schoolDetails.classBranch} onChange={(e) => setSchoolDetails({...schoolDetails, classBranch: e.target.value})} /></div>
            <div className="md:col-span-2 border-t pt-4 mt-2"><h3 className="font-bold text-gray-600 mb-4">İmza Bilgileri</h3></div>
            <div><Label className="mb-1 block">Sınıf Rehber Öğretmeni</Label><Input type="text" placeholder="Ad Soyad" value={schoolDetails.teacherName} onChange={(e) => setSchoolDetails({...schoolDetails, teacherName: e.target.value})} /></div>
            <div><Label className="mb-1 block">Okul Rehber Öğretmeni</Label><Input type="text" placeholder="Ad Soyad" value={schoolDetails.counselorName} onChange={(e) => setSchoolDetails({...schoolDetails, counselorName: e.target.value})} /></div>
            <div><Label className="mb-1 block">Okul Müdürü</Label><Input type="text" placeholder="Ad Soyad" value={schoolDetails.principalName} onChange={(e) => setSchoolDetails({...schoolDetails, principalName: e.target.value})} /></div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
      <div className="w-full md:w-64 bg-indigo-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen size={24} className="text-indigo-300" />Rehberlik Asistanı</h1>
          <p className="text-xs text-indigo-300 mt-1">{schoolDetails.year} Eğitim Yılı</p>
        </div>
        <div className="p-4">
            <label className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-2 block">Sınıf Seçimi</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
                {['9', '10', '11', '12'].map(grade => (
                    <button key={grade} onClick={() => { setSelectedGrade(grade); setSelectedActivityIndex(0); }} className={`p-2 rounded text-center font-bold transition-colors ${selectedGrade === grade ? 'bg-indigo-500 text-white shadow-lg' : 'bg-indigo-800 text-indigo-300 hover:bg-indigo-700'}`}>{grade}</button>
                ))}
            </div>
            <nav className="space-y-2">
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><Settings size={18} /> Ayarlar</button>
                <div className="border-t border-indigo-700 my-2"></div>
                <button onClick={() => setActiveTab('plan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'plan' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><Calendar size={18} /> Yıllık Plan</button>
                <button onClick={() => setActiveTab('activity')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'activity' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><FileText size={18} /> Etkinlik Raporu</button>
                <button onClick={() => setActiveTab('termReport')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'termReport' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><ClipboardCheck size={18} /> Dönem Sonu Raporu</button>
                <button onClick={() => setActiveTab('endyear')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'endyear' ? 'bg-white text-indigo-900 font-medium' : 'text-indigo-100 hover:bg-indigo-800'}`}><CheckCircle size={18} /> Yıl Sonu Raporu</button>
            </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {activeTab === 'plan' && 'Sınıf Yıllık Çerçeve Planı'}
                    {activeTab === 'activity' && 'Etkinlik Sonuç Raporu'}
                    {activeTab === 'termReport' && '1. Dönem Sonu Raporu'}
                    {activeTab === 'endyear' && 'Yıl Sonu Faaliyet Raporu'}
                    {activeTab === 'settings' && 'Ayarlar ve Bilgi Girişi'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{selectedGrade}/{schoolDetails.classBranch} Sınıfı • {schoolDetails.teacherName || 'Öğretmen Girilmedi'}</p>
            </div>
        </header>

        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'plan' && exportAnnualPlan && ( // Conditional render fix
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div><h3 className="text-xl text-indigo-600">{selectedGrade}. Sınıf Yıllık Planı</h3></div>
                    <Button onClick={exportAnnualPlan} className="gap-2 bg-blue-600 hover:bg-blue-700"><Download className="w-4 h-4" /> Word İndir</Button>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 z-10"><tr className="bg-indigo-50 border-b border-indigo-100 shadow-sm"><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Ay</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Hafta</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Kazanım / Etkinlik Adı</th><th className="p-3 font-semibold text-gray-700 bg-indigo-50">Alan</th></tr></thead>
                    <tbody>
                        {(plans[selectedGrade] || []).map((item, index) => (
                            <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${item.kazanim.includes('TATİL') ? 'bg-orange-50' : ''}`}>
                                <td className="p-3 text-gray-800">{item.month}</td>
                                <td className="p-3 text-gray-600">{item.week}. Hafta</td>
                                <td className="p-3 text-gray-800 font-medium">{item.kazanim}</td>
                                <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full border ${item.tur === 'Tatil' ? 'bg-orange-100 text-orange-700 border-orange-200' : item.tur === 'Risk Belirleme' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{item.tur}</span></td>
                            </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
             </div>
        )}
        {activeTab === 'activity' && (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-gray-800">Haftalık Etkinlik Raporu</h2>
                <Button onClick={exportActivityReport} className="gap-2 bg-blue-600 hover:bg-blue-700"><Download className="w-4 h-4" /> Word İndir</Button>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div><Label className="mb-1 block">Tarih</Label><Input type="date" /></div>
                    <div><Label className="mb-1 block">Hafta Seçimi</Label><select className="flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm" value={selectedActivityIndex} onChange={(e) => setSelectedActivityIndex(Number(e.target.value))}>{(plans[selectedGrade] || []).map((p, index) => (<option key={index} value={index}>{p.month} - {p.week}. Hafta - {p.kazanim.substring(0,50)}...</option>))}</select></div>
                </div>
                <div className="space-y-4">
                    <div className={`p-4 rounded border border-gray-200 ${(plans[selectedGrade] || [])[selectedActivityIndex]?.kazanim.includes('TATİL') ? 'bg-orange-50' : 'bg-gray-50'}`}><span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">Kazanım</span><p className="text-lg font-medium text-gray-900 mt-1">{(plans[selectedGrade] || [])[selectedActivityIndex]?.kazanim}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 border rounded"><Label className="block mb-2">Sınıfa Katılan</Label><Input type="number" placeholder="Örn: 24" /></div><div className="p-4 border rounded"><Label className="block mb-2">Katılmayan</Label><Input type="number" placeholder="Örn: 2" /></div></div>
                    <div><Label className="block mb-2">Değerlendirme</Label><Textarea defaultValue="Etkinlik plana uygun işlenmiştir." /></div>
                </div>
            </div>
        )}
        {activeTab === 'termReport' && renderReportUI('term')}
        {activeTab === 'endyear' && renderReportUI('year')}
      </div>
    </div>
  );
};

// Main Export for the Tab
export function AnnualPlanTab({ teacherProfile, currentClass }: { teacherProfile: TeacherProfile | null, currentClass: Class | null }) {
    return (
        <Tabs defaultValue="rehberlik-plani">
            <TabsList>
                <TabsTrigger value="ders-plani" disabled>Ders Yıllık Planı (Geliştirilecek)</TabsTrigger>
                <TabsTrigger value="rehberlik-plani">Rehberlik Yıllık Planı</TabsTrigger>
            </TabsList>
            <TabsContent value="ders-plani" className="mt-4">
                 <p>Ders yıllık planı modülü geliştirme aşamasındadır.</p>
            </TabsContent>
            <TabsContent value="rehberlik-plani" className="mt-4">
                <ClassGuidanceAssistant />
            </TabsContent>
        </Tabs>
    );
};